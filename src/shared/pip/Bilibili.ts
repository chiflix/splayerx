export function bilibiliVideoPause(type: string) {
  if (['video', 'bangumi'].includes(type)) {
    return 'document.querySelector("video").pause();';
  }
  if (type === 'videoStreaming') {
    return 'document.querySelector("video").pause();var timer = setInterval(() => { var pause = document.querySelector(".bilibili-live-player-video-controller-btn-item").children[0]; if (pause) { clearInterval(timer);pause.click(); } }, 100);';
  }
  if (type === 'iframeStreaming') {
    return 'document.querySelector("video").pause();var timer = setInterval(() => { var pause = document.querySelector("iframe").contentDocument.querySelector(".bilibili-live-player-video-controller-btn-item").children[0]; if (pause) { clearInterval(timer);pause.click(); } }, 100);';
  }
  return 'document.querySelector("video").pause();var timer = setInterval(() => { var pause = document.querySelector(".bilibili-live-player-video-controller-btn-item").children[0]; if (pause) { clearInterval(timer);pause.click(); } }, 100);';
}

export default class Bilibili {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(type: string, barrageOpen: boolean, winSize: number[]) {
    if (type === 'bangumi') {
      this.adapter = `var player = document.querySelector("#bofqi");
        document.body.prepend(player);
        document.body.style.overflow = "hidden";
        if (document.querySelector("#app")) {
        document.querySelector("#app").style.display = "none";
        } else {
        document.querySelector("#viewlater-app").style.display = "none";
        }
        player.style.position = "absolute";
        player.style.width = "100%";
        player.style.height = "100%";
        player.style.zIndex = 99999;
        ${this.bilibiliBarrageAdapt(type, barrageOpen)}
        document.querySelector(".player").style.height = "100%";
        document.querySelector(".player").style.width = "100%";
        document.querySelector(".bilibili-player-auxiliary-area").style.display = "none";
        document.querySelector(".bilibili-player-video-message").style.display = "none";
        document.querySelector(".bilibili-player-video-sendbar").style.setProperty("display", "none");
        Object.defineProperty(document.querySelector(".bilibili-player-video-sendbar").style, "display", { get: function() {return "none";}, set: function(){}});`;
      this.watcher = '';
      this.recover = 'var player = document.querySelector("#bofqi");'
        + 'document.querySelector(".bgray-btn-wrap").parentNode.insertBefore(player, document.querySelector(".bgray-btn-wrap").nextSibling);'
        + 'player.style.position = "relative";'
        + 'player.style.height = "";'
        + 'player.style.zIndex = "";'
        + 'document.body.style.overflow = "";'
        + 'document.querySelector(".player").style.height = "";'
        + '  document.querySelector(".player").style.width = "";'
        + 'if (document.querySelector("#app")) {'
        + 'document.querySelector("#app").style.display = "";'
        + '} else {'
        + 'document.querySelector("#viewlater-app").style.display = "";'
        + '}'
        + 'document.querySelector(".bilibili-player-auxiliary-area").style.display = "";'
        + 'document.querySelector(".bilibili-player-video-message").style.display = "";'
        + 'Object.defineProperty(document.querySelector(".bilibili-player-video-sendbar").style, "display", { get: function() {return this._display;}, set: function(val){ this._display = val; document.querySelector(".bilibili-player-video-sendbar").style.setProperty("display", val);}});'
        + 'document.querySelector(".bilibili-player-video-sendbar").style.setProperty("display", "");';
    } else if (type === 'video') {
      this.adapter = `var theater = document.querySelector(".player-wrap");
        var isTheater = theater ? theater.style.height !== "auto" : true;
        if (!isTheater) {document.querySelector(".bilibili-player-video-btn-widescreen").click();};
        var wrapper = document.querySelector(".bilibili-player-video-wrap");
        if (document.querySelector("#player_module") && !document.querySelector(".plp-l")) {
        document.querySelector("#player_module").style.width = "100%";
        document.querySelector("#player_module").style.height = "100%";
        document.querySelector("#player_module").style.position = "fixed";
        document.querySelector(".media-wrapper").style.display = "none";
        document.querySelector(".plp-r").style.display = "none";
        Object.defineProperty(document.querySelector("#player_module").style, "width", {get: function(){return "100%"}, set: function(){}});
        Object.defineProperty(document.querySelector("#player_module").style, "height", {get: function(){return "100%"}, set: function(){}});
        }
        wrapper.style.position = "fixed";
        wrapper.style.left="0";
        wrapper.style.top="0";
        wrapper.style.zIndex = "9999";
        wrapper.style.width="100%";
        wrapper.style.height="100%";
        ${this.bilibiliBarrageAdapt(type, barrageOpen)}
        document.body.style.overflow = "hidden";
        document.querySelector(".bili-header-m").style.display = "none";
        if (document.querySelector("#entryOld")) {document.querySelector("#entryOld").style.display = "none";}`;
      this.watcher = '';
      this.recover = 'document.querySelector(".bilibili-player-video-danmaku").style.opacity = "1";'
        + 'var wrapper = document.querySelector(".bilibili-player-video-wrap");'
        + 'if (document.querySelector("#player_module") && !document.querySelector(".plp-l")) {'
        + 'document.querySelector("#player_module").style.position = "";'
        + 'document.querySelector(".media-wrapper").style.display = "";'
        + 'document.querySelector(".plp-r").style.display = "";'
        + 'Object.defineProperty(document.querySelector("#player_module").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("#player_module").style.setProperty("width", val);}});'
        + 'Object.defineProperty(document.querySelector("#player_module").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("#player_module").style.setProperty("height", val);}});'
        + 'document.querySelector("#player_module").style.setProperty("width", "");'
        + 'document.querySelector("#player_module").style.setProperty("height", "");'
        + '}'
        + 'wrapper.style.position = "relative";'
        + 'wrapper.style.left="";'
        + 'wrapper.style.top="";'
        + 'wrapper.style.zIndex = "auto";'
        + 'wrapper.style.width="";'
        + 'wrapper.style.height="";'
        + 'document.body.style.overflow = "";'
        + 'document.querySelector(".bili-header-m").style.display = "";'
        + 'if (document.querySelector("#entryOld")) {document.querySelector("#entryOld").style.display = "";}'
        + 'if (!isTheater) {document.body.click();document.querySelector(".bilibili-player-video-btn-widescreen").click();};';
    } else if (type === 'videoStreaming') {
      this.adapter = `${this.bilibiliBarrageAdapt(type, barrageOpen)}
        document.body.prepend(document.querySelector(".live-player-ctnr"));
        document.querySelector(".live-room-app").style.display = "none";
        document.body.style.overflow = "hidden";`;
      this.watcher = '';
      this.recover = 'document.querySelector(".player-section").prepend(document.querySelector(".live-player-ctnr"));'
        + 'document.querySelector(".bilibili-live-player-video-danmaku").style.opacity = "1";'
        + 'document.querySelector(".live-room-app").style.display = "";'
        + 'document.body.style.overflow = "";';
    } else if (type === 'iframeStreaming') {
      this.adapter = `${this.bilibiliBarrageAdapt(type, barrageOpen)}
        document.body.style.cssText = "overflow: hidden";
        Object.defineProperty(document.body.style, "overflow", {get: function(){return "hidden"}, set: function(){}});
        document.querySelector("iframe").contentDocument.querySelector(".aside-area").style.display = "none";
        var header = document.querySelector(".game-header");
        var navbar = document.querySelector(".link-navbar");
        var sidebar = document.querySelector(".agile-sidebar");
        var navwrapper = document.querySelector(".bili-header-m");
        if (header) header.style.display = "none";
        if (navbar) navbar.style.display = "none";
        if (sidebar) sidebar.style.display = "none";
        if (navwrapper) navwrapper.style.display = "none";
        document.querySelector("iframe").contentDocument.querySelector("#head-info-vm").style.display = "none";
        document.querySelector("iframe").contentDocument.querySelector(".aside-area-toggle-btn").style.display = "none";
        document.querySelector("iframe").contentDocument.querySelector("#gift-control-vm").style.display = "none";
        var el = document.querySelector("iframe");
        el.style.cssText = "position: fixed; left: 0; top: 0; z-index: 9999";
        Object.defineProperty(el.style, "position", {get: function(){ return "fixed"},set: function(){}});
        Object.defineProperty(el.style, "left", {get: function(){ return "0"},set: function(){}});
        Object.defineProperty(el.style, "top", {get: function(){ return "0"},set: function(){}});
        document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.width = "${winSize[0]}px";
        document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.height = "${winSize[1]}px";
        document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.width ="${winSize[0]}px";
        document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.height ="${winSize[1]}px"`;
      this.watcher = `document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.width = "${winSize[0]}px";
        document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.height = "${winSize[1]}px";
        document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.width ="${winSize[0]}px";
        document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.height ="${winSize[1]}px"`;
      this.recover = 'Object.defineProperty(document.body.style, "overflow", {value: "scroll",writable: true});'
        + 'document.body.style.cssText = "overflow: scroll";'
        + 'document.querySelector("iframe").contentDocument.querySelector(".aside-area").style.display = "";'
        + 'var header = document.querySelector(".game-header");'
        + 'var navbar = document.querySelector(".link-navbar");'
        + 'var sidebar = document.querySelector(".agile-sidebar");'
        + 'var navwrapper = document.querySelector(".bili-header-m");'
        + 'if (navwrapper) navwrapper.style.display = "";'
        + 'if (sidebar) sidebar.style.display = "";'
        + 'if (navbar) navbar.style.display = "";'
        + 'if (header) header.style.display = "";'
        + 'document.querySelector("iframe").contentDocument.querySelector("#head-info-vm").style.display = "";'
        + 'document.querySelector("iframe").contentDocument.querySelector(".aside-area-toggle-btn").style.display = "";'
        + 'document.querySelector("iframe").contentDocument.querySelector("#gift-control-vm").style.display = "";'
        + 'document.querySelector("iframe").contentDocument.querySelector(".bilibili-live-player-video-danmaku").style.opacity = "1";'
        + 'var el = document.querySelector("iframe");'
        + 'Object.defineProperty(el.style, "position", {value: "", writable: true});'
        + 'Object.defineProperty(el.style, "left", {value: "", writable: true});'
        + 'Object.defineProperty(el.style, "top", {value: "", writable: true});'
        + 'el.style.cssText = `position: ""; left: ""; top: ""; z-index: "";`;'
        + 'document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.cssText = `width: ""; height: "";`;'
        + 'document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.cssText = `width: ""; height: "";`';
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

  public bilibiliBarrageAdapt(type: string, barrageOpen: boolean) {
    if (['video', 'bangumi'].includes(type)) {
      return `document.querySelector(".bilibili-player-video-danmaku").style.opacity = ${barrageOpen} ? "1" : "0";`;
    }
    if (type === 'videoStreaming') {
      return `document.querySelector(".bilibili-live-player-video-danmaku").style.opacity = ${barrageOpen} ? "1": "0"`;
    }
    if (type === 'iframeStreaming') {
      return `document.querySelector("iframe").contentDocument.querySelector(".bilibili-live-player-video-danmaku").style.opacity = ${barrageOpen} ? "1": "0";`;
    }
    return '';
  }
}

export const bilibiliFindType = 'var contents = document.querySelector("iframe") ? document.querySelector("iframe").contentDocument : null;'
  + 'if (document.querySelector(".bilibili-player-video-message")) { "bangumi" } else if (document.querySelector(".live-player-ctnr")) { "videoStreaming" } else if (document.querySelector(".container-wrapper") || contents ? contents.querySelector(".live-room-app") : null) { "iframeStreaming" } else if (document.querySelector("#bofqi")) { "video" } else { "others" };';
