export type HistoryItem = {
  url: string,
  title: string,
  openTime: number,
}

export interface IBrowsingHistory {
  getHistorys(): Promise<HistoryItem[]>,
  saveHistoryItem(url: string, title: string): Promise<IDBValidKey>,
}
