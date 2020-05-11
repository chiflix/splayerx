const remoteUtils = window.remote ? window.remote.app.utils : {};

module.exports = Object.assign(remoteUtils, {
  getClientUUID: remoteUtils.getClientUUID || (async () => ''),
  getEnvironmentName: remoteUtils.getEnvironmentName || (() => 'WEB'),
  getPlatformInfo: () => require('./common/platform'),
  getSystemLocale: () => {
    const first = window.navigator.languages
      ? window.navigator.languages[0]
      : null;
    const lang = first
      || window.navigator.language
      || window.navigator['browserLanguage']
      || window.navigator['userLanguage']
      || 'en';
    if (lang.indexOf('zh') === 0) {
      if (/HK/i.test(lang) || /TW/i.test(lang) || /Hant/i.test(lang)) {
        return 'zh-Hant';
      }
      return 'zh-Hans';
    }
    return lang;
  },
  postMessage: (message, data) => {
    // @ts-ignore
    if (window.remote && window.remote.app) {
      // @ts-ignore
      window.remote && window.remote.app.emit(message, data);
    } else if (window.parent) {
      const match = document.referrer.match(/https?:\/\/[^/:]*(splayer\.org|splayer\.work|splayer\.top|shooter\.cn|localhost)(:\d+)?\//i);
      let targetOrigins = [];
      if (match) {
        targetOrigins = [match[0]];
      } else {
        targetOrigins = [
          'https://shooter.cn',
          'https://beta.splayer.work',
        ];
      }
      targetOrigins.forEach((targetOrigin) => {
        window.parent.postMessage(
          JSON.stringify({ message, data }),
          targetOrigin,
        );
      });
    }
  },
});
