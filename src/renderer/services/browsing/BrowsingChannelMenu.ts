import { remote, ipcRenderer } from 'electron';
import { IBrowsingChannelMenu } from '@/interfaces/IBrowsingChannelMenu';
import Locale from '../../../shared/common/localize';

class BrowsingChannelMenu implements IBrowsingChannelMenu {
  private channelMenu: Electron.Menu;

  private deleteChannel: Electron.MenuItem;

  private currentChannel: string;

  private locale: Locale;

  public getChannelMenu(): Electron.Menu {
    return this.channelMenu;
  }

  public constructor() {
    this.locale = new Locale();
    this.currentChannel = '';
  }

  public createChannelMenu(channel: string) {
    remote.getCurrentWindow().webContents.once('context-menu', (e: Event) => {
      e.preventDefault();
      this.locale.getDisplayLanguage();
      this.channelMenu = new remote.Menu();
      this.currentChannel = channel;
      this.deleteChannel = new remote.MenuItem({
        label: this.locale.$t('browsing.remove'),
        click() { ipcRenderer.sendTo(remote.getCurrentWindow().webContents.id, 'delete-channel', channel); },
      });
      this.channelMenu.append(this.deleteChannel);
      this.channelMenu.popup();
    });
  }
}

export default new BrowsingChannelMenu();
