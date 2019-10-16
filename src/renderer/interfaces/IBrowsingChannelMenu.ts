export interface IBrowsingChannelMenu {
  getChannelMenu(): Electron.Menu
  createChannelMenu(channel: string): void
}
