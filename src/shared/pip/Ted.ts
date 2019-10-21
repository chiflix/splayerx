export default class Ted {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var player = document.querySelector("#ted-player").parentElement;'
      + 'player.style.position = "fixed";'
      + 'player.style.zIndex= "999999";'
      + 'document.body.style.overflow = "hidden";';
    this.watcher = '';
    this.recover = 'var player = document.querySelector("#ted-player").parentElement;'
      + 'player.style.position = "absolute";'
      + 'player.style.zIndex= "";'
      + 'document.body.style.overflow = "";';
  }
}
