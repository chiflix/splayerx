import { Menu, MenuItem } from 'electron';
import { isMacintosh } from 'shared/common/platform';

export default class MenuService {
  
  private willShutdown: boolean;
	private appMenuInstalled: boolean;
  private closedLastWindow: boolean;
  
  private oldMenus: Menu[];

  constructor() {
		// this.menuUpdater = new RunOnceScheduler(() => this.doUpdateMenu(), 0);

		// this.menuGC = new RunOnceScheduler(() => { this.oldMenus = []; }, 10000);

		// this.menubarMenus = Object.create(null);
		// this.keybindings = Object.create(null);

		// if (isMacintosh || getTitleBarStyle(this.configurationService, this.environmentService) === 'native') {
		// 	this.restoreCachedMenubarData();
		// }

		// this.addFallbackHandlers();

		// this.closedLastWindow = false;

		this.oldMenus = [];

		this.install();

		// this.registerListeners();
  }
  private install(): void {
		// Store old menu in our array to avoid GC to collect the menu and crash. See #55347
		// TODO@sbatten Remove this when fixed upstream by Electron
		const oldMenu = Menu.getApplicationMenu();
		if (oldMenu) {
			this.oldMenus.push(oldMenu);
		}

		// If we don't have a menu yet, set it to null to avoid the electron menu.
		// This should only happen on the first launch ever
		if (Object.keys(this.menubarMenus).length === 0) {
			Menu.setApplicationMenu(isMacintosh ? new Menu() : null);
			return;
		}

		// Menus
		const menubar = new Menu();

		// Mac: Application
		let macApplicationMenuItem: Electron.MenuItem;
		if (isMacintosh) {
			const applicationMenu = new Menu();
			macApplicationMenuItem = new MenuItem({ label: product.nameShort, submenu: applicationMenu });
			this.setMacApplicationMenu(applicationMenu);
			menubar.append(macApplicationMenuItem);
		}

		// Mac: Dock
		if (isMacintosh && !this.appMenuInstalled) {
			this.appMenuInstalled = true;

			const dockMenu = new Menu();
			dockMenu.append(new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'miNewWindow', comment: ['&& denotes a mnemonic'] }, "New &&Window")), click: () => this.windowsMainService.openNewWindow(OpenContext.DOCK) }));

			app.dock.setMenu(dockMenu);
		}

		// File
		const fileMenu = new Menu();
		const fileMenuItem = new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mFile', comment: ['&& denotes a mnemonic'] }, "&&File")), submenu: fileMenu });

		this.setMenuById(fileMenu, 'File');
		menubar.append(fileMenuItem);

		// Edit
		const editMenu = new Menu();
		const editMenuItem = new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mEdit', comment: ['&& denotes a mnemonic'] }, "&&Edit")), submenu: editMenu });

		this.setMenuById(editMenu, 'Edit');
		menubar.append(editMenuItem);

		// Selection
		const selectionMenu = new Menu();
		const selectionMenuItem = new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mSelection', comment: ['&& denotes a mnemonic'] }, "&&Selection")), submenu: selectionMenu });

		this.setMenuById(selectionMenu, 'Selection');
		menubar.append(selectionMenuItem);

		// View
		const viewMenu = new Menu();
		const viewMenuItem = new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mView', comment: ['&& denotes a mnemonic'] }, "&&View")), submenu: viewMenu });

		this.setMenuById(viewMenu, 'View');
		menubar.append(viewMenuItem);

		// Go
		const gotoMenu = new Menu();
		const gotoMenuItem = new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mGoto', comment: ['&& denotes a mnemonic'] }, "&&Go")), submenu: gotoMenu });

		this.setMenuById(gotoMenu, 'Go');
		menubar.append(gotoMenuItem);

		// Debug
		const debugMenu = new Menu();
		const debugMenuItem = new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mDebug', comment: ['&& denotes a mnemonic'] }, "&&Debug")), submenu: debugMenu });

		this.setMenuById(debugMenu, 'Debug');
		menubar.append(debugMenuItem);

		// Terminal
		const terminalMenu = new Menu();
		const terminalMenuItem = new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mTerminal', comment: ['&& denotes a mnemonic'] }, "&&Terminal")), submenu: terminalMenu });

		this.setMenuById(terminalMenu, 'Terminal');
		menubar.append(terminalMenuItem);

		// Mac: Window
		let macWindowMenuItem: Electron.MenuItem | undefined;
		if (this.shouldDrawMenu('Window')) {
			const windowMenu = new Menu();
			macWindowMenuItem = new MenuItem({ label: this.mnemonicLabel(nls.localize('mWindow', "Window")), submenu: windowMenu, role: 'window' });
			this.setMacWindowMenu(windowMenu);
		}

		if (macWindowMenuItem) {
			menubar.append(macWindowMenuItem);
		}

		// Help
		const helpMenu = new Menu();
		const helpMenuItem = new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mHelp', comment: ['&& denotes a mnemonic'] }, "&&Help")), submenu: helpMenu, role: 'help' });

		this.setMenuById(helpMenu, 'Help');
		menubar.append(helpMenuItem);

		if (menubar.items && menubar.items.length > 0) {
			Menu.setApplicationMenu(menubar);
		} else {
			Menu.setApplicationMenu(null);
		}

		// Dispose of older menus after some time
		this.menuGC.schedule();
  }
  private setMacApplicationMenu(macApplicationMenu: Electron.Menu): void {
		const about = this.createMenuItem(nls.localize('mAbout', "About {0}", product.nameLong), 'workbench.action.showAboutDialog');
		const checkForUpdates = this.getUpdateMenuItems();

		let preferences;
		if (this.shouldDrawMenu('Preferences')) {
			const preferencesMenu = new Menu();
			this.setMenuById(preferencesMenu, 'Preferences');
			preferences = new MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'miPreferences', comment: ['&& denotes a mnemonic'] }, "&&Preferences")), submenu: preferencesMenu });
		}

		const servicesMenu = new Menu();
		const services = new MenuItem({ label: nls.localize('mServices', "Services"), role: 'services', submenu: servicesMenu });
		const hide = new MenuItem({ label: nls.localize('mHide', "Hide {0}", product.nameLong), role: 'hide', accelerator: 'Command+H' });
		const hideOthers = new MenuItem({ label: nls.localize('mHideOthers', "Hide Others"), role: 'hideothers', accelerator: 'Command+Alt+H' });
		const showAll = new MenuItem({ label: nls.localize('mShowAll', "Show All"), role: 'unhide' });
		const quit = new MenuItem(this.likeAction('workbench.action.quit', {
			label: nls.localize('miQuit', "Quit {0}", product.nameLong), click: () => {
				if (
					this.windowsMainService.getWindowCount() === 0 || 			// allow to quit when no more windows are open
					!!this.windowsMainService.getFocusedWindow() ||				// allow to quit when window has focus (fix for https://github.com/Microsoft/vscode/issues/39191)
					this.windowsMainService.getLastActiveWindow()!.isMinimized()	// allow to quit when window has no focus but is minimized (https://github.com/Microsoft/vscode/issues/63000)
				) {
					this.windowsMainService.quit();
				}
			}
		}));

		const actions = [about];
		actions.push(...checkForUpdates);

		if (preferences) {
			actions.push(...[
				__separator__(),
				preferences
			]);
		}

		actions.push(...[
			__separator__(),
			services,
			__separator__(),
			hide,
			hideOthers,
			showAll,
			__separator__(),
			quit
		]);

		actions.forEach(i => macApplicationMenu.append(i));
  }
  private createMenuItem(label: string, commandId: string | string[], enabled?: boolean, checked?: boolean): Electron.MenuItem;
	private createMenuItem(label: string, click: () => void, enabled?: boolean, checked?: boolean): Electron.MenuItem;
	private createMenuItem(arg1: string, arg2: any, arg3?: boolean, arg4?: boolean): Electron.MenuItem {
		const label = this.mnemonicLabel(arg1);
		const click: () => void = (typeof arg2 === 'function') ? arg2 :
		(menuItem: Electron.MenuItem & IMenuItemWithKeybinding, win: Electron.BrowserWindow, event: Electron.Event) => {
			const userSettingsLabel = menuItem ? menuItem.userSettingsLabel : null;
			let commandId = arg2;
			if (Array.isArray(arg2)) {
				commandId = this.isOptionClick(event) ? arg2[1] : arg2[0]; // support alternative action if we got multiple action Ids and the option key was pressed while invoking
			}

			if (userSettingsLabel && Menubar._menuItemIsTriggeredViaKeybinding(event, userSettingsLabel)) {
				this.runActionInRenderer({ type: 'keybinding', userSettingsLabel });
			} else {
				this.runActionInRenderer({ type: 'commandId', commandId });
			}
		};
		const enabled = typeof arg3 === 'boolean' ? arg3 : this.windowsMainService.getWindowCount() > 0;
		const checked = typeof arg4 === 'boolean' ? arg4 : false;

		const options: Electron.MenuItemConstructorOptions = {
			label,
			click,
			enabled
		};

		if (checked) {
			options.type = 'checkbox';
			options.checked = checked;
		}

		let commandId: string | undefined;
		if (typeof arg2 === 'string') {
			commandId = arg2;
		} else if (Array.isArray(arg2)) {
			commandId = arg2[0];
		}

		if (isMacintosh) {

			// Add role for special case menu items
			if (commandId === 'editor.action.clipboardCutAction') {
				options.role = 'cut';
			} else if (commandId === 'editor.action.clipboardCopyAction') {
				options.role = 'copy';
			} else if (commandId === 'editor.action.clipboardPasteAction') {
				options.role = 'paste';
			}

			// Add context aware click handlers for special case menu items
			if (commandId === 'undo') {
				options.click = this.makeContextAwareClickHandler(click, {
					inDevTools: devTools => devTools.undo(),
					inNoWindow: () => Menu.sendActionToFirstResponder('undo:')
				});
			} else if (commandId === 'redo') {
				options.click = this.makeContextAwareClickHandler(click, {
					inDevTools: devTools => devTools.redo(),
					inNoWindow: () => Menu.sendActionToFirstResponder('redo:')
				});
			} else if (commandId === 'editor.action.selectAll') {
				options.click = this.makeContextAwareClickHandler(click, {
					inDevTools: devTools => devTools.selectAll(),
					inNoWindow: () => Menu.sendActionToFirstResponder('selectAll:')
				});
			}
		}

		return new MenuItem(this.withKeybinding(commandId, options));
	}
}

export const menuService = new MenuService();