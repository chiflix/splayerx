import { ipcMain } from 'electron';
import Menu from './Menu';
import { IMenuDisplayInfo } from '../../renderer/interfaces/IRecentPlay';

export default class MenuService {
  private menu: Menu;

  public constructor() {
    this.menu = new Menu();
    this.registeMenuActions();
  }

  public setMainWindow(window: Electron.BrowserWindow) {
    this.menu.setMainWindow(window);
  }

  private registeMenuActions() {
    ipcMain.on('update-recent-play', (e: Event, items: IMenuDisplayInfo[]) => {
      this.menu.updateRecentPlay(items);
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
