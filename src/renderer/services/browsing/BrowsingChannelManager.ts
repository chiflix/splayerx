// @ts-ignore
import urlParseLax from 'url-parse-lax';
import {
  IBrowsingChannelManager,
  channelInfo,
  channelDetails,
  category,
} from '@/interfaces/IBrowsingChannelManager';
import { getGeoIP } from '@/libs/apis';
import { calcCurrentChannel } from '../../../shared/utils';

class BrowsingChannelManager implements IBrowsingChannelManager {
  private allChannels: Map<string, channelInfo>;

  private allCategories: category[];

  private allAvailableChannels: string[];

  private generalChannels: string[];

  private educationalChannels: string[];

  public constructor() {
    this.allCategories = [
      { type: 'temporary', locale: 'browsing.temporary' },
      { type: 'customized', locale: 'browsing.customized' },
      { type: 'general', locale: 'browsing.general' },
      { type: 'education', locale: 'browsing.education' },
    ];
    this.allChannels = new Map();
    this.allCategories.forEach((category: category) => {
      this.allChannels.set(category.type, { channels: [], availableChannels: [] });
    });
    this.allAvailableChannels = [];

    this.allChannels.set('temporary', {
      channels: [{
        channel: 'separator',
        url: '',
        icon: '',
        title: 'separator',
        path: '',
        category: 'temporary',
      }],
      availableChannels: ['separator'],
    });
    this.allAvailableChannels.push('separator');

    // 初始化默认添加的频道
    this.generalChannels = [
      'https://www.bilibili.com/',
      'https://www.iqiyi.com/',
      'https://www.douyu.com/',
      'https://www.huya.com/',
      'https://v.qq.com/',
      'https://www.youku.com/',
      'https://www.twitch.tv/',
      'https://www.youtube.com/',
      'https://sports.qq.com/',
    ];
    this.allChannels.set('general', {
      channels: this.generalChannels.map((channel: string) => {
        let basename = '';
        const host = urlParseLax(channel).hostname;
        if (host.includes('sports.qq.com')) {
          basename = 'sportsqq';
        } else {
          basename = channel.slice(channel.indexOf('.') + 1, channel.lastIndexOf('.'));
        }
        const tld = channel.slice(channel.lastIndexOf('.'), channel.length - 1);
        const path = host.includes('www') ? `${basename}${tld}` : host;
        return {
          channel: `${basename}.com`,
          url: channel,
          icon: `${basename}Sidebar`,
          title: `browsing.${basename}`,
          path,
          category: 'general',
        };
      }),
      availableChannels: this.allAvailableChannels,
    });

    this.educationalChannels = [
      'https://www.coursera.org/',
      'https://www.ted.com/',
      'https://www.lynda.com/',
      'https://www.masterclass.com/',
      'https://developer.apple.com/videos/wwdc2019/',
      'https://vip.open.163.com/',
      'https://study.163.com',
      'https://www.imooc.com/',
      'https://www.icourse163.org/',
    ];
    this.allChannels.set('education', {
      channels: this.educationalChannels.map((channel: string) => {
        const host = urlParseLax(channel).hostname;
        const basename = host.includes('www') ? channel.slice(channel.indexOf('.') + 1, channel.lastIndexOf('.')).replace(/\./g, '')
          : host.slice(0, host.lastIndexOf('.')).replace(/\./g, '');
        const tld = channel.slice(channel.lastIndexOf('.'), channel.length - 1);
        const path = host.includes('www') ? `${basename}${tld}` : host;
        return {
          channel: `${basename}.com`,
          url: channel,
          icon: `${basename}Sidebar`,
          title: `browsing.${basename}`,
          path,
          category: 'education',
        };
      }),
      availableChannels: this.allAvailableChannels,
    });

    this.allChannels.set('customized', {
      channels: [{
        channel: 'example.com',
        url: 'example.com',
        title: 'browsing.addSite',
        icon: 'addChannelSidebar',
        path: 'example.com',
        category: 'customized',
      }],
      availableChannels: this.allAvailableChannels,
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

  public async setChannelAvailable(channel: string, available: boolean): Promise<void> {
    if (available) {
      if (!this.allAvailableChannels.includes(channel)) {
        const index = this.getTemporaryChannels().length;
        this.allAvailableChannels.splice(index, 0, channel);
      }
    } else {
      this.allAvailableChannels = this.allAvailableChannels
        .filter((aChannel: string) => aChannel !== channel);
      if (channel.includes('#temporary')) {
        const tmpChannels = this.allChannels.get('temporary');
        (tmpChannels as channelInfo).channels = (tmpChannels as channelInfo).channels
          .filter(i => i.channel !== channel);
        (tmpChannels as channelInfo).availableChannels = (tmpChannels as channelInfo)
          .availableChannels.filter(i => i !== channel);
      }
    }
    this.allChannels.forEach((i: channelInfo) => {
      const allItems = i.channels.map((item: channelDetails) => item.channel);
      const available: string[] = [];
      this.allAvailableChannels.forEach((channel: string) => {
        if (allItems.includes(channel)) available.push(channel);
      });
      i.availableChannels = available;
    });
  }

  public getAllAvailableChannels(): channelDetails[] {
    const allChannels: channelDetails[] = [];
    const result: channelDetails[] = [];
    this.allCategories.forEach((item: category) => {
      this.getChannelInfoByCategory(item.type).channels.forEach((channel) => {
        allChannels.push(Object.assign(channel, { category: item.type }));
      });
    });
    this.allAvailableChannels.forEach((i: string) => {
      result.push(allChannels.filter((item: channelDetails) => item.channel === i)[0]);
    });
    return result;
  }

  public repositionChannels(from: number, to: number): channelDetails[] {
    const item = this.allAvailableChannels.splice(from, 1)[0];
    this.allAvailableChannels.splice(to, 0, item);
    return this.getAllAvailableChannels();
  }

  public initAvailableChannels(channels: channelDetails[]): channelDetails[] {
    this.allAvailableChannels = channels.map((i: channelDetails) => i.channel);
    if (!this.allAvailableChannels.includes('separator')) this.allAvailableChannels.unshift('separator');
    channels.forEach((channel) => {
      if (channel.category === 'customized') {
        (this.allChannels.get('customized') as channelInfo).channels.push(channel);
        this.setChannelAvailable(channel.channel, true);
      } else {
        this.allChannels.forEach((i: channelInfo) => {
          const allItems = i.channels.map((item: channelDetails) => item.channel);
          const available: string[] = [];
          this.allAvailableChannels.forEach((channel: string) => {
            if (allItems.includes(channel)) available.push(channel);
          });
          i.availableChannels = available;
        });
      }
    });
    return this.getAllAvailableChannels();
  }

  public async getDefaultChannelsByCountry(displayLanguage: string): Promise<channelDetails[]> {
    if (process.windowsStore) {
      return [];
    }
    try {
      const geo = await getGeoIP();
      const availableChannels = geo.countryCode === 'CN' ? ['bilibili.com', 'douyu.com', 'iqiyi.com'] : ['youtube.com', 'twitch.com'];
      (this.allChannels.get('general') as channelInfo).availableChannels = availableChannels;
      this.allAvailableChannels.push(...availableChannels);
      return this.getAllAvailableChannels();
    } catch (error) {
      const availableChannels = displayLanguage === 'zh-Hans' ? ['bilibili.com', 'douyu.com', 'iqiyi.com'] : ['youtube.com', 'twitch.com'];
      (this.allChannels.get('general') as channelInfo).availableChannels = availableChannels;
      this.allAvailableChannels = availableChannels;
      return this.getAllAvailableChannels();
    }
  }

  public async addCustomizedChannel(info: channelDetails): Promise<void> {
    if (this.generalChannels.concat(this.educationalChannels).includes(info.url)) { // 已适配站点
      await this.setChannelAvailable(calcCurrentChannel(info.url), true);
    } else {
      const existedChannel = (this.allChannels.get('customized') as channelInfo).channels.find(i => i.channel === info.channel);
      if (existedChannel) {
        if (existedChannel.title === info.title) {
          await this.setChannelAvailable(info.channel, true);
        } else {
          await this.updateCustomizedChannelTitle(info.channel, info.title, info.style as number);
        }
      } else {
        (this.allChannels.get('customized') as channelInfo).channels.push(info);
        await this.setChannelAvailable(info.channel, true);
      }
    }
  }

  public async updateCustomizedChannelTitle(channel: string,
    title: string, style: number): Promise<void> {
    const editChannel = (this.allChannels.get('customized') as channelInfo).channels.find(item => item.channel === channel);
    title = title || 'C';
    const name = title.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u);
    (editChannel as channelDetails).title = title;
    (editChannel as channelDetails).icon = name ? name[0].toUpperCase() : 'C';
    (editChannel as channelDetails).style = style;
    await this.setChannelAvailable(channel, true);
  }

  public async updateCustomizedChannel(oldChannel: string, info: channelDetails): Promise<void> {
    this.allAvailableChannels = this.allAvailableChannels.filter(i => i !== oldChannel);
    (this.allChannels.get('customized') as channelInfo).availableChannels = (this.allChannels.get('customized') as channelInfo).availableChannels.filter(i => i !== oldChannel);
    if (this.generalChannels.concat(this.educationalChannels).includes(info.url)) { // 已适配站点
      await this.setChannelAvailable(calcCurrentChannel(info.url), true);
      (this.allChannels.get('customized') as channelInfo).channels = (this.allChannels.get('customized') as channelInfo).channels.filter(item => item.channel !== oldChannel);
    } else {
      const editChannel = (this.allChannels.get('customized') as channelInfo).channels.find(item => item.channel === oldChannel);
      Object.keys(editChannel as channelDetails).forEach((key) => {
        (editChannel as channelDetails)[key] = info[key];
      });
      await this.setChannelAvailable(info.channel, true);
    }
  }

  public deleteCustomizedByChannel(channel: string): void {
    this.allAvailableChannels = this.allAvailableChannels.filter(i => i !== channel);
    (this.allChannels.get('customized') as channelInfo).availableChannels = (this.allChannels.get('customized') as channelInfo).availableChannels.filter(i => i !== channel);
    (this.allChannels.get('customized') as channelInfo).channels = (this.allChannels.get('customized') as channelInfo).channels.filter(item => item.channel !== channel);
  }

  public updateCustomizedChannelStyle(channel: string, style: number): void {
    const editChannel = (this.allChannels.get('customized') as channelInfo).channels.find(item => item.channel === channel);
    if (editChannel) editChannel.style = style;
  }

  public async addTemporaryChannel(info: channelDetails): Promise<void> {
    if (this.allAvailableChannels.includes(`${info.channel}#temporary`)) { // 已存在的临时站点
      await this.setChannelAvailable(`${info.channel}#temporary`, true);
    } else if (this.allAvailableChannels.includes(info.channel)) { // 已存在的自定义站点
      await this.setChannelAvailable(info.channel, true);
    } else if (this.allAvailableChannels.includes(calcCurrentChannel(info.url))) { // 已存在的其他站点
      await this.setChannelAvailable(calcCurrentChannel(info.url), true);
    } else {
      info.channel = `${info.channel}#temporary`;
      (this.allChannels.get('temporary') as channelInfo).channels.unshift(info);
      (this.allChannels.get('temporary') as channelInfo).availableChannels.unshift(info.channel);
      this.allAvailableChannels.unshift(info.channel);
    }
  }

  public getTemporaryChannels(): channelDetails[] {
    return (this.getAllChannels().get('temporary') as channelInfo).channels;
  }

  public async storeTemporaryChannel(info: channelDetails, to: number): Promise<{ channel: string,
    category: string }> {
    const tmpChannels = this.allChannels.get('temporary');
    (tmpChannels as channelInfo).channels = (tmpChannels as channelInfo).channels
      .filter(i => i.channel !== info.channel);
    (tmpChannels as channelInfo).availableChannels = (tmpChannels as channelInfo).availableChannels
      .filter(i => i !== info.channel);
    this.allAvailableChannels = this.allAvailableChannels.filter(i => i !== info.channel);
    info.channel = info.channel.split('#temporary')[0];
    info.category = 'customized';
    if ((this.allChannels.get('customized') as channelInfo).channels.map(i => i.channel).includes(info.channel)) { // 已存在的自定义站点
      this.allAvailableChannels = this.allAvailableChannels.filter(i => i !== info.channel);
      this.allAvailableChannels.splice(to, 0, info.channel);
      await this.addCustomizedChannel(info);
      this.updateCustomizedChannelStyle(info.channel, info.style as number);
      return { channel: info.channel, category: 'customized' };
    }
    if (this.generalChannels.concat(this.educationalChannels).includes(info.url)) {
      const isGeneral = this.generalChannels.includes(info.url);
      this.allAvailableChannels = this.allAvailableChannels
        .filter(i => i !== calcCurrentChannel(info.url));
      this.allAvailableChannels.splice(to, 0, calcCurrentChannel(info.url));
      await this.setChannelAvailable(calcCurrentChannel(info.url), true);
      return { channel: calcCurrentChannel(info.url), category: isGeneral ? 'general' : 'educational' };
    }
    this.allAvailableChannels.splice(to, 0, info.channel);
    await this.addCustomizedChannel(info);
    return { channel: info.channel, category: 'customized' };
  }
}

export default new BrowsingChannelManager();
