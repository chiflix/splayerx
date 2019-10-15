export interface IMenubarMenu {
  items: MenubarMenuItem[];
}

export type MenubarMenuItem =
  IMenubarMenuItemAction
  | IMenubarMenuItemSubmenu
  | IMenubarMenuItemSeparator
  | IMenubarMenuItemRole
  | IMenubarMenuItemRadio;

export type MenuName = 'audio' | 'file' | 'help' | 'playback' | 'splayerx' | 'subtitle' | 'window' | 'edit' | 'history' | 'favourite' | 'browsing.window';

export type IMenubarMenuState = {
  [menuName in MenuName]: IMenubarMenu;
};

export interface IMenubarMenuItemAction {
  id: string;
  label: string;
  accelerator?: string;
  winAccelerator?: string,
  checked?: boolean; // Assumed false if missing
  enabled?: boolean; // Assumed true if missing
  icon?: string,
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
  enabled?: boolean;
}

export interface IMenubarMenuItemRadio {
  id: string;
  label: string;
  type: 'radio';
  enabled?: boolean;
}

export interface IMenubarMenuItemSeparator {
  id: 'menubar.separator';
}
