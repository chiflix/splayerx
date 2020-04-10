export function huyaVideoPause(type: string) {
  if (['normal', 'others'].includes(type)) {
    return 'var timer = setInterval(() => { var video = document.querySelector("video");if (video && !video.paused) { video.pause();}var pause = document.querySelector(".player-pause-btn");if (pause && timer) { clearInterval(timer);timer = null;pause.click(); } }, 100);';
  }
  return 'var timer = setInterval(() => { var video = document.querySelector("video");if (video && !video.paused) { video.pause();}var pause = document.querySelector(".pause-81a5c3"); if (pause) { clearInterval(timer);pause.click(); } }, 100);';
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
        document.querySelector("#player-pc-watch-btn").style.display = "none";
        var navbar = document.querySelector(".nav-comp-wrap");
        var sidebar = document.querySelector(".room-core");
        if (sidebar) sidebar.style.zIndex = "999999";
        if (navbar) navbar.style.display = "none";
        var backToTop = document.querySelector(".room-backToTop");
        if (backToTop) backToTop.style.display = "none";
        var pip = document.querySelector("#player-pc-watch-btn");
        if (pip) {
        pip.style.display = "none";
        Object.defineProperty(pip.style, "display", { get: function() { return "none"; }, set: function() {} });
        }
        ${this.barrageAdapt(type, barrageState)}`;
      this.watcher = '';
      this.recover = `var videoPlayer = document.querySelector("#videoContainer");
        videoPlayer.style.position = "relative";
        videoPlayer.style.left = "";
        videoPlayer.style.top = "";
        videoPlayer.style.zIndex = "";
        videoPlayer.style.height = "100%";
        document.querySelector(".duya-header").style.display = "";
        document.querySelector(".mod-sidebar").style.display = "";
        document.querySelector(".room-core-r").style.display = "";
        document.querySelector(".room-hd").style.display = "";
        document.querySelector(".player-gift-wrap").style.display = "";
        document.body.style.overflow = "";
        document.querySelector("#main_col").style.overflow = "";
        document.querySelector("#player-pc-watch-btn").style.display = "";
        var sidebar = document.querySelector(".room-core");
        if (sidebar) sidebar.style.zIndex = "";
        var navbar = document.querySelector(".nav-comp-wrap");
        if (navbar) navbar.style.display = "";
        var backToTop = document.querySelector(".room-backToTop");
        if (backToTop) backToTop.style.display = "";
        var pip = document.querySelector("#player-pc-watch-btn");
        if (pip) {
        Object.defineProperty(pip.style, "display", {get: function(){return this._display}, set: function(val){this._display = val;pip.style.setProperty("display", val);}});
        pip.style.display = "";}
        ${this.barrageAdapt(type, barrageState)}`;
    } else if (type === 'video') {
      this.adapter = `${this.barrageAdapt(type, barrageState)}
        var videoPlayer = document.querySelector(".qNaLj_XPyjPujVM0Dx5jZ");
        videoPlayer.style.position = "fixed";
        videoPlayer.style.left = "0";
        videoPlayer.style.top = "0";
        videoPlayer.style.zIndex = 9999999;
        document.querySelector("._32rT1ZAlgtNPtfe9f7MKHz").style.display = "none";
        document.querySelector("._2P2VjlA93Xla813NdL7vla").style.height = "100%";`;
      this.watcher = '';
      this.recover = `${this.barrageAdapt(type, barrageState)}
        var videoPlayer = document.querySelector(".qNaLj_XPyjPujVM0Dx5jZ");
        videoPlayer.style.position = "relative";
        videoPlayer.style.left = "";
        videoPlayer.style.top = "";
        videoPlayer.style.zIndex = "";
        document.querySelector("._32rT1ZAlgtNPtfe9f7MKHz").style.display = "";
        document.querySelector("._2P2VjlA93Xla813NdL7vla").style.height = "calc(100% - 57px)";`;
    } else if (type === 'cnt-video') {
      this.adapter = `${this.barrageAdapt(type, barrageState)}
        var videoPlayer = document.querySelector(".QOwoXekJjKX5GAc7s-4qG");
        videoPlayer.style.position = "fixed";
        videoPlayer.style.left = "0";
        videoPlayer.style.top = "0";
        videoPlayer.style.zIndex = 9999999;
        document.querySelector(".nhYqOPYwK9Y4VsNuH6-7L").style.display = "none";
        document.body.style.overflow = "hidden";`;
      this.watcher = '';
      this.recover = `${this.barrageAdapt(type, barrageState)}
        var videoPlayer = document.querySelector(".QOwoXekJjKX5GAc7s-4qG");
        videoPlayer.style.position = "relative";
        videoPlayer.style.left = "";
        videoPlayer.style.top = "";
        videoPlayer.style.zIndex = "";
        document.querySelector(".nhYqOPYwK9Y4VsNuH6-7L").style.display = "";
        document.body.style.overflow = "";`;
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

  public barrageAdapt(type: string, barrageOpen: boolean) {
    if (type === 'normal') {
      return `var danmu = !document.getElementsByClassName("danmu-show-btn danmu-hide-btn").length;
      if (danmu !== ${barrageOpen}) {
      document.querySelector("#player-danmu-btn").click();}`;
    }
    if (type === 'cnt-video') {
      return `var danmu = !document.getElementsByClassName("_2d4EyLuqYFAwLHzBTPgL2n _2iFyJKDmzIlYy6ls0uh_9y").length;
      if (danmu !== ${barrageOpen}) {
      document.querySelector("._2d4EyLuqYFAwLHzBTPgL2n").click();}`;
    }
    if (type === 'video') {
      return `var danmu = !document.getElementsByClassName("r8nOvINkZBhZgYZkyjBa4 _1_xZLd-TynJdPQGuCnpI3I").length;
      if (danmu !== ${barrageOpen}) {
      document.querySelector(".r8nOvINkZBhZgYZkyjBa4").click();}`;
    }
    return '';
  }
}

export const huyaFindType = 'if (document.querySelector(".cnt-wrap")) {'
  + 'var r = { barrageState: !document.getElementsByClassName("_2d4EyLuqYFAwLHzBTPgL2n _2iFyJKDmzIlYy6ls0uh_9y").length, type: "cnt-video" };r;'
  + '} else if (document.querySelector(".main-wrap")) {'
  + 'var r = { barrageState: !document.getElementsByClassName("danmu-show-btn danmu-hide-btn").length, type: "normal" };r;'
  + '} else if (document.querySelector(".vplayer-wrap")) {'
  + 'var r = { barrageState: !document.getElementsByClassName("r8nOvINkZBhZgYZkyjBa4 _1_xZLd-TynJdPQGuCnpI3I").length, type: "video" };r;'
  + '} else { var r = { barrageState: false, type: "others" };r; }';
