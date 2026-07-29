#!/usr/bin/env bash
#
# Validates that the renamed React Native package is crashless-by-construction:
# correct identity, no legacy TestFairy binaries or dependencies, and the
# Backtrace-coexistence entry point present at every layer.
set -euo pipefail

REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPOSITORY_ROOT}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

PACKAGE_NAME="$(node -p "require('./package.json').name")"

if [[ "${PACKAGE_NAME}" != "@saucelabs/mobile-beta-react-native" ]]; then
  fail "unexpected npm package name: ${PACKAGE_NAME}"
fi

if [[ -e ios/libTestFairy.a ]]; then
  fail "legacy ios/libTestFairy.a must not be shipped"
fi

if [[ -e ios/TestFairy.h ]]; then
  fail "legacy bundled TestFairy.h must not be shipped"
fi

if [[ -e React-TestFairy.podspec ]]; then
  fail "legacy React-TestFairy.podspec must not be shipped"
fi

if grep -R \
    --exclude-dir=node_modules \
    --exclude-dir=local-native \
    --exclude=MIGRATION.md \
    --exclude=CHANGELOG.md \
    -E 'com\.testfairy:testfairy-android-(sdk|ndk)' \
    android package.json SauceMobileBetaReactNative.podspec > /dev/null 2>&1; then
  fail "legacy Android TestFairy dependency found"
fi

if grep -R \
    --exclude-dir=node_modules \
    --exclude-dir=local-native \
    --exclude-dir=.git \
    --exclude=MIGRATION.md \
    --exclude=CHANGELOG.md \
    --exclude=validate-package.sh \
    -E 's\.dependency[[:space:]]+"TestFairy"' \
    . > /dev/null 2>&1; then
  fail "legacy crash-capable TestFairy CocoaPods dependency found"
fi

grep -q 's\.vendored_frameworks = "local-native/ios/TestFairy\.xcframework"' \
    SauceMobileBetaReactNative.podspec \
  || fail "podspec does not vendor the crashless xcframework"

grep -q 'com\.saucelabs\.mobilebeta.*sauce-mobile-beta-android' android/build.gradle \
  || fail "Android bridge does not depend on Sauce Mobile Beta"

grep -q 'beginWithoutCrashHandler' index.js \
  || fail "JavaScript API does not expose beginWithoutCrashHandler"

grep -q 'beginWithoutCrashHandler' ios/RCTTestFairyBridge.m \
  || fail "iOS bridge does not expose beginWithoutCrashHandler"

grep -q 'beginWithoutCrashHandler' \
    android/src/main/java/com/testfairy/react/TestFairyModule.java \
  || fail "Android bridge does not expose beginWithoutCrashHandler"

# ---------------------------------------------------------------------------
# Shipped native binaries. v1 vendors the crashless artifacts in local-native/
# (a future release fetches them dynamically), so the binaries themselves are
# re-gated here: no TestFairy / PLCrashReporter crash infrastructure may ship.
# These mirror the SDK repos' validate-{ios,android}-crashless.sh gates.
# ---------------------------------------------------------------------------

XCFRAMEWORK="local-native/ios/TestFairy.xcframework"
[[ -d "${XCFRAMEWORK}" ]] || fail "missing vendored iOS artifact: ${XCFRAMEWORK}"

IOS_FORBIDDEN='(_plcrash|PLCrash|TFCrashReportingFeature|TestFairyCrashManager|TFDefaultCrashManagerDelegate|TFImmediateCrashManagerDelegate|libCrashReporter)'
MACHO_COUNT=0
while IFS= read -r binary; do
  if ! file "${binary}" 2>/dev/null | grep -q 'Mach-O'; then
    continue
  fi
  MACHO_COUNT=$((MACHO_COUNT + 1))
  if nm "${binary}" 2>/dev/null | grep -Eq "${IOS_FORBIDDEN}"; then
    fail "crash-reporter symbols found in ${binary}"
  fi
  if strings "${binary}" 2>/dev/null | grep -Eq "${IOS_FORBIDDEN}"; then
    fail "crash-reporter strings found in ${binary}"
  fi
  # A binary built without stamping the release version reports the literal
  # placeholder from TestFairyConstants.h via getVersion().
  if strings "${binary}" 2>/dev/null | grep -qx 'SDK_VERSION'; then
    fail "unstamped SDK_VERSION placeholder in ${binary}"
  fi
done < <(find "${XCFRAMEWORK}" -type f)
[[ "${MACHO_COUNT}" -gt 0 ]] || fail "no Mach-O binaries found in ${XCFRAMEWORK}"

AAR="$(find local-native/android/maven -name 'sauce-mobile-beta-android-*.aar' \
  ! -name '*-sources.jar' ! -name '*-javadoc.jar' | head -1)"
[[ -n "${AAR}" && -f "${AAR}" ]] || fail "missing vendored Android AAR under local-native/android/maven"

AAR_TMP="$(mktemp -d)"
trap 'rm -rf "${AAR_TMP}"' EXIT
unzip -q "${AAR}" -d "${AAR_TMP}"

if find "${AAR_TMP}" -name '*.so' | grep -q 'libtestfairy'; then
  fail "TestFairy NDK crash library found in ${AAR}"
fi

[[ -f "${AAR_TMP}/classes.jar" ]] || fail "no classes.jar inside ${AAR}"
mkdir "${AAR_TMP}/classes"
unzip -q "${AAR_TMP}/classes.jar" -d "${AAR_TMP}/classes"

# Jar entries are DEFLATE-compressed: constant-pool strings are only visible
# after extraction. Only feature-crash's handler references this Thread API;
# proguard cannot rename it away.
if grep -rlq 'setDefaultUncaughtExceptionHandler' "${AAR_TMP}/classes"; then
  fail "setDefaultUncaughtExceptionHandler reference found in ${AAR}"
fi

if find "${AAR_TMP}/classes" -name 'NativeCrashHandler*.class' | grep -q .; then
  fail "NativeCrashHandler class found in ${AAR}"
fi

if grep -rq 'SDK_VERSION_TO_REPLACE' "${AAR_TMP}/classes"; then
  fail "unstamped SDK_VERSION_TO_REPLACE placeholder in ${AAR}"
fi

# ---------------------------------------------------------------------------
# npm archive contents. The tarball must ship the vendored binaries and must
# not pick up legacy static libraries. --ignore-scripts is required: npm pack
# runs the prepack script, and prepack runs this validator — without it the
# two recurse forever.
# ---------------------------------------------------------------------------

PACK_OUTPUT="$(npm pack --dry-run --json --ignore-scripts 2>/dev/null)"

if printf '%s' "${PACK_OUTPUT}" | grep -q 'libTestFairy\.a'; then
  fail "npm package would include a legacy TestFairy static library"
fi

printf '%s' "${PACK_OUTPUT}" | grep -q 'local-native/ios/TestFairy\.xcframework' \
  || fail "npm package is missing the vendored iOS xcframework"

printf '%s' "${PACK_OUTPUT}" | grep -q 'local-native/android/maven/.*sauce-mobile-beta-android' \
  || fail "npm package is missing the vendored Android Maven repository"

echo "Sauce Mobile Beta React Native package validation passed."
