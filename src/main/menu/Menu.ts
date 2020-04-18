import {
  app, Menu, MenuItem, shell, nativeImage, nativeTheme,
} from 'electron';
import { cloneDeep } from 'lodash';
import { IBrowsingHistoryMenuInfo } from '@/interfaces/IBrowsingHistory';
import {
  IMenubarMenu,
  IMenubarMenuItemAction,
  IMenubarMenuItemRole,
  IMenubarMenuItemSeparator,
  IMenubarMenuItemSubmenu,
  IMenubarMenuState,
  MenubarMenuItem,
  MenuName,
  MenuRole,
} from './common/Menubar';
import { isMacintosh, isWindowsExE, isMacintoshDMG } from '../../shared/common/platform';
import Locale from '../../shared/common/localize';
import menuTemplate from './menu.json';
import { IMenuDisplayInfo } from '../../renderer/interfaces/IRecentPlay';
import { ISubtitleControlListItem, Type } from '../../renderer/interfaces/ISubtitle';

import airSharedInstance from '../helpers/AirShared';

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

  private browsingHistory: IBrowsingHistoryMenuInfo[];

  private recentPlay: IMenuDisplayInfo[];

  private audioTracks: { id: string, label: string }[];

  private focusOnMainWindow = true;

  private primarySubs: {
    id: string, label: string, checked: boolean, subtitleItem: ISubtitleControlListItem,
  }[];

  private secondarySubs: {
    id: string, label: string, checked: boolean,
    enabled: boolean, subtitleItem: ISubtitleControlListItem,
  }[];

  private referenceSub: string;

  private _routeName: string;

  private user?: { displayName: string };

  public isAccountEnabled: boolean;

  private isProfessinal: boolean;

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
    this.isAccountEnabled = false;
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
    // update airShare menu initialize status
    this.updateMenuItemChecked('file.airShared', airSharedInstance.isServiceEnable());
    this.updateMenuItemLabel('file.airShared', 'test');

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
    if (!oldMenu && isMacintosh) {
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
        this.menubar = this.isProfessinal
          ? this.createProfessinalViewMenu() : this.createPlayingViewMenu();
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

    // update airShare menu initialize status when a new window created
    this.updateMenuItemChecked('file.airShared', airSharedInstance.isServiceEnable());

    if (this.menubar.items && this.menubar.items.length > 0) {
      Menu.setApplicationMenu(this.menubar);
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  public enableMenu(enable: boolean) {
    if (enable) {
      if (this._routeName === 'playing-view' && this.isProfessinal) {
        this.refreshMenu('advanced.playback');
        this.refreshMenu('audio');
        this.refreshMenu('advanced');
        this.refreshMenu('advanced.window');

        this.updateAudioTrack();
        this.updateReferenceSubs();
      } else if (this._routeName === 'playing-view') {
        this.refreshMenu('playback');
        this.refreshMenu('audio');
        this.refreshMenu('subtitle');
        this.refreshMenu('window');

        this.updateAudioTrack();
        this.updatePrimarySub();
        this.updateSecondarySub();
      } else if (this._routeName === 'browsing-view') {
        this.refreshMenu('edit');
        this.refreshMenu('browsing.window');
      } else if (this._routeName === 'landing-view') {
        this.refreshMenu('window');
      }
    } else {
      if (this._routeName === 'playing-view' && this.isProfessinal) {
        this.disableSubmenuItem('advanced.playback');
        this.disableSubmenuItem('audio');
        this.disableSubmenuItem('advanced');
        this.disableSubmenuItem('advanced.window');
      } else if (this._routeName === 'playing-view') {
        this.disableSubmenuItem('playback');
        this.disableSubmenuItem('audio');
        this.disableSubmenuItem('subtitle');
        this.disableSubmenuItem('window');
      }
      if (this._routeName === 'landing-view') {
        this.disableSubmenuItem('window');
      }

      if (this._routeName === 'browsing-view') {
        this.disableSubmenuItem('edit');
        this.disableSubmenuItem('browsing.window');
      }
    }

    this.updateMenuItemEnabled('file.clearHistory', enable);
    this.updateMenuItemEnabled('file.closeWindow', enable);
  }

  public updateLocale() {
    this.locale.refreshDisplayLanguage();
    this.menuStateControl();
    this.updateRecentPlay();
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

  public updateBrowsingHistory(items?: IBrowsingHistoryMenuInfo[]) {
    if (items) this.browsingHistory = items;
    const historyMenu = this.getSubmenuById('history');
    if (!historyMenu || !this.browsingHistory) return;
    // @ts-ignore
    historyMenu.clear();

    this.getMenuItemTemplate('history').items.forEach((menuItem: MenubarMenuItem) => {
      if (isSeparator(menuItem)) {
        const item = separator();
        historyMenu.append(item);
      } else if (isSubmenu(menuItem)) {
        const item = this.createSubMenuItem(menuItem);
        historyMenu.append(item);
      } else if (isRole(menuItem)) {
        const item = this.createRoleMenuItem(menuItem);
        historyMenu.append(item);
      } else {
        const item = this.createMenuItem(menuItem);
        historyMenu.append(item);
      }
      if (menuItem.id === 'history.forward') {
        historyMenu.append(separator());
        this.browsingHistory.forEach(({
          url, title, channel, iconPath,
        }) => {
          const item = new MenuItem({
            id: url,
            label: title,
            icon: nativeImage.createFromPath(iconPath).resize({ height: 20 }),
            click: () => {
              app.emit('open-history-item', null, { url, channel });
            },
          });
          historyMenu.append(item);
        });
      }
    });

    Menu.setApplicationMenu(this.menubar);
  }

  public updateRecentPlay(items?: IMenuDisplayInfo[]) {
    if (items) this.recentPlay = items;
    const recentMenu = this.getSubmenuById('file.openRecent');
    if (!recentMenu || !this.recentPlay) return;
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

  public updateMenuByProfessinal(isProfessinal: boolean) {
    this.isProfessinal = isProfessinal;
    if (isProfessinal) {
      this.menubar = this.createProfessinalViewMenu();
      Menu.setApplicationMenu(this.menubar);
      this.updateReferenceSubs();
    } else {
      this.menubar = this.createPlayingViewMenu();
      Menu.setApplicationMenu(this.menubar);
      this.updatePrimarySub();
      this.updateSecondarySub();
      this.updateRecentPlay();
    }
  }

  public updateProfessinalReference(sub?: ISubtitleControlListItem) {
    this.referenceSub = sub ? sub.id : 'off';
    const referenceSubMenu = this.getSubmenuById('advanced.reference');
    if (referenceSubMenu) {
      referenceSubMenu.items.forEach((e: MenuItem) => {
        e.checked = e.id === `subtitle.referenceSubtitle.${this.referenceSub}`;
      });
    }
    Menu.setApplicationMenu(this.menubar);
  }

  public updateAdvancedMenuPrev(enabled: boolean) {
    const prevMenu = this.menubar.getMenuItemById('advanced.prev');
    if (prevMenu) {
      prevMenu.enabled = enabled;
    }
  }

  public updateAdvancedMenuNext(enabled: boolean) {
    const nextMenu = this.menubar.getMenuItemById('advanced.next');
    if (nextMenu) {
      nextMenu.enabled = enabled;
    }
  }

  public updateAdvancedMenuEnter(enabled: boolean) {
    const enterMenu = this.menubar.getMenuItemById('advanced.enter');
    if (enterMenu) {
      enterMenu.enabled = enabled;
    }
  }

  public updateAdvancedMenuUndo(enabled: boolean) {
    const undoMenu = this.menubar.getMenuItemById('advanced.undo');
    if (undoMenu) {
      undoMenu.enabled = enabled;
    }
  }

  public updateAdvancedMenuRedo(enabled: boolean) {
    const redoMenu = this.menubar.getMenuItemById('advanced.redo');
    if (redoMenu) {
      redoMenu.enabled = enabled;
    }
  }

  public updateReferenceSubs() {
    const referenceSubMenu = this.getSubmenuById('advanced.reference');
    if (this.primarySubs && referenceSubMenu) {
      // @ts-ignore
      referenceSubMenu.clear();
      this.primarySubs
        .filter(({
          subtitleItem,
        }) => !subtitleItem || (subtitleItem && subtitleItem.type !== Type.Modified
          && !(subtitleItem.type === Type.PreTranslated && subtitleItem.source.source === '')))
        .forEach(({
          id, label, subtitleItem,
        }) => {
          const checked = this.referenceSub === id;
          const item = new MenuItem({
            id: `subtitle.referenceSubtitle.${id}`,
            type: 'checkbox',
            checked,
            label,
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.webContents.send('subtitle.referenceSubtitle', id, subtitleItem);
              }
            },
          });
          referenceSubMenu.append(item);
        });
      referenceSubMenu.append(new MenuItem({
        id: 'menubar.separator',
        type: 'separator',
      }));
      const loadItem = new MenuItem({
        id: 'subtitle.referenceSubtitle.load',
        type: 'normal',
        label: this.$t('msg.advanced.loadLocalSubtitleFile'),
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.webContents.send('subtitle.referenceSubtitle.load');
          }
        },
      });
      referenceSubMenu.append(loadItem);
      Menu.setApplicationMenu(this.menubar);
    }
  }

  public updatePrimarySub(
    items?: {
      id: string, label: string, checked: boolean, subtitleItem: ISubtitleControlListItem,
    }[],
  ) {
    if (items) this.primarySubs = items;
    const primarySubMenu = this.getSubmenuById('subtitle.mainSubtitle');
    if (primarySubMenu && this.primarySubs) {
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
              // if is AI button can't choose
              if (subtitleItem && subtitleItem.type === Type.PreTranslated && subtitleItem.source.source === '') {
                this.menubar.getMenuItemById('subtitle.mainSubtitle.off').checked = true;
              }
              this.mainWindow.webContents.send('subtitle.mainSubtitle', id, subtitleItem);
            }
          },
        });
        primarySubMenu.append(item);
      });

      Menu.setApplicationMenu(this.menubar);
    }
    if (this.isProfessinal) {
      this.updateReferenceSubs();
    }
  }

  public updateSecondarySub(
    items?: {
      id: string, label: string, checked: boolean,
      enabled: boolean, subtitleItem: ISubtitleControlListItem,
    }[],
  ) {
    if (items) this.secondarySubs = items;
    const secondarySubMenu = this.getSubmenuById('subtitle.secondarySubtitle');
    if (secondarySubMenu && this.secondarySubs) {
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
              // if is AI button can't choose
              if (subtitleItem && subtitleItem.type === Type.PreTranslated && subtitleItem.source.source === '') {
                this.menubar.getMenuItemById('subtitle.secondarySubtitle.off').checked = true;
              }
              this.mainWindow.webContents.send('subtitle.secondarySubtitle', id, subtitleItem);
            }
          },
        });
        secondarySubMenu.append(item);
      });

      Menu.setApplicationMenu(this.menubar);
    }
  }

  public updateAccount(user?: { displayName: string }) {
    this.user = user;
    if (isMacintosh) {
      const menuItem = this.menubar.getMenuItemById('application');
      const accountMenu = menuItem && menuItem.submenu;
      if (accountMenu) {
        // @ts-ignore
        accountMenu.clear();
        const actions = this.createMacApplicationMenuItem();
        actions.forEach(i => accountMenu.append(i));
        Menu.setApplicationMenu(this.menubar);
      }
    } else {
      this.menuStateControl();
      this.updateRecentPlay();
    }
  }

  public updateAudioTrack(items?: { id: string, label: string }[]) {
    if (items) this.audioTracks = items;
    const audioTrackMenu = this.getSubmenuById('audio.switchAudioTrack');
    if (audioTrackMenu && this.audioTracks) {
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

  private getMenuStateById(id: string): MenubarMenuItem | undefined {
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

    if (isMacintosh) {
      // Mac: Application
      const macApplicationMenuItem = this.createMacApplicationMenu(true);

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

      fileMenu.append(this.createMenuItem(
        this.getMenuItemTemplate('file').items
          .find((item: MenubarMenuItem) => item.id === 'file.airShared') as IMenubarMenuItemAction,
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

    if (isMacintosh) {
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
        } else if (item.id === 'file.openUrl') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.openRecent') {
          const menuItem = item as IMenubarMenuItemSubmenu;
          menubar.append(this.createSubMenuItem(menuItem));
        } else if (item.id === 'file.clearHistory') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.download') {
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

      let account: MenuItem;
      if (this.user) {
        const label = this.locale.$t('msg.account.name');
        account = this.createMenuItem(`${label}: ${this.user.displayName}`, () => {
          app.emit('route-account');
        }, undefined, true, undefined, 'account');
      } else {
        account = this.createMenuItem('msg.account.login', () => {
          app.emit('add-login', 'menu');
        }, undefined, true, undefined, 'account');
      }
      menubar.append(account);
    }

    // Window
    const windowMenu = new Menu();

    const items = this.getMenuItemTemplate('window').items;

    const fullscreenMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.fullscreen') as IMenubarMenuItemAction;

    windowMenu.append(this.createMenuItem(fullscreenMenuItem));

    const minimizeMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.minimize') as IMenubarMenuItemRole;

    windowMenu.append(this.createRoleMenuItem(minimizeMenuItem));

    const sidebarMenuItem = items.find((item: MenubarMenuItem) => item.id === 'window.sidebar') as IMenubarMenuItemAction;

    windowMenu.append(this.createMenuItem(sidebarMenuItem));

    const windowMenuItem = new MenuItem({ id: 'window', label: this.$t('msg.window.name'), submenu: windowMenu });

    menubar.append(windowMenuItem);

    // Help
    const helpMenuItem = this.createHelpMenu();

    menubar.append(helpMenuItem);

    if (!isMacintosh) {
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

    if (isMacintosh) {
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
        } else if (item.id === 'file.openUrl') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.openRecent') {
          const menuItem = item as IMenubarMenuItemSubmenu;
          menubar.append(this.createSubMenuItem(menuItem));
        } else if (item.id === 'file.clearHistory') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.download') {
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

      let account: MenuItem;
      if (this.user) {
        const label = this.locale.$t('msg.account.name');
        account = this.createMenuItem(`${label}: ${this.user.displayName}`, () => {
          app.emit('route-account');
        }, undefined, true, undefined, 'account');
      } else {
        account = this.createMenuItem('msg.account.login', () => {
          app.emit('add-login', 'menu');
        }, undefined, true, undefined, 'account');
      }
      menubar.append(account);
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

    if (!isMacintosh) {
      const quitMenuItem = this.createMenuItem('msg.splayerx.quit', () => {
        app.quit();
      }, 'Ctrl+q', true);

      menubar.append(quitMenuItem);
    }

    return menubar;
  }

  private createProfessinalViewMenu(): Electron.Menu {
    // Menus
    const menubar = new Menu();

    if (isMacintosh) {
      // Mac: Application
      const macApplicationMenuItem = this.createMacApplicationMenu();

      menubar.append(macApplicationMenuItem);
    } else {
      // File
      this.getMenuItemTemplate('file').items.forEach((item: MenubarMenuItem) => {
        if (item.id === 'file.open') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.openRecent') {
          const menuItem = item as IMenubarMenuItemSubmenu;
          menubar.append(this.createSubMenuItem(menuItem));
        } else if (item.id === 'file.clearHistory') {
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

      let account: MenuItem;
      if (this.user) {
        const label = this.locale.$t('msg.account.name');
        account = this.createMenuItem(`${label}: ${this.user.displayName}`, () => {
          app.emit('route-account');
        }, undefined, true, undefined, 'account');
      } else {
        account = this.createMenuItem('msg.account.login', () => {
          app.emit('add-login', 'menu');
        }, undefined, true, undefined, 'account');
      }
      menubar.append(account);
    }

    // PlayBack
    const playbackMenuItem = this.createAdvancedPlaybackMenu();

    menubar.append(playbackMenuItem);

    // Audio
    const audioMenuItem = this.createAudioMenu();

    menubar.append(audioMenuItem);

    // Advancd
    const advancedMenu = this.createAdvancedMenu();

    menubar.append(advancedMenu);

    // Window
    const windowMenuItem = this.createAdvanceddWindowMenu();

    menubar.append(windowMenuItem);

    // Help
    const helpMenuItem = this.createHelpMenu();

    menubar.append(helpMenuItem);

    if (!isMacintosh) {
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

    if (isMacintosh) {
      // Mac: Application
      const macApplicationMenuItem = this.createMacApplicationMenu();

      menubar.append(macApplicationMenuItem);

      // File
      const fileMenu = new Menu();

      const items = this.getMenuItemTemplate('file').items;
      const playbackItems = this.getMenuItemTemplate('playback').items;

      const openMenuItemTemplate = items.find((item: MenubarMenuItem) => item.id === 'file.open') as IMenubarMenuItemAction;
      const openMenuItem = this.createMenuItem(openMenuItemTemplate);

      const openUrlMenuItemTemplate = items.find((item: MenubarMenuItem) => item.id === 'file.openUrl') as IMenubarMenuItemAction;
      const openUrlMenuItem = this.createMenuItem(openUrlMenuItemTemplate);

      const closeWindowTemplate = items.find((item: MenubarMenuItem) => item.id === 'file.closeWindow') as IMenubarMenuItemRole;
      const closeMenuItem = this.createRoleMenuItem(closeWindowTemplate);

      [openMenuItem, openUrlMenuItem,
        closeMenuItem].forEach(i => fileMenu.append(i));

      const downloadTemplate = items.find((item: MenubarMenuItem) => item.id === 'file.download') as IMenubarMenuItemRole;
      const downloadMenuItem = this.createMenuItem(downloadTemplate);

      if (!process.mas) [separator(), downloadMenuItem].forEach(i => fileMenu.append(i));

      const snapShotTemplate = playbackItems.find((item: MenubarMenuItem) => item.id === 'playback.snapShot') as IMenubarMenuItemAction;
      const snapShotMenuItem = this.createMenuItem(snapShotTemplate);

      [separator(), snapShotMenuItem].forEach(i => fileMenu.append(i));

      const fileMenuItem = new MenuItem({ label: this.$t('msg.file.name'), submenu: fileMenu });

      menubar.append(fileMenuItem);
    } else {
      // File
      this.getMenuItemTemplate('file').items.forEach((item: MenubarMenuItem) => {
        if (item.id === 'file.open') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.openUrl') {
          const menuItem = item as IMenubarMenuItemAction;
          menubar.append(this.createMenuItem(menuItem));
        } else if (item.id === 'file.download') {
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

      let account: MenuItem;
      if (this.user) {
        const label = this.locale.$t('msg.account.name');
        account = this.createMenuItem(`${label}: ${this.user.displayName}`, () => {
          app.emit('route-account');
        }, undefined, true, undefined, 'account');
      } else {
        account = this.createMenuItem('msg.account.login', () => {
          app.emit('add-login', 'menu');
        }, undefined, true, undefined, 'account');
      }
      menubar.append(account);
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

    if (!isMacintosh) {
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
    if (isMacintosh) {
      // Mac: Application
      const macApplicationMenuItem = this.createMacApplicationMenu(true);

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

  private createMacApplicationMenuItem(hideCheckBtn: boolean = false): MenuItem[] {
    const about = this.createMenuItem('msg.splayerx.about', () => {
      app.emit('add-windows-about');
    }, undefined, true);
    const checkForUpdates = this.createMenuItem('msg.splayerx.checkForUpdates', () => {
      app.emit('check-for-updates');
    }, undefined, true);
    const preference = this.createMenuItem('msg.splayerx.preferences', () => {
      app.emit('add-preference');
    }, 'CmdOrCtrl+,');
    let account: MenuItem;
    if (this.user) {
      const label = this.locale.$t('msg.account.name');
      account = this.createMenuItem(`${label}: ${this.user.displayName}`, () => {
        app.emit('route-account');
      }, undefined, true, undefined, 'account');
    } else {
      account = this.createMenuItem('msg.account.login', () => {
        app.emit('add-login', 'menu');
      }, undefined, true, undefined, 'account');
    }

    const hide = this.createRoleMenuItem('msg.splayerx.hide', 'hide');
    const hideOthers = this.createRoleMenuItem('msg.splayerx.hideOthers', 'hideOthers');
    const unhide = this.createRoleMenuItem('msg.splayerx.showAll', 'unhide');
    const quit = this.createRoleMenuItem('msg.splayerx.quit', 'quit');

    const actions = [about];
    actions.push(...[
      separator(),
    ]);
    // mac dmg
    if (isMacintoshDMG && !hideCheckBtn && this._routeName !== 'welcome-privacy' && this._routeName !== 'language-setting') {
      const items = this._routeName === 'browsing-view' ? [preference, separator()] : [
        checkForUpdates,
        separator(),
        preference,
        account,
        separator(),
      ];
      actions.push(...items);
    } else if (this._routeName !== 'welcome-privacy' && this._routeName !== 'language-setting') {
      actions.push(...[
        preference,
        account,
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
    return actions;
  }

  private createMacApplicationMenu(hideCheckBtn: boolean = false): Electron.MenuItem {
    const applicationMenu = new Menu();
    const actions = this.createMacApplicationMenuItem(hideCheckBtn);
    actions.forEach(i => applicationMenu.append(i));
    return new MenuItem({ label: this.$t('msg.splayerx.name'), submenu: applicationMenu, id: 'application' });
  }

  private createFileMenu(): Electron.MenuItem {
    const fileMenu = this.convertFromMenuItemTemplate('file');
    return new MenuItem({ id: 'file', label: this.$t('msg.file.name'), submenu: fileMenu });
  }

  private createAdvancedPlaybackMenu() {
    const playbackMenu = this.convertFromMenuItemTemplate('advanced.playback');
    return new MenuItem({ id: 'advanced.playback', label: this.$t('msg.playback.name'), submenu: playbackMenu });
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

  private createAdvancedMenu() {
    const windowMenu = this.convertFromMenuItemTemplate('advanced');
    return new MenuItem({ id: 'advanced', label: this.$t('msg.advanced.name'), submenu: windowMenu });
  }

  private createEditMenu() {
    const editMenu = this.convertFromMenuItemTemplate('edit');
    return new MenuItem({ id: 'edit', label: this.$t('msg.edit.name'), submenu: editMenu });
  }

  private createHistoryMenu() {
    const historyMenu = this.convertFromMenuItemTemplate('history');
    return new MenuItem({ id: 'history', label: this.$t('msg.history.name'), submenu: historyMenu });
  }

  private createBrowsingWindowMenu() {
    const window = this.convertFromMenuItemTemplate('browsing.window');
    return new MenuItem({ id: 'browsing.window', label: this.$t('msg.window.name'), submenu: window });
  }

  private createAdvanceddWindowMenu() {
    const windowMenu = this.convertFromMenuItemTemplate('advanced.window');
    return new MenuItem({ id: 'advanced.window', label: this.$t('msg.window.name'), submenu: windowMenu });
  }

  private createWindowMenu() {
    const windowMenu = this.convertFromMenuItemTemplate('window');
    return new MenuItem({ id: 'window', label: this.$t('msg.window.name'), submenu: windowMenu });
  }

  private createHelpMenu() {
    const helpMenu = new Menu();

    if (!isMacintosh && isWindowsExE) {
      const about = this.createMenuItem('msg.splayerx.about', () => {
        app.emit('add-windows-about');
      }, undefined, true);

      helpMenu.append(about);

      helpMenu.append(separator());

      const checkForUpdates = this.createMenuItem('msg.splayerx.checkForUpdates', () => {
        app.emit('check-for-updates');
      }, undefined, true, undefined, 'splayerx.checkForUpdates');

      helpMenu.append(checkForUpdates);

      helpMenu.append(separator());
    } else if (!isMacintosh) {
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

    const uploadInfo = this.createMenuItem('msg.help.uploadInfo', undefined, undefined, true);
    helpMenu.append(uploadInfo);

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
    role: MenuRole,
    enabled?: boolean,
  ): Electron.MenuItem

  private createRoleMenuItem(
    arg1: string | IMenubarMenuItemRole,
    role?: MenuRole,
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

  // eslint-disable-next-line complexity
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
        menuIcon = nativeTheme.shouldUseDarkColors ? nativeImage.createFromDataURL(require('../../../build/icons/mojave-pip.png')) : nativeImage.createFromDataURL(require('../../../build/icons/normal-pip.png'));
        break;
      case 'play-in-new-window':
        menuIcon = nativeTheme.shouldUseDarkColors ? nativeImage.createFromDataURL(require('../../../build/icons/mojave-window.png')) : nativeImage.createFromDataURL(require('../../../build/icons/normal-window.png'));
        break;
      default:
        menuIcon = '';
        break;
    }
    const label = this.$t(arg1.label);

    const fullScreenAccelerator = process.platform === 'darwin' ? 'Cmd+Ctrl+F' : 'F11';
    const finalAccelerator = ['window.fullscreen', 'browsing.window.fullscreen'].includes(arg1.id) ? fullScreenAccelerator : arg1.accelerator;
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
      accelerator: finalAccelerator,
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
    } else if (arg1.id === 'file.airShared') {
      options.click = () => {
        airSharedInstance.onClickAirShared(this);
      };
    } else if (arg1.id === 'window.bossKey') {
      options.click = () => {
        app.emit('bossKey');
      };
    } else if (arg1.id === 'window.minimize') {
      options.click = () => {
        app.emit('minimize');
      };
    }

    if (arg1.winAccelerator && !isMacintosh) {
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
      const hideOn = (menuItem as IMenubarMenuItemAction).hideOn;
      if (hideOn) {
        if (hideOn.includes('mas') && process.mas) return;
      }
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
