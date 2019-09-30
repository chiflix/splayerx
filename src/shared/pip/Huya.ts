export function huyaVideoPause(type: string) {
  if (['normal', 'others'].includes(type)) {
    return 'document.querySelector("video").pause();var timer = setInterval(() => { const pause = document.querySelector(".player-pause-btn"); if (pause) { clearInterval(timer);pause.click(); } }, 100);';
  }
  return 'document.querySelector("video").pause();var timer = setInterval(() => { const pause = document.querySelector(".pause-81a5c3"); if (pause) { clearInterval(timer);pause.click(); } }, 100);';
}

export default class Huya {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(type: string, barrageState: boolean, winSize: number[]) {
    if (type === 'normal') {
      this.adapter = `var videoPlayer = document.querySelector("#videoContainer");
        videoPlayer.style.position = "fixed";
        videoPlayer.style.left = 0;
        videoPlayer.style.top = 0;
        videoPlayer.style.zIndex = 99999999;
        videoPlayer.style.height = "calc(100% + 60px)";
        document.querySelector(".duya-header").style.display = "none";
        document.querySelector(".mod-sidebar").style.display = "none";
        document.querySelector(".room-core-r").style.display = "none";
        document.querySelector(".room-hd").style.display = "none";
        document.querySelector(".player-gift-wrap").style.display = "none";
        document.body.style.overflow = "hidden";
        document.querySelector("#main_col").style.overflow = "hidden";
        ${this.huyaBarrageAdapt(type, barrageState)}`;
      this.watcher = '';
      this.recover = 'var videoPlayer = document.querySelector("#videoContainer");'
        + 'videoPlayer.style.position = "relative";'
        + 'videoPlayer.style.left = "";'
        + 'videoPlayer.style.top = "";'
        + 'videoPlayer.style.zIndex = "";'
        + 'videoPlayer.style.height = "100%";'
        + 'document.querySelector(".duya-header").style.display = "";'
        + 'document.querySelector(".mod-sidebar").style.display = "";'
        + 'document.querySelector(".room-core-r").style.display = "";'
        + 'document.querySelector(".room-hd").style.display = "";'
        + 'document.querySelector(".player-gift-wrap").style.display = "";'
        + 'document.body.style.overflow = "";'
        + 'document.querySelector("#main_col").style.overflow = "";';
    } else if (type === 'video') {
      this.adapter = '';
      this.watcher = '';
      this.recover = '';
    } else {
      this.adapter = `var video = document.querySelector("video");
        var parentElement = video.parentElement;
        document.scrollingElement.scrollTop = 0;
        var width = video.style.width;
        var height = video.style.height;
        var zIndex = video.style.zIndex;
        document.body.prepend(video);
        document.body.style.overflow = "hidden";
        video.style.zIndex = "9999999999";
        video.style.width = "${winSize[0]}px";
        video.style.height = "${winSize[1]}px";
        video.style.background = "rgb(0, 0, 0)";
        Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val.width;if (val.flag) document.querySelector("video").style.setProperty("width", val.width);}});
        Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val.height; if (val.flag) document.querySelector("video").style.setProperty("height", val.height);}});`;
      this.watcher = `var video = document.querySelector("video");
        video.style.width = { width: "${winSize[0]}px", flag: true };
        video.style.height = { height: "${winSize[1]}px", flag: true }`;
      this.recover = 'var video = document.querySelector("video");'
        + 'parentElement.prepend(video);'
        + 'document.body.style.overflow = "";'
        + 'video.style.zIndex = zIndex;'
        + 'video.style.background = "";'
        + 'Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("video").style.setProperty("width", val);}});'
        + 'Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("video").style.setProperty("height", val);}});'
        + 'video.style.width = width;'
        + 'video.style.height = height;';
    }
  }

  public huyaBarrageAdapt(type: string, barrageOpen: boolean) {
    if (['normal', 'others'].includes(type)) {
      return `var barrage = document.querySelector("#danmuwrap");
        if (barrage) {
        barrage.style.visibility = ${barrageOpen} ? 'visible' : 'hidden';
        } else {
        var timer = setInterval(() => {
        if (document.querySelector("#danmuwrap")) {
          document.querySelector("#danmuwrap").style.visibility = ${barrageOpen} ? 'visible' : 'hidden';
          clearInterval(timer);
        }
        }, 500);
        }`;
    }
    return `var barrage = document.querySelector(".abp-container");
      if (barrage) {
      barrage.style.visibility = ${barrageOpen} ? 'visible' : 'hidden';
      } else {
      var timer = setInterval(() => {
      if (document.querySelector(".abp-container")) {
        document.querySelector(".abp-container").style.visibility = ${barrageOpen} ? 'visible' : 'hidden';
        clearInterval(timer);
      }
      }, 500);
      }`;
  }
}

export const huyaFindType = 'if (document.querySelector(".main-wrap")) { "normal"; } else if (document.querySelector(".vplayer-wrap")) { "video" } else { "others"; }';
