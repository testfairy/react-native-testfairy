# Vendored crashless native binaries

This directory holds the crashless Sauce Mobile Beta native artifacts consumed by the React Native bridge. 
It ships in the repository and in the npm package: the podspec vendors the xcframework and `android/build.gradle` registers `android/maven/` as a Maven repository, so apps need no extra native setup.
A future release will fetch these binaries dynamically instead of vendoring them: the pinned versions live in package.json under `sauceMobileBetaNative`.

## Contents

- `ios/TestFairy.xcframework` — crashless iOS artifact (module stays `TestFairy`), vendored by `SauceMobileBetaReactNative.podspec`.
- `android/maven/` — a local Maven repository containing `com.saucelabs.mobilebeta:sauce-mobile-beta-android:2.0.0` (AAR + POM + sources/javadoc), picked up automatically by `android/build.gradle`.

## Provenance

Record the source revision here whenever a binary is regenerated:

| Artifact | Version | Source repo | Revision |
| --- | --- | --- | --- |
| `ios/TestFairy.xcframework` | 2.0.0 | testfairy-ios-sdk | 75d461d (feature/SauceMobileAppDistribution) |
| `android/maven/.../2.0.0` | 2.0.0 | testfairy-android-sdk | 0f2b431e (feature/SauceMobileAppDistribution) |

## Regenerating

iOS (from `testfairy-ios-sdk`, requires Xcode). The version placeholder must be stamped before building. `TestFairy.getVersion()` returns the literal string `SDK_VERSION` otherwise:

```bash
sed -i '' 's|@"SDK_VERSION"|@"2.0.0"|' Husky/TestFairyConstants.h
make xcframework-crashless
rm -rf ../react-native-testfairy/local-native/ios/TestFairy.xcframework
cp -R build/Release-xcframework-crashless/TestFairy.xcframework \
  ../react-native-testfairy/local-native/ios/
git checkout -- Husky/TestFairyConstants.h
```

Android (from `testfairy-android-sdk`, requires JDK 11. run in a scratch worktree because the version placeholders are seded into tracked files):

```bash
sed -i '' 's|SET_ME|2.0.0|' sauce-mobile-beta-android/build.gradle tools/publish/publish-to-maven
sed -i '' 's|SDK_VERSION_TO_REPLACE|2.0.0|' core-commons/src/main/java/com/testfairy/Config.kt
tools/publish/build-mobile-beta-artifacts 2.0.0
tools/publish/verify-mobile-beta-publication 2.0.0 "$PWD/sauce-mobile-beta-android/build/test-maven"
cp -R sauce-mobile-beta-android/build/test-maven \
  ../react-native-testfairy/local-native/android/maven
```

Both artifacts must pass their crashless gates before use: the SDK repos' `tools/ci/validate-ios-crashless.sh` / `tools/ci/validate-android-crashless.sh` at generation time, and this repo's `scripts/validate-package.sh` (run by `prepack`) re-checks the shipped binaries at packaging time.
