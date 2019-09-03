import { BrowserView } from 'electron';
import { remove } from 'lodash';
import { bilibiliVideoPause, bilibiliFindType } from '../../shared/pip/bilibili';

type ChannelData = {
  currentIndex: number,
  lastUpdateTime: number,
  list: BrowserViewHistory[]
}

type BrowserViewHistory = {
  url: string,
  view: BrowserView
}

export class BrowserViewManager implements IBrowserViewManager {
  private history: Map<string, ChannelData>;

  private currentChannel: string;

  private currentPip: {
    pipIndex: number,
    pipChannel: string,
    pipPage: BrowserViewHistory | null,
  };

  private backPage: BrowserViewHistory[];

  public constructor() {
    this.history = new Map();
    this.currentPip = {
      pipIndex: -1,
      pipChannel: '',
      pipPage: null,
    };
    this.backPage = [];
  }

  public create(channel: string, args: { url: string, isNewWindow?: boolean }): BrowserViewData {
    // 初始化频道数据
    if (!this.history[channel]) {
      this.history[channel] = {
        currentIndex: 0,
        lastUpdateTime: Date.now(),
        list: [],
      };
    }

    // load URL
    const index = this.history[channel].currentIndex;
    const lastUrl = this.history[channel].list.length
      ? this.history[channel].list[index].url : args.url;
    if (this.history[channel].list.length) {
      this.history[channel].list[index].url = args.url;
      if (args.isNewWindow) this.history[channel].list[index].view.webContents.loadURL(args.url);
    }

    // 创建上一个view数据
    const page = {
      url: lastUrl,
      view: new BrowserView({
        webPreferences: {
          preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
        },
      }),
    };
    // loadURL
    page.view.webContents.loadURL(page.url).then(() => {
      if (channel === this.currentChannel) {
        page.view.webContents.executeJavaScript('var iframe = document.querySelector("iframe");if (iframe && iframe.contentDocument) {document.getElementsByTagName("video").length + iframe.contentDocument.getElementsByTagName("video").length} else {document.getElementsByTagName("video").length}').then((r: number) => {
          const hasLastPage = this.history[channel].list.length;
          if (hasLastPage && r) {
            page.view.webContents.once('media-started-playing', () => {
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
        });
      }
    });

    // 暂停当前视频
    if (this.currentChannel) {
      if (channel !== this.currentChannel) {
        const currentIndex = this.history[this.currentChannel].currentIndex;
        const view = this.history[this.currentChannel].list[currentIndex].view;
        this.pauseVideo(view);
      } else {
        // 清除后退的记录
        if (this.backPage.length) {
          remove(this.history[this.currentChannel].list,
            (list: BrowserViewHistory) => {
              if (this.backPage.includes(list)) {
                list.view.destroy();
                return true;
              }
              return false;
            });
          this.backPage = [];
        }
      }
    }

    // 插入view到当前view的上一个位置
    this.history[channel].list.splice(index, 0, page);
    this.history[channel].currentIndex = this.history[channel].list.length - 1;
    this.history[channel].lastUpdateTime = Date.now();
    this.currentChannel = channel;
    return {
      canBack: this.history[channel].list.length > 1,
      canForward: false,
      view: page.view,
    };
  }

  public back(): BrowserViewData {
    const index = this.history[this.currentChannel].currentIndex;
    this.backPage.push(this.history[this.currentChannel].list[index]);
    return this.jump(true);
  }

  public forward(): BrowserViewData {
    if (this.backPage.length) {
      this.backPage.pop();
    }
    return this.jump(false);
  }

  public changeChanel(channel: string,
    args: { url: string, isNewWindow?: boolean }): BrowserViewData {
    if (!this.history[channel]) {
      return this.create(channel, args);
    }
    this.pauseVideo();
    this.currentChannel = channel;
    this.history[channel].lastUpdateTime = Date.now();
    return {
      canBack: this.history[channel].currentIndex > 0,
      canForward: this.history[channel].currentIndex < this.history[channel].list.length - 1,
      page: this.history[channel].list[this.history[channel].currentIndex],
    };
  }

  public enterPip(): { pipBrowser: BrowserView; mainBrowser: BrowserViewData } {
    const currentIndex = this.history[this.currentChannel].currentIndex;
    const list = this.history[this.currentChannel].list;
    const pipBrowser = list[currentIndex].view;
    this.currentPip = {
      pipIndex: currentIndex,
      pipChannel: this.currentChannel,
      pipPage: this.history[this.currentChannel].list.splice(currentIndex, 1)[0],
    };
    this.history[this.currentChannel].list.splice(currentIndex, 1);
    this.history[this.currentChannel].lastUpdateTime = Date.now();
    this.history[this.currentChannel].currentIndex = currentIndex - 1;
    const mainBrowser = {
      canBack: currentIndex - 1 > 0,
      canForward: false,
      page: list[currentIndex - 1],
    };
    return { pipBrowser, mainBrowser };
  }

  public exitPip(): BrowserViewData {
    const { pipIndex, pipChannel } = this.currentPip;
    const list = this.history[pipChannel].list;
    this.history[pipChannel].list = list
      .filter((page: BrowserViewHistory, index: number) => index < pipIndex);
    const deleteList = list.slice(pipIndex, list.length);
    deleteList.forEach((page: BrowserViewHistory) => {
      page.view.destroy();
    });
    this.history[pipChannel].list.push(this.currentPip.pipPage);
    this.history[pipChannel].currentIndex = pipIndex;
    this.history[pipChannel].lastUpdateTime = Date.now();
    this.currentChannel = pipChannel;
    this.currentPip = {
      pipIndex: -1,
      pipChannel: '',
      pipPage: null,
    };
    return {
      canBack: this.history[this.currentChannel].currentIndex > 0,
      canForward: false,
      page: this.history[this.currentChannel].list[this.history[this.currentChannel].currentIndex],
    };
  }

  public changePip(channel: string): { pipBrowser: Electron.BrowserView;
    mainBrowser: BrowserViewData } {
    this.currentChannel = channel;
    this.pauseVideo((this.currentPip.pipPage as BrowserViewHistory).view,
      this.currentPip.pipChannel);
    return this.enterPip();
  }

  public pauseVideo(view?: BrowserView, currentChannel?: string): void {
    const pausedChannel = currentChannel || this.currentChannel;
    const currentIndex = this.history[this.currentChannel].currentIndex;
    const currentView = view || this.history[this.currentChannel].list[currentIndex].view;
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

  public pipClose(): void {
    if (this.currentPip.pipPage) this.currentPip.pipPage.view.destroy();
    this.currentPip.pipIndex = -1;
    this.currentPip.pipChannel = '';
    this.currentPip.pipPage = null;
  }

  private jump(left: boolean): BrowserViewData {
    this.pauseVideo();
    const channel: ChannelData = this.history[this.currentChannel];
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
  page?: BrowserViewHistory
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
