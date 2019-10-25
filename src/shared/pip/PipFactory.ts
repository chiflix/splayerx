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

type pipMode = {
  adapter: string,
  watcher: string,
  recover: string,
}

export default class PipFactory {
  public static getPipByChannel(info: { channel: string }): pipMode

  public static getPipByChannel(info: { channel: string, type: string }): pipMode

  public static getPipByChannel(info: { channel: string,
    barrageState: boolean }): pipMode

  public static getPipByChannel(info: { channel: string, type: string,
    barrageState: boolean, winSize: number[] }): pipMode

  public static getPipByChannel(info: { channel: string,
    barrageState: boolean, winSize: number[] }): pipMode

  public static getPipByChannel(info: { channel: string, winSize: number[] }): pipMode

  // eslint-disable-next-line complexity
  public static getPipByChannel(info: { channel: string, type?: string,
    barrageState?: boolean, winSize?: number[] }): pipMode {
    switch (info.channel) {
      case 'bilibili':
        return new Bilibili(info.type as string,
          info.barrageState as boolean, info.winSize as number[]);
      case 'youtube':
        return new Youtube();
      case 'iqiyi':
        return new Iqiyi(info.barrageState as boolean, info.winSize as number[]);
      case 'douyu':
        return new Douyu(info.type as string,
          info.barrageState as boolean, info.winSize as number[]);
      case 'huya':
        return new Huya(info.type as string,
          info.barrageState as boolean, info.winSize as number[]);
      case 'qq':
        return new QQ(info.type as string, info.barrageState as boolean);
      case 'youku':
        return new Youku(info.barrageState as boolean);
      case 'twitch':
        return new Twitch(info.type as string, info.winSize as number[]);
      case 'coursera':
        return new Coursera();
      case 'ted':
        return new Ted();
      case 'lynda':
        return new Lynda();
      case 'masterclass':
        return new MasterClass();
      case 'sportsqq':
        return new Sportsqq();
      case 'developerapple':
        return new WWDC();
      case 'vipopen163':
        return new NetEaseOpen();
      case 'study163':
        return new NetEaseStudy();
      case 'others':
        return new Others(info.winSize as number[]);
      default:
        return new Others(info.winSize as number[]);
    }
  }
}
