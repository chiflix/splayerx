import BrowsingDownload from './BrowsingDownload';
import { downloadDB } from '@/helpers/downloadDB';
import { IBrowsingDownloadManager } from '@/interfaces/IBrowsingDownloadManager';
import { DOWNLOAD_OBJECT_STORE_NAME } from '@/constants';

class BrowsingDownloadManager implements IBrowsingDownloadManager {
  private downloadList: Map<string, BrowsingDownload>;

  public constructor() {
    this.downloadList = new Map();
  }

  public addItem(id: string, item: BrowsingDownload): void {
    this.downloadList.set(id, item);
  }

  public removeItem(id: string): void {
    this.downloadList.delete(id);
  }

  public getAllItems(): Map<string, BrowsingDownload> {
    return this.downloadList;
  }

  public pauseItem(id: string): void {
    if (this.downloadList.has(id)) {
      (this.downloadList.get(id) as BrowsingDownload).pause();
    }
  }

  public resumeItem(id: string): void {
    if (this.downloadList.has(id)) {
      (this.downloadList.get(id) as BrowsingDownload).resume();
    }
  }

  public continueItem(id: string, selectedIndex: string,
    name: string, path: string, progress: number): void {
    if (this.downloadList.has(id)) {
      (this.downloadList.get(id) as BrowsingDownload)
        .continueDownload(selectedIndex, name, path, progress);
    }
  }

  public async abortItem(id: string): Promise<void> {
    if (this.downloadList.has(id)) {
      (this.downloadList.get(id) as BrowsingDownload).abort();
      this.removeItem(id);
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
        this.removeItem(item.getId());
        await downloadDB.delete(DOWNLOAD_OBJECT_STORE_NAME, item.getId());
      }
    });
  }

  public saveItems(): void {
    this.downloadList.forEach(async (item) => {
      item.abort();
      if (item.getId()) {
        await downloadDB.put(DOWNLOAD_OBJECT_STORE_NAME, {
          id: item.getId(),
          url: item.getUrl(),
          size: item.getSize(),
          progress: item.getProgress(),
          path: item.getPath(),
          name: item.getName(),
        });
      }
    });
  }
}

export default new BrowsingDownloadManager();
