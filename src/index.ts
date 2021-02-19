import Plumier, { WebApiFacility } from "plumier";
import dotenv from "dotenv"
import { MockFacility } from "./mock-facility";

dotenv.config()

new Plumier()
    .set(new WebApiFacility())
    .set(new MockFacility({ mocks: "./mocks/**/*.+(ts|js)" }))
    .listen(process.env.PORT ?? 8000)