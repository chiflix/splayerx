import { dialog } from 'electron'; // eslint-disable-line
import VueI18n from 'vue-i18n';
import Vue from 'vue';
import Promise from 'bluebird';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import messages from '../../renderer/locales';
const waitTime = 60 * 60 * 5 * 1000;
function setAutoUpdater() {
  // when the update is available, it will not download automatically
  autoUpdater.autoDownload = false;
  // if user does not install downloaded app, it will auto install when quit the app
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowDowngrade = false;
}
Vue.use(VueI18n);
const i18n = new VueI18n({
  locale: 'zhCN', // set locale
  messages, // set locale messages
});

const UpdaterFactory = (function () {
  let instance = null;

  class Updater {
    constructor(window, app) {
      this.currentUpdateInfo = null; // todo in future
      this.alreadyInUpdate = false;
      // check if auto updater module available
      if (!autoUpdater) {
        return null;
      }
      autoUpdater.logger = log;
      autoUpdater.logger.transports.file.level = 'info';
      this.win = window;
      this.app = app;
      this.getSystemLocale();
    }
    /*
     *it should be called when the app starts
     * it will not got any rejection as reject will be handled in startUpdate
     * , here is only resolved message
     */
    onStart() {
      return new Promise((resolve) => {
        this.startUpdate().then((message) => {
          if (message.substring(0, 5) === 'Error') {
            setTimeout(() => { resolve(this.onStart()); }, waitTime); // 5min check for once
          } else {
            this.ulog(`update finished lyc${message}`);
            resolve(message);
          }
        });
      });
    }
    getSystemLocale() {
      const localeMap = {
        'en': 'en',   // eslint-disable-line
        'en-AU': 'en',
        'en-CA': 'en',
        'en-GB': 'en',
        'en-NZ': 'en',
        'en-US': 'en',
        'en-ZA': 'en',
        'zh-CN': 'zhCN',
        'zh-TW': 'zhTW',
      };
      const locale = this.app.getLocale();
      i18n.locale = localeMap[locale] || i18n.locale;
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
                handelResolve('Err:Connect Error');
                break;
              case 'Error: net::ERR_NETWORK_CHANGED':
                handelResolve('Err:Connect Error');
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
          this.sendStatusToWindow(logMessage);
        });
        autoUpdater.on('update-downloaded', () => {
          // todo multi language
          dialog.showMessageBox({
            type: 'question',
            buttons: [i18n.t('msg.update.yes'), i18n.t('msg.update.no')],
            title: i18n.t('msg.update.title'),
            message: i18n.t('msg.update.message'),
          }, (response) => {
            if (response === 0) { // Runs the following if 'Yes' is clicked
              this.app.showExitPrompt = false;
              autoUpdater.quitAndInstall(false, false);
              resolve('restart');
            } else {
              handleResolve('wait');
            }
          });
        });
        autoUpdater.checkForUpdates().catch(handleRejection);
      });
    }

    sendStatusToWindow(text) {
      if (this.win) {
        try {
          this.win.webContents.send('update-message', text);
        } catch (err) {
          // means window is closed
        }
      }
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
    set Window(win) {
      this.win = win;
    }
    get Window() {
      return this.win;
    }
    ulog(object) {
      this.sendStatusToWindow(object.toString());
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
}());
export { UpdaterFactory as default };
