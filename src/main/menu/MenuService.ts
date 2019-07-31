import { ipcMain } from 'electron';
import Menu from './Menu';
import { IMenuDisplayInfo } from '../../renderer/interfaces/IRecentPlay';
import { SubtitleControlListItem } from '../../renderer/interfaces/ISubtitle';

export default class MenuService {
  private menu: Menu;

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
    this.menu.disable = isMinimized;
  }

  public closed() {
    this.windowClosed = true;
    this.menu.disable = true;
    this.menu.setMainWindow(null);
  }

  public handleBossKey(hide: boolean) {
    this.menu.disable = hide;
  }

  public updatePaused(paused: boolean) {
    this.menu.updatePaused(paused);
  }

  public updateFullScreen(isFullScreen: boolean) {
    this.menu.updateFullScreen(isFullScreen);
  }

  public updateIsPip(isPip: boolean) {
    this.menu.updateIsPip(isPip);
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
    ipcMain.on('update-primary-sub', (e: Event, items: { id: string, label: string, checked: boolean, subtitleItem: SubtitleControlListItem }[]) => {
      this.menu.updatePrimarySub(items);
    });
    ipcMain.on('update-secondary-sub', (e: Event, items: { id: string, label: string, checked: boolean, enabled: boolean, subtitleItem: SubtitleControlListItem }[]) => {
      this.menu.updateSecondarySub(items);
    });
    ipcMain.on('update-audio-track', (e: Event, items: { id: string, label: string }[]) => {
      this.menu.updateAudioTrack(items);
    });
    ipcMain.on('update-route-name', (e: Event, routeName: string) => {
      this.menu.routeName = routeName;
    });
    ipcMain.on('update-paused', (e: Event, paused: boolean) => {
      this.updatePaused(paused);
    });
    ipcMain.on('update-playingview-on-top', (e: Event, topOnWindow: boolean) => {
      this.menu.updatePlayingViewTop(topOnWindow);
    });
    ipcMain.on('update-browsingview-on-top', (e: Event, topOnWindow: boolean) => {
      this.menu.updateBrowsingViewTop(topOnWindow);
    });
    ipcMain.on('update-pip', (e: Event, isPip: boolean) => {
      this.updateIsPip(isPip);
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
