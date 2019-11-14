import { remote, ipcRenderer } from 'electron';
import { IBrowsingChannelMenu } from '@/interfaces/IBrowsingChannelMenu';
import { channelDetails } from '@/interfaces/IBrowsingChannelManager';
import Locale from '../../../shared/common/localize';

class BrowsingChannelMenu implements IBrowsingChannelMenu {
  private channelMenu: Electron.Menu;

  private removeChannel: Electron.MenuItem;

  private editChannel: Electron.MenuItem;

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
      this.removeChannel = new remote.MenuItem({
        label: this.locale.$t('browsing.remove'),
        click() { ipcRenderer.sendTo(remote.getCurrentWindow().webContents.id, 'remove-channel', channel); },
      });
      this.channelMenu.append(this.removeChannel);
      this.channelMenu.popup();
    });
  }

  public createCustomizedMenu(channel: string, item: channelDetails): void {
    remote.getCurrentWindow().webContents.once('context-menu', (e: Event) => {
      e.preventDefault();
      this.locale.getDisplayLanguage();
      this.channelMenu = new remote.Menu();
      this.currentChannel = channel;
      this.editChannel = new remote.MenuItem({
        label: this.locale.$t('browsing.edit'),
        click() {
          ipcRenderer.sendTo(remote.getCurrentWindow().webContents.id, 'edit-channel', item);
        },
      });
      this.channelMenu.append(this.editChannel);
      this.deleteChannel = new remote.MenuItem({
        label: this.locale.$t('browsing.delete'),
        click() {
          ipcRenderer.sendTo(remote.getCurrentWindow().webContents.id, 'delete-channel', channel);
        },
      });
      this.channelMenu.append(this.deleteChannel);
      this.channelMenu.popup();
    });
  }
}

export default new BrowsingChannelMenu();
