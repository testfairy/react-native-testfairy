'use strict';

var React = require('react-native');
var {
	View,
	Text,
	StyleSheet,
	ListView,
	RefreshControl
} = React;

import NavBar, { NavButton, NavButtonText, NavTitle } from 'react-native-nav'

module.exports = React.createClass({
	getInitialState: function() {
		return {
			refreshing: false,
			dataSource: new ListView.DataSource({
				rowHasChanged: (row1, row2) => row1 !== row2
			})
		}
	},

	componentDidMount: function() {
		this.onRefresh();
	},

	componentWillReceiveProps: function(props) {
		const {dataSource} = this.state;
		this.setState({
        	dataSource: dataSource.cloneWithRows(props.items)
      	});
	},

	render: function () {
		const {dataSource} = this.state;
		var navigation;
		if (this.props.hasBack) {
			navigation = (
				<NavBar style={styles} statusBar={{ barStyle: 'light-content' }}>
					<NavButton onPress={() => this.props.navigator.pop()}><NavButtonText>{"Back"}</NavButtonText></NavButton>
					<NavTitle style={styles.title}>{this.props.title}</NavTitle>
					<NavButton onPress={() => this.props.onLogout()}><NavButtonText>{'Logout'}</NavButtonText></NavButton>
				</NavBar>
			);
		} else {
			navigation = (
				<NavBar style={styles} statusBar={{ barStyle: 'light-content' }}>
					<NavButton><NavButtonText>{'      '}</NavButtonText></NavButton>
					<NavTitle style={styles.title}>{this.props.title}</NavTitle>
					<NavButton onPress={() => this.props.onLogout()}><NavButtonText>{'Logout'}</NavButtonText></NavButton>
				</NavBar>
			);
		}
		
		if (dataSource.getRowCount() == 0 && this.state.refreshing == false) {
			return (
				<View style={styles.container}>
					{navigation}
					<View style={styles.emptyView}>
						<Text>No {this.props.title} found!</Text>
					</View>
				</View>
			);
		}

		return (
			<View style={styles.container}>
				{navigation}
				<ListView
					dataSource={dataSource}
					renderRow={this.renderRow}
					style={styles.listView}>
					<RefreshControl
						refreshing={this.state.refreshing}
						onRefresh={this.onRefresh}/>
				</ListView>
			</View>			
		);
	},

	renderRow: function(item) {
		return this.props.renderRow(item, this.props);
	},

	onRefresh: function() {
		const {fetch} = this.props;
		this.setState({refreshing: true});
		fetch(this.props)
			.then(() => {
				this.setState({refreshing: false});
			});
	}
});

var styles = StyleSheet.create({
	emptyView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
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