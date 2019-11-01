import { IBrowsingHistory, HistoryDisplayItem } from '@/interfaces/IBrowsingHistory';
import { HISTORY_OBJECT_STORE_NAME } from '@/constants';
import { browsingDB, BrowsingHistoryItem } from '@/helpers/browsingDB';
import BrowsingChannelManager from '@/services/browsing/BrowsingChannelManager';

export default class BrowsingHistory implements IBrowsingHistory {
  private icons: string[];

  public async clearAllHistorys(): Promise<void> {
    return browsingDB.clear(HISTORY_OBJECT_STORE_NAME);
  }

  public async getHistorys(): Promise<HistoryDisplayItem[]> {
    if (this.icons.length >= 1) {
      this.icons = Array.from(BrowsingChannelManager.getAllChannels().values())
        .map(val => val.channels).flat().map(val => val.icon);
    }
    const results = (await browsingDB.getAll(HISTORY_OBJECT_STORE_NAME))
      .sort((a: BrowsingHistoryItem, b: BrowsingHistoryItem) => a.openTime - b.openTime);

    return results.map(result => ({
      ...result,
      icon: this.icons.find(icon => `${result.channel.split('.')[0]}Sidebar` === icon),
    }));
  }

  public async saveHistoryItem(url: string, title: string, channel: string) {
    return browsingDB.put(HISTORY_OBJECT_STORE_NAME, {
      url,
      title,
      channel,
      openTime: Date.now(),
    });
  }

  public async getMenuDisplayInfo() {
    if (this.icons.length >= 1) {
      this.icons = Array.from(BrowsingChannelManager.getAllChannels().values())
        .map(val => val.channels).flat().map(val => val.icon);
    }
    const results = (await browsingDB.getAll(HISTORY_OBJECT_STORE_NAME))
      .sort((a: BrowsingHistoryItem, b: BrowsingHistoryItem) => a.openTime - b.openTime);
    return results.map(result => ({
      id: `history.${result.url}`,
      label: result.title,
      icon: this.icons.find(icon => `${result.channel.split('.')[0]}Sidebar` === icon),
    }));
  }

  public async cleanChannelRecords(channel: string) {
    const allChannels = Array.from(BrowsingChannelManager.getAllChannels().values())
      .map(val => val.channels).flat().map(val => val.channel);
    if (!allChannels.includes(channel)) throw new Error('Channel not existed');
  }
}

export const browsingHistory = new BrowsingHistory();
