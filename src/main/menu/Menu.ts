import { Menu, MenuItem, app } from 'electron';
import { IsMacintosh } from '../../shared/common/platform';
import Locale from '../../shared/common/localize';
import menuTemplate from './menuId.json';

export default class Menubar {
  private oldMenus: Menu[];

  private mainWindow: Electron.BrowserWindow;

  private locale: Locale;

  public constructor() {
    this.locale = new Locale();
    this.oldMenus = [];
    this.install();
  }

  public setMainWindow(window: Electron.BrowserWindow) {
    // may replace this way of getting mainWindow by window service or else...
    this.mainWindow = window;
  }

  private install(): void {
    // Store old menu in our array to avoid GC to collect the menu and crash. See #55347
    // TODO@sbatten Remove this when fixed upstream by Electron
    const oldMenu = Menu.getApplicationMenu();

    console.log('oldMenu', oldMenu);
    // If we don't have a menu yet, set it to null to avoid the electron menu.
    // This should only happen on the first launch ever
    if (!oldMenu) {
      console.log('hey');
      Menu.setApplicationMenu(IsMacintosh ? new Menu() : null);
      return;
    }

    // Menus
    const menubar = new Menu();

    // Mac: Application
    // let macApplicationMenuItem: Electron.MenuItem;
    // if (IsMacintosh) {
    //   const applicationMenu = new Menu();
    //   macApplicationMenuItem = new MenuItem({ label: 'Splayer', submenu: applicationMenu });
    //   this.setMacApplicationMenu(applicationMenu);
    //   menubar.append(macApplicationMenuItem);
    // }

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

    console.log('menubar', menubar);

    if (menubar.items && menubar.items.length > 0) {
      Menu.setApplicationMenu(menubar);
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  private $t(msg: string): string {
    return this.locale.$t(msg);
  }

  private createFileMenu(): Electron.MenuItem {
    const fileMenu = new Menu();
    this.getMenuItemTemplate('file').forEach((menuid: string) => {
      const menuItem = this.createMenuItem(`msg.file.${menuid}`);
      fileMenu.append(menuItem);
    });
    const fileMenuItem = new MenuItem({ label: this.$t('msg.file.name'), submenu: fileMenu });
    return fileMenuItem;
  }

  private createPlaybackMenu() {
    const playbackMenu = new Menu();
    this.getMenuItemTemplate('playback').forEach((menuid: string) => {
      const menuItem = this.createMenuItem(`msg.playback.${menuid}`);
      playbackMenu.append(menuItem);
    });
    const playbackMenuItem = new MenuItem({ label: this.$t('msg.playback.name'), submenu: playbackMenu });
    return playbackMenuItem;
  }

  private createAudioMenu() {
    const audioMenu = new Menu();
    this.getMenuItemTemplate('audio').forEach((menuid: string) => {
      const menuItem = this.createMenuItem(`msg.audio.${menuid}`);
      audioMenu.append(menuItem);
    });
    const audioMenuItem = new MenuItem({ label: this.$t('msg.audio.name'), submenu: audioMenu });
    return audioMenuItem;
  }

  private createSubtitleMenu() {
    const subtitleMenu = new Menu();
    this.getMenuItemTemplate('subtitle').forEach((menuid: string) => {
      const menuItem = this.createMenuItem(`msg.subtitle.${menuid}`);
      subtitleMenu.append(menuItem);
    });
    const subtitleMenuItem = new MenuItem({ label: this.$t('msg.subtitle.name'), submenu: subtitleMenu });
    return subtitleMenuItem;
  }

  private createMacWindowMenu() {
    const macWindowMenu = new Menu();
    const macWindowMenuItem = new MenuItem({ label: this.$t('msg.window.name'), submenu: macWindowMenu });
    return macWindowMenuItem;
  }

  private createHelpMenu() {
    const helpMenu = new Menu();
    const helpMenuItem = new MenuItem({ label: this.$t('msg.help.name'), submenu: helpMenu });
    return helpMenuItem;
  }

  private createMenuItem(
    label: string,
    click?: (menuItem: Electron.MenuItem) => void,
    enabled?: boolean,
    checked?: boolean,
  ): Electron.MenuItem {
    const id = label.replace(/^msg./g, '');
    label = this.$t(label);
    if (!click) {
      click = (menuItem: Electron.MenuItem) => {
        if (this.mainWindow) this.mainWindow.webContents.send(`menu-item-${id}`, menuItem);
        else {
          app.emit('menu-create-main-window', id, menuItem);
        }
      };
    }
    if (!enabled) enabled = false;
    if (!checked) checked = false;

    const options: Electron.MenuItemConstructorOptions = {
      label,
      click,
      enabled,
    };

    if (checked) {
      options.type = 'checkbox';
      options.checked = checked;
    }
    return new MenuItem(options);
  }

  private setMenuById() {

  }

  private getMenuItemTemplate(menu: string) {
    return menuTemplate[menu];
  }
}

function separator(): Electron.MenuItem {
  return new MenuItem({ type: 'separator' });
}

export const menuService = new Menubar();
