import { ipcRenderer, Menu } from 'electron';

export default class MenuService {
  private menu?: Electron.Menu;

  public constructor() {
    this.getMenu();
  }

  private getMenu() {
    if (!this.menu) this.menu = Menu.getApplicationMenu() as Menu;
    return Menu.getApplicationMenu() as Menu;
  }
  
  public on(channel: string, callback: Function) {
    ipcRenderer.on(channel, callback);
  }

  public updateMenuItemProperty(id: string, property: string, value: unknown) {
    ipcRenderer.send('update-menu-item', id, property, value);
  }
}
