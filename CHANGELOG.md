# Changelog

## 3.1.0

First general availability release.

The SDK now owns the whole Backtrace coexistence contract: a new `sauce.correlation_id` is generated at every session start (one launch can contain several sessions: stop/resume, background, session length reached, update prompt), attached to that session, and handed to Backtrace together with the other managed attributes. Apps no longer generate a UUID or mirror the session URL. Native SDK pins: iOS 2.3.0, Android 2.3.0 (`sauceMobileBetaNative`; the vendored `local-native/` binaries are re-vendored from the published 2.3.0 bytes before tagging, and `scripts/validate-package.sh` now fails when they do not match the pins).

- New `getSessionCorrelationId(): Promise<string | null>` (null before the first session start).
- Backtrace is linked automatically: the package writes the SDK-managed attributes (`sauce.correlation_id`, `sauce.mobile_beta.session_started`, `sauce.mobile_beta.session_url`, `sauce.sdk.coexistence_mode`, `sauce.release`, `sauce.dist`) to `BacktraceClient.instance.addAttribute(map)` from `@backtrace/react-native` at every session start and on every start response (optional require, never throws). New `setBacktraceClient(client | null)` links a client explicitly when it is wrapped behind your own module or Metro does not resolve optional dependencies. `@backtrace/react-native` 0.2.3 or later is required for the values to reach native crash reports; 0.2.2 does not forward `addAttribute` to its native crash reporter.
- The native bridges register the SDK's internal attribute sink (`TestFairySPI.h` on iOS, `SauceMobileBetaInternals` on Android); that seam is not an app API.
- The package warns once when `@backtrace/react-native` is installed but `BacktraceClient.instance` is not set at the first session start, and once when the installed version is older than 0.2.3 (native crash reports would miss the attributes). `@backtrace/react-native` is declared as an optional peer dependency so strict package layouts (pnpm, Yarn PnP) can resolve it.
- `setBacktraceClient(null)` replays the current snapshot to `BacktraceClient.instance`, and `setBacktraceClient` arms the hand-off, so a session started natively or a Backtrace client initialized after `begin` still receives it.
- iOS bridge: a single process-wide session-state delegate forwards to the active bridge instance; previously every JavaScript reload registered another bridge instance with the SDK, which leaked it and duplicated session events.
- iOS deployment target 13.0 (the vendored native SDK requires it; the podspec said 12.0).
- New session-state callback `onSessionCorrelationIdChanged({ correlationId })` and `SESSION_EVENTS.sessionCorrelationIdChanged`; the `onSessionStarted` payload gains `correlationId`.
- `setAttribute` on an SDK-managed key (`sauce.correlation_id`, `sauce.mobile_beta.session_started`, `sauce.mobile_beta.session_url`) is ignored by the native SDK with one warning per key.
- iOS bridge: the native sink is registered once per process and forwards to the active bridge instance; `stopObserving` no longer calls `setSessionStateDelegate:nil` (that API adds delegates, it never removed one).
- Example app: Backtrace `^0.2.3-rc` (the `rc` dist-tag until Backtrace publishes 0.2.3 as stable), UUID generation and the session listener removed, "Stop and resume session", "Native crash" and "JS crash" buttons added.

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
