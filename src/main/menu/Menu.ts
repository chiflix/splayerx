import { Menu, MenuItem } from 'electron';
import { isMacintosh } from 'shared/common/platform';
import { $t } from 'shared/common/localize';

export default class Menubar {
  
	private oldMenus: Menu[];

  constructor() {

		this.oldMenus = [];

		this.install();
  }
  private install(): void {
		// Store old menu in our array to avoid GC to collect the menu and crash. See #55347
		// TODO@sbatten Remove this when fixed upstream by Electron
		const oldMenu = Menu.getApplicationMenu();

		console.log(oldMenu);
		// If we don't have a menu yet, set it to null to avoid the electron menu.
		// This should only happen on the first launch ever
		if (!oldMenu) {
			Menu.setApplicationMenu(isMacintosh ? new Menu() : null);
			return;
		}

		// Menus
		const menubar = new Menu();

		// // Mac: Application
		// let macApplicationMenuItem: Electron.MenuItem;
		// if (isMacintosh) {
		// 	const applicationMenu = new Menu();
		// 	macApplicationMenuItem = new MenuItem({ label: 'Splayer', submenu: applicationMenu });
		// 	this.setMacApplicationMenu(applicationMenu);
		// 	menubar.append(macApplicationMenuItem);
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
		if (isMacintosh) {
			macWindowMenuItem = this.createMacWindowMenu();
		}

		if (macWindowMenuItem) {
			menubar.append(macWindowMenuItem);
		}

		// Help
		const helpMenuItem = this.createHelpMenu();

		menubar.append(helpMenuItem);

		console.log(menubar);

		if (menubar.items && menubar.items.length > 0) {
			Menu.setApplicationMenu(menubar);
		} else {
			Menu.setApplicationMenu(null);
		}

	}

	private createFileMenu(): Electron.MenuItem {
		const fileMenu = new Menu();
		const fileMenuItem = new MenuItem({ label: $t('msg.file.name'), submenu: fileMenu });
		return fileMenuItem;
	}

	private createPlaybackMenu() {
		const playbackMenu = new Menu();
		const playbackMenuItem = new MenuItem({ label: $t('msg.playback.name'), submenu: playbackMenu });
		return playbackMenuItem;
	}

	private createAudioMenu() {
		const audioMenu = new Menu();
		const audioMenuItem = new MenuItem({ label: $t('msg.audio.name'), submenu: audioMenu });
		return audioMenuItem;
	}

	private createSubtitleMenu() {
		const subtitleMenu = new Menu();
		const subtitleMenuItem = new MenuItem({ label: $t('msg.subtitle.name'), submenu: subtitleMenu });
		return subtitleMenuItem;
	}

	private createMacWindowMenu() {
		const macWindowMenu = new Menu();
		const macWindowMenuItem = new MenuItem({ label: $t('msg.window.name'), submenu: macWindowMenu });
		return macWindowMenuItem;
	}

	private createHelpMenu() {
		const helpMenu = new Menu();
		const helpMenuItem = new MenuItem({ label: $t('msg.help.name'), submenu: helpMenu });
		return helpMenuItem;
	}

	private setMacMenu() {

	}

	private setWinMenu() {

	}

	private setMenuById() {
		
	}
}

function __separator__(): Electron.MenuItem {
	return new MenuItem({ type: 'separator' });
}

export const menuService = new Menubar();