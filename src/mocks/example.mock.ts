import { response } from "plumier"
import { ApiMock } from "../mock-facility"

const mocks: ApiMock = {

    // return single
    "GET /users/123": {
        id: 123,
        name: "This is user 123",
        email: "john.doe@gmail.com"
    },

    "GET /users/:id": ({ctx}) => {
        return response.json({
            id: ctx.path,
            name: "John Doe"
        })
    },


    // return array
    "GET /users": [
        {
            name: "John Doe",
            email: "john.doe@gmail.com"
        }, {
            name: "John Doe",
            email: "john.doe@gmail.com"
        }
    ],
}

// export default see mock-facility.ts line: 31
export default mocks