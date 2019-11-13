import { channelDetails } from '@/interfaces/IBrowsingChannelManager';

export interface IBrowsingChannelMenu {
  getChannelMenu(): Electron.Menu
  createChannelMenu(channel: string, item?: channelDetails): void
}
