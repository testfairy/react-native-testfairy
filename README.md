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

TestFairy.beginWithoutCrashHandler('<sauce-mobile-beta-token>');
```

`begin(...)` is also crashless in this package, but
`beginWithoutCrashHandler(...)` is recommended because it makes Backtrace crash ownership explicit.

## Backtrace coexistence

Initialize Backtrace first, then Sauce Mobile Beta, and give both the same correlation identifiers.
See [docs/backtrace-coexistence.md](docs/backtrace-coexistence.md) for the full guide and [example/src/observability.ts](example/src/observability.ts) for a working setup.

## Session state

```js
const subscription = TestFairy.addSessionStateListener({
  onSessionStarted({ sessionUrl }) {
    console.log(sessionUrl);
  },
});

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

Native dependencies can be consumed from locally built artifacts under `local-native/` (gitignored) — see `local-native/README.md` for regeneration commands and Podfile/Gradle wiring.
