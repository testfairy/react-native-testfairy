# React Native invokes methods annotated with @ReactMethod.
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Preserve the bridge package and module name.
-keep class com.testfairy.react.** { *; }

# Public Sauce Mobile Beta runtime APIs intentionally retain TestFairy package
# names. The native Sauce Mobile Beta AAR supplies its own consumer rules, but
# retaining its public entry point here protects applications with aggressive
# custom R8 configurations.
-keep public class com.testfairy.TestFairy {
    public *;
}
