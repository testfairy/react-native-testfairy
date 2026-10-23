import React, {useEffect, useRef, useState} from 'react';

import {Button, SafeAreaView, Text, View} from 'react-native';

import {BacktraceClient} from '@backtrace/react-native';

import TestFairy from '@saucelabs/mobile-beta-react-native';

import {
  initializeObservability,
  type ObservabilityRuntime,
} from './observability';

export default function App() {
  const runtime = useRef<ObservabilityRuntime>();
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  useEffect(() => {
    runtime.current = initializeObservability({
      backtraceSubmissionUrl:
        'https://submit.backtrace.io/<universe>/<backtrace-token>/json',
      sauceMobileBetaToken: '<sauce-mobile-beta-token>',
      environment: 'beta',
      distributionId: 'mad-build-abc123',
      userId: 'user-123',
    });

    // The SDK generates a new id at every session start; subscribe first,
    // then seed from the current value for a session that already started
    // (functional update: a change event that raced the seed wins).
    const subscription = TestFairy.addSessionStateListener({
      onSessionCorrelationIdChanged({correlationId: nextCorrelationId}) {
        setCorrelationId(nextCorrelationId);
      },
    });

    TestFairy.getSessionCorrelationId().then(currentCorrelationId => {
      if (currentCorrelationId) {
        setCorrelationId(previous => previous ?? currentCorrelationId);
      }
    });

    return () => {
      subscription.remove();
      runtime.current?.dispose();
    };
  }, []);

  return (
    <SafeAreaView>
      <View style={{padding: 24, gap: 16}}>
        <Text>Backtrace + Sauce Mobile Beta</Text>

        <Text selectable>
          sauce.correlation_id: {correlationId ?? '(no session yet)'}
        </Text>

        <Button
          title="Stop and resume session"
          onPress={() => {
            // Ends the current session and starts a new one: the id above
            // changes, and the next crash report carries the new id.
            TestFairy.stop();
            TestFairy.resume();
          }}
        />

        <Button
          title="Show feedback"
          onPress={() => {
            TestFairy.pushFeedbackController();
          }}
        />

        <Button
          title="Log a remote message"
          onPress={() => {
            TestFairy.log('Tester tapped the log button.');
          }}
        />

        <Button
          title="Native crash"
          color="#b00020"
          onPress={() => {
            // Backtrace's native crash reporter captures it; the report
            // carries the sauce.correlation_id shown above.
            BacktraceClient.instance?.crash();
          }}
        />

        <Button
          title="JS crash"
          color="#b00020"
          onPress={() => {
            // Thrown outside the press handler so it reaches the global
            // JavaScript error handler owned by Backtrace.
            setTimeout(() => {
              throw new Error('Sauce Mobile Beta example: JavaScript crash');
            }, 0);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
