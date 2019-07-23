import { ipcRenderer, remote, MenuItem } from 'electron';
import { recentPlayService } from '../media/RecentPlayService';

export default class MenuService {
  private menu?: Electron.Menu;

  public on(channel: string, callback: Function) {
    ipcRenderer.on(channel, callback);
  }

  public updatePaused(paused: boolean) {
    ipcRenderer.send('update-paused', paused);
  }

  public updateFullScreen(isFullScreen: boolean) {
    ipcRenderer.send('update-fullscreen', isFullScreen);
  }

  public updateMenuItemChecked(id: string, checked: boolean) {
    ipcRenderer.send('update-checked', id, checked);
  }

  public updateMenuItemEnabled(id: string, enabled: boolean) {
    ipcRenderer.send('update-enabled', id, enabled);
  }

  public enableSubmenuItem(id: string, enabled: boolean) {
    ipcRenderer.send('enable-submenu-item', id, enabled);
  }

  public disableMenus() {
    this.enableSubmenuItem('playback', false);
    this.enableSubmenuItem('audio', false);
    this.enableSubmenuItem('subtitle', false);
    this.enableSubmenuItem('window', false);
    this.enableSubmenuItem('file', false);
  }

  public menuStateControl(routeName: string) {
    const inPlayingView = routeName === 'playing-view';
    const inWelcomeView = routeName === 'welcome-view' || routeName === 'language-setting';

    this.enableSubmenuItem('playback', inPlayingView);
    this.enableSubmenuItem('audio', inPlayingView);
    this.enableSubmenuItem('subtitle', inPlayingView);
    this.enableSubmenuItem('window', !inWelcomeView);
    this.enableSubmenuItem('file', !inWelcomeView);

    this.updateMenuItemEnabled('splayerx.preferences', !inWelcomeView);
    this.updateMenuItemEnabled('window.bossKey', inPlayingView);
    this.updateMenuItemEnabled('window.halfSize', inPlayingView);
    this.updateMenuItemEnabled('window.originSize', inPlayingView);
    this.updateMenuItemEnabled('window.doubleSize', inPlayingView);
    this.updateMenuItemEnabled('window.maxmize', inPlayingView);
    this.updateMenuItemEnabled('window.backToLandingView', inPlayingView);
    this.updateMenuItemEnabled('window.windowRotate', inPlayingView);
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
    ipcRenderer.send('refresh-menu');
  }

  public getMenuItemById(id: string): Electron.MenuItem {
    if (!this.menu) this.menu = remote.Menu.getApplicationMenu() as Electron.Menu;
    return this.menu.getMenuItemById(id);
  }
}
