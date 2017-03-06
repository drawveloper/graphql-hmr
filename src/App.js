import React, { Component } from 'react';
import gql from 'graphql-tag';
import graphql from './react-apollo/lib/graphql';

class App extends Component {
  render() {
    const { data } = this.props
    return (
      <h1>Change src/App.render() to show anything else, save, look at logs. {data.foo}</h1>
    );
  }
}

if (!window.hasRendered) {
  window.firstApp = App
  window.hasRendered = true
}

window.App = App

const query = gql`
  query Query {
    foo
  }
`;

export default graphql(query)(App)