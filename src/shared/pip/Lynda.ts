export default class Lynda {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var preView = document.querySelector(".modal-player-cont") ? document.querySelector(".modal-player-cont") : document.querySelector("#video-container");'
      + 'preView.style.left = "0";'
      + 'preView.style.top = "0";'
      + 'preView.style.width = "100%";'
      + 'preView.style.height = "100%";'
      + 'preView.style.zIndex = "999999";'
      + 'preView.style.position = "fixed";'
      + 'preView.style.background = "black";'
      + 'document.body.style.overflow = "hidden";'
      + 'document.querySelector(".mejs-captions-layer").style.bottom = "0";'
      + 'document.querySelector(".mejs-controls").style.bottom = "-52px";'
      + 'document.querySelector("#mep_0").style.width = "100%";'
      + 'document.querySelector("#mep_0").style.height = "calc(100% - 52px)";'
      + 'Object.defineProperty(document.querySelector("#mep_0").style, "width", { get: function() {return "100%";}, set: function(){}});'
      + 'Object.defineProperty(document.querySelector("#mep_0").style, "height", { get: function() {return "calc(100% - 112px)";}, set: function(){}});'
      + 'if (document.querySelector(".modal-player-cont")) {'
      + 'document.body.prepend(preView);'
      + '} else {'
      + 'document.querySelector("#courseplayer").style.height = "100%";'
      + '}';
    this.watcher = '';
    this.recover = 'var preView = document.querySelector(".modal-player-cont") ? document.querySelector(".modal-player-cont") : document.querySelector("#video-container");'
      + 'preView.style.left = "";'
      + 'preView.style.top = "";'
      + 'preView.style.width = "";'
      + 'preView.style.height = "";'
      + 'preView.style.zIndex = "";'
      + 'preView.style.position = "";'
      + 'preView.style.background = "";'
      + 'document.querySelector(".mejs-captions-layer").style.bottom = "";'
      + 'document.querySelector(".mejs-controls").style.bottom = "";'
      + 'Object.defineProperty(document.querySelector("#mep_0").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector("#mep_0").style.setProperty("width", val);}});'
      + 'Object.defineProperty(document.querySelector("#mep_0").style, "height", {get: function(){return this._height}, set: function(val){this._height = val;document.querySelector("#mep_0").style.setProperty("height", val);}});'
      + 'document.querySelector("#mep_0").style.width = "";'
      + 'document.querySelector("#mep_0").style.height = "";'
      + 'document.body.style.overflow = "";'
      + 'if (document.querySelector(".modal-player-cont")) {'
      + 'document.querySelector(".modal-body").prepend(preView);'
      + '} else {'
      + 'document.querySelector("#courseplayer").style.height = "";'
      + '}';
  }
}
