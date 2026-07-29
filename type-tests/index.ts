import TestFairy = require('@saucelabs/mobile-beta-react-native');

TestFairy.beginWithoutCrashHandler('token', {
  enableCrashReporter: false,
  enableVideo: false,
  maxSessionLength: 600,
});

TestFairy.begin('token');

TestFairy.setCorrelationId('correlation-id');
TestFairy.setUserId('user-123');
TestFairy.setAttribute('sauce.sdk.coexistence_mode', 'backtrace_crash_owner');

const listener = TestFairy.addSessionStateListener({
  onSessionStarted({ sessionUrl }) {
    console.log(sessionUrl);
  },

  onSessionFailed() {
    console.log('session failed');
  },

  onAutoUpdateDownloadFailed() {
    console.log('android-only auto update failure');
  },
});

listener.remove();

const events: string = TestFairy.SESSION_EVENTS.started;
console.log(events);

TestFairy.enableCrashHandler();
TestFairy.disableCrashHandler();

TestFairy.hideView('nativeId');
TestFairy.hideView(42);

TestFairy.setFeedbackOptions({
  defaultText: 'Feedback please',
  isEmailMandatory: false,
  browserUrl: 'https://example.com',
});

TestFairy.enableNetworkLogging({ includeHeaders: false });
TestFairy.enableNetworkLogging(
  { fetch: (_input: unknown) => Promise.resolve({}) },
  { includeBodies: false },
);
TestFairy.disableNetworkLogging();

void TestFairy.getSessionUrl();
void TestFairy.getVersion();
void TestFairy.attachFile('diagnostics.txt', 'contents', 'text/plain');

const info = TestFairy.getIntegrationInfo();
console.log(info.sdkName, info.crashReportingAvailable, info.coexistenceMode);
