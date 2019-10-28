import { IBrowsingHistory, HistoryItem } from '@/interfaces/IBrowsingHistory';
import { HISTORY_OBJECT_STORE_NAME } from '@/constants';
import { browsingDB, BrowsingHistoryItem } from '@/helpers/browsingDB';

export default class BrowsingHistory implements IBrowsingHistory {
  public async getHistorys(): Promise<HistoryItem[]> {
    const results = (await browsingDB.getAll(HISTORY_OBJECT_STORE_NAME))
      .sort((a: BrowsingHistoryItem, b: BrowsingHistoryItem) => a.openTime - b.openTime);
    return results;
  }

  public async saveHistoryItem(url: string, title: string) {
    return browsingDB.put(HISTORY_OBJECT_STORE_NAME, {
      url,
      title,
      openTime: Date.now(),
    });
  }
}

export const browsingHistory = new BrowsingHistory();
