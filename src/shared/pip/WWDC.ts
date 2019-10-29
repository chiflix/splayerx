export default class WWDC {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var player = document.querySelector("video");'
      + 'document.body.prepend(player);'
      + 'player.style.position = "fixed";'
      + 'player.style.height = "100%";'
      + 'player.style.zIndex= "999999";'
      + 'player.style.background = "black";'
      + 'document.body.style.overflow = "hidden";';
    this.watcher = '';
    this.recover = 'var player = document.querySelector("video");'
      + 'document.getElementsByClassName("column large-10 small-12  padding-top-small padding-bottom-small large-centered")[0].prepend(player);'
      + 'player.style.position = "";'
      + 'player.style.height = "";'
      + 'player.style.zIndex= "";'
      + 'player.style.background = "";'
      + 'document.body.style.overflow = "";';
  }
}
