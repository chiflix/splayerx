import path from 'path';
import { IBrowsingHistory, HistoryDisplayItem } from '@/interfaces/IBrowsingHistory';
import { HISTORY_OBJECT_STORE_NAME } from '@/constants';
import { browsingDB, BrowsingHistoryItem } from '@/helpers/browsingDB';
import BrowsingChannelManager from '@/services/browsing/BrowsingChannelManager';
import { channelDetails } from '@/interfaces/IBrowsingChannelManager';
import { menuService } from '@/services/menu/MenuService';

export default class BrowsingHistory implements IBrowsingHistory {
  private channels: channelDetails[];

  public async clearAllHistorys(): Promise<void> {
    await browsingDB.clear(HISTORY_OBJECT_STORE_NAME);
    return menuService.addBrowsingHistoryItems();
  }

  public async getHistorys(): Promise<HistoryDisplayItem[]> {
    this.channels = Array.from(BrowsingChannelManager.getAllChannels().values())
      .map(val => val.channels).flat();
    const results = (await browsingDB.getAll(HISTORY_OBJECT_STORE_NAME))
      .sort((a: BrowsingHistoryItem, b: BrowsingHistoryItem) => b.openTime - a.openTime);

    return results.map((result) => {
      console.log(this.channels, result, this.channels.find(item => item.channel === result.channel));
      return {
        ...result,
        icon: (this.channels.find(item => item.channel === result.channel) as channelDetails).icon,
      };
    });
  }

  public async saveHistoryItem(url: string, title: string, channel: string) {
    let result;
    const allRecords = await browsingDB.getAll(HISTORY_OBJECT_STORE_NAME);
    if (allRecords.length >= 10 && allRecords.findIndex(i => i.url === url) === -1) {
      const removeItem = allRecords
        .find(record => record.openTime === Math.min(...(allRecords.map(i => i.openTime))));
      browsingDB.delete(HISTORY_OBJECT_STORE_NAME, (removeItem as BrowsingHistoryItem).url);
    }
    const record = await browsingDB.getValueByKey(HISTORY_OBJECT_STORE_NAME, url);
    if (!record) {
      result = await browsingDB.add(HISTORY_OBJECT_STORE_NAME, {
        url,
        title,
        channel,
        openTime: Date.now(),
      });
    } else {
      result = await browsingDB.put(HISTORY_OBJECT_STORE_NAME, {
        ...record,
        openTime: Date.now(),
      });
    }
    menuService.addBrowsingHistoryItems();
    return result;
  }

  public async getMenuDisplayInfo() {
    const channels = Array.from(BrowsingChannelManager.getAllChannels().values())
      .map(val => val.channels).flat().map(val => val.channel.split('.')[0]);
    const results = (await browsingDB.getAll(HISTORY_OBJECT_STORE_NAME))
      .sort((a: BrowsingHistoryItem, b: BrowsingHistoryItem) => b.openTime - a.openTime);
    return results.map(({ url, title, channel }) => ({
      url,
      title,
      channel,
      iconPath: path.join(
        __static,
        'browsing',
        `${channels.find(val => channel.split('.')[0] === val)}.png`,
      ),
    }));
  }

  public async cleanChannelRecords(channel: string) {
    const allChannels = Array.from(BrowsingChannelManager.getAllChannels().values())
      .map(val => val.channels).flat().map(val => val.channel);
    if (!allChannels.includes(channel)) throw new Error('Channel not existed');
    const results = await browsingDB.getAllValueByIndex('history', 'channel', channel);
    results.forEach((result) => {
      browsingDB.delete('history', result.url);
    });
  }
}

export const browsingHistory = new BrowsingHistory();
