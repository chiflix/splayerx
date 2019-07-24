import { ipcRenderer, remote, MenuItem } from 'electron';
import { recentPlayService } from '../media/RecentPlayService';

export default class MenuService {
  private menu?: Electron.Menu;

  public on(channel: string, callback: Function) {
    ipcRenderer.on(channel, callback);
  }

  public updateLocale() {
    ipcRenderer.send('update-locale');
  }

  public updateRouteName(routeName: string) {
    ipcRenderer.send('update-route-name', routeName);
  }

  public updatePaused(paused: boolean) {
    ipcRenderer.send('update-paused', paused);
  }

  public updateFullScreen(isFullScreen: boolean) {
    ipcRenderer.send('update-fullscreen', isFullScreen);
  }

  public updateMenuItemChecked(id: string, checked: boolean) {
    if (this.getMenuItemById(id)) this.getMenuItemById(id).checked = checked;
    else console.log(id);
  }

  public updateMenuItemEnabled(id: string, enabled: boolean) {
    if (this.getMenuItemById(id)) this.getMenuItemById(id).enabled = enabled;
    else console.log(id);
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

  public addPrimarySub(menuItem: Electron.MenuItem) {
    ipcRenderer.send('update-primary-sub', menuItem);
  }

  public addSecondarySub(menuItem: Electron.MenuItem) {
    ipcRenderer.send('update-secondary-sub', menuItem);
  }

  public addAudioTrack(menuItem: Electron.MenuItem) {
    ipcRenderer.send('update-audio-track', menuItem);
  }

  public getMenuItemById(id: string): Electron.MenuItem {
    if (!this.menu) this.menu = remote.Menu.getApplicationMenu() as Electron.Menu;
    return this.menu.getMenuItemById(id);
  }
}
