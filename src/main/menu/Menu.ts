import { Menu, MenuItem, app } from 'electron';
import {
  MenubarMenuItem,
  IMenubarMenu,
  IMenubarMenuItemSubmenu,
  IMenubarMenuItemSeparator,
} from './common/Menubar';
import { IsMacintosh } from '../../shared/common/platform';
import Locale from '../../shared/common/localize';
import menuTemplate from './menu.json';
import { IMenuDisplayInfo } from '../../renderer/interfaces/IRecentPlay';

function separator(): Electron.MenuItem {
  return new MenuItem({ type: 'separator' });
}
function isSeparator(menuItem: MenubarMenuItem): menuItem is IMenubarMenuItemSeparator {
  return menuItem.id === 'menubar.separator';
}
function isSubmenu(menuItem: MenubarMenuItem): menuItem is IMenubarMenuItemSubmenu {
  return (menuItem as IMenubarMenuItemSubmenu).submenu !== undefined;
}

export default class Menubar {
  private mainWindow: Electron.BrowserWindow;

  private locale: Locale;

  private menubar: Electron.Menu;

  public constructor() {
    this.locale = new Locale();
    this.install();
  }

  public setMainWindow(window: Electron.BrowserWindow) {
    // may replace this way of getting mainWindow by window service or else...
    this.mainWindow = window;
  }

  public updateRecentPlay(items: IMenuDisplayInfo[]) {
    if (!this.menubar) this.menubar = Menu.getApplicationMenu() as Electron.Menu;
    const menuItem = this.menubar.getMenuItemById('file.openRecent');
    items.forEach(({ id, label }) => {
      const item = this.createMenuItem(label, () => {
        if (!this.mainWindow.webContents.isDestroyed()) {
          this.mainWindow.webContents.send(id.toString());
        }
      });
      menuItem.submenu.append(item);
    });
  }

  private install(): void {
    // Store old menu in our array to avoid GC to collect the menu and crash. See #55347
    // TODO@sbatten Remove this when fixed upstream by Electron
    const oldMenu = Menu.getApplicationMenu();

    // If we don't have a menu yet, set it to null to avoid the electron menu.
    // This should only happen on the first launch ever
    if (!oldMenu) {
      Menu.setApplicationMenu(IsMacintosh ? new Menu() : null);
      return;
    }

    // Menus
    const menubar = new Menu();

    // Mac: Application
    let macApplicationMenuItem: Electron.MenuItem;
    if (IsMacintosh) {
      macApplicationMenuItem = this.createMacApplicationMenu();
      menubar.append(macApplicationMenuItem);
    }

    // File
    const fileMenuItem = this.createFileMenu();

    menubar.append(fileMenuItem);

    // PlayBack
    const playbackMenuItem = this.createPlaybackMenu();

    menubar.append(playbackMenuItem);

    // Audio
    const audioMenuItem = this.createAudioMenu();

    menubar.append(audioMenuItem);

    // Subtitle
    const subtitleMenuItem = this.createSubtitleMenu();

    menubar.append(subtitleMenuItem);

    // Mac: Window
    let macWindowMenuItem: Electron.MenuItem | undefined;
    if (IsMacintosh) {
      macWindowMenuItem = this.createMacWindowMenu();
    }

    if (macWindowMenuItem) {
      menubar.append(macWindowMenuItem);
    }

    // Help
    const helpMenuItem = this.createHelpMenu();

    menubar.append(helpMenuItem);

    if (menubar.items && menubar.items.length > 0) {
      Menu.setApplicationMenu(menubar);
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  private $t(msg: string): string {
    return this.locale.$t(msg);
  }

  private createMacApplicationMenu(): Electron.MenuItem {
    const applicationMenu = new Menu();
    const about = this.createMenuItem('msg.splayerx.about', () => {
      app.emit('add-windows-about');
    }, undefined, true);
    const preference = this.createMenuItem('msg.splayerx.preferences', () => {
      app.emit('add-preference');
    }, 'CmdOrCtrl+,', true);

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
    const fileMenu = new Menu();
    const open = this.createMenuItem('msg.file.open', undefined, 'CmdOrCtrl+O', true);
    const openRecent = this.createSubMenuItem('msg.file.openRecent');
    const clearHistory = this.createMenuItem('msg.file.clearHistory', undefined, undefined, true);
    const closeWindow = this.createRoleMenuItem('msg.file.closeWindow', 'close');

    const actions = [open];
    actions.push(...[
      openRecent,
      separator(),
      clearHistory,
      separator(),
      closeWindow,
    ]);
    actions.forEach(i => fileMenu.append(i));

    const fileMenuItem = new MenuItem({ id: 'file', label: this.$t('msg.file.name'), submenu: fileMenu });
    return fileMenuItem;
  }

  private createPlaybackMenu() {
    const playbackMenu = this.convertFromMenuItemTemplate('playback');
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

  private createMacWindowMenu() {
    const macWindowMenu = new Menu();

    const windowFront = this.createMenuItem('msg.window.keepPlayingWindowFront', undefined, undefined, true, false);

    const fullscreen = this.createMenuItem('msg.window.enterFullScreen', undefined, 'F');
    const minimize = this.createRoleMenuItem('msg.window.minimize', 'minimize');

    const halfSize = this.createMenuItem('msg.window.halfSize', undefined, 'CmdOrCtrl+0');
    const originSize = this.createMenuItem('msg.window.originSize', undefined, 'CmdOrCtrl+1');
    const doubleSize = this.createMenuItem('msg.window.doubleSize', undefined, 'CmdOrCtrl+2');
    const maxmize = this.createMenuItem('msg.window.maxmize', undefined, 'CmdOrCtrl+3');

    const windowRotate = this.createMenuItem('msg.window.windowRotate', undefined, 'CmdOrCtrl+L');
    const bossKey = this.createMenuItem('msg.window.bossKey', () => {
      app.emit('bossKey');
    }, 'CmdOrCtrl+`');

    const backToLandingView = this.createMenuItem('msg.window.backToLandingView', undefined, 'CmdOrCtrl+E');

    const actions = [windowFront];
    actions.push(...[
      separator(),
      fullscreen,
      minimize,
      separator(),
      halfSize,
      originSize,
      doubleSize,
      maxmize,
      separator(),
      windowRotate,
      bossKey,
      separator(),
      backToLandingView,
    ]);
    actions.forEach(i => macWindowMenu.append(i));

    const macWindowMenuItem = new MenuItem({ label: this.$t('msg.window.name'), submenu: macWindowMenu });
    return macWindowMenuItem;
  }

  private createHelpMenu() {
    const helpMenu = new Menu();

    const feedback = this.createMenuItem('msg.help.feedback');
    const homepage = this.createMenuItem('msg.help.homepage');
    const shortCuts = this.createMenuItem('msg.help.shortCuts');

    let crashReport;
    if (!process.mas) crashReport = this.createMenuItem('msg.help.crashReportLocation');

    [feedback, homepage, shortCuts].forEach(i => helpMenu.append(i));

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
          let item;
          item = this.createMenuItem(
            `msg.${menuItem.id}`,
            undefined,
            IsMacintosh ? menuItem.accelerator : menuItem.winAccelerator,
            menuItem.enabled,
            menuItem.checked,
          );
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
  ): Electron.MenuItem {
    const id = label.replace(/^msg./g, '');
    label = this.$t(label);
    if (!click) {
      click = (menuItem: Electron.MenuItem) => {
        if (!this.mainWindow.webContents.isDestroyed()) {
          this.mainWindow.webContents.send(id, menuItem);
        } else {
          app.emit('menu-create-main-window', id, menuItem);
        }
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
      } else {
        let item;
        item = this.createMenuItem(
          `msg.${menu}.${menuItem.label}`,
          undefined,
          IsMacintosh ? menuItem.accelerator : menuItem.winAccelerator,
          menuItem.enabled,
          menuItem.checked,
        );
        newMenu.append(item);
      }
    });
    return newMenu;
  }
}

export const menuService = new Menubar();
