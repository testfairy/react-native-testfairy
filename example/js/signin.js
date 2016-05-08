'use strict';

var React = require('react-native');
var {
	View,
	Text,
	StatusBar,
	StyleSheet,
	TextInput,
	TouchableHighlight
} = React;

const TestFairyBridge = require('react-native-testfairy');

module.exports = React.createClass({
	getInitialState: function() {
		return {
			email: this.props.login.email,
			token: this.props.login.token
		};
	},

	componentDidMount: function() {
		TestFairyBridge.hideView(this.refs.emailInput);
		TestFairyBridge.hideView(this.refs.apiTokenInput);
	},

	render: function () {
		return (
			<View style={styles.container}>
				<StatusBar
					translucent={true}
					/>
				<View style={styles.top}>
					<Text style={styles.header}>TestFairy</Text>
					<View style={styles.inputWrapper}>
						<TextInput
							ref='emailInput'
							style={styles.input} 
							onChangeText={(text) => this.setState({email: text})}
							value={this.state.email}
							placeholder={'Email'}
							autoCapitalize={'none'}
							keyboardType={'email-address'}
							autoCorrect={false}
							/>
					</View>
					<View style={styles.inputWrapper}>
						<TextInput 
							ref='apiTokenInput'
							style={[styles.input]}
							onChangeText={(text) => this.setState({token: text})}
							value={this.state.token}
							placeholder={'API Token'}
							/>
					</View>
					<TouchableHighlight style={styles.buttonWrapper} onPress={this.doLogin} underlayColor='#CCC'>
						<Text style={styles.button}>Sign In</Text>
					</TouchableHighlight>
				</View>
				<View style={styles.bottom}>
					
				</View>
			</View>
		);
	},

	doLogin: function() {
		this.props.onLogin(this.state.email, this.state.token);
	}
});

var styles = StyleSheet.create({
	container: {
		flex: 1
	},
	top: {
		flex: 5,
		marginTop: 100,
	},
	bottom: {
		flex: 4
	},
	header: {
		fontSize: 25,
		padding: 4,
		textAlign: 'center',
		marginBottom: 12
	},
	inputWrapper: {
		
	},
	input: {
		padding: 4,
		height: 40,
		width: 350,
		borderColor: 'gray',
		borderWidth: 1,
		borderRadius: 5,
		margin: 5,
		alignSelf: 'center',
		flex: 1,
		textAlign: 'center'
	},
	buttonWrapper: {
		margin: 12,
		alignItems: 'center'
	},
	button: {
		padding: 8,
		textAlign: 'center',
		fontSize: 20,
		backgroundColor: '#000000',
		color: '#FFFFFF',
		borderRadius: 5,
		width: 350
	}
});