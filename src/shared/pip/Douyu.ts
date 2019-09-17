export default class Douyu {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(type: string, barrageState: boolean, winSize: number[]) {
    if (type === 'normal') {
      this.adapter = `var videoPlayer = document.querySelector(".layout-Player-videoMain");
        ${this.douyuBarrageAdapt(barrageState)}
        videoPlayer.style.position = "fixed";
        videoPlayer.style.zIndex = "999999999";
        document.querySelector("video").style.width = "100%";
        document.querySelector("video").style.height = "100%";
        document.body.style.overflow = "hidden";
        Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val.width;if (val.flag) document.querySelector("video").style.setProperty("width", val.width);}});
        Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val.height; if (val.flag) document.querySelector("video").style.setProperty("height", val.height);}});`;
      this.watcher = '';
      this.recover = 'var videoPlayer = document.querySelector(".layout-Player-videoMain");'
        + 'videoPlayer.style.position = "absolute";'
        + 'videoPlayer.style.zIndex = "";'
        + 'document.body.style.overflow = "";'
        + 'Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("video").style.setProperty("width", val);}});'
        + 'Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("video").style.setProperty("height", val);}});';
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

  public douyuBarrageAdapt(barrageOpen: boolean) {
    return `document.querySelector(".comment-37342a").style.visibility = ${barrageOpen} ? 'visible' : 'hidden';`;
  }
}

export const douyuFindType = 'if (document.querySelector(".layout-Player-videoMain")) { "normal"; } else { "others"; }';
