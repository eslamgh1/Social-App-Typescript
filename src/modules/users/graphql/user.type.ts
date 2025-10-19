import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";


// export  const genderEnum = new GraphQLEnumType({
//     name: "Gender",
//     description: "Gender Enum",
//     values: {
//         MALE: { value: "male" },
//         FEMALE: { value: "female" },
//     },
// })


export  const userType = new GraphQLObjectType({
    name: "User",
    description: "User Type",
    fields: () => ({
        id: { type: new GraphQLNonNull(GraphQLID) },
        fname: { type: new GraphQLNonNull(GraphQLString) },
        lname: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        gender: { type: new GraphQLNonNull(GraphQLString) },
    })
})
