"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMacApp = createMacApp;

function _bluebirdLst() {
  const data = _interopRequireDefault(require("bluebird-lst"));

  _bluebirdLst = function () {
    return data;
  };

  return data;
}

function _builderUtil() {
  const data = require("builder-util");

  _builderUtil = function () {
    return data;
  };

  return data;
}

function _fs() {
  const data = require("builder-util/out/fs");

  _fs = function () {
    return data;
  };

  return data;
}

function _fsExtra() {
  const data = require("fs-extra");

  _fsExtra = function () {
    return data;
  };

  return data;
}

var path = _interopRequireWildcard(require("path"));

function _appInfo() {
  const data = require("../appInfo");

  _appInfo = function () {
    return data;
  };

  return data;
}

function _platformPackager() {
  const data = require("../platformPackager");

  _platformPackager = function () {
    return data;
  };

  return data;
}

function _appBuilder() {
  const data = require("../util/appBuilder");

  _appBuilder = function () {
    return data;
  };

  return data;
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function doRename(basePath, oldName, newName) {
  return (0, _fsExtra().rename)(path.join(basePath, oldName), path.join(basePath, newName));
}

function moveHelpers(helperSuffixes, frameworksPath, appName, prefix) {
  return _bluebirdLst().default.map(helperSuffixes, suffix => {
    const executableBasePath = path.join(frameworksPath, `${prefix}${suffix}.app`, "Contents", "MacOS");
    return doRename(executableBasePath, `${prefix}${suffix}`, appName + suffix).then(() => doRename(frameworksPath, `${prefix}${suffix}.app`, `${appName}${suffix}.app`));
  });
}

function getAvailableHelperSuffixes(helperEHPlist, helperNPPlist, helperRendererPlist, helperPluginPlist, helperGPUPlist) {
  const result = [" Helper"];

  if (helperEHPlist != null) {
    result.push(" Helper EH");
  }

  if (helperNPPlist != null) {
    result.push(" Helper NP");
  }

  if (helperRendererPlist != null) {
    result.push(" Helper (Renderer)");
  }

  if (helperPluginPlist != null) {
    result.push(" Helper (Plugin)");
  }

  if (helperGPUPlist != null) {
    result.push(" Helper (GPU)");
  }

  return result;
}
/** @internal */


async function createMacApp(packager, appOutDir, asarIntegrity, isMas) {
  const appInfo = packager.appInfo;
  const appFilename = appInfo.productFilename;
  const contentsPath = path.join(appOutDir, packager.info.framework.distMacOsAppName, "Contents");
  const frameworksPath = path.join(contentsPath, "Frameworks");
  const loginItemPath = path.join(contentsPath, "Library", "LoginItems");
  const appPlistFilename = path.join(contentsPath, "Info.plist");
  const helperPlistFilename = path.join(frameworksPath, "Electron Helper.app", "Contents", "Info.plist");
  const helperEHPlistFilename = path.join(frameworksPath, "Electron Helper EH.app", "Contents", "Info.plist");
  const helperNPPlistFilename = path.join(frameworksPath, "Electron Helper NP.app", "Contents", "Info.plist");
  const helperRendererPlistFilename = path.join(frameworksPath, "Electron Helper (Renderer).app", "Contents", "Info.plist");
  const helperPluginPlistFilename = path.join(frameworksPath, "Electron Helper (Plugin).app", "Contents", "Info.plist");
  const helperGPUPlistFilename = path.join(frameworksPath, "Electron Helper (GPU).app", "Contents", "Info.plist");
  const helperLoginPlistFilename = path.join(loginItemPath, "Electron Login Helper.app", "Contents", "Info.plist");
  const plistContent = await (0, _appBuilder().executeAppBuilderAsJson)(["decode-plist", "-f", appPlistFilename, "-f", helperPlistFilename, "-f", helperEHPlistFilename, "-f", helperNPPlistFilename, "-f", helperRendererPlistFilename, "-f", helperPluginPlistFilename, "-f", helperGPUPlistFilename, "-f", helperLoginPlistFilename]);

  if (plistContent[0] == null) {
    throw new Error("corrupted Electron dist");
  }

  const appPlist = plistContent[0];
  const helperPlist = plistContent[1];
  const helperEHPlist = plistContent[2];
  const helperNPPlist = plistContent[3];
  const helperRendererPlist = plistContent[4];
  const helperPluginPlist = plistContent[5];
  const helperGPUPlist = plistContent[6];
  const helperLoginPlist = plistContent[7]; // if an extend-info file was supplied, copy its contents in first

  if (plistContent[8] != null) {
    Object.assign(appPlist, plistContent[8]);
  }

  const buildMetadata = packager.config;
  const oldHelperBundleId = buildMetadata["helper-bundle-id"];

  if (oldHelperBundleId != null) {
    _builderUtil().log.warn("build.helper-bundle-id is deprecated, please set as build.mac.helperBundleId");
  }

  const helperBundleIdentifier = (0, _appInfo().filterCFBundleIdentifier)(packager.platformSpecificBuildOptions.helperBundleId || oldHelperBundleId || `${appInfo.macBundleIdentifier}.helper`);
  await packager.applyCommonInfo(appPlist, contentsPath); // required for electron-updater proxy

  if (!isMas) {
    configureLocalhostAts(appPlist);
  }

  helperPlist.CFBundleExecutable = `${appFilename} Helper`;
  helperPlist.CFBundleDisplayName = `${appInfo.productName} Helper`;
  helperPlist.CFBundleIdentifier = helperBundleIdentifier;
  helperPlist.CFBundleVersion = appPlist.CFBundleVersion;

  function configureHelper(helper, postfix) {
    helper.CFBundleExecutable = `${appFilename} Helper ${postfix}`;
    helper.CFBundleDisplayName = `${appInfo.productName} Helper ${postfix}`;
    helper.CFBundleIdentifier = `${helperBundleIdentifier}.${postfix}`;
    helper.CFBundleVersion = appPlist.CFBundleVersion;
  }

  if (helperRendererPlist != null) {
    configureHelper(helperRendererPlist, "(Renderer)");
  }

  if (helperPluginPlist != null) {
    configureHelper(helperPluginPlist, "(Plugin)");
  }

  if (helperGPUPlist != null) {
    configureHelper(helperGPUPlist, "(GPU)");
  }

  if (helperEHPlist != null) {
    configureHelper(helperEHPlist, "EH");
  }

  if (helperNPPlist != null) {
    configureHelper(helperNPPlist, "NP");
  }

  if (helperLoginPlist != null) {
    helperLoginPlist.CFBundleExecutable = `${appFilename} Login Helper`;
    helperLoginPlist.CFBundleDisplayName = `${appInfo.productName} Login Helper`; // noinspection SpellCheckingInspection

    helperLoginPlist.CFBundleIdentifier = `${appInfo.macBundleIdentifier}.loginhelper`;
    helperLoginPlist.CFBundleVersion = appPlist.CFBundleVersion;
  }

  const protocols = (0, _builderUtil().asArray)(buildMetadata.protocols).concat((0, _builderUtil().asArray)(packager.platformSpecificBuildOptions.protocols));

  if (protocols.length > 0) {
    appPlist.CFBundleURLTypes = protocols.map(protocol => {
      const schemes = (0, _builderUtil().asArray)(protocol.schemes);

      if (schemes.length === 0) {
        throw new (_builderUtil().InvalidConfigurationError)(`Protocol "${protocol.name}": must be at least one scheme specified`);
      }

      return {
        CFBundleURLName: protocol.name,
        CFBundleTypeRole: protocol.role || "Editor",
        CFBundleURLSchemes: schemes.slice()
      };
    });
  }

  const fileAssociations = packager.fileAssociations;

  if (fileAssociations.length > 0) {
    appPlist.CFBundleDocumentTypes = await _bluebirdLst().default.map(fileAssociations, async fileAssociation => {
      const extensions = (0, _builderUtil().asArray)(fileAssociation.ext).map(_platformPackager().normalizeExt);
      const customIcon = await packager.getResource((0, _builderUtil().getPlatformIconFileName)(fileAssociation.icon, true), `${extensions[0]}.icns`);
      let iconFile = appPlist.CFBundleIconFile;

      if (customIcon != null) {
        iconFile = path.basename(customIcon);
        await (0, _fs().copyOrLinkFile)(customIcon, path.join(path.join(contentsPath, "Resources"), iconFile));
      }

      const result = {
        CFBundleTypeExtensions: extensions,
        CFBundleTypeName: fileAssociation.name || extensions[0],
        CFBundleTypeRole: fileAssociation.role || "Editor",
        LSHandlerRank: fileAssociation.rank || "Default",
        CFBundleTypeIconFile: iconFile
      };

      if (fileAssociation.isPackage) {
        result.LSTypeIsPackage = true;
      }

      return result;
    });
  }

  if (asarIntegrity != null) {
    appPlist.AsarIntegrity = JSON.stringify(asarIntegrity);
  }

  const plistDataToWrite = {
    [appPlistFilename]: appPlist,
    [helperPlistFilename]: helperPlist
  };

  if (helperEHPlist != null) {
    plistDataToWrite[helperEHPlistFilename] = helperEHPlist;
  }

  if (helperNPPlist != null) {
    plistDataToWrite[helperNPPlistFilename] = helperNPPlist;
  }

  if (helperRendererPlist != null) {
    plistDataToWrite[helperRendererPlistFilename] = helperRendererPlist;
  }

  if (helperPluginPlist != null) {
    plistDataToWrite[helperPluginPlistFilename] = helperPluginPlist;
  }

  if (helperGPUPlist != null) {
    plistDataToWrite[helperGPUPlistFilename] = helperGPUPlist;
  }

  if (helperLoginPlist != null) {
    plistDataToWrite[helperLoginPlistFilename] = helperLoginPlist;
  }

  await Promise.all([(0, _appBuilder().executeAppBuilderAndWriteJson)(["encode-plist"], plistDataToWrite), doRename(path.join(contentsPath, "MacOS"), "Electron", appPlist.CFBundleExecutable), (0, _fs().unlinkIfExists)(path.join(appOutDir, "LICENSE")), (0, _fs().unlinkIfExists)(path.join(appOutDir, "LICENSES.chromium.html"))]);
  await moveHelpers(getAvailableHelperSuffixes(helperEHPlist, helperNPPlist, helperRendererPlist, helperPluginPlist, helperGPUPlist), frameworksPath, appFilename, "Electron");

  if (helperLoginPlist != null) {
    const prefix = "Electron";
    const suffix = " Login Helper";
    const executableBasePath = path.join(loginItemPath, `${prefix}${suffix}.app`, "Contents", "MacOS");
    await doRename(executableBasePath, `${prefix}${suffix}`, appFilename + suffix).then(() => doRename(loginItemPath, `${prefix}${suffix}.app`, `${appFilename}${suffix}.app`));
  }

  const appPath = path.join(appOutDir, `${appFilename}.app`);
  await (0, _fsExtra().rename)(path.dirname(contentsPath), appPath); // https://github.com/electron-userland/electron-builder/issues/840

  const now = Date.now() / 1000;
  await (0, _fsExtra().utimes)(appPath, now, now);
}

function configureLocalhostAts(appPlist) {
  // https://bencoding.com/2015/07/20/app-transport-security-and-localhost/
  let ats = appPlist.NSAppTransportSecurity;

  if (ats == null) {
    ats = {};
    appPlist.NSAppTransportSecurity = ats;
  }

  ats.NSAllowsLocalNetworking = true; // https://github.com/electron-userland/electron-builder/issues/3377#issuecomment-446035814

  ats.NSAllowsArbitraryLoads = true;
  let exceptionDomains = ats.NSExceptionDomains;

  if (exceptionDomains == null) {
    exceptionDomains = {};
    ats.NSExceptionDomains = exceptionDomains;
  }

  if (exceptionDomains.localhost == null) {
    const allowHttp = {
      NSTemporaryExceptionAllowsInsecureHTTPSLoads: false,
      NSIncludesSubdomains: false,
      NSTemporaryExceptionAllowsInsecureHTTPLoads: true,
      NSTemporaryExceptionMinimumTLSVersion: "1.0",
      NSTemporaryExceptionRequiresForwardSecrecy: false
    };
    exceptionDomains.localhost = allowHttp;
    exceptionDomains["127.0.0.1"] = allowHttp;
  }
}
// __ts-babel@6.0.4
//# sourceMappingURL=electronMac.js.map