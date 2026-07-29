package com.testfairy.react;

import android.content.Context;
import android.util.Log;
import android.view.View;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.util.ReactFindViewUtil;
import com.testfairy.FeedbackOptions;
import com.testfairy.SessionStateListener;
import com.testfairy.TestFairy;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.ref.WeakReference;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

public final class TestFairyModule extends ReactContextBaseJavaModule {

	private static final String TAG = "SauceMobileBetaRN";

	private static final String MODULE_NAME = "TestFairyBridge";

	private static final String SESSION_STARTED_EVENT = "SauceMobileBetaSessionStarted";
	private static final String SESSION_FAILED_EVENT = "SauceMobileBetaSessionFailed";
	private static final String SESSION_LENGTH_REACHED_EVENT = "SauceMobileBetaSessionLengthReached";
	private static final String SESSION_STOPPED_EVENT = "SauceMobileBetaSessionStopped";
	private static final String AUTO_UPDATE_AVAILABLE_EVENT = "SauceMobileBetaAutoUpdateAvailable";
	private static final String AUTO_UPDATE_DOWNLOAD_STARTED_EVENT = "SauceMobileBetaAutoUpdateDownloadStarted";
	private static final String AUTO_UPDATE_DISMISSED_EVENT = "SauceMobileBetaAutoUpdateDismissed";
	private static final String AUTO_UPDATE_DOWNLOAD_FAILED_EVENT = "SauceMobileBetaAutoUpdateDownloadFailed";
	private static final String NO_AUTO_UPDATE_AVAILABLE_EVENT = "SauceMobileBetaNoAutoUpdateAvailable";

	// The native SDK has no removeSessionStateListener, so the listener is
	// registered exactly once per process and forwards to whichever module
	// instance is currently attached to a React context.
	private static final AtomicBoolean SESSION_LISTENER_REGISTERED = new AtomicBoolean(false);

	private static final AtomicReference<WeakReference<TestFairyModule>> ACTIVE_MODULE =
			new AtomicReference<WeakReference<TestFairyModule>>();

	private final ExecutorService fileExecutor = Executors.newSingleThreadExecutor();

	private final Set<String> hiddenNativeIds =
			Collections.synchronizedSet(new HashSet<String>());

	private final ReactFindViewUtil.OnMultipleViewsFoundListener hiddenViewsListener =
			new ReactFindViewUtil.OnMultipleViewsFoundListener() {
				@Override
				public void onViewFound(View view, String nativeId) {
					try {
						TestFairy.hideView(view);
					} catch (Throwable error) {
						Log.w(TAG, "Failed to hide view with nativeID " + nativeId, error);
					}
				}
			};

	public TestFairyModule(ReactApplicationContext reactContext) {
		super(reactContext);

		ACTIVE_MODULE.set(new WeakReference<TestFairyModule>(this));

		registerSessionStateListenerOnce();
	}

	@Override
	public String getName() {
		return MODULE_NAME;
	}

	@Override
	public Map<String, Object> getConstants() {
		Map<String, Object> constants = new HashMap<String, Object>();

		constants.put("sdkName", "SauceMobileBeta");
		constants.put("crashReportingAvailable", false);
		constants.put("coexistenceMode", "backtrace_crash_owner");

		return constants;
	}

	@Override
	public void invalidate() {
		WeakReference<TestFairyModule> reference = ACTIVE_MODULE.get();

		if (reference != null && reference.get() == this) {
			ACTIVE_MODULE.set(null);
		}

		ReactFindViewUtil.removeViewsListener(hiddenViewsListener);
		fileExecutor.shutdown();

		super.invalidate();
	}

	private static void registerSessionStateListenerOnce() {
		if (!SESSION_LISTENER_REGISTERED.compareAndSet(false, true)) {
			return;
		}

		// SessionStateListener is a concrete class with empty-body callbacks;
		// only the callbacks that exist in the Android SDK are overridden here.
		TestFairy.addSessionStateListener(new SessionStateListener() {
			@Override
			public void onSessionStarted(String sessionUrl) {
				emitFromActiveModule(SESSION_STARTED_EVENT, singletonMap("sessionUrl", sessionUrl));
			}

			@Override
			public void onSessionFailed() {
				emitFromActiveModule(SESSION_FAILED_EVENT, Collections.<String, Object>emptyMap());
			}

			@Override
			public void onSessionLengthReached(float secondsFromStartSession) {
				emitFromActiveModule(
						SESSION_LENGTH_REACHED_EVENT,
						singletonMap("secondsFromStartSession", secondsFromStartSession));
			}

			@Override
			public void onSessionStopped() {
				emitFromActiveModule(SESSION_STOPPED_EVENT, Collections.<String, Object>emptyMap());
			}

			@Override
			public void onAutoUpdateAvailable(String url) {
				emitFromActiveModule(AUTO_UPDATE_AVAILABLE_EVENT, singletonMap("url", url));
			}

			@Override
			public void onAutoUpdateDownloadStarted() {
				emitFromActiveModule(
						AUTO_UPDATE_DOWNLOAD_STARTED_EVENT, Collections.<String, Object>emptyMap());
			}

			@Override
			public void onAutoUpdateDismissed() {
				emitFromActiveModule(
						AUTO_UPDATE_DISMISSED_EVENT, Collections.<String, Object>emptyMap());
			}

			@Override
			public void onAutoUpdateDownloadFailed() {
				emitFromActiveModule(
						AUTO_UPDATE_DOWNLOAD_FAILED_EVENT, Collections.<String, Object>emptyMap());
			}

			@Override
			public void onNoAutoUpdateAvailable() {
				emitFromActiveModule(
						NO_AUTO_UPDATE_AVAILABLE_EVENT, Collections.<String, Object>emptyMap());
			}
		});
	}

	private static Map<String, Object> singletonMap(String key, Object value) {
		Map<String, Object> values = new HashMap<String, Object>();
		values.put(key, value);
		return values;
	}

	private static void emitFromActiveModule(String eventName, Map<String, Object> payload) {
		WeakReference<TestFairyModule> reference = ACTIVE_MODULE.get();
		TestFairyModule module = reference == null ? null : reference.get();

		if (module == null) {
			return;
		}

		module.emitEvent(eventName, payload);
	}

	private void emitEvent(String eventName, Map<String, Object> payload) {
		ReactApplicationContext context = getReactApplicationContext();

		if (!context.hasActiveReactInstance()) {
			return;
		}

		context
				.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
				.emit(eventName, Arguments.makeNativeMap(payload));
	}

	/**
	 * Required by NativeEventEmitter.
	 */
	@ReactMethod
	public void addListener(String eventName) {
		// Listener accounting is maintained on the JavaScript side.
	}

	/**
	 * Required by NativeEventEmitter.
	 */
	@ReactMethod
	public void removeListeners(double count) {
		// Listener accounting is maintained on the JavaScript side.
	}

	@ReactMethod
	public void begin(final String appKey, final ReadableMap options) {
		beginWithoutCrashHandler(appKey, options);
	}

	@ReactMethod
	public void beginWithoutCrashHandler(final String appKey, final ReadableMap options) {
		final Map<String, String> safeOptions = convertToStringMap(options);

		// Backtrace owns crashes. The crashless native artifact enforces this
		// independently; forcing it here keeps the invariant visible everywhere.
		safeOptions.put("enableCrashReporter", "false");

		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.beginWithoutCrashHandler(
						getReactApplicationContext(), appKey, safeOptions);
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
	public void uninstallFeedbackHandler() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.uninstallFeedbackHandler();
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
	public void identify(final String correlationId, final ReadableMap traits) {
		final Map<String, Object> convertedTraits = convertToObjectMap(traits);

		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.identify(correlationId, convertedTraits);
			}
		});
	}

	@ReactMethod
	public void takeScreenshot() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.takeScreenshot();
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
	public void resume() {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.resume();
			}
		});
	}

	@ReactMethod
	public void checkpoint(final String name) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.addEvent(name);
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
				TestFairy.log("SauceMobileBetaReactNative", message);
			}
		});
	}

	@ReactMethod
	public void getSessionUrl(final Promise promise) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				promise.resolve(TestFairy.getSessionUrl());
			}
		});
	}

	@ReactMethod
	public void getVersion(final Promise promise) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				promise.resolve(TestFairy.getVersion());
			}
		});
	}

	/**
	 * Retained for compatibility with older native bridge consumers.
	 */
	@ReactMethod
	public void sessionUrl(final Callback callback) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				callback.invoke(null, TestFairy.getSessionUrl());
			}
		});
	}

	/**
	 * Retained for compatibility with older native bridge consumers.
	 */
	@ReactMethod
	public void version(final Callback callback) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				callback.invoke(null, TestFairy.getVersion());
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
	public void hideWebViewElements(final String cssSelector) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.hideWebViewElements(cssSelector);
			}
		});
	}

	@ReactMethod
	public void hideView(final int reactTag) {
		UIManagerModule uiManager =
				getReactApplicationContext().getNativeModule(UIManagerModule.class);

		if (uiManager == null) {
			return;
		}

		uiManager.addUIBlock(new UIBlock() {
			@Override
			public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
				try {
					View view = nativeViewHierarchyManager.resolveView(reactTag);
					TestFairy.hideView(view);
				} catch (Throwable error) {
					Log.w(TAG, "Could not resolve React view " + reactTag, error);
				}
			}
		});
	}

	@ReactMethod
	public void hideViewWithNativeId(final String nativeId) {
		try {
			hiddenNativeIds.add(nativeId);

			// Re-register with the updated id set; views appearing later with a
			// hidden nativeID are hidden as soon as React mounts them.
			ReactFindViewUtil.removeViewsListener(hiddenViewsListener);
			ReactFindViewUtil.addViewsListener(hiddenViewsListener, hiddenNativeIds);
		} catch (Throwable error) {
			Log.w(TAG, "Could not hide view with nativeID " + nativeId, error);
		}
	}

	/**
	 * Crash reporting is unavailable in the crashless native artifact; the
	 * native SDK turns this into a logged no-op.
	 */
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
				if (stack != null && !stack.isEmpty()) {
					TestFairy.logThrowable(stack);
					return;
				}

				TestFairy.logThrowable(new Exception(message));
			}
		});
	}

	@ReactMethod
	public void setFeedbackOptions(final ReadableMap options) {
		final FeedbackOptions.Builder builder = new FeedbackOptions.Builder();

		if (options != null) {
			if (options.hasKey("defaultText")
					&& options.getType("defaultText") == ReadableType.String) {
				builder.setDefaultText(options.getString("defaultText"));
			}

			if (options.hasKey("isEmailMandatory")
					&& options.getType("isEmailMandatory") == ReadableType.Boolean) {
				builder.setEmailMandatory(options.getBoolean("isEmailMandatory"));
			}

			if (options.hasKey("isEmailVisible")
					&& options.getType("isEmailVisible") == ReadableType.Boolean) {
				builder.setEmailFieldVisible(options.getBoolean("isEmailVisible"));
			}

			if (options.hasKey("isTakeScreenshotButtonVisible")
					&& options.getType("isTakeScreenshotButtonVisible") == ReadableType.Boolean) {
				builder.setTakeScreenshotButtonVisible(
						options.getBoolean("isTakeScreenshotButtonVisible"));
			}

			if (options.hasKey("isTakeRecordingButtonVisible")
					&& options.getType("isTakeRecordingButtonVisible") == ReadableType.Boolean) {
				builder.setRecordVideoButtonVisible(
						options.getBoolean("isTakeRecordingButtonVisible"));
			}

			if (options.hasKey("browserUrl")
					&& options.getType("browserUrl") == ReadableType.String) {
				builder.setBrowserUrl(options.getString("browserUrl"));
			}
		}

		final FeedbackOptions feedbackOptions = builder.build();

		runOnUi(new Runnable() {
			@Override
			public void run() {
				TestFairy.setFeedbackOptions(feedbackOptions);
			}
		});
	}

	@ReactMethod
	public void attachFile(
			final String filename,
			final String content,
			final String mimeType,
			final Promise promise) {
		if (filename == null || filename.trim().isEmpty()) {
			promise.reject("invalid_filename", "filename must be a non-empty file name.");
			return;
		}

		final String safeFilename = new File(filename).getName();

		fileExecutor.execute(new Runnable() {
			@Override
			public void run() {
				Context context = getReactApplicationContext();

				File root = new File(context.getCacheDir(), "SauceMobileBetaReactNative");
				final File directory = new File(root, UUID.randomUUID().toString());

				if (!directory.mkdirs() && !directory.isDirectory()) {
					promise.reject(
							"attachment_directory_failed",
							"Could not create a temporary attachment directory.");
					return;
				}

				final File outputFile = new File(directory, safeFilename);

				try {
					FileOutputStream outputStream = new FileOutputStream(outputFile);

					try {
						outputStream.write(
								(content == null ? "" : content).getBytes(StandardCharsets.UTF_8));
					} finally {
						outputStream.close();
					}
				} catch (IOException error) {
					promise.reject(
							"attachment_write_failed", "Could not write the attachment.", error);
					return;
				}

				runOnUi(new Runnable() {
					@Override
					public void run() {
						TestFairy.attachFile(outputFile);
						promise.resolve(null);
					}
				});
			}
		});
	}

	@ReactMethod
	public void addNetworkEvent(
			final String url,
			final String method,
			final int statusCode,
			final double startTimeMillis,
			final double endTimeMillis,
			final double requestSize,
			final double responseSize,
			final String errorMessage,
			final String requestHeaders,
			final String requestBody,
			final String responseHeaders,
			final String responseBody) {
		runOnUi(new Runnable() {
			@Override
			public void run() {
				try {
					URI uri = new URI(url);

					if (requestHeaders != null
							|| requestBody != null
							|| responseHeaders != null
							|| responseBody != null) {
						TestFairy.addNetworkEvent(
								uri,
								method,
								statusCode,
								(long) startTimeMillis,
								(long) endTimeMillis,
								(long) requestSize,
								(long) responseSize,
								errorMessage,
								requestHeaders,
								requestBody == null
										? null
										: requestBody.getBytes(StandardCharsets.UTF_8),
								responseHeaders,
								responseBody == null
										? null
										: responseBody.getBytes(StandardCharsets.UTF_8));
						return;
					}

					TestFairy.addNetworkEvent(
							uri,
							method,
							statusCode,
							(long) startTimeMillis,
							(long) endTimeMillis,
							(long) requestSize,
							(long) responseSize,
							errorMessage);
				} catch (Throwable error) {
					Log.w(TAG, "Could not add a network event.", error);
				}
			}
		});
	}

	private Map<String, String> convertToStringMap(ReadableMap map) {
		Map<String, String> result = new HashMap<String, String>();

		if (map == null) {
			return result;
		}

		ReadableMapKeySetIterator iterator = map.keySetIterator();

		while (iterator.hasNextKey()) {
			String key = iterator.nextKey();
			ReadableType type = map.getType(key);

			switch (type) {
				case String:
					result.put(key, map.getString(key));
					break;

				case Boolean:
					result.put(key, Boolean.toString(map.getBoolean(key)));
					break;

				case Number:
					result.put(key, Double.toString(map.getDouble(key)));
					break;

				case Null:
					break;

				default:
					Object value = map.toHashMap().get(key);

					if (value != null) {
						result.put(key, String.valueOf(value));
					}

					break;
			}
		}

		return result;
	}

	private Map<String, Object> convertToObjectMap(ReadableMap map) {
		if (map == null) {
			return new HashMap<String, Object>();
		}

		return map.toHashMap();
	}

	private void runOnUi(Runnable runnable) {
		UiThreadUtil.runOnUiThread(runnable);
	}
}
