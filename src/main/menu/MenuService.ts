import { ipcMain } from 'electron';
import Menu from './Menu';
import { IMenuDisplayInfo } from '../../renderer/interfaces/IRecentPlay';

export default class MenuService {
  private menu: Menu;

  private routeName: string;

  private windowClosed: boolean;

  public constructor() {
    this.menu = new Menu();
  }

  public setMainWindow(window: Electron.BrowserWindow) {
    this.windowClosed = false;
    this.menu.setMainWindow(window);
    this.registeMenuActions();
  }

  public minimize(isMinimized: boolean) {
    isMinimized ? this.menu.disableMenu() : this.menu.menuStateControl(this.routeName);
  }

  public closed() {
    this.windowClosed = true;
    this.routeName = 'landing-view';
    this.menu.disableMenu();
    this.menu.setMainWindow(null);
  }

  public handleBossKey(hide: boolean) {
    hide ? this.menu.disableMenu() : this.menu.menuStateControl(this.routeName);
  }

  private registeMenuActions() {
    ipcMain.on('popup-menu', () => {
      this.menu.popupMenu();
    });
    ipcMain.on('update-locale', () => {
      this.menu.updateLocale();
    });
    ipcMain.on('update-recent-play', (e: Event, items: IMenuDisplayInfo[]) => {
      this.menu.updateRecentPlay(items);
    });
    ipcMain.on('update-primary-sub', (e: Event, items: { id: string, label: string }[]) => {
      this.menu.updatePrimarySub(items);
    });
    ipcMain.on('update-secondary-sub', (e: Event, items: { id: string, label: string }[]) => {
      this.menu.updateSecondarySub(items);
    });
    ipcMain.on('update-audio-track', (e: Event, items: { id: string, label: string }[]) => {
      this.menu.updateAudioTrack(items);
    });
    ipcMain.on('update-route-name', (e: Event, routeName: string) => {
      this.routeName = this.menu.routeName = routeName;
      if (!this.windowClosed) this.menu.menuStateControl(routeName);
    });
    ipcMain.on('update-paused', (e: Event, paused: boolean) => {
      this.menu.updatePaused(paused);
    });
    ipcMain.on('update-fullscreen', (e: Event, isFullScreen: boolean) => {
      this.menu.updateFullScreen(isFullScreen);
    });
    ipcMain.on('update-checked', (e: Event, id: string, checked: boolean) => {
      this.menu.updateMenuItemChecked(id, checked);
    });
    ipcMain.on('update-enabled', (e: Event, id: string, enabled: boolean) => {
      this.menu.updateMenuItemEnabled(id, enabled);
    });
    ipcMain.on('enable-submenu-item', (e: Event, id: string, enabled: boolean) => {
      this.menu.enableSubmenuItem(id, enabled);
    });
  }
}
