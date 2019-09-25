import { BrowserView } from 'electron';

type BrowserViewHistoryItem = {
  lastUpdateTime: number,
  url: string,
  view: BrowserView
}

type BrowserSingleCache = {
  lastUpdateTime: number,
  page: BrowserViewHistoryItem,
}

type BrowserMultiCache = {
  lastUpdateTime: number,
  pages: BrowserViewHistoryItem[],
}

class BrowserViewCacheManager implements IBrowserViewCacheManager {
  private singlePageHistory: Map<string, BrowserSingleCache>;

  private multiPageHistory: Map<string, BrowserMultiCache>;

  // 单页缓存最大数量
  private singleMaxNum: number;

  // 多页缓存最大数量
  private multiMaxNum: number;

  public constructor() {
    this.singlePageHistory = new Map();
    this.multiPageHistory = new Map();
    this.singleMaxNum = 2;
    this.multiMaxNum = 1;
  }

  public addChannelToSingle(channel: string, info: BrowserViewHistoryItem): void {
    // 当前允许单页缓存的channel超过最大可缓存的限制
    if (this.singlePageHistory.size >= this.singleMaxNum) {
      const key = this.singlePageHistory.keys().next().value;
      (this.singlePageHistory.get(key) as BrowserSingleCache).page.view.destroy();
      this.singlePageHistory.delete(key);
    }

    if (!this.singlePageHistory.has(channel)) {
      this.singlePageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        page: info,
      });
    } else {
      // 销毁上一个view
      info.view.destroy();
    }
    console.log('single', channel, this.singlePageHistory.get(channel));
  }

  public addChannelToMulti(channel: string, info: BrowserViewHistoryItem, pageNum?: number): void {
    pageNum = pageNum || 2; // 默认每个channel最多缓存2个page

    if (this.singlePageHistory.has(channel)) this.singlePageHistory.delete(channel);
    if (this.multiPageHistory.has(channel)) {
      // 该channel缓存页数量是否超过最大数量
      if ((this.multiPageHistory.get(channel) as BrowserMultiCache).pages.length < pageNum) {
        (this.multiPageHistory.get(channel) as BrowserMultiCache).pages.push(info);
      } else {
        const destroyItem = (this.multiPageHistory.get(channel) as BrowserMultiCache).pages.pop();
        (destroyItem as BrowserViewHistoryItem).view.destroy();
        (this.multiPageHistory.get(channel) as BrowserMultiCache).pages.push(info);
      }
      (this.multiPageHistory.get(channel) as BrowserMultiCache).lastUpdateTime = Date.now();
    } else if (this.multiPageHistory.size >= this.multiMaxNum) { // 当前允许多页缓存的channel超过最大可缓存的限制
      const key = this.multiPageHistory.keys().next().value;
      const pages = (this.multiPageHistory.get(key) as BrowserMultiCache).pages;
      // 单页缓存超过上限，清空最早产生的单页缓存，将当前多页缓存降为单页缓存
      if (this.singlePageHistory.size >= this.singleMaxNum) {
        const lastSingleKey = this.singlePageHistory.keys().next().value;
        (this.singlePageHistory.get(lastSingleKey) as BrowserSingleCache).page.view.destroy();
        this.singlePageHistory.delete(lastSingleKey);
      }
      pages.forEach((page: BrowserViewHistoryItem, index: number) => {
        if (index === 0) {
          this.addChannelToSingle(key, page);
        } else {
          page.view.destroy();
        }
      });
      this.multiPageHistory.delete(key);
      this.multiPageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        pages: [info],
      });
    } else {
      this.multiPageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        pages: [info],
      });
    }

    (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
      .sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
    console.log('multi', channel, this.multiPageHistory.get(channel));
  }

  // 更新已缓存的cache
  public changeCacheUrl(oldChannel: string, newChannel: string, oldPage: BrowserViewHistoryItem,
    newPage: BrowserViewHistoryItem, isMulti: boolean): void {
    if (this.singlePageHistory.has(newChannel)) {
      if (isMulti) {
        this.addChannelToMulti(newChannel, newPage);
      } else {
        if (oldChannel === newChannel) oldPage.view.destroy();
        this.singlePageHistory.set(newChannel, {
          lastUpdateTime: Date.now(),
          page: newPage,
        });
        console.log('single', newChannel, this.singlePageHistory.get(newChannel));
      }
    } else {
      let isExist = false;
      if (this.multiPageHistory.get(newChannel)) {
        const pages = (this.multiPageHistory.get(newChannel) as BrowserMultiCache).pages;
        // eslint-disable-next-line array-callback-return
        pages.map((page: BrowserViewHistoryItem) => {
          if (page.url === newPage.url) {
            isExist = true;
            page.lastUpdateTime = Date.now();
          }
        });
      }
      if (!isExist) {
        this.addChannelToMulti(newChannel, newPage);
      } else {
        (this.multiPageHistory.get(newChannel) as BrowserMultiCache).lastUpdateTime = Date.now();
        (this.multiPageHistory.get(newChannel) as BrowserMultiCache).pages
          .sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
        console.log('multi', newChannel, this.multiPageHistory.get(newChannel));
      }
    }
  }

  public clearAllCache(): void {
    this.singlePageHistory.clear();
    this.multiPageHistory.clear();
  }

  public clearBackPagesCache(channel: string, items: BrowserViewHistoryItem[]): void {
    if (this.multiPageHistory.has(channel)) {
      (this.multiPageHistory.get(channel) as BrowserMultiCache)
        .pages = (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
          .filter((page: BrowserViewHistoryItem) => !items.includes(page));
    }
  }

  public removeCacheWhenEnterPip(channel: string, mainPage: BrowserViewHistoryItem,
    pipPage: BrowserViewHistoryItem, deletePages: BrowserViewHistoryItem[]): void {
    if (this.singlePageHistory.has(channel)) {
      this.singlePageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        page: mainPage,
      });
      console.log('single', channel, this.singlePageHistory.get(channel));
    } else {
      (this.multiPageHistory.get(channel) as BrowserMultiCache)
        .pages = (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
          .filter((page: BrowserViewHistoryItem) => !deletePages.includes(page));
      console.log('multi', channel, this.multiPageHistory.get(channel));
    }
  }

  public recoverCacheWhenExitPip(channel: string,
    mainPage: BrowserViewHistoryItem, deletePages: BrowserViewHistoryItem[]): void {
    if (this.singlePageHistory.has(channel)) {
      this.singlePageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        page: mainPage,
      });
      console.log('single', channel, this.singlePageHistory.get(channel));
    } else {
      (this.multiPageHistory.get(channel) as BrowserMultiCache)
        .pages = (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
          .filter((page: BrowserViewHistoryItem) => !deletePages.includes(page));
      this.addChannelToMulti(channel, mainPage);
    }
  }
}

interface IBrowserViewCacheManager {
  addChannelToSingle(channel: string, info: BrowserViewHistoryItem): void
  addChannelToMulti(channel: string, info: BrowserViewHistoryItem, pageNum?: number): void
  changeCacheUrl(
    oldChannel: string,
    newChannel: string,
    oldPage: BrowserViewHistoryItem,
    newPage: BrowserViewHistoryItem,
    isMulti: boolean,
  ): void
  clearAllCache(): void
  clearBackPagesCache(channel: string, items: BrowserViewHistoryItem[]): void
  removeCacheWhenEnterPip(
    channel: string,
    mainPage: BrowserViewHistoryItem,
    pipPage: BrowserViewHistoryItem,
    deletePages: BrowserViewHistoryItem[],
  ): void
  recoverCacheWhenExitPip(channel: string,
    mainPage: BrowserViewHistoryItem, deletePages: BrowserViewHistoryItem[]): void
}

export default new BrowserViewCacheManager();
