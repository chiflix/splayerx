import { Menu, MenuItem } from 'electron';
import { isMacintosh } from 'shared/common/platform';

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

		// Mac: Application
		let macApplicationMenuItem: Electron.MenuItem;
		if (isMacintosh) {
			const applicationMenu = new Menu();
			macApplicationMenuItem = new MenuItem({ label: 'Splayer', submenu: applicationMenu });
			this.setMacApplicationMenu(applicationMenu);
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

		menubar.append(viewMenuItem);

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

	private createFileMenu() {
		const fileMenu = new Menu();
		const fileMenuItem = new MenuItem();
	}

	private createPlaybackMenu() {

	}

	private createAudioMenu() {

	}

	private createSubtitleMenu() {
		
	}

	private createMacWindowMenu() {

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

export const menuService = new MenuService();