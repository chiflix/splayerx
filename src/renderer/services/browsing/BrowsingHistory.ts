import { IBrowsingHistory, historyItem } from '@/interfaces/IBrowsingHistory';
import { browsingDB } from '@/helpers/browsingDB';

export default class BrowsingHistory implements IBrowsingHistory {
  public getHistorys(): historyItem[] {
  }
}

export const browsingHistory = new BrowsingHistory();
