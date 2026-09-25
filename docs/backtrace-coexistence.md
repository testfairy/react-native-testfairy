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
import 'react-native-get-random-values'; // must be imported before uuid on React Native
import { v4 as uuidv4 } from 'uuid';

const correlationId = uuidv4(); // lowercase UUID v4, once per app launch, before either SDK

const backtrace = BacktraceClient.initialize({
  ...backtraceConfiguration,
  userAttributes: { 'sauce.correlation_id': correlationId },
});

TestFairy.setAttribute('sauce.correlation_id', correlationId);
TestFairy.beginWithoutCrashHandler(sauceMobileBetaToken);
```

Do not use `setCorrelationId` or `identify` for this:
both are deprecated and write the user-identity field (the same one `setUserId` writes), so they would collide with a real user id. Keep `setUserId` for the actual user.

## Correlation attributes

Generate `sauce.correlation_id` once per app launch (lowercase UUID v4) before initializing either SDK, and set the same values in both systems:

```
sauce.correlation_id
sauce.sdk.coexistence_mode   (always "backtrace_crash_owner")
sauce.environment
sauce.release
sauce.dist
mad.distribution_id
```

## Session URL

Subscribe before starting Sauce Mobile Beta; the session URL is asynchronous.
One launch can produce several sessions (after `stop()`/resume), overwrite the attribute on every callback:

```ts
TestFairy.addSessionStateListener({
  onSessionStarted({ sessionUrl }) {
    backtrace.addAttribute({
      'sauce.mobile_beta.session_started': 'true',
      'sauce.mobile_beta.session_url': sessionUrl ?? '',
    });
  },
  onSessionFailed() {
    backtrace.addAttribute({ 'sauce.mobile_beta.session_started': 'false' });
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
