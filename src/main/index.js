// Be sure to call Sentry function as early as possible in the main process
import '../shared/sentry';

import { app, BrowserWindow, session, Tray, ipcMain, globalShortcut, nativeImage, splayerx, systemPreferences, BrowserView, webContents } from 'electron' // eslint-disable-line
import { throttle, debounce, uniq } from 'lodash';
import os from 'os';
import path, {
  basename, dirname, extname, join, resolve,
} from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import urlParse from 'url-parse-lax';
// import { audioHandler } from './helpers/audioHandler';
import { audioGrabService } from './helpers/AudioGrabService';
import './helpers/electronPrototypes';
import writeLog from './helpers/writeLog';
import { getValidVideoRegex, getValidSubtitleRegex } from '../shared/utils';
import { mouse } from './helpers/mouse';
import MenuService from './menu/MenuService';
import registerMediaTasks from './helpers/mediaTasksPlugin';
import { BrowserViewManager } from './helpers/BrowserViewManager';
import InjectJSManager from '../../src/shared/pip/InjectJSManager';

// requestSingleInstanceLock is not going to work for mas
// https://github.com/electron-userland/electron-packager/issues/923
if (!process.mas && !app.requestSingleInstanceLock()) {
  app.quit();
}

/**
 * Check for restore mark and delete all user data
 */
const userDataPath = app.getPath('userData');
if (fs.existsSync(path.join(userDataPath, 'NEED_TO_RESTORE_MARK'))) {
  try {
    const tbdPath = `${userDataPath}-TBD`;
    if (fs.existsSync(tbdPath)) rimraf.sync(tbdPath);
    fs.renameSync(userDataPath, tbdPath);
    rimraf(tbdPath, (err) => {
      if (err) console.error(err);
    });
  } catch (ex) {
    console.error(ex);
    try {
      rimraf.sync(`${userDataPath}/**/!(lockfile)`);
      console.log('Successfully removed all user data.');
    } catch (ex) {
      console.error(ex);
    }
  }
}

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let sidebar = false;
let welcomeProcessDone = false;
let menuService = null;
let routeName = null;
let mainWindow = null;
let laborWindow = null;
let aboutWindow = null;
let preferenceWindow = null;
let browsingWindow = null;
let browserViewManager = null;
let pipControlView = null;
let titlebarView = null;
let maskView = null;
let maskEventTimer = 0;
let maskDisappearTimer = 0;
let isBrowsingWindowMax = false;
let tray = null;
let pipTimer = 0;
let needToRestore = false;
let forceQuit = false; // 大退app 关闭所有windows
let needBlockCloseLaborWindow = true; // 标记是否阻塞nsfw窗口关闭
let inited = false;
let hideBrowsingWindow = false;
let finalVideoToOpen = [];
const tmpVideoToOpen = [];
const tmpSubsToOpen = [];
const subRegex = getValidSubtitleRegex();
const titlebarUrl = process.platform === 'darwin' ? `file:${resolve(__static, 'pip/macTitlebar.html')}` : `file:${resolve(__static, 'pip/winTitlebar.html')}`;
const maskUrl = process.platform === 'darwin' ? `file:${resolve(__static, 'pip/mask.html')}` : `file:${resolve(__static, 'pip/mask.html')}`;
const mainURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;
const laborURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080/labor.html'
  : `file://${__dirname}/labor.html`;
const aboutURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080/about.html'
  : `file://${__dirname}/about.html`;
const preferenceURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080/preference.html'
  : `file://${__dirname}/preference.html`;
const browsingURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080/browsing.html'
  : `file://${__dirname}/browsing.html`;

const tempFolderPath = path.join(app.getPath('temp'), 'splayer');
if (!fs.existsSync(tempFolderPath)) fs.mkdirSync(tempFolderPath);


function handleBossKey() {
  if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
  if (mainWindow.isVisible()) {
    if (process.platform === 'darwin' && mainWindow.isFullScreen()) {
      mainWindow.once('leave-full-screen', handleBossKey);
      mainWindow.setFullScreen(false);
      return;
    }
    mainWindow.webContents.send('mainCommit', 'PAUSED_UPDATE', true);
    mainWindow.webContents.send('mainCommit', 'isHiddenByBossKey', true);
    mainWindow.hide();
    if (process.platform === 'win32') {
      tray = new Tray(nativeImage.createFromDataURL(require('../../build/icons/1024x1024.png')));
      tray.on('click', () => {
        mainWindow.show();
        mainWindow.webContents.send('mainCommit', 'isHiddenByBossKey', false);
        // Destroy tray in its callback may cause app crash
        setTimeout(() => {
          if (!tray) return;
          tray.destroy();
          tray = null;
        }, 10);
      });
    }
  }
}

function createPipControlView() {
  if (pipControlView && !pipControlView.isDestroyed()) pipControlView.destroy();
  pipControlView = new BrowserView({
    webPreferences: {
      preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
    },
  });
  browsingWindow.addBrowserView(pipControlView);
  pipControlView.webContents.loadURL(`file:${require('path').resolve(__static, 'pip/pipControl.html')}`);
  pipControlView.setBackgroundColor('#00FFFFFF');
  pipControlView.setBounds({
    x: Math.round(browsingWindow.getSize()[0] - 65),
    y: Math.round(browsingWindow.getSize()[1] / 2 - 54),
    width: 50,
    height: 104,
  });
}

function createTitlebarView() {
  if (titlebarView) titlebarView.destroy();
  titlebarView = new BrowserView({
    webPreferences: {
      preload: `${require('path').resolve(__static, 'pip/titlebarPreload.js')}`,
    },
  });
  browsingWindow.addBrowserView(titlebarView);
  titlebarView.webContents.loadURL(titlebarUrl);
  titlebarView.setBackgroundColor('#00FFFFFF');
  titlebarView.setBounds({
    x: 0, y: 0, width: browsingWindow.getSize()[0], height: 36,
  });
}

function createMaskView() {
  if (maskView) maskView.destroy();
  maskView = new BrowserView();
  browsingWindow.addBrowserView(maskView);
  maskView.webContents.loadURL(maskUrl);
  maskView.setBackgroundColor('#00FFFFFF');
  maskView.setBounds({
    x: 0, y: 0, width: browsingWindow.getSize()[0], height: browsingWindow.getSize()[1],
  });
  maskView.webContents.executeJavaScript(`
    document.body.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
  `);
}
function markNeedToRestore() {
  fs.closeSync(fs.openSync(path.join(app.getPath('userData'), 'NEED_TO_RESTORE_MARK'), 'w'));
}

function searchSubsInDir(dir) {
  const subRegex = getValidSubtitleRegex();
  const dirFiles = fs.readdirSync(dir);
  return dirFiles
    .filter(subtitleFilename => subRegex.test(path.extname(subtitleFilename)))
    .map(subtitleFilename => (join(dir, subtitleFilename)));
}
function searchForLocalVideo(subSrc) {
  const videoDir = dirname(subSrc);
  const videoBasename = basename(subSrc, extname(subSrc)).toLowerCase();
  const videoFilename = basename(subSrc).toLowerCase();
  const dirFiles = fs.readdirSync(videoDir);
  return dirFiles
    .filter((subtitleFilename) => {
      const lowerCasedName = subtitleFilename.toLowerCase();
      return (
        getValidVideoRegex().test(lowerCasedName)
        && lowerCasedName.slice(0, lowerCasedName.lastIndexOf('.')) === videoBasename
        && lowerCasedName !== videoFilename && !subRegex.test(path.extname(lowerCasedName))
      );
    })
    .map(subtitleFilename => (join(videoDir, subtitleFilename)));
}
function getAllValidVideo(onlySubtitle, files) {
  try {
    const videoFiles = [];

    for (let i = 0; i < files.length; i += 1) {
      if (fs.statSync(files[i]).isDirectory()) {
        const dirPath = files[i];
        const dirFiles = fs.readdirSync(dirPath).map(file => path.join(dirPath, file));
        files.push(...dirFiles);
      }
    }
    if (!process.mas) {
      files.forEach((tempFilePath) => {
        const baseName = path.basename(tempFilePath);
        if (baseName.startsWith('.') || fs.statSync(tempFilePath).isDirectory()) return;
        if (subRegex.test(path.extname(tempFilePath))) {
          const tempVideo = searchForLocalVideo(tempFilePath);
          videoFiles.push(...tempVideo);
        } else if (!subRegex.test(path.extname(tempFilePath))
          && getValidVideoRegex().test(tempFilePath)) {
          videoFiles.push(tempFilePath);
        }
      });
    } else {
      files.forEach((tempFilePath) => {
        const baseName = path.basename(tempFilePath);
        if (baseName.startsWith('.') || fs.statSync(tempFilePath).isDirectory()) return;
        if (!subRegex.test(path.extname(tempFilePath))
          && getValidVideoRegex().test(tempFilePath)) {
          videoFiles.push(tempFilePath);
        }
      });
    }
    return uniq(videoFiles);
  } catch (ex) {
    return [];
  }
}

function createPreferenceWindow(e, route) {
  const preferenceWindowOptions = {
    useContentSize: true,
    frame: false,
    titleBarStyle: 'none',
    width: 540,
    height: 426,
    transparent: true,
    resizable: false,
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      experimentalFeatures: true,
    },
    acceptFirstMouse: true,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
  };
  if (!preferenceWindow) {
    preferenceWindow = new BrowserWindow(preferenceWindowOptions);
    // 如果播放窗口顶置，打开首选项也顶置
    if (mainWindow && mainWindow.isAlwaysOnTop()) {
      preferenceWindow.setAlwaysOnTop(true);
    }
    if (route) preferenceWindow.loadURL(`${preferenceURL}#/${route}`);
    else preferenceWindow.loadURL(`${preferenceURL}`);
    preferenceWindow.on('closed', () => {
      preferenceWindow = null;
    });
  } else {
    preferenceWindow.focus();
  }
  preferenceWindow.once('ready-to-show', () => {
    preferenceWindow.show();
  });
}

function createAboutWindow() {
  const aboutWindowOptions = {
    useContentSize: true,
    frame: false,
    titleBarStyle: 'none',
    width: 190,
    height: 280,
    transparent: true,
    resizable: false,
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      experimentalFeatures: true,
    },
    acceptFirstMouse: true,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
  };
  if (!aboutWindow) {
    aboutWindow = new BrowserWindow(aboutWindowOptions);
    // 如果播放窗口顶置，打开关于也顶置
    if (mainWindow && mainWindow.isAlwaysOnTop()) {
      aboutWindow.setAlwaysOnTop(true);
    }
    aboutWindow.loadURL(`${aboutURL}`);
    aboutWindow.on('closed', () => {
      aboutWindow = null;
    });
  }
  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
  });
}

function createBrowsingWindow(args) {
  const browsingWindowOptions = {
    useContentSize: true,
    frame: false,
    titleBarStyle: 'none',
    transparent: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      experimentalFeatures: true,
      webviewTag: true,
    },
    backgroundColor: '#000000',
    acceptFirstMouse: false,
    show: false,
  };
  if (!browsingWindow) {
    browsingWindow = new BrowserWindow(browsingWindowOptions);
    browsingWindow.loadURL(`${browsingURL}`);
    browsingWindow.on('closed', () => {
      browsingWindow = null;
    });
  }
  browsingWindow.once('ready-to-show', () => {
    browsingWindow.setSize(args.size[0], args.size[1]);
    if (args.position.length) {
      browsingWindow.setPosition(args.position[0], args.position[1]);
    }
    browsingWindow.on('focus', () => {
      menuService.updateFocusedWindow(false, mainWindow && mainWindow.isVisible());
    });
    browsingWindow.on('move', throttle(() => {
      if (!mainWindow) return;
      mainWindow.send('update-pip-pos', browsingWindow.getPosition());
    }, 100));
  });
  browsingWindow.on('leave-full-screen', () => {
    if (hideBrowsingWindow) {
      hideBrowsingWindow = false;
      browsingWindow.hide();
      setTimeout(() => {
        mainWindow.focus();
      }, 0);
    }
  });
}

function createLaborWindow() {
  const laborWindowOptions = {
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      experimentalFeatures: true,
    },
  };
  if (!laborWindow) {
    laborWindow = new BrowserWindow(laborWindowOptions);
    laborWindow.once('ready-to-show', () => {
      laborWindow.readyToShow = true;
    });
    laborWindow.on('close', (event) => {
      if ((mainWindow && !mainWindow.webContents.isDestroyed()) && needBlockCloseLaborWindow) {
        event.preventDefault();
      }
    });
    laborWindow.on('closed', () => {
      laborWindow = null;
      if (forceQuit) {
        app.quit();
      }
    });
    if (process.env.NODE_ENV === 'development') laborWindow.openDevTools({ mode: 'detach' });
    laborWindow.loadURL(laborURL);
  }
  // 重置参数
  forceQuit = false;
  needBlockCloseLaborWindow = true;
}

function registerMainWindowEvent(mainWindow) {
  if (!mainWindow) return;
  mainWindow.on('move', throttle(() => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
  }, 100));
  mainWindow.on('enter-full-screen', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'isFullScreen', true);
    mainWindow.webContents.send('mainCommit', 'isMaximized', mainWindow.isMaximized());
  });
  mainWindow.on('leave-full-screen', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'isFullScreen', false);
    mainWindow.webContents.send('mainCommit', 'isMaximized', mainWindow.isMaximized());
  });
  mainWindow.on('maximize', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'isMaximized', true);
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
  });
  mainWindow.on('unmaximize', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'isMaximized', false);
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
  });
  mainWindow.on('minimize', () => {
    menuService.enableMenu(false);
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'isMinimized', true);
  });
  mainWindow.on('restore', () => {
    menuService.enableMenu(true);
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'isMinimized', false);
  });
  mainWindow.on('show', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'isMinimized', false);
  });
  mainWindow.on('focus', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'isFocused', true);
    mainWindow.webContents.send('mainCommit', 'isHiddenByBossKey', false);
  });
  mainWindow.on('blur', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'isFocused', false);
  });
  mainWindow.on('scroll-touch-begin', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('scroll-touch-begin');
  });
  mainWindow.on('scroll-touch-end', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('scroll-touch-end');
  });


  registerMediaTasks();

  ipcMain.on('labor-task-add', (evt, ...rest) => {
    if (laborWindow && !laborWindow.webContents.isDestroyed()) {
      if (laborWindow.readyToShow) laborWindow.webContents.send('labor-task-add', ...rest);
      else laborWindow.once('ready-to-show', () => laborWindow.webContents.send('labor-task-add', ...rest));
    }
  });
  ipcMain.on('labor-task-done', (evt, ...rest) => {
    if (mainWindow && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('labor-task-done', ...rest);
    }
  });

  ipcMain.on('callBrowsingWindowMethod', (evt, method, args = []) => {
    try {
      browsingWindow[method](...args);
    } catch (ex) {
      console.error('callBrowsingWindowMethod', method, JSON.stringify(args), '\n', ex);
    }
  });
  ipcMain.on('browser-window-mask', () => {
    if (!browsingWindow.getBrowserViews().includes(maskView)) createMaskView();
    clearTimeout(maskEventTimer);
    maskEventTimer = setTimeout(() => {
      if (maskView) {
        maskView.webContents.executeJavaScript(`
          document.body.style.backgroundColor = 'rgba(255, 255, 255, 0)';
          `);
        clearTimeout(maskDisappearTimer);
        maskDisappearTimer = setTimeout(() => {
          if (browsingWindow) browsingWindow.removeBrowserView(maskView);
        }, 120);
      }
    }, 300);
  });
  ipcMain.on('callMainWindowMethod', (evt, method, args = []) => {
    try {
      mainWindow[method](...args);
    } catch (ex) {
      console.error('callMainWindowMethod', method, JSON.stringify(args), '\n', ex);
    }
  });
  ipcMain.on('pip-watcher', (evt, args) => {
    browsingWindow.getBrowserViews()[0].webContents.executeJavaScript(args);
  });
  ipcMain.on('pip-window-fullscreen', () => {
    if (browsingWindow && browsingWindow.isFocused()) {
      browsingWindow.setFullScreen(!browsingWindow.isFullScreen());
      titlebarView.webContents
        .executeJavaScript(InjectJSManager.updateFullScreenIcon(browsingWindow.isFullScreen()));
    }
  });
  ipcMain.on('pip-window-close', (evt, args) => {
    const views = browsingWindow.getBrowserViews();
    if (views.length) {
      views.forEach((view) => {
        browsingWindow.removeBrowserView(view);
      });
      browserViewManager.pipClose();
      mainWindow.send('update-pip-state', args);
    }
  });
  ipcMain.on('remove-main-window', () => {
    browserViewManager.pauseVideo(mainWindow.getBrowserViews()[0]);
    mainWindow.hide();
  });
  ipcMain.on('remove-browser', () => {
    mainWindow.getBrowserViews()
      .forEach(mainWindowView => mainWindow.removeBrowserView(mainWindowView));
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    browserViewManager.pauseVideo();
    if (browsingWindow) {
      const views = browsingWindow.getBrowserViews();
      views.forEach((view) => {
        browsingWindow.removeBrowserView(view);
      });
      browserViewManager.pipClose();
      browsingWindow.close();
    }
    browserViewManager.clearAllBrowserViews();
  });
  ipcMain.on('go-to-offset', (evt, val) => {
    if (!browserViewManager) return;
    mainWindow.removeBrowserView(mainWindow.getBrowserViews()[0]);
    const newBrowser = val === 1 ? browserViewManager.forward() : browserViewManager.back();
    if (newBrowser.page) {
      mainWindow.addBrowserView(newBrowser.page.view);
      mainWindow.send('update-browser-state', {
        url: newBrowser.page.url,
        canGoBack: newBrowser.canBack,
        canGoForward: newBrowser.canForward,
      });
      newBrowser.page.view.setBounds({
        x: sidebar ? 76 : 0,
        y: 40,
        width: sidebar ? mainWindow.getSize()[0] - 76 : mainWindow.getSize()[0],
        height: mainWindow.getSize()[1] - 40,
      });
      newBrowser.page.view.setAutoResize({
        width: true, height: true,
      });
    }
  });
  // eslint-disable-next-line complexity
  ipcMain.on('change-channel', (evt, args) => {
    if (!browserViewManager) browserViewManager = new BrowserViewManager();
    const hostname = urlParse(args.url).hostname;
    let channel = hostname.slice(hostname.indexOf('.') + 1, hostname.length);
    if (args.url.includes('youtube')) {
      channel = 'youtube.com';
    }
    const mainBrowser = mainWindow.getBrowserViews()[0];
    if (mainBrowser) mainWindow.removeBrowserView(mainBrowser);
    const newChannel = browserViewManager.changeChannel(channel, args);
    const view = newChannel.view ? newChannel.view : newChannel.page.view;
    const url = newChannel.view ? args.url : newChannel.page.url;
    mainWindow.addBrowserView(view);
    setTimeout(() => {
      mainWindow.send('update-browser-state', {
        url,
        canGoBack: newChannel.canBack,
        canGoForward: newChannel.canForward,
      });
    }, 150);

    const bounds = mainWindow.getBounds();
    if (process.platform === 'win32' && mainWindow.isMaximized() && (bounds.x < 0 || bounds.y < 0)) {
      view.setBounds({
        x: sidebar ? 76 : 0,
        y: 40,
        width: sidebar ? bounds.width + (bounds.x * 2) - 76
          : bounds.width + (bounds.x * 2),
        height: bounds.height - 40,
      });
    } else {
      view.setBounds({
        x: sidebar ? 76 : 0,
        y: 40,
        width: sidebar ? mainWindow.getSize()[0] - 76 : mainWindow.getSize()[0],
        height: mainWindow.getSize()[1] - 40,
      });
    }
    view.setAutoResize({
      width: true, height: true,
    });
  });
  ipcMain.on('create-browser-view', (evt, args) => {
    if (!browserViewManager) browserViewManager = new BrowserViewManager();
    const hostname = urlParse(args.url).hostname;
    let channel = hostname.slice(hostname.indexOf('.') + 1, hostname.length);
    if (args.url.includes('youtube')) {
      channel = 'youtube.com';
    }
    const currentMainBrowserView = browserViewManager.create(channel, args);
    setTimeout(() => {
      mainWindow.send('update-browser-state', {
        url: args.url,
        canGoBack: currentMainBrowserView.canBack,
        canGoForward: currentMainBrowserView.canForward,
      });
    }, 0);
  });
  ipcMain.on('update-danmu-state', (evt, val) => {
    pipControlView.webContents.executeJavaScript(InjectJSManager.initBarrageIcon(val));
  });
  ipcMain.on('pip', () => {
    mainWindow.send('handle-exit-pip');
  });
  ipcMain.on('danmu', () => {
    mainWindow.send('handle-danmu-display');
  });
  ipcMain.on('handle-danmu-display', (evt, code) => {
    browsingWindow.getBrowserViews()[0].webContents.executeJavaScript(code);
  });
  ipcMain.on('mousemove', () => {
    if (browsingWindow && browsingWindow.isFocused()) {
      pipControlView.webContents.executeJavaScript(InjectJSManager.updatePipControlState(true));
      titlebarView.webContents.executeJavaScript(InjectJSManager.updatePipTitlebarToShow(true));
      if (pipTimer) {
        clearTimeout(pipTimer);
      }
      pipTimer = setTimeout(() => {
        if (pipControlView && !pipControlView.isDestroyed()) {
          pipControlView.webContents
            .executeJavaScript(InjectJSManager.updatePipControlState(false));
          titlebarView.webContents
            .executeJavaScript(InjectJSManager.updatePipTitlebarToShow(false));
        }
      }, 3000);
    }
  });
  ipcMain.on('pip-btn-mousemove', () => {
    if (pipTimer) {
      clearTimeout(pipTimer);
    }
  });
  ipcMain.on('pip-btn-mouseout', () => {
    if (pipTimer) {
      clearTimeout(pipTimer);
    }
    pipTimer = setTimeout(() => {
      if (pipControlView && !pipControlView.isDestroyed()) {
        pipControlView.webContents.executeJavaScript(InjectJSManager.updatePipControlState(false));
      }
    }, 3000);
  });
  ipcMain.on('mouseout', () => {
    if (browsingWindow && browsingWindow.isFocused()) {
      if (pipTimer) {
        clearTimeout(pipTimer);
      }
      pipControlView.webContents.executeJavaScript(InjectJSManager.updatePipControlState(false));
      titlebarView.webContents.executeJavaScript(InjectJSManager.updatePipTitlebarToShow(false));
    }
  });
  ipcMain.on('maximizable', (evt, val) => {
    if (val) {
      titlebarView.webContents.executeJavaScript(InjectJSManager.updateTitlebarState('.titlebarMax', true)
        + InjectJSManager.updateTitlebarState('.titlebarFull', false));
    } else {
      titlebarView.webContents.executeJavaScript(InjectJSManager.updateTitlebarState('.titlebarMax', false)
        + InjectJSManager.updateTitlebarState('.titlebarFull', true));
    }
  });
  ipcMain.on('update-mouse-info', (evt, args) => {
    if (browsingWindow && browsingWindow.isFocused()) {
      browsingWindow.send('update-mouse-info', args);
    }
  });
  ipcMain.on('update-full-state', (evt, isFullScreen) => {
    titlebarView.webContents.executeJavaScript(InjectJSManager.updateFullScreenIcon(isFullScreen));
  });
  ipcMain.on('mouseup', (evt, type) => {
    switch (type) {
      case 'close':
        browsingWindow.close();
        break;
      case 'min':
        browsingWindow.minimize();
        break;
      case 'full':
        browsingWindow.setFullScreen(true);
        titlebarView.webContents.executeJavaScript(InjectJSManager.updateFullScreenIcon(true));
        break;
      case 'recover':
        browsingWindow.setFullScreen(false);
        browsingWindow.getBrowserViews()[0].webContents
          .executeJavaScript(InjectJSManager.changeFullScreen(false));
        titlebarView.webContents.executeJavaScript(InjectJSManager.updateFullScreenIcon(false));
        break;
      case 'max':
        if (browsingWindow.isMaximized()) {
          browsingWindow.unmaximize();
          isBrowsingWindowMax = false;
        } else {
          browsingWindow.maximize();
          isBrowsingWindowMax = true;
          if (process.platform === 'win32') {
            titlebarView.webContents.executeJavaScript(InjectJSManager.updateWinMaxIcon(true));
          }
        }
        break;
      case 'unmax':
        browsingWindow.unmaximize();
        isBrowsingWindowMax = false;
        if (process.platform === 'win32') {
          titlebarView.webContents.executeJavaScript(InjectJSManager.updateWinMaxIcon(false));
        }
        break;
      default:
        break;
    }
  });
  ipcMain.on('shift-pip', (evt, args) => {
    if (!browserViewManager) return;
    const mainWindowViews = mainWindow.getBrowserViews();
    const mainView = mainWindowViews[0];
    mainWindowViews
      .forEach(mainWindowView => mainWindow.removeBrowserView(mainWindowView));
    const browViews = browsingWindow.getBrowserViews();
    browViews.forEach((view) => {
      browsingWindow.removeBrowserView(view);
    });
    const hostname = urlParse(mainView.webContents.getURL()).hostname;
    let channel = hostname.slice(hostname.indexOf('.') + 1, hostname.length);
    if (mainView.webContents.getURL().includes('youtube')) {
      channel = 'youtube.com';
    }
    const browsers = browserViewManager.changePip(channel);
    const pipBrowser = browsers.pipBrowser;
    const mainBrowser = browsers.mainBrowser;
    mainWindow.addBrowserView(mainBrowser.page.view);
    browsingWindow.addBrowserView(pipBrowser);
    createPipControlView();
    createTitlebarView();
    if (args.isGlobal) {
      browserViewManager.pauseVideo(mainWindow.getBrowserViews()[0]);
      mainWindow.hide();
    }
    mainBrowser.page.view.setBounds({
      x: sidebar ? 76 : 0,
      y: 40,
      width: sidebar ? mainWindow.getSize()[0] - 76 : mainWindow.getSize()[0],
      height: mainWindow.getSize()[1] - 40,
    });
    mainBrowser.page.view.setAutoResize({
      width: true, height: true,
    });
    pipBrowser.setBounds({
      x: 0, y: 0, width: browsingWindow.getSize()[0], height: browsingWindow.getSize()[1],
    });
    pipBrowser.setAutoResize({
      width: true, height: true,
    });
    mainWindow.send('update-browser-state', {
      url: mainBrowser.page.url,
      canGoBack: mainBrowser.canBack,
      canGoForward: mainBrowser.canForward,
    });
    pipControlView.webContents
      .executeJavaScript(InjectJSManager.updateBarrageState(args.barrageOpen, args.opacity));
    menuService.updateFocusedWindow(false, mainWindow && mainWindow.isVisible());
    browsingWindow.focus();
  });
  ipcMain.on('enter-pip', (evt, args) => {
    if (!browserViewManager) return;
    const browsers = browserViewManager.enterPip();
    const pipBrowser = browsers.pipBrowser;
    const mainBrowser = browsers.mainBrowser;
    if (!browsingWindow) {
      createBrowsingWindow();
      browsingWindow.setSize(args.pipInfo.pipSize[0], args.pipInfo.pipSize[1]);
      browsingWindow.setPosition(args.pipInfo.pipPos[0], args.pipInfo.pipPos[1]);
      mainWindow.send('init-pip-position');
      mainWindow.removeBrowserView(mainWindow.getBrowserViews()[0]);
      mainWindow.addBrowserView(mainBrowser.page.view);
      browsingWindow.addBrowserView(pipBrowser);
      createPipControlView();
      createTitlebarView();
      browsingWindow.show();
    } else {
      mainWindow.removeBrowserView(mainWindow.getBrowserViews()[0]);
      mainWindow.addBrowserView(mainBrowser.page.view);
      browsingWindow.setSize(args.pipInfo.pipSize[0], args.pipInfo.pipSize[1]);
      browsingWindow.addBrowserView(pipBrowser);
      createPipControlView();
      createTitlebarView();
      browsingWindow.show();
    }
    if (args.isGlobal) {
      mainWindow.hide();
    }
    browsingWindow.webContents.closeDevTools();
    browsingWindow.setAspectRatio(args.pipInfo.aspectRatio);
    browsingWindow.setMinimumSize(args.pipInfo.minimumSize[0], args.pipInfo.minimumSize[1]);
    mainBrowser.page.view.setBounds({
      x: sidebar ? 76 : 0,
      y: 40,
      width: sidebar ? mainWindow.getSize()[0] - 76 : mainWindow.getSize()[0],
      height: mainWindow.getSize()[1] - 40,
    });
    mainBrowser.page.view.setAutoResize({
      width: true,
      height: true,
    });
    pipBrowser.setBounds({
      x: 0, y: 0, width: browsingWindow.getSize()[0], height: browsingWindow.getSize()[1],
    });
    pipBrowser.setAutoResize({
      width: true, height: true,
    });
    browsingWindow.send('update-pip-listener');
    mainWindow.send('update-browser-state', {
      url: mainBrowser.page.url,
      canGoBack: mainBrowser.canBack,
      canGoForward: mainBrowser.canForward,
    });
    pipControlView.webContents
      .executeJavaScript(InjectJSManager.updateBarrageState(args.barrageOpen, args.opacity));
    menuService.updateFocusedWindow(false, mainWindow && mainWindow.isVisible());
    browsingWindow.focus();
  });
  ipcMain.on('update-pip-size', (evt, args) => {
    mainWindow.send('update-pip-size', args);
  });
  ipcMain.on('update-sidebar', (evt, sidebarstate) => {
    sidebar = sidebarstate;
  });
  ipcMain.on('set-bounds', (evt, args) => {
    if (pipControlView) pipControlView.setBounds(args.control);
    if (titlebarView) titlebarView.setBounds(args.titlebar);
  });
  ipcMain.on('exit-pip', (evt, args) => {
    if (!browserViewManager) return;
    browsingWindow.send('remove-pip-listener');
    mainWindow.show();
    mainWindow.getBrowserViews()
      .forEach(mainWindowView => mainWindow.removeBrowserView(mainWindowView));
    const browViews = browsingWindow.getBrowserViews();
    browViews.forEach((view) => {
      browsingWindow.removeBrowserView(view);
    });
    const exitBrowser = browserViewManager.exitPip();
    exitBrowser.page.view.webContents.executeJavaScript(args.jsRecover);
    if (args.cssRecover) exitBrowser.page.view.webContents.insertCSS(args.cssRecover);
    mainWindow.addBrowserView(exitBrowser.page.view);
    exitBrowser.page.view.setBounds({
      x: sidebar ? 76 : 0,
      y: 40,
      width: sidebar ? mainWindow.getSize()[0] - 76 : mainWindow.getSize()[0],
      height: mainWindow.getSize()[1] - 40,
    });
    exitBrowser.page.view.setAutoResize({
      width: true,
      height: true,
    });
    mainWindow.send('update-browser-state', {
      url: exitBrowser.page.url,
      canGoBack: exitBrowser.canBack,
      canGoForward: exitBrowser.canForward,
    });
    if (browsingWindow.isFullScreen()) {
      hideBrowsingWindow = true;
      browsingWindow.setFullScreen(false);
      exitBrowser.page.view.webContents.executeJavaScript('document.webkitCancelFullScreen();');
    } else {
      browsingWindow.hide();
    }
    mainWindow.show();
    menuService.updateFocusedWindow(true, mainWindow && mainWindow.isVisible());
  });
  // eslint-disable-next-line complexity
  ipcMain.on('set-window-maximize', () => {
    if (mainWindow && mainWindow.isFocused()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      const bounds = mainWindow.getBounds();
      if (process.platform === 'win32' && mainWindow.isMaximized() && (bounds.x < 0 || bounds.y < 0)) {
        mainWindow.getBrowserViews()[0].setBounds({
          x: sidebar ? 76 : 0,
          y: 40,
          width: sidebar ? bounds.width + (bounds.x * 2) - 76
            : bounds.width + (bounds.x * 2),
          height: bounds.height - 40,
        });
      } else {
        mainWindow.getBrowserViews()[0].setBounds({
          x: sidebar ? 76 : 0,
          y: 40,
          width: sidebar ? mainWindow.getSize()[0] - 76
            : mainWindow.getSize()[0],
          height: mainWindow.getSize()[1] - 40,
        });
      }
    } else if (browsingWindow && browsingWindow.isFocused()) {
      if (!isBrowsingWindowMax) {
        browsingWindow.maximize();
        isBrowsingWindowMax = true;
        if (process.platform === 'win32') {
          titlebarView.webContents.executeJavaScript(InjectJSManager.updateWinMaxIcon(true));
        }
      } else {
        browsingWindow.unmaximize();
        isBrowsingWindowMax = false;
        if (process.platform === 'win32') {
          titlebarView.webContents.executeJavaScript(InjectJSManager.updateWinMaxIcon(false));
        }
      }
    }
  });
  ipcMain.on('update-route-name', (e, route) => {
    routeName = route;
  });
  ipcMain.on('key-events', (e, keyCode) => {
    if (keyCode === 13) {
      browsingWindow.setFullScreen(!browsingWindow.isFullScreen());
      titlebarView.webContents
        .executeJavaScript(InjectJSManager.updateFullScreenIcon(browsingWindow.isFullScreen()));
    } else {
      browsingWindow.getBrowserViews()[0].webContents
        .executeJavaScript(InjectJSManager.emitKeydownEvent(keyCode));
    }
  });
  ipcMain.on('drop-subtitle', (event, args) => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    args.forEach((file) => {
      if (subRegex.test(path.extname(file)) || fs.statSync(file).isDirectory()) {
        tmpSubsToOpen.push(file);
      } else if (!subRegex.test(path.extname(file))
        && getValidVideoRegex().test(file)) {
        tmpVideoToOpen.push(file);
      }
    });
    finalVideoToOpen = getAllValidVideo(!tmpVideoToOpen.length,
      tmpVideoToOpen.concat(tmpSubsToOpen));
    if (process.mas && !tmpVideoToOpen.length && tmpSubsToOpen.length && !finalVideoToOpen) {
      mainWindow.webContents.send('open-subtitle-in-mas', tmpSubsToOpen[0]);
    } else if (tmpVideoToOpen.length + tmpSubsToOpen.length > 0) {
      mainWindow.webContents.send('open-file', { onlySubtitle: !tmpVideoToOpen.length, files: finalVideoToOpen });
    }
    finalVideoToOpen.splice(0, finalVideoToOpen.length);
    tmpSubsToOpen.splice(0, tmpSubsToOpen.length);
    tmpVideoToOpen.splice(0, tmpVideoToOpen.length);
  });
  ipcMain.on('windowPositionChange', (event, args) => {
    if (!mainWindow || event.sender.isDestroyed()) return;
    mainWindow.setPosition(...args);
    event.sender.send('windowPositionChange-asyncReply', mainWindow.getPosition());
  });
  ipcMain.on('windowInit', (event) => {
    if (!mainWindow || event.sender.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'windowMinimumSize', mainWindow.getMinimumSize());
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
    mainWindow.webContents.send('mainCommit', 'isFullScreen', mainWindow.isFullScreen());
    mainWindow.webContents.send('mainCommit', 'isFocused', mainWindow.isFocused());
  });
  ipcMain.on('writeLog', (event, level, log) => { // eslint-disable-line complexity
    if (!log) return;
    writeLog(level, log);
  });
  ipcMain.on('need-to-restore', () => {
    needToRestore = true;
    markNeedToRestore();
  });
  ipcMain.on('relaunch', () => {
    forceQuit = true;
    needBlockCloseLaborWindow = false;
    const switches = process.argv.filter(a => a.startsWith('-'));
    const argv = process.argv.filter(a => !a.startsWith('-'))
      .slice(0, app.isPackaged ? 1 : 2).concat(switches);
    app.relaunch({ args: argv.slice(1), execPath: argv[0] });
    app.quit();
  });
  ipcMain.on('add-preference', createPreferenceWindow);
  ipcMain.on('add-browsing', (e, args) => {
    createBrowsingWindow(args);
  });
  ipcMain.on('preference-to-main', (e, args) => {
    if (mainWindow && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('mainDispatch', 'setPreference', args);
    }
  });
  ipcMain.on('main-to-preference', (e, args) => {
    if (preferenceWindow && !preferenceWindow.webContents.isDestroyed()) {
      preferenceWindow.webContents.send('preferenceDispatch', 'setPreference', args);
    }
  });
  /** grab audio logic in main process start */
  function audioGrabCallBack(data) {
    try {
      if (mainWindow && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('grab-audio-update', data);
      }
    } catch (error) {
      // empty
    }
  }
  ipcMain.on('grab-audio', (events, data) => {
    audioGrabService.start(data);
    audioGrabService.removeListener('data', audioGrabCallBack);
    audioGrabService.on('data', audioGrabCallBack);
  });
  ipcMain.on('grab-audio-continue', () => {
    audioGrabService.next();
  });
  ipcMain.on('grab-audio-stop', () => {
    audioGrabService.stop();
  });
  /** grab audio logic in main process end */
}

function createMainWindow(openDialog, playlistId) {
  createLaborWindow();
  mainWindow = new BrowserWindow({
    useContentSize: true,
    frame: false,
    titleBarStyle: 'none',
    width: 720,
    height: 405,
    minWidth: 720,
    minHeight: 405,
    // it can be set true here and be changed during player starting
    transparent: false, // set to false to solve the backdrop-filter bug
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      experimentalFeatures: true,
      webviewTag: true,
    },
    // See https://github.com/electron/electron/blob/master/docs/api/browser-window.md#showing-window-gracefully
    backgroundColor: '#000000',
    acceptFirstMouse: false,
    show: false,
    ...({
      win32: {},
    })[process.platform],
  });
  if (
    (!welcomeProcessDone && fs.existsSync(path.join(userDataPath, 'WELCOME_PROCESS_MARK')))
    || welcomeProcessDone
  ) {
    welcomeProcessDone = true;
    finalVideoToOpen.length ? mainWindow.loadURL(`${mainURL}#/play`) : mainWindow.loadURL(mainURL);
  } else {
    mainWindow.loadURL(`${mainURL}#/welcome`);
  }
  mainWindow.webContents.setUserAgent(
    `${mainWindow.webContents.getUserAgent().replace(/Electron\S+/i, '')
    } SPlayerX@2018 ${os.platform()} ${os.release()} Version ${app.getVersion()}`,
  );
  menuService.setMainWindow(mainWindow);

  mainWindow.on('closed', () => {
    ipcMain.removeAllListeners(); // FIXME: decouple mainWindow and ipcMain
    mainWindow = null;
    menuService.setMainWindow(null);
    if (forceQuit) {
      needBlockCloseLaborWindow = false;
    }
    if (laborWindow) laborWindow.close();
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Open file by file association. Currently support 1 file only.
    finalVideoToOpen = getAllValidVideo(!tmpVideoToOpen.length,
      tmpVideoToOpen.concat(tmpSubsToOpen));
    if (process.mas && !tmpVideoToOpen.length && tmpSubsToOpen.length && !finalVideoToOpen) {
      mainWindow.webContents.send('open-subtitle-in-mas', tmpSubsToOpen[0]);
    } else if (tmpVideoToOpen.length + tmpSubsToOpen.length > 0) {
      mainWindow.webContents.send('open-file', { onlySubtitle: !tmpVideoToOpen.length, files: finalVideoToOpen });
    }
    if (openDialog) mainWindow.webContents.send('open-dialog', playlistId);
    finalVideoToOpen.splice(0, finalVideoToOpen.length);
    tmpSubsToOpen.splice(0, tmpSubsToOpen.length);
    tmpVideoToOpen.splice(0, tmpVideoToOpen.length);
    inited = true;
  });

  registerMainWindowEvent(mainWindow);

  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => { // wait some time to prevent `Object not found` error
      if (mainWindow) mainWindow.openDevTools({ mode: 'detach' });
    }, 1000);
  }
}

['left-drag', 'left-up'].forEach((channel) => {
  mouse.on(channel, (...args) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow || focusedWindow.webContents.isDestroyed()) return;
    if (focusedWindow.isMaximized()) return;
    if (process.platform === 'darwin' && focusedWindow !== browsingWindow) return;
    focusedWindow.send(`mouse-${channel}`, ...args);
  });
});

app.on('before-quit', () => {
  if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
  if (needToRestore) {
    mainWindow.webContents.send('quit', needToRestore);
  } else {
    mainWindow.webContents.send('quit');
  }
  forceQuit = true;
});

app.on('quit', () => {
  mouse.dispose();
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else if (app.isReady()) {
    createMainWindow();
  }
});


async function darwinOpenFilesToStart() {
  if (mainWindow && !mainWindow.webContents.isDestroyed()) { // sencond instance
    if (!inited) return;
    finalVideoToOpen = getAllValidVideo(!tmpVideoToOpen.length,
      tmpVideoToOpen.concat(tmpSubsToOpen));
    if (!tmpVideoToOpen.length && tmpSubsToOpen.length) {
      const allSubFiles = [];
      tmpSubsToOpen.forEach((file) => {
        if (subRegex.test(path.extname(file))) {
          allSubFiles.push(file);
        } else {
          allSubFiles.push(...searchSubsInDir(file));
        }
      });
      mainWindow.webContents.send('add-local-subtitles', allSubFiles);
    } else if (tmpVideoToOpen.length + tmpSubsToOpen.length > 0) {
      mainWindow.webContents.send('open-file', { onlySubtitle: !tmpVideoToOpen.length, files: finalVideoToOpen });
    }
    finalVideoToOpen.splice(0, finalVideoToOpen.length);
    tmpSubsToOpen.splice(0, tmpSubsToOpen.length);
    tmpVideoToOpen.splice(0, tmpVideoToOpen.length);
    if (!mainWindow.isVisible()) mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else if (app.isReady() && !mainWindow) {
    createMainWindow();
  }
}
const darwinOpenFilesToStartDebounced = debounce(darwinOpenFilesToStart, 100);
if (process.platform === 'darwin') {
  app.on('will-finish-launching', () => {
    app.on('open-file', (event, file) => {
      // TODO: clean code to remove duplicated check
      let ext;
      let isDirectory;
      try {
        ext = path.extname(file);
        isDirectory = fs.statSync(file).isDirectory();
      } catch (ex) {
        return;
      }
      if (subRegex.test(ext) || isDirectory) {
        tmpSubsToOpen.push(file);
      } else if (!subRegex.test(ext)
        && getValidVideoRegex().test(file)) {
        tmpVideoToOpen.push(file);
      }
      finalVideoToOpen = getAllValidVideo(!tmpVideoToOpen.length,
        tmpVideoToOpen.concat(tmpSubsToOpen));
      darwinOpenFilesToStartDebounced();
    });
  });
} else {
  const tmpFile = process.argv.slice(app.isPackaged ? 1 : 2);
  tmpFile.forEach((file) => {
    let ext;
    let isDirectory;
    try {
      ext = path.extname(file);
      isDirectory = fs.statSync(file).isDirectory();
    } catch (ex) {
      return;
    }
    if (subRegex.test(ext) || isDirectory) {
      tmpSubsToOpen.push(file);
    } else if (!subRegex.test(ext)
      && getValidVideoRegex().test(file)) {
      tmpVideoToOpen.push(file);
    }
  });
  finalVideoToOpen = getAllValidVideo(!tmpVideoToOpen.length,
    tmpVideoToOpen.concat(tmpSubsToOpen));
  app.on('second-instance', (event, argv) => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) {
      if (app.isReady()) createMainWindow();
    }
    const opendFiles = argv.slice(app.isPackaged ? 3 : 2);
    opendFiles.forEach((file) => {
      let ext;
      let isDirectory;
      try {
        ext = path.extname(file);
        isDirectory = fs.statSync(file).isDirectory();
      } catch (ex) {
        return;
      }
      if (subRegex.test(ext) || isDirectory) {
        tmpSubsToOpen.push(file);
      } else if (!subRegex.test(ext)
        && getValidVideoRegex().test(file)) {
        tmpVideoToOpen.push(file);
      }
    });
    finalVideoToOpen = getAllValidVideo(!tmpVideoToOpen.length,
      tmpVideoToOpen.concat(tmpSubsToOpen));
    if (!tmpVideoToOpen.length && tmpSubsToOpen.length) {
      const allSubFiles = [];
      tmpSubsToOpen.forEach((file) => {
        if (subRegex.test(path.extname(file))) {
          allSubFiles.push(file);
        } else {
          allSubFiles.push(...searchSubsInDir(file));
        }
      });
      mainWindow.webContents.send('add-local-subtitles', allSubFiles);
    } else if (tmpVideoToOpen.length + tmpSubsToOpen.length > 0) {
      mainWindow.webContents.send('open-file', { onlySubtitle: !tmpVideoToOpen.length, files: finalVideoToOpen });
    }
    finalVideoToOpen.splice(0, finalVideoToOpen.length);
    tmpSubsToOpen.splice(0, tmpSubsToOpen.length);
    tmpVideoToOpen.splice(0, tmpVideoToOpen.length);
  });
}

app.on('ready', () => {
  menuService = new MenuService();
  if (process.platform === 'darwin') {
    systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
      if (routeName === 'browsing-view') {
        menuService.updatePipIcon();
      }
    });
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true);
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true);
  }
  createMainWindow();
  app.setName('SPlayer');
  globalShortcut.register('CmdOrCtrl+Shift+I+O+P', () => {
    if (mainWindow) mainWindow.openDevTools({ mode: 'detach' });
  });
  globalShortcut.register('CmdOrCtrl+Shift+J+K+L', () => {
    if (preferenceWindow) preferenceWindow.openDevTools({ mode: 'detach' });
  });

  if (process.platform === 'win32') {
    globalShortcut.register('CmdOrCtrl+`', () => {
      handleBossKey();
    });
  }
});

app.on('window-all-closed', () => {
  if (
    (routeName === 'welcome-privacy' || routeName === 'language-setting')
    || process.platform !== 'darwin') {
    app.quit();
  }
});

const oauthRegex = [
  /^https:\/\/cnpassport.youku.com\//i,
  /^https:\/\/passport.iqiyi.com\/apis\/thirdparty/i,
  /^https:\/\/api.weibo.com\/oauth2/i,
  /^https:\/\/graph.qq.com\//i,
  /^https:\/\/open.weixin.qq.com\//i,
  /^https:\/\/openapi.baidu.com\//i,
  /^https:\/\/auth.alipay.com\/login\//i,
  /^https:\/\/account.xiaomi.com\/pass\//i,
];
app.on('web-contents-created', (webContentsCreatedEvent, contents) => {
  if (contents.getType() === 'browserView') {
    contents.on('new-window', (newWindowEvent, url) => {
      if (!oauthRegex.some(re => re.test(url))) {
        newWindowEvent.preventDefault();
      }
    });
  }
});

app.on('bossKey', handleBossKey);
app.on('add-preference', createPreferenceWindow);
app.on('add-windows-about', createAboutWindow);
app.on('check-for-updates', () => {
  if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
  mainWindow.webContents.send('check-for-updates');
});

app.on('menu-create-main-window', () => {
  if (!mainWindow) createMainWindow();
  else if (mainWindow.isMinimized()) {
    mainWindow.restore();
  } else if (!mainWindow.isVisible() && (!browsingWindow || !browsingWindow.isVisible())) {
    mainWindow.show();
  }
});

app.on('menu-open-dialog', (playlistId) => {
  createMainWindow(true, playlistId);
});

app.on('activate', () => {
  if (!mainWindow) {
    if (app.isReady()) createMainWindow();
  } else if (!mainWindow.isVisible() && (!browsingWindow || !browsingWindow.isVisible())) {
    mainWindow.show();
  }
  if (browsingWindow && browsingWindow.isMinimized()) {
    browsingWindow.restore();
  }
  if (mainWindow && mainWindow.isMinimized()) {
    mainWindow.restore();
  }
});
