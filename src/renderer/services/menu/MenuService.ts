import { ipcRenderer, remote, MenuItem } from 'electron';
import { recentPlayService } from '../media/RecentPlayService';

export default class MenuService {
  private menu?: Electron.Menu;

  public on(channel: string, callback: Function) {
    ipcRenderer.on(channel, callback);
  }

  public updateMenuItemProperty(id: string, property: string, value: unknown) {
    if (!this.menu) this.menu = remote.Menu.getApplicationMenu() as Electron.Menu;
    const menuItem = this.menu.getMenuItemById(id);
    menuItem[property] = value;
  }

  public updateSubmenuItem(id: string, enabled: boolean) {
    if (!this.menu) this.menu = remote.Menu.getApplicationMenu() as Electron.Menu;
    const menuItem = this.menu.getMenuItemById(id);
    if (menuItem) {
      menuItem.submenu.items.forEach((item: Electron.MenuItem) => {
        item.enabled = enabled;
      });
    }
  }

  public menuStateControl(routeName: string) {
    const inPlayingView = routeName === 'playing-view';
    const inWelcomeView = routeName === 'welcome-view' || routeName === 'language-setting';

    this.updateSubmenuItem('playback', inPlayingView);
    this.updateSubmenuItem('audio', inPlayingView);
    this.updateSubmenuItem('subtitle', inPlayingView);
    this.updateSubmenuItem('window', !inWelcomeView);
    this.updateSubmenuItem('file', !inWelcomeView);

    this.updateMenuItemProperty('splayerx.preferences', 'enabled', !inWelcomeView);
    this.updateMenuItemProperty('window.halfSize', 'enabled', inPlayingView);
    this.updateMenuItemProperty('window.originSize', 'enabled', inPlayingView);
    this.updateMenuItemProperty('window.doubleSize', 'enabled', inPlayingView);
    this.updateMenuItemProperty('window.maxmize', 'enabled', inPlayingView);
    this.updateMenuItemProperty('window.backToLandingView', 'enabled', inPlayingView);
    this.updateMenuItemProperty('window.windowRotate', 'enabled', inPlayingView);
  }

  public resolvePlaylistDisplayState(state: boolean) {
    this.getMenuItemById('playback.forwardS').enabled = !state;
    this.getMenuItemById('playback.backwardS').enabled = !state;
  }

  public resolveSingleCycle(state: boolean) {
    this.getMenuItemById('playback.singleCycle').checked = state;
  }

  public resolveMute(state: boolean) {
    this.getMenuItemById('audio.mute').checked = state;
  }

  public async addRecentPlayItems() {
    const items = await recentPlayService.getMenuDisplayInfo();
    ipcRenderer.send('update-recent-play', items);
  }

  public refreshMenu() {

  }

  public getMenuItemById(id: string): Electron.MenuItem {
    if (!this.menu) this.menu = remote.Menu.getApplicationMenu() as Electron.Menu;
    return this.menu.getMenuItemById(id);
  }
}
