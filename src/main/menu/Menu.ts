import {
  Menu, MenuItem, app, shell,
} from 'electron';
import {
  MenubarMenuItem,
  IMenubarMenu,
  IMenubarMenuItemSubmenu,
  IMenubarMenuItemSeparator,
  IMenubarMenuItemAction,
  IMenubarMenuItemRole,
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
function isAction(menuItem: MenubarMenuItem): menuItem is IMenubarMenuItemAction {
  return (menuItem as IMenubarMenuItemAction).accelerator !== undefined;
}

export default class Menubar {
  private mainWindow: Electron.BrowserWindow | null;

  private locale: Locale;

  private menubar: Electron.Menu;

  private paused = false;

  private isFullScreen = false;

  private isPip = false;

  private playingViewTop = false;

  private primarySubs: {
    id: string, label: string, checked: boolean, subtitleItem: SubtitleControlListItem,
  }[];

  private secondarySubs: {
    id: string, label: string, checked: boolean,
    enabled: boolean, subtitleItem: SubtitleControlListItem,
  }[];

  private _routeName: string;

  private _disable: boolean;

  public set routeName(val: string) {
    this._routeName = val;
    this.menuStateControl();
  }

  public set disable(val: boolean) {
    this._disable = val;
    this.enableMenu(!val);
  }

  public constructor() {
    this.locale = new Locale();
    this.menuStateControl();
  }

  public setMainWindow(window: Electron.BrowserWindow | null) {
    // may replace this way of getting mainWindow by window service or else...
    this.playingViewTop = this.isFullScreen = false;
    this.mainWindow = window;
  }

  public popupMenu() {
    if (this.mainWindow) {
      this.menubar.popup();
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
    if (this._routeName === 'playing-view') {
      this.enableSubmenuItem('playback', enable);
      this.enableSubmenuItem('audio', enable);
      this.enableSubmenuItem('subtitle', enable);
      if (enable) {
        this.updatePrimarySub();
        this.updateSecondarySub();
      }
    }

    this.enableSubmenuItem('window', enable);
    this.enableSubmenuItem('file.openRecent', enable);
    this.updateMenuItemEnabled('file.clearHistory', enable);
    this.updateMenuItemEnabled('file.closeWindow', enable);
  }

  public updateLocale() {
    this.locale.getDisplayLanguage();
    this.menuStateControl();
  }

  public updatePaused(paused: boolean) {
    if (this.paused !== paused) {
      this.paused = paused;
      this.refreshPlaybackMenu();
    }
  }

  public updateFullScreen(isFullScreen: boolean) {
    if (this.isFullScreen !== isFullScreen) {
      this.isFullScreen = isFullScreen;
      if (this._routeName !== 'browsing-view') {
        this.refreshWindowMenu();
      }
    }
  }

  public updateIsPip(isPip: boolean) {
    if (this.isPip !== isPip) {
      this.isPip = isPip;
      this.refreshBrowsingWindowMenu();
    }
  }

  public updatePlayingViewTop(playingViewTop: boolean) {
    if (this.playingViewTop !== playingViewTop) {
      this.playingViewTop = playingViewTop;
    }
  }

  public updateMenuItemChecked(id: string, checked: boolean) {
    if (this.menubar.getMenuItemById(id)) this.menubar.getMenuItemById(id).checked = checked;
  }

  public updateMenuItemEnabled(id: string, enabled: boolean) {
    if (this.menubar.getMenuItemById(id)) {
      this.menubar.getMenuItemById(id).enabled = enabled;
      Menu.setApplicationMenu(this.menubar);
    }
  }

  public enableSubmenuItem(id: string, enabled: boolean) {
    const menuItem = this.menubar.getMenuItemById(id);
    if (menuItem && menuItem.submenu) {
      menuItem.submenu.items.forEach((item: Electron.MenuItem) => {
        item.enabled = enabled;
        if (item.submenu) {
          item.submenu.items.forEach((item: Electron.MenuItem) => {
            item.enabled = enabled;
          });
        }
      });
    }
  }

  public updateRecentPlay(items: IMenuDisplayInfo[]) {
    const recentMenu = this.getSubmenuById('file.openRecent');
    // @ts-ignore
    recentMenu.clear();

    items.forEach(({ id, label }) => {
      const item = new MenuItem({
        id: `file.openRecent.${id}`,
        label,
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.webContents.send('file.openRecent', id);
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
          type: 'radio',
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
        let type: ('normal' | 'separator' | 'submenu' | 'checkbox' | 'radio') = 'radio';
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

  public updateAudioTrack(items: { id: string, label: string }[]) {
    const audioTrackMenu = this.getSubmenuById('audio.switchAudioTrack');
    if (audioTrackMenu) {
      // @ts-ignore
      audioTrackMenu.clear();
      items.forEach(({ id, label }) => {
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

  private getSubmenuById(id: string) {
    const menuItem = this.menubar.getMenuItemById(id);
    return menuItem && menuItem.submenu;
  }

  private refreshPlaybackMenu() {
    const playbackMenu = this.getSubmenuById('playback');
    if (playbackMenu) {
      // @ts-ignore
      playbackMenu.clear();

      this.getMenuItemTemplate('playback').items.forEach((menuItem: MenubarMenuItem) => {
        if (isSeparator(menuItem)) {
          const item = separator();
          playbackMenu.append(item);
        } else {
          if (menuItem.id === 'playback.playOrPause') {
            menuItem.label = this.paused ? this.$t('msg.playback.play') : this.$t('msg.playback.pause');
          }
          // @ts-ignore
          if (isAction(menuItem) && this._disable) {
            menuItem.enabled = !this._disable;
          }
          const item = this.createMenuItemByTemplate(menuItem);
          playbackMenu.append(item);
        }
      });

      Menu.setApplicationMenu(this.menubar);
    }
  }

  private refreshBrowsingWindowMenu() {
    const windowMenu = this.getSubmenuById('browsing.window');
    if (!windowMenu) return;
    // @ts-ignore
    windowMenu.clear();

    const items = this.getMenuItemTemplate('window').items;
    const floatMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.keepPlayingWindowFront') as IMenubarMenuItemAction;
    const minimizeMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.minimize') as IMenubarMenuItemRole;
    const maxmizeMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.maxmize') as IMenubarMenuItemAction;
    const landingViewMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.backToLandingView') as IMenubarMenuItemAction;

    const actions = [];
    actions.push(...[
      this.createMenuItemByTemplate(floatMenuItem),
      separator(),
      this.createMenuItem(this.isPip ? 'msg.window.exitPip' : 'msg.window.enterPip', undefined, 'P', true, undefined, 'window.pip'),
      separator(),
      this.createRoleMenuItem(
        minimizeMenuItem.label,
        minimizeMenuItem.role,
        minimizeMenuItem.enabled,
      ),
      this.createMenuItemByTemplate(maxmizeMenuItem),
      separator(),
      this.createMenuItemByTemplate(landingViewMenuItem),
    ]);

    actions.forEach(i => windowMenu.append(i));
    Menu.setApplicationMenu(this.menubar);
  }

  private refreshWindowMenu() {
    const windowMenu = this.getSubmenuById('window');
    // @ts-ignore
    windowMenu.clear();

    this.getMenuItemTemplate('window').items.forEach((menuItem: MenubarMenuItem) => {
      if (isSeparator(menuItem)) {
        const item = separator();
        windowMenu.append(item);
      } else if (isRole(menuItem)) {
        const item = this.createRoleMenuItem(menuItem.label, menuItem.role, menuItem.enabled);
        windowMenu.append(item);
      } else {
        if (menuItem.id === 'window.fullscreen') {
          menuItem.label = this.isFullScreen ? this.$t('msg.window.exitFullScreen') : this.$t('msg.window.enterFullScreen');
        }
        if (menuItem.id === 'window.keepPlayingWindowFront') {
          // @ts-ignore
          menuItem.checked = this.playingViewTop;
        }
        if (isAction(menuItem) && this._disable) menuItem.enabled = !this._disable;
        const item = this.createMenuItemByTemplate(menuItem);
        windowMenu.append(item);
      }
    });

    Menu.setApplicationMenu(this.menubar);
  }

  private $t(msg: string): string {
    return this.locale.$t(msg);
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
          menubar.append(this.createMenuItemByTemplate(menuItem));
        } else if (item.id === 'file.openRecent') {
          const menuItem = item as IMenubarMenuItemSubmenu;
          menubar.append(this.createSubMenuItem(`msg.${menuItem.id}`, menuItem.submenu));
        } else if (item.id === 'file.closeWindow') {
          const menuItem = item as IMenubarMenuItemRole;
          menubar.append(this.createRoleMenuItem(menuItem.label, menuItem.role, menuItem.enabled));
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

    windowMenu.append(this.createMenuItemByTemplate(fullscreenMenuItem));

    const minimizeMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.minimize') as IMenubarMenuItemRole;

    windowMenu.append(this.createRoleMenuItem(
      minimizeMenuItem.label,
      minimizeMenuItem.role,
      minimizeMenuItem.enabled,
    ));

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
          menubar.append(this.createMenuItemByTemplate(menuItem));
        } else if (item.id === 'file.openRecent') {
          const menuItem = item as IMenubarMenuItemSubmenu;
          menubar.append(this.createSubMenuItem(`msg.${menuItem.id}`, menuItem.submenu));
        } else if (item.id === 'file.closeWindow') {
          const menuItem = item as IMenubarMenuItemRole;
          menubar.append(this.createRoleMenuItem(menuItem.label, menuItem.role, menuItem.enabled));
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
      const openMenuItem = this.createMenuItemByTemplate(openMenuItemTemplate);

      const closeWindowTemplate = items.find((item: MenubarMenuItem) => item.id === 'file.closeWindow') as IMenubarMenuItemRole;
      const closeMenuItem = this.createRoleMenuItem(
        closeWindowTemplate.label,
        closeWindowTemplate.role,
        closeWindowTemplate.enabled,
      );

      const snapShotTemplate = playbackItems.find((item: MenubarMenuItem) => item.id === 'playback.snapShot') as IMenubarMenuItemAction;
      const snapShotMenuItem = this.createMenuItemByTemplate(snapShotTemplate);
      [openMenuItem, closeMenuItem, separator(), snapShotMenuItem].forEach(i => fileMenu.append(i));

      const fileMenuItem = new MenuItem({ label: this.$t('msg.file.name'), submenu: fileMenu });

      menubar.append(fileMenuItem);
    } else {
      // File
      this.getMenuItemTemplate('file').items.forEach((item: MenubarMenuItem) => {
        if (item.id === 'file.open') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItemByTemplate(menuItem));
        } else if (item.id === 'file.closeWindow') {
          const menuItem = item as IMenubarMenuItemRole;
          menubar.append(this.createRoleMenuItem(menuItem.label, menuItem.role, menuItem.enabled));
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

    return menubar;
  }

  private createMacApplicationMenu(): Electron.MenuItem {
    const applicationMenu = new Menu();
    const about = this.createMenuItem('msg.splayerx.about', () => {
      app.emit('add-windows-about');
    }, undefined, true);
    const preference = this.createMenuItem('msg.splayerx.preferences', () => {
      app.emit('add-preference');
    }, 'CmdOrCtrl+,', this._routeName !== 'welcome-privacy' && this._routeName !== 'language-setting');

    const hide = this.createRoleMenuItem('msg.splayerx.hide', 'hide');
    const hideOthers = this.createRoleMenuItem('msg.splayerx.hideOthers', 'hideothers');
    const unhide = this.createRoleMenuItem('msg.splayerx.showAll', 'unhide');
    const quit = this.createRoleMenuItem('msg.splayerx.quit', 'quit');

    const actions = [about];
    actions.push(...[
      separator(),
      preference,
      separator(),
      hide,
      hideOthers,
      unhide,
      separator(),
      quit,
    ]);
    actions.forEach(i => applicationMenu.append(i));

    const applicationMenuItem = new MenuItem({ label: this.$t('msg.splayerx.name'), submenu: applicationMenu });
    return applicationMenuItem;
  }

  private createFileMenu(): Electron.MenuItem {
    const fileMenu = this.convertFromMenuItemTemplate('file');
    fileMenu.getMenuItemById('file.open').click = () => {
      if (!this.mainWindow) {
        app.emit('menu-open-dialog');
      } else {
        this.mainWindow.webContents.send('file.open');
      }
    };
    const fileMenuItem = new MenuItem({ id: 'file', label: this.$t('msg.file.name'), submenu: fileMenu });
    return fileMenuItem;
  }

  private createPlaybackMenu() {
    const playbackMenu = this.convertFromMenuItemTemplate('playback');
    playbackMenu.getMenuItemById('playback.playOrPause').label = this.paused ? this.$t('msg.playback.play') : this.$t('msg.playback.pause');
    const playbackMenuItem = new MenuItem({ id: 'playback', label: this.$t('msg.playback.name'), submenu: playbackMenu });
    return playbackMenuItem;
  }

  private createAudioMenu() {
    const audioMenu = this.convertFromMenuItemTemplate('audio');
    const audioMenuItem = new MenuItem({ id: 'audio', label: this.$t('msg.audio.name'), submenu: audioMenu });
    return audioMenuItem;
  }

  private createSubtitleMenu() {
    const subtitleMenu = this.convertFromMenuItemTemplate('subtitle');
    const subtitleMenuItem = new MenuItem({ id: 'subtitle', label: this.$t('msg.subtitle.name'), submenu: subtitleMenu });
    return subtitleMenuItem;
  }

  private createEditMenu() {
    const editMenu = this.convertFromMenuItemTemplate('edit');
    const editMenuItem = new MenuItem({ id: 'edit', label: this.$t('msg.edit.name'), submenu: editMenu });
    return editMenuItem;
  }

  private createHistoryMenu() {
    const historyMenu = this.convertFromMenuItemTemplate('history');
    const historyMenuItem = new MenuItem({ id: 'history', label: this.$t('msg.history.name'), submenu: historyMenu });
    return historyMenuItem;
  }

  private createFavouriteMenu() {
    const favouriteMenu = this.convertFromMenuItemTemplate('favourite');
    const favouriteMenuItem = new MenuItem({ id: 'favourite', label: this.$t('msg.favourite.name'), submenu: favouriteMenu });
    return favouriteMenuItem;
  }

  private createBrowsingWindowMenu() {
    const window = new Menu();

    const items = this.getMenuItemTemplate('window').items;
    const floatMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.keepPlayingWindowFront') as IMenubarMenuItemAction;
    const minimizeMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.minimize') as IMenubarMenuItemRole;
    const maxmizeMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.maxmize') as IMenubarMenuItemAction;
    const landingViewMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.backToLandingView') as IMenubarMenuItemAction;
    floatMenuItem.enabled = false;

    const actions = [];
    actions.push(...[
      this.createMenuItemByTemplate(floatMenuItem),
      separator(),
      this.createMenuItem('msg.window.enterPip', undefined, 'P', false, undefined, 'window.pip'),
      separator(),
      this.createRoleMenuItem(
        minimizeMenuItem.label,
        minimizeMenuItem.role,
        minimizeMenuItem.enabled,
      ),
      this.createMenuItemByTemplate(maxmizeMenuItem),
      separator(),
      this.createMenuItemByTemplate(landingViewMenuItem),
    ]);

    actions.forEach(i => window.append(i));

    const windowMenuItem = new MenuItem({ id: 'browsing.window', label: this.$t('msg.window.name'), submenu: window });
    return windowMenuItem;
  }

  private createWindowMenu() {
    const windowMenu = this.convertFromMenuItemTemplate('window');
    windowMenu.getMenuItemById('window.bossKey').click = () => {
      app.emit('bossKey');
    };
    windowMenu.getMenuItemById('window.keepPlayingWindowFront').checked = this.playingViewTop;
    const windowMenuItem = new MenuItem({ id: 'window', label: this.$t('msg.window.name'), submenu: windowMenu });
    return windowMenuItem;
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

  private createSubMenuItem(
    label: string,
    submenu?: IMenubarMenu,
    enabled = true,
  ): Electron.MenuItem {
    const id = label.replace(/^msg./g, '');
    label = this.$t(label);
    const newMenu = new Menu();
    if (submenu) {
      submenu.items.forEach((menuItem: MenubarMenuItem) => {
        if (isSeparator(menuItem)) {
          const item = separator();
          newMenu.append(item);
        } else if (isSubmenu(menuItem)) {
          const item = this.createSubMenuItem(`msg.${menuItem.id}`, menuItem.submenu);
          newMenu.append(item);
        } else {
          const item = this.createMenuItemByTemplate(menuItem);
          newMenu.append(item);
        }
      });
    }
    return new MenuItem({
      id, label, enabled, submenu: newMenu,
    });
  }

  private createRoleMenuItem(
    label: string,
    role: ('undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteandmatchstyle' | 'delete' | 'selectall' | 'reload' | 'forcereload' | 'toggledevtools' | 'resetzoom' | 'zoomin' | 'zoomout' | 'togglefullscreen' | 'window' | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide' | 'hideothers' | 'unhide' | 'quit' | 'startspeaking' | 'stopspeaking' | 'close' | 'minimize' | 'zoom' | 'front' | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu' | 'windowMenu'),
    enabled = true,
  ): Electron.MenuItem {
    const id = label.replace(/^msg./g, '');
    label = this.$t(label);
    return new MenuItem({
      id, label, enabled, role,
    });
  }

  private createMenuItem(
    label: string,
    click?: (menuItem: Electron.MenuItem) => void,
    accelerator?: string,
    enabled = false,
    checked?: boolean,
    id?: string,
  ): Electron.MenuItem {
    if (!id) id = label.replace(/^msg./g, '');
    label = this.$t(label);
    if (!click) {
      click = (menuItem: Electron.MenuItem) => {
        if (this.mainWindow) {
          this.mainWindow.webContents.send(id as string, menuItem);
        }
        app.emit('menu-create-main-window', id, menuItem);
      };
    }

    const options: Electron.MenuItemConstructorOptions = {
      id,
      label,
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

  private createMenuItemByTemplate(menuItem: IMenubarMenuItemAction) {
    const {
      id, accelerator, winAccelerator, enabled, checked,
    } = menuItem;

    const label = this.$t(menuItem.label);

    const click = (menuItem: Electron.MenuItem) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send(id, menuItem);
      }
      app.emit('menu-create-main-window', id, menuItem);
    };

    const options: Electron.MenuItemConstructorOptions = {
      id, label, click, enabled, accelerator,
    };

    if (winAccelerator && !IsMacintosh) {
      options.accelerator = winAccelerator;
    }

    if (checked !== undefined) {
      options.type = 'checkbox';
      options.checked = checked;
    }

    return new MenuItem(options);
  }

  private getMenuItemTemplate(menu: string): IMenubarMenu {
    return menuTemplate[menu];
  }

  private convertFromMenuItemTemplate(menu: string): Electron.Menu {
    const newMenu = new Menu();
    this.getMenuItemTemplate(menu).items.forEach((menuItem: MenubarMenuItem) => {
      if (isSeparator(menuItem)) {
        const item = separator();
        newMenu.append(item);
      } else if (isSubmenu(menuItem)) {
        const item = this.createSubMenuItem(`msg.${menuItem.id}`, menuItem.submenu);
        newMenu.append(item);
      } else if (isRole(menuItem)) {
        const item = this.createRoleMenuItem(menuItem.label, menuItem.role, menuItem.enabled);
        newMenu.append(item);
      } else {
        const item = this.createMenuItemByTemplate(menuItem);
        newMenu.append(item);
      }
    });
    return newMenu;
  }
}

export const menuService = new Menubar();
