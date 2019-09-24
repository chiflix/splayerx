import { BrowserView } from 'electron';
import { remove } from 'lodash';
import InjectJSManager from '../../shared/pip/InjectJSManager';
import BrowserViewCacheManager from './BrowserViewCacheManager';

type ChannelData = {
  currentIndex: number,
  lastUpdateTime: number,
  list: BrowserViewHistoryItem[]
}

type BrowserViewHistoryItem = {
  lastUpdateTime: number,
  url: string,
  view: BrowserView
}

export class BrowserViewManager implements IBrowserViewManager {
  private historyByChannel: Map<string, ChannelData>;

  private currentChannel: string;

  // 当前画中画BrowserView的info
  private currentPip: {
    pipIndex: number,
    pipChannel: string,
    pipPage: BrowserViewHistoryItem | null,
  };

  // 浏览器中后退操作所记录下来的BrowserView
  private history: BrowserViewHistoryItem[];

  public constructor() {
    this.historyByChannel = new Map();
    this.currentPip = {
      pipIndex: -1,
      pipChannel: '',
      pipPage: null,
    };
    this.history = [];
  }

  public create(channel: string, args: { url: string, isNewWindow?: boolean }): BrowserViewData {
    // 初始化频道数据
    if (!this.historyByChannel.has(channel)) {
      this.historyByChannel.set(channel, {
        currentIndex: 0,
        lastUpdateTime: Date.now(),
        list: [],
      });
    }

    const currentHistory = (this.historyByChannel.get(this.currentChannel)) as ChannelData;
    const newHistory = (this.historyByChannel.get(channel)) as ChannelData;
    // 当前BrowserView更新url
    const index = newHistory.currentIndex;
    const lastUrl = newHistory.list.length ? newHistory.list[index].url : args.url;
    // 创建上一个view数据
    const page = {
      url: lastUrl,
      view: new BrowserView({
        webPreferences: {
          preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
          nativeWindowOpen: true,
          // disableHtmlFullscreenWindowResize: true, // Electron 6 required
        },
      }),
      lastUpdateTime: newHistory.list.length ? newHistory.list[index].lastUpdateTime : Date.now(),
    };
    if (newHistory.list.length) {
      newHistory.list[index].url = args.url;
      newHistory.list[index].view.webContents.setAudioMuted(false);
      newHistory.list[index].lastUpdateTime = Date.now();
      newHistory.list[index].view.webContents.removeAllListeners('media-started-playing');
      if (args.isNewWindow) {
        newHistory.list[index].view.webContents.loadURL(args.url);
      }
    }

    // 新建BrowserView Load Url以及禁止视频自动播放
    page.view.webContents.loadURL(page.url);
    if (channel === this.currentChannel) {
      const hasLastPage = newHistory.list.length;
      if (hasLastPage) {
        this.pauseVideo(page.view);
      }
    }

    // 清空后退操作产生的history以及切换频道时暂停视频
    if (this.currentChannel) {
      if (channel !== this.currentChannel) {
        const currentIndex = currentHistory.currentIndex;
        const view = currentHistory.list[currentIndex].view;
        if (view && !view.isDestroyed()) this.pauseVideo(view);
      } else if (this.history.length) {
        // 清除后退的记录
        const deleteItems = remove(currentHistory.list, (list: BrowserViewHistoryItem) => {
          if (this.history.includes(list)) {
            list.view.destroy();
            return true;
          }
          return false;
        });
        remove(this.history, (list: BrowserViewHistoryItem) => deleteItems.includes(list));
        BrowserViewCacheManager.clearBackPagesCache(channel, deleteItems);
      }
    }

    // 插入view到当前view的上一个位置
    newHistory.list.splice(index, 0, page);
    newHistory.currentIndex = newHistory.list.length - 1;
    newHistory.lastUpdateTime = Date.now();
    this.currentChannel = channel;
    this.addCacheByChannel(channel, newHistory.list[index]);
    return {
      canBack: newHistory.list.length > 1,
      canForward: false,
      view: page.view,
    };
  }

  // 浏览器后退
  public back(): BrowserViewData {
    const currentHistory = (this.historyByChannel.get(this.currentChannel) as ChannelData);
    const index = currentHistory.currentIndex;
    this.history.push(currentHistory.list[index]);
    return this.jump(true);
  }

  // 浏览器前进
  public forward(): BrowserViewData {
    if (this.history.length) {
      this.history.pop();
    }
    return this.jump(false);
  }

  // 浏览器切换频道
  public changeChannel(channel: string,
    args: { url: string, isNewWindow?: boolean }): BrowserViewData {
    const newHistory = (this.historyByChannel.get(channel) as ChannelData);
    if (!this.historyByChannel.has(channel)) {
      return this.create(channel, args);
    }
    const page = newHistory.list[newHistory.currentIndex];
    if (page.view && page.view.isDestroyed()) {
      page.view = new BrowserView({
        webPreferences: {
          preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
          nativeWindowOpen: true,
          // disableHtmlFullscreenWindowResize: true, // Electron 6 required
        },
      });
      page.view.webContents.loadURL(page.url);
    } else {
      this.pauseVideo();
    }
    newHistory.lastUpdateTime = Date.now();
    page.view.webContents.setAudioMuted(false);
    page.view.webContents.removeAllListeners('media-started-playing');
    BrowserViewCacheManager.changeCacheUrl(this.currentChannel, channel, page, page);
    this.currentChannel = channel;
    return {
      canBack: newHistory.currentIndex > 0,
      canForward: newHistory.currentIndex
        < newHistory.list.length - 1,
      page,
    };
  }

  // 进入画中画
  public enterPip(): { pipBrowser: BrowserView; mainBrowser: BrowserViewData } {
    const currentHistory = (this.historyByChannel.get(this.currentChannel) as ChannelData);
    const currentIndex = currentHistory.currentIndex;
    const list = currentHistory.list;
    const pipBrowser = list[currentIndex].view;
    list[currentIndex].lastUpdateTime = Date.now();
    const mainBrowser = {
      canBack: currentIndex - 1 > 0,
      canForward: false,
      page: list[currentIndex - 1],
    };
    if (mainBrowser.page.view && mainBrowser.page.view.isDestroyed()) {
      mainBrowser.page.view = new BrowserView({
        webPreferences: {
          preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
          nativeWindowOpen: true,
          // disableHtmlFullscreenWindowResize: true, // Electron 6 required
        },
      });
      mainBrowser.page.view.webContents.loadURL(mainBrowser.page.url);
    }
    this.currentPip = {
      pipIndex: currentIndex,
      pipChannel: this.currentChannel,
      pipPage: currentHistory.list.splice(currentIndex, 1)[0],
    };
    currentHistory.list.splice(currentIndex, 1);
    currentHistory.lastUpdateTime = Date.now();
    currentHistory.currentIndex = currentIndex - 1;
    mainBrowser.page.lastUpdateTime = Date.now();
    mainBrowser.page.view.webContents.setAudioMuted(false);
    mainBrowser.page.view.webContents.removeAllListeners('media-started-playing');
    return { pipBrowser, mainBrowser };
  }

  // 退出画中画
  public exitPip(): BrowserViewData {
    this.pauseVideo();
    const { pipIndex, pipChannel } = this.currentPip;
    const pipHistory = (this.historyByChannel.get(pipChannel) as ChannelData);
    const currentHistory = (this.historyByChannel.get(this.currentChannel) as ChannelData);
    const list = pipHistory.list;
    pipHistory.list = list
      .filter((page: BrowserViewHistoryItem, index: number) => index < pipIndex);
    const deleteList = list.slice(pipIndex, list.length);
    deleteList.forEach((page: BrowserViewHistoryItem) => {
      page.view.destroy();
    });
    pipHistory.list.push(this.currentPip.pipPage as BrowserViewHistoryItem);
    pipHistory.currentIndex = pipIndex;
    pipHistory.lastUpdateTime = Date.now();
    this.currentChannel = pipChannel;
    this.currentPip = {
      pipIndex: -1,
      pipChannel: '',
      pipPage: null,
    };
    const page = currentHistory.list[currentHistory.currentIndex];
    page.lastUpdateTime = Date.now();
    page.view.setBounds({
      x: 76, y: 0, width: 0, height: 0,
    });
    return {
      canBack: currentHistory.currentIndex > 0,
      canForward: false,
      page,
    };
  }

  // 在画中画模式下切换画中画
  public changePip(channel: string): { pipBrowser: Electron.BrowserView;
    mainBrowser: BrowserViewData } {
    this.currentChannel = channel;
    this.pauseVideo((this.currentPip.pipPage as BrowserViewHistoryItem).view,
      this.currentPip.pipChannel);
    return this.enterPip();
  }

  // 暂停当前BrowserView下的视频
  public pauseVideo(view?: BrowserView, currentChannel?: string): void {
    const pausedChannel = currentChannel || this.currentChannel;
    const currentHistory = (this.historyByChannel.get(this.currentChannel) as ChannelData);
    const currentIndex = currentHistory.currentIndex;
    const currentView = view || currentHistory.list[currentIndex].view;
    if (currentView.webContents.isCurrentlyAudible()) {
      if (pausedChannel.includes('bilibili')) {
        let type = '';
        currentView.webContents
          .executeJavaScript(InjectJSManager.bilibiliFindType())
          .then((r: string) => {
            type = r;
            currentView.webContents.executeJavaScript(InjectJSManager.pauseVideo('bilibili', type));
          });
      } else {
        currentView.webContents.executeJavaScript(InjectJSManager.pauseVideo('normal'));
      }
    }
    currentView.webContents.addListener('media-started-playing', () => {
      currentView.webContents.setAudioMuted(true);
      if (pausedChannel.includes('bilibili')) {
        let type = '';
        currentView.webContents
          .executeJavaScript(InjectJSManager.bilibiliFindType())
          .then((r: string) => {
            type = r;
            currentView.webContents.executeJavaScript(InjectJSManager.pauseVideo('bilibili', type));
          });
      } else {
        currentView.webContents.executeJavaScript(InjectJSManager.pauseVideo('normal'));
      }
    });
  }

  // 关闭画中画窗口
  public pipClose(): void {
    if (this.currentPip.pipPage) this.currentPip.pipPage.view.destroy();
    this.currentPip.pipIndex = -1;
    this.currentPip.pipChannel = '';
    this.currentPip.pipPage = null;
  }

  public clearAllBrowserViews(isDeepClear?: boolean): void {
    isDeepClear = isDeepClear || false;
    this.historyByChannel.forEach((history) => {
      history.lastUpdateTime = Date.now();
      history.list.forEach((item: BrowserViewHistoryItem) => {
        item.view.destroy();
      });
    });
    if (isDeepClear) {
      this.historyByChannel.clear();
    }
  }

  private jump(left: boolean): BrowserViewData {
    this.pauseVideo();
    const channel: ChannelData = this.historyByChannel.get(this.currentChannel) as ChannelData;
    const result: BrowserViewData = {
      canBack: false,
      canForward: false,
      page: undefined,
    };
    if (!channel) return result;
    const { list, currentIndex } = channel;
    const index = left ? currentIndex - 1 : currentIndex + 1;
    if (!list || index < 0) return result;
    if (!list[currentIndex]) return result;
    if (index > 0) result.canBack = true;
    if (index < list.length - 1) result.canForward = true;
    result.page = list[index];
    channel.lastUpdateTime = Date.now();
    channel.currentIndex = index;
    if (result.page.view && result.page.view.isDestroyed()) {
      result.page.view = new BrowserView({
        webPreferences: {
          preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
          nativeWindowOpen: true,
          // disableHtmlFullscreenWindowResize: true, // Electron 6 required
        },
      });
      result.page.view.webContents.loadURL(result.page.url);
    }
    result.page.lastUpdateTime = Date.now();
    result.page.view.webContents.setAudioMuted(false);
    result.page.view.webContents.removeAllListeners('media-started-playing');
    BrowserViewCacheManager.changeCacheUrl(
      this.currentChannel, this.currentChannel, list[currentIndex], result.page);
    return result;
  }

  private addCacheByChannel(channel: string, page: BrowserViewHistoryItem): void {
    switch (channel) {
      case 'youtube.com':
      case 'iqiyi.com':
        BrowserViewCacheManager.addChannelToMulti(channel, page);
        break;
      case 'bilibili.com':
        BrowserViewCacheManager.addChannelToSingle(channel, page);
        break;
      default:
        BrowserViewCacheManager.addChannelToSingle(channel, page);
        break;
    }
  }
}

export type BrowserViewData = {
  canBack: boolean,
  canForward: boolean,
  page?: BrowserViewHistoryItem
  view?: BrowserView,
}

export interface IBrowserViewManager {
  create(channel: string, args: { url: string, isNewWindow?: boolean }): BrowserViewData
  back(): BrowserViewData
  forward(): BrowserViewData
  changeChannel(channel: string, args: { url: string, isNewWindow?: boolean }): BrowserViewData
  enterPip(): { pipBrowser: BrowserView, mainBrowser: BrowserViewData }
  exitPip(): BrowserViewData
  changePip(channel: string): { pipBrowser: BrowserView, mainBrowser: BrowserViewData }
  pipClose(): void
  pauseVideo(view?: BrowserView, currentChannel?: string): void
  clearAllBrowserViews(isDeepClear?: boolean): void
}
