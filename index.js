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
  sessionCorrelationIdChanged: 'SauceMobileBetaSessionCorrelationIdChanged',
});

// Internal event: the native SDK hands the crash-reporter attributes it
// manages (sauce.correlation_id, sauce.mobile_beta.session_started,
// sauce.mobile_beta.session_url, sauce.sdk.coexistence_mode, sauce.release,
// sauce.dist) to the bridge's native sink, which forwards them here. It is not
// part of SESSION_EVENTS because the package applies the attributes to the
// Backtrace client itself; applications never consume the raw event.
const CRASH_REPORTER_ATTRIBUTES_EVENT = 'SauceMobileBetaCrashReporterAttributes';

let nativeEventEmitter;
let networkLoggingState;

let explicitBacktraceClient = null;
let backtraceNotInitializedWarned = false;
let backtraceVersionWarned = false;
let crashReporterAttributesSubscription;
let lastCrashReporterAttributes = null;
let crashReporterPushFailureLogged = false;

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

function normalizeCrashReporterAttributes(attributes) {
  if (!attributes || typeof attributes !== 'object') {
    return null;
  }

  const normalized = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value != null) {
      normalized[key] = String(value);
    }
  }

  return normalized;
}

/**
 * Resolves @backtrace/react-native, an optional peer dependency.
 *
 * Returns { present: false } when the module is not installed (or Metro could
 * not resolve it), otherwise { present: true, client, version } where client is
 * BacktraceClient.instance (undefined before BacktraceClient.initialize) and
 * version is the installed package version when readable.
 */
function resolveBacktraceClient() {
  try {
    // Metro treats a require inside a try block as optional
    // (transformer.allowOptionalDependencies, on by default in the React
    // Native Metro config), so apps without Backtrace installed still bundle.
    const backtrace = require('@backtrace/react-native');
    const BacktraceClient = backtrace ? backtrace.BacktraceClient : undefined;
    let version;

    try {
      version = require('@backtrace/react-native/package.json').version;
    } catch (_error) {
      version = undefined;
    }

    return {
      present: true,
      client: BacktraceClient ? BacktraceClient.instance : undefined,
      version,
    };
  } catch (_error) {
    return { present: false };
  }
}

// Numeric major.minor.patch only: a pre-release such as 0.2.3-rc counts as 0.2.3.
function isBacktraceVersionBefore(version, major, minor, patch) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(version || ''));

  if (!match) {
    return false;
  }

  const [, a, b, c] = match.map(Number);

  return a !== major ? a < major : b !== minor ? b < minor : c < patch;
}

function warnBacktraceNotInitializedOnce() {
  if (backtraceNotInitializedWarned) {
    return;
  }

  backtraceNotInitializedWarned = true;

  console.warn(
    'Sauce Mobile Beta found @backtrace/react-native but BacktraceClient.instance is not set, so crash reports will not carry the session attributes. Call BacktraceClient.initialize(...) before TestFairy.beginWithoutCrashHandler, or pass your client to TestFairy.setBacktraceClient(client).',
  );
}

function warnBacktraceVersionOnce(version) {
  if (backtraceVersionWarned || !isBacktraceVersionBefore(version, 0, 2, 3)) {
    return;
  }

  backtraceVersionWarned = true;

  console.warn(
    `Sauce Mobile Beta: @backtrace/react-native ${version} does not forward attributes added after initialize() to native crash reports, so native crash reports will not carry sauce.correlation_id or sauce.mobile_beta.session_url. Upgrade to 0.2.3 or later.`,
  );
}

function logCrashReporterPushFailureOnce(error) {
  if (crashReporterPushFailureLogged) {
    return;
  }

  crashReporterPushFailureLogged = true;

  console.warn(
    'Sauce Mobile Beta could not hand the crash-reporter attributes to Backtrace.',
    error,
  );
}

/**
 * Applies the SDK-managed crash-reporter attributes to Backtrace.
 *
 * Priority: the client linked with setBacktraceClient, otherwise
 * BacktraceClient.instance from @backtrace/react-native when that module
 * resolves. Never throws: a crash reporter integration must not take the
 * session down with it.
 */
function pushCrashReporterAttributes(attributes) {
  const map = normalizeCrashReporterAttributes(attributes);

  if (map == null) {
    return;
  }

  lastCrashReporterAttributes = map;

  try {
    let client = explicitBacktraceClient;

    if (!client) {
      const resolved = resolveBacktraceClient();

      if (resolved.present) {
        if (!resolved.client) {
          warnBacktraceNotInitializedOnce();
        } else {
          warnBacktraceVersionOnce(resolved.version);
        }
      }

      client = resolved.client;
    }

    if (client && typeof client.addAttribute === 'function') {
      client.addAttribute({ ...map });
    }
  } catch (error) {
    logCrashReporterPushFailureOnce(error);
  }
}

/**
 * Subscribes to the native sink forwarding before a session can start, so
 * the very first snapshot (pushed synchronously at session start) is not lost.
 */
function installCrashReporterAttributesSubscription() {
  if (crashReporterAttributesSubscription) {
    return;
  }

  crashReporterAttributesSubscription = getNativeEventEmitter().addListener(
    CRASH_REPORTER_ATTRIBUTES_EVENT,
    event => {
      pushCrashReporterAttributes(event ? event.attributes : null);
    },
  );
}

/**
 * Closes the startup race where the native sink fired before the JavaScript
 * listener was attached (for example after a JavaScript reload while the
 * native session kept running): pull the last native snapshot and re-apply it.
 * The sink contract allows the same map to be received twice.
 */
function pullCrashReporterAttributes(bridge) {
  if (typeof bridge.getCrashReporterAttributes !== 'function') {
    return;
  }

  Promise.resolve()
    .then(() => bridge.getCrashReporterAttributes())
    .then(attributes => {
      if (attributes) {
        pushCrashReporterAttributes(attributes);
      }
    })
    .catch(logCrashReporterPushFailureOnce);
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

    const bridge = getNativeBridge();

    // Subscribe before the native begin: the native sink pushes the first
    // snapshot synchronously while the session starts.
    installCrashReporterAttributesSubscription();

    bridge.beginWithoutCrashHandler(appToken, normalizeBeginOptions(options));

    pullCrashReporterAttributes(bridge);
  }

  /**
   * Returns the correlation id of the current Sauce Mobile Beta session, or
   * null before the first session start. The SDK generates a new lowercase
   * UUID v4 at every session start and attaches it to the session as
   * sauce.correlation_id; the same value is written to Backtrace.
   */
  static getSessionCorrelationId() {
    return getNativeBridge().getSessionCorrelationId();
  }

  /**
   * Links a Backtrace client explicitly. Backtrace is linked automatically:
   * the package writes the SDK-managed attributes (sauce.correlation_id,
   * sauce.mobile_beta.session_started, sauce.mobile_beta.session_url,
   * sauce.sdk.coexistence_mode, sauce.release, sauce.dist) to
   * require('@backtrace/react-native').BacktraceClient.instance at every
   * session start and on every start response. Call this only when the client
   * is wrapped behind your own module or the package manager does not let this
   * package resolve @backtrace/react-native (strict pnpm or Yarn PnP layouts).
   * The client needs addAttribute(map).
   *
   * Pass null to restore the automatic link. Either way the current snapshot
   * is replayed to the client that is now current, and the hand-off is armed
   * so a session started natively, or a Backtrace client initialized after
   * begin, still receives it.
   */
  static setBacktraceClient(client) {
    if (client != null && typeof client.addAttribute !== 'function') {
      throw new TypeError(
        'setBacktraceClient expects a Backtrace client (an object with addAttribute) or null.',
      );
    }

    explicitBacktraceClient = client || null;

    if (lastCrashReporterAttributes) {
      pushCrashReporterAttributes(lastCrashReporterAttributes);
    }

    try {
      const bridge = getNativeBridge();
      installCrashReporterAttributesSubscription();
      pullCrashReporterAttributes(bridge);
    } catch (error) {
      logCrashReporterPushFailureOnce(error);
    }
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
    register(
      SESSION_EVENTS.sessionCorrelationIdChanged,
      listener.onSessionCorrelationIdChanged,
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
