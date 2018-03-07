'use strict';

var React = require('react-native');
const findNodeHandle = React.findNodeHandle;
const TestFairyBridge = React.NativeModules.TestFairyBridge;

class TestFairy {
	/**
	 * Initialize a TestFairy session with options.
	 *
	 * @param appToken Your key as given to you in your TestFairy account
	 * @param options A dictionary of options controlling the current session
	 */
	static begin(appKey, options = {}) {
		TestFairyBridge.begin(appKey, options);
	}

	/**
	 * Sets a correlation identifier for this session. This value can
	 * be looked up via web dashboard. For example, setting correlation
	 * to the value of the user-id after they logged in. Can be called
	 * only once per session (subsequent calls will be ignored.)
	 *
	 * @param correlationId Id for the current session
	 */
	static setCorrelationId(correlationId) {
		TestFairyBridge.setCorrelationId(correlationId);
	}

	/**
	 * Sets a correlation identifier for this session. This value can
	 * be looked up via web dashboard. For example, setting correlation
	 * to the value of the user-id after they logged in. Can be called
	 * only once per session (subsequent calls will be ignored.)
	 *
	 * @param correlationId Id for the current session
	 * @param traits Attributes and custom attributes to be associated with this session
	 */
	static identify(correlationId, traits = {}) {
		TestFairyBridge.identify(correlationId, traits);
	}

	/**
	 * Takes a screenshot.
	 */
	static takeScreenshot() {
		TestFairyBridge.takeScreenshot();
	}

	/**
	 * Pauses the current session. This method stops recoding of
	 * the current session until resume has been called.
	 *
	 * @see resume
	 */
	static pause() {
		TestFairyBridge.pause();
	}

	/**
	 * Resumes the recording of the current session. This method
	 * resumes a session after it was paused.
	 *
	 * @see pause
	 */
	static resume() {
		TestFairyBridge.resume();
	}

	/**
	 * @deprecated use {@link #addEvent(String)} instead.
	 */
	static checkpoint(name) {
		TestFairyBridge.checkpoint(name);
	}

	/**
	 * Marks an event in session. Use this text to tag a session with an event name. Later you can filter
	 * sessions where your user passed through this checkpoint, to better understanding user experience
	 * and behavior.
	 *
	 * @param eventName String
	 */
	static addEvent(name) {
		TestFairyBridge.checkpoint(name);
	}
	
	/**
	 * Send a feedback on behalf of the user. Call when using a in-house
	 * feedback view controller with a custom design and feel. Feedback will
	 * be associated with the current session.
	 *
	 * @param feedbackString Feedback text
	 */
	static sendUserFeedback(feedback) {
		TestFairyBridge.sendUserFeedback(feedback);
	}

	/**
	 * Hides a specific view from appearing in the video generated.
	 *
	 * @param view The specific view you wish to hide from screenshots
	 */
	static hideView(viewTag) {
		TestFairyBridge.hideView(findNodeHandle(viewTag));
	}

	/**
	 * Change the server endpoint for use with on-premise hosting. Please
	 * contact support or sales for more information. Must be called before begin
	 *
	 * @param serverOverride server address for use with TestFairy
	 */
	static setServerEndpoint(url) {
		TestFairyBridge.setServerEndpoint(url);
	}

	/**
	 * Remote logging, use log as you would use console.log. These logs will be sent to the server.
	 */
	static log(message) {
		TestFairyBridge.log(JSON.stringify(message));
	}

	static setScreenName(name) {
		TestFairyBridge.setScreenName(name);
	}

	static stop() {
		TestFairyBridge.stop();
	}

	static setUserId(userId) {
		TestFairyBridge.setUserId(userId);
	}

	static setAttribute(key, value) {
		TestFairyBridge.setAttribute(key, value);
	}

	static pushFeedbackController() {
		TestFairyBridge.pushFeedbackController();
	}

	static hideWebViewElements(selector) {
		TestFairyBridge.hideWebViewElements(selector);
	}
}

// var _testfairyConsoleLog = console.log;
// console.log = function(message) {
// 	_testfairyConsoleLog(message);
// 	TestFairy.log(message);
// }

module.exports = TestFairy;
