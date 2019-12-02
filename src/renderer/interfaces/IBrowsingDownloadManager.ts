import BrowsingDownload from '@/services/Browsing/BrowsingDownload';

export interface IBrowsingDownloadManager {
  addDownloadItem(id: string, item: BrowsingDownload): void
  removeDownloadItem(id: string): void
  getAllDownloadItems(): Map<string, BrowsingDownload>
  pauseSelectedItem(id: string): void
  resumeSelectedItem(id: string): void
  continueSelectedItem(id: string, selectedIndex: string,
    name: string, path: string, progress: number): void
  abortSelectedItem(id: string): void
  pauseAllItems(): void
  resumeAllItems(): void
  abortAllItems(ids: string[]): void
  saveInProgressItems(): void
}
