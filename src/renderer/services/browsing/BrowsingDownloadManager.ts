import { downloadDB } from '@/helpers/downloadDB';
import { IBrowsingDownloadManager } from '@/interfaces/IBrowsingDownloadManager';
import { DOWNLOAD_OBJECT_STORE_NAME } from '@/constants';
import BrowsingDownload from './BrowsingDownload';

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
        this.removeItem(item.getId());
        await downloadDB.delete(DOWNLOAD_OBJECT_STORE_NAME, item.getId());
      }
    });
  }

  public saveItems(): void {
    this.downloadList.forEach(async (item) => {
      item.abort();
      if (item.getId() && item.getProgress() && item.getSize()) {
        await downloadDB.put(DOWNLOAD_OBJECT_STORE_NAME, {
          id: item.getId(),
          downloadId: item.getDownloadId(),
          url: item.getUrl(),
          size: item.getSize(),
          progress: item.getProgress(),
          path: item.getPath(),
          name: item.getName(),
        });
      }
    });
  }

  public killItemProcess(id: string): void {
    const item = this.downloadList.get(id);
    if (item) {
      item.killProcess();
    }
  }

  public async removeItemFromDb(id: string): Promise<void> {
    await downloadDB.delete(DOWNLOAD_OBJECT_STORE_NAME, id);
  }
}

export default new BrowsingDownloadManager();
