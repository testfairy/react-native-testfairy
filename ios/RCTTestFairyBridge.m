#import "RCTTestFairyBridge.h"
#import "RCTLog.h"
#import "RCTConvert.h"
#import "RCTUIManager.h"
#import "TestFairy.h"

@implementation RCTTestFairyBridge

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(begin:(NSString *)appKey withOptions:(NSDictionary *)options) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy begin:appKey withOptions:options];
	});
}

RCT_EXPORT_METHOD(setCorrelationId:(NSString *)correlationId) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy setCorrelationId:correlationId];
	});
}

RCT_EXPORT_METHOD(identify:(NSString *)correlationId traits:(NSDictionary *)traits) {
		dispatch_async(dispatch_get_main_queue(), ^{
			[TestFairy identify:correlationId traits:traits];
		});
}

RCT_EXPORT_METHOD(takeScreenshot) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy takeScreenshot];
	});
}

RCT_EXPORT_METHOD(pause) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy pause];
	});
}

RCT_EXPORT_METHOD(resume) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy resume];
	});
}

RCT_EXPORT_METHOD(checkpoint:(NSString *)name) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy checkpoint:name];
	});
}

RCT_EXPORT_METHOD(sendUserFeedback:(NSString *)feedback) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy sendUserFeedback:feedback];
	});
}

RCT_EXPORT_METHOD(sessionUrl:(RCTResponseSenderBlock)callback) {
	dispatch_async(dispatch_get_main_queue(), ^{
		callback(@[[NSNull null], [TestFairy sessionUrl]]);
	});
}

RCT_EXPORT_METHOD(version:(RCTResponseSenderBlock)callback) {
	dispatch_async(dispatch_get_main_queue(), ^{
		callback(@[[NSNull null], [TestFairy version]]);
	});
}

RCT_EXPORT_METHOD(hideView:(nonnull NSNumber *)reactTag) {
	dispatch_async(_bridge.uiManager.methodQueue, ^{
		[_bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
			__block UIView *view = viewRegistry[reactTag];
			if (view != nil) {
				dispatch_async(dispatch_get_main_queue(), ^{
					[TestFairy hideView:view];
				});
			}
		}];
	});
}

@end
