
export type BeforeQuitMediaItemSaveData = {
  shortCut: string,
  smallShortCut: string,
  lastPlayedTime: number,
  duration: number,
  audioTrackId: number,
}
export type BeforeQuitRecentPlayedSaveData = {
  items: IDBValidKey[],
  lastOpened: number,
  playedIndex: number,
}

export interface IPlayInfoStorable {
  updateMediaItemBy(videoID: string, data: BeforeQuitMediaItemSaveData): Promise<boolean> 
  updateRecentPlayedBy(playListID: string, items: BeforeQuitRecentPlayedSaveData): Promise<boolean> 
  deleteRecentPlayedBy(playListID: string): Promise<boolean> 
}