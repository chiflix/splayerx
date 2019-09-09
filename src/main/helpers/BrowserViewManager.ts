import { BrowserView } from 'electron';
import { remove } from 'lodash';
import { bilibiliVideoPause, bilibiliFindType } from '../../shared/pip/bilibili';

type ChannelData = {
  currentIndex: number,
  lastUpdateTime: number,
  list: BrowserViewHistoryItem[]
}

type BrowserViewHistoryItem = {
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
    if (!this.historyByChannel[channel]) {
      this.historyByChannel[channel] = {
        currentIndex: 0,
        lastUpdateTime: Date.now(),
        list: [],
      };
    }

    // 当前BrowserView更新url
    const index = this.historyByChannel[channel].currentIndex;
    const lastUrl = this.historyByChannel[channel].list.length
      ? this.historyByChannel[channel].list[index].url : args.url;
    if (this.historyByChannel[channel].list.length) {
      this.historyByChannel[channel].list[index].url = args.url;
      if (args.isNewWindow) {
        this.historyByChannel[channel].list[index].view.webContents.loadURL(args.url);
      }
    }

    // 创建上一个view数据
    const page = {
      url: lastUrl,
      view: new BrowserView({
        webPreferences: {
          preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
          nativeWindowOpen: true,
        },
      }),
    };
    // 新建BrowserView Load Url以及禁止视频自动播放
    page.view.webContents.loadURL(page.url);
    if (channel === this.currentChannel) {
      const hasLastPage = this.historyByChannel[channel].list.length;
      if (hasLastPage) {
        page.view.webContents.once('media-started-playing', () => {
          if (lastUrl !== page.url) return;
          if (this.currentChannel.includes('bilibili')) {
            let type = '';
            page.view.webContents
              .executeJavaScript(bilibiliFindType).then((r: (HTMLElement | null)[]) => {
                type = ['bangumi', 'videoStreaming', 'iframeStreaming', 'iframeStreaming', 'video'][r.findIndex(i => i)] || 'others';
                page.view.webContents.executeJavaScript(bilibiliVideoPause(type));
              });
          } else {
            page.view.webContents.executeJavaScript('setTimeout(() => { document.querySelector("video").pause(); }, 100)');
          }
        });
      }
    }

    // 清空后退操作产生的history以及切换频道时暂停视频
    if (this.currentChannel) {
      if (channel !== this.currentChannel) {
        const currentIndex = this.historyByChannel[this.currentChannel].currentIndex;
        const view = this.historyByChannel[this.currentChannel].list[currentIndex].view;
        this.pauseVideo(view);
      } else if (this.history.length) {
        // 清除后退的记录
        remove(this.historyByChannel[this.currentChannel].list,
          (list: BrowserViewHistoryItem) => {
            if (this.history.includes(list)) {
              list.view.destroy();
              return true;
            }
            return false;
          });
        this.history = [];
      }
    }

    // 插入view到当前view的上一个位置
    this.historyByChannel[channel].list.splice(index, 0, page);
    this.historyByChannel[channel].currentIndex = this.historyByChannel[channel].list.length - 1;
    this.historyByChannel[channel].lastUpdateTime = Date.now();
    this.currentChannel = channel;
    return {
      canBack: this.historyByChannel[channel].list.length > 1,
      canForward: false,
      view: page.view,
    };
  }

  // 浏览器后退
  public back(): BrowserViewData {
    const index = this.historyByChannel[this.currentChannel].currentIndex;
    this.history.push(this.historyByChannel[this.currentChannel].list[index]);
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
  public changeChanel(channel: string,
    args: { url: string, isNewWindow?: boolean }): BrowserViewData {
    if (!this.historyByChannel[channel]) {
      return this.create(channel, args);
    }
    this.pauseVideo();
    this.currentChannel = channel;
    this.historyByChannel[channel].lastUpdateTime = Date.now();
    return {
      canBack: this.historyByChannel[channel].currentIndex > 0,
      canForward: this.historyByChannel[channel].currentIndex
        < this.historyByChannel[channel].list.length - 1,
      page: this.historyByChannel[channel].list[this.historyByChannel[channel].currentIndex],
    };
  }

  // 进入画中画
  public enterPip(): { pipBrowser: BrowserView; mainBrowser: BrowserViewData } {
    const currentIndex = this.historyByChannel[this.currentChannel].currentIndex;
    const list = this.historyByChannel[this.currentChannel].list;
    const pipBrowser = list[currentIndex].view;
    const mainBrowser = {
      canBack: currentIndex - 1 > 0,
      canForward: false,
      page: list[currentIndex - 1],
    };
    this.currentPip = {
      pipIndex: currentIndex,
      pipChannel: this.currentChannel,
      pipPage: this.historyByChannel[this.currentChannel].list.splice(currentIndex, 1)[0],
    };
    this.historyByChannel[this.currentChannel].list.splice(currentIndex, 1);
    this.historyByChannel[this.currentChannel].lastUpdateTime = Date.now();
    this.historyByChannel[this.currentChannel].currentIndex = currentIndex - 1;
    return { pipBrowser, mainBrowser };
  }

  // 退出画中画
  public exitPip(): BrowserViewData {
    const { pipIndex, pipChannel } = this.currentPip;
    const list = this.historyByChannel[pipChannel].list;
    this.historyByChannel[pipChannel].list = list
      .filter((page: BrowserViewHistoryItem, index: number) => index < pipIndex);
    const deleteList = list.slice(pipIndex, list.length);
    deleteList.forEach((page: BrowserViewHistoryItem) => {
      page.view.destroy();
    });
    this.historyByChannel[pipChannel].list.push(this.currentPip.pipPage);
    this.historyByChannel[pipChannel].currentIndex = pipIndex;
    this.historyByChannel[pipChannel].lastUpdateTime = Date.now();
    this.currentChannel = pipChannel;
    this.currentPip = {
      pipIndex: -1,
      pipChannel: '',
      pipPage: null,
    };
    return {
      canBack: this.historyByChannel[this.currentChannel].currentIndex > 0,
      canForward: false,
      page: this.historyByChannel[this.currentChannel]
        .list[this.historyByChannel[this.currentChannel].currentIndex],
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
    const currentIndex = this.historyByChannel[this.currentChannel].currentIndex;
    const currentView = view || this.historyByChannel[this.currentChannel].list[currentIndex].view;
    if (currentView.webContents.isCurrentlyAudible()) {
      if (pausedChannel.includes('bilibili')) {
        let type = '';
        currentView.webContents
          .executeJavaScript(bilibiliFindType).then((r: (HTMLElement | null)[]) => {
            type = ['bangumi', 'videoStreaming', 'iframeStreaming', 'iframeStreaming', 'video'][r.findIndex(i => i)] || 'others';
            currentView.webContents.executeJavaScript(bilibiliVideoPause(type));
          });
      } else {
        currentView.webContents.executeJavaScript('setTimeout(() => { document.querySelector("video").pause(); }, 100)');
      }
    }
  }

  // 关闭画中画窗口
  public pipClose(): void {
    if (this.currentPip.pipPage) this.currentPip.pipPage.view.destroy();
    this.currentPip.pipIndex = -1;
    this.currentPip.pipChannel = '';
    this.currentPip.pipPage = null;
  }

  private jump(left: boolean): BrowserViewData {
    this.pauseVideo();
    const channel: ChannelData = this.historyByChannel[this.currentChannel];
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
    return result;
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
  changeChanel(channel: string, args: { url: string, isNewWindow?: boolean }): BrowserViewData
  enterPip(): { pipBrowser: BrowserView, mainBrowser: BrowserViewData }
  exitPip(): BrowserViewData
  changePip(channel: string): { pipBrowser: BrowserView, mainBrowser: BrowserViewData }
  pipClose(): void
  pauseVideo(view?: BrowserView, currentChannel?: string): void
}
