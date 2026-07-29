#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <TestFairy/TestFairy.h>

@interface RCTTestFairyBridge
    : RCTEventEmitter <RCTBridgeModule, TestFairySessionStateDelegate>
@end
