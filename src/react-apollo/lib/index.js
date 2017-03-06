"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./browser"));
var server_1 = require("./server");
exports.getDataFromTree = server_1.getDataFromTree;
exports.renderToStringWithData = server_1.renderToStringWithData;
var apollo_client_1 = require("apollo-client");
exports.ApolloClient = apollo_client_1.default;
exports.createNetworkInterface = apollo_client_1.createNetworkInterface;
var graphql_tag_1 = require("graphql-tag");
exports.gql = graphql_tag_1.default;
//# sourceMappingURL=index.js.map