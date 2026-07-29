import 'react-native-get-random-values';

import {
  BacktraceClient,
  type BacktraceConfiguration,
} from '@backtrace/react-native';

import TestFairy from '@saucelabs/mobile-beta-react-native';

import { v4 as uuidv4 } from 'uuid';

export interface ObservabilityConfiguration {
  backtraceSubmissionUrl: string;
  sauceMobileBetaToken: string;
  environment: string;
  release: string;
  dist: string;
  distributionId: string;
  userId?: string;
}

export interface ObservabilityRuntime {
  backtrace: BacktraceClient;
  correlationId: string;
  dispose(): void;
}

/**
 * Initializes Backtrace as the sole crash owner, then Sauce Mobile Beta as the
 * crashless beta/feedback/session SDK, with shared correlation attributes so
 * a crash report in Backtrace can be matched to a Sauce Mobile Beta session.
 */
export function initializeObservability(
  configuration: ObservabilityConfiguration,
): ObservabilityRuntime {
  const correlationId = uuidv4();

  const sharedAttributes: Record<string, string> = {
    'sauce.correlation_id': correlationId,
    'sauce.sdk.coexistence_mode': 'backtrace_crash_owner',
    'sauce.environment': configuration.environment,
    'sauce.release': configuration.release,
    'sauce.dist': configuration.dist,
    'mad.distribution_id': configuration.distributionId,
  };

  const backtraceConfiguration: BacktraceConfiguration = {
    url: configuration.backtraceSubmissionUrl,

    userAttributes: {
      ...sharedAttributes,
      ...(configuration.userId
        ? { 'sauce.user_id': configuration.userId }
        : {}),
    },

    database: {
      enable: true,
      captureNativeCrashes: true,
      createDatabaseDirectory: true,
      path: `${BacktraceClient.applicationDataPath}/backtrace`,
    },
  };

  const backtrace = BacktraceClient.initialize(backtraceConfiguration);

  // Subscribe before beginWithoutCrashHandler: the session URL arrives
  // asynchronously once the session is accepted by the server.
  const sessionSubscription = TestFairy.addSessionStateListener({
    onSessionStarted({ sessionUrl }) {
      backtrace.addAttribute({
        'sauce.mobile_beta.session_started': true,
        ...(sessionUrl
          ? { 'sauce.mobile_beta.session_url': sessionUrl }
          : {}),
      });
    },

    onSessionFailed() {
      backtrace.addAttribute({
        'sauce.mobile_beta.session_started': false,
      });
    },
  });

  // Set shared identity before session initialization; the native SDK retains
  // these values and attaches them to the Sauce Mobile Beta session.
  TestFairy.setCorrelationId(correlationId);

  if (configuration.userId) {
    TestFairy.setUserId(configuration.userId);
  }

  for (const [key, value] of Object.entries(sharedAttributes)) {
    TestFairy.setAttribute(key, value);
  }

  TestFairy.beginWithoutCrashHandler(configuration.sauceMobileBetaToken, {
    enableCrashReporter: false,
  });

  TestFairy.log({
    message: 'Sauce Mobile Beta initialized with Backtrace crash ownership.',
    correlationId,
  });

  return {
    backtrace,
    correlationId,

    dispose() {
      sessionSubscription.remove();
      TestFairy.stop();
      backtrace.dispose();
    },
  };
}
