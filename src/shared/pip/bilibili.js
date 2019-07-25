export function bilibiliBarrageAdapt(type, barrageOpen) {
  if (type === 'video') {
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
  if (type === 'video') {
    return {
      adapter: `var isTheater = document.querySelector(".player-wrap").style.height !== "auto";
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
        document.querySelector("#entryOld").style.display = "none"`,
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
        + 'document.querySelector("#entryOld").style.display = "";'
        + 'if (!isTheater) {document.querySelector(".bilibili-player-video-btn-widescreen").click();};',
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
      Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val.width;if (val.flag) document.querySelector("video").style.setProperty("width", val.width);}});
      Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val.height; if (val.flag) document.querySelector("video").style.setProperty("height", val.height);}});`,
    watcher: `var video = document.querySelector("video");
      video.style.width = { width: "${winSize[0]}px", flag: true };
      video.style.height = { height: "${winSize[1]}px", flag: true }`,
    recover: 'var video = document.querySelector("video");'
      + 'parentElement.prepend(video);'
      + 'document.body.style.overflow = "";'
      + 'video.style.zIndex = zIndex;'
      + 'Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("video").style.setProperty("width", val);}});'
      + 'Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("video").style.setProperty("height", val);}});'
      + 'video.style.width = width;'
      + 'video.style.height = height;',
  };
}

export const bilibiliFindType = '[document.querySelector(".live-player-ctnr"), document.querySelector("iframe"), document.querySelector("#bofqi")]';
