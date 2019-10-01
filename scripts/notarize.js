require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  if (process.env.NO_NOTARIZE) return;

  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin' && electronPlatformName !== 'mas') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'org.splayer.splayerx',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    ascProvider: process.env.ASCPROVIDER,
  });
};
