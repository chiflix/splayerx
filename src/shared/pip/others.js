export default function globalPip(winSize) {
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
