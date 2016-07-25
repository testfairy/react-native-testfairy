package com.testfairy.react;

import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.view.View;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UiThreadUtil;

import com.testfairy.TestFairy;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
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
                Context context = getReactApplicationContext();
                try {
                    Method method = ReactContext.class.getDeclaredMethod("getCurrentActivity", null);
                    method.setAccessible(true);
                    context = (Context) method.invoke(context, null);
                } catch (Exception ignored) {}

                TestFairy.begin(context, appKey);
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
    public void identify(final String identity, final ReadableMap map) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                if (map == null) {
                    TestFairy.identify(identity, null);
                } else {
                    final Map<String, Object> traits = convertMap(map);
                    TestFairy.identify(identity, traits);
                }
            }
        });
    }
    
    @ReactMethod
    public void takeScreenshot() {
        Log.i("TestFairyModule", "Android does not support taking screen shots");
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

    private Map<String, Object> convertMap(ReadableMap map) {
        Map<String, Object> input = new HashMap<String, Object>();
        ReadableMapKeySetIterator iterator = map.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            ReadableType type = map.getType(key);
            switch (type) {
                case Boolean:
                    input.put(key, map.getBoolean(key));
                    break;
                case String:
                    input.put(key, map.getString(key));
                    break;
                case Number:
                    input.put(key, map.getDouble(key));
                    break;
                case Array:
                    input.put(key, convertArray(map.getArray(key)));
                    break;
                case Map:
                    input.put(key, convertMap(map.getMap(key)));
                default:
                    break;
            }
        }

        return input;
    }

    private ArrayList<Object> convertArray(ReadableArray array) {
        ArrayList<Object> input = new ArrayList<Object>();
        ReadableType singleType = null;
        for (int index = 0; index < array.size(); index++) {
            ReadableType type = array.getType(index);
            if (singleType == null)
                singleType = type;

            if (type != singleType) {
                Log.d("TestFairyModule", "Cannot mix types in array objects expecting type [" + singleType + "] found [" + type + "] in array. Skipping");
                continue;
            }

            switch (type) {
                case Boolean:
                    input.add(array.getBoolean(index));
                    break;
                case String:
                    input.add(array.getString(index));
                    break;
                case Number:
                    input.add(array.getDouble(index));
                    break;
                case Array:
                    input.add(convertArray(array.getArray(index)));
                    break;
                case Map:
                    input.add(convertMap(array.getMap(index)));
                default:
                    break;
            }
        }

        return input;
    }
    
    private void runOnUi(Runnable runnable) {
        UiThreadUtil.runOnUiThread(runnable);
    }
}
