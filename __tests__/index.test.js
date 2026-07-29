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
  getVersion: jest.fn(() => Promise.resolve('2.0.0')),
};

jest.mock(
  'react-native',
  () => ({
    NativeModules: {
      TestFairyBridge: mockNativeBridge,
    },

    NativeEventEmitter: class NativeEventEmitter {
      addListener(eventName, callback) {
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
    });

    expect(onSessionStarted).toHaveBeenCalledWith({
      sessionUrl: 'https://example/session',
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
        'started',
        'stopped',
      ].sort(),
    );
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
