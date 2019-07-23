
export interface IMenubarMenu {
  items: MenubarMenuItem[];
}

export type MenubarMenuItem =
  IMenubarMenuItemAction
  | IMenubarMenuItemSubmenu
  | IMenubarMenuItemSeparator
  | IMenubarMenuItemRole;

export interface IMenubarMenuItemAction {
  id: string;
  label: string;
  accelerator?: string;
  winAccelerator?: string,
  checked?: boolean; // Assumed false if missing
  enabled?: boolean; // Assumed true if missing
}

export interface IMenubarMenuItemRole {
  id: string,
  label: string,
  role: ('undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteandmatchstyle' | 'delete' | 'selectall' | 'reload' | 'forcereload' | 'toggledevtools' | 'resetzoom' | 'zoomin' | 'zoomout' | 'togglefullscreen' | 'window' | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide' | 'hideothers' | 'unhide' | 'quit' | 'startspeaking' | 'stopspeaking' | 'close' | 'minimize' | 'zoom' | 'front' | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu' | 'windowMenu'),
  enabled?: boolean;
}

export interface IMenubarMenuItemSubmenu {
  id: string;
  label: string;
  submenu: IMenubarMenu;
}

export interface IMenubarMenuItemSeparator {
  id: 'menubar.separator';
}
