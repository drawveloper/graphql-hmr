import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ApolloClient from 'apollo-client';
import { ApolloProvider } from 'react-apollo';

class MockNetworkInterface {
  query (request) {
    return Promise.resolve({data: {foo: 'bar'}, errors: []})
  }
}
const networkInterface = new MockNetworkInterface()
const client = new ApolloClient({networkInterface})

ReactDOM.render(<ApolloProvider client={client} ><App /></ApolloProvider>, document.getElementById('root'));