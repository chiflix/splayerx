import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import GetMainHelper from './MainHelper';

const waitTime = 5 * 1000; // todo need to set it

function setAutoUpdater() {
  // when the update is available, it will not download automatically
  autoUpdater.autoDownload = false;
  if (process.platform === 'win32') autoUpdater.autoInstallOnAppQuit = false;
  if (process.platform === 'darwin') autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
}
const UpdaterFactory = ((() => {
  let instance = null;

  class Updater {
    constructor(window, app) {
      this.currentUpdateInfo = null; // todo in future
      this.alreadyInUpdate = false;
      // check if auto updater module available
      if (!autoUpdater) {
        return null;
      }
      this.autoUpdater = autoUpdater;
      autoUpdater.logger = log;
      autoUpdater.logger.transports.file.level = 'info';
      this.win = window;
      this.app = app;
      this.mainHelper = new GetMainHelper(this);
      this.mainHelper.registerMessageReceiver();
    }

    /*
     *it should be called when the app starts
     * it will not got any rejection as reject will be handled in startUpdate
     * , here is only resolved message
     */
    onStart() {
      return new Promise((resolve) => {
        // test lyc ->
        // this.mainHelper.onUpdateDownloaded({ version: 123, note: 123 });
        // setTimeout(() => { this.mainHelper.onStart(); }, 2000);
        // <- test
        if (process.env.NODE_ENV === 'production') {
          this.mainHelper.onStart();
          this.startUpdate().then((message) => {
            if (message.substring(0, 5) === 'Error') {
              setTimeout(() => { resolve(this.onStart()); }, waitTime); // 5min check for once
            } else {
              this.ulog(`update finished lyc${message}`);
              resolve(message);
            }
          });
        } else {
          resolve('not production');
        }
      });
    }

    startUpdate() {
      return new Promise((resolve) => {
        const handelResolve = (message) => {
          this.alreadyInUpdate = false; // only one update allowed at one time
          resolve(message);
        };
        if (this.alreadyInUpdate) {
          this.ulog('already');
          handelResolve('Err:alreadyInUpdate');
        } else {
          this.alreadyInUpdate = true;
          setAutoUpdater();
          this.ulog('update checking started');

          this.doUpdate().catch((err) => {
            switch (err.toString()) {
              case 'Error: net::ERR_INTERNET_DISCONNECTED':
                handelResolve('Error:Connect Error');
                break;
              case 'Error: net::ERR_NETWORK_CHANGED':
                handelResolve('Error:Connect Error');
                break;
              case 'Error: net::ERR_CONNECTION_RESET':
                handelResolve('Error:Connect Error');
                break;
              default:
                handelResolve('Error:updateUnsuccessful');
                break;
            }
          }).then((info) => {
            handelResolve(info);
          });
        }
      });
    }

    doUpdate() {
      return new Promise((resolve, reject) => {
        const handleRejection = (err) => {
          this.ulog(`update error at rejection: ${err.stack}\n `);
          autoUpdater.removeAllListeners();
          reject(err);
        };
        const handleRejectionProcess = (err) => {
          this.ulog(`update error at process ejection: ${err.stack}\n `);
          autoUpdater.removeAllListeners();
          reject(err);
        };
        const handleResolve = (message) => {
          this.ulog(message);
          autoUpdater.removeAllListeners();
          resolve(message);
        };
        autoUpdater.on('checking-for-update', () => {
          this.ulog('checking-for-update');
        });
        process.on('uncaughtException', handleRejectionProcess);
        autoUpdater.on('update-available', (info) => {
          this.ulog(`update available ${JSON.stringify(info)}`);
          if (this.checkUpdateInfo(info)) {
            this.currentUpdateInfo = info;
            autoUpdater.downloadUpdate().catch(handleRejection);
          } else {
            handleResolve('updateNotAvailable');
          }
        });

        autoUpdater.on('update-not-available', () => {
          handleResolve('updateNotAvailable');
        });
        autoUpdater.on('error', (err) => {
          this.ulog(`update error at listener: ${err.stack}\n `);
        });
        autoUpdater.on('download-progress', (progressObj) => {
          let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
          logMessage = `${logMessage} - Downloaded ${progressObj.percent}%`;
          logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
          this.mainHelper.sendStatusToWindow(logMessage);
        });
        autoUpdater.on('update-downloaded', () => {
          this.mainHelper.onUpdateDownloaded(this.currentUpdateInfo);
        });
        autoUpdater.checkForUpdates().catch(handleRejection);
      });
    }

    quitAndInstall() {
      return new Promise((resolve) => {
        this.ulog('quit and install');
        resolve(autoUpdater.quitAndInstall());
      });
    }

    /*
     * for the future maybe
     * distribute update partially
     * based on version and platform to decide update or not
     */
    checkUpdateInfo(updateInfo) { // eslint-disable-line
      // todo
      this.currentUpdateInfo = '';
      updateInfo.toString();
      // compare(this.currentUpdateInfo, updateInfo);
      return true;
    }

    ulog(object) {
      this.mainHelper.sendStatusToWindow(object.toString(), 'update-message-test');
      log.info(object.toString());
    }
  }

  return {
    getInstance(win, app) {
      if (instance) {
        if (win && app) {
          instance.app = app;
          instance.win = win;
        }
        return instance;
      }
      instance = new Updater(win, app);
      return instance;
    },
  };
})());
export { UpdaterFactory as default };
