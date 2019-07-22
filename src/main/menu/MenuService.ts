import { ipcMain } from 'electron';
import Menu from './Menu';

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
    ipcMain.on('update-menu-item', (e: Event, id: string, property: string, value: any) => {
      this.menu.updateMenuItem(id, property, value);
    });
    ipcMain.on('update-submenu-item', (e: Event, id: string, enabled: boolean) => {
      this.menu.updateSubmenuItem(id, enabled);
    });
  }
}