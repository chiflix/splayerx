const youtube = {
  adapter: 'var isPaused = document.querySelector("video").paused;'
    + 'document.body.appendChild(document.querySelector(".html5-video-player"));'
    + 'if (!isPaused) { document.querySelector("video").play() };'
    + 'document.querySelector(".html5-video-player").style.position = "absolute";'
    + 'document.getElementsByTagName("ytd-app")[0].style.display = "none";'
    + 'document.querySelector(".html5-video-container").style.width="100%";'
    + 'document.querySelector(".html5-video-container").style.height="100%";'
    + 'document.querySelector("video").style.width="100%";'
    + 'document.querySelector("video").style.height="100%";'
    + 'Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return "100%"}, set: function(){}});'
    + 'Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return "100%"}, set: function(){}});'
    + 'document.querySelector(".html5-video-player").style.background = "rgba(0, 0, 0, 1)";'
    + 'var theater = document.querySelector("#player-theater-container").childElementCount;'
    + 'if (!theater) { document.querySelector(".ytp-size-button").click() };'
    + 'document.body.style.setProperty("overflow", "hidden");'
    + 'Object.defineProperty(document.body.style, "overflow", {get: function(){return "hidden"}, set: function(){}});'
    + 'document.querySelector(".ytp-chrome-bottom").style.width="calc(100vw - 24px)";'
    + 'Object.defineProperty(document.querySelector(".ytp-chrome-bottom").style, "width", {get: function(){return "calc(100vw - 24px)"}, set: function(){}});',
  recover: 'document.getElementsByTagName("ytd-app")[0].style.display = "";'
    + 'document.querySelector(".html5-video-player").style.position = "";'
    + 'Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("video").style.setProperty("width", val);}});'
    + 'Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("video").style.setProperty("height", val);}});'
    + 'Object.defineProperty(document.querySelector(".ytp-chrome-bottom").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector(".ytp-chrome-bottom").style.setProperty("width", val);}});'
    + 'document.querySelector(".html5-video-player").style.background = "";'
    + 'if (!theater) { document.querySelector(".ytp-size-button").click() };'
    + 'Object.defineProperty(document.body.style, "overflow", {value: "",writable: true});document.body.style.setProperty("overflow", "");'
    + 'var isPaused = document.querySelector("video").paused;'
    + 'document.querySelector(".ytd-player").appendChild(document.querySelector(".html5-video-player"));'
    + 'if (!isPaused) {document.querySelector("video").play()};',
};

export default youtube;
