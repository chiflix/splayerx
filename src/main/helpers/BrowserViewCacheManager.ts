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
    this.singleMaxNum = 3;
    this.multiMaxNum = 3;
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
    // console.log('single', this.singlePageHistory);
  }

  public addChannelToMulti(channel: string, info: BrowserViewHistoryItem, pageNum?: number): void {
    pageNum = pageNum || 3; // 默认每个channel最多缓存3个page

    // 当前允许多页缓存的channel超过最大可缓存的限制
    if (this.multiPageHistory.size >= this.multiMaxNum) {
      const key = this.multiPageHistory.keys().next().value;
      const pages = (this.multiPageHistory.get(key) as BrowserMultiCache).pages;
      // 单页缓存超过上限则清空当前多页缓存所有页面,未超过则转为单页缓存
      if (this.singlePageHistory.size >= this.singleMaxNum) {
        pages.forEach((item: BrowserViewHistoryItem) => {
          item.view.destroy();
        });
      } else {
        pages.forEach((page: BrowserViewHistoryItem, index: number) => {
          if (index === pages.length - 1) {
            this.addChannelToSingle(channel, page);
          } else {
            page.view.destroy();
          }
        });
      }
      this.multiPageHistory.delete(key);
    }

    if (!this.multiPageHistory.has(channel)) {
      this.multiPageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        pages: [info],
      });
    } else {
      if ((this.multiPageHistory.get(channel) as BrowserMultiCache).pages.length < pageNum) {
        (this.multiPageHistory.get(channel) as BrowserMultiCache).pages.push(info);
      } else {
        const destroyItem = (this.multiPageHistory.get(channel) as BrowserMultiCache).pages.pop();
        (destroyItem as BrowserViewHistoryItem).view.destroy();
        (this.multiPageHistory.get(channel) as BrowserMultiCache).pages.push(info);
      }
      (this.multiPageHistory.get(channel) as BrowserMultiCache).lastUpdateTime = Date.now();
    }
    (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
      .sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
    console.log('multi', this.multiPageHistory.get(channel));
  }

  // 更新已缓存的cache
  public changeCacheUrl(oldChannel: string, newChannel: string, oldPage: BrowserViewHistoryItem,
    newPage: BrowserViewHistoryItem): void {
    if (this.singlePageHistory.has(newChannel)) {
      if (oldChannel === newChannel) oldPage.view.destroy();
      this.singlePageHistory.set(newChannel, {
        lastUpdateTime: Date.now(),
        page: newPage,
      });
      // console.log(this.singlePageHistory.get(newChannel));
    } else {
      let isExist = false;
      const pages = (this.multiPageHistory.get(newChannel) as BrowserMultiCache).pages;
      // eslint-disable-next-line array-callback-return
      pages.map((page: BrowserViewHistoryItem) => {
        if (page.url === newPage.url) {
          isExist = true;
          page.lastUpdateTime = Date.now();
        }
      });
      if (!isExist) this.addChannelToMulti(newChannel, newPage);
      (this.multiPageHistory.get(newChannel) as BrowserMultiCache).lastUpdateTime = Date.now();
      (this.multiPageHistory.get(newChannel) as BrowserMultiCache).pages
        .sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
      console.log(this.multiPageHistory.get(newChannel));
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
}

interface IBrowserViewCacheManager {
  addChannelToSingle(channel: string, info: BrowserViewHistoryItem): void
  addChannelToMulti(channel: string, info: BrowserViewHistoryItem, pageNum?: number): void
  changeCacheUrl(
    oldChannel: string,
    newChannel: string,
    oldPage: BrowserViewHistoryItem,
    newPage: BrowserViewHistoryItem,
  ): void
  clearAllCache(): void
  clearBackPagesCache(channel: string, items: BrowserViewHistoryItem[]): void
  removeCacheWhenEnterPip(): void
  recoverCacheWhenExitPip(): void
}

export default new BrowserViewCacheManager();
