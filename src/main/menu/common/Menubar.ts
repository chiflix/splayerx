
export interface IMenubarMenu {
  items: MenubarMenuItem[];
}

export type MenubarMenuItem =
  IMenubarMenuItemAction | IMenubarMenuItemSubmenu | IMenubarMenuItemSeparator;

export interface IMenubarMenuItemAction {
  id: string;
  label: string;
  accelerator?: string;
  winAccelerator?: string,
  checked?: boolean; // Assumed false if missing
  enabled?: boolean; // Assumed true if missing
}

export interface IMenubarMenuItemSubmenu {
  id: string;
  label: string;
  submenu: IMenubarMenu;
}

export interface IMenubarMenuItemSeparator {
  id: 'menubar.separator';
}
