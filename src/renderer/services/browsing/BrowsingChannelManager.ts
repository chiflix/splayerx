import { IBrowsingChannelManager } from '@/interfaces/IBrowsingChannelManager';

type channelInfo = {
  channels: channelDetails[],
  availableChannels: string[],
}

type channelDetails = {
  channel: string,
  url: string,
  icon: string,
  title: string,
  path: string,
}

type category = {
  type: string,
  locale: string,
}

class BrowsingChannelManager implements IBrowsingChannelManager {
  private allChannels: Map<string, channelInfo>;

  private allCategories: category[];

  public constructor() {
    this.allCategories = [{ type: 'customized', locale: '自定义站点' }, { type: 'adapted', locale: '已适配站点' }];
    this.allChannels = new Map();
    this.allCategories.forEach((category: category) => {
      this.allChannels.set(category.type, { channels: [], availableChannels: [] });
    });

    // 初始化默认添加的频道
    const channels = [
      'https://www.bilibili.com/',
      'https://www.iqiyi.com/',
      'https://www.douyu.com/',
      'https://www.huya.com/',
      'https://v.qq.com/',
      'https://www.youku.com/',
      'https://www.twitch.tv/',
      'https://www.youtube.com/',
    ];
    this.allChannels.set('adapted', {
      channels: channels.map((channel: string) => {
        const basename = channel.slice(channel.indexOf('.') + 1, channel.lastIndexOf('.'));
        return {
          channel: `${basename}.com`,
          url: channel,
          icon: `${basename}Sidebar`,
          title: `browsing.${basename}`,
          path: `${basename}.com`,
        };
      }),
      availableChannels: ['iqiyi.com', 'bilibili.com', 'huya.com'],
    });
  }

  public getAllCategories(): category[] {
    return this.allCategories;
  }

  public getAllChannels(): Map<string, channelInfo> {
    return this.allChannels;
  }

  public getChannelInfoByCategory(category: string): channelInfo {
    return this.allChannels.get(category) as channelInfo;
  }

  public setChannelAvailable(category: string, channel: string, available: boolean): void {
    const availableInfo = this.allChannels.get(category) as channelInfo;
    if (available) {
      if (!availableInfo.availableChannels.includes(channel)) {
        availableInfo.availableChannels.push(channel);
      }
    } else {
      availableInfo.availableChannels = availableInfo.availableChannels
        .filter((aChannel: string) => aChannel !== channel);
    }
    this.allChannels.set(category, availableInfo);
  }

  public getAllAvailableChannels(): channelDetails[] {
    const allChannels: channelDetails[] = [];
    const availableChannels: string[] = [];
    this.allCategories.forEach((item: category) => {
      allChannels.push(...this.getChannelInfoByCategory(item.type).channels);
      availableChannels.push(...this.getChannelInfoByCategory(item.type).availableChannels);
    });
    return allChannels.filter((item: channelDetails) => availableChannels.includes(item.channel));
  }
}

export default new BrowsingChannelManager();
