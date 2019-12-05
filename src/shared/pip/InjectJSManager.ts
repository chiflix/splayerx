import { bilibiliFindType, bilibiliVideoPause } from './Bilibili';
import PipFactory from './PipFactory';
import { douyuFindType, douyuVideoPause } from './Douyu';
import { huyaFindType, huyaVideoPause } from './Huya';
import { QQFindType, QQVideoPause } from './QQ';
import { twitchFindType } from './Twitch';
import { iqiyiFindType } from './Iqiyi';
import { youkuFindType } from './Youku';

class InjectJSManager implements IInjectJSManager {
  private readonly calcVideoNumCode: string;

  private readonly getVideoStyleCode: string;

  private readonly pauseNormalVideo: string;

  public constructor() {
    this.calcVideoNumCode = 'var iframe = document.querySelector("iframe");'
      + 'if (iframe && iframe.contentDocument) {'
      + 'document.getElementsByTagName("video").length + iframe.contentDocument.getElementsByTagName("video").length;'
      + '} else {'
      + 'document.getElementsByTagName("video").length;'
      + '}';
    this.getVideoStyleCode = 'getComputedStyle(document.querySelector("video") || document.querySelector("iframe").contentDocument.querySelector("video"))';
    this.pauseNormalVideo = 'var video = document.querySelector("video"); if (video) video.pause();';
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
      case 'bilibili.com':
        return bilibiliFindType;
      case 'douyu.com':
        return douyuFindType;
      case 'huya.com':
        return huyaFindType;
      case 'qq.com':
        return QQFindType;
      case 'twitch.com':
        return twitchFindType;
      case 'iqiyi.com':
        return iqiyiFindType;
      case 'youku.com':
        return youkuFindType;
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

  public pauseVideo(channel?: string, type?: string): string {
    switch (channel) {
      case 'bilibili.com':
        return bilibiliVideoPause(type as string);
      case 'douyu.com':
        return douyuVideoPause(type as string);
      case 'huya.com':
        return huyaVideoPause(type as string);
      case 'qq.com':
        return QQVideoPause(type as string);
      default:
        return this.pauseNormalVideo;
    }
  }

  public updatePipControlState(shouldShow: boolean): string {
    return `document.querySelector(".pip-buttons").style.display = ${shouldShow} ? "flex" : "none";`;
  }

  public updatePipControlTitle(title: string, danmu: string, pin: string): string {
    return `
      document.querySelector(".pip").title = "${title}";
      document.querySelector(".danmu").title = "${danmu}";
      document.querySelector(".pin").title = "${pin}";
    `;
  }

  public updatePipTitlebarToShow(shouldShow: boolean): string {
    return `document.querySelector(".titlebar").style.display = ${shouldShow} ? "flex" : "none";`;
  }

  public updateTitlebarState(className: string, state: boolean): string {
    return `document.querySelector("${className}").style.display = ${state} ? "block" : "none";`;
  }

  public updateFullScreenIcon(isFullScreen: boolean, isMaximized: boolean): string {
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
    return `document.querySelector(".titlebarMax").style.display = ${!isFullScreen} && ${!isMaximized} ? "block" : "none";
      document.querySelector(".titlebarUnMax").style.display = ${!isFullScreen} && ${isMaximized} ? "block" : "none";
      document.querySelector(".titlebarRecover").style.display = ${isFullScreen} ? "block" : "none";`;
  }

  public updateWinMaxIcon(isMaximize: boolean): string {
    return `document.querySelector(".titlebarMax").style.display = ${isMaximize} ? "none" : "block";
      document.querySelector(".titlebarUnMax").style.display = ${isMaximize} ? "block" : "none";
      document.querySelector(".titlebarRecover").style.display = "none";`;
  }

  public updateBarrageState(barrageState: boolean, opacity: number): string {
    return `var danmu = document.querySelector(".danmu");
      danmu.src = ${barrageState} ? "assets/danmu-default-icon.svg" : "assets/noDanmu-default-icon.svg";
      danmu.style.opacity = ${opacity};
      danmu.style.cursor = ${opacity} === 1 ? "cursor" : "default"`;
  }

  public updatePinState(isPin: boolean): string {
    return `var pin = document.querySelector(".pin");
      pin.src = ${isPin} ? "assets/pined-default-icon.svg" : "assets/pin-default-icon.svg";`;
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

  public updateDownloadListTitle(fileName: string, resolution: string, saveTo: string,
    cancel: string, submit: string, premium: string): string {
    return `document.querySelector('.file-name > span').textContent = "${fileName}";
      document.querySelector('.definition > span').textContent = "${resolution}";
      document.querySelector('.save-folder > span').textContent = "${saveTo}";
      document.querySelector('.cancel').textContent = "${cancel}";
      document.querySelector('.download').textContent = "${submit}";
      document.querySelector('.footer > span').innerHTML = "${premium}";`;
  }

  public updateDownloadList(definition: string, name: string, selected: boolean,
    id: string, path: string, ext: string, url: string, isVip: boolean): string {
    return `downloadList.push({ definition: "${definition}", name: '${name}', selected: ${selected}, id: "${id}", path: "${path}", ext: "${ext}", url: "${url}", isVip: ${isVip} });
      document.querySelector('.folder-content').children[0].textContent = "${path}";
      if (${selected}) {
        document.querySelector('.name-content').value = '${name}';
        document.querySelector('.selected-item > span').textContent = "${definition}";
        document.querySelector('.selected-item').setAttribute('selectedId', "${id}");
        document.querySelector('.selected-item').setAttribute('ext', "${ext}");
        document.querySelector('.selected-item').setAttribute('download-url', "${url}");
      }
      var item = document.createElement('div');
      item.classList.add('definition-item');
      item.setAttribute('selectedId', "${id}");
      item.setAttribute('ext', "${ext}");
      item.setAttribute('download-url', "${url}");
      document.querySelector('.definition-content').appendChild(item);
      item.addEventListener('click', () => {
        document.querySelector('.name-content').value = '${name}';
        document.querySelector('.selected-item > span').textContent = "${definition}";
        document.querySelector('.selected-item').setAttribute('selectedId', "${id}");
        document.querySelector('.selected-item').setAttribute('ext', "${ext}");
        document.querySelector('.selected-item').setAttribute('download-url', "${url}");
      });
      var span = document.createElement('span');
      span.textContent = "${definition}";
      item.append(span);
      document.querySelector('.footer').style.display = ${isVip} ? 'none' : '';
      if (parseInt("${definition}", 10) > 480) {
        item.style.pointerEvents = ${isVip} ? 'auto' : 'none';
        item.children[0].style.opacity = ${isVip} ? '1' : '0.4';
        var vip = document.createElement('img');
        vip.src = ${isVip} ? 'assets/vipDownloadAvailable-default-icon.svg' : 'assets/vipDownload-default-icon.svg';
        vip.classList.add('vip');
        item.appendChild(vip);
      }`;
  }

  public updateIsVip(isVip: boolean, btnName: string): string {
    return `document.querySelector('.footer').style.display = ${isVip} ? 'none' : '';
    if (${!isVip}) {
      const currentDefinition = document.querySelector('.selected-item > span').textContent;
      if (parseInt(currentDefinition, 10) > 480) {
        let index = downloadList.findIndex(i => parseInt(i.definition, 10) > 480);
        index = index === -1 ? 0 : index - 1;
        document.querySelector('.name-content').value = downloadList[index].name;
        document.querySelector('.selected-item > span').textContent = downloadList[index].definition;
        document.querySelector('.selected-item').setAttribute('selectedId', downloadList[index].id);
        document.querySelector('.selected-item').setAttribute('ext', downloadList[index].ext);
        document.querySelector('.selected-item').setAttribute('download-url', downloadList[index].url);
      }
    } else {
       document.querySelector(".download").textContent = "${btnName}";
       document.querySelector('.download').style.opacity = '1';
       document.querySelector('.download').style.pointerEvents = 'auto';
    }
    document.querySelectorAll('.definition-item').forEach(item => {
      if (parseInt(item.children[0].textContent, 10) > 480) {
        item.style.pointerEvents = ${isVip} ? 'auto' : 'none';
        item.children[0].style.opacity = ${isVip} ? '1' : '0.4';
        const vip = item.querySelector('img');
        if (vip) vip.src = ${isVip} ? 'assets/vipDownloadAvailable-default-icon.svg' : 'assets/vipDownload-default-icon.svg';
      }
    });`;
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
  updateFullScreenIcon(isFullScreen: boolean, isMaximized: boolean): string
  updateWinMaxIcon(isMaximize: boolean): string
  updateBarrageState(barrageState: boolean, opacity: number): string
  emitKeydownEvent(keyCode: number): string
  changeFullScreen(enterFullScreen: boolean): string
  updatePinState(isPin: boolean): string
  updateDownloadListTitle(fileName: string, resolution: string, saveTo: string,
    cancel: string, submit: string, premium: string): string
  updateDownloadList(definition: string, name: string, selected: boolean,
    id: string, path: string, ext: string, url: string, isVip: boolean): string
  updateIsVip(isVip: boolean, btnName: string): string
}

export default new InjectJSManager();
