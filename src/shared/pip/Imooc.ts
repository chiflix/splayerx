export default class Imooc {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var player = document.querySelector("#video-box-mocoplayer");'
      + 'player.style.position = "fixed";'
      + 'player.style.left = "0";'
      + 'player.style.top = "0";'
      + 'player.style.zIndex = "999999";'
      + 'document.body.style.overflow = "hidden";'
      + 'document.querySelector("#header").style.display = "none";';
    this.watcher = '';
    this.recover = 'var player = document.querySelector("#video-box-mocoplayer");'
      + 'player.style.position = "";'
      + 'player.style.left = "";'
      + 'player.style.top = "";'
      + 'player.style.zIndex = "";'
      + 'document.body.style.overflow = "";'
      + 'document.querySelector("#header").style.display = "";';
  }
}
