'use strict';

const TestFairyBridge = require("react-native").NativeModules.TestFairyBridge;

class TestFairy {
	static begin(appKey, options = {}) {
		TestFairyBridge.begin(appKey, options);
	}

	static setCorrelationId(correlationId) {
		TestFairyBridge.setCorrelationId(correlationId);
	}

	static identify(correlationId, traits = {}) {
		TestFairyBridge.identify(correlationId, traits);
	}

	static takeScreenshot() {
		TestFairyBridge.takeScreenshot();
	}

	static pause() {
		TestFairyBridge.pause();
	}

	static resume() {
		TestFairyBridge.resume();
	}

	static checkpoint(name) {
		TestFairyBridge.checkpoint(name);
	}

	static sendUserFeedback(feedback) {
		TestFairyBridge.sendUserFeedback(feedback);
	}
}

module.exports = TestFairy;