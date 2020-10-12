import Bilibili from './Bilibili';
import Youtube from './Youtube';
import Iqiyi from './Iqiyi';
import Douyu from './Douyu';
import Others from './Others';
import Huya from './Huya';
import QQ from './QQ';
import Youku from './Youku';
import Twitch from './Twitch';
import Coursera from './Coursera';
import Ted from './Ted';
import Lynda from './Lynda';
import MasterClass from './MasterClass';
import Sportsqq from './Sportsqq';
import WWDC from './WWDC';
import NetEaseOpen from './NetEaseOpen';
import NetEaseStudy from './NetEaseStudy';
import Imooc from './Imooc';
import Icourse163 from './Icourse163';

type pipMode = {
  adapter: string,
  watcher: string,
  recover: string,
}

export default class PipFactory {
  public static getPipByChannel(info: { channel: string }): pipMode

  public static getPipByChannel(info: { channel: string, type: string }): pipMode

  public static getPipByChannel(info: { channel: string,
    barrageState: boolean, }): pipMode

  public static getPipByChannel(info: { channel: string, type: string,
    barrageState: boolean, winSize: number[], }): pipMode

  public static getPipByChannel(info: { channel: string,
    barrageState: boolean, winSize: number[], }): pipMode

  public static getPipByChannel(info: { channel: string, winSize: number[] }): pipMode

  // eslint-disable-next-line complexity
  public static getPipByChannel(info: { channel: string, type?: string,
    barrageState?: boolean, winSize?: number[], }): pipMode {
    switch (info.channel) {
      case 'bilibili.com':
        return new Bilibili(info.type as string,
          info.barrageState as boolean, info.winSize as number[]);
      case 'youtube.com':
        return new Youtube();
      case 'iqiyi.com':
        return new Iqiyi(info.barrageState as boolean, info.winSize as number[]);
      case 'douyu.com':
        return new Douyu(info.type as string,
          info.barrageState as boolean, info.winSize as number[]);
      case 'huya.com':
        return new Huya(info.type as string,
          info.barrageState as boolean, info.winSize as number[]);
      case 'qq.com':
        return new QQ(info.type as string, info.barrageState as boolean);
      case 'youku.com':
        return new Youku(info.barrageState as boolean);
      case 'twitch.com':
        return new Twitch(info.type as string, info.winSize as number[]);
      case 'coursera.com':
        return new Coursera();
      case 'ted.com':
        return new Ted();
      case 'lynda.com':
        return new Lynda();
      case 'masterclass.com':
        return new MasterClass();
      case 'sportsqq.com':
        return new Sportsqq();
      case 'developerapple.com':
        return new WWDC();
      case 'vipopen163.com':
        return new NetEaseOpen();
      case 'study163.com':
        return new NetEaseStudy();
      case 'imooc.com':
        return new Imooc();
      case 'icourse163.com':
        return new Icourse163();
      case 'others':
        return new Others(info.winSize as number[]);
      default:
        return new Others(info.winSize as number[]);
    }
  }
}
