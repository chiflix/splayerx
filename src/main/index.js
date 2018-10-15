import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron' // eslint-disable-line
import WindowResizer from './helpers/windowResizer.js';
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}
// See https://github.com/electron/electron/issues/4690
if (!process.defaultApp) {
  process.argv.unshift(null);
}
const cliArgs = process.argv.slice(2);
let startupOpenedFile = cliArgs.length ? cliArgs[0] : null;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}
app.on('second-instance', () => {
  if (mainWindow) {
    try {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } catch (err) {
      // pass
    }
  }
});

function registerMainWindowEvent() {
  mainWindow.on('resize', () => {
    mainWindow.webContents.send('mainCommit', 'windowSize', mainWindow.getSize());
    mainWindow.webContents.send('mainCommit', 'windowBounds', mainWindow.getBounds());
    mainWindow.webContents.send('mainCommit', 'isFullScreen', mainWindow.isFullScreen());
    mainWindow.webContents.send('mainCommit', 'isMaximized', mainWindow.isMaximized());
    mainWindow.webContents.send('main-resize');
  });
  mainWindow.on('move', () => {
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
    mainWindow.webContents.send('mainCommit', 'windowBounds', mainWindow.getBounds());
    mainWindow.webContents.send('main-move');
  });
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('mainCommit', 'isFullScreen', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('mainCommit', 'isFullScreen', false);
  });
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('mainCommit', 'isFocused', true);
  });
  mainWindow.on('blur', () => {
    mainWindow.webContents.send('mainCommit', 'isFocused', false);
  });

  ipcMain.on('callCurrentWindowMethod', (evt, method, args = []) => {
    const currentWindow = BrowserWindow.getFocusedWindow() || mainWindow;
    if (typeof (currentWindow[method]) === 'function') {
      currentWindow[method](...args);
    }
  });
  /* eslint-disable no-unused-vars */
  ipcMain.on('windowSizeChange', (event, args) => {
    mainWindow.setSize(...args);
    event.sender.send('windowSizeChange-asyncReply', mainWindow.getSize());
  });
  ipcMain.on('windowPositionChange', (event, args) => {
    mainWindow.setPosition(...args);
    event.sender.send('windowPositionChange-asyncReply', mainWindow.getPosition());
  });
  ipcMain.on('windowInit', () => {
    mainWindow.webContents.send('mainCommit', 'windowSize', mainWindow.getSize());
    mainWindow.webContents.send('mainCommit', 'windowMinimumSize', mainWindow.getMinimumSize());
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
    mainWindow.webContents.send('mainCommit', 'windowBounds', mainWindow.getBounds());
    mainWindow.webContents.send('mainCommit', 'isFullScreen', mainWindow.isFullScreen());
    mainWindow.webContents.send('mainCommit', 'isFocused', mainWindow.isFocused());
  });
}

function createWindow() {
  /**
   * Initial window options
   */
  const windowOptions = {
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
      experimentalFeatures: true,
    },
    // See https://github.com/electron/electron/blob/master/docs/api/browser-window.md#showing-window-gracefully
    backgroundColor: '#802e2c29',
    acceptFirstMouse: true,
    show: false,
    ...({
      win32: {},
    })[process.platform],
  };

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.loadURL(winURL);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Open file by file association. Currently support 1 file only.
    if (startupOpenedFile) {
      mainWindow.webContents.send('open-file', startupOpenedFile);
    }
  });

  const resizer = new WindowResizer(mainWindow);
  resizer.onStart(); // will only register listener for win
  registerMainWindowEvent();
}

if (process.platform === 'darwin') {
  app.on('will-finish-launching', () => {
    app.on('open-file', (event, file) => {
      startupOpenedFile = file;
    });
  });
}

app.on('ready', () => {
  app.setName('SPlayerX');
  globalShortcut.register('CommandOrControl+Shift+I+O+P', () => {
    if (mainWindow !== null) {
      mainWindow.openDevTools();
    }
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
