import { findFilesRecursive, VirtualRoute } from "@plumier/core"
import { pathToRegexp } from "path-to-regexp"
import {
    ActionResult,
    CustomMiddleware,
    CustomMiddlewareFunction,
    DefaultFacility,
    HttpMethod,
    Invocation,
    PlumierApplication,
    response,
} from "plumier"
import {join} from "path"

export interface ApiMock {
    [key: string]: (object | CustomMiddlewareFunction)
}

interface MockNode {
    method: HttpMethod,
    path: string,
    response: (object | CustomMiddlewareFunction)
}

export class MockFacility extends DefaultFacility {
    constructor(private opt: { mocks: string }) { super() }

    async generateRoutes(app: Readonly<PlumierApplication>): Promise<VirtualRoute[]> {
        // loop through path/file/glob
        const files = await findFilesRecursive(join(app.config.rootDir, this.opt.mocks))
        // require all files, and get "default" export
        const apiMocks = files.map(x => require(x).default as ApiMock)
        // create Nodes required by middleware
        const mocks: MockNode[] = []
        for (const apiMock of apiMocks) {
            for (const key in apiMock) {
                const element = apiMock[key];
                const [method, path] = key.trim().split(/\s+/) as [string?, string?]
                if (!method || !path) throw new Error(`Invalid method/path provided ${key}`)
                mocks.push({ method: method.toLowerCase() as HttpMethod, path, response: element })
            }
        }
        // register middleware
        app.use(new MockMiddleware(mocks))
        // report about generate routes
        // this just a report for analysis and swagger, not related to routing.
        // routing process exists on MockMiddleware
        return mocks.map(x => ({
            kind: "VirtualRoute",
            url: x.path,
            method: x.method,
            provider: MockFacility,
        }))
    }
}

export class MockMiddleware implements CustomMiddleware {
    constructor(private mocks: MockNode[]) { }

    async execute(inv: Readonly<Invocation>): Promise<ActionResult> {
        for (const mock of this.mocks) {
            // check if its correct HTTP Method
            if (inv.ctx.method.toLowerCase() !== mock.method) continue
            // check if its path match the regex
            const match = pathToRegexp(mock.path).exec(inv.ctx.url)
            if (!match) continue
            // check if the response is object then return immediately
            if (typeof mock.response === "object")
                return response.json(mock.response)
            // else execute provided middleware
            return mock.response(inv)
        }
        // if all paths provided in mock doesn't match continue other middleware
        return inv.proceed()
    }
}