function removeEmptyStringFromObject(obj) {
  // non-translated strings synced from crowdin becomes empty string
  // remove them to use fallbackLocale
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (typeof val === 'string') {
      if (val.length) return;
      delete obj[key];
    } else if (typeof val === 'object') {
      obj[key] = removeEmptyStringFromObject(obj[key]);
    }
  });
  return obj;
}

const languageFiles = require.context('./lang/', false, /\.json$/);
const messages = languageFiles.keys()
  .reduce((messagesObj, currentFilename) => {
    const languageCode = currentFilename.replace(/\.(\/|json)+/g, '');
    const languageMessage = languageCode === 'en'
      ? languageFiles(currentFilename)
      : removeEmptyStringFromObject(languageFiles(currentFilename));
    messagesObj[languageCode] = languageMessage;
    return messagesObj;
  }, {});

export default messages;
