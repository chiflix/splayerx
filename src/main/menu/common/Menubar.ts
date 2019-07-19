
export interface IMenubarMenu {
	items: Array<MenubarMenuItem>;
}

export type MenubarMenuItem = IMenubarMenuItemAction | IMenubarMenuItemSubmenu | IMenubarMenuItemSeparator;

export interface IMenubarMenuItemAction {
	id: string;
	label: string;
	checked?: boolean; // Assumed false if missing
	enabled?: boolean; // Assumed true if missing
}

export interface IMenubarMenuItemSubmenu {
	id: string;
	label: string;
	submenu: IMenubarMenu;
}

export interface IMenubarMenuItemSeparator {
	id: 'vscode.menubar.separator';
}

export interface IMenubarKeybinding {
	label: string;
	userSettingsLabel?: string;
	isNative?: boolean; // Assumed true if missing
}
