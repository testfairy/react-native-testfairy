#import "RCTTestFairyBridge.h"
#import "RCTLog.h"
#import "RCTConvert.h"
#import "RCTUIManager.h"
#import "TestFairy.h"

@implementation RCTTestFairyBridge

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(begin:(NSString *)appKey withOptions:(NSDictionary *)options) {
	[TestFairy begin:appKey withOptions:options];
}

RCT_EXPORT_METHOD(setCorrelationId:(NSString *)correlationId) {
	[TestFairy setCorrelationId:correlationId];
}

RCT_EXPORT_METHOD(identify:(NSString *)correlationId traits:(NSDictionary *)traits) {
	[TestFairy identify:correlationId traits:traits];
}

RCT_EXPORT_METHOD(takeScreenshot) {
	[TestFairy takeScreenshot];
}

RCT_EXPORT_METHOD(pause) {
	[TestFairy pause];
}

RCT_EXPORT_METHOD(resume) {
	[TestFairy resume];
}

RCT_EXPORT_METHOD(checkpoint:(NSString *)name) {
	[TestFairy checkpoint:name];
}

RCT_EXPORT_METHOD(sendUserFeedback:(NSString *)feedback) {
	[TestFairy sendUserFeedback:feedback];
}

RCT_EXPORT_METHOD(sessionUrl:(RCTResponseSenderBlock)callback) {
	callback(@[[NSNull null], [TestFairy sessionUrl]]);
}

RCT_EXPORT_METHOD(version:(RCTResponseSenderBlock)callback) {
	callback(@[[NSNull null], [TestFairy version]]);
}

RCT_EXPORT_METHOD(hideView:(nonnull NSNumber *)reactTag) {
	dispatch_async(_bridge.uiManager.methodQueue, ^{
		[_bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
			UIView *view = viewRegistry[reactTag];
			if (view != nil) {
				[TestFairy hideView:view];
			}
		}];
	});
}

@end
