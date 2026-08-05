# Migration from react-native-testfairy

## 1. Swap the package

```bash
npm uninstall react-native-testfairy
npm install @saucelabs/mobile-beta-react-native
```

iOS:

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

Clean native builds:

```bash
rm -rf ios/build
rm -rf android/.gradle android/build android/app/build
```

## 2. Update the import

```diff
-import TestFairy from 'react-native-testfairy';
+import TestFairy from '@saucelabs/mobile-beta-react-native';
```

The runtime API remains `TestFairy` — no other source changes are required.

## 3. Update initialization

```diff
-TestFairy.disableCrashHandler();
-TestFairy.begin(token);
+TestFairy.beginWithoutCrashHandler(token);
```

`begin(...)` is also crashless in this package, but the explicit API is recommended for Backtrace coexistence.
`enableCrashHandler()` / `disableCrashHandler()` remain callable and are native no-ops.

## 4. Android repository

Add the Maven repository for `com.saucelabs.mobilebeta` (see README) if the artifact is not on Maven Central. 
Remove any legacy `com.testfairy:testfairy-android-sdk` / `testfairy-android-ndk` dependencies.

## 5. Remove manual linking

React Native 0.60+ autolinks this package. 
Remove manually registered `TestFairyPackage` instances from `MainApplication` unless you are on a pre-autolinking React Native.

## Never install both package families

`react-native-testfairy` and `@saucelabs/mobile-beta-react-native` expose the same `TestFairyBridge` native module and duplicate the `com.testfairy` native classes.
Installing both causes duplicate-module registration and duplicate native symbols.
