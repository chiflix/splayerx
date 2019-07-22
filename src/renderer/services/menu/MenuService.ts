import { ipcRenderer, Menu } from 'electron';

export default class MenuService {
  private menu?: Electron.Menu;

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

  public updateSubmenuItem(id: string, enabled: boolean) {
    ipcRenderer.send('update-submenu-item', id, enabled);
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
}
