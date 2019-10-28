export default class Icourse163 {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var player = document.querySelector(".um-live-live-pc");'
      + 'player.style.position = "fixed";'
      + 'player.style.zIndex = "999999";'
      + 'document.body.style.overflow = "hidden";'
      + 'document.querySelector(".um-live-live-pc_player").style.position = "fixed";'
      + 'document.querySelector(".um-live-live-pc_player").style.width = "100%";';
    this.watcher = '';
    this.recover = 'var player = document.querySelector(".um-live-live-pc");'
      + 'player.style.position = "";'
      + 'player.style.zIndex = "";'
      + 'document.body.style.overflow = "";'
      + 'document.querySelector(".um-live-live-pc_player").style.position = "";'
      + 'document.querySelector(".um-live-live-pc_player").style.width = "";';
  }
}
