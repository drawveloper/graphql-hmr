# GraphQL React Hot Module Replacement quirk reproduction

This is a utility repo to show off the quirk fixed in https://github.com/apollographql/react-apollo/pull/505

### Setup

Simply install deps and run.

```
$ yarn
$ yarn start
```

Navigate to http://localhost:3000.

Now open `src/App.js`, edit the rendered string to anything else and save.

You'll see that the console emits something like this:

```
graphql.js:84graphql
graphql.js:106wrapWithApolloComponent
graphql.js:107wrapWithApolloComponent, WrappedComponent === window.App true
graphql.js:113 GraphQL constructor Object {} Object {store: Object, client: ApolloClient}
graphql.js:353 GraphQL render
graphql.js:353 GraphQL render
graphql.js:366 GraphQL render, renderedElement.type === WrappedComponent true
graphql.js:367 GraphQL render, renderedElement.type === window.App true
graphql.js:368 GraphQL render, renderedElement.type === window.firstApp true
client.js:67 [HMR] connected
client.js:199 [HMR] bundle rebuilding
client.js:207 [HMR] bundle rebuilt in 150ms
process-update.js:27 [HMR] Checking for updates on the server...
graphql.js:84 graphql
graphql.js:106 wrapWithApolloComponent
graphql.js:107 wrapWithApolloComponent, WrappedComponent === window.App false
process-update.js:100 [HMR] Updated modules:
process-update.js:102 [HMR]  - ./src/App.js
process-update.js:107 [HMR] App is up to date.
graphql.js:353 GraphQL render
graphql.js:366 GraphQL render, renderedElement.type === WrappedComponent false
graphql.js:367 GraphQL render, renderedElement.type === window.App false
graphql.js:368 GraphQL render, renderedElement.type === window.firstApp true
```

This demonstrates that even though `wrapWithApolloComponent` is called, a new instance of `GraphQL` is **not** constructed during React's tree reconciliation, and therefore the old `renderedElement` is (incorrectly) reused.