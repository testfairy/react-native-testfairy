'use strict';

const mockListeners = new Map();

const mockNativeBridge = {
  sdkName: 'SauceMobileBeta',
  crashReportingAvailable: false,
  coexistenceMode: 'backtrace_crash_owner',

  beginWithoutCrashHandler: jest.fn(),
  installFeedbackHandler: jest.fn(),
  uninstallFeedbackHandler: jest.fn(),
  setCorrelationId: jest.fn(),
  identify: jest.fn(),
  takeScreenshot: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  checkpoint: jest.fn(),
  sendUserFeedback: jest.fn(),
  hideView: jest.fn(),
  hideViewWithNativeId: jest.fn(),
  hideWebViewElements: jest.fn(),
  setServerEndpoint: jest.fn(),
  log: jest.fn(),
  setScreenName: jest.fn(),
  stop: jest.fn(),
  setUserId: jest.fn(),
  setAttribute: jest.fn(),
  pushFeedbackController: jest.fn(),
  showFeedbackForm: jest.fn(),
  enableCrashHandler: jest.fn(),
  disableCrashHandler: jest.fn(),
  enableMetric: jest.fn(),
  disableMetric: jest.fn(),
  enableVideo: jest.fn(),
  disableVideo: jest.fn(),
  enableFeedbackForm: jest.fn(),
  disableFeedbackForm: jest.fn(),
  disableAutoUpdate: jest.fn(),
  setMaxSessionLength: jest.fn(),
  logException: jest.fn(),
  setFeedbackOptions: jest.fn(),
  attachFile: jest.fn(() => Promise.resolve()),
  addNetworkEvent: jest.fn(),
  getSessionUrl: jest.fn(() => Promise.resolve('https://example/session')),
  getSessionCorrelationId: jest.fn(() =>
    Promise.resolve('0b8f7c1e-2d3a-4b5c-8d6e-7f8091a2b3c4'),
  ),
  getCrashReporterAttributes: jest.fn(() => Promise.resolve(null)),
  getVersion: jest.fn(() => Promise.resolve('2.0.0')),
};

// Optional dependency: the package never lists @backtrace/react-native, so the
// module is virtual here. The factory re-runs after jest.resetModules(), which
// lets a test simulate the module being absent.
const mockBacktraceAddAttribute = jest.fn();
let mockBacktraceModuleAvailable = true;
let mockBacktraceInstance = { addAttribute: mockBacktraceAddAttribute };
let mockBacktraceVersion = '0.2.3-rc';
const mockAddListenerCalls = new Map();

jest.mock(
  '@backtrace/react-native',
  () => {
    if (!mockBacktraceModuleAvailable) {
      throw new Error("Cannot find module '@backtrace/react-native'");
    }

    return {
      BacktraceClient: {
        get instance() {
          return mockBacktraceInstance;
        },
      },
    };
  },
  { virtual: true },
);

jest.mock(
  '@backtrace/react-native/package.json',
  () => ({
    get version() {
      return mockBacktraceVersion;
    },
  }),
  { virtual: true },
);

jest.mock(
  'react-native',
  () => ({
    NativeModules: {
      TestFairyBridge: mockNativeBridge,
    },

    NativeEventEmitter: class NativeEventEmitter {
      addListener(eventName, callback) {
        mockAddListenerCalls.set(eventName, (mockAddListenerCalls.get(eventName) || 0) + 1);
        mockListeners.set(eventName, callback);

        return {
          remove() {
            mockListeners.delete(eventName);
          },
        };
      }
    },

    findNodeHandle: jest.fn(() => 42),
  }),
  { virtual: true },
);

jest.mock(
  'react-native/package.json',
  () => ({
    version: '0.72.4',
  }),
  { virtual: true },
);

const TestFairy = require('../index');

describe('Sauce Mobile Beta React Native', () => {
  beforeEach(() => {
    mockListeners.clear();
    jest.clearAllMocks();
  });

  test('begin uses the explicit crashless native API', () => {
    const options = {
      enableCrashReporter: true,
      enableVideo: false,
    };

    TestFairy.begin('token', options);

    expect(mockNativeBridge.beginWithoutCrashHandler).toHaveBeenCalledWith('token', {
      enableCrashReporter: false,
      enableVideo: false,
      'react-native-version': '0.72.4',
    });

    // The caller's options object must not be mutated.
    expect(options).toEqual({
      enableCrashReporter: true,
      enableVideo: false,
    });
  });

  test('beginWithoutCrashHandler rejects an empty token', () => {
    expect(() => {
      TestFairy.beginWithoutCrashHandler('');
    }).toThrow('appToken must be a non-empty string');
  });

  test('setServerEndpoint forwards the URL and rejects an empty value', () => {
    TestFairy.setServerEndpoint('https://example.test/services/');
    expect(mockNativeBridge.setServerEndpoint).toHaveBeenCalledWith(
      'https://example.test/services/',
    );
    expect(() => TestFairy.setServerEndpoint('')).toThrow(
      'url must be a non-empty string',
    );
    expect(() => TestFairy.setServerEndpoint(undefined)).toThrow(TypeError);
  });

  test('reports that crash reporting is unavailable', () => {
    expect(TestFairy.isCrashReportingAvailable()).toBe(false);

    expect(TestFairy.getIntegrationInfo()).toEqual({
      sdkName: 'SauceMobileBeta',
      crashReportingAvailable: false,
      coexistenceMode: 'backtrace_crash_owner',
    });
  });

  test('preserves deprecated crash API calls as native no-ops', () => {
    TestFairy.enableCrashHandler();
    TestFairy.disableCrashHandler();

    expect(mockNativeBridge.enableCrashHandler).toHaveBeenCalledTimes(1);
    expect(mockNativeBridge.disableCrashHandler).toHaveBeenCalledTimes(1);
  });

  test('addEvent and deprecated checkpoint share the native checkpoint call', () => {
    TestFairy.addEvent('purchase');
    TestFairy.checkpoint('signup');

    expect(mockNativeBridge.checkpoint).toHaveBeenNthCalledWith(1, 'purchase');
    expect(mockNativeBridge.checkpoint).toHaveBeenNthCalledWith(2, 'signup');
  });

  test('serializes circular log objects safely', () => {
    const value = { name: 'root' };
    value.self = value;

    TestFairy.log(value);

    expect(mockNativeBridge.log).toHaveBeenCalledWith(
      '{"name":"root","self":"[Circular]"}',
    );
  });

  test('hideView routes strings to nativeID and refs to tags', () => {
    TestFairy.hideView('secret-field');
    expect(mockNativeBridge.hideViewWithNativeId).toHaveBeenCalledWith('secret-field');

    TestFairy.hideView(7);
    expect(mockNativeBridge.hideView).toHaveBeenCalledWith(7);

    TestFairy.hideView({ fake: 'ref' });
    expect(mockNativeBridge.hideView).toHaveBeenCalledWith(42);
  });

  test('exposes session-state events with removable subscriptions', () => {
    const onSessionStarted = jest.fn();

    const subscription = TestFairy.addSessionStateListener({
      onSessionStarted,
    });

    mockListeners.get('SauceMobileBetaSessionStarted')({
      sessionUrl: 'https://example/session',
      correlationId: '0b8f7c1e-2d3a-4b5c-8d6e-7f8091a2b3c4',
    });

    expect(onSessionStarted).toHaveBeenCalledWith({
      sessionUrl: 'https://example/session',
      correlationId: '0b8f7c1e-2d3a-4b5c-8d6e-7f8091a2b3c4',
    });

    subscription.remove();

    expect(mockListeners.has('SauceMobileBetaSessionStarted')).toBe(false);
  });

  test('session events cover exactly the platform-supported set', () => {
    expect(Object.keys(TestFairy.SESSION_EVENTS).sort()).toEqual(
      [
        'autoUpdateAvailable',
        'autoUpdateDismissed',
        'autoUpdateDownloadFailed',
        'autoUpdateDownloadStarted',
        'failed',
        'lengthReached',
        'noAutoUpdateAvailable',
        'sessionCorrelationIdChanged',
        'started',
        'stopped',
      ].sort(),
    );
  });

  test('forwards the session correlation id change to the listener', () => {
    const onSessionCorrelationIdChanged = jest.fn();

    TestFairy.addSessionStateListener({ onSessionCorrelationIdChanged });

    mockListeners.get('SauceMobileBetaSessionCorrelationIdChanged')({
      correlationId: '0b8f7c1e-2d3a-4b5c-8d6e-7f8091a2b3c4',
    });

    expect(onSessionCorrelationIdChanged).toHaveBeenCalledWith({
      correlationId: '0b8f7c1e-2d3a-4b5c-8d6e-7f8091a2b3c4',
    });
  });

  test('getSessionCorrelationId resolves the native value', async () => {
    await expect(TestFairy.getSessionCorrelationId()).resolves.toBe(
      '0b8f7c1e-2d3a-4b5c-8d6e-7f8091a2b3c4',
    );

    expect(mockNativeBridge.getSessionCorrelationId).toHaveBeenCalledTimes(1);
  });

  test('returns session URL and version', async () => {
    await expect(TestFairy.getSessionUrl()).resolves.toBe(
      'https://example/session',
    );

    await expect(TestFairy.getVersion()).resolves.toBe('2.0.0');
  });

  test('sessionUrl and version compatibility aliases support callbacks', async () => {
    const callback = jest.fn();

    await TestFairy.sessionUrl(callback);
    expect(callback).toHaveBeenCalledWith(null, 'https://example/session');

    const versionCallback = jest.fn();
    await TestFairy.version(versionCallback);
    expect(versionCallback).toHaveBeenCalledWith(null, '2.0.0');
  });

  test('attachFile forwards the MIME type', async () => {
    await TestFairy.attachFile('log.txt', 'content', 'text/plain');

    expect(mockNativeBridge.attachFile).toHaveBeenCalledWith(
      'log.txt',
      'content',
      'text/plain',
    );
  });

  test('network logging wraps and restores a custom fetch target', async () => {
    const responses = {
      status: 200,
      headers: null,
      clone: null,
    };

    const originalFetch = jest.fn(() => Promise.resolve(responses));
    const target = { fetch: originalFetch };

    TestFairy.enableNetworkLogging(target);

    await target.fetch('https://api.example.com/data', { method: 'POST', body: 'x' });

    // Allow the telemetry promise chain to flush.
    await new Promise(resolve => setImmediate(resolve));

    expect(originalFetch).toHaveBeenCalledTimes(1);
    expect(mockNativeBridge.addNetworkEvent).toHaveBeenCalledWith(
      'https://api.example.com/data',
      'POST',
      200,
      expect.any(Number),
      expect.any(Number),
      1,
      0,
      null,
      null,
      null,
      null,
      null,
    );

    TestFairy.disableNetworkLogging(target);
    expect(target.fetch).toBe(originalFetch);
  });
});

// These tests depend on module-level state (the internal subscription and the
// registered handler), so each one loads a fresh copy of the package.
describe('Backtrace crash-reporter attribute hand-off', () => {
  const ATTRIBUTES_EVENT = 'SauceMobileBetaCrashReporterAttributes';

  const snapshot = {
    'sauce.correlation_id': '0b8f7c1e-2d3a-4b5c-8d6e-7f8091a2b3c4',
    'sauce.mobile_beta.session_started': 'false',
    'sauce.mobile_beta.session_url': '',
    'sauce.sdk.coexistence_mode': 'backtrace_crash_owner',
    'sauce.release': 'com.example.app@1.2.3',
    'sauce.dist': '456',
  };

  let FreshTestFairy;

  const flushPromises = () => new Promise(resolve => setImmediate(resolve));

  beforeEach(() => {
    jest.resetModules();
    mockListeners.clear();
    mockAddListenerCalls.clear();
    jest.clearAllMocks();

    mockBacktraceModuleAvailable = true;
    mockBacktraceInstance = { addAttribute: mockBacktraceAddAttribute };
    mockBacktraceVersion = '0.2.3-rc';

    FreshTestFairy = require('../index');
  });

  test('installs the internal subscription once across repeated begin calls', () => {
    FreshTestFairy.beginWithoutCrashHandler('token');
    FreshTestFairy.beginWithoutCrashHandler('token');
    FreshTestFairy.setBacktraceClient(null);

    expect(mockAddListenerCalls.get(ATTRIBUTES_EVENT)).toBe(1);
  });

  test('setBacktraceClient(null) replays the last snapshot to BacktraceClient.instance and arms the hand-off', async () => {
    const addAttribute = jest.fn();
    FreshTestFairy.setBacktraceClient({ addAttribute });
    FreshTestFairy.beginWithoutCrashHandler('token');
    mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });
    expect(addAttribute).toHaveBeenCalledTimes(1);
    expect(mockBacktraceAddAttribute).not.toHaveBeenCalled();

    FreshTestFairy.setBacktraceClient(null);

    expect(mockBacktraceAddAttribute).toHaveBeenCalledWith(snapshot);
    expect(addAttribute).toHaveBeenCalledTimes(1);

    // Linking before any begin still subscribes and pulls the native snapshot.
    jest.resetModules();
    mockListeners.clear();
    const Later = require('../index');
    Later.setBacktraceClient(null);
    await flushPromises();
    expect(mockListeners.has(ATTRIBUTES_EVENT)).toBe(true);
    expect(mockNativeBridge.getCrashReporterAttributes).toHaveBeenCalled();
  });

  test('warns once when @backtrace/react-native is installed but not initialized', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockBacktraceInstance = undefined;

    FreshTestFairy.beginWithoutCrashHandler('token');
    const deliver = () => mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });

    expect(deliver).not.toThrow();
    expect(deliver).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('BacktraceClient.instance is not set');
    warn.mockRestore();
  });

  test('does not warn when @backtrace/react-native is not installed or a client is linked explicitly', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockBacktraceModuleAvailable = false;
    FreshTestFairy.beginWithoutCrashHandler('token');
    mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });

    mockBacktraceModuleAvailable = true;
    mockBacktraceInstance = undefined;
    FreshTestFairy.setBacktraceClient({ addAttribute: jest.fn() });
    mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test('warns once when @backtrace/react-native is older than 0.2.3, not for 0.2.3-rc', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    FreshTestFairy.beginWithoutCrashHandler('token');
    mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });
    expect(warn).not.toHaveBeenCalled();

    jest.resetModules();
    mockListeners.clear();
    mockBacktraceVersion = '0.2.2';
    const Older = require('../index');
    Older.beginWithoutCrashHandler('token');
    mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });
    mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });

    expect(mockBacktraceAddAttribute).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('0.2.2');
    warn.mockRestore();
  });

  test('installs the internal subscription before calling native begin', () => {
    let subscribedAtNativeBegin = null;

    mockNativeBridge.beginWithoutCrashHandler.mockImplementationOnce(() => {
      subscribedAtNativeBegin = mockListeners.has(ATTRIBUTES_EVENT);
    });

    expect(mockListeners.has(ATTRIBUTES_EVENT)).toBe(false);

    FreshTestFairy.beginWithoutCrashHandler('token');

    expect(subscribedAtNativeBegin).toBe(true);
    expect(mockNativeBridge.beginWithoutCrashHandler).toHaveBeenCalledTimes(1);
  });

  test('pushes the native snapshot to BacktraceClient.instance by default', () => {
    FreshTestFairy.beginWithoutCrashHandler('token');

    mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });

    expect(mockBacktraceAddAttribute).toHaveBeenCalledTimes(1);
    expect(mockBacktraceAddAttribute).toHaveBeenCalledWith(snapshot);
  });

  test('an explicitly linked client overrides BacktraceClient.instance', () => {
    const addAttribute = jest.fn();

    FreshTestFairy.setBacktraceClient({ addAttribute });
    FreshTestFairy.beginWithoutCrashHandler('token');

    mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });

    expect(addAttribute).toHaveBeenCalledWith(snapshot);
    expect(mockBacktraceAddAttribute).not.toHaveBeenCalled();

    // Unlinking falls back to BacktraceClient.instance again.
    FreshTestFairy.setBacktraceClient(null);

    mockListeners.get(ATTRIBUTES_EVENT)({
      attributes: { ...snapshot, 'sauce.mobile_beta.session_started': 'true' },
    });

    expect(addAttribute).toHaveBeenCalledTimes(1);
    expect(mockBacktraceAddAttribute).toHaveBeenCalledWith({
      ...snapshot,
      'sauce.mobile_beta.session_started': 'true',
    });
  });

  test('replays the last snapshot to a client linked late', () => {
    FreshTestFairy.beginWithoutCrashHandler('token');
    mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });

    const addAttribute = jest.fn();
    FreshTestFairy.setBacktraceClient({ addAttribute });

    expect(addAttribute).toHaveBeenCalledWith(snapshot);
  });

  test('rejects a client without addAttribute', () => {
    expect(() => {
      FreshTestFairy.setBacktraceClient('not-a-client');
    }).toThrow(TypeError);
    expect(() => {
      FreshTestFairy.setBacktraceClient({});
    }).toThrow(TypeError);
  });

  test('does not throw when @backtrace/react-native is not installed', () => {
    mockBacktraceModuleAvailable = false;

    FreshTestFairy.beginWithoutCrashHandler('token');

    expect(() => {
      mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });
    }).not.toThrow();

    expect(mockBacktraceAddAttribute).not.toHaveBeenCalled();
  });

  test('does not throw when Backtrace has not been initialized yet', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockBacktraceInstance = undefined;

    FreshTestFairy.beginWithoutCrashHandler('token');

    expect(() => {
      mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });
    }).not.toThrow();
    warn.mockRestore();
  });

  test('does not throw when the linked client throws, and warns once', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    FreshTestFairy.setBacktraceClient({
      addAttribute() {
        throw new Error('client failure');
      },
    });
    FreshTestFairy.beginWithoutCrashHandler('token');

    const deliver = () => mockListeners.get(ATTRIBUTES_EVENT)({ attributes: snapshot });

    expect(deliver).not.toThrow();
    expect(deliver).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('pulls the native snapshot after begin to close the startup race', async () => {
    mockNativeBridge.getCrashReporterAttributes.mockImplementationOnce(() =>
      Promise.resolve(snapshot),
    );

    FreshTestFairy.beginWithoutCrashHandler('token');

    await flushPromises();

    expect(mockNativeBridge.getCrashReporterAttributes).toHaveBeenCalledTimes(1);
    expect(mockBacktraceAddAttribute).toHaveBeenCalledWith(snapshot);
  });

  test('the post-begin pull is a no-op before the first session start', async () => {
    FreshTestFairy.beginWithoutCrashHandler('token');

    await flushPromises();

    expect(mockNativeBridge.getCrashReporterAttributes).toHaveBeenCalledTimes(1);
    expect(mockBacktraceAddAttribute).not.toHaveBeenCalled();
  });

  test('stringifies values and drops null attributes before pushing', () => {
    FreshTestFairy.beginWithoutCrashHandler('token');

    mockListeners.get(ATTRIBUTES_EVENT)({
      attributes: { 'sauce.dist': 456, 'sauce.release': null },
    });

    expect(mockBacktraceAddAttribute).toHaveBeenCalledWith({ 'sauce.dist': '456' });
  });
});
