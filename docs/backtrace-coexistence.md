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
- the link between a Backtrace crash report and the Sauce Mobile Beta session recorded up to the crash

Sauce Mobile Beta is crashless.

## Initialization order

Three steps: initialize Backtrace, set the Sauce Mobile Beta server endpoint, then start Sauce Mobile Beta. The SDK owns the coexistence attributes and writes them to Backtrace itself.

```ts
import { BacktraceClient } from '@backtrace/react-native';
import TestFairy from '@saucelabs/mobile-beta-react-native';

// 1. Backtrace first: it is the crash owner.
BacktraceClient.initialize({
  url: backtraceSubmissionUrl,
  userAttributes: { 'sauce.environment': 'beta' }, // app-owned, optional
  database: { enable: true, captureNativeCrashes: true, createDatabaseDirectory: true, path: `${BacktraceClient.applicationDataPath}/backtrace` },
});

// 2. Server endpoint from Organization Settings, SDK Settings (the built-in default server is no longer in service).
TestFairy.setServerEndpoint(sauceMobileBetaEndpoint);

// 3. Start the session. The package links BacktraceClient.instance on its own.
TestFairy.beginWithoutCrashHandler(sauceMobileBetaToken);
```

The link is automatic: at every session start and on every start response the package calls `require('@backtrace/react-native').BacktraceClient.instance.addAttribute(map)` (an optional require that never throws). Link a client explicitly with `TestFairy.setBacktraceClient(client)` when Backtrace is wrapped behind your own module or your package manager does not let this package resolve `@backtrace/react-native` (strict pnpm or Yarn PnP layouts; it is declared as an optional peer dependency); `null` restores the automatic link and replays the current snapshot to `BacktraceClient.instance`.

Requirements: `@backtrace/react-native` 0.2.3 or later. Version 0.2.2 never forwards `addAttribute` after `initialize()` to its native crash reporter, so native crash reports would miss the attributes. Until 0.2.3 is published as stable, install the `rc` dist-tag (`^0.2.3-rc`).

Do not use `setCorrelationId` or `identify` for correlation: both are deprecated and write the user-identity field (the same one `setUserId` writes). Keep `setUserId` for the actual user.

## What the SDK sets automatically

| Key | Value | Sauce Mobile Beta session | Backtrace |
| --- | --- | --- | --- |
| `sauce.correlation_id` | lowercase UUID v4, new at every session start | yes | yes |
| `sauce.mobile_beta.session_started` | `"false"` at start, `"true"` once the server accepted the session, `"false"` on failure | no | yes |
| `sauce.mobile_beta.session_url` | `""` at start, the session URL once accepted | no | yes |
| `sauce.sdk.coexistence_mode` | `backtrace_crash_owner` | yes | yes |
| `sauce.release` | `<bundle id or package name>@<marketing version>` | no (the session already carries the version) | yes |
| `sauce.dist` | `CFBundleVersion` / `versionCode` | no | yes |

App-owned, optional: `sauce.environment` and `mad.distribution_id`. Set them with `TestFairy.setAttribute` and in the Backtrace `userAttributes`.

`sauce.correlation_id`, `sauce.mobile_beta.session_started` and `sauce.mobile_beta.session_url` are reserved: `setAttribute` on them is ignored by the native SDK with one warning per key, and the per-session value always wins in Backtrace.

### Why one id per session

A single launch can contain several Sauce Mobile Beta sessions: `stop()` followed by `resume()`, a foreground after a long background, the maximum session length reached, an update prompt dismissed. An id generated once per launch would be shared by all of them and a crash could be attributed to the wrong session. The SDK rotates the id at every session start, before the start request is built, so the id in the session and the id in the next crash report always designate the same session.

## How the link works

- The native SDK pushes the full snapshot (string keys and values) to the bridge synchronously on the thread that starts the session, and again on the start response; the package applies it with `addAttribute`, which overwrites, so every write is idempotent.
- The same map may be written more than once (for example after a JavaScript reload while the native session kept running, the package re-pulls the last snapshot right after `beginWithoutCrashHandler`).
- A client linked with `setBacktraceClient` after the session started receives the current snapshot at once.
- A client that throws is caught and logged once; the session is never affected.
- The package warns once when `@backtrace/react-native` is installed but `BacktraceClient.instance` is not set when the first snapshot arrives (initialize Backtrace before `beginWithoutCrashHandler`, or link the client with `setBacktraceClient`), and once when the installed version is older than 0.2.3.

## Reading the id

```ts
const subscription = TestFairy.addSessionStateListener({
  onSessionCorrelationIdChanged({ correlationId }) {
    console.log('new session', correlationId);
  },
  onSessionStarted({ sessionUrl, correlationId }) {
    console.log(sessionUrl, correlationId);
  },
});

const current = await TestFairy.getSessionCorrelationId(); // null before the first session start
```

## Finding a crash's session

Open the crash in Backtrace, copy `sauce.correlation_id`, and search the Sauce Mobile Beta sessions for that attribute value: exactly one session matches, the one recorded up to the crash. `sauce.mobile_beta.session_url` on the same report links to it directly when the start request had been accepted before the crash. Index `sauce.correlation_id` (UUID) and `sauce.mobile_beta.session_url` (string) once per Backtrace project.

See [../example/src/observability.ts](../example/src/observability.ts) for a complete working setup and [../example/src/App.tsx](../example/src/App.tsx) for the "Stop and resume session", "Native crash" and "JS crash" test buttons.

## Unsupported combinations

Do not:

- install `react-native-testfairy` alongside this package
- install legacy TestFairy native artifacts (`com.testfairy:testfairy-android-sdk`, `testfairy-android-ndk`, the `TestFairy` pod, or a bundled `libTestFairy.a`)
- call `enableCrashHandler()` expecting crash reports. it is a no-op
- generate your own `sauce.correlation_id` or mirror the session URL into Backtrace yourself: the SDK does both, per session

Backtrace is the only crash owner.
