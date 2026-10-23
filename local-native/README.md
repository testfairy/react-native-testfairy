# Vendored crashless native binaries

This directory holds the crashless Sauce Mobile Beta native artifacts consumed by the React Native bridge. 
It ships in the repository and in the npm package: the podspec vendors the xcframework and `android/build.gradle` registers `android/maven/` as a Maven repository, so apps need no extra native setup.
A future release will fetch these binaries dynamically instead of vendoring them: the pinned versions live in package.json under `sauceMobileBetaNative`.

## Contents

- `ios/TestFairy.xcframework` — crashless iOS artifact (module stays `TestFairy`), vendored by `SauceMobileBetaReactNative.podspec`.
- `android/maven/` — a local Maven repository containing `com.saucelabs.mobilebeta:sauce-mobile-beta-android:2.2.0-rc` (AAR + POM + sources/javadoc), picked up automatically by `android/build.gradle`.

**Pending re-vendor:** package.json pins `sauceMobileBetaNative` 2.3.0 (the per-session correlation id and the internal attribute sink entry points, `TestFairySPI.h` and `SauceMobileBetaInternals`, the bridges are written against), but the binaries in this directory are still 2.2.0-rc. Until the 2.3.0 artifacts are published and vendored here, the native bridges do not compile against these binaries and `android/build.gradle` resolves 2.3.0 from maven.testfairy.com instead of this directory. Re-vendor from the published 2.3.0 bytes and update the provenance table before tagging 3.1.0.

## Provenance

Record the source revision here whenever a binary is regenerated:

| Artifact | Version | Source repo | Revision |
| --- | --- | --- | --- |
| `ios/TestFairy.xcframework` | 2.2.0-rc | testfairy-ios-sdk | ae0fb53e (tag smb-2.2.0-rc; bytes = released S3 zip, sha256 c647a49f…) |
| `android/maven/.../2.2.0-rc` | 2.2.0-rc | testfairy-android-sdk | 25868780 (tag smb-2.2.0-rc; bytes = published maven.testfairy.com set) |
| (pending) `ios/TestFairy.xcframework` | 2.3.0 | testfairy-ios-sdk | tag smb-2.3.0, not yet published; re-vendor from the released S3 zip |
| (pending) `android/maven/.../2.3.0` | 2.3.0 | testfairy-android-sdk | tag smb-2.3.0, not yet published; re-vendor from the maven.testfairy.com set |

## Regenerating

Preferred source for a release: the published artifacts themselves (SwiftPM package and maven.testfairy.com : vendored bytes are identical to what native consumers get).
The manual builds below are for development only.

iOS (from `testfairy-ios-sdk`, requires Xcode). `make stamp-version` stamps `kSDKVersion`, `kGitRevision`, and the framework Info.plist (without it the binary ships the literal placeholders (`getVersion()` returns `SDK_VERSION`)):

```bash
make stamp-version VERSION=2.3.0
make dist/xcframework-crashless VERSION=2.3.0
rm -rf ../react-native-testfairy/local-native/ios/TestFairy.xcframework
cp -R build/Release-xcframework-crashless/TestFairy.xcframework \
  ../react-native-testfairy/local-native/ios/
git checkout -- Husky/TestFairyConstants.h TestFairySDK/Info.plist
```

Android (from `testfairy-android-sdk`, requires JDK 11. run in a scratch worktree because the version placeholders are seded into tracked files):

```bash
sed -i '' 's|SET_ME|2.3.0|' sauce-mobile-beta-android/build.gradle tools/publish/publish-to-maven
sed -i '' 's|SDK_VERSION_TO_REPLACE|2.3.0|' core-commons/src/main/java/com/testfairy/Config.kt
tools/publish/build-mobile-beta-artifacts 2.3.0
tools/publish/verify-mobile-beta-publication 2.3.0 "$PWD/sauce-mobile-beta-android/build/test-maven"
cp -R sauce-mobile-beta-android/build/test-maven \
  ../react-native-testfairy/local-native/android/maven
```

Both artifacts must pass their crashless gates before use: the SDK repos' `tools/ci/validate-ios-crashless.sh` / `tools/ci/validate-android-crashless.sh` at generation time, and this repo's `scripts/validate-package.sh` (run by `prepack`) re-checks the shipped binaries at packaging time.
