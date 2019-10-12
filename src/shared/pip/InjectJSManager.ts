import { bilibiliFindType, bilibiliVideoPause } from './Bilibili';
import PipFactory from './PipFactory';
import { douyuFindType, douyuVideoPause } from './Douyu';
import { huyaFindType, huyaVideoPause } from './Huya';
import { QQFindType, QQVideoPause } from './QQ';
import { twitchFindType } from './Twitch';
import { iqiyiFindType } from './Iqiyi';

class InjectJSManager implements IInjectJSManager {
  private readonly calcVideoNumCode: string;

  private readonly getVideoStyleCode: string;

  private readonly pauseNormalVideo: string;

  public constructor() {
    this.calcVideoNumCode = 'var iframe = document.querySelector("iframe");'
      + 'if (iframe && iframe.contentDocument) {'
      + 'document.getElementsByTagName("video").length + iframe.contentDocument.getElementsByTagName("video").length'
      + '} else {'
      + 'document.getElementsByTagName("video").length'
      + '}';
    this.getVideoStyleCode = 'getComputedStyle(document.querySelector("video") || document.querySelector("iframe").contentDocument.querySelector("video"))';
    this.pauseNormalVideo = 'document.querySelector("video").pause();';
  }

  public getPipByChannel(info: { channel: string, type?: string,
    barrageState?: boolean, winSize?: number[] }) {
    return PipFactory.getPipByChannel(info);
  }

  public initBarrageIcon(barrageState: boolean) {
    return `document.querySelector(".danmu").src = ${barrageState} ? "assets/danmu-default-icon.svg" : "assets/noDanmu-default-icon.svg"`;
  }

  public pipFindType(channel: string): string {
    switch (channel) {
      case 'bilibili':
        return bilibiliFindType;
      case 'douyu':
        return douyuFindType;
      case 'huya':
        return huyaFindType;
      case 'qq':
        return QQFindType;
      case 'twitch':
        return twitchFindType;
      case 'iqiyi':
        return iqiyiFindType;
      default:
        return '';
    }
  }

  public douyuHideSelfPip(hide: boolean): string {
    return hide ? '.pip-b1390f { display: none; }' : '.pip-b1390f { display: block; }';
  }

  public changeFullScreen(enterFullScreen: boolean): string {
    return enterFullScreen ? 'document.body.requestFullscreen()' : 'document.webkitCancelFullScreen()';
  }

  public pauseVideo(channel: string, type?: string): string {
    switch (channel) {
      case 'bilibili':
        return bilibiliVideoPause(type as string);
      case 'douyu':
        return douyuVideoPause(type as string);
      case 'huya':
        return huyaVideoPause(type as string);
      case 'qq':
        return QQVideoPause(type as string);
      case 'normal':
        return this.pauseNormalVideo;
      default:
        return this.pauseNormalVideo;
    }
  }

  public updatePipControlState(shouldShow: boolean): string {
    return `document.querySelector(".pip-buttons").style.display = ${shouldShow} ? "flex" : "none";`;
  }

  public updatePipControlTitle(title: string, danmu: string): string {
    return `
      document.querySelector(".pip").title = "${title}";
      document.querySelector(".danmu").title = "${danmu}";
    `;
  }

  public updatePipTitlebarToShow(shouldShow: boolean): string {
    return `document.querySelector(".titlebar").style.display = ${shouldShow} ? "flex" : "none";`;
  }

  public updateTitlebarState(className: string, state: boolean): string {
    return `document.querySelector("${className}").style.display = ${state} ? "block" : "none";`;
  }

  public updateFullScreenIcon(isFullScreen: boolean): string {
    if (process.platform === 'darwin') {
      return `document.querySelector(".titlebarMin").style.pointerEvents = ${isFullScreen} ? "none" : "";
        document.querySelector(".titlebarMin").style.opacity = ${isFullScreen} ? "0.25" : "1";
        document.querySelector(".titlebarFull").style.display = ${isFullScreen} ? "none" : "";
        document.querySelector(".titlebarRecover").style.display = ${isFullScreen} ? "block" : "none";
        document.querySelector(".titlebarMin").src = "assets/titleBarExitFull-default-icon.svg"
        document.querySelector(".titlebarFull").src = "assets/titleBarFull-default-icon.svg";
        document.querySelector(".titlebarRecover").src = "assets/titleBarRecover-default-icon.svg";
        document.querySelector(".titlebarClose").src = "assets/titleBarClose-default-icon.svg";`;
    }
    return `document.querySelector(".titlebarMax").style.display = ${isFullScreen} ? "none" : "block";
      document.querySelector(".titlebarUnMax").style.display = "none";
      document.querySelector(".titlebarRecover").style.display = ${isFullScreen} ? "block" : "none";`;
  }

  public updateWinMaxIcon(isMaximize: boolean): string {
    return `document.querySelector(".titlebarMax").style.display = ${isMaximize} ? "none" : "block";
      document.querySelector(".titlebarUnMax").style.display = ${isMaximize} ? "block" : "none";
      document.querySelector(".titlebarRecover").style.display = "none";`;
  }

  public updateBarrageState(barrageState: boolean, opacity: number): string {
    return `const danmu = document.querySelector(".danmu");
      danmu.src = ${barrageState} ? "assets/danmu-default-icon.svg" : "assets/noDanmu-default-icon.svg";
      danmu.style.opacity = ${opacity};
      danmu.style.cursor = ${opacity} === 1 ? "cursor" : "default"`;
  }

  public emitKeydownEvent(keyCode: number) {
    return `var event = new KeyboardEvent("keydown", { keyCode: ${keyCode} });window.dispatchEvent(event)`;
  }

  public calcVideoNum() {
    return this.calcVideoNumCode;
  }

  public getVideoStyle(channel: string) {
    if (channel === 'qq.com') {
      return 'if (!document.querySelector(".poplayer_quickplay").classList.value.includes("none")) {'
        + 'getComputedStyle(document.querySelector(".poplayer_quickplay").getElementsByTagName("video")[0]);'
        + '} else if (document.querySelector(".mod_player")) {'
        + 'var container = document.querySelector(".player_container");'
        + 'var wideMode = container ? container.classList.value.includes("player_container_wide") : null;'
        + 'if (wideMode) { container.classList.remove("player_container_wide");'
        + 'var style = { width: parseFloat(getComputedStyle(document.querySelector(".mod_player").getElementsByTagName("video")[0]).width) - parseFloat(getComputedStyle(document.querySelector(".mod_player_side")).width),'
        + 'height: getComputedStyle(document.querySelector(".mod_player").getElementsByTagName("video")[0]).height,'
        + '};'
        + 'style;'
        + '} else { getComputedStyle(document.querySelector(".mod_player").getElementsByTagName("video")[0]); }'
        + '} else { getComputedStyle(document.querySelector("#_feed_player").getElementsByTagName("video")[0]); }';
    }
    return this.getVideoStyleCode;
  }
}

export interface IInjectJSManager {
  calcVideoNum(): string
  getVideoStyle(channel: string): string
  getPipByChannel(info: { channel: string, type?: string,
    barrageState?: boolean, winSize?: number[] }):
  { adapter: string, watcher: string, recover: string }
  pipFindType(channel: string): string
  douyuHideSelfPip(hide: boolean): string
  pauseVideo(channel: string, type?: string): string
  initBarrageIcon(barrageState: boolean): string
  updatePipControlState(shouldShow: boolean): string
  updatePipTitlebarToShow(shouldShow: boolean): string
  updateTitlebarState(className: string, state: boolean): string
  updateFullScreenIcon(isFullScreen: boolean): string
  updateWinMaxIcon(isMaximize: boolean): string
  updateBarrageState(barrageState: boolean, opacity: number): string
  emitKeydownEvent(keyCode: number): string
  changeFullScreen(enterFullScreen: boolean): string
}

export default new InjectJSManager();
