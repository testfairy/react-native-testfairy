'use strict';

import React from 'react-native'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'

import reducers from './reducers'
import Main from './main'

const createStoreWithMW = applyMiddleware(thunk)(createStore)
const store = createStoreWithMW(reducers)

module.exports = React.createClass({
  render: function () {
    return (
      <Provider store={store}>
          <Main />
      </Provider>
    );
  }
});
