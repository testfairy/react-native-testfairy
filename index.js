'use strict';

const {
  NativeEventEmitter,
  NativeModules,
  findNodeHandle,
} = require('react-native');

const reactNativeVersion = require('react-native/package.json').version;

const NATIVE_MODULE_NAME = 'TestFairyBridge';

// Session lifecycle events emitted by the native bridges. Note:
// `autoUpdateDownloadFailed` is emitted by the Android SDK only — the iOS
// SDK's TestFairySessionStateDelegate has no equivalent callback.
const SESSION_EVENTS = Object.freeze({
  started: 'SauceMobileBetaSessionStarted',
  failed: 'SauceMobileBetaSessionFailed',
  lengthReached: 'SauceMobileBetaSessionLengthReached',
  stopped: 'SauceMobileBetaSessionStopped',
  autoUpdateAvailable: 'SauceMobileBetaAutoUpdateAvailable',
  autoUpdateDownloadStarted: 'SauceMobileBetaAutoUpdateDownloadStarted',
  autoUpdateDismissed: 'SauceMobileBetaAutoUpdateDismissed',
  autoUpdateDownloadFailed: 'SauceMobileBetaAutoUpdateDownloadFailed',
  noAutoUpdateAvailable: 'SauceMobileBetaNoAutoUpdateAvailable',
});

let nativeEventEmitter;
let networkLoggingState;

function getNativeBridge() {
  const bridge = NativeModules[NATIVE_MODULE_NAME];

  if (!bridge) {
    throw new Error(
      [
        `The native module "${NATIVE_MODULE_NAME}" is unavailable.`,
        'Confirm that @saucelabs/mobile-beta-react-native is installed and linked.',
        'On iOS, run "pod install" after installing the package.',
        'Do not install react-native-testfairy and @saucelabs/mobile-beta-react-native together.',
      ].join(' '),
    );
  }

  return bridge;
}

function getNativeEventEmitter() {
  if (!nativeEventEmitter) {
    nativeEventEmitter = new NativeEventEmitter(getNativeBridge());
  }

  return nativeEventEmitter;
}

function normalizeBeginOptions(options) {
  return {
    ...(options || {}),
    'react-native-version': reactNativeVersion,

    // Backtrace is the sole crash owner. The native crashless artifacts also
    // enforce this value independently.
    enableCrashReporter: false,
  };
}

function serializeLogValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    return JSON.stringify({
      name: value.name,
      message: value.message,
      stack: value.stack,
    });
  }

  const seen = new WeakSet();

  try {
    return JSON.stringify(value, (_key, candidate) => {
      if (typeof candidate === 'bigint') {
        return candidate.toString();
      }

      if (candidate !== null && typeof candidate === 'object') {
        if (seen.has(candidate)) {
          return '[Circular]';
        }

        seen.add(candidate);
      }

      return candidate;
    });
  } catch (_error) {
    try {
      return String(value);
    } catch (_stringError) {
      return '[Unserializable value]';
    }
  }
}

function resolveViewTag(viewOrTag) {
  if (typeof viewOrTag === 'number') {
    return viewOrTag;
  }

  const tag = findNodeHandle(viewOrTag);

  if (typeof tag !== 'number') {
    throw new TypeError(
      'hideView expected a React Native component ref, native tag, or nativeID string.',
    );
  }

  return tag;
}

function utf8ByteLength(value) {
  if (typeof value !== 'string') {
    return 0;
  }

  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }

  return unescape(encodeURIComponent(value)).length;
}

function requestUrl(input) {
  if (typeof input === 'string') {
    return input;
  }

  if (input && typeof input.url === 'string') {
    return input.url;
  }

  return String(input);
}

function requestMethod(input, init) {
  if (init && typeof init.method === 'string') {
    return init.method;
  }

  if (input && typeof input.method === 'string') {
    return input.method;
  }

  return 'GET';
}

function requestBody(input, init) {
  if (init && init.body != null) {
    return String(init.body);
  }

  if (input && input._bodyText != null) {
    return String(input._bodyText);
  }

  return null;
}

function headersToString(headers) {
  if (!headers) {
    return null;
  }

  const values = [];

  if (typeof headers.forEach === 'function') {
    headers.forEach((value, key) => {
      values.push(`${key}: ${value}`);
    });

    return values.length === 0 ? null : values.join('\n');
  }

  if (Array.isArray(headers)) {
    for (const entry of headers) {
      if (Array.isArray(entry) && entry.length >= 2) {
        values.push(`${entry[0]}: ${entry[1]}`);
      }
    }

    return values.length === 0 ? null : values.join('\n');
  }

  if (typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers)) {
      values.push(`${key}: ${value}`);
    }

    return values.length === 0 ? null : values.join('\n');
  }

  return String(headers);
}

function resolveNetworkLoggingArguments(targetOrOptions, maybeOptions) {
  if (
    targetOrOptions &&
    typeof targetOrOptions === 'object' &&
    typeof targetOrOptions.fetch === 'function'
  ) {
    return {
      target: targetOrOptions,
      options: maybeOptions || {},
    };
  }

  return {
    target: globalThis,
    options: targetOrOptions || {},
  };
}

class TestFairy {
  /**
   * Starts a Sauce Mobile Beta session.
   *
   * In this package, begin is crashless and delegates to
   * beginWithoutCrashHandler. Backtrace remains the sole crash owner.
   */
  static begin(appToken, options = {}) {
    return TestFairy.beginWithoutCrashHandler(appToken, options);
  }

  /**
   * Starts a Sauce Mobile Beta session without installing TestFairy crash
   * handling. This is the recommended Backtrace coexistence API.
   */
  static beginWithoutCrashHandler(appToken, options = {}) {
    if (typeof appToken !== 'string' || appToken.trim().length === 0) {
      throw new TypeError('appToken must be a non-empty string.');
    }

    getNativeBridge().beginWithoutCrashHandler(
      appToken,
      normalizeBeginOptions(options),
    );
  }

  static installFeedbackHandler(appToken) {
    getNativeBridge().installFeedbackHandler(appToken);
  }

  static uninstallFeedbackHandler() {
    getNativeBridge().uninstallFeedbackHandler();
  }

  static setCorrelationId(correlationId) {
    getNativeBridge().setCorrelationId(String(correlationId));
  }

  static identify(correlationId, traits = {}) {
    getNativeBridge().identify(String(correlationId), traits || {});
  }

  static takeScreenshot() {
    getNativeBridge().takeScreenshot();
  }

  static pause() {
    getNativeBridge().pause();
  }

  static resume() {
    getNativeBridge().resume();
  }

  /**
   * @deprecated Use addEvent instead.
   */
  static checkpoint(name) {
    TestFairy.addEvent(name);
  }

  static addEvent(name) {
    getNativeBridge().checkpoint(String(name));
  }

  static sendUserFeedback(feedback) {
    getNativeBridge().sendUserFeedback(String(feedback));
  }

  static hideView(viewOrNativeId) {
    if (typeof viewOrNativeId === 'string') {
      getNativeBridge().hideViewWithNativeId(viewOrNativeId);
      return;
    }

    getNativeBridge().hideView(resolveViewTag(viewOrNativeId));
  }

  static hideWebViewElements(selector) {
    getNativeBridge().hideWebViewElements(String(selector));
  }

  static setServerEndpoint(url) {
    getNativeBridge().setServerEndpoint(String(url));
  }

  static log(message) {
    getNativeBridge().log(serializeLogValue(message));
  }

  static setScreenName(name) {
    getNativeBridge().setScreenName(String(name));
  }

  static stop() {
    getNativeBridge().stop();
  }

  static setUserId(userId) {
    getNativeBridge().setUserId(String(userId));
  }

  static setAttribute(key, value) {
    getNativeBridge().setAttribute(String(key), String(value));
  }

  static pushFeedbackController() {
    getNativeBridge().pushFeedbackController();
  }

  static showFeedbackForm(appToken, takeScreenshot = true) {
    getNativeBridge().showFeedbackForm(String(appToken), Boolean(takeScreenshot));
  }

  /**
   * @deprecated Sauce Mobile Beta is crashless. Backtrace owns crashes.
   * This method is retained for source compatibility and invokes a native no-op.
   */
  static enableCrashHandler() {
    getNativeBridge().enableCrashHandler();
  }

  /**
   * @deprecated Sauce Mobile Beta is already crashless. This method is
   * retained for source compatibility.
   */
  static disableCrashHandler() {
    getNativeBridge().disableCrashHandler();
  }

  static enableMetric(metric) {
    getNativeBridge().enableMetric(String(metric));
  }

  static disableMetric(metric) {
    getNativeBridge().disableMetric(String(metric));
  }

  static enableVideo(policy, quality = 'medium', framesPerSecond = 1) {
    getNativeBridge().enableVideo(
      String(policy),
      String(quality),
      Number(framesPerSecond),
    );
  }

  static disableVideo() {
    getNativeBridge().disableVideo();
  }

  static enableFeedbackForm(method) {
    getNativeBridge().enableFeedbackForm(String(method));
  }

  static disableFeedbackForm() {
    getNativeBridge().disableFeedbackForm();
  }

  static disableAutoUpdate() {
    getNativeBridge().disableAutoUpdate();
  }

  static setMaxSessionLength(seconds) {
    getNativeBridge().setMaxSessionLength(Number(seconds));
  }

  static logException(error) {
    if (!(error instanceof Error)) {
      throw new TypeError('logException expects an Error instance.');
    }

    getNativeBridge().logException(
      error.message,
      error.stack || `${error.name}: ${error.message}`,
    );
  }

  static setFeedbackOptions(options) {
    getNativeBridge().setFeedbackOptions(options || {});
  }

  static attachFile(filename, content = '', mimeType = 'text/plain') {
    if (typeof filename !== 'string' || filename.trim().length === 0) {
      return Promise.reject(
        new TypeError('filename must be a non-empty string.'),
      );
    }

    return getNativeBridge().attachFile(
      filename,
      content == null ? '' : String(content),
      mimeType == null ? 'application/octet-stream' : String(mimeType),
    );
  }

  static addNetworkEvent(
    url,
    method,
    statusCode,
    startTimeMillis,
    endTimeMillis,
    requestSize,
    responseSize,
    errorMessage = null,
    requestHeaders = null,
    requestBodyValue = null,
    responseHeaders = null,
    responseBody = null,
  ) {
    getNativeBridge().addNetworkEvent(
      String(url),
      String(method),
      Number(statusCode),
      Number(startTimeMillis),
      Number(endTimeMillis),
      Number(requestSize),
      Number(responseSize),
      errorMessage == null ? null : String(errorMessage),
      requestHeaders == null ? null : String(requestHeaders),
      requestBodyValue == null ? null : String(requestBodyValue),
      responseHeaders == null ? null : String(responseHeaders),
      responseBody == null ? null : String(responseBody),
    );
  }

  /**
   * Returns the active Sauce Mobile Beta session URL, if available.
   */
  static getSessionUrl() {
    return getNativeBridge().getSessionUrl();
  }

  /**
   * Compatibility alias for getSessionUrl.
   */
  static sessionUrl(callback) {
    const result = TestFairy.getSessionUrl();

    if (typeof callback === 'function') {
      result.then(
        value => callback(null, value),
        error => callback(error),
      );
    }

    return result;
  }

  static getVersion() {
    return getNativeBridge().getVersion();
  }

  /**
   * Compatibility alias for getVersion.
   */
  static version(callback) {
    const result = TestFairy.getVersion();

    if (typeof callback === 'function') {
      result.then(
        value => callback(null, value),
        error => callback(error),
      );
    }

    return result;
  }

  static isCrashReportingAvailable() {
    return getNativeBridge().crashReportingAvailable === true;
  }

  static getIntegrationInfo() {
    const bridge = getNativeBridge();

    return {
      sdkName: bridge.sdkName || 'SauceMobileBeta',
      crashReportingAvailable: bridge.crashReportingAvailable === true,
      coexistenceMode: bridge.coexistenceMode || 'backtrace_crash_owner',
    };
  }

  /**
   * Registers callbacks for native Sauce Mobile Beta session lifecycle events.
   *
   * Returns a subscription with a remove method.
   */
  static addSessionStateListener(listener) {
    if (!listener || typeof listener !== 'object') {
      throw new TypeError('listener must be an object.');
    }

    const emitter = getNativeEventEmitter();
    const subscriptions = [];

    const register = (eventName, callback) => {
      if (typeof callback === 'function') {
        subscriptions.push(emitter.addListener(eventName, callback));
      }
    };

    register(SESSION_EVENTS.started, listener.onSessionStarted);
    register(SESSION_EVENTS.failed, listener.onSessionFailed);
    register(SESSION_EVENTS.lengthReached, listener.onSessionLengthReached);
    register(SESSION_EVENTS.stopped, listener.onSessionStopped);
    register(SESSION_EVENTS.autoUpdateAvailable, listener.onAutoUpdateAvailable);
    register(
      SESSION_EVENTS.autoUpdateDownloadStarted,
      listener.onAutoUpdateDownloadStarted,
    );
    register(SESSION_EVENTS.autoUpdateDismissed, listener.onAutoUpdateDismissed);
    register(
      SESSION_EVENTS.autoUpdateDownloadFailed,
      listener.onAutoUpdateDownloadFailed,
    );
    register(
      SESSION_EVENTS.noAutoUpdateAvailable,
      listener.onNoAutoUpdateAvailable,
    );

    return {
      remove() {
        for (const subscription of subscriptions) {
          subscription.remove();
        }
      },
    };
  }

  /**
   * Instruments the supplied fetch implementation.
   *
   * Network headers and bodies are disabled by default because they can contain
   * credentials, tokens, personal data, and application payloads.
   */
  static enableNetworkLogging(targetOrOptions, maybeOptions) {
    const { target, options } = resolveNetworkLoggingArguments(
      targetOrOptions,
      maybeOptions,
    );

    if (!target || typeof target.fetch !== 'function') {
      throw new Error(
        'enableNetworkLogging requires a global-like object with a fetch function.',
      );
    }

    if (networkLoggingState) {
      if (networkLoggingState.target === target) {
        return;
      }

      throw new Error(
        'Network logging is already enabled on another fetch target.',
      );
    }

    const configuration = {
      includeHeaders: options.includeHeaders === true,
      includeBodies: options.includeBodies === true,
    };

    const originalFetch = target.fetch;

    const wrappedFetch = function sauceMobileBetaFetch(input, init) {
      const url = requestUrl(input);
      const method = requestMethod(input, init);
      const startTimeMillis = Date.now();

      const rawRequestBody = requestBody(input, init);
      const requestSize = utf8ByteLength(rawRequestBody || '');

      const requestHeaders = configuration.includeHeaders
        ? headersToString(init && init.headers ? init.headers : input && input.headers)
        : null;

      const capturedRequestBody = configuration.includeBodies
        ? rawRequestBody
        : null;

      const requestPromise = originalFetch.call(target, input, init);

      Promise.resolve(requestPromise)
        .then(async response => {
          let responseHeaders = null;
          let capturedResponseBody = null;

          if (configuration.includeHeaders) {
            responseHeaders = headersToString(response.headers);
          }

          if (
            configuration.includeBodies &&
            response &&
            typeof response.clone === 'function'
          ) {
            try {
              capturedResponseBody = await response.clone().text();
            } catch (_error) {
              capturedResponseBody = null;
            }
          }

          TestFairy.addNetworkEvent(
            url,
            method,
            response.status,
            startTimeMillis,
            Date.now(),
            requestSize,
            utf8ByteLength(capturedResponseBody || ''),
            null,
            requestHeaders,
            capturedRequestBody,
            responseHeaders,
            capturedResponseBody,
          );
        })
        .catch(error => {
          TestFairy.addNetworkEvent(
            url,
            method,
            -1,
            startTimeMillis,
            Date.now(),
            requestSize,
            0,
            error instanceof Error ? error.message : String(error),
            requestHeaders,
            capturedRequestBody,
            null,
            null,
          );
        });

      // Return the unmodified application promise. Telemetry must never change
      // the application-visible fetch response.
      return requestPromise;
    };

    target.fetch = wrappedFetch;
    networkLoggingState = {
      target,
      originalFetch,
      wrappedFetch,
    };
  }

  static disableNetworkLogging(target = globalThis) {
    if (!networkLoggingState) {
      return;
    }

    if (networkLoggingState.target !== target) {
      return;
    }

    // Do not overwrite another library's wrapper if fetch changed after Sauce
    // Mobile Beta instrumentation was installed.
    if (target.fetch === networkLoggingState.wrappedFetch) {
      target.fetch = networkLoggingState.originalFetch;
    }

    networkLoggingState = undefined;
  }
}

TestFairy.SESSION_EVENTS = SESSION_EVENTS;

module.exports = TestFairy;
module.exports.default = TestFairy;
