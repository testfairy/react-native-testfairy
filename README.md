# Sauce Mobile Beta for React Native

Sauce Mobile Beta SDK, formerly TestFairy SDK, provides beta-session, feedback, screenshot, remote-logging, and tester-workflow features for React Native applications. This package is designed to coexist with Backtrace Error Reporting.

## Crash ownership

**Backtrace is the sole JavaScript and native crash owner.**

The native Sauce Mobile Beta dependencies are crashless:

- iOS: `SauceMobileBeta` (runtime module stays `TestFairy`)
- Android: `com.saucelabs.mobilebeta:sauce-mobile-beta-android` (runtime package stays `com.testfairy`)

The JavaScript and native runtime APIs remain TestFairy-compatible.

## Installation

```bash
npm install @saucelabs/mobile-beta-react-native
```

iOS:

```bash
cd ios && pod install
```

Android: add the Sauce Mobile Beta Maven repository if the native artifact is not on Maven Central:

```kotlin
// settings.gradle(.kts)
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()

        maven {
            url = uri("https://maven.testfairy.com")
            content { includeGroup("com.saucelabs.mobilebeta") }
        }
    }
}
```

## Basic usage

```js
import TestFairy from '@saucelabs/mobile-beta-react-native';

TestFairy.setServerEndpoint('<server-endpoint>');
TestFairy.beginWithoutCrashHandler('<sauce-mobile-beta-token>');
```

Both values come from your Mobile App Distribution dashboard, Organization Settings, SDK Settings. The native SDKs' built-in default server is no longer in service, so `setServerEndpoint` is required before `beginWithoutCrashHandler`; an app that skips it starts no sessions.

`begin(...)` is also crashless in this package, but
`beginWithoutCrashHandler(...)` is recommended because it makes Backtrace crash ownership explicit.

## Backtrace coexistence

Two steps: initialize Backtrace first, then start Sauce Mobile Beta. The SDK generates a new `sauce.correlation_id` at every session start, attaches it to the session, and writes it (with `sauce.mobile_beta.session_started`, `sauce.mobile_beta.session_url`, `sauce.sdk.coexistence_mode`, `sauce.release`, `sauce.dist`) to `BacktraceClient.instance` from `@backtrace/react-native` (0.2.3 or later):

```ts
import { BacktraceClient } from '@backtrace/react-native';
import TestFairy from '@saucelabs/mobile-beta-react-native';

BacktraceClient.initialize(backtraceConfiguration);
TestFairy.setServerEndpoint('<server-endpoint>');
TestFairy.beginWithoutCrashHandler('<sauce-mobile-beta-token>');
```

No glue code is needed. `TestFairy.setBacktraceClient(client)` links a client explicitly when it is wrapped behind your own module or your Metro configuration does not resolve optional dependencies (`null` restores the automatic link). Do not set `sauce.correlation_id` yourself: one launch can contain several sessions and each gets its own id.
See [docs/backtrace-coexistence.md](docs/backtrace-coexistence.md) for the full guide and [example/src/observability.ts](example/src/observability.ts) for a working setup.

## Session state

```js
const subscription = TestFairy.addSessionStateListener({
  onSessionStarted({ sessionUrl, correlationId }) {
    console.log(sessionUrl, correlationId);
  },
  onSessionCorrelationIdChanged({ correlationId }) {
    console.log(correlationId); // new at every session start
  },
});

const correlationId = await TestFairy.getSessionCorrelationId(); // null before the first start

subscription.remove();
```

## Crash APIs

Retained for source compatibility but **no-ops** in Sauce Mobile Beta:

```js
TestFairy.enableCrashHandler();
TestFairy.disableCrashHandler();
```

Use Backtrace for crash testing and crash reporting.

## Package rename

This is a package/artifact rename only. The JavaScript class and native runtime API remain named `TestFairy`, and the native module remains `TestFairyBridge`.
Because of that, `react-native-testfairy` and `@saucelabs/mobile-beta-react-native` are mutually exclusive — never install both. See [MIGRATION.md](MIGRATION.md).

## Local development

The native SDK binaries are vendored under `local-native/` (tracked, and shipped in the npm tarball) — see `local-native/README.md` for the provenance table, the re-vendoring commands and the Podfile/Gradle wiring.

## Installing from a GitHub Release

Releases carry the npm tarball as a GitHub Release
asset, so no registry access is needed:

```bash
npm install https://github.com/testfairy/react-native-testfairy/releases/download/3.1.0/saucelabs-mobile-beta-react-native-3.1.0.tgz
cd ios && pod install
```

The package installs into `node_modules/@saucelabs/mobile-beta-react-native`
and autolinks exactly like a registry install. (Installing from the git tag —
`npm install github:testfairy/react-native-testfairy#3.1.0` — also works,
but pulls the whole repository instead of the validated tarball.)

## Repository location

This package is published from `https://github.com/testfairy/react-native-testfairy`. 
A Sauce-owned home, `saucelabs/mobile-beta-react-native`, becomes canonical once it exists publicly and package metadata will move with it.
