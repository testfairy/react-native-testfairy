# Changelog

## 3.0.0-rc

First release under the `@saucelabs/mobile-beta-react-native` name, the major version marks the crashless, Backtrace-coexistence API change from the legacy `react-native-testfairy` 2.x line. Native SDK versions are pinned independently in `package json` (`sauceMobileBetaNative`: iOS 2.2.0-rc, Android 2.2.0-rc).

- Package renamed: `react-native-testfairy` to `@saucelabs/mobile-beta-react-native`.
- Native dependencies switched to the crashless Sauce Mobile Beta artifacts (iOS `SauceMobileBeta` 2.2.0-rc via SwiftPM / vendored xcframework, Android `com.saucelabs.mobilebeta:sauce-mobile-beta-android:2.2.0-rc` on maven.testfairy.com). Backtrace is the only crash handler.
- `begin()` is now crashless and delegates to the new `beginWithoutCrashHandler()`: `enableCrashHandler()`/`disableCrashHandler()` are retained as no-ops.
- New APIs: 
  `beginWithoutCrashHandler`, 
  `addSessionStateListener`,
  `getSessionUrl`/`getVersion` (promise-based),
  `getIntegrationInfo`,
  `isCrashReportingAvailable`,
   promise-based `attachFile` with MIME type.
- Legacy vendored binaries removed from the package (`ios/libTestFairy.a`, bundled `TestFairy.h`, `React-TestFairy.podspec`).
- JavaScript rewritten with input validation, safe log serialization, and restorable fetch instrumentation: full Jest/TypeScript/ESLint coverage.
