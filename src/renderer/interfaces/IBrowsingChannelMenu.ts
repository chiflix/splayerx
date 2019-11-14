import { channelDetails } from '@/interfaces/IBrowsingChannelManager';

export interface IBrowsingChannelMenu {
  getChannelMenu(): Electron.Menu
  createChannelMenu(channel: string): void
  createCustomizedMenu(channel: string, item: channelDetails): void
}
