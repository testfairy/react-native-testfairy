'use strict';

var React = require('react-native');
var {
	View,
	Text,
	StyleSheet,
	ListView
} = React;

import NavBar, { NavButton, NavButtonText, NavTitle } from 'react-native-nav'

module.exports = React.createClass({
	getInitialState: function() {
		return {
			dataSource: new ListView.DataSource({
				rowHasChanged: (row1, row2) => row1 !== row2
			})
		}
	},

	componentDidMount: function() {
		const {login, fetchProjects} = this.props;
		fetchProjects(login);
	},

	componentWillReceiveProps: function(props) {
		const {dataSource} = this.state;
		this.setState({
        	dataSource: dataSource.cloneWithRows(props.projects)
      	});
	},

	render: function () {
		const {dataSource} = this.state;
		return (
			<View style={styles.container}>
				<NavBar style={styles} statusBar={{ barStyle: 'light-content' }}>
					<NavTitle style={styles.title}>TestFairy</NavTitle>
				</NavBar>
				<ListView
					dataSource={dataSource}
					renderRow={this.renderRow}
					style={styles.listView}
				/>
			</View>			
		);
	},

	renderRow: function(project) {
		return (
			<Text>{project.name}</Text>
		);
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
		color: '#fff',
		flex: 1
	},
	listView: {

	}
});