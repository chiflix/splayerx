import Bilibili from './Bilibili';
import Youtube from './Youtube';
import Iqiyi from './Iqiyi';
import Others from './Others';

export default class PipFactory {
  public static getPipByChannel(info: { channel: string, type?: string,
    barrageState?: boolean, winSize?: number[] }) {
    switch (info.channel) {
      case 'bilibili':
        return new Bilibili(info.type as string,
          info.barrageState as boolean, info.winSize as number[]);
      case 'youtube':
        return new Youtube();
      case 'iqiyi':
        return new Iqiyi(info.barrageState as boolean, info.winSize as number[]);
      case 'others':
        return new Others(info.winSize as number[]);
      default:
        return new Others(info.winSize as number[]);
    }
  }
}
