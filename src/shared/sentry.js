// Be sure to call Sentry function as early as possible in the renderer process
import Vue from 'vue';
import * as Sentry from '@sentry/electron';
import * as Integrations from '@sentry/integrations';


if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    release: process.env.SENTRY_RELEASE,
    dsn: 'https://6a94feb674b54686a6d88d7278727b7c@sentry.io/1449341',
    enableNative: process.type === 'browser', // enableNative in main process only
    integrations: [
      new Integrations.Vue({
        Vue,
        attachProps: true,
      }),
    ],
  });
}

export default Sentry;
