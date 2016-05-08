const base64 = require('base-64');
const endpoint = "https://app.testfairy.com/api/1";

module.exports = {
	projects: function(login) {
		var authentication = base64.encode(`${login.email}:${login.token}`);
		var url = endpoint + "/projects"
		return fetch(url, {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Basic ${authentication}`
			}
		})
		.then(res => res.json());
	},
	builds: function(project, login) {
		var authentication = base64.encode(`${login.email}:${login.token}`);
		var url = endpoint + `/projects/${project.id}/builds`
		return fetch(url, {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Basic ${authentication}`
			}
		})
		.then(res => res.json());	
	},
	sessions: function(project, build, login) {
		var authentication = base64.encode(`${login.email}:${login.token}`);
		var url = endpoint + `/projects/${project.id}/builds/${build.id}/sessions`
		return fetch(url, {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Basic ${authentication}`
			}
		})
		.then(res => res.json());	
	},
	session: function(project, build, session, login) {
		var authentication = base64.encode(`${login.email}:${login.token}`);
		var url = endpoint + `/projects/${project.id}/builds/${build.id}/sessions/${session.id}`
		return fetch(url, {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Basic ${authentication}`
			}
		})
		.then(res => res.json());	
	}
}