// Be sure to call Sentry function as early as possible in the renderer process
import * as Sentry from '@sentry/electron';

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    dsn: 'https://6a94feb674b54686a6d88d7278727b7c@sentry.io/1449341',
    enableNative: true,
  });
}

export default Sentry;
