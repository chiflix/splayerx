export default class Youku {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(barrageState: boolean) {
    this.adapter = `var player = document.querySelector("#ykPlayer");
      ${this.barrageAdapt(barrageState)}
      player.style.position = "fixed";
      player.style.left = "0";
      player.style.top = "0";
      player.style.width = "100%";
      player.style.zIndex = "999999";
      player.style.maxWidth = "100%";
      player.style.maxHeight = "100%";
      document.body.style.overflow = "hidden";
      var pip = document.querySelector(".minisize-layer")
      if (pip) pip.style.pointerEvents = "none";`;
    this.watcher = '';
    this.recover = 'var player = document.querySelector("#ykPlayer");'
      + 'player.style.position = "";'
      + 'player.style.left = "";'
      + 'player.style.top = "";'
      + 'player.style.width = "";'
      + 'player.style.zIndex = "";'
      + 'player.style.maxWidth = "";'
      + 'player.style.maxHeight = "";'
      + 'document.body.style.overflow = "";'
      + 'var pip = document.querySelector(".minisize-layer");'
      + 'if (pip) pip.style.pointerEvents = "auto";';
  }

  public barrageAdapt(barrageState: boolean) {
    return `var danmu = document.querySelector('.yk-player-danmu'); if (danmu) danmu.style.opacity = ${barrageState} ? "1" : "0";`;
  }
}
