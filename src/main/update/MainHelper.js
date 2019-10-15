import { ipcMain } from 'electron' // eslint-disable-line
import Storage from './Updatestorage';
import { UpdaterMessage as Message, UpdateInfo } from './Message';

export class MainHelper {
  constructor(updater) {
    this.rendererReady = false;
    this.updater = updater;
    this.notifyWait = 200;
    this.storage = new Storage();
    this.hasNotifiedUpdateInstall = false;
    this.ipcMain = ipcMain;
  }

  onStart() {
    // check if installed update last round, if yes just notify renderer
    this.storage.needToNotifyUpdateInstalledOrNot().then((installedInfo) => {
      if (installedInfo) {
        this.hasNotifiedUpdateInstall = true;
        this.notifyRendererUpdateHasInstalled(installedInfo);
      }
    });
  }

  notifyRendererUpdateHasInstalled(installedInfo) {
    const message = new Message(Message.installedMessageLastRoundTitle, installedInfo);
    this.sendStatusToWindow(message.toString());
    this.storage.clearUpdateInstalled();
  }

  /* as main process will be ready before renderer it will wait
   * until renderer notify it is ready, this method is used in the place
   * where will send renderer messages
   */
  waitForRenderer() {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.rendererReady) {
          resolve('okay');
        } else {
          resolve(this.waitForRenderer());
        }
      }, this.notifyWait);
    });
  }

  registerMessageReceiver() {
    this.ipcMain.on('update-message', (event, arg) => {
      if (arg) {
        this.handleMessage(arg);
      }
    });
  }

  handleMessage(arg) {
    const message = Message.getFromMessage(arg);
    switch (message.title) {
      case Message.rendererReadyTitle:
        this.rendererReady = true;
        break;
      default:
        return message; // the returned message will be used by windows
    }
    return null;
  }

  sendStatusToWindow(text, channel = 'update-message') {
    // wait for renderer is ready
    this.waitForRenderer().then(() => {
      if (this.updater.win) {
        try {
          this.updater.win.webContents.send(channel, text);
        } catch (err) {
          // means window is closed
        }
      }
    });
  }
}

export class MainHelperForMac extends MainHelper {
  // for mac if it downloaded the update it will install it
  onUpdateDownloaded(info) {
    return new Promise((resolve) => {
      const infop = UpdateInfo.getFromUpdaterUpdateInfo(info);
      resolve(this.storage.willInstall(infop));
    });
  }
}

export class MainHelperForWin extends MainHelper {
  constructor(updater) {
    super(updater);
    this.withinStartInterval = true;
    this.startInterval = 15000;
    this.updateInfo = null;
    setTimeout(() => { this.withinStartInterval = false; }, this.startInterval);
  }

  // info is in updater's info format
  onUpdateDownloaded(info) {
    return new Promise((resolve) => {
      this.updateInfo = UpdateInfo.getFromUpdaterUpdateInfo(info);
      // if has notified user has installed update, will not notify use to install new update
      // if the update check is longer than startInterval will not notify use to install new update
      if (!this.hasNotifiedUpdateInstall && this.withinStartInterval) {
        this.storage.getPreviousDownload().then((oldInfo) => {
          if (this.updateInfo.after(oldInfo)) {
            resolve(this.storage.updateDownLoaded(this.updateInfo));
          } else if (this.updateInfo.equalTo(oldInfo)) {
            this.notifyRendererToInstallUpdate();
            resolve();
          }
        });
      }
      resolve();
    });
  }

  notifyRendererToInstallUpdate() {
    const message = new Message(Message.toInstallMessageNowTitle, this.updateInfo);
    this.sendStatusToWindow(message.toString());
  }

  getReplyAboutInstallUpdateOrNot(message) {
    if (message.body[Message.willInstallOrNotTitle]) {
      this.storage.willInstall(this.updateInfo).catch((err) => {
        console.log(err);
      });
      this.updater.quitAndInstall();
    }
  }

  handleMessage(arg) {
    const message = super.handleMessage(arg);
    if (!message) return;
    switch (message.title) {
      case Message.willInstallOrNotTitle:
        this.getReplyAboutInstallUpdateOrNot(message);
        break;
      default:
        break;
    }
  }
}

function MainHelperFactory() {
  switch (process.platform) {
    case 'win32':
      return MainHelperForWin;
    case 'darwin':
      return MainHelperForMac;
    default:
      return MainHelper;
  }
}
const GetMainHelper = MainHelperFactory();
export default GetMainHelper;
