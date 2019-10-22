export type historyItem = {
  url: string,
}

export interface IBrowsingHistory {
  getHistorys(): historyItem[],
}
