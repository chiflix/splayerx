export type HistoryDisplayItem = {
  url: string,
  title: string,
  channel: string,
  openTime: number,
  icon: string | undefined,
}

export interface IBrowsingHistory {
  getHistorys(): Promise<HistoryDisplayItem[]>,
  saveHistoryItem(url: string, title: string, channel: string): Promise<IDBValidKey>,
}
