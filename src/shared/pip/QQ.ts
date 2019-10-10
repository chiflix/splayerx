export function QQVideoPause(type: string) {
  if (['normal', 'hotVideo'].includes(type)) {
    return 'document.querySelector(".mod_player").getElementsByTagName("video")[0].pause();';
  }
  return 'document.querySelector(".poplayer_quickplay").getElementsByTagName("video")[0].pause();';
}

export default class QQ {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(type: string, barrageState: boolean) {
    if (type === 'normal') {
      this.adapter = `var player = document.querySelector(".txp_player");
        ${this.barrageAdapt(barrageState)}
        player.style.position = "fixed";
        player.style.top = "0";
        player.style.left = "0";
        player.style.zIndex = "999999";
        document.querySelector(".site_head").style.display  = "none";
        var mod = document.querySelector(".mod_action");
        if (mod) mod.style.display  = "none";
        document.body.style.overflow = "hidden";
        document.querySelector(".txp_ad_link").style.webkitUserDrag = "none";
        var tools = document.querySelector(".x_fixed_tool");
        if (tools) tools.style.display = "none";
        document.querySelector(".txp_top_btns").style.display = "none";`;
      this.watcher = '';
      this.recover = 'var player = document.querySelector(".txp_player");'
        + 'player.style.position = "relative";'
        + 'player.style.top = "";'
        + 'player.style.left = "";'
        + 'player.style.zIndex = "";'
        + 'document.querySelector(".site_head").style.display  = "";'
        + 'var mod = document.querySelector(".mod_action");'
        + 'if (mod) mod.style.display  = "";'
        + 'var hotVideoModule = document.querySelector("#multi_feed_V");'
        + 'if (hotVideoModule) hotVideoModule.style.zIndex = "999999";'
        + 'var hotVideo = document.querySelector("#mod_player_multi_feed_V");'
        + 'if (hotVideo) hotVideo.style.zIndex = "999999";'
        + 'document.body.style.overflow = "";'
        + 'document.querySelector(".txp_ad_link").style.webkitUserDrag = "";'
        + 'var tools = document.querySelector(".x_fixed_tool");'
        + 'if (tools) tools.style.display = "";'
        + 'document.querySelector(".txp_top_btns").style.display = "";'
        + 'if (wideMode) { container.classList.add("player_container_wide"); }';
    } else if (type === 'hotVideo') {
      this.adapter = 'var player = document.querySelector(".txp_player");'
        + 'player.style.position = "fixed";'
        + 'player.style.top = "0";'
        + 'player.style.left = "0";'
        + 'player.style.width = "100%";'
        + 'player.style.height = "100%";'
        + 'player.style.zIndex = "999999";'
        + 'document.querySelector(".site_head").style.display  = "none";'
        + 'var mod = document.querySelector(".mod_action");'
        + 'if (mod) mod.style.display  = "none";'
        + 'var hotVideoModule = document.querySelector("#multi_feed_V");'
        + 'if (hotVideoModule) hotVideoModule.style.zIndex = "999999";'
        + 'var hotVideo = document.querySelector("#mod_player_multi_feed_V");'
        + 'if (hotVideo) hotVideo.style.zIndex = "999999";'
        + 'document.body.style.overflow = "hidden";'
        + 'document.querySelector(".txp_ad_link").style.webkitUserDrag = "none";'
        + 'var tools = document.querySelector(".x_fixed_tool");'
        + 'if (tools) tools.style.display = "none";'
        + 'document.querySelector(".txp_top_btns").style.display = "none";';
      this.watcher = '';
      this.recover = 'var player = document.querySelector(".txp_player");'
        + 'player.style.position = "relative";'
        + 'player.style.top = "";'
        + 'player.style.left = "";'
        + 'player.style.zIndex = "";'
        + 'player.style.width = "";'
        + 'player.style.height = "";'
        + 'document.querySelector(".site_head").style.display  = "";'
        + 'var mod = document.querySelector(".mod_action");'
        + 'if (mod) mod.style.display  = "";'
        + 'var hotVideoModule = document.querySelector("#multi_feed_V");'
        + 'if (hotVideoModule) hotVideoModule.style.zIndex = "999999";'
        + 'var hotVideo = document.querySelector("#mod_player_multi_feed_V");'
        + 'if (hotVideo) hotVideo.style.zIndex = "999999";'
        + 'document.body.style.overflow = "";'
        + 'document.querySelector(".txp_ad_link").style.webkitUserDrag = "";'
        + 'var tools = document.querySelector(".x_fixed_tool");'
        + 'if (tools) tools.style.display = "";'
        + 'document.querySelector(".txp_top_btns").style.display = "";';
    } else {
      this.adapter = 'var player = document.querySelector(".quickplay_player").children[0];'
        + 'player.style.position = "fixed";'
        + 'player.style.left = "0";'
        + 'player.style.top = "0";'
        + 'player.style.zIndex = "999999";'
        + 'player.style.width = "100%";'
        + 'player.style.height = "100%";'
        + 'Object.defineProperty(player.style, "width", {get: function(){return "100%"}, set: function(){}});'
        + 'Object.defineProperty(player.style, "height", {get: function(){return "100%"}, set: function(){}});';
      this.watcher = '';
      this.recover = 'var player = document.querySelector(".quickplay_player").children[0];'
        + 'player.style.position = "relative";'
        + 'player.style.left = "";'
        + 'player.style.top = "";'
        + 'player.style.zIndex = "";'
        + 'Object.defineProperty(player.style, "width", {get: function(){return this._width}, set: function(val){this._width = val;player.style.setProperty("width", val);}});'
        + 'Object.defineProperty(player.style, "height", {get: function(){return this._height}, set: function(val){this._height = val;player.style.setProperty("height", val);}});';
    }
  }

  public barrageAdapt(barrageState: boolean) {
    return `document.querySelector('.txp_barrage .txp_barrage_external').parentElement.style.display = ${barrageState} ? "" : "none";`;
  }
}

export const QQFindType = 'if (!document.querySelector(".poplayer_quickplay").classList.value.includes("none")) { "quickPlay" } else if (document.querySelector("#multi_feed_V")) { "hotVideo" } else { "normal" }';
