export default class Youku {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(barrageState: boolean) {
    console.log(barrageState, 111);
    this.adapter = `var player = document.querySelector("#ykPlayer");
      ${this.barrageAdapt(barrageState)}
      player.style.position = "fixed";
      player.style.left = "0";
      player.style.top = "0";
      player.style.width = "100%";
      player.style.zIndex = "999999";
      document.body.style.overflow = "hidden";`;
    this.watcher = '';
    this.recover = 'var player = document.querySelector("#ykPlayer");'
      + 'player.style.position = "";'
      + 'player.style.left = "";'
      + 'player.style.top = "";'
      + 'player.style.width = "";'
      + 'player.style.zIndex = "";'
      + 'document.body.style.overflow = "";';
  }

  public barrageAdapt(barrageState: boolean) {
    return `document.querySelector('.yk-player-danmu').style.opacity = ${barrageState} ? "1" : "0";`;
  }
}
