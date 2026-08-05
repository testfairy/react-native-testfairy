# Using Sauce Mobile Beta with Backtrace React Native

Sauce Mobile Beta and Backtrace run side by side in a React Native application.

## Ownership

Backtrace owns:

- JavaScript unhandled errors and unhandled promise rejections
- iOS native crashes
- Android JVM crashes
- Android native crashes when enabled

Sauce Mobile Beta owns:

- beta sessions, tester feedback, screenshots, remote logs, session events, and tester workflow context

Sauce Mobile Beta is crashless.

## Initialization order

```ts
const backtrace = BacktraceClient.initialize(backtraceConfiguration);

TestFairy.setCorrelationId(correlationId);
TestFairy.beginWithoutCrashHandler(sauceMobileBetaToken);
```

## Correlation attributes

Set the same values in both systems:

```
sauce.correlation_id
sauce.sdk.coexistence_mode   (always "backtrace_crash_owner")
sauce.environment
sauce.release
sauce.dist
mad.distribution_id
```

## Session URL

Subscribe before starting Sauce Mobile Beta; the session URL is asynchronous:

```ts
TestFairy.addSessionStateListener({
  onSessionStarted({ sessionUrl }) {
    if (sessionUrl) {
      backtrace.addAttribute({
        'sauce.mobile_beta.session_url': sessionUrl,
      });
    }
  },
});
```

See [../example/src/observability.ts](../example/src/observability.ts) for a complete working setup.

## Unsupported combinations

Do not:

- install `react-native-testfairy` alongside this package
- install legacy TestFairy native artifacts (`com.testfairy:testfairy-android-sdk`, `testfairy-android-ndk`, the `TestFairy` pod, or a bundled `libTestFairy.a`)
- call `enableCrashHandler()` expecting crash reports. it is a no-op

Backtrace is the only crash owner.
