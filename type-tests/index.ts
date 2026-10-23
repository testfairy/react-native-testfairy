import TestFairy = require('@saucelabs/mobile-beta-react-native');

TestFairy.beginWithoutCrashHandler('token', {
  enableCrashReporter: false,
  enableVideo: false,
  maxSessionLength: 600,
});

TestFairy.begin('token');

TestFairy.setCorrelationId('correlation-id');
TestFairy.setUserId('user-123');
TestFairy.setAttribute('sauce.environment', 'beta');

// Backtrace is linked automatically through BacktraceClient.instance; the
// explicit link takes any object with addAttribute(map), null restores it.
TestFairy.setBacktraceClient({
  addAttribute(attributes) {
    const correlationId: string | undefined = attributes['sauce.correlation_id'];
    console.log(correlationId, attributes['sauce.mobile_beta.session_url']);
  },
});
TestFairy.setBacktraceClient(null);

const listener = TestFairy.addSessionStateListener({
  onSessionStarted({ sessionUrl, correlationId }) {
    console.log(sessionUrl, correlationId);
  },

  onSessionCorrelationIdChanged({ correlationId }) {
    const id: string = correlationId;
    console.log(id);
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
const correlationEvent: string =
  TestFairy.SESSION_EVENTS.sessionCorrelationIdChanged;
console.log(events, correlationEvent);

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
void TestFairy.getSessionCorrelationId().then((id: string | null) => id);
void TestFairy.getVersion();
void TestFairy.attachFile('diagnostics.txt', 'contents', 'text/plain');

const info = TestFairy.getIntegrationInfo();
console.log(info.sdkName, info.crashReportingAvailable, info.coexistenceMode);
