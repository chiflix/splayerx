import { BrowserView } from 'electron';

type BrowserViewHistoryItem = {
  lastUpdateTime: number,
  url: string,
  view: BrowserView,
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

  // 将只允许缓存一个页面的频道更新到单页缓存列表中
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
  }

  // 将允许多页缓存的频道更新到多页缓存的列表中
  public addChannelToMulti(channel: string, info: BrowserViewHistoryItem, pageNum?: number): void {
    pageNum = pageNum || 2; // 默认每个channel最多缓存2个page
    const multiPageHistory = this.multiPageHistory.get(channel) as BrowserMultiCache;

    // 如果该频道存在于单页缓存则将其移除
    if (this.singlePageHistory.has(channel)) this.singlePageHistory.delete(channel);
    if (this.multiPageHistory.has(channel)) {
      // 该channel缓存页数量是否超过最大数量
      if (multiPageHistory.pages.length < pageNum) {
        multiPageHistory.pages.push(info);
      } else {
        const destroyItem = multiPageHistory.pages.pop();
        (destroyItem as BrowserViewHistoryItem).view.destroy();
        multiPageHistory.pages.push(info);
      }
      multiPageHistory.lastUpdateTime = Date.now();
    } else if (this.multiPageHistory.size >= this.multiMaxNum) { // 当前允许多页缓存的频道超过最大可缓存的限制
      const key = this.multiPageHistory.keys().next().value;
      const pages = (this.multiPageHistory.get(key) as BrowserMultiCache).pages;
      // 若当前单页缓存超过上限，清空最早产生的单页缓存
      if (this.singlePageHistory.size >= this.singleMaxNum) {
        const lastSingleKey = this.singlePageHistory.keys().next().value;
        (this.singlePageHistory.get(lastSingleKey) as BrowserSingleCache).page.view.destroy();
        this.singlePageHistory.delete(lastSingleKey);
      }
      // 将多页缓存中最早记录的频道降为单页缓存
      pages.forEach((page: BrowserViewHistoryItem, index: number) => {
        if (index === 0) {
          this.addChannelToSingle(key, page);
        } else {
          page.view.destroy();
        }
      });
      this.multiPageHistory.delete(key);
      // 记录最新频道的多页缓存
      this.multiPageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        pages: [info],
      });
    } else { // 当前未超过多页缓存频道数量的限制，直接存入map
      this.multiPageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        pages: [info],
      });
    }

    (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
      .sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
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
      }
    }
  }

  // TODO 清空所有缓存(需要清空url和BrowserView)
  public clearAllCache(): void {
    this.singlePageHistory.clear();
    this.multiPageHistory.clear();
  }

  // 由于后退产生的历史记录在被清空的时候同时也需要清空缓存
  public clearBackPagesCache(channel: string, items: BrowserViewHistoryItem[]): void {
    if (this.multiPageHistory.has(channel)) {
      (this.multiPageHistory.get(channel) as BrowserMultiCache)
        .pages = (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
          .filter((page: BrowserViewHistoryItem) => !items.includes(page));
    }
  }

  // 进入画中画时将画中画页面移除缓存
  public removeCacheWhenEnterPip(channel: string, mainPage: BrowserViewHistoryItem,
    deletePages: BrowserViewHistoryItem[]): void {
    if (this.singlePageHistory.has(channel)) {
      this.singlePageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        page: mainPage,
      });
    } else {
      (this.multiPageHistory.get(channel) as BrowserMultiCache)
        .pages = (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
          .filter((page: BrowserViewHistoryItem) => !deletePages.includes(page));
    }
  }

  // 退出画中画时恢复画中画页面的缓存
  public recoverCacheWhenExitPip(channel: string,
    mainPage: BrowserViewHistoryItem, deletePages: BrowserViewHistoryItem[]): void {
    if (this.singlePageHistory.has(channel)) {
      (this.singlePageHistory.get(channel) as BrowserSingleCache).page.view.destroy();
      this.singlePageHistory.set(channel, {
        lastUpdateTime: Date.now(),
        page: mainPage,
      });
    } else {
      (this.multiPageHistory.get(channel) as BrowserMultiCache)
        .pages = (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
          .filter((page: BrowserViewHistoryItem) => !deletePages.includes(page));
      this.addChannelToMulti(channel, mainPage);
    }
  }

  public clearCacheByChannel(channel: string): void {
    if (this.singlePageHistory.has(channel)) {
      (this.singlePageHistory.get(channel) as BrowserSingleCache).page.view.destroy();
      this.singlePageHistory.delete(channel);
    } else if (this.multiPageHistory.has(channel)) {
      (this.multiPageHistory.get(channel) as BrowserMultiCache).pages
        .forEach((page: BrowserViewHistoryItem) => {
          page.view.destroy();
        });
      this.multiPageHistory.delete(channel);
    }
  }
}

interface IBrowserViewCacheManager {
  addChannelToSingle(channel: string, info: BrowserViewHistoryItem): void,
  addChannelToMulti(channel: string, info: BrowserViewHistoryItem, pageNum?: number): void,
  changeCacheUrl(
    oldChannel: string,
    newChannel: string,
    oldPage: BrowserViewHistoryItem,
    newPage: BrowserViewHistoryItem,
    isMulti: boolean,
  ): void,
  clearAllCache(): void,
  clearBackPagesCache(channel: string, items: BrowserViewHistoryItem[]): void,
  removeCacheWhenEnterPip(
    channel: string,
    mainPage: BrowserViewHistoryItem,
    deletePages: BrowserViewHistoryItem[],
  ): void,
  recoverCacheWhenExitPip(channel: string,
    mainPage: BrowserViewHistoryItem, deletePages: BrowserViewHistoryItem[]): void,
  clearCacheByChannel(channel: string): void,
}

export default BrowserViewCacheManager;
