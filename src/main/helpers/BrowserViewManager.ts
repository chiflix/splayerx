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

function createBrowserView(): BrowserView {
  const view = new BrowserView({
    webPreferences: {
      preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
      nativeWindowOpen: true,
      // disableHtmlFullscreenWindowResize: true, // Electron 6 required
    },
  });
  // workaround for Google's cannot login issue
  view.webContents.session.webRequest.onBeforeSendHeaders({
    urls: ['https://accounts.google.com/*'],
  }, (details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:71.0) Gecko/20100101 Firefox/71.0';
    callback({ requestHeaders: details.requestHeaders });
  });
  return view;
}

export class BrowserViewManager implements IBrowserViewManager {
  private historyByChannel: Map<string, ChannelData>;

  private currentChannel: string;

  private multiPagesChannel: string[];

  private singlePageChannel: string[];

  private browserViewCacheManager: BrowserViewCacheManager;

  // 当前画中画BrowserView的info
  private currentPip: {
    pipIndex: number,
    pipChannel: string,
    pipPage: BrowserViewHistoryItem | null,
  };

  // 浏览器中后退操作所记录下来的BrowserView
  private history: BrowserViewHistoryItem[];

  public constructor() {
    this.browserViewCacheManager = new BrowserViewCacheManager();
    this.historyByChannel = new Map();
    this.currentPip = {
      pipIndex: -1,
      pipChannel: '',
      pipPage: null,
    };
    this.history = [];
    this.multiPagesChannel = ['youtube.com', 'iqiyi.com', 'bilibili.com', 'douyu.com', 'huya.com', 'twitch.com', 'coursera.com', 'ted.com', 'lynda.com', 'masterclass.com', 'sportsqq.com', 'developerapple.com', 'vipopen163.com', 'study163.com', 'imooc'];
    this.singlePageChannel = ['qq.com', 'youku.com'];
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
      view: createBrowserView(),
      lastUpdateTime: newHistory.list.length ? newHistory.list[index].lastUpdateTime : Date.now(),
    };
    if (newHistory.list.length) {
      newHistory.list[index].url = args.url;
      newHistory.list[index].lastUpdateTime = Date.now();
      if (!newHistory.list[index].view.isDestroyed()) {
        newHistory.list[index].view.webContents.audioMuted = false;
        newHistory.list[index].view.webContents.removeAllListeners('media-started-playing');
        if (args.isNewWindow) {
          newHistory.list[index].view.webContents.loadURL(args.url);
        }
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
    if (this.currentChannel && currentHistory) {
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
        this.browserViewCacheManager.clearBackPagesCache(channel, deleteItems);
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

  public openHistoryPage(channel: string, url: string): BrowserViewData {
    const newHistory = (this.historyByChannel.get(channel) as ChannelData);
    if (!this.historyByChannel.has(channel)) {
      return this.create(channel, { url });
    }
    const index = newHistory.list.findIndex(i => i.url === url);
    if (index === -1) {
      const page = {
        url,
        view: new BrowserView({
          webPreferences: {
            preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
            nativeWindowOpen: true,
            // disableHtmlFullscreenWindowResize: true, // Electron 6 required
          },
        }),
        lastUpdateTime: Date.now(),
      };
      page.view.webContents.loadURL(url);
      newHistory.list.push(page);
      newHistory.currentIndex = newHistory.list.length - 1;
      newHistory.lastUpdateTime = Date.now();
      this.addCacheByChannel(channel, newHistory.list[newHistory.currentIndex]);
      return {
        canBack: newHistory.list.length > 1,
        canForward: false,
        page,
      };
    }
    const page = newHistory.list[index];
    if (page.view && page.view.isDestroyed()) {
      page.view = createBrowserView();
      page.view.webContents.loadURL(page.url);
    } else {
      page.view.webContents.reload();
    }
    page.view.webContents.audioMuted = false;
    page.view.webContents.removeAllListeners('media-started-playing');
    newHistory.currentIndex = index;
    newHistory.lastUpdateTime = Date.now();
    return {
      canBack: newHistory.currentIndex > 0,
      canForward: newHistory.currentIndex
        < newHistory.list.length - 1,
      page,
    };
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
      page.view = createBrowserView();
      page.view.webContents.loadURL(page.url);
    } else if (this.currentChannel) {
      this.pauseVideo();
    }
    newHistory.lastUpdateTime = Date.now();
    page.view.webContents.audioMuted = false;
    page.view.webContents.removeAllListeners('media-started-playing');
    this.changeCacheUrl(this.currentChannel, channel, page, page);
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
    let mainBrowser;
    if (currentIndex === 0) {
      mainBrowser = {
        canBack: false,
        canForward: false,
        page: {
          url: list[currentIndex].url,
          view: new BrowserView({
            webPreferences: {
              preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
              nativeWindowOpen: true,
            },
          }),
          lastUpdateTime: Date.now(),
        },
      };
      mainBrowser.page.view.webContents.loadURL(mainBrowser.page.url);
    } else {
      mainBrowser = {
        canBack: currentIndex - 1 > 0,
        canForward: false,
        page: list[currentIndex - 1],
      };
    }
    list[currentIndex].lastUpdateTime = Date.now();
    if (mainBrowser.page.view && mainBrowser.page.view.isDestroyed()) {
      mainBrowser.page.view = createBrowserView();
      mainBrowser.page.view.webContents.loadURL(mainBrowser.page.url);
    }
    const deletePages = currentHistory.list.splice(currentIndex, currentHistory.list.length);
    deletePages.forEach((page: BrowserViewHistoryItem, index: number) => {
      if (index !== 0) page.view.destroy();
    });
    this.currentPip = {
      pipIndex: currentIndex,
      pipChannel: this.currentChannel,
      pipPage: deletePages[0],
    };
    if (currentIndex === 0) {
      currentHistory.list.splice(
        currentIndex,
        1,
        { url: mainBrowser.page.url, view: mainBrowser.page.view, lastUpdateTime: Date.now() },
      );
      currentHistory.currentIndex = 0;
    } else {
      currentHistory.list.splice(currentIndex, 1);
      currentHistory.currentIndex = currentIndex - 1;
    }
    currentHistory.lastUpdateTime = Date.now();
    mainBrowser.page.lastUpdateTime = Date.now();
    mainBrowser.page.view.webContents.audioMuted = false;
    mainBrowser.page.view.webContents.removeAllListeners('media-started-playing');
    if (process.platform === 'darwin') {
      mainBrowser.page.view.setBounds({
        x: 76, y: 0, width: 0, height: 0,
      });
    }
    this.browserViewCacheManager.removeCacheWhenEnterPip(this.currentChannel,
      mainBrowser.page, deletePages);
    this.pauseVideo(mainBrowser.page.view, this.currentChannel, true);
    return { pipBrowser, mainBrowser };
  }

  // 退出画中画
  public exitPip(): BrowserViewData {
    this.pauseVideo();
    const { pipIndex, pipChannel } = this.currentPip;
    const pipHistory = (this.historyByChannel.get(pipChannel) as ChannelData);
    const list = pipHistory.list;
    pipHistory.list = list
      .filter((page: BrowserViewHistoryItem, index: number) => index < pipIndex);
    const deleteList = list.slice(pipIndex, list.length);
    deleteList.forEach((page: BrowserViewHistoryItem) => {
      page.view.destroy();
    });
    const page = this.currentPip.pipPage as BrowserViewHistoryItem;
    pipHistory.list.push(page);
    pipHistory.currentIndex = pipIndex;
    pipHistory.lastUpdateTime = Date.now();
    this.currentChannel = pipChannel;
    this.currentPip = {
      pipIndex: -1,
      pipChannel: '',
      pipPage: null,
    };
    page.lastUpdateTime = Date.now();
    if (process.platform === 'darwin') {
      page.view.setBounds({
        x: 76, y: 0, width: 0, height: 0,
      });
    }
    this.browserViewCacheManager.recoverCacheWhenExitPip(pipChannel, page, deleteList);
    return {
      canBack: (this.historyByChannel.get(this.currentChannel) as ChannelData).currentIndex > 0,
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
  public pauseVideo(view?: BrowserView, currentChannel?: string, enterPip?: boolean): void {
    const pausedChannel = currentChannel || this.currentChannel;
    const currentHistory = (this.historyByChannel.get(this.currentChannel) as ChannelData);
    const currentIndex = currentHistory.currentIndex;
    const currentView = view || currentHistory.list[currentIndex].view;
    currentView.webContents.removeAllListeners('media-started-playing');
    if (currentView.webContents.isCurrentlyAudible()) {
      let type = '';
      if (['bilibili.com', 'douyu.com', 'huya.com', 'qq.com'].includes(pausedChannel)) {
        currentView.webContents
          .executeJavaScript(InjectJSManager.pipFindType(pausedChannel))
          .then((r: { barrageState: boolean, type: string }) => {
            type = r.type;
            if (!currentView.webContents.isDestroyed()) {
              currentView.webContents
                .executeJavaScript(InjectJSManager.pauseVideo(pausedChannel, type));
            }
          });
      } else {
        currentView.webContents.executeJavaScript(InjectJSManager.pauseVideo());
      }
    }
    if (!enterPip) {
      currentView.webContents.addListener('media-started-playing', () => {
        currentView.webContents.audioMuted = true;
        let type = '';
        if (['bilibili.com', 'douyu.com', 'huya.com', 'qq.com'].includes(pausedChannel)) {
          currentView.webContents
            .executeJavaScript(InjectJSManager.pipFindType(pausedChannel))
            .then((r: { barrageState: boolean, type: string }) => {
              type = r.type;
              currentView.webContents
                .executeJavaScript(InjectJSManager.pauseVideo(pausedChannel, type));
            });
        } else {
          currentView.webContents.executeJavaScript(InjectJSManager.pauseVideo());
        }
      });
    } else if (currentView.webContents.isLoading()) {
      currentView.webContents.once('media-started-playing', () => {
        currentView.webContents.audioMuted = true;
        let type = '';
        if (['bilibili.com', 'douyu.com', 'huya.com', 'qq.com'].includes(pausedChannel)) {
          currentView.webContents
            .executeJavaScript(InjectJSManager.pipFindType(pausedChannel))
            .then((r: { barrageState: boolean, type: string }) => {
              type = r.type;
              currentView.webContents
                .executeJavaScript(InjectJSManager.pauseVideo(pausedChannel, type));
            });
        } else {
          currentView.webContents.executeJavaScript(InjectJSManager.pauseVideo());
        }
      });
    }
  }

  // 关闭画中画窗口
  public pipClose(): void {
    if (this.currentPip.pipPage) this.currentPip.pipPage.view.destroy();
    this.currentPip.pipIndex = -1;
    this.currentPip.pipChannel = '';
    this.currentPip.pipPage = null;
  }

  public setCurrentChannel(newChannel: string): void {
    this.currentChannel = newChannel;
  }

  public clearAllBrowserViews(isDeepClear?: boolean): void {
    this.currentChannel = '';
    this.currentPip = {
      pipIndex: -1,
      pipChannel: '',
      pipPage: null,
    };
    this.history = [];
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

  public clearBrowserViewsByChannel(channel: string): void {
    this.browserViewCacheManager.clearCacheByChannel(channel);
    this.historyByChannel.delete(channel);
  }

  public clearCustomizedCache(channel: string): void {
    if (!this.singlePageChannel.concat(this.multiPagesChannel).includes(channel)) {
      this.clearBrowserViewsByChannel(channel);
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
      result.page.view = createBrowserView();
      result.page.view.webContents.loadURL(result.page.url);
    }
    result.page.lastUpdateTime = Date.now();
    result.page.view.webContents.audioMuted = false;
    result.page.view.webContents.removeAllListeners('media-started-playing');
    this.changeCacheUrl(this.currentChannel, this.currentChannel, list[currentIndex], result.page);
    if (process.platform === 'darwin') {
      result.page.view.setBounds({
        x: 76, y: 0, width: 0, height: 0,
      });
    }
    return result;
  }

  private addCacheByChannel(channel: string, page: BrowserViewHistoryItem): void {
    switch (true) {
      case this.multiPagesChannel.includes(channel):
        this.browserViewCacheManager.addChannelToMulti(channel, page);
        break;
      case this.singlePageChannel.includes(channel):
        this.browserViewCacheManager.addChannelToSingle(channel, page);
        break;
      default:
        this.browserViewCacheManager.addChannelToSingle(channel, page);
        break;
    }
  }

  private changeCacheUrl(oldChannel: string, newChannel: string,
    oldPage: BrowserViewHistoryItem, newPage: BrowserViewHistoryItem): void {
    const isMulti = this.multiPagesChannel.includes(newChannel);
    this.browserViewCacheManager.changeCacheUrl(
      oldChannel,
      newChannel,
      oldPage,
      newPage,
      isMulti,
    );
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
  pauseVideo(view?: BrowserView, currentChannel?: string, enterPip?: boolean): void
  clearAllBrowserViews(isDeepClear?: boolean): void
  clearBrowserViewsByChannel(channel: string): void
  openHistoryPage(channel: string, url: string): BrowserViewData
  setCurrentChannel(newChannel: string): void
  clearCustomizedCache(channel: string): void
}
