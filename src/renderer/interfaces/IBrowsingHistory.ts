export type HistoryDisplayItem = {
  url: string,
  title: string,
  channel: string,
  openTime: number,
  icon: string | undefined,
}

export type IMenuDisplayInfo = {
  id: string,
  label: string,
  icon?: string,
}

export interface IBrowsingHistory {
  getHistorys(): Promise<HistoryDisplayItem[]>,
  getMenuDisplayInfo(): Promise<IMenuDisplayInfo[]>,
  saveHistoryItem(url: string, title: string, channel: string): Promise<IDBValidKey>,
  cleanChannelRecords(channel: string): Promise<void>,
}
