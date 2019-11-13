export default class Others {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(winSize: number[]) {
    this.adapter = `var video = document.querySelector("video");
      var parentElement = video.parentElement;
      document.scrollingElement.scrollTop = 0;
      var width = video.style.width;
      var height = video.style.height;
      var zIndex = video.style.zIndex;
      var position = video.style.position;
      document.body.prepend(video);
      document.body.style.overflow = "hidden";
      video.style.zIndex = "9999999999";
      video.style.width = "${winSize[0]}px";
      video.style.height = "${winSize[1]}px";
      video.style.left = "0";
      video.style.top = "0";
      video.style.background = "rgb(0, 0, 0)";
      video.style.position = "absolute";
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
      + 'video.style.position = position;'
      + 'video.style.left = "";'
      + 'video.style.top = "";'
      + 'Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("video").style.setProperty("width", val);}});'
      + 'Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("video").style.setProperty("height", val);}});'
      + 'video.style.width = width;'
      + 'video.style.height = height;';
  }
}
