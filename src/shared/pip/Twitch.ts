export default class Twitch {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(type: string, winSize: number[]) {
    if (type === 'normal') {
      this.adapter = 'var player = document.querySelector(".video-player__container");'
        + 'player.style.position = "fixed";'
        + 'player.style.maxHeight = "100%";'
        + 'document.querySelector(".top-nav").style.display = "none";'
        + 'document.querySelector(".simplebar-scroll-content").style.overflow = "hidden";'
        + 'document.querySelector(".root-scrollable").children[0].style.display = "none";';
      this.watcher = '';
      this.recover = 'var player = document.querySelector(".video-player__container");'
        + 'player.style.position = "";'
        + 'player.style.maxHeight = "";'
        + 'document.querySelector(".top-nav").style.display = "";'
        + 'document.querySelector(".simplebar-scroll-content").style.overflow = "";'
        + 'document.querySelector(".root-scrollable").children[0].style.display = "";';
    } else {
      this.adapter = `var video = document.querySelector("video");
        var parentElement = video.parentElement;
        document.scrollingElement.scrollTop = 0;
        var width = video.style.width;
        var height = video.style.height;
        var zIndex = video.style.zIndex;
        video.style.position = "absolute";
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
        + 'video.style.position = "";'
        + 'video.style.background = "";'
        + 'Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("video").style.setProperty("width", val);}});'
        + 'Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("video").style.setProperty("height", val);}});'
        + 'video.style.width = width;'
        + 'video.style.height = height;';
    }
  }
}

export const twitchFindType = 'if (!document.querySelector(".featured-content-carousel")) { "normal"; } else { "others"; }';
