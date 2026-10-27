import {
  BacktraceClient,
  type BacktraceConfiguration,
} from '@backtrace/react-native';

import TestFairy from '@saucelabs/mobile-beta-react-native';

export interface ObservabilityConfiguration {
  backtraceSubmissionUrl: string;
  sauceMobileBetaToken: string;
  /** Server Endpoint from Organization Settings, SDK Settings (https://<host>/services/). Required. */
  sauceMobileBetaEndpoint: string;
  environment: string;
  /** Mobile App Distribution id; reported as mad.distribution_id only when set. */
  distributionId?: string;
  userId?: string;
}

export interface ObservabilityRuntime {
  backtrace: BacktraceClient;
  dispose(): void;
}

/**
 * Initializes Backtrace as the sole crash owner, then Sauce Mobile Beta as the
 * crashless beta/feedback/session SDK.
 *
 * The SDK owns the coexistence contract: it generates a new
 * sauce.correlation_id at every session start, attaches it to the session, and
 * hands it (with sauce.mobile_beta.session_started, sauce.mobile_beta.session_url,
 * sauce.sdk.coexistence_mode, sauce.release and sauce.dist) to the handler
 * below, which applies the map to Backtrace. The app only sets its own
 * attributes.
 */
export function initializeObservability(
  configuration: ObservabilityConfiguration,
): ObservabilityRuntime {
  // App-owned attributes, shared by both systems. Everything else that links a
  // crash to a session is managed by the SDK; do not set sauce.correlation_id,
  // sauce.mobile_beta.session_started or sauce.mobile_beta.session_url here.
  const appAttributes: Record<string, string> = {
    'sauce.environment': configuration.environment,
    ...(configuration.distributionId
      ? {'mad.distribution_id': configuration.distributionId}
      : {}),
  };

  const backtraceConfiguration: BacktraceConfiguration = {
    url: configuration.backtraceSubmissionUrl,

    userAttributes: {
      ...appAttributes,
      ...(configuration.userId ? {'sauce.user_id': configuration.userId} : {}),
    },

    database: {
      enable: true,
      captureNativeCrashes: true,
      createDatabaseDirectory: true,
      path: `${BacktraceClient.applicationDataPath}/backtrace`,
    },
  };

  // Step 1: Backtrace first. It is the crash owner.
  const backtrace = BacktraceClient.initialize(backtraceConfiguration);

  // Step 2: nothing to wire. At every session start (and on every start
  // response) the package writes the SDK-managed attributes to
  // BacktraceClient.instance through addAttribute, which overwrites. An app that
  // wraps the client behind its own module would call
  // TestFairy.setBacktraceClient(backtrace) here instead.

  // Identity and app attributes are set before session initialization; the
  // native SDK retains them and attaches them to every Sauce Mobile Beta session.
  // setCorrelationId/identify are deprecated (they write the user-identity
  // field) and are not used for correlation.
  if (configuration.userId) {
    TestFairy.setUserId(configuration.userId);
  }

  for (const [key, value] of Object.entries(appAttributes)) {
    TestFairy.setAttribute(key, value);
  }

  // Required: the SDK's built-in default server is no longer in service.
  TestFairy.setServerEndpoint(configuration.sauceMobileBetaEndpoint);

  TestFairy.beginWithoutCrashHandler(configuration.sauceMobileBetaToken, {
    enableCrashReporter: false,
  });

  TestFairy.log(
    'Sauce Mobile Beta initialized with Backtrace crash ownership.',
  );

  return {
    backtrace,

    dispose() {
      TestFairy.stop();
      backtrace.dispose();
    },
  };
}
