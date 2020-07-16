import * as Sentry from '@sentry/electron';
import { Vue as VueIntegration } from '@sentry/integrations/esm/vue';
import Vue from 'vue';

// Be sure to call Sentry function as early as possible in the renderer process
import { crashReporter } from 'electron';

const eventCounter = {};

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    release: process.env.SENTRY_RELEASE,
    dsn: 'https://6a94feb674b54686a6d88d7278727b7c@sentry.io/1449341',
    enableNative: false,
    integrations: process.type === 'renderer' ? [
      new VueIntegration({
        Vue,
        attachProps: true,
      }),
    ] : [],
    beforeSend(event, hint) {
      const error = hint.originalException;
      const message = String(typeof error === 'string' ? error : (error && error.message));
      if (message.startsWith('ERR_ABORTED (-3)')
        || message.startsWith('AbortError: The user aborted a request.')
      ) {
        return null;
      }
      eventCounter[message] = (eventCounter[message] || 0) + 1;
      if (message.startsWith('snapshot-reply:')
        || message.startsWith('"PromiseRejectionEvent"')
        || message.startsWith('Duration should be a valid number.')
        || message.startsWith('AbortError: The play() request was interrupted by a call to pause()')
        || message.startsWith('Assertion Error: Unknown assertion type')
      ) {
        if (eventCounter[message] > 1) return null;
      }
      if (eventCounter[message] > 5) return null;
      return event;
    },
  });
}

if (process.type === 'browser') {
  crashReporter.start({
    companyName: 'Sagittarius Tech LLC',
    productName: 'SPlayer',
    ignoreSystemCrashHandler: true,
    submitURL: 'https://sentry.io/api/1449341/minidump/?sentry_key=6a94feb674b54686a6d88d7278727b7c',
  });
}

if (typeof window !== 'undefined') window.Sentry = Sentry;

export default Sentry;
