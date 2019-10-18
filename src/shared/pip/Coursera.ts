export default class Coursera {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var player = document.querySelector(".video-main-player-container") ? document.querySelector(".video-main-player-container") : document.querySelector("video").parentElement;'
      + 'player.style.zIndex= "999999";'
      + 'player.style.position = "fixed";'
      + 'if (document.querySelector(".video-main-player-container")) {'
      + 'player.style.display = "block";'
      + 'player.style.width = "100%";'
      + 'player.style.height = "100%";'
      + 'player.style.left = "0";'
      + 'player.style.top = "0";'
      + 'player.children[0].style.paddingTop = "0";'
      + 'player.children[0].style.height = "100%";'
      + 'document.querySelector(".rc-ItemHeader").style.display = "none";'
      + '}'
      + 'document.body.style.overflow = "hidden";';
    this.watcher = '';
    this.recover = 'var player = document.querySelector(".video-main-player-container") ? document.querySelector(".video-main-player-container") : document.querySelector("video").parentElement;'
      + 'player.style.zIndex= "";'
      + 'if (document.querySelector(".video-main-player-container")) {'
      + 'player.style.position = "";'
      + 'player.style.width = "";'
      + 'player.style.height = "";'
      + 'player.style.left = "";'
      + 'player.style.top = "";'
      + 'player.children[0].style.paddingTop = "";'
      + 'player.children[0].style.height = "";'
      + 'document.querySelector(".rc-ItemHeader").style.display = "";'
      + '} else {'
      + 'player.style.position = "absolute";'
      + '}'
      + 'document.body.style.overflow = "";';
  }
}
