//
//  TestFairySPI.h
//  TestFairy
//
//  Copyright © 2026 TestFairy. All rights reserved.
//
//  INTERNAL. This header is used by the Sauce Mobile Beta React Native bridge and is
//  not supported for apps: it can change or disappear in any release. Apps link
//  Backtrace through BacktraceClient.shared or +[TestFairy setBacktraceClient:].
//

#import <Foundation/Foundation.h>
#import "TestFairy.h"

@interface TestFairy (SauceMobileBetaSPI)

/**
 * Registers a block that receives the attributes the SDK manages for Backtrace:
 * sauce.correlation_id, sauce.mobile_beta.session_started, sauce.mobile_beta.session_url,
 * sauce.sdk.coexistence_mode, sauce.release and sauce.dist. The block receives the full
 * map at every session start and whenever the session state changes. Registering pushes
 * the current map at once if a session was already started. Pass nil to clear.
 *
 * The block is called synchronously on the thread that starts the session, in addition
 * to the built-in Backtrace link. While a block is registered, the SDK does not warn
 * about a Backtrace client that is present but not linked.
 */
+ (void)tf_setCrashReporterAttributeSinkWithBlock:(void (^ _Nullable)(NSDictionary<NSString *, NSString *> * _Nonnull attributes))block;

@end
