package com.testfairy.react;

import android.content.Context;
import android.util.Log;
import android.view.View;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UiThreadUtil;

import com.testfairy.FeedbackOptions;
import com.testfairy.TestFairy;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class TestFairyModule extends ReactContextBaseJavaModule {
	private static class TFOnMultipleViewsFoundListenerProxy implements java.lang.reflect.InvocationHandler {
		final HashSet<String> hiddenNativeIds = new HashSet<String>();
		@Override
		public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
			Object result = null;
			try {
				String name = method.getName();
				if ("onViewFound".equals(name) && args.length > 0) {
					Object view = args[0];
					Object nativeId = args[1];
					if (nativeId instanceof String && view instanceof View) {
						hiddenNativeIds.remove(nativeId);
						TestFairy.hideView((View) view);
					}
				} else if ("hashCode".equals(name)) {
					result = "TFOnMultipleViewsFoundListenerProxy".hashCode();
				}
			} catch (Exception ignored) {}
			return result;
		}
	}
	private final TFOnMultipleViewsFoundListenerProxy proxy = new TFOnMultipleViewsFoundListenerProxy();
	private Object listener;

	public TestFairyModule(ReactApplicationContext reactContext) {
		super(reactContext);

		try {
			Class OnMultipleViewsFoundListener = Class.forName("com.facebook.react.uimanager.util.ReactFindViewUtil$OnMultipleViewsFoundListener");
			listener = Proxy.newProxyInstance(
					OnMultipleViewsFoundListener.getClassLoader(),
					new Class[]{ OnMultipleViewsFoundListener },
					proxy
			);
		} catch (Exception ignore) {}
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
	public void installFeedbackHandler(final String appKey) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.installFeedbackHandler(getReactApplicationContext(), appKey);
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
		runOnUi(new Runnable() {
			@Override
			public void run() {
				takeScreenshot();
			}
		});
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
	public void pushFeedbackController() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.showFeedbackForm();
			}
		});
	}

	@ReactMethod
	public void showFeedbackForm(final String appToken, final boolean takeScreenshot) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.showFeedbackForm(getReactApplicationContext(), appToken, takeScreenshot);
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
				TestFairy.addEvent(checkpoint);
			}
		});
	}

	@ReactMethod
	public void hideWebViewElements(final String cssSelector) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.hideWebViewElements(cssSelector);
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
	public void setServerEndpoint(final String url) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.setServerEndpoint(url);
			}
		});
	}

	@ReactMethod
	public void log(final String message) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.log("TFReactNative", message);
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
	public void setScreenName(final String name) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.setScreenName(name);
			}
		});
	}

	@ReactMethod
	public void stop() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.stop();
			}
		});
	}

	@ReactMethod
	public void setUserId(final String userId) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.setUserId(userId);
			}
		});
	}

	@ReactMethod
	public void setAttribute(final String key, final String value) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.setAttribute(key, value);
			}
		});
	}

	@ReactMethod
	public void hideView(final int tag) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.hideView(tag);
			}
		});
	}

	@ReactMethod
	public void hideViewWithNativeId(final String nativeId) {
		try {
			proxy.hiddenNativeIds.add(nativeId);
			Class OnMultipleViewsFoundListener = Class.forName("com.facebook.react.uimanager.util.ReactFindViewUtil$OnMultipleViewsFoundListener");
			Class ReactFindViewUtil = Class.forName("com.facebook.react.uimanager.util.ReactFindViewUtil");
			Method removeViewsListener = ReactFindViewUtil.getMethod("removeViewsListener", OnMultipleViewsFoundListener);
			removeViewsListener.invoke(null, listener);
			Method addViewsListener = ReactFindViewUtil.getMethod("addViewsListener", OnMultipleViewsFoundListener, Set.class);
			addViewsListener.invoke(null, listener, proxy.hiddenNativeIds);
		} catch (Exception ignored) {}
	}

	@ReactMethod
	public void enableCrashHandler() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.enableCrashHandler();
			}
		});
	}

	@ReactMethod
	public void disableCrashHandler() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.disableCrashHandler();
			}
		});
	}

	@ReactMethod
	public void enableMetric(final String metric) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.enableMetric(metric);
			}
		});
	}

	@ReactMethod
	public void disableMetric(final String metric) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.disableMetric(metric);
			}
		});
	}

	@ReactMethod
	public void enableVideo(final String policy, final String quality, final float framesPerSecond) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.enableVideo(policy, quality, framesPerSecond);
			}
		});
	}

	@ReactMethod
	public void disableVideo() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.disableVideo();
			}
		});
	}

	@ReactMethod
	public void enableFeedbackForm(final String method) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.enableFeedbackForm(method);
			}
		});
	}

	@ReactMethod
	public void disableFeedbackForm() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.disableFeedbackForm();
			}
		});
	}

	@ReactMethod
	public void disableAutoUpdate() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.disableAutoUpdate();
			}
		});
	}

	@ReactMethod
	public void setMaxSessionLength(final float seconds) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.setMaxSessionLength(seconds);
			}
		});
	}

	@ReactMethod
	public void logException(final String message, final String stack) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.logThrowable(new Exception(message));
			}
		});
	}

	@ReactMethod
	public void setFeedbackOptions(final ReadableMap options) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				FeedbackOptions.Builder feedbackOptions = new FeedbackOptions.Builder();
								
				if (options.hasKey("defaultText")) {
					ReadableType defaultTextType = options.getType("defaultText");
					if (defaultTextType == ReadableType.String) {
						feedbackOptions.setDefaultText(options.getString("defaultText"));
					}
				}

				if (options.hasKey("isEmailMandatory")) {
					ReadableType isEmailMandatoryType = options.getType("isEmailMandatory");
					if (isEmailMandatoryType == ReadableType.Boolean) {
						feedbackOptions.setEmailMandatory(options.getBoolean("isEmailMandatory"));
					}
				}

				if (options.hasKey("isEmailVisible")) {
					ReadableType isEmailVisibleType = options.getType("isEmailVisible");
					if (isEmailVisibleType == ReadableType.Boolean) {
						feedbackOptions.setEmailFieldVisible(options.getBoolean("isEmailVisible"));
					}
				}
			}
		});
	}

	@ReactMethod
	public void attachFile(final String filename, final String content) {
		if (filename == null) {
			throw new RuntimeException("Cannot attach file without a name!");
		}

		runOnUi(new Runnable() {
			@Override
			public void run() {
				Context context = getReactApplicationContext();
				File outputDir = context.getCacheDir();
				try {
					File tfTemp = new File(outputDir, "tfTemp");
					if (tfTemp.exists()) {
						deleteDir(tfTemp);
					}

					tfTemp.mkdir();

					File outputFile = new File(tfTemp, filename);
					FileOutputStream fileOutputStream = new FileOutputStream(outputFile);

					if (content != null) {
						fileOutputStream.write(content.getBytes(Charset.forName("UTF-8")));
					}

					fileOutputStream.close();

					TestFairy.attachFile(outputFile);
				} catch (IOException e) {
					throw new RuntimeException(e);
				}
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

	// For to Delete the directory inside list of files and inner Directory
	private static boolean deleteDir(File dir) {
		if (dir.isDirectory()) {
			String[] children = dir.list();
			for (int i=0; i<children.length; i++) {
				boolean success = deleteDir(new File(dir, children[i]));
				if (!success) {
					return false;
				}
			}
		}

		// The directory is now empty so delete it
		return dir.delete();
	}
}
