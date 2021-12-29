export = TestFairy;

declare class TestFairy {
	/**
	 * Initialize a TestFairy session with options.
	 *
	 * @param appToken Your key as given to you in your TestFairy account
	 * @param options A dictionary of options controlling the current session
	 */
	static begin(appKey: any, options?: {}): void;
	/**
	 * Initialize the TestFairy SDK with shake for feedback enabled. No sessions will be recorded.
	 */
	static installFeedbackHandler(appKey: any): void;
	/**
	 * Uninstall previously installed feedback handlers.
	 */
	static uninstallFeedbackHandler(): void;
	/**
	 * Sets a correlation identifier for this session. This value can
	 * be looked up via web dashboard. For example, setting correlation
	 * to the value of the user-id after they logged in. Can be called
	 * only once per session (subsequent calls will be ignored.)
	 *
	 * @param correlationId Id for the current session
	 */
	static setCorrelationId(correlationId: any): void;
	/**
	 * Sets a correlation identifier for this session. This value can
	 * be looked up via web dashboard. For example, setting correlation
	 * to the value of the user-id after they logged in. Can be called
	 * only once per session (subsequent calls will be ignored.)
	 *
	 * @param correlationId Id for the current session
	 * @param traits Attributes and custom attributes to be associated with this session
	 */
	static identify(correlationId: any, traits?: {}): void;
	/**
	 * Takes a screenshot.
	 */
	static takeScreenshot(): void;
	/**
	 * Pauses the current session. This method stops recoding of
	 * the current session until resume has been called.
	 *
	 * @see resume
	 */
	static pause(): void;
	/**
	 * Resumes the recording of the current session. This method
	 * resumes a session after it was paused.
	 *
	 * @see pause
	 */
	static resume(): void;
	/**
	 * @deprecated use {@link #addEvent(String)} instead.
	 */
	static checkpoint(name: any): void;
	/**
	 * Marks an event in session. Use this text to tag a session with an event name. Later you can filter
	 * sessions where your user passed through this checkpoint, to better understanding user experience
	 * and behavior.
	 *
	 * @param eventName String
	 */
	static addEvent(name: any): void;
	/**
	 * Send a feedback on behalf of the user. Call when using a in-house
	 * feedback view controller with a custom design and feel. Feedback will
	 * be associated with the current session.
	 *
	 * @param feedbackString Feedback text
	 */
	static sendUserFeedback(feedback: any): void;
	/**
	 * Hides a specific view from appearing in the video generated.
	 *
	 * @param view The specific view you wish to hide from screenshots
	 */
	static hideView(viewTag: any): void;
	/**
	 * Change the server endpoint for use with on-premise hosting. Please
	 * contact support or sales for more information. Must be called before begin
	 *
	 * @param serverOverride server address for use with TestFairy
	 */
	static setServerEndpoint(url: any): void;
	/**
	 * Remote logging, use log as you would use console.log. These logs will be sent to the server.
	 */
	static log(message: any): void;
	/**
	 * Set a custom name for the current screen. Useful for applications that don't use more than one
	 * Activity. This name is displayed for a given screenshot, and will override the name of the current
	 * Activity.
	 *
	 * @param name String
	 */
	static setScreenName(name: any): void;
	/**
	 * Stops the current session recording. Unlike 'pause', when
	 * calling 'resume', a new session will be created and will be
	 * linked to the previous recording. Useful if you want short
	 * session recordings of specific use-cases of the app. Hidden
	 * views and user identity will be applied to the new session
	 * as well, if started.
	 */
	static stop(): void;
	/**
	 * Use this function to tell TestFairy who is the user,
	 * It will help you to search the specific user in the TestFairy dashboard.
	 * We recommend passing values such as email, phone number, or user id that your app may use.
	 *
	 * @param userId We recommend to use email as userId, But It can be phone number or any other unique id.
	 */
	static setUserId(userId: any): void;
	/**
	 * Records an attribute that will be added to the session.
	 *
	 * NOTE: The SDK limits you to storing 64 attribute keys. Adding more than 64 will fail and return false.
	 *
	 * @param key The key of the attribute
	 * @param value The value associated with the attribute max size of 1kb
	 * @return boolean true if successfully set attribute value, otherwise false
	 */
	static setAttribute(key: any, value: any): void;
	/**
	 * Displays the feedback activity. Allow users to provide feedback
	 * about the current session. All feedback will appear in your
	 * build report page, and in the recorded session page.
	 *
	 * Must be called after begin.
	 */
	static pushFeedbackController(): void;
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
	static showFeedbackForm(appToken: any, takeScreenshot: any): void;
	static hideWebViewElements(selector: any): void;
	/**
	 * Enables the ability to capture crashes. TestFairy
	 * crash handler is installed by default. Once installed
	 * it cannot be uninstalled. Must be called before begin.
	 */
	static enableCrashHandler(): void;
	/**
	 * Disables the ability to capture crashes. TestFairy
	 * crash handler is installed by default. Once installed
	 * it cannot be uninstalled. Must be called before begin.
	 */
	static disableCrashHandler(): void;
	/**
	 * Enables recording of a metric regardless of build settings.
	 * Valid values include 'cpu', 'memory', 'logcat', 'battery', 'network-requests'
	 * A metric cannot be enabled and disabled at the same time, therefore
	 * if a metric is also disabled, the last call to enable to disable wins.
	 * Must be called be before begin.
	 */
	static enableMetric(metric: any): void;
	/**
	 * Disables recording of a metric regardless of build settings.
	 * Valid values include "cpu", "memory", "logcat", "battery", "network-requests"
	 * A metric cannot be enabled and disabled at the same time, therefore
	 * if a metric is also disabled, the last call to enable to disable wins.
	 * Must be called be before begin.
	 */
	static disableMetric(metric: any): void;
	/**
	 * Enables the ability to capture video recording regardless of build settings.
	 * Valid values for policy include "always", "wifi" and "none"
	 * Valid values for quality include "high", "low", "medium"
	 * Values for fps must be between 0.1 and 2.0. Value will be rounded to
	 * the nearest frame.
	 */
	static enableVideo(policy: any, quality: any, framesPerSecond: any): void;
	/**
	 * Disables the ability to capture video recording. Must be
	 * called before begin.
	 */
	static disableVideo(): void;
	/**
	 * Enables the ability to present the feedback form
	 * based on the method given. Valid values only include
	 * "shake". If an unrecognized method is passed,
	 * the value defined in the build settings will be
	 * used. Must be called before begin.
	 */
	static enableFeedbackForm(method: any): void;
	/**
	 * Disables the ability to present users with feedback when
	 * devices is shaken, or if a screenshot is taken. Must be called
	 * before begin.
	 */
	static disableFeedbackForm(): void;
	/**
	 * Disables auto update prompts for this session. Must be called
	 * Must be called before begin.
	 */
	static disableAutoUpdate(): void;
	/**
	 * Sets the maximum recording time. Minimum value is 60 seconds,
	 * else the value defined in the build settings will be used. The
	 * maximum value is the lowest value between this value and the
	 * value defined in the build settings.
	 * Time is rounded to the nearest minute.
	 * Must be called before begin.
	 */
	static setMaxSessionLength(seconds: any): void;
	/**
	 * Send an exception to TestFairy.
	 * Note, this function is limited to 5 errors.
	 * @param error Error
	 */
	static logException(error: any): void;
	/**
	 * Customize the feedback form.
	 *
	 * Accepted dictionary values: {
	 *  "defaultText": <Default feedback text>,
	 *  "isEmailMandatory": true|false,
	 *  "isEmailVisible": true|false
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
	static setFeedbackOptions(options: any): void;
	/**
	 * Attach a file to the session timeline at current moment in time.
	 *
	 * @param filename Name of the attached file. It must have a file extension.
	 * @param content A utf-8 javascript string, can be empty.
	 * @param mimeType MIME type of the given file, i.e "text/plain"
	 */
	static attachFile(filename: any, content: any, mimeType: any): void;
	/**
	 * Add a network timeline event to the current session.
	 *
	 * @param {string} url URL of the network call
	 * @param {string} method HTTP method
	 * @param {number} statusCode Response status code
	 * @param {number} startTimeMillis Call start time
	 * @param {number} endTimeMillis Response end time
	 * @param {number} requestSize Request body content size
	 * @param {number} responseSize Response body content size
	 * @param {string?} errorMessage Network error message if exists (optional)
	 * @param {string?} requestHeaders Request headers (optional)
	 * @param {string?} requestBody Request body (optional)
	 * @param {string?} responseHeaders Response headers (optional)
	 * @param {string?} responseBody Response body (optional)
	 */
	static addNetworkEvent(
		url: string,
		method: string,
		statusCode: number,
		startTimeMillis: number,
		endTimeMillis: number,
		requestSize: number,
		responseSize: number,
		errorMessage: string | null,
		requestHeaders: string | null,
		requestBody: string | null,
		responseHeaders: string | null,
		responseBody: string | null,
	): void;
	/**
	 * Enables capturing HTTP calls and reports themn in session timeline. Capturing request and response bodies is disabled by default.
	 *
	 * @param {object} window Global window object
	 * @param {object} Optional configuration object. Provide `includeHeaders` and `includeBodies` keys to enable request/response headers in the log.
	 */
	static enableNetworkLogging(window: object, options: any): void;
	/**
	 * Disabled capturing HTTP calls.
	 *
	 * @param {object} window Global window object
	 */
	static disableNetworkLogging(window: object): void;
}
