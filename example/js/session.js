'use strict';

var React = require('react-native');
var {
	View,
	Text,
	StyleSheet,
	ScrollView
} = React;

import NavBar, { NavButton, NavButtonText, NavTitle } from 'react-native-nav'

module.exports = React.createClass({
	getInitialState: function() {
		return {
			session: this.props.session
		};
	},
	componentWillReceiveProps: function(props) {
		var session = Object.assign({}, this.state.session, props.session);
		this.setState({
			session: session
		});
	},
	componentDidMount: function() {
		this.onRefresh();
	},
	onRefresh: function() {
		const {fetch} = this.props;
		fetch(this.props);
	},
	render: function () {
		return (
			<View style={styles.container}>
				<NavBar style={styles} statusBar={{ barStyle: 'light-content' }}>
					<NavButton onPress={() => this.props.navigator.pop()}><NavButtonText>{"Back"}</NavButtonText></NavButton>
					<NavTitle style={styles.title}>{this.props.project.name} (#{this.props.session.id})</NavTitle>
					<NavButton onPress={() => this.props.onLogout()}><NavButtonText>{'Logout'}</NavButtonText></NavButton>
				</NavBar>
				<ScrollView style={styles.container}>
					<View>
						{this.sessionItem('Package: ', this.props.project.packageName)}
						{this.sessionItem('Version: ', this.props.build.version)}
						{this.sessionItem('Tester: ', this.props.session.testerEmail)}
						{this.sessionItem('Duration: ', this.props.session.duration)}
						{this.sessionItem('Device: ', this.props.session.device)}
					</View>
				</ScrollView>
			</View>
		);
	},
	sessionItem: function(key, value) {
		return <View style={{flexDirection: 'row'}}>
			<Text style={styles.key}>{key}</Text><Text style={styles.value}>{value}</Text>
		</View>
	}
});

var styles = StyleSheet.create({
	container: {
		flex: 1
	},
	statusBar: {
		backgroundColor: '#000',
	},
	navBar: {
		backgroundColor: '#212121',
	},
	title: {
		color: '#fff'
	},
	key: {
		color: '#CCC',
		fontSize: 20
	},
	value: {
		fontSize: 20
	}
});