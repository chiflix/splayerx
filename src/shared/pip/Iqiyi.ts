export default class Iqiyi {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor(barrageState: boolean, winSize: number[]) {
    this.adapter = `document.body.style.overflow = "hidden";
      var header = document.querySelector(".qy-header");
      if (header) header.style.display = "none";
      ${this.barrageAdapt(barrageState)}
      var iqpPlayer = document.querySelector(".iqp-player");
      var screenShots = document.querySelector(".iqp-screenshot");
      if (screenShots) screenShots.style.display = "none";
      document.scrollingElement.scrollTop = 0;
      iqpPlayer.addEventListener('mouseleave', () => { document.querySelector(".iqp-bottom").parentElement.classList.add('iqp-bottom-hide'); });
      iqpPlayer.style.position = "fixed";
      iqpPlayer.style.left = "0";
      iqpPlayer.style.top = "0";
      iqpPlayer.style.zIndex="9999";
      iqpPlayer.style.width="${winSize[0]}px";
      iqpPlayer.style.height="${winSize[1]}px";
      var blockA = document.querySelector(".player-mnc");
      if (blockA) {blockA.style.zIndex = "9999";};
      var blockB = document.querySelector("#block-W1");
      if (blockB) {blockB.style.display = "none"};`;
    this.watcher = `document.querySelector(".iqp-player").style.width="${winSize[0]}px";document.querySelector(".iqp-player").style.height="${winSize[1]}px"`;
    this.recover = `${this.barrageAdapt(barrageState)}
      var iqpPlayer = document.querySelector(".iqp-player");
      iqpPlayer.style.position = "relative";
      iqpPlayer.style.left = "";
      iqpPlayer.style.top = "";
      iqpPlayer.style.zIndex="0";
      var header = document.querySelector(".qy-header");
      if (header) header.style.display = "";
      var screenShots = document.querySelector(".iqp-screenshot");
      if (screenShots) screenShots.style.display = "";
      document.getElementsByClassName("iqp-barrage")[document.getElementsByClassName("iqp-barrage").length - 1].style.opacity = "1";
      document.body.style.overflow = "";
      iqpPlayer.style.width="100%";
      iqpPlayer.style.height="100%";var blockA = document.querySelector(".player-mnc");
      if (blockA) {blockA.style.zIndex = "";};
      var blockB = document.querySelector("#block-W1");
      if (blockB) {blockB.style.display = ""};`;
  }

  public barrageAdapt(barrageState: boolean) {
    return `document.getElementsByClassName("iqp-barrage")[document.getElementsByClassName("iqp-barrage").length - 1].style.opacity = ${barrageState} ? "1" : "0";`;
  }
}

export const iqiyiFindType = 'var r = { barrageState: !document.getElementsByClassName("barrage-switch barrage-switch-open").length }';
