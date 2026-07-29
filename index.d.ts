export = TestFairy;

type BeginOptionValue = string | number | boolean;
type BeginOptions = Record<string, BeginOptionValue>;

type MetricName =
  | 'cpu'
  | 'memory'
  | 'logcat'
  | 'battery'
  | 'network-requests'
  | string;

type VideoPolicy = 'always' | 'wifi' | 'none' | string;
type VideoQuality = 'high' | 'medium' | 'low' | string;

/**
 * The Android SDK accepts only "shake"; the iOS SDK accepts "shake",
 * "screenshot", or "shake|screenshot".
 */
type FeedbackTrigger = 'shake' | 'screenshot' | 'shake|screenshot' | string;

interface FeedbackOptions {
  defaultText?: string;
  isEmailMandatory?: boolean;
  isEmailVisible?: boolean;
  isTakeScreenshotButtonVisible?: boolean;
  isTakeRecordingButtonVisible?: boolean;
  browserUrl?: string;
}

interface NetworkLoggingOptions {
  /**
   * Capturing headers may include credentials, tokens, cookies, and personal
   * information. Disabled by default.
   */
  includeHeaders?: boolean;

  /**
   * Capturing bodies may include sensitive application data. Disabled by
   * default.
   */
  includeBodies?: boolean;
}

interface FetchContainer {
  fetch: (input: unknown, init?: unknown) => Promise<unknown>;
}

interface IntegrationInfo {
  sdkName: string;
  crashReportingAvailable: boolean;
  coexistenceMode: string;
}

interface SessionStartedEvent {
  sessionUrl: string | null;
}

interface SessionLengthReachedEvent {
  secondsFromStartSession: number;
}

interface AutoUpdateAvailableEvent {
  url: string;
}

interface SessionStateListener {
  onSessionStarted?: (event: SessionStartedEvent) => void;
  onSessionFailed?: () => void;
  onSessionLengthReached?: (event: SessionLengthReachedEvent) => void;
  onSessionStopped?: () => void;
  onAutoUpdateAvailable?: (event: AutoUpdateAvailableEvent) => void;
  onAutoUpdateDownloadStarted?: () => void;
  onAutoUpdateDismissed?: () => void;

  /** Emitted by the Android SDK only. */
  onAutoUpdateDownloadFailed?: () => void;

  onNoAutoUpdateAvailable?: () => void;
}

interface SessionStateSubscription {
  remove(): void;
}

declare class TestFairy {
  static readonly SESSION_EVENTS: Readonly<{
    started: string;
    failed: string;
    lengthReached: string;
    stopped: string;
    autoUpdateAvailable: string;
    autoUpdateDownloadStarted: string;
    autoUpdateDismissed: string;
    autoUpdateDownloadFailed: string;
    noAutoUpdateAvailable: string;
  }>;

  /**
   * Starts a crashless Sauce Mobile Beta session.
   *
   * Backtrace remains the sole crash owner.
   */
  static begin(appToken: string, options?: BeginOptions): void;

  /**
   * Recommended explicit Backtrace coexistence entry point.
   */
  static beginWithoutCrashHandler(
    appToken: string,
    options?: BeginOptions,
  ): void;

  static installFeedbackHandler(appToken: string): void;
  static uninstallFeedbackHandler(): void;

  /**
   * @deprecated Prefer setUserId plus setAttribute.
   */
  static setCorrelationId(correlationId: string): void;

  /**
   * @deprecated Prefer setUserId plus setAttribute.
   */
  static identify(
    correlationId: string,
    traits?: Record<string, unknown>,
  ): void;

  static takeScreenshot(): void;
  static pause(): void;
  static resume(): void;

  /**
   * @deprecated Use addEvent.
   */
  static checkpoint(name: string): void;

  static addEvent(name: string): void;
  static sendUserFeedback(feedback: string): void;

  static hideView(viewOrNativeId: number | string | object): void;

  static hideWebViewElements(selector: string): void;
  static setServerEndpoint(url: string): void;
  static log(message: unknown): void;
  static setScreenName(name: string): void;
  static stop(): void;
  static setUserId(userId: string): void;
  static setAttribute(key: string, value: string): void;
  static pushFeedbackController(): void;

  static showFeedbackForm(appToken: string, takeScreenshot?: boolean): void;

  /**
   * @deprecated No-op in Sauce Mobile Beta. Backtrace owns crashes.
   */
  static enableCrashHandler(): void;

  /**
   * @deprecated Sauce Mobile Beta is already crashless.
   */
  static disableCrashHandler(): void;

  static enableMetric(metric: MetricName): void;
  static disableMetric(metric: MetricName): void;

  static enableVideo(
    policy: VideoPolicy,
    quality?: VideoQuality,
    framesPerSecond?: number,
  ): void;

  static disableVideo(): void;
  static enableFeedbackForm(method: FeedbackTrigger): void;
  static disableFeedbackForm(): void;
  static disableAutoUpdate(): void;
  static setMaxSessionLength(seconds: number): void;
  static logException(error: Error): void;

  static setFeedbackOptions(options: FeedbackOptions): void;

  static attachFile(
    filename: string,
    content?: string,
    mimeType?: string,
  ): Promise<void>;

  static addNetworkEvent(
    url: string,
    method: string,
    statusCode: number,
    startTimeMillis: number,
    endTimeMillis: number,
    requestSize: number,
    responseSize: number,
    errorMessage?: string | null,
    requestHeaders?: string | null,
    requestBody?: string | null,
    responseHeaders?: string | null,
    responseBody?: string | null,
  ): void;

  static getSessionUrl(): Promise<string | null>;

  static sessionUrl(
    callback?: (error: Error | null, sessionUrl?: string | null) => void,
  ): Promise<string | null>;

  static getVersion(): Promise<string>;

  static version(
    callback?: (error: Error | null, version?: string) => void,
  ): Promise<string>;

  static isCrashReportingAvailable(): boolean;
  static getIntegrationInfo(): IntegrationInfo;

  static addSessionStateListener(
    listener: SessionStateListener,
  ): SessionStateSubscription;

  static enableNetworkLogging(
    target: FetchContainer,
    options?: NetworkLoggingOptions,
  ): void;

  static enableNetworkLogging(options?: NetworkLoggingOptions): void;

  static disableNetworkLogging(target?: FetchContainer): void;
}
