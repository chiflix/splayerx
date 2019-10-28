export default class MasterClass {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var navHeader = document.querySelector(".header-nav");'
      + 'navHeader.style.display = "none";'
      + 'var pip = document.querySelector(".txp_top_btns");'
      + 'if (pip) pip.style.display = "none";'
      + 'var nav = document.querySelector(".nav_simplify");'
      + 'if (nav) {nav.style.display = "none";}'
      + 'var header = document.querySelector("#ct-nba-header-a");'
      + 'if (header) {header.style.display = "none";}'
      + 'var player = document.querySelector(".txp_player");'
      + 'player.style.position = "fixed";'
      + 'player.style.width = "100%";'
      + 'player.style.height = "100%";'
      + 'player.style.left = "0";'
      + 'player.style.top = "0";'
      + 'player.style.zIndex = "999999";'
      + 'var ad = document.querySelector(".txp_ad_link");'
      + 'ad.style.webkitUserDrag = "none";'
      + 'Object.defineProperty(player.style, "height", { get: function() {return "100%";}, set: function(){}});'
      + 'document.body.style.overflow = "hidden";'
      + 'if (document.querySelector("#mercury")) {document.querySelector("#mercury").style.display = "none";}';
    this.watcher = '';
    this.recover = 'var navHeader = document.querySelector(".header-nav");'
      + 'navHeader.style.display = "";'
      + 'var pip = document.querySelector(".txp_top_btns");'
      + 'if (pip) pip.style.display = "";'
      + 'var nav = document.querySelector(".nav_simplify");'
      + 'if (nav) {nav.style.display = "";}'
      + 'var header = document.querySelector("#ct-nba-header-a");'
      + 'if (header) {header.style.display = "";}'
      + 'var player = document.querySelector(".txp_player");'
      + 'player.style.position = "";'
      + 'player.style.width = "100%";'
      + 'player.style.left = "";'
      + 'player.style.top = "";'
      + 'player.style.zIndex = "";'
      + 'var ad = document.querySelector(".txp_ad_link");'
      + 'ad.style.webkitUserDrag = "";'
      + 'Object.defineProperty(player.style, "height", {get: function(){return this._height}, set: function(val){this._height = val;player.style.setProperty("height", val);}});'
      + 'player.style.height = document.querySelector(".videoPlayerMini") ? "225px" : document.querySelector("#ve0032q80qif_wrap") ? document.querySelector("#ve0032q80qif_wrap").style.height : "";'
      + 'document.body.style.overflow = "";'
      + 'if (document.querySelector("#mercury")) {document.querySelector("#mercury").style.display = "";}';
  }
}
