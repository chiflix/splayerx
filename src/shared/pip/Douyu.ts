export function douyuVideoPause(type: string) {
  if (['normal', 'others'].includes(type)) {
    return 'document.querySelector("video").pause();var timer = setInterval(() => { const pause = document.querySelector(".pause-c594e8"); if (pause && timer) { clearInterval(timer);timer = null;pause.click(); } }, 100);';
  }
  return 'document.querySelector("video").pause();var timer = setInterval(() => { const pause = document.querySelector(".pause-81a5c3"); if (pause && timer) { clearInterval(timer);timer = null;pause.click(); } }, 100);';
}

export default class Douyu {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(type: string, barrageState: boolean, winSize: number[]) {
    if (type === 'normal') {
      this.adapter = `var videoPlayer = document.querySelector(".layout-Player-videoMain");
        ${this.barrageAdapt(type, barrageState)}
        videoPlayer.style.position = "fixed";
        videoPlayer.style.zIndex = "999999999";
        videoPlayer.style.width = "100%";
        videoPlayer.style.height = "100%";
        videoPlayer.style.right = "0";
        videoPlayer.style.left = "0";
        videoPlayer.style.bottom = "0";
        videoPlayer.style.top = "0";
        var room = document.querySelector(".room-Player-Box");
        room.style.width = "100%";
        room.style.height = "100%";
        room.style.right = "0";
        room.style.bottom = "0";
        document.querySelector(".layout-Main").style.overflow = "hidden";
        document.querySelector("video").style.width = "100%";
        document.querySelector("video").style.height = "100%";
        document.body.style.overflow = "hidden";
        var roomPlayer = document.querySelector(".roomSmallPlayerFloatLayout")
        if (roomPlayer) roomPlayer.style.display = "none";
        document.querySelector("._1Osm4fzGmcuRK9M8IVy3u6").style.width = "100%";
        document.querySelector("._1Osm4fzGmcuRK9M8IVy3u6").style.height = "100%";
        Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val.width;if (val.flag) document.querySelector("video").style.setProperty("width", val.width);}});
        Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val.height; if (val.flag) document.querySelector("video").style.setProperty("height", val.height);}});`;
      this.watcher = '';
      this.recover = ` ${this.barrageAdapt(type, barrageState)}
        var videoPlayer = document.querySelector(".layout-Player-videoMain");
        videoPlayer.style.position = "";
        videoPlayer.style.zIndex = "";
        videoPlayer.style.width = "";
        videoPlayer.style.height = "";
        videoPlayer.style.right = "";
        videoPlayer.style.bottom = "";
        videoPlayer.style.left = "";
        videoPlayer.style.top = "";
        document.body.style.overflow = "";
        var room = document.querySelector(".room-Player-Box");
        room.style.width = "";
        room.style.height = "";
        room.style.right = "";
        room.style.bottom = "";
        document.querySelector(".layout-Main").style.overflow = "";
        var roomPlayer = document.querySelector(".roomSmallPlayerFloatLayout");
        if (roomPlayer) roomPlayer.style.display = "block";
        Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("video").style.setProperty("width", val);}});
        Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("video").style.setProperty("height", val);}});`;
    } else if (type === 'video') {
      this.adapter = `var videoPlayer = document.querySelector(".video-holder").childNodes[0];
        ${this.barrageAdapt(type, barrageState)}
        videoPlayer.style.position = "fixed";
        videoPlayer.style.zIndex = "999999999";
        videoPlayer.style.width = "100%";
        videoPlayer.style.height = "100%";
        document.querySelector("video").style.width = "100%";
        document.querySelector("video").style.height = "100%";
        document.body.style.overflow = "hidden";
        var controlbar = null;
        videoPlayer.childNodes.forEach(i => {
        if (i.classList && i.classList.value.includes("controlbar")) {
        controlbar = i;
        }
        });
        if (controlbar) {
        controlbar.style.width = "100%";
        controlbar.children[0].style.width = "100%";
        }
        document.querySelector("#header").style.display = "none";`;
      this.watcher = '';
      this.recover = `${this.barrageAdapt(type, barrageState)}
        var videoPlayer = document.querySelector(".video-holder").childNodes[0];
        videoPlayer.style.position = "relative";
        videoPlayer.style.zIndex = "";
        document.body.style.overflow = "";
        document.querySelector("#header").style.display = "";`;
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
      return `var danmu = !!document.getElementsByClassName("hidedanmu-5d54e2 removed-9d4c42").length;
        if (danmu && ${!barrageOpen}) {
          document.querySelector(".showdanmu-42b0ac").click();
        } else if (!danmu && ${barrageOpen}) {
          document.querySelector(".hidedanmu-5d54e2").click();
        }`;
    }
    if (type === 'video') {
      return `var danmu = !!document.getElementsByClassName("s5-1d7124 input-76795c removed-fcaace").length;
        if (danmu && ${!barrageOpen}) {
          document.querySelector(".s4-2953ce").click();
        } else if (!danmu && ${barrageOpen}) {
          document.querySelector(".s5-1d7124").click();
        }`;
    }
    return '';
  }
}

export const douyuFindType = 'if (document.querySelector(".layout-Player-videoMain")) {'
  + 'var r = { barrageState: !!document.getElementsByClassName("hidedanmu-5d54e2 removed-9d4c42").length, type: "normal" };r;'
  + '} else if (document.querySelector(".video")) {'
  + 'var r = { barrageState: !!document.getElementsByClassName("s5-1d7124 input-76795c removed-fcaace").length, type: "video" };r;'
  + '} else { var r = { barrageState: false, type: "others" };r; }';
