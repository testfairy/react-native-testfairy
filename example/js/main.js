'use strict';

const React = require('react-native');
const {Platform, StyleSheet, Navigator} = React;
const {View, Text, TouchableHighlight} = React;
const {connect} = require('react-redux');
const TestFairyBridge = require('react-native-testfairy');

const SignIn = require('./signin');
const Projects = require('./projects');
const List = require('./list');
const Session = require('./session');
const actions = require('./actions');

var Main = React.createClass({
  componentWillMount() {
    TestFairyBridge.begin('5b3af35e59a1e074e2d50675b1b629306cf0cfbd');
  },

  render: function () {
    return (
      <Navigator
        ref='navigator'
        style={styles.container}
        initialRoute={{}}
        configureScene={(route) => {
          if (Platform.OS === 'android') {
            return Navigator.SceneConfigs.FloatFromBottomAndroid;
          } else {
            return Navigator.SceneConfigs.FloatFromRight;
          }
        }}
        renderScene={this.renderScene}
      />
    );
  },

  isLoggedIn: function() {
    var {login} = this.props;
    return login.email && login.token;
  },

  renderScene: function(route, navigator) {
    var {
      login, 
      fetchProjects, projects, 
      fetchBuilds, builds,
      fetchSessions, sessions,
      fetchSession, session
    } = this.props;

    if (route.session) {
      return (<Session
        login={login} 
        project={route.project}
        build={route.build}
        session={route.session}
        fetch={fetchSession}
        current={session}
        navigator={navigator}
        hasBack={true}
        onLogout={this.props.doLogout}
        />)
    }

    if (route.sessions) {
      return (<List 
        title={`${route.project.name} Sessions`}
        login={login} 
        fetch={fetchSessions}
        items={sessions}
        navigator={navigator}
        renderRow={this.renderSessionItem}
        build={route.build}
        project={route.project}
        hasBack={true}
        onLogout={this.props.doLogout}
        />
      );
    }

    if (route.builds) {
      return (<List 
        title={`${route.project.name} Builds`}
        login={login} 
        fetch={fetchBuilds} 
        items={builds}
        navigator={navigator}
        renderRow={this.renderBuildItem}
        project={route.project}
        hasBack={true}
        onLogout={this.props.doLogout}
        />
      );
    }

    // if (route.projects) {
    if (this.isLoggedIn()) {
      return (
        <List 
          title={'Projects'} 
          login={login} 
          fetch={fetchProjects} 
          items={projects}
          navigator={navigator}
          renderRow={this.renderProjectItem}
          hasBack={false}
          onLogout={this.props.doLogout}
          />
      );
    }

    return (
      <SignIn
        login={login}
        onLogin={this.props.doLogin}/>
    );
  },

  renderProjectItem: function(project, props) {
    return (
      <TouchableHighlight onPress={() => {
        this.refs.navigator.push({builds: true, project: project})
      }} underlayColor='#CCC'>
        <View style={styles.projectRow}>
          <Text style={styles.projectRowTitle}>{project.name}</Text>
          <Text style={styles.projectRowSubTitle}>{project.packageName}</Text>
        </View>
      </TouchableHighlight>
    );
  },

  renderBuildItem: function(build, props) {
    return (
      <TouchableHighlight onPress={() => {
        this.refs.navigator.push({sessions: true, build: build, project: props.project})
      }} underlayColor='#CCC'>
        <View style={styles.projectRow}>
          <Text style={styles.projectRowTitle}>{build.appName}</Text>
          <Text style={styles.projectRowSubTitle}>{build.version}</Text>
        </View>
      </TouchableHighlight>
    );
  },

  renderSessionItem: function(session, props) {
        return (
      <TouchableHighlight onPress={() => {
        this.refs.navigator.push({session: true, build: props.build, project: props.project, session: session})
      }} underlayColor='#CCC'>
        <View style={styles.projectRow}>
          <Text style={styles.projectRowTitle}>{session.testerEmail}</Text>
          <Text style={styles.projectRowSubTitle}>Session #{session.id} - {session.duration}</Text>
        </View>
      </TouchableHighlight>
    );
  }
});

module.exports = connect(state => {
  return {...state}
}, (dispatch) => {
  return {
    doLogin: function(email, token) {
      dispatch({
        type: 'LOGIN',
        item: {email, token}
      });
    },
    doLogout: function() {
      dispatch({
        type: 'LOGOUT'
      });
    },
    fetchProjects: function(props) {
      var login = props.login;
      return actions.projects(login)
        .then(res => {
          dispatch({
            type: 'NEW_PROJECTS',
            items: res.projects
          })
        }, err => {
          console.log(err);
        })
    },
    fetchBuilds: function(props) {
      var {project, login} = props;
      return actions.builds(project, login)
        .then(res => {
          dispatch({
            type: 'NEW_BUILDS',
            items: res.builds
          });
        }, err => {
          console.log(err);
        })
    },
    fetchSessions: function(props) {
      var {project, build, login} = props;
      return actions.sessions(project, build, login)
        .then(res => {
          dispatch({
            type: 'NEW_SESSIONS',
            items: res.sessions
          });
        }, err => {
          console.log(err);
        })
    },
    fetchSession: function(props) {
      var {project, build, login, session} = props;
      return actions.session(project, build, session, login)
        .then(res => {
          console.log(res);
          return res;
        })
        .then(res => {
          dispatch({
            type: 'SET_SELECTED_SESSION',
            item: res.session
          });
        }, err => {
          console.log(err);
        })
    }
  }
})(Main);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  projectRow: {
    padding: 16
  },
  projectRowTitle: {
    fontSize: 18
  },
  projectRowSubTitle: {
    color: '#666'
  }
});
