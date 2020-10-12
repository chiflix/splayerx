import BrowsingDownload from '@/services/Browsing/BrowsingDownload';

export interface IBrowsingDownloadManager {
  addItem(id: string, item: BrowsingDownload): void,
  removeItem(id: string): void,
  getAllItems(): Map<string, BrowsingDownload>,
  pauseItem(id: string): void,
  resumeItem(id: string): void,
  continueItem(id: string, selectedIndex: string,
    name: string, path: string, progress: number): void,
  abortItem(id: string): void,
  pauseAllItems(): void,
  resumeAllItems(): void,
  abortAllItems(ids: string[]): void,
  saveItems(): void,
  killItemProcess(id: string): void,
  removeItemFromDb(id: string): void,
}
