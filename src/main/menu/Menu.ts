import {
  app, Menu, MenuItem, shell, nativeImage, systemPreferences,
} from 'electron';
import { cloneDeep } from 'lodash';
import {
  IMenubarMenu,
  IMenubarMenuItemAction,
  IMenubarMenuItemRole,
  IMenubarMenuItemSeparator,
  IMenubarMenuItemSubmenu,
  IMenubarMenuState,
  MenubarMenuItem,
  MenuName,
} from './common/Menubar';
import { IsMacintosh } from '../../shared/common/platform';
import Locale from '../../shared/common/localize';
import menuTemplate from './menu.json';
import { IMenuDisplayInfo } from '../../renderer/interfaces/IRecentPlay';
import { SubtitleControlListItem, Type } from '../../renderer/interfaces/ISubtitle';

function separator(): Electron.MenuItem {
  return new MenuItem({ type: 'separator' });
}
function isSeparator(menuItem: MenubarMenuItem): menuItem is IMenubarMenuItemSeparator {
  return menuItem.id === 'menubar.separator';
}
function isSubmenu(menuItem: MenubarMenuItem): menuItem is IMenubarMenuItemSubmenu {
  return (menuItem as IMenubarMenuItemSubmenu).submenu !== undefined;
}
function isRole(menuItem: MenubarMenuItem): menuItem is IMenubarMenuItemRole {
  return (menuItem as IMenubarMenuItemRole).role !== undefined;
}

export default class Menubar {
  private mainWindow: Electron.BrowserWindow | null;

  private locale: Locale;

  private menubar: Electron.Menu;

  private currentMenuState: IMenubarMenuState;

  private recentPlay: IMenuDisplayInfo[];

  private audioTracks: { id: string, label: string }[];

  private focusOnMainWindow = true;

  private primarySubs: {
    id: string, label: string, checked: boolean, subtitleItem: SubtitleControlListItem,
  }[];

  private secondarySubs: {
    id: string, label: string, checked: boolean,
    enabled: boolean, subtitleItem: SubtitleControlListItem,
  }[];

  private _routeName: string;

  public set routeName(val: string) {
    this._routeName = val;
    this.menuStateControl();
  }

  public updateFocusedWindow(isMainWindow: boolean, isNewWindow: boolean) {
    if (this.focusOnMainWindow !== isMainWindow) {
      if (!isMainWindow) {
        this.updateMenuItemEnabled('history.back', false);
        this.updateMenuItemEnabled('history.forward', false);
        this.updateMenuItemEnabled('history.reload', false);
        this.updateMenuItemEnabled(isNewWindow ? 'browsing.window.playInNewWindow' : 'browsing.window.pip', true);
        this.updateMenuItemEnabled('browsing.window.keepPipFront', true);
        this.updateMenuItemLabel('browsing.window.pip', 'msg.window.exitPip');
        this.updateMenuItemLabel('browsing.window.playInNewWindow', 'msg.window.backToBrowser');
      } else {
        this.updateMenuItemEnabled('browsing.window.keepPipFront', false);
        this.updateMenuItemLabel('browsing.window.pip', 'msg.window.enterPip');
        this.updateMenuItemLabel('browsing.window.playInNewWindow', 'msg.window.playInNewWindow');
      }
      this.focusOnMainWindow = isMainWindow;
    }
  }

  public constructor() {
    this.locale = new Locale();
    this.currentMenuState = cloneDeep(menuTemplate as IMenubarMenuState);
    this.menuStateControl();
  }

  public setMainWindow(window: Electron.BrowserWindow | null) {
    // may replace this way of getting mainWindow by window service or else...
    if (window) {
      this.currentMenuState = cloneDeep(menuTemplate as IMenubarMenuState);
      this.menuStateControl();
    }
    this.mainWindow = window;
  }

  public popupMenu() {
    if (this.mainWindow) {
      this.menubar.popup();
    }
  }

  public closedMenu() {
    const oldMenu = Menu.getApplicationMenu();

    // @ts-ignore
    if (oldMenu !== null) oldMenu.clear();

    this.menubar = this.createClosedMenu();

    this.updateRecentPlay();

    if (this.menubar.items && this.menubar.items.length > 0) {
      Menu.setApplicationMenu(this.menubar);
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  public menuStateControl() {
    if (!this._routeName) this._routeName = 'landing-view';

    // Store old menu in our array to avoid GC to collect the menu and crash. See #55347
    // TODO@sbatten Remove this when fixed upstream by Electron
    const oldMenu = Menu.getApplicationMenu();

    // If we don't have a menu yet, set it to null to avoid the electron menu.
    // This should only happen on the first launch ever
    if (!oldMenu && IsMacintosh) {
      Menu.setApplicationMenu(new Menu());
      return;
    }
    // @ts-ignore
    if (oldMenu) oldMenu.clear();

    switch (this._routeName) {
      case 'landing-view':
        this.menubar = this.createLandingViewMenu();
        break;

      case 'playing-view':
        this.menubar = this.createPlayingViewMenu();
        break;

      case 'welcome-privacy':
      case 'language-setting':
        this.menubar = this.createWelcomeViewMenu();
        break;

      case 'browsing-view':
        this.menubar = this.createBrowsingViewMenu();
        break;

      default:
        break;
    }

    if (this.menubar.items && this.menubar.items.length > 0) {
      Menu.setApplicationMenu(this.menubar);
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  public enableMenu(enable: boolean) {
    if (enable) {
      if (this._routeName === 'playing-view') {
        this.refreshMenu('playback');
        this.refreshMenu('audio');
        this.refreshMenu('subtitle');
        this.refreshMenu('window');

        this.updateAudioTrack();
        this.updatePrimarySub();
        this.updateSecondarySub();
      } else if (this._routeName === 'browsing-view') {
        this.refreshMenu('edit');
        this.refreshMenu('history');
        this.refreshMenu('browsing.window');
      }
    } else {
      if (this._routeName === 'playing-view') {
        this.disableSubmenuItem('playback');
        this.disableSubmenuItem('audio');
        this.disableSubmenuItem('subtitle');
        this.disableSubmenuItem('window');
      }

      if (this._routeName === 'browsing-view') {
        this.disableSubmenuItem('edit');
        this.disableSubmenuItem('history');
        this.disableSubmenuItem('browsing.window');
      }
    }

    this.updateMenuItemEnabled('file.clearHistory', enable);
    this.updateMenuItemEnabled('file.closeWindow', enable);
  }

  public updateLocale() {
    this.locale.getDisplayLanguage();
    this.menuStateControl();
  }

  public updateMenuItemLabel(id: string, label: string) {
    const result = this.getMenuStateById(id);
    // @ts-ignore
    if (result) result.label = label;
    // @ts-ignore
    const menu = this.getRelatedMenuById(id);
    this.refreshMenu(menu as MenuName);
  }

  public updateMenuItemChecked(id: string, checked: boolean) {
    const result = this.getMenuStateById(id);
    // @ts-ignore
    if (result) result.checked = checked;

    if (this.menubar.getMenuItemById(id)) {
      this.menubar.getMenuItemById(id).checked = checked;
    }
  }

  public updatePipIcon() {
    this.refreshMenu('browsing.window');
  }

  public updateMenuItemEnabled(id: string, enabled: boolean) {
    const result = this.getMenuStateById(id);
    // @ts-ignore
    if (result) result.enabled = enabled;

    if (this.menubar.getMenuItemById(id)) {
      this.menubar.getMenuItemById(id).enabled = enabled;
    }
  }

  public updateRecentPlay(items?: IMenuDisplayInfo[]) {
    if (items) this.recentPlay = items;
    const recentMenu = this.getSubmenuById('file.openRecent');
    if (!recentMenu) return;
    // @ts-ignore
    recentMenu.clear();

    this.recentPlay.forEach(({ id, label }) => {
      const item = new MenuItem({
        id: `file.openRecent.${id}`,
        label,
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.webContents.send('file.openRecent', id);
          } else {
            app.emit('menu-open-dialog', id);
          }
        },
      });
      recentMenu.append(item);
    });

    Menu.setApplicationMenu(this.menubar);
  }

  public updatePrimarySub(
    items?: {
      id: string, label: string, checked: boolean, subtitleItem: SubtitleControlListItem,
    }[],
  ) {
    if (items) this.primarySubs = items;
    const primarySubMenu = this.getSubmenuById('subtitle.mainSubtitle');
    if (primarySubMenu) {
      // @ts-ignore
      primarySubMenu.clear();
      this.primarySubs.forEach(({
        id, label, checked, subtitleItem,
      }) => {
        const item = new MenuItem({
          id: `subtitle.mainSubtitle.${id}`,
          type: 'checkbox',
          label,
          checked,
          click: () => {
            if (this.mainWindow) {
              if (subtitleItem && subtitleItem.type === Type.Translated) this.menubar.getMenuItemById('subtitle.mainSubtitle.off').checked = true;
              this.mainWindow.webContents.send('subtitle.mainSubtitle', id, subtitleItem);
            }
          },
        });
        primarySubMenu.append(item);
      });

      Menu.setApplicationMenu(this.menubar);
    }
  }

  public updateSecondarySub(
    items?: {
      id: string, label: string, checked: boolean,
      enabled: boolean, subtitleItem: SubtitleControlListItem,
    }[],
  ) {
    if (items) this.secondarySubs = items;
    const secondarySubMenu = this.getSubmenuById('subtitle.secondarySubtitle');
    if (secondarySubMenu) {
      // @ts-ignore
      secondarySubMenu.clear();
      this.secondarySubs.forEach(({
        id, label, checked, enabled, subtitleItem,
      }) => {
        let type: ('normal' | 'separator' | 'submenu' | 'checkbox' | 'radio') = 'checkbox';
        if (id === 'secondarySub') type = 'normal';
        else if (id === 'menubar.separator') type = 'separator';
        const item = new MenuItem({
          id: `subtitle.secondarySubtitle.${id}`,
          type,
          label,
          checked,
          enabled,
          click: () => {
            if (this.mainWindow) {
              if (subtitleItem && subtitleItem.type === Type.Translated) this.menubar.getMenuItemById('subtitle.secondarySubtitle.off').checked = true;
              this.mainWindow.webContents.send('subtitle.secondarySubtitle', id, subtitleItem);
            }
          },
        });
        secondarySubMenu.append(item);
      });

      Menu.setApplicationMenu(this.menubar);
    }
  }

  public updateAudioTrack(items?: { id: string, label: string }[]) {
    if (items) this.audioTracks = items;
    const audioTrackMenu = this.getSubmenuById('audio.switchAudioTrack');
    if (audioTrackMenu) {
      // @ts-ignore
      audioTrackMenu.clear();
      this.audioTracks.forEach(({ id, label }) => {
        const item = new MenuItem({
          id: `audio.switchAudioTrack.${id}`,
          type: 'radio',
          label,
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.webContents.send('audio.switchAudioTrack', id);
            }
          },
        });
        audioTrackMenu.append(item);
      });

      Menu.setApplicationMenu(this.menubar);
    }
  }

  private getRelatedMenuById(id: string): string {
    if (id.startsWith('browsing')) return 'browsing.window';
    const idArray = id.split('.');
    return idArray[0];
  }

  private getMenuStateById(id: string):
  MenubarMenuItem | undefined {
    if (id.startsWith('browsing')) {
      return this.currentMenuState['browsing.window']
        .items.find((menuItem: MenubarMenuItem) => menuItem.id === id);
    }
    const idArray = id.split('.');
    const result = this.currentMenuState[idArray[0]]
      .items.find((menuItem: MenubarMenuItem) => menuItem.id === id);
    return result;
  }

  private getSubmenuById(id: string) {
    const menuItem = this.menubar.getMenuItemById(id);
    return menuItem && menuItem.submenu;
  }

  private refreshMenu(menuName: MenuName) {
    const menu = this.getSubmenuById(menuName);

    if (!menu) return;
    // @ts-ignore
    menu.clear();

    this.getMenuItemTemplate(menuName).items.forEach((menuItem: MenubarMenuItem) => {
      if (isSeparator(menuItem)) {
        const item = separator();
        menu.append(item);
      } else if (isSubmenu(menuItem)) {
        const item = this.createSubMenuItem(menuItem);
        menu.append(item);
      } else if (isRole(menuItem)) {
        const item = this.createRoleMenuItem(menuItem);
        menu.append(item);
      } else {
        const item = this.createMenuItem(menuItem);
        menu.append(item);
      }
    });

    Menu.setApplicationMenu(this.menubar);
  }

  private disableSubmenuItem(id: string) {
    const menuItem = this.menubar.getMenuItemById(id);
    if (menuItem && menuItem.submenu) {
      menuItem.submenu.items.forEach((item: Electron.MenuItem) => {
        item.enabled = false;
        if (item.submenu) {
          item.submenu.items.forEach((item: Electron.MenuItem) => {
            item.enabled = false;
          });
        }
      });
    }
  }

  private $t(msg: string): string {
    return this.locale.$t(msg);
  }

  private createClosedMenu(): Electron.Menu {
    const menubar = new Menu();

    if (IsMacintosh) {
      // Mac: Application
      const macApplicationMenuItem = this.createMacApplicationMenu();

      menubar.append(macApplicationMenuItem);

      // File
      const fileMenu = new Menu();

      fileMenu.append(this.createMenuItem(
        this.getMenuItemTemplate('file').items
          .find((item: MenubarMenuItem) => item.id === 'file.open') as IMenubarMenuItemAction,
      ));

      fileMenu.append(this.createSubMenuItem(
        this.getMenuItemTemplate('file').items
          .find((item: MenubarMenuItem) => item.id === 'file.openRecent') as IMenubarMenuItemSubmenu,
      ));

      const fileMenuItem = new MenuItem({ id: 'file', label: this.$t('msg.file.name'), submenu: fileMenu });

      menubar.append(fileMenuItem);
    }
    // Help
    const helpMenuItem = this.createHelpMenu();

    menubar.append(helpMenuItem);

    return menubar;
  }

  private createLandingViewMenu(): Electron.Menu {
    // Menus
    const menubar = new Menu();

    if (IsMacintosh) {
      // Mac: Application
      const macApplicationMenuItem = this.createMacApplicationMenu();

      menubar.append(macApplicationMenuItem);

      // File
      const fileMenuItem = this.createFileMenu();

      menubar.append(fileMenuItem);
    } else {
      // File
      this.getMenuItemTemplate('file').items.forEach((item: MenubarMenuItem) => {
        if (item.id === 'file.open') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.openRecent') {
          const menuItem = item as IMenubarMenuItemSubmenu;
          menubar.append(this.createSubMenuItem(menuItem));
        } else if (item.id === 'file.closeWindow') {
          const menuItem = item as IMenubarMenuItemRole;
          menubar.append(this.createRoleMenuItem(menuItem));
        }
      });

      menubar.append(separator());

      const preference = this.createMenuItem('msg.splayerx.preferences', () => {
        app.emit('add-preference');
      }, 'Ctrl+,', true);

      menubar.append(preference);
    }

    // Favourite
    const favouriteMenuItem = this.createFavouriteMenu();

    menubar.append(favouriteMenuItem);

    // Window
    const windowMenu = new Menu();

    const items = this.getMenuItemTemplate('window').items;

    const fullscreenMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.fullscreen') as IMenubarMenuItemAction;

    windowMenu.append(this.createMenuItem(fullscreenMenuItem));

    const minimizeMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.minimize') as IMenubarMenuItemRole;

    windowMenu.append(this.createRoleMenuItem(minimizeMenuItem));

    const windowMenuItem = new MenuItem({ id: 'window', label: this.$t('msg.window.name'), submenu: windowMenu });

    menubar.append(windowMenuItem);

    // Help
    const helpMenuItem = this.createHelpMenu();

    menubar.append(helpMenuItem);

    if (!IsMacintosh) {
      const quitMenuItem = this.createMenuItem('msg.splayerx.quit', () => {
        app.quit();
      }, 'Ctrl+q', true);

      menubar.append(quitMenuItem);
    }

    return menubar;
  }

  private createPlayingViewMenu(): Electron.Menu {
    // Menus
    const menubar = new Menu();

    if (IsMacintosh) {
      // Mac: Application
      const macApplicationMenuItem = this.createMacApplicationMenu();

      menubar.append(macApplicationMenuItem);

      // File
      const fileMenuItem = this.createFileMenu();

      menubar.append(fileMenuItem);
    } else {
      // File
      this.getMenuItemTemplate('file').items.forEach((item: MenubarMenuItem) => {
        if (item.id === 'file.open') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.openRecent') {
          const menuItem = item as IMenubarMenuItemSubmenu;
          menubar.append(this.createSubMenuItem(menuItem));
        } else if (item.id === 'file.closeWindow') {
          const menuItem = item as IMenubarMenuItemRole;
          menubar.append(this.createRoleMenuItem(menuItem));
        }
      });

      menubar.append(separator());

      const preference = this.createMenuItem('msg.splayerx.preferences', () => {
        app.emit('add-preference');
      }, 'Ctrl+,', true);

      menubar.append(preference);
    }

    // PlayBack
    const playbackMenuItem = this.createPlaybackMenu();

    menubar.append(playbackMenuItem);

    // Audio
    const audioMenuItem = this.createAudioMenu();

    menubar.append(audioMenuItem);

    // Subtitle
    const subtitleMenuItem = this.createSubtitleMenu();

    menubar.append(subtitleMenuItem);

    // Window
    const windowMenuItem = this.createWindowMenu();

    menubar.append(windowMenuItem);

    // Help
    const helpMenuItem = this.createHelpMenu();

    menubar.append(helpMenuItem);

    if (!IsMacintosh) {
      const quitMenuItem = this.createMenuItem('msg.splayerx.quit', () => {
        app.quit();
      }, 'Ctrl+q', true);

      menubar.append(quitMenuItem);
    }

    return menubar;
  }

  private createBrowsingViewMenu(): Electron.Menu {
    // Menus
    const menubar = new Menu();

    if (IsMacintosh) {
      // Mac: Application
      const macApplicationMenuItem = this.createMacApplicationMenu();

      menubar.append(macApplicationMenuItem);

      // File
      const fileMenu = new Menu();

      const items = this.getMenuItemTemplate('file').items;
      const playbackItems = this.getMenuItemTemplate('playback').items;

      const openMenuItemTemplate = items.find((item: MenubarMenuItem) => item.id === 'file.open') as IMenubarMenuItemAction;
      const openMenuItem = this.createMenuItem(openMenuItemTemplate);

      const closeWindowTemplate = items.find((item: MenubarMenuItem) => item.id === 'file.closeWindow') as IMenubarMenuItemRole;
      const closeMenuItem = this.createRoleMenuItem(closeWindowTemplate);

      const snapShotTemplate = playbackItems.find((item: MenubarMenuItem) => item.id === 'playback.snapShot') as IMenubarMenuItemAction;
      const snapShotMenuItem = this.createMenuItem(snapShotTemplate);
      [openMenuItem, closeMenuItem, separator(), snapShotMenuItem].forEach(i => fileMenu.append(i));

      const fileMenuItem = new MenuItem({ label: this.$t('msg.file.name'), submenu: fileMenu });

      menubar.append(fileMenuItem);
    } else {
      // File
      this.getMenuItemTemplate('file').items.forEach((item: MenubarMenuItem) => {
        if (item.id === 'file.open') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.closeWindow') {
          const menuItem = item as IMenubarMenuItemRole;
          menubar.append(this.createRoleMenuItem(menuItem));
        }
      });

      menubar.append(separator());

      const preference = this.createMenuItem('msg.splayerx.preferences', () => {
        app.emit('add-preference');
      }, 'Ctrl+,', true);

      menubar.append(preference);
    }

    // Edit
    const editMenuItem = this.createEditMenu();
    menubar.append(editMenuItem);

    // History
    const historyMenuItem = this.createHistoryMenu();

    menubar.append(historyMenuItem);

    // Window
    const windowMenuItem = this.createBrowsingWindowMenu();


    menubar.append(windowMenuItem);

    // Help
    const helpMenuItem = this.createHelpMenu();

    menubar.append(helpMenuItem);

    if (!IsMacintosh) {
      const quitMenuItem = this.createMenuItem('msg.splayerx.quit', () => {
        app.quit();
      }, 'Ctrl+q', true);

      menubar.append(quitMenuItem);
    }

    return menubar;
  }

  private createWelcomeViewMenu() {
    // Menus
    const menubar = new Menu();
    if (IsMacintosh) {
      // Mac: Application
      const macApplicationMenuItem = this.createMacApplicationMenu();

      menubar.append(macApplicationMenuItem);
    } else {
      const quitMenuItem = this.createMenuItem('msg.splayerx.quit', () => {
        app.quit();
      }, 'Ctrl+q', true);

      menubar.append(quitMenuItem);
    }

    const helpMenuItem = this.createHelpMenu();

    menubar.append(helpMenuItem);

    return menubar;
  }

  private createMacApplicationMenu(): Electron.MenuItem {
    const applicationMenu = new Menu();
    const about = this.createMenuItem('msg.splayerx.about', () => {
      app.emit('add-windows-about');
    }, undefined, true);
    const preference = this.createMenuItem('msg.splayerx.preferences', () => {
      app.emit('add-preference');
    }, 'CmdOrCtrl+,');

    const hide = this.createRoleMenuItem('msg.splayerx.hide', 'hide');
    const hideOthers = this.createRoleMenuItem('msg.splayerx.hideOthers', 'hideothers');
    const unhide = this.createRoleMenuItem('msg.splayerx.showAll', 'unhide');
    const quit = this.createRoleMenuItem('msg.splayerx.quit', 'quit');

    const actions = [about];
    actions.push(...[
      separator(),
    ]);
    if (this._routeName !== 'welcome-privacy' && this._routeName !== 'language-setting') {
      actions.push(...[
        preference,
        separator(),
      ]);
    }
    actions.push(...[
      hide,
      hideOthers,
      unhide,
      separator(),
      quit,
    ]);
    actions.forEach(i => applicationMenu.append(i));

    return new MenuItem({ label: this.$t('msg.splayerx.name'), submenu: applicationMenu });
  }

  private createFileMenu(): Electron.MenuItem {
    const fileMenu = this.convertFromMenuItemTemplate('file');
    return new MenuItem({ id: 'file', label: this.$t('msg.file.name'), submenu: fileMenu });
  }

  private createPlaybackMenu() {
    const playbackMenu = this.convertFromMenuItemTemplate('playback');
    return new MenuItem({ id: 'playback', label: this.$t('msg.playback.name'), submenu: playbackMenu });
  }

  private createAudioMenu() {
    const audioMenu = this.convertFromMenuItemTemplate('audio');
    return new MenuItem({ id: 'audio', label: this.$t('msg.audio.name'), submenu: audioMenu });
  }

  private createSubtitleMenu() {
    const subtitleMenu = this.convertFromMenuItemTemplate('subtitle');
    return new MenuItem({ id: 'subtitle', label: this.$t('msg.subtitle.name'), submenu: subtitleMenu });
  }

  private createEditMenu() {
    const editMenu = this.convertFromMenuItemTemplate('edit');
    return new MenuItem({ id: 'edit', label: this.$t('msg.edit.name'), submenu: editMenu });
  }

  private createHistoryMenu() {
    const historyMenu = this.convertFromMenuItemTemplate('history');
    return new MenuItem({ id: 'history', label: this.$t('msg.history.name'), submenu: historyMenu });
  }

  private createFavouriteMenu() {
    const favouriteMenu = this.convertFromMenuItemTemplate('favourite');
    return new MenuItem({ id: 'favourite', label: this.$t('msg.favourite.name'), submenu: favouriteMenu });
  }

  private createBrowsingWindowMenu() {
    const window = this.convertFromMenuItemTemplate('browsing.window');
    return new MenuItem({ id: 'browsing.window', label: this.$t('msg.window.name'), submenu: window });
  }

  private createWindowMenu() {
    const windowMenu = this.convertFromMenuItemTemplate('window');
    return new MenuItem({ id: 'window', label: this.$t('msg.window.name'), submenu: windowMenu });
  }

  private createHelpMenu() {
    const helpMenu = new Menu();

    if (!IsMacintosh) {
      const about = this.createMenuItem('msg.splayerx.about', () => {
        app.emit('add-windows-about');
      }, undefined, true);

      helpMenu.append(about);

      helpMenu.append(separator());
    }

    const feedback = this.createMenuItem('msg.help.feedback', () => {
      shell.openExternal('https://feedback.splayer.org');
    }, undefined, true);
    const homepage = this.createMenuItem('msg.help.homepage', () => {
      shell.openExternal('https://splayer.org');
    }, undefined, true);
    const shortCuts = this.createMenuItem('msg.help.shortCuts', () => {
      shell.openExternal('https://github.com/chiflix/splayerx/wiki/SPlayer-Shortcuts-List');
    }, undefined, true);

    [feedback, homepage, shortCuts].forEach(i => helpMenu.append(i));

    if (!process.mas) {
      const crashReport = this.createMenuItem('msg.help.crashReportLocation', undefined, undefined, true);
      helpMenu.append(crashReport);
    }


    const helpMenuItem = new MenuItem({ label: this.$t('msg.help.name'), submenu: helpMenu, role: 'help' });
    return helpMenuItem;
  }

  private createSubMenuItem(menuItem: IMenubarMenuItemSubmenu): Electron.MenuItem

  private createSubMenuItem(
    label: string,
    enabled?: boolean,
    submenu?: IMenubarMenu,
  ): Electron.MenuItem

  private createSubMenuItem(
    arg1: string | IMenubarMenuItemSubmenu,
    enabled = true,
    submenu?: IMenubarMenu,
  ): Electron.MenuItem {
    let id;
    let label;

    if (typeof arg1 === 'string') {
      id = arg1.replace(/^msg./g, '');
      label = this.$t(arg1);
    } else {
      id = arg1.id;
      label = this.$t(arg1.label);
    }

    const newMenu = new Menu();
    if (!submenu && typeof arg1 !== 'string') submenu = arg1.submenu;
    if (submenu) {
      submenu.items.forEach((menuItem: MenubarMenuItem) => {
        if (isSeparator(menuItem)) {
          const item = separator();
          newMenu.append(item);
        } else if (isSubmenu(menuItem)) {
          const item = this.createSubMenuItem(menuItem);
          newMenu.append(item);
        } else {
          const item = this.createMenuItem(menuItem);
          newMenu.append(item);
        }
      });
    }
    return new MenuItem({
      id, label, enabled, submenu: newMenu,
    });
  }

  private createRoleMenuItem(menuItem: IMenubarMenuItemRole): Electron.MenuItem

  private createRoleMenuItem(
    label: string,
    role: ('undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteandmatchstyle' | 'delete' | 'selectall' | 'reload' | 'forcereload' | 'toggledevtools' | 'resetzoom' | 'zoomin' | 'zoomout' | 'togglefullscreen' | 'window' | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide' | 'hideothers' | 'unhide' | 'quit' | 'startspeaking' | 'stopspeaking' | 'close' | 'minimize' | 'zoom' | 'front' | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu' | 'windowMenu'),
    enabled?: boolean,
  ): Electron.MenuItem

  private createRoleMenuItem(
    arg1: string | IMenubarMenuItemRole,
    role?: ('undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteandmatchstyle' | 'delete' | 'selectall' | 'reload' | 'forcereload' | 'toggledevtools' | 'resetzoom' | 'zoomin' | 'zoomout' | 'togglefullscreen' | 'window' | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide' | 'hideothers' | 'unhide' | 'quit' | 'startspeaking' | 'stopspeaking' | 'close' | 'minimize' | 'zoom' | 'front' | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu' | 'windowMenu'),
    enabled = true,
  ): Electron.MenuItem {
    if (typeof arg1 === 'string') {
      const id = arg1.replace(/^msg./g, '');
      arg1 = this.$t(arg1);
      return new MenuItem({
        id, label: arg1, enabled, role,
      });
    }
    const label = this.$t(arg1.label);
    return new MenuItem({
      id: arg1.id, label, role: arg1.role, enabled: arg1.enabled,
    });
  }

  private createMenuItem(menuItem: IMenubarMenuItemAction): Electron.MenuItem

  private createMenuItem(
    label: string, click?: (menuItem: Electron.MenuItem) => void,
    accelerator?: string, enabled?: boolean, checked?: boolean, id?: string
  ): Electron.MenuItem

  private createMenuItem(
    arg1: string | IMenubarMenuItemAction,
    click?: (menuItem: Electron.MenuItem) => void,
    accelerator?: string,
    enabled = true,
    checked?: boolean,
    id?: string,
  ): Electron.MenuItem {
    if (typeof arg1 === 'string') {
      if (!id) id = arg1.replace(/^msg./g, '');
      arg1 = this.$t(arg1);
      if (!click) {
        click = () => {
          if (this.mainWindow) {
            this.mainWindow.webContents.send(id as string);
          }
          app.emit('menu-create-main-window', id);
        };
      }

      const options: Electron.MenuItemConstructorOptions = {
        id,
        label: arg1,
        click,
        enabled,
        accelerator,
      };

      if (checked !== undefined) {
        options.type = 'checkbox';
        options.checked = checked;
      }
      return new MenuItem(options);
    }
    if (arg1.enabled === undefined) arg1.enabled = true;
    let menuIcon: string | Electron.nativeImage = '';
    switch (arg1.icon) {
      case 'enter-pip':
        menuIcon = systemPreferences.isDarkMode() ? nativeImage.createFromDataURL(require('../../../build/icons/mojave-pip.png')) : nativeImage.createFromDataURL(require('../../../build/icons/normal-pip.png'));
        break;
      case 'play-in-new-window':
        menuIcon = systemPreferences.isDarkMode() ? nativeImage.createFromDataURL(require('../../../build/icons/mojave-window.png')) : nativeImage.createFromDataURL(require('../../../build/icons/normal-window.png'));
        break;
      default:
        menuIcon = '';
        break;
    }
    const label = this.$t(arg1.label);

    const options: Electron.MenuItemConstructorOptions = {
      id: arg1.id,
      label,
      click: () => {
        if (this.mainWindow) {
          if (typeof arg1 !== 'string') this.mainWindow.webContents.send(arg1.id as string);
        }
        app.emit('menu-create-main-window', id);
      },
      enabled: arg1.enabled,
      accelerator: arg1.accelerator,
      icon: menuIcon,
    };

    if (arg1.id === 'file.open') {
      options.click = () => {
        if (!this.mainWindow) {
          app.emit('menu-open-dialog');
        } else {
          this.mainWindow.webContents.send('file.open');
        }
      };
    } else if (arg1.id === 'window.bossKey') {
      options.click = () => {
        app.emit('bossKey');
      };
    }

    if (arg1.winAccelerator && !IsMacintosh) {
      options.accelerator = arg1.winAccelerator;
    }

    if (arg1.checked !== undefined) {
      options.type = 'checkbox';
      options.checked = arg1.checked;
    }
    return new MenuItem(options);
  }

  private getMenuItemTemplate(menu: MenuName): IMenubarMenu {
    return this.currentMenuState[menu];
  }

  private convertFromMenuItemTemplate(menu: MenuName): Electron.Menu {
    const newMenu = new Menu();
    this.getMenuItemTemplate(menu).items.forEach((menuItem: MenubarMenuItem) => {
      if (isSeparator(menuItem)) {
        const item = separator();
        newMenu.append(item);
      } else if (isSubmenu(menuItem)) {
        const item = this.createSubMenuItem(menuItem);
        newMenu.append(item);
      } else if (isRole(menuItem)) {
        const item = this.createRoleMenuItem(menuItem);
        newMenu.append(item);
      } else {
        const item = this.createMenuItem(menuItem);
        newMenu.append(item);
      }
    });
    return newMenu;
  }
}

export const menuService = new Menubar();
