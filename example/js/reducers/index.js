'use strict';

var { combineReducers } = require('redux');

var initial = {
	email: undefined,
	token: undefined
};

module.exports = combineReducers({
	login: function(state = initial, action) {
		if (action.type == 'LOGIN') {
			return action.item;
		} else if (action.type == 'LOGOUT') {
			return {};
		}

		return state;
	},
	projects: function(state = [], action) {
		if (action.type === 'NEW_PROJECTS') {
			return action.items;
		}
		return state;
	},
	builds: function(state = [], action) {
		if (action.type === 'NEW_BUILDS') {
			return action.items;
		}
		return state;
	},
	sessions: function(state = [], action) {
		if (action.type === 'NEW_SESSIONS') {
			return action.items;
		}
		return state;
	},
	session: function(state = {}, action) {
		if (action.type === 'SET_SELECTED_SESSION') {
			return action.item;
		} else if (action.type === 'CLEAR_SELECTED_SESSION') {
			return {};
		}

		return state;
	}
});