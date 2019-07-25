import { ipcRenderer, remote, MenuItem } from 'electron';
import { recentPlayService } from '../media/RecentPlayService';
import { log } from '@/libs/Log';

export default class MenuService {
  private menu?: Electron.Menu;

  public on(channel: string, callback: Function) {
    ipcRenderer.on(channel, callback);
  }

  public popupWinMenu() {
    ipcRenderer.send('popup-menu');
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
    else log.error('renderer/menuservice', `updateMenuItemChecked, ${id} ${checked}`);
  }

  public updateMenuItemEnabled(id: string, enabled: boolean) {
    if (this.getMenuItemById(id)) this.getMenuItemById(id).enabled = enabled;
    else log.error('renderer/menuservice', `updateMenuItemChecked, ${id} ${enabled}`);
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

  public isMenuItemChecked(id: string): boolean {
    if (this.getMenuItemById(id)) return this.getMenuItemById(id).checked;
    return false;
  }

  private getMenuItemById(id: string): Electron.MenuItem {
    if (!this.menu) this.menu = remote.Menu.getApplicationMenu() as Electron.Menu;
    return this.menu.getMenuItemById(id);
  }
}
