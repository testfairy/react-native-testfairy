require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "SauceMobileBetaReactNative"
  s.version      = package["version"]
  s.summary      = "Sauce Mobile Beta SDK for React Native, formerly TestFairy."
  s.description  = <<-DESC
    Crashless React Native bridge for Sauce Mobile Beta.

    Backtrace is the sole crash owner. The package preserves the TestFairy
    JavaScript and native API names for compatibility while depending on the
    crashless SauceMobileBeta iOS artifact.
  DESC

  s.homepage     = package["homepage"]
  s.license      = { :type => "Apache-2.0", :file => "LICENSE" }
  s.author       = { "Sauce Labs" => "support@saucelabs.com" }

  s.source = {
    :git => "https://github.com/saucelabs/mobile-beta-react-native.git",
    :tag => "#{s.version}"
  }

  s.platform = :ios, "12.0"
  s.source_files = "ios/**/*.{h,m,mm}"
  s.requires_arc = true
  s.static_framework = true

  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end

  # Crashless Sauce Mobile Beta native artifact, vendored with the npm package
  # (see local-native/README.md for provenance and regeneration). Never depend
  # on the legacy crash-capable "TestFairy" pod. A future release will fetch
  # this binary dynamically instead of vendoring it; the pinned native version
  # lives in package.json under "sauceMobileBetaNative".
  s.vendored_frameworks = "local-native/ios/TestFairy.xcframework"

  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
  }
end
