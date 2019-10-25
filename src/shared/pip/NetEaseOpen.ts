export default class NetEase {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var player = document.querySelector(".video-main").children[0];'
      + 'player.style.position = "fixed";'
      + 'player.style.width = "100%";'
      + 'player.style.height = "100%";'
      + 'player.style.left = "0";'
      + 'player.style.top = "0";'
      + 'player.style.zIndex = "999999";'
      + 'document.body.style.overflow = "hidden";';
    this.watcher = '';
    this.recover = 'var player = document.querySelector(".video-main").children[0];'
      + 'player.style.position = "";'
      + 'player.style.width = "";'
      + 'player.style.height = "";'
      + 'player.style.left = "";'
      + 'player.style.top = "";'
      + 'player.style.zIndex = "";'
      + 'document.body.style.overflow = "";';
  }
}
