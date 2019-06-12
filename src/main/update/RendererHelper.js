import { ipcRenderer } from 'electron'; // eslint-disable-line
import { UpdaterMessage as Message } from './Message';

class RendererHelper {
  constructor(vueObject) {
    this.ipc = ipcRenderer;
    this.vue = vueObject;
    this.registerListener();
    this.rendererReady();
  }

  learntHasInstalledUpdate() {
    this.vue.show();
    this.vue.setMessage(this.vue.$t('msg.update.updateInstalled'));
    // it is a notification, and will disappear within specified time
    this.vue.startDisappear(10000);
    this.vue.setBreathType('breatheSuccess');
  }

  registerListener() {
    this.ipc.on('update-message', (event, arg) => {
      this.handleMessage(arg);
    });
  }

  // as main helper will be ready before renderer helper
  // will tell main it is ready then main can send message to renderer
  rendererReady() {
    const message = new Message(Message.rendererReadyTitle, 'void').toString();
    this.ipc.send('update-message', message);
  }

  // renderer now will receive two kind of messages
  // one is installed update last round for both mac and win
  // one is need to install update for only win
  handleMessage(arg) {
    const message = Message.getFromMessage(arg);
    switch (message.title) {
      case Message.installedMessageLastRoundTitle:
        this.learntHasInstalledUpdate(message);
        break;
      default:
        return message;
    }
    return null;
  }
}

export class RendererHelperForMac extends RendererHelper {
  learntHasInstalledUpdate() {
    super.learntHasInstalledUpdate();
    this.vue.forMac();
  }
}

/* the child class for windows will send message to render
 * if there is update which can be installed within 2 sec
 */
export class RendererHelperForWin extends RendererHelper {
  constructor(vueObject) {
    super(vueObject);
    // will only listen restartOrNotToInstallUpdate selection for once
    this.alreadySentWillInstallUpdateReply = false;
  }

  learntHasInstalledUpdate() {
    super.learntHasInstalledUpdate();
    this.vue.forWin();
  }

  hasUpdateWaitingForInstall() {
    this.vue.show();
    const buttons = [{
      text: this.vue.$t('msg.update.no'), callBack: this.notInstall, THIS: this, classC: 'defaultC',
    }, {
      text: this.vue.$t('msg.update.yes'), callBack: this.install, THIS: this, classC: 'importantC',
    }];
    this.vue.registerCallBackButton(buttons);
    this.vue.forWin();
    this.vue.setMessage(this.vue.$t('msg.update.message'));
    this.vue.setBreathType('breatheAlert');
  }

  restartOrNotToInstallUpdate(yesOrNo) {
    if (this.alreadySentWillInstallUpdateReply) {
      return;
    }
    this.vue.startDisappear(300);
    this.alreadySentWillInstallUpdateReply = true;
    const message = new Message(
      Message.willInstallOrNotTitle,
      { [Message.willInstallOrNotTitle]: yesOrNo },
    );
    this.ipc.send('update-message', message.toString());
  }

  install() {
    this.restartOrNotToInstallUpdate(true);
  }

  notInstall() {
    this.restartOrNotToInstallUpdate(false);
  }

  handleMessage(arg) {
    const message = super.handleMessage(arg);
    if (!message) return null;

    switch (message.title) {
      case Message.toInstallMessageNowTitle:
        this.hasUpdateWaitingForInstall(message);
        break;
      default:
    }
    return null;
  }
}
function getHelper() {
  switch (process.platform) {
    case 'win32':
      return RendererHelperForWin;
    case 'darwin':
      return RendererHelperForMac;
    default:
      // todo lyc
      return RendererHelper;
  }
}
const GetHelper = getHelper();
export default GetHelper;
