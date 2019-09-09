export function bilibiliBarrageAdapt(type, barrageOpen) {
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

export function bilibili(type, barrageOpen, winSize) {
  if (type === 'bangumi') {
    return {
      adapter: `var player = document.querySelector("#bofqi");
        document.body.prepend(player);
        document.body.style.overflow = "hidden";
        document.querySelector("#app").style.display = "none";
        player.style.position = "absolute";
        player.style.width = "100%";
        player.style.height = "100%";
        player.style.zIndex = 99999;
        ${bilibiliBarrageAdapt(type, barrageOpen)}
        document.querySelector(".player").style.height = "100%";
        document.querySelector(".bilibili-player-auxiliary-area").style.display = "none";
        document.querySelector(".bilibili-player-video-message").style.display = "none";
        document.querySelector(".bilibili-player-video-sendbar").style.setProperty("display", "none");
        Object.defineProperty(document.querySelector(".bilibili-player-video-sendbar").style, "display", { get: function() {return "none";}, set: function(){}});`,
      watcher: '',
      recover: 'var player = document.querySelector("#bofqi");'
        + 'document.querySelector(".bangumi-player").insertBefore(player, document.querySelector(".bgray-btn-wrap").nextSibling);'
        + 'player.style.position = "relative";'
        + 'player.style.height = "";'
        + 'player.style.zIndex = "";'
        + 'document.body.style.overflow = "";'
        + 'document.querySelector(".player").style.height = "";'
        + 'document.querySelector("#app").style.display = "";'
        + 'document.querySelector(".bilibili-player-auxiliary-area").style.display = "";'
        + 'document.querySelector(".bilibili-player-video-message").style.display = "";'
        + 'Object.defineProperty(document.querySelector(".bilibili-player-video-sendbar").style, "display", { get: function() {return this._display;}, set: function(val){ this._display = val; document.querySelector(".bilibili-player-video-sendbar").style.setProperty("display", val);}});'
        + 'document.querySelector(".bilibili-player-video-sendbar").style.setProperty("display", "");',
    };
  }
  if (type === 'video') {
    return {
      adapter: `var theater = document.querySelector(".player-wrap");
        var isTheater = theater ? theater.style.height !== "auto" : true;
        if (!isTheater) {document.querySelector(".bilibili-player-video-btn-widescreen").click();};
        var wrapper = document.querySelector(".bilibili-player-video-wrap");
        wrapper.style.position = "fixed";
        wrapper.style.left="0";
        wrapper.style.top="0";
        wrapper.style.zIndex = "9999";
        wrapper.style.width="100%";
        wrapper.style.height="100%";
        ${bilibiliBarrageAdapt(type, barrageOpen)}
        document.body.style.overflow = "hidden";
        document.querySelector(".bili-header-m").style.display = "none";
        if (document.querySelector("#entryOld")) {document.querySelector("#entryOld").style.display = "none";}`,
      watcher: '',
      recover: 'document.querySelector(".bilibili-player-video-danmaku").style.opacity = "1";'
        + 'var wrapper = document.querySelector(".bilibili-player-video-wrap");'
        + 'wrapper.style.position = "relative";'
        + 'wrapper.style.left="";'
        + 'wrapper.style.top="";'
        + 'wrapper.style.zIndex = "auto";'
        + 'wrapper.style.width="";'
        + 'wrapper.style.height="";'
        + 'document.body.style.overflow = "";'
        + 'document.querySelector(".bili-header-m").style.display = "";'
        + 'if (document.querySelector("#entryOld")) {document.querySelector("#entryOld").style.display = "";}'
        + 'if (!isTheater) {document.body.click();document.querySelector(".bilibili-player-video-btn-widescreen").click();};',
    };
  }
  if (type === 'videoStreaming') {
    return {
      adapter: `${bilibiliBarrageAdapt(type, barrageOpen)}
        document.body.prepend(document.querySelector(".live-player-ctnr"));
        document.querySelector(".live-room-app").style.display = "none";
        document.body.style.overflow = "hidden";`,
      watcher: '',
      recover: 'document.querySelector(".player-section").prepend(document.querySelector(".live-player-ctnr"));'
        + 'document.querySelector(".bilibili-live-player-video-danmaku").style.opacity = "1";'
        + 'document.querySelector(".live-room-app").style.display = "";'
        + 'document.body.style.overflow = "";',
    };
  }
  if (type === 'iframeStreaming') {
    return {
      adapter: `${bilibiliBarrageAdapt(type, barrageOpen)}
        document.body.style.cssText = "overflow: hidden";
        Object.defineProperty(document.body.style, "overflow", {get: function(){return "hidden"}, set: function(){}});
        document.querySelector("iframe").contentDocument.querySelector(".aside-area").style.display = "none";
        document.querySelector(".game-header").style.display = "none";
        document.querySelector(".link-navbar").style.display = "none";
        document.querySelector("iframe").contentDocument.querySelector("#head-info-vm").style.display = "none";
        document.querySelector("iframe").contentDocument.querySelector(".aside-area-toggle-btn").style.display = "none";
        document.querySelector(".agile-sidebar").style.display = "none";
        document.querySelector("iframe").contentDocument.querySelector("#gift-control-vm").style.display = "none";
        var el = document.querySelector("iframe");
        el.style.cssText = "position: fixed; left: 0; top: 0; z-index: 9999";
        Object.defineProperty(el.style, "position", {get: function(){ return "fixed"},set: function(){}});
        Object.defineProperty(el.style, "left", {get: function(){ return "0"},set: function(){}});
        Object.defineProperty(el.style, "top", {get: function(){ return "0"},set: function(){}});
        document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.width = "${winSize[0]}px";
        document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.height = "${winSize[1]}px";
        document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.width ="${winSize[0]}px";
        document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.height ="${winSize[1]}px"`,
      watcher: `document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.width = "${winSize[0]}px";
        document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.height = "${winSize[1]}px";
        document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.width ="${winSize[0]}px";
        document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.height ="${winSize[1]}px"`,
      recover: 'Object.defineProperty(document.body.style, "overflow", {value: "scroll",writable: true});'
        + 'document.body.style.cssText = "overflow: scroll";'
        + 'document.querySelector("iframe").contentDocument.querySelector(".aside-area").style.display = "";'
        + 'document.querySelector(".game-header").style.display = "";'
        + 'document.querySelector(".link-navbar").style.display = "";'
        + 'document.querySelector("iframe").contentDocument.querySelector("#head-info-vm").style.display = "";'
        + 'document.querySelector("iframe").contentDocument.querySelector(".aside-area-toggle-btn").style.display = "";'
        + 'document.querySelector(".agile-sidebar").style.display = "";'
        + 'document.querySelector("iframe").contentDocument.querySelector("#gift-control-vm").style.display = "";'
        + 'document.querySelector("iframe").contentDocument.querySelector(".bilibili-live-player-video-danmaku").style.opacity = "1";'
        + 'var el = document.querySelector("iframe");'
        + 'Object.defineProperty(el.style, "position", {value: "", writable: true});'
        + 'Object.defineProperty(el.style, "left", {value: "", writable: true});'
        + 'Object.defineProperty(el.style, "top", {value: "", writable: true});'
        + 'el.style.cssText = `position: ""; left: ""; top: ""; z-index: "";`;'
        + 'document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.cssText = `width: ""; height: "";`;'
        + 'document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.cssText = `width: ""; height: "";`',
    };
  }
  return {
    adapter: `var video = document.querySelector("video");
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
      Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val.height; if (val.flag) document.querySelector("video").style.setProperty("height", val.height);}});`,
    watcher: `var video = document.querySelector("video");
      video.style.width = { width: "${winSize[0]}px", flag: true };
      video.style.height = { height: "${winSize[1]}px", flag: true }`,
    recover: 'var video = document.querySelector("video");'
      + 'parentElement.prepend(video);'
      + 'document.body.style.overflow = "";'
      + 'video.style.zIndex = zIndex;'
      + 'video.style.background = "";'
      + 'Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("video").style.setProperty("width", val);}});'
      + 'Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("video").style.setProperty("height", val);}});'
      + 'video.style.width = width;'
      + 'video.style.height = height;',
  };
}

export const bilibiliFindType = '[document.querySelector(".bilibili-player-video-message"), document.querySelector(".live-player-ctnr"), document.querySelector("iframe"), document.querySelector("#bofqi")]';
