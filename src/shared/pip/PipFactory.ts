import Bilibili from './Bilibili';
import Youtube from './Youtube';
import Iqiyi from './Iqiyi';
import Douyu from './Douyu';
import Others from './Others';

type pipMode = {
  adapter: string,
  watcher: string,
  recover: string,
}

export default class PipFactory {
  public static getPipByChannel(info: { channel: string }): pipMode

  public static getPipByChannel(info: { channel: string, type: string,
    barrageState: boolean, winSize: number[] }): pipMode

  public static getPipByChannel(info: { channel: string,
    barrageState: boolean, winSize: number[] }): pipMode

  public static getPipByChannel(info: { channel: string, winSize: number[] }): pipMode

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
      case 'others':
        return new Others(info.winSize as number[]);
      default:
        return new Others(info.winSize as number[]);
    }
  }
}
