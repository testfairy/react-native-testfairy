#import "RCTTestFairyBridge.h"
#import "RCTLog.h"
#import "RCTConvert.h"
#import "TestFairy.h"

@implementation RCTTestFairyBridge

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(begin:(NSString *)appKey) {
	[TestFairy begin:appKey];
}

RCT_EXPORT_METHOD(begin:(NSString *)appKey withOptions:(NSDictionary *)options) {
	[TestFairy begin:appKey withOptions:options];
}

RCT_EXPORT_METHOD(setCorrelationId:(NSString *)correlationId) {
	[TestFairy setCorrelationId:correlationId];
}

RCT_EXPORT_METHOD(identify:(NSString *)correlationId) {
	[TestFairy identify:correlationId];
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

@end