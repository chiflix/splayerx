import { app, BrowserWindow } from 'electron' // eslint-disable-line

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;


function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 432,
    useContentSize: true,
    width: 768,
    frame: false,
    titleBarStyle: 'hiddenInset',
    transparent: true,
    minWidth: 427,
    minHeight: 240,
    webPreferences: {
      webSecurity: false,
      experimentalFeatures: true,
    },
  });

  mainWindow.loadURL(winURL);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  app.setName('SPlayerX');
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

