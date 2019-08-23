import { BrowserView } from 'electron';

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

  public constructor() {
    this.history = new Map();
  }

  public create(channel: string, url: string): BrowserViewData {
    // 初始化频道数据
    if (!this.history[channel]) {
      this.history[channel] = {
        currentIndex: 0,
        lastUpdateTime: Date.now(),
        list: [],
      };
    }
    // 创建当前view数据
    const page = {
      url,
      view: new BrowserView({
        webPreferences: {
          preload: `${require('path').resolve(__static, 'pip/preload.js')}`,
        },
      }),
    };
    // loadURL
    page.view.webContents.loadURL(page.url);

    this.history[channel].list.push(page);
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
    return this.jump(true);
  }

  public forward(): BrowserViewData {
    return this.jump(false);
  }

  private jump(left: boolean): BrowserViewData {
    const channel: ChannelData = this.history[this.currentChannel];
    const result: BrowserViewData = {
      canBack: false,
      canForward: false,
      view: undefined,
    };
    if (!channel) return result;
    const { list, currentIndex } = channel;
    const index = left ? currentIndex - 1 : currentIndex + 1;
    if (!list || index < 0) return result;
    if (!list[currentIndex]) return result;
    if (index > 0) result.canBack = true;
    if (index < list.length) result.canForward = true;
    result.view = list[index].view;
    channel.lastUpdateTime = Date.now();
    channel.currentIndex = index;
    return result;
  }
}

export type BrowserViewData = {
  canBack: boolean,
  canForward: boolean,
  view?: BrowserView,
}

export interface IBrowserViewManager {
  create(channel: string, url: string): BrowserViewData
  back(): BrowserViewData
  forward(): BrowserViewData
}
