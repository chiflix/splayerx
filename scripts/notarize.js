/* eslint-disable import/no-extraneous-dependencies,@typescript-eslint/no-var-requires */
require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  if (!process.env.APPLEIDPASS) return;
  if (process.env.TRAVIS && !process.env.TRAVIS_TAG) return;

  const { appOutDir } = context;

  const appName = context.packager.appInfo.productFilename;

  await notarize({
    appBundleId: 'org.splayer.splayerx',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    ascProvider: process.env.ASCPROVIDER,
  });
};
