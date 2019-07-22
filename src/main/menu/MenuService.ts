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
  }
}
