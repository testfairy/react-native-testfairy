'use strict';

var util = require("util");
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
		options = {...options, "react-native-version": require('react-native/package.json').version};
		TestFairyBridge.begin(appKey, options);
	}

	/**
	 * Initialize the TestFairy SDK with shake for feedback enabled. No sessions will be recorded.
	 */
	static installFeedbackHandler(appKey) {
		TestFairyBridge.installFeedbackHandler(appKey);
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
		if (typeof viewTag === 'number') {
			TestFairyBridge.hideView(findNodeHandle(viewTag));
		} else {
			TestFairyBridge.hideViewWithNativeId(viewTag);
		}
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
		TestFairyBridge.log(util.inspect(message));
	}

	/**
	 * Set a custom name for the current screen. Useful for applications that don't use more than one
	 * Activity. This name is displayed for a given screenshot, and will override the name of the current
	 * Activity.
	 *
	 * @param name String
	 */
	static setScreenName(name) {
		TestFairyBridge.setScreenName(name);
	}

	/**
	 * Stops the current session recording. Unlike 'pause', when
	 * calling 'resume', a new session will be created and will be
	 * linked to the previous recording. Useful if you want short
	 * session recordings of specific use-cases of the app. Hidden
	 * views and user identity will be applied to the new session
	 * as well, if started.
	 */
	static stop() {
		TestFairyBridge.stop();
	}

	/**
	 * Use this function to tell TestFairy who is the user,
	 * It will help you to search the specific user in the TestFairy dashboard.
	 * We recommend passing values such as email, phone number, or user id that your app may use.
	 *
	 * @param userId We recommend to use email as userId, But It can be phone number or any other unique id.
	 */
	static setUserId(userId) {
		TestFairyBridge.setUserId(userId);
	}

	/**
	 * Records an attribute that will be added to the session.
	 *
	 * NOTE: The SDK limits you to storing 64 attribute keys. Adding more than 64 will fail and return false.
	 *
	 * @param key The key of the attribute
	 * @param value The value associated with the attribute max size of 1kb
	 * @return boolean true if successfully set attribute value, otherwise false
	 */
	static setAttribute(key, value) {
		TestFairyBridge.setAttribute(key, value);
	}

	/**
	 * Displays the feedback activity. Allow users to provide feedback
	 * about the current session. All feedback will appear in your
	 * build report page, and in the recorded session page.
	 *
	 * Must be called after begin.
	 */
	static pushFeedbackController() {
		TestFairyBridge.pushFeedbackController();
	}

	/**
	 * Displays the feedback form. Allow users to provide
	 * feedback without prior call to begin. All feedback
	 * will appear in your build report page, and in
	 * "Feedbacks" tab.
	 *
	 * This method is different from showFeedbackForm by
	 * that it does not require a call to begin().
	 *
	 * @param appToken Your key as given to you in your TestFairy account
	 * @param takeScreenshot whether screenshot should be automatically added
	 */
	static showFeedbackForm(appToken, takeScreenshot) {
		TestFairyBridge.showFeedbackForm(appToken, takeScreenshot);
	}

	static hideWebViewElements(selector) {
		TestFairyBridge.hideWebViewElements(selector);
	}

	/**
	 * Enables the ability to capture crashes. TestFairy
	 * crash handler is installed by default. Once installed
	 * it cannot be uninstalled. Must be called before begin.
	 */
	static enableCrashHandler() {
		TestFairyBridge.enableCrashHandler();
	}

	/**
	 * Disables the ability to capture crashes. TestFairy
	 * crash handler is installed by default. Once installed
	 * it cannot be uninstalled. Must be called before begin.
	 */
	static disableCrashHandler() {
		TestFairyBridge.disableCrashHandler();
	}

	/**
	 * Enables recording of a metric regardless of build settings.
	 * Valid values include 'cpu', 'memory', 'logcat', 'battery', 'network-requests'
	 * A metric cannot be enabled and disabled at the same time, therefore
	 * if a metric is also disabled, the last call to enable to disable wins.
	 * Must be called be before begin.
	 */
	static enableMetric(metric) {
		TestFairyBridge.enableMetric(metric);
	}

	/**
	 * Disables recording of a metric regardless of build settings.
	 * Valid values include "cpu", "memory", "logcat", "battery", "network-requests"
	 * A metric cannot be enabled and disabled at the same time, therefore
	 * if a metric is also disabled, the last call to enable to disable wins.
	 * Must be called be before begin.
	 */
	static disableMetric(metric) {
		TestFairyBridge.disableMetric(metric);
	}

	/**
	 * Enables the ability to capture video recording regardless of build settings.
	 * Valid values for policy include "always", "wifi" and "none"
	 * Valid values for quality include "high", "low", "medium"
	 * Values for fps must be between 0.1 and 2.0. Value will be rounded to
	 * the nearest frame.
	 */
	static enableVideo(policy, quality, framesPerSecond) {
		TestFairyBridge.enableVideo(policy, quality, framesPerSecond);
	}

	/**
	 * Disables the ability to capture video recording. Must be
	 * called before begin.
	 */
	static disableVideo() {
		TestFairyBridge.disableVideo();
	}

	/**
	 * Enables the ability to present the feedback form
	 * based on the method given. Valid values only include
	 * "shake". If an unrecognized method is passed,
	 * the value defined in the build settings will be
	 * used. Must be called before begin.
	 */
	static enableFeedbackForm(method) {
		TestFairyBridge.enableFeedbackForm(method);
	}

	/**
	 * Disables the ability to present users with feedback when
	 * devices is shaken, or if a screenshot is taken. Must be called
	 * before begin.
	 */
	static disableFeedbackForm() {
		TestFairyBridge.disableFeedbackForm();
	}

	/**
	 * Disables auto update prompts for this session. Must be called
	 * Must be called before begin.
	 */
	static disableAutoUpdate() {
		TestFairyBridge.disableAutoUpdate();
	}

	/**
	 * Sets the maximum recording time. Minimum value is 60 seconds,
	 * else the value defined in the build settings will be used. The
	 * maximum value is the lowest value between this value and the
	 * value defined in the build settings.
	 * Time is rounded to the nearest minute.
	 * Must be called before begin.
	 */
	static setMaxSessionLength(seconds) {
		TestFairyBridge.setMaxSessionLength(seconds);
	}

	/**
	 * Send an exception to TestFairy.
	 * Note, this function is limited to 5 errors.
	 * @param error Error
	 */
	static logException(error) {
		TestFairyBridge.logException(error.message, error.stack);
	}

	/**
	 * Customize the feedback form
	 *
	 * Accepted dictionary values: {
	 * 	"defaultText": <Default feedback text>,
	 * 	"isEmailMandatory": true|false,
	 * 	"isEmailVisible": true|false
	 * }
	 *
	 * defaultText: By setting a default text, you will override the initial content of the text area
	 * inside the feedback form. This way, you can standardize the way you receive feedbacks
	 * by specifying guidelines to your users.
	 *
	 * isEmailMandatory: Determines whether the user has to add his email address to the feedback. Default is true
	 *
	 * isEmailVisible: Determines whether the email field is displayed in the feedback form. Default is true
	 */
	static setFeedbackOptions(options) {
		TestFairyBridge.setFeedbackOptions(options);
	}
}

// var _testfairyConsoleLog = console.log;
// console.log = function(message) {
// 	_testfairyConsoleLog(message);
// 	TestFairy.log(message);
// }

module.exports = TestFairy;
