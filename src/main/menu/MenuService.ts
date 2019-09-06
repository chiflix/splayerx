import { ipcMain } from 'electron';
import Menu from './Menu';
import { IMenuDisplayInfo } from '../../renderer/interfaces/IRecentPlay';
import { SubtitleControlListItem } from '../../renderer/interfaces/ISubtitle';

export default class MenuService {
  private menu: Menu;

  public constructor() {
    this.menu = new Menu();
  }

  public setMainWindow(window: Electron.BrowserWindow | null) {
    this.menu.setMainWindow(window);
    if (window) this.registeMenuActions();
    else this.menu.closedMenu();
  }

  public enableMenu(enable: boolean) {
    this.menu.enableMenu(enable);
  }

  public updateFocusedWindow(isFocusedOnMain: boolean) {
    this.menu.updateFocusedWindow(isFocusedOnMain);
  }

  public updatePipIcon(isDarkMode: boolean) {
    this.menu.updatePipIcon(isDarkMode);
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
    ipcMain.on('update-label', (e: Event, id: string, label: string) => {
      this.menu.updateMenuItemLabel(id, label);
    });
    ipcMain.on('update-checked', (e: Event, id: string, checked: boolean) => {
      this.menu.updateMenuItemChecked(id, checked);
    });
    ipcMain.on('update-enabled', (e: Event, id: string, enabled: boolean) => {
      this.menu.updateMenuItemEnabled(id, enabled);
    });
    ipcMain.on('update-focused-window', (e: Event, isFocusedOnMain: boolean) => {
      this.menu.updateFocusedWindow(isFocusedOnMain);
    });
  }
}
