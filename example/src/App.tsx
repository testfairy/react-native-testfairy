import React, { useEffect, useRef, useState } from 'react';

import { Button, SafeAreaView, Text, View } from 'react-native';

import TestFairy from '@saucelabs/mobile-beta-react-native';

import {
  initializeObservability,
  type ObservabilityRuntime,
} from './observability';

export default function App() {
  const runtime = useRef<ObservabilityRuntime>();
  const [correlationId, setCorrelationId] = useState<string>();

  useEffect(() => {
    runtime.current = initializeObservability({
      backtraceSubmissionUrl:
        'https://submit.backtrace.io/<universe>/<backtrace-token>/json',
      sauceMobileBetaToken: '<sauce-mobile-beta-token>',
      environment: 'beta',
      release: 'com.example.app@1.2.3',
      dist: '456',
      distributionId: 'mad-build-abc123',
      userId: 'user-123',
    });

    setCorrelationId(runtime.current.correlationId);

    return () => {
      runtime.current?.dispose();
    };
  }, []);

  return (
    <SafeAreaView>
      <View style={{ padding: 24, gap: 16 }}>
        <Text>Backtrace + Sauce Mobile Beta</Text>

        <Text selectable>correlation_id: {correlationId}</Text>

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
      </View>
    </SafeAreaView>
  );
}
