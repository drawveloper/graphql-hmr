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
var react_1 = require("react");
var pick = require("lodash.pick");
var shallowEqual_1 = require("./shallowEqual");
var invariant = require("invariant");
var assign = require("object-assign");
var hoistNonReactStatics = require("hoist-non-react-statics");
var parser_1 = require("./parser");
var defaultMapPropsToOptions = function (props) { return ({}); };
var defaultMapResultToProps = function (props) { return props; };
var defaultMapPropsToSkip = function (props) { return false; };
function observableQueryFields(observable) {
    var fields = pick(observable, 'variables', 'refetch', 'fetchMore', 'updateQuery', 'startPolling', 'stopPolling', 'subscribeToMore');
    Object.keys(fields).forEach(function (key) {
        if (typeof fields[key] === 'function') {
            fields[key] = fields[key].bind(observable);
        }
    });
    return fields;
}
function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
var nextVersion = 0;
function withApollo(WrappedComponent, operationOptions) {
    if (operationOptions === void 0) { operationOptions = {}; }
    var withDisplayName = "withApollo(" + getDisplayName(WrappedComponent) + ")";
    var WithApollo = (function (_super) {
        __extends(WithApollo, _super);
        function WithApollo(props, context) {
            var _this = _super.call(this, props, context) || this;
            _this.client = context.client;
            invariant(!!_this.client, "Could not find \"client\" in the context of " +
                ("\"" + withDisplayName + "\". ") +
                "Wrap the root component in an <ApolloProvider>");
            return _this;
        }
        WithApollo.prototype.getWrappedInstance = function () {
            invariant(operationOptions.withRef, "To access the wrapped instance, you need to specify " +
                "{ withRef: true } in the options");
            return this.refs.wrappedInstance;
        };
        WithApollo.prototype.render = function () {
            var props = assign({}, this.props);
            props.client = this.client;
            if (operationOptions.withRef)
                props.ref = 'wrappedInstance';
            return react_1.createElement(WrappedComponent, props);
        };
        return WithApollo;
    }(react_1.Component));
    WithApollo.displayName = withDisplayName;
    WithApollo.WrappedComponent = WrappedComponent;
    WithApollo.contextTypes = { client: react_1.PropTypes.object.isRequired };
    return hoistNonReactStatics(WithApollo, WrappedComponent, {});
}
exports.withApollo = withApollo;
;
function graphql(document, operationOptions) {
    console.log('graphql')
    if (operationOptions === void 0) { operationOptions = {}; }
    var _a = operationOptions.options, options = _a === void 0 ? defaultMapPropsToOptions : _a, _b = operationOptions.skip, skip = _b === void 0 ? defaultMapPropsToSkip : _b, _c = operationOptions.alias, alias = _c === void 0 ? 'Apollo' : _c;
    var mapPropsToOptions = options;
    if (typeof mapPropsToOptions !== 'function')
        mapPropsToOptions = function () { return options; };
    var mapPropsToSkip = skip;
    if (typeof mapPropsToSkip !== 'function')
        mapPropsToSkip = (function () { return skip; });
    var mapResultToProps = operationOptions.props;
    var operation = parser_1.parser(document);
    var version = nextVersion++;
    var wrapWithApolloComponent = function (WrappedComponent) {
        console.log('wrapWithApolloComponent')
        console.log('wrapWithApolloComponent, WrappedComponent === window.App', WrappedComponent === window.firstApp)
        var graphQLDisplayName = alias + "(" + getDisplayName(WrappedComponent) + ")";
        var recycler = new ObservableQueryRecycler();
        var GraphQL = (function (_super) {
            __extends(GraphQL, _super);
            function GraphQL(props, context) {
                console.log('GraphQL constructor', props, context)
                var _this = _super.call(this, props, context) || this;
                _this.previousData = {};
                _this.version = version;
                _this.client = context.client;
                invariant(!!_this.client, "Could not find \"client\" in the context of " +
                    ("\"" + graphQLDisplayName + "\". ") +
                    "Wrap the root component in an <ApolloProvider>");
                _this.store = _this.client.store;
                _this.type = operation.type;
                if (_this.shouldSkip(props))
                    return _this;
                _this.setInitialProps();
                return _this;
            }
            GraphQL.prototype.componentDidMount = function () {
                this.hasMounted = true;
                if (this.type === parser_1.DocumentType.Mutation)
                    return;
                if (!this.shouldSkip(this.props)) {
                    this.subscribeToQuery();
                }
            };
            GraphQL.prototype.componentWillReceiveProps = function (nextProps) {
                if (shallowEqual_1.default(this.props, nextProps))
                    return;
                this.shouldRerender = true;
                if (this.type === parser_1.DocumentType.Mutation) {
                    return;
                }
                ;
                if (this.type === parser_1.DocumentType.Subscription
                    && operationOptions.shouldResubscribe
                    && operationOptions.shouldResubscribe(this.props, nextProps)) {
                    this.unsubscribeFromQuery();
                    delete this.queryObservable;
                    this.updateQuery(nextProps);
                    this.subscribeToQuery();
                    return;
                }
                if (this.shouldSkip(nextProps)) {
                    if (!this.shouldSkip(this.props)) {
                        this.unsubscribeFromQuery();
                    }
                    return;
                }
                this.updateQuery(nextProps);
                this.subscribeToQuery();
            };
            GraphQL.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
                return !!nextContext || this.shouldRerender;
            };
            GraphQL.prototype.componentWillUnmount = function () {
                if (this.type === parser_1.DocumentType.Query) {
                    if (this.queryObservable) {
                        recycler.recycle(this.queryObservable);
                        delete this.queryObservable;
                    }
                    this.unsubscribeFromQuery();
                }
                if (this.type === parser_1.DocumentType.Subscription)
                    this.unsubscribeFromQuery();
                this.hasMounted = false;
            };
            GraphQL.prototype.calculateOptions = function (props, newOpts) {
                if (props === void 0) { props = this.props; }
                var opts = mapPropsToOptions(props);
                if (newOpts && newOpts.variables) {
                    newOpts.variables = assign({}, opts.variables, newOpts.variables);
                }
                if (newOpts)
                    opts = assign({}, opts, newOpts);
                if (opts.variables || !operation.variables.length)
                    return opts;
                var variables = {};
                for (var _i = 0, _a = operation.variables; _i < _a.length; _i++) {
                    var _b = _a[_i], variable = _b.variable, type = _b.type;
                    if (!variable.name || !variable.name.value)
                        continue;
                    if (typeof props[variable.name.value] !== 'undefined') {
                        variables[variable.name.value] = props[variable.name.value];
                        continue;
                    }
                    if (type.kind !== 'NonNullType') {
                        variables[variable.name.value] = null;
                        continue;
                    }
                    invariant(typeof props[variable.name.value] !== 'undefined', "The operation '" + operation.name + "' wrapping '" + getDisplayName(WrappedComponent) + "' " +
                        ("is expecting a variable: '" + variable.name.value + "' but it was not found in the props ") +
                        ("passed to '" + graphQLDisplayName + "'"));
                }
                opts.variables = variables;
                return opts;
            };
            ;
            GraphQL.prototype.calculateResultProps = function (result) {
                var name = this.type === parser_1.DocumentType.Mutation ? 'mutate' : 'data';
                if (operationOptions.name)
                    name = operationOptions.name;
                var newResult = (_a = {}, _a[name] = result, _a.ownProps = this.props, _a);
                if (mapResultToProps)
                    return mapResultToProps(newResult);
                return _b = {}, _b[name] = defaultMapResultToProps(result), _b;
                var _a, _b;
            };
            GraphQL.prototype.setInitialProps = function () {
                if (this.type === parser_1.DocumentType.Mutation) {
                    return;
                }
                var opts = this.calculateOptions(this.props);
                this.createQuery(opts);
            };
            GraphQL.prototype.createQuery = function (opts) {
                if (this.type === parser_1.DocumentType.Subscription) {
                    this.queryObservable = this.client.subscribe(assign({
                        query: document,
                    }, opts));
                }
                else {
                    var queryObservable = recycler.reuse(opts);
                    if (queryObservable === null) {
                        this.queryObservable = this.client.watchQuery(assign({
                            query: document,
                            metadata: {
                                reactComponent: {
                                    displayName: graphQLDisplayName,
                                },
                            },
                        }, opts));
                    }
                    else {
                        this.queryObservable = queryObservable;
                    }
                }
            };
            GraphQL.prototype.updateQuery = function (props) {
                var opts = this.calculateOptions(props);
                if (!this.queryObservable) {
                    this.createQuery(opts);
                }
                if (this.queryObservable._setOptionsNoResult) {
                    this.queryObservable._setOptionsNoResult(opts);
                }
                else {
                    if (this.queryObservable.setOptions) {
                        this.queryObservable.setOptions(opts)
                            .catch(function (error) { return null; });
                    }
                }
            };
            GraphQL.prototype.fetchData = function () {
                if (this.shouldSkip())
                    return false;
                if (operation.type === parser_1.DocumentType.Mutation || operation.type === parser_1.DocumentType.Subscription)
                    return false;
                var opts = this.calculateOptions();
                if (opts.ssr === false)
                    return false;
                if (opts.forceFetch)
                    delete opts.forceFetch;
                var observable = this.client.watchQuery(assign({ query: document }, opts));
                var result = observable.currentResult();
                if (result.loading) {
                    return observable.result();
                }
                else {
                    return false;
                }
            };
            GraphQL.prototype.subscribeToQuery = function () {
                var _this = this;
                if (this.querySubscription) {
                    return;
                }
                var next = function (results) {
                    if (_this.type === parser_1.DocumentType.Subscription) {
                        _this.lastSubscriptionData = results;
                        results = { data: results };
                    }
                    var clashingKeys = Object.keys(observableQueryFields(results.data));
                    invariant(clashingKeys.length === 0, "the result of the '" + graphQLDisplayName + "' operation contains keys that " +
                        "conflict with the return object." +
                        clashingKeys.map(function (k) { return "'" + k + "'"; }).join(', ') + " not allowed.");
                    _this.forceRenderChildren();
                };
                var handleError = function (error) {
                    if (error.hasOwnProperty('graphQLErrors'))
                        return next({ error: error });
                    throw error;
                };
                this.querySubscription = this.queryObservable.subscribe({ next: next, error: handleError });
            };
            GraphQL.prototype.unsubscribeFromQuery = function () {
                if (this.querySubscription) {
                    this.querySubscription.unsubscribe();
                    delete this.querySubscription;
                }
            };
            GraphQL.prototype.shouldSkip = function (props) {
                if (props === void 0) { props = this.props; }
                return mapPropsToSkip(props) ||
                    mapPropsToOptions(props).skip;
            };
            GraphQL.prototype.forceRenderChildren = function () {
                this.shouldRerender = true;
                if (this.hasMounted)
                    this.setState({});
            };
            GraphQL.prototype.getWrappedInstance = function () {
                invariant(operationOptions.withRef, "To access the wrapped instance, you need to specify " +
                    "{ withRef: true } in the options");
                return this.refs.wrappedInstance;
            };
            GraphQL.prototype.dataForChild = function () {
                var _this = this;
                if (this.type === parser_1.DocumentType.Mutation) {
                    return function (mutationOpts) {
                        var opts = _this.calculateOptions(_this.props, mutationOpts);
                        if (typeof opts.variables === 'undefined')
                            delete opts.variables;
                        opts.mutation = document;
                        return _this.client.mutate(opts);
                    };
                }
                var opts = this.calculateOptions(this.props);
                var data = {};
                assign(data, observableQueryFields(this.queryObservable));
                if (this.type === parser_1.DocumentType.Subscription) {
                    assign(data, {
                        loading: !this.lastSubscriptionData,
                        variables: opts.variables,
                    }, this.lastSubscriptionData);
                }
                else {
                    var currentResult = this.queryObservable.currentResult();
                    var loading = currentResult.loading, error_1 = currentResult.error, networkStatus = currentResult.networkStatus;
                    assign(data, { loading: loading, networkStatus: networkStatus });
                    var logErrorTimeoutId_1 = setTimeout(function () {
                        if (error_1) {
                            console.error('Uncaught (in react-apollo)', error_1.stack || error_1);
                        }
                    }, 10);
                    Object.defineProperty(data, 'error', {
                        configurable: true,
                        enumerable: true,
                        get: function () {
                            clearTimeout(logErrorTimeoutId_1);
                            return error_1;
                        },
                    });
                    if (loading) {
                        assign(data, this.previousData, currentResult.data);
                    }
                    else {
                        assign(data, currentResult.data);
                        this.previousData = currentResult.data;
                    }
                }
                return data;
            };
            GraphQL.prototype.render = function () {
                console.log('GraphQL render')
                if (this.shouldSkip()) {
                    return react_1.createElement(WrappedComponent, this.props);
                }
                var _a = this, shouldRerender = _a.shouldRerender, renderedElement = _a.renderedElement, props = _a.props;
                this.shouldRerender = false;
                var data = this.dataForChild();
                var clientProps = this.calculateResultProps(data);
                var mergedPropsAndData = assign({}, props, clientProps);
                if (renderedElement) {
                    console.log('GraphQL render, renderedElement.type === WrappedComponent', renderedElement.type === WrappedComponent)
                    console.log('GraphQL render, renderedElement.type === window.App', renderedElement.type === window.App)
                    console.log('GraphQL render, renderedElement.type === window.firstApp', renderedElement.type === window.firstApp)
                }
                if (!shouldRerender && renderedElement) {
//                if (!shouldRerender && renderedElement && renderedElement.type === WrappedComponent) {
                    return renderedElement;
                }
                if (operationOptions.withRef)
                    mergedPropsAndData.ref = 'wrappedInstance';
                this.renderedElement = react_1.createElement(WrappedComponent, mergedPropsAndData);
                return this.renderedElement;
            };
            return GraphQL;
        }(react_1.Component));
        GraphQL.displayName = graphQLDisplayName;
        GraphQL.WrappedComponent = WrappedComponent;
        GraphQL.contextTypes = {
            store: react_1.PropTypes.object.isRequired,
            client: react_1.PropTypes.object.isRequired,
        };
        return hoistNonReactStatics(GraphQL, WrappedComponent, {});
    };
    return wrapWithApolloComponent;
}
exports.default = graphql;
;
var ObservableQueryRecycler = (function () {
    function ObservableQueryRecycler() {
        this.observableQueries = [];
    }
    ObservableQueryRecycler.prototype.recycle = function (observableQuery) {
        observableQuery.stopPolling();
        this.observableQueries.push({
            observableQuery: observableQuery,
            subscription: observableQuery.subscribe({}),
        });
    };
    ObservableQueryRecycler.prototype.reuse = function (options) {
        if (this.observableQueries.length <= 0) {
            return null;
        }
        var _a = this.observableQueries.pop(), observableQuery = _a.observableQuery, subscription = _a.subscription;
        subscription.unsubscribe();
        observableQuery.setOptions(options);
        return observableQuery;
    };
    return ObservableQueryRecycler;
}());
//# sourceMappingURL=graphql.js.map