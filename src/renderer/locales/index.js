const languageFiles = require.context('@/locales/lang/', false, /\.json$/);
const messages = languageFiles.keys()
  .reduce((messagesObj, currentFilename) => {
    const languageCode = currentFilename.replace(/\.(\/|json)+/g, '');
    const languageMessage = languageFiles(currentFilename);
    messagesObj[languageCode] = languageMessage;
    return messagesObj;
  }, {});
export default messages;
