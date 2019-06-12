import { MainHelperForWin, MainHelperForMac } from '../../../../src/main/update/MainHelper';

class Updater {
  constructor(ipcMain) {
    this.win = { webContents: ipcMain };
  }

  quitAndInstall() {
    return this; // nothing here just a mock
  }
}

class MainHelperForMacS extends MainHelperForMac {
  constructor(ipcMain) {
    super(null);
    this.updater = new Updater(ipcMain);
    this.ipcMain = ipcMain;
    this.registerMessageReceiver();
  }
}
class MainHelperForWinS extends MainHelperForWin {
  constructor(ipcMain) {
    super(null);
    this.updater = new Updater(ipcMain);
    this.ipcMain = ipcMain;
    this.registerMessageReceiver();
  }
}
const getMainHelper = (platform, ipcMain) => {
  switch (platform) {
    case 'win32':
      return new MainHelperForWinS(ipcMain);
    case 'darwin':
      return new MainHelperForMacS(ipcMain);
    default:
      // todo
      return new MainHelperForMacS(ipcMain);
  }
};
export default getMainHelper;
