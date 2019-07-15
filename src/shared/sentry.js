// Be sure to call Sentry function as early as possible in the renderer process
import Vue from 'vue';
import { crashReporter } from 'electron';
import * as Sentry from '@sentry/electron';
import * as Integrations from '@sentry/integrations';


if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    release: process.env.SENTRY_RELEASE,
    dsn: 'https://6a94feb674b54686a6d88d7278727b7c@sentry.io/1449341',
    enableNative: false,
    integrations: [
      new Integrations.Vue({
        Vue,
        attachProps: true,
      }),
    ],
  });
}

crashReporter.start({
  companyName: 'Sagittarius Tech LLC',
  productName: 'SPlayer',
  ignoreSystemCrashHandler: true,
  submitURL: 'https://sentry.io/api/1449341/minidump/?sentry_key=6a94feb674b54686a6d88d7278727b7c',
});

export default Sentry;
