package com.testfairy.react;

import android.app.Activity;
import android.util.Log;
import android.view.View;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;

import com.testfairy.TestFairy;

import java.util.Map;

public class TestFairyModule extends ReactContextBaseJavaModule {

    public TestFairyModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "TestFairyBridge";
    }

    @ReactMethod
    public void begin(final String appKey, ReadableMap map) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.begin(getReactApplicationContext(), appKey);
            }
        });
    }

    @ReactMethod
    public void setCorrelationId(final String correlationId) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.setCorrelationId(correlationId);
            }
        });
    }

    @ReactMethod
    public void identify(final String identity, ReadableMap map) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                final Map<String, String> traits = null;
                TestFairy.identify(identity, traits);
            }
        });
    }

    @ReactMethod
    public void takeScreenshot() {
        // TODO: Does not exist on Android
    }

    @ReactMethod
    public void pause() {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.pause();
            }
        });
    }

    @ReactMethod
    public void resume() {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.resume();
            }
        });
    }

    @ReactMethod
    public void checkpoint(final String checkpoint) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.addCheckpoint(checkpoint);
            }
        });
    }

    @ReactMethod
    public void sendUserFeedback(final String feedback) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.sendUserFeedback(feedback);
            }
        });
    }

    @ReactMethod
    public void sessionUrl(final Callback callback) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                callback.invoke(TestFairy.getSessionUrl());
            }
        });
    }

    @ReactMethod
    public void version(final Callback callback) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                callback.invoke(TestFairy.getSessionUrl());
            }
        });
    }

    @ReactMethod
    public void hideView(final int tag) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                Activity activity = getCurrentActivity();
                if (activity == null)
                    return;

                View view = activity.findViewById(tag);
                if (view == null)
                    return;
                
                TestFairy.hideView(view);
            }
        });
    }

    private void runOnUi(Runnable runnable) {
        UiThreadUtil.runOnUiThread(runnable);
    }
}
