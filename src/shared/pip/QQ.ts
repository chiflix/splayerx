export function QQVideoPause() {
  return 'document.querySelector("video").pause();var timer = setInterval(() => { const pause = document.querySelector(".pause-81a5c3"); if (pause) { clearInterval(timer);pause.click(); } }, 100);';
}

export default class QQ {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var player = document.querySelector(".txp_player");'
      + 'player.style.position = "fixed";'
      + 'player.style.top = "0";'
      + 'player.style.left = "0";'
      + 'player.style.zIndex = "9999999";'
      + 'document.querySelector(".site_head").style.display  = "none";'
      + 'document.querySelector(".mod_action").style.display  = "none";'
      + 'document.body.style.overflow = "hidden";'
      + 'document.querySelector(".txp_ad_link").style.webkitNoDrag = "none";'
      + 'var tools = document.querySelector(".x_fixed_tool");'
      + 'if (tools) tools.style.display = "none";'
      + 'document.querySelector(".txp_top_btns").style.display = "none";';
    this.watcher = '';
    this.recover = 'var player = document.querySelector(".txp_player");'
      + 'player.style.position = "relative";'
      + 'player.style.top = "";'
      + 'player.style.left = "";'
      + 'player.style.zIndex = "";'
      + 'document.querySelector(".site_head").style.display  = "";'
      + 'document.querySelector(".mod_action").style.display  = "";'
      + 'document.body.style.overflow = "";'
      + 'document.querySelector(".txp_ad_link").style.webkitNoDrag = "";'
      + 'var tools = document.querySelector(".x_fixed_tool");'
      + 'if (tools) tools.style.display = "";'
      + 'document.querySelector(".txp_top_btns").style.display = "";';
  }
}

export const QQFindType = 'if (document.querySelector(".poplayer_quickplay").classList.value.includes("none")) { "quickPlay" } else { "normal" }';
