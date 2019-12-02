import BrowsingDownload from './BrowsingDownload';
import { downloadDB } from '@/helpers/downloadDB';
import { IBrowsingDownloadManager } from '@/interfaces/IBrowsingDownloadManager';
import { DOWNLOAD_OBJECT_STORE_NAME } from '@/constants';

class BrowsingDownloadManager implements IBrowsingDownloadManager {
  private downloadList: Map<string, BrowsingDownload>;

  public constructor() {
    this.downloadList = new Map();
  }

  public addDownloadItem(id: string, item: BrowsingDownload): void {
    this.downloadList.set(id, item);
  }

  public removeDownloadItem(id: string): void {
    this.downloadList.delete(id);
  }

  public getAllDownloadItems(): Map<string, BrowsingDownload> {
    return this.downloadList;
  }

  public pauseSelectedItem(id: string): void {
    if (this.downloadList.has(id)) {
      (this.downloadList.get(id) as BrowsingDownload).pause();
    }
  }

  public resumeSelectedItem(id: string): void {
    if (this.downloadList.has(id)) {
      (this.downloadList.get(id) as BrowsingDownload).resume();
    }
  }

  public continueSelectedItem(id: string, selectedIndex: string,
    name: string, path: string, progress: number): void {
    if (this.downloadList.has(id)) {
      (this.downloadList.get(id) as BrowsingDownload)
        .continueDownload(selectedIndex, name, path, progress);
    }
  }

  public async abortSelectedItem(id: string): Promise<void> {
    if (this.downloadList.has(id)) {
      (this.downloadList.get(id) as BrowsingDownload).abort();
      this.removeDownloadItem(id);
      await downloadDB.delete(DOWNLOAD_OBJECT_STORE_NAME, id);
    }
  }

  public pauseAllItems(): void {
    this.downloadList.forEach((item: BrowsingDownload) => {
      item.pause();
    });
  }

  public resumeAllItems(): void {
    this.downloadList.forEach((item: BrowsingDownload) => {
      item.resume();
    });
  }

  public abortAllItems(ids: string[]): void {
    this.downloadList.forEach(async (item: BrowsingDownload) => {
      if (ids.includes(item.getId())) {
        item.abort();
        this.removeDownloadItem(item.getId());
        await downloadDB.delete(DOWNLOAD_OBJECT_STORE_NAME, item.getId());
      }
    });
  }

  public saveInProgressItems(): void {
    this.downloadList.forEach(async (item) => {
      item.abort();
      await downloadDB.put(DOWNLOAD_OBJECT_STORE_NAME, {
        id: item.getId(),
        url: item.getUrl(),
        size: item.getSize(),
        progress: item.getProgress(),
        path: item.getPath(),
        name: item.getName(),
      });
    });
  }
}

export default new BrowsingDownloadManager();
