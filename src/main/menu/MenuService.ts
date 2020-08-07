import { app, ipcMain } from 'electron';
import { IBrowsingHistoryMenuInfo } from '@/interfaces/IBrowsingHistory';
import Menu from './Menu';
import { IMenuDisplayInfo } from '../../renderer/interfaces/IRecentPlay';
import { ISubtitleControlListItem } from '../../renderer/interfaces/ISubtitle';

export default class MenuService {
  private menu: Menu;

  public constructor() {
    this.menu = new Menu();
  }

  public setMainWindow(window: Electron.BrowserWindow | null) {
    this.menu.setMainWindow(window);
    if (window) this.registeMenuActions();
    else this.menu.closedMenu();
    setTimeout(() => app.emit('losslessStreaming-menu-update'), 50);
  }

  public enableMenu(enable: boolean) {
    this.menu.enableMenu(enable);
  }

  public updateMenuItemEnabled(id: string, enabled: boolean) {
    this.menu.updateMenuItemEnabled(id, enabled);
  }

  public updateFocusedWindow(isFocusedOnMain: boolean, isNewWindow: boolean) {
    this.menu.updateFocusedWindow(isFocusedOnMain, isNewWindow);
  }

  public updatePipIcon() {
    this.menu.updatePipIcon();
  }

  public updateAccount(user?: { displayName: string }) {
    this.menu.isAccountEnabled = true;
    this.menu.updateAccount(user);
  }

  private registeMenuActions() {
    ipcMain.on('popup-menu', () => {
      this.menu.popupMenu();
    });
    ipcMain.on('update-locale', () => {
      this.menu.updateLocale();
    });
    ipcMain.on('update-browisng-history', (e: Event, items: IBrowsingHistoryMenuInfo[]) => {
      this.menu.updateBrowsingHistory(items);
    });
    ipcMain.on('update-recent-play', (e: Event, items: IMenuDisplayInfo[]) => {
      this.menu.updateRecentPlay(items);
    });
    ipcMain.on('update-primary-sub', (e: Event, items: { id: string, label: string, checked: boolean, subtitleItem: ISubtitleControlListItem }[]) => {
      this.menu.updatePrimarySub(items);
    });
    ipcMain.on('update-secondary-sub', (e: Event, items: { id: string, label: string, checked: boolean, enabled: boolean, subtitleItem: ISubtitleControlListItem }[]) => {
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
    ipcMain.on('update-focused-window', (e: Event, isFocusedOnMain: boolean, isNewWindow: boolean) => {
      this.menu.updateFocusedWindow(isFocusedOnMain, isNewWindow);
    });
    ipcMain.on('update-professinal-menu', (e: Event, isProfessinal: boolean) => {
      this.menu.updateMenuByProfessinal(isProfessinal);
    });
    ipcMain.on('update-professinal-reference', (e: Event, sub?: ISubtitleControlListItem) => {
      this.menu.updateProfessinalReference(sub);
    });
    ipcMain.on('update-professinal-prev-menu-enable', (e: Event, enabled: boolean) => {
      this.menu.updateAdvancedMenuPrev(enabled);
    });
    ipcMain.on('update-professinal-next-menu-enable', (e: Event, enabled: boolean) => {
      this.menu.updateAdvancedMenuNext(enabled);
    });
    ipcMain.on('update-professinal-enter-menu-enable', (e: Event, enabled: boolean) => {
      this.menu.updateAdvancedMenuEnter(enabled);
    });
    ipcMain.on('update-professinal-undo-menu-enable', (e: Event, enabled: boolean) => {
      this.menu.updateAdvancedMenuUndo(enabled);
    });
    ipcMain.on('update-professinal-redo-menu-enable', (e: Event, enabled: boolean) => {
      this.menu.updateAdvancedMenuRedo(enabled);
    });
  }
}
