// Be sure to call Sentry function as early as possible in the renderer process
import * as Sentry from '@sentry/electron';

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({ dsn: 'https://a1b878df5a7a49678a75ec59e8be564d@sentry.io/1361815' });
}
