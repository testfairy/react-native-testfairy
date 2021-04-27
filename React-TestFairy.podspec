require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "React-TestFairy"
  s.version      = package["version"]
  s.summary      = "TestFairy app monitoring and crash handling framework"
  s.homepage     = "https://www.testfairy.com"
  s.license      = {:type => "Commercial", :text => ""}
  s.author       = { "TestFairy" => "support@testfairy.com" }
  s.platform     = :ios, '9.0'
  s.source       = { :git => "https://github.com/testfairy/react-native-testfairy/react-native-testfairy.git", :tag => "#{s.version}" }
  s.source_files  = "ios/*.{h,m,a}"
  s.source_files = "ios/*.{xcodeproj}", "ios/*.{h,m}"
	s.library       = "TestFairy"
	s.requires_arc = true
	s.frameworks = "UIKit", "CoreMedia", "CoreMotion", "AVFoundation", "AVFoundation", "OpenGLES", "SystemConfiguration"
  s.dependency "React"
  s.dependency "TestFairy", "1.28.1"
end
