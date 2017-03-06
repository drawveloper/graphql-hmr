"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var apollo_client_1 = require("apollo-client");
var bundledPrinter_1 = require("graphql-tag/bundledPrinter");
var ApolloProvider_1 = require("./ApolloProvider");
var MockedProvider = (function (_super) {
    __extends(MockedProvider, _super);
    function MockedProvider(props, context) {
        var _this = _super.call(this, props, context) || this;
        var networkInterface = mockNetworkInterface.apply(null, _this.props.mocks);
        _this.client = new apollo_client_1.default({ networkInterface: networkInterface });
        return _this;
    }
    MockedProvider.prototype.render = function () {
        return (React.createElement(ApolloProvider_1.default, { client: this.client }, this.props.children));
    };
    return MockedProvider;
}(React.Component));
exports.MockedProvider = MockedProvider;
var MockedSubscriptionProvider = (function (_super) {
    __extends(MockedSubscriptionProvider, _super);
    function MockedSubscriptionProvider(props, context) {
        var _this = _super.call(this, props, context) || this;
        var networkInterface = mockSubscriptionNetworkInterface.apply(void 0, [_this.props.subscriptions].concat(_this.props.responses));
        _this.client = new apollo_client_1.default({ networkInterface: networkInterface });
        return _this;
    }
    MockedSubscriptionProvider.prototype.render = function () {
        return (React.createElement(ApolloProvider_1.default, { client: this.client }, this.props.children));
    };
    return MockedSubscriptionProvider;
}(React.Component));
exports.MockedSubscriptionProvider = MockedSubscriptionProvider;
function mockNetworkInterface() {
    var mockedResponses = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        mockedResponses[_i] = arguments[_i];
    }
    return new (MockNetworkInterface.bind.apply(MockNetworkInterface, [void 0].concat(mockedResponses)))();
}
exports.mockNetworkInterface = mockNetworkInterface;
function mockSubscriptionNetworkInterface(mockedSubscriptions) {
    var mockedResponses = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        mockedResponses[_i - 1] = arguments[_i];
    }
    return new (MockSubscriptionNetworkInterface.bind.apply(MockSubscriptionNetworkInterface, [void 0, mockedSubscriptions].concat(mockedResponses)))();
}
exports.mockSubscriptionNetworkInterface = mockSubscriptionNetworkInterface;
var MockNetworkInterface = (function () {
    function MockNetworkInterface() {
        var mockedResponses = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            mockedResponses[_i] = arguments[_i];
        }
        var _this = this;
        this.mockedResponsesByKey = {};
        mockedResponses.forEach(function (mockedResponse) {
            if (!mockedResponse.result && !mockedResponse.error) {
                throw new Error('Mocked response should contain either result or error.');
            }
            _this.addMockedReponse(mockedResponse);
        });
    }
    MockNetworkInterface.prototype.addMockedReponse = function (mockedResponse) {
        var key = requestToKey(mockedResponse.request);
        var mockedResponses = this.mockedResponsesByKey[key];
        if (!mockedResponses) {
            mockedResponses = [];
            this.mockedResponsesByKey[key] = mockedResponses;
        }
        mockedResponses.push(mockedResponse);
    };
    MockNetworkInterface.prototype.query = function (request) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var parsedRequest = {
                query: request.query,
                variables: request.variables,
                debugName: request.debugName,
            };
            var key = requestToKey(parsedRequest);
            if (!_this.mockedResponsesByKey[key] || _this.mockedResponsesByKey[key].length === 0) {
                throw new Error('No more mocked responses for the query: ' + bundledPrinter_1.print(request.query));
            }
            var original = _this.mockedResponsesByKey[key].slice();
            var _a = _this.mockedResponsesByKey[key].shift() || {}, result = _a.result, error = _a.error, delay = _a.delay, newData = _a.newData;
            if (newData) {
                original[0].result = newData();
                _this.mockedResponsesByKey[key].push(original[0]);
            }
            if (!result && !error) {
                throw new Error("Mocked response should contain either result or error: " + key);
            }
            setTimeout(function () {
                if (error)
                    return reject(error);
                return resolve(result);
            }, delay ? delay : 1);
        });
    };
    return MockNetworkInterface;
}());
exports.MockNetworkInterface = MockNetworkInterface;
var MockSubscriptionNetworkInterface = (function (_super) {
    __extends(MockSubscriptionNetworkInterface, _super);
    function MockSubscriptionNetworkInterface(mockedSubscriptions) {
        var mockedResponses = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            mockedResponses[_i - 1] = arguments[_i];
        }
        var _this = _super.apply(this, mockedResponses) || this;
        _this.mockedSubscriptionsByKey = {};
        _this.mockedSubscriptionsById = {};
        _this.handlersById = {};
        _this.subId = 0;
        mockedSubscriptions.forEach(function (sub) {
            _this.addMockedSubscription(sub);
        });
        return _this;
    }
    MockSubscriptionNetworkInterface.prototype.generateSubscriptionId = function () {
        var requestId = this.subId;
        this.subId++;
        return requestId;
    };
    MockSubscriptionNetworkInterface.prototype.addMockedSubscription = function (mockedSubscription) {
        var key = requestToKey(mockedSubscription.request);
        if (mockedSubscription.id === undefined) {
            mockedSubscription.id = this.generateSubscriptionId();
        }
        var mockedSubs = this.mockedSubscriptionsByKey[key];
        if (!mockedSubs) {
            mockedSubs = [];
            this.mockedSubscriptionsByKey[key] = mockedSubs;
        }
        mockedSubs.push(mockedSubscription);
    };
    MockSubscriptionNetworkInterface.prototype.subscribe = function (request, handler) {
        var parsedRequest = {
            query: request.query,
            variables: request.variables,
            debugName: request.debugName,
        };
        var key = requestToKey(parsedRequest);
        if (this.mockedSubscriptionsByKey.hasOwnProperty(key)) {
            var subscription = this.mockedSubscriptionsByKey[key].shift();
            this.handlersById[subscription.id] = handler;
            this.mockedSubscriptionsById[subscription.id] = subscription;
            return subscription.id;
        }
        else {
            throw new Error('Network interface does not have subscription associated with this request.');
        }
    };
    ;
    MockSubscriptionNetworkInterface.prototype.fireResult = function (id) {
        var handler = this.handlersById[id];
        if (this.mockedSubscriptionsById.hasOwnProperty(id.toString())) {
            var subscription = this.mockedSubscriptionsById[id];
            if (subscription.results.length === 0) {
                throw new Error("No more mocked subscription responses for the query: " +
                    (bundledPrinter_1.print(subscription.request.query) + ", variables: " + JSON.stringify(subscription.request.variables)));
            }
            var response_1 = subscription.results.shift();
            setTimeout(function () {
                handler(response_1.error, response_1.result);
            }, response_1.delay ? response_1.delay : 0);
        }
        else {
            throw new Error('Network interface does not have subscription associated with this id.');
        }
    };
    MockSubscriptionNetworkInterface.prototype.unsubscribe = function (id) {
        delete this.mockedSubscriptionsById[id];
    };
    return MockSubscriptionNetworkInterface;
}(MockNetworkInterface));
exports.MockSubscriptionNetworkInterface = MockSubscriptionNetworkInterface;
function requestToKey(request) {
    var queryString = request.query && bundledPrinter_1.print(request.query);
    return JSON.stringify({
        variables: request.variables || {},
        debugName: request.debugName,
        query: queryString,
    });
}
//# sourceMappingURL=test-utils.js.map