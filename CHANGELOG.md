# Changelog

## 2.0.0

- Package renamed: `react-native-testfairy` to `@saucelabs/mobile-beta-react-native`.
- Native dependencies switched to the crashless Sauce Mobile Beta artifacts (iOS pod `SauceMobileBeta` 2.0.0, Android `com.saucelabs.mobilebeta:sauce-mobile-beta-android` 2.0.0). Backtrace is the sole crash owner.
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
