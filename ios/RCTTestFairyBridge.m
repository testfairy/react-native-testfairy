#import "RCTTestFairyBridge.h"

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>

// Session lifecycle events shared with the JavaScript layer. The iOS SDK's
// TestFairySessionStateDelegate has no download-completed/download-failed
// callbacks; SauceMobileBetaAutoUpdateDownloadFailed is Android-only but is
// kept in supportedEvents so cross-platform JS listeners do not warn.
static NSString *const SMBSessionStartedEvent = @"SauceMobileBetaSessionStarted";
static NSString *const SMBSessionFailedEvent = @"SauceMobileBetaSessionFailed";
static NSString *const SMBSessionLengthReachedEvent = @"SauceMobileBetaSessionLengthReached";
static NSString *const SMBSessionStoppedEvent = @"SauceMobileBetaSessionStopped";
static NSString *const SMBAutoUpdateAvailableEvent = @"SauceMobileBetaAutoUpdateAvailable";
static NSString *const SMBAutoUpdateDownloadStartedEvent = @"SauceMobileBetaAutoUpdateDownloadStarted";
static NSString *const SMBAutoUpdateDismissedEvent = @"SauceMobileBetaAutoUpdateDismissed";
static NSString *const SMBAutoUpdateDownloadFailedEvent = @"SauceMobileBetaAutoUpdateDownloadFailed";
static NSString *const SMBNoAutoUpdateAvailableEvent = @"SauceMobileBetaNoAutoUpdateAvailable";

@implementation RCTTestFairyBridge {
	BOOL _hasJavaScriptListeners;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(TestFairyBridge);

+ (BOOL)requiresMainQueueSetup {
	return YES;
}

- (NSDictionary *)constantsToExport {
	return @{
		@"sdkName": @"SauceMobileBeta",
		@"crashReportingAvailable": @NO,
		@"coexistenceMode": @"backtrace_crash_owner"
	};
}

- (NSArray<NSString *> *)supportedEvents {
	return @[
		SMBSessionStartedEvent,
		SMBSessionFailedEvent,
		SMBSessionLengthReachedEvent,
		SMBSessionStoppedEvent,
		SMBAutoUpdateAvailableEvent,
		SMBAutoUpdateDownloadStartedEvent,
		SMBAutoUpdateDismissedEvent,
		SMBAutoUpdateDownloadFailedEvent,
		SMBNoAutoUpdateAvailableEvent
	];
}

- (void)startObserving {
	_hasJavaScriptListeners = YES;

	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy setSessionStateDelegate:self];
	});
}

- (void)stopObserving {
	_hasJavaScriptListeners = NO;

	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy setSessionStateDelegate:nil];
	});
}

- (NSMutableDictionary *)safeBeginOptions:(NSDictionary *)options {
	NSMutableDictionary *safeOptions =
		options == nil ? [NSMutableDictionary dictionary] : [options mutableCopy];

	// Backtrace owns crashes. The crashless native artifact enforces this
	// independently; forcing it here keeps the invariant visible at every layer.
	safeOptions[TFSDKEnableCrashReporterKey] = @NO;

	return safeOptions;
}

- (void)runOnMainQueue:(dispatch_block_t)block {
	if ([NSThread isMainThread]) {
		block();
		return;
	}

	dispatch_async(dispatch_get_main_queue(), block);
}

#pragma mark - Initialization

RCT_EXPORT_METHOD(begin:(NSString *)appKey withOptions:(NSDictionary *)options) {
	[self runOnMainQueue:^{
		[TestFairy beginWithoutCrashHandler:appKey
								withOptions:[self safeBeginOptions:options]];
	}];
}

RCT_EXPORT_METHOD(beginWithoutCrashHandler:(NSString *)appKey withOptions:(NSDictionary *)options) {
	[self runOnMainQueue:^{
		[TestFairy beginWithoutCrashHandler:appKey
								withOptions:[self safeBeginOptions:options]];
	}];
}

#pragma mark - Feedback

RCT_EXPORT_METHOD(installFeedbackHandler:(NSString *)appKey) {
	[self runOnMainQueue:^{
		[TestFairy installFeedbackHandler:appKey method:@"shake|screenshot"];
	}];
}

RCT_EXPORT_METHOD(uninstallFeedbackHandler) {
	[self runOnMainQueue:^{
		[TestFairy uninstallFeedbackHandler];
	}];
}

RCT_EXPORT_METHOD(pushFeedbackController) {
	[self runOnMainQueue:^{
		[TestFairy showFeedbackForm];
	}];
}

RCT_EXPORT_METHOD(showFeedbackForm:(NSString *)appToken takeScreenshot:(BOOL)takeScreenshot) {
	[self runOnMainQueue:^{
		[TestFairy showFeedbackForm:appToken takeScreenshot:takeScreenshot];
	}];
}

RCT_EXPORT_METHOD(sendUserFeedback:(NSString *)feedback) {
	[self runOnMainQueue:^{
		[TestFairy sendUserFeedback:feedback];
	}];
}

RCT_EXPORT_METHOD(setFeedbackOptions:(NSDictionary *)options) {
	[self runOnMainQueue:^{
		// The NSDictionary-based API is deprecated in favor of
		// setTestFairyFeedbackOptions:, but it is the right fit for a bridge
		// that receives plain JS objects.
		#pragma clang diagnostic push
		#pragma clang diagnostic ignored "-Wdeprecated-declarations"
		[TestFairy setFeedbackOptions:options];
		#pragma clang diagnostic pop
	}];
}

RCT_EXPORT_METHOD(enableFeedbackForm:(NSString *)method) {
	[self runOnMainQueue:^{
		[TestFairy enableFeedbackForm:method];
	}];
}

RCT_EXPORT_METHOD(disableFeedbackForm) {
	[self runOnMainQueue:^{
		[TestFairy disableFeedbackForm];
	}];
}

#pragma mark - Identity and attributes

RCT_EXPORT_METHOD(setCorrelationId:(NSString *)correlationId) {
	[self runOnMainQueue:^{
		#pragma clang diagnostic push
		#pragma clang diagnostic ignored "-Wdeprecated-declarations"
		[TestFairy setCorrelationId:correlationId];
		#pragma clang diagnostic pop
	}];
}

RCT_EXPORT_METHOD(identify:(NSString *)correlationId traits:(NSDictionary *)traits) {
	[self runOnMainQueue:^{
		#pragma clang diagnostic push
		#pragma clang diagnostic ignored "-Wdeprecated-declarations"
		[TestFairy identify:correlationId traits:traits];
		#pragma clang diagnostic pop
	}];
}

RCT_EXPORT_METHOD(setUserId:(NSString *)userId) {
	[self runOnMainQueue:^{
		[TestFairy setUserId:userId];
	}];
}

RCT_EXPORT_METHOD(setAttribute:(NSString *)key value:(NSString *)value) {
	[self runOnMainQueue:^{
		[TestFairy setAttribute:key withValue:value];
	}];
}

#pragma mark - Session

RCT_EXPORT_METHOD(pause) {
	[self runOnMainQueue:^{
		[TestFairy pause];
	}];
}

RCT_EXPORT_METHOD(resume) {
	[self runOnMainQueue:^{
		[TestFairy resume];
	}];
}

RCT_EXPORT_METHOD(stop) {
	[self runOnMainQueue:^{
		[TestFairy stop];
	}];
}

RCT_EXPORT_METHOD(checkpoint:(NSString *)name) {
	[self runOnMainQueue:^{
		[TestFairy addEvent:name];
	}];
}

RCT_EXPORT_METHOD(setScreenName:(NSString *)name) {
	[self runOnMainQueue:^{
		[TestFairy setScreenName:name];
	}];
}

RCT_EXPORT_METHOD(setMaxSessionLength:(float)seconds) {
	[self runOnMainQueue:^{
		[TestFairy setMaxSessionLength:seconds];
	}];
}

RCT_EXPORT_METHOD(getSessionUrl:(RCTPromiseResolveBlock)resolve
						reject:(RCTPromiseRejectBlock)reject) {
	[self runOnMainQueue:^{
		NSString *sessionUrl = [TestFairy sessionUrl];
		resolve(sessionUrl.length > 0 ? sessionUrl : [NSNull null]);
	}];
}

RCT_EXPORT_METHOD(getVersion:(RCTPromiseResolveBlock)resolve
					  reject:(RCTPromiseRejectBlock)reject) {
	[self runOnMainQueue:^{
		resolve([TestFairy version] ?: @"");
	}];
}

#pragma mark - Logs and errors

RCT_EXPORT_METHOD(log:(NSString *)message) {
	[self runOnMainQueue:^{
		[TestFairy log:message];
	}];
}

RCT_EXPORT_METHOD(logException:(NSString *)message trace:(NSString *)trace) {
	[self runOnMainQueue:^{
		NSError *error = [NSError
			errorWithDomain:@"com.saucelabs.mobilebeta.react-native"
					   code:-1
				   userInfo:@{
					   NSLocalizedDescriptionKey: message ?: @"JavaScript error"
				   }];

		NSArray<NSString *> *stacktrace =
			trace.length > 0 ? [trace componentsSeparatedByString:@"\n"] : @[];

		[TestFairy logError:error stacktrace:stacktrace];
	}];
}

#pragma mark - Screenshots and privacy

RCT_EXPORT_METHOD(takeScreenshot) {
	[self runOnMainQueue:^{
		[TestFairy takeScreenshot];
	}];
}

RCT_EXPORT_METHOD(hideWebViewElements:(NSString *)cssSelector) {
	[self runOnMainQueue:^{
		[TestFairy hideWebViewElements:cssSelector];
	}];
}

RCT_EXPORT_METHOD(hideView:(nonnull NSNumber *)reactTag) {
	RCTUIManager *uiManager = self.bridge.uiManager;

	if (uiManager == nil) {
		return;
	}

	dispatch_async(uiManager.methodQueue, ^{
		[uiManager addUIBlock:^(__unused RCTUIManager *manager,
								NSDictionary<NSNumber *, UIView *> *viewRegistry) {
			UIView *view = viewRegistry[reactTag];

			if (view == nil) {
				RCTLogWarn(@"Sauce Mobile Beta could not resolve React tag %@.", reactTag);
				return;
			}

			dispatch_async(dispatch_get_main_queue(), ^{
				[TestFairy hideView:view];
			});
		}];
	});
}

RCT_EXPORT_METHOD(hideViewWithNativeId:(nonnull NSString *)nativeId) {
	RCTUIManager *uiManager = self.bridge.uiManager;
	SEL selector = @selector(viewForNativeID:withRootTag:);

	if (uiManager == nil || ![uiManager respondsToSelector:selector]) {
		RCTLogWarn(
			@"Sauce Mobile Beta cannot resolve nativeID %@ with this React Native version.",
			nativeId);
		return;
	}

	dispatch_async(uiManager.methodQueue, ^{
		[uiManager addUIBlock:^(RCTUIManager *manager,
								__unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
			UIViewController *controller = RCTPresentedViewController();
			NSNumber *rootTag = controller.view.reactTag;

			if (rootTag == nil) {
				return;
			}

			IMP implementation = [manager methodForSelector:selector];
			UIView *(*function)(id, SEL, NSString *, NSNumber *) = (void *)implementation;
			UIView *view = function(manager, selector, nativeId, rootTag);

			if (view != nil) {
				dispatch_async(dispatch_get_main_queue(), ^{
					[TestFairy hideView:view];
				});
			}
		}];
	});
}

#pragma mark - Attachments

RCT_EXPORT_METHOD(attachFile:(NSString *)filename
					 content:(NSString *)content
					mimeType:(NSString *)mimeType
					resolver:(RCTPromiseResolveBlock)resolve
					rejecter:(RCTPromiseRejectBlock)reject) {
	// The native SDK derives the MIME type from the file extension; the
	// parameter is accepted for JS API symmetry with Android.
	(void)mimeType;

	NSString *safeFilename = [filename lastPathComponent];

	if (safeFilename.length == 0) {
		reject(@"invalid_filename", @"filename must be a non-empty file name.", nil);
		return;
	}

	dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
		NSFileManager *fileManager = [NSFileManager defaultManager];

		NSURL *root = [[fileManager temporaryDirectory]
			URLByAppendingPathComponent:@"SauceMobileBetaReactNative"
						  isDirectory:YES];

		NSURL *directory = [root URLByAppendingPathComponent:[[NSUUID UUID] UUIDString]
												 isDirectory:YES];

		NSError *directoryError = nil;

		if (![fileManager createDirectoryAtURL:directory
				   withIntermediateDirectories:YES
									attributes:nil
										 error:&directoryError]) {
			reject(@"attachment_directory_failed",
				   @"Could not create a temporary attachment directory.",
				   directoryError);
			return;
		}

		NSURL *fileUrl = [directory URLByAppendingPathComponent:safeFilename
													isDirectory:NO];

		NSData *data = [(content ?: @"") dataUsingEncoding:NSUTF8StringEncoding];
		NSError *writeError = nil;

		if (![data writeToURL:fileUrl options:NSDataWritingAtomic error:&writeError]) {
			reject(@"attachment_write_failed",
				   @"Could not write the attachment.",
				   writeError);
			return;
		}

		dispatch_async(dispatch_get_main_queue(), ^{
			[TestFairy attachFile:fileUrl];
			resolve(nil);
		});
	});
}

#pragma mark - Configuration

RCT_EXPORT_METHOD(setServerEndpoint:(NSString *)url) {
	[self runOnMainQueue:^{
		[TestFairy setServerEndpoint:url];
	}];
}

RCT_EXPORT_METHOD(enableMetric:(NSString *)metric) {
	[self runOnMainQueue:^{
		[TestFairy enableMetric:metric];
	}];
}

RCT_EXPORT_METHOD(disableMetric:(NSString *)metric) {
	[self runOnMainQueue:^{
		[TestFairy disableMetric:metric];
	}];
}

RCT_EXPORT_METHOD(enableVideo:(NSString *)policy
					  quality:(NSString *)quality
			  framesPerSecond:(float)framesPerSecond) {
	[self runOnMainQueue:^{
		#pragma clang diagnostic push
		#pragma clang diagnostic ignored "-Wdeprecated-declarations"
		[TestFairy enableVideo:policy quality:quality framesPerSecond:framesPerSecond];
		#pragma clang diagnostic pop
	}];
}

RCT_EXPORT_METHOD(disableVideo) {
	[self runOnMainQueue:^{
		[TestFairy disableVideo];
	}];
}

RCT_EXPORT_METHOD(disableAutoUpdate) {
	[self runOnMainQueue:^{
		[TestFairy disableAutoUpdate];
	}];
}

#pragma mark - Crash compatibility APIs

RCT_EXPORT_METHOD(enableCrashHandler) {
	[self runOnMainQueue:^{
		// No-op in the crashless SauceMobileBeta native artifact.
		[TestFairy enableCrashHandler];
	}];
}

RCT_EXPORT_METHOD(disableCrashHandler) {
	[self runOnMainQueue:^{
		// No-op. The artifact is already crashless.
		[TestFairy disableCrashHandler];
	}];
}

#pragma mark - Network events

RCT_EXPORT_METHOD(addNetworkEvent:(NSString *)url
						   method:(NSString *)method
					   statusCode:(nonnull NSNumber *)statusCode
				  startTimeMillis:(nonnull NSNumber *)startTimeMillis
					endTimeMillis:(nonnull NSNumber *)endTimeMillis
					  requestSize:(nonnull NSNumber *)requestSize
					 responseSize:(nonnull NSNumber *)responseSize
					 errorMessage:(NSString *)errorMessage
				   requestHeaders:(NSString *)requestHeaders
					  requestBody:(NSString *)requestBody
				  responseHeaders:(NSString *)responseHeaders
					 responseBody:(NSString *)responseBody) {
	[self runOnMainQueue:^{
		NSURL *parsedUrl = [NSURL URLWithString:url];

		if (parsedUrl == nil) {
			RCTLogWarn(@"Sauce Mobile Beta rejected invalid network URL: %@", url);
			return;
		}

		NSData *requestBodyData =
			requestBody == nil ? nil : [requestBody dataUsingEncoding:NSUTF8StringEncoding];
		NSData *responseBodyData =
			responseBody == nil ? nil : [responseBody dataUsingEncoding:NSUTF8StringEncoding];

		if (requestHeaders != nil || requestBodyData != nil ||
			responseHeaders != nil || responseBodyData != nil) {
			[TestFairy addNetwork:parsedUrl
						   method:method
							 code:[statusCode intValue]
				startTimeInMillis:[startTimeMillis longValue]
				  endTimeInMillis:[endTimeMillis longValue]
					  requestSize:[requestSize longValue]
					 responseSize:[responseSize longValue]
					 errorMessage:errorMessage
				   requestHeaders:requestHeaders
					  requestBody:requestBodyData
				  responseHeaders:responseHeaders
					 responseBody:responseBodyData];
			return;
		}

		[TestFairy addNetwork:parsedUrl
					   method:method
						 code:[statusCode intValue]
			startTimeInMillis:[startTimeMillis longValue]
			  endTimeInMillis:[endTimeMillis longValue]
				  requestSize:[requestSize longValue]
				 responseSize:[responseSize longValue]
				 errorMessage:errorMessage];
	}];
}

#pragma mark - TestFairySessionStateDelegate

- (void)sendSessionEvent:(NSString *)eventName body:(id)body {
	if (!_hasJavaScriptListeners) {
		return;
	}

	[self sendEventWithName:eventName body:body ?: @{}];
}

- (void)sessionStarted {
	NSString *sessionUrl = [TestFairy sessionUrl];

	[self sendSessionEvent:SMBSessionStartedEvent
					  body:@{
						  @"sessionUrl": sessionUrl.length > 0 ? sessionUrl : [NSNull null]
					  }];
}

- (void)sessionFailed {
	[self sendSessionEvent:SMBSessionFailedEvent body:@{}];
}

- (void)sessionLengthReached:(float)secondsFromStartSession {
	[self sendSessionEvent:SMBSessionLengthReachedEvent
					  body:@{
						  @"secondsFromStartSession": @(secondsFromStartSession)
					  }];
}

- (void)sessionStopped {
	[self sendSessionEvent:SMBSessionStoppedEvent body:@{}];
}

- (void)autoUpdateAvailable:(NSString *)url {
	[self sendSessionEvent:SMBAutoUpdateAvailableEvent body:@{@"url": url ?: @""}];
}

- (void)autoUpdateDownloadStarted {
	[self sendSessionEvent:SMBAutoUpdateDownloadStartedEvent body:@{}];
}

- (void)autoUpdateDismissed {
	[self sendSessionEvent:SMBAutoUpdateDismissedEvent body:@{}];
}

- (void)noAutoUpdateAvailable {
	[self sendSessionEvent:SMBNoAutoUpdateAvailableEvent body:@{}];
}

@end
