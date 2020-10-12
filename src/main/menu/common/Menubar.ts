export interface IMenubarMenu {
  items: MenubarMenuItem[],
}

export type MenuRole = ('undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteAndMatchStyle' | 'delete' | 'selectAll' | 'reload' | 'forceReload' | 'toggleDevTools' | 'resetZoom' | 'zoomIn' | 'zoomOut' | 'togglefullscreen' | 'window' | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide' | 'hideOthers' | 'unhide' | 'quit' | 'startSpeaking' | 'stopSpeaking' | 'close' | 'minimize' | 'zoom' | 'front' | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu' | 'recentDocuments' | 'toggleTabBar' | 'selectNextTab' | 'selectPreviousTab' | 'mergeAllWindows' | 'clearRecentDocuments' | 'moveTabToNewWindow' | 'windowMenu');

export type MenubarMenuItem =
  IMenubarMenuItemAction
  | IMenubarMenuItemSubmenu
  | IMenubarMenuItemSeparator
  | IMenubarMenuItemRole
  | IMenubarMenuItemRadio;

export type MenuName = 'audio' | 'file' | 'help' | 'playback' | 'splayerx' | 'subtitle' | 'advanced.playback' | 'advanced' | 'advanced.window' | 'window' | 'edit' | 'history' | 'browsing.window';

export type IMenubarMenuState = {
  [menuName in MenuName]: IMenubarMenu;
};

export interface IMenubarMenuItemAction {
  id: string,
  label: string,
  accelerator?: string,
  winAccelerator?: string,
  checked?: boolean, // Assumed false if missing
  enabled?: boolean, // Assumed true if missing
  icon?: string,
  hideOn?: string[],
}

export interface IMenubarMenuItemRole {
  id: string,
  label: string,
  role: MenuRole,
  enabled?: boolean,
}

export interface IMenubarMenuItemSubmenu {
  id: string,
  label: string,
  submenu: IMenubarMenu,
  enabled?: boolean,
}

export interface IMenubarMenuItemRadio {
  id: string,
  label: string,
  type: 'radio',
  enabled?: boolean,
}

export interface IMenubarMenuItemSeparator {
  id: 'menubar.separator',
}
