export default class MasterClass {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'if (document.querySelector(".bc-player__wrapper")) {'
      + 'var player = document.querySelector(".bc-player__wrapper").children[0];'
      + 'player.style.zIndex = "999999";'
      + 'player.style.position = "fixed";'
      + 'document.body.style.overflow = "hidden";'
      + '} else {'
      + 'var player = document.querySelector("#brightcove-popover-player").children[1];'
      + 'document.body.prepend(player);'
      + 'player.style.zIndex = "999999";'
      + 'document.body.style.overflow = "hidden";'
      + '}';
    this.watcher = '';
    this.recover = 'if (document.querySelector(".bc-player__wrapper")) {'
      + 'var player = document.querySelector(".bc-player__wrapper").children[0];'
      + 'player.style.zIndex = "";'
      + 'player.style.position = "";'
      + 'document.body.style.overflow = "";'
      + '} else {'
      + 'var player = document.querySelector("#brightcove-popover-player").children[1];'
      + 'document.querySelector("#brightcove-popover-player").append(player);'
      + 'player.style.zIndex = "";'
      + 'document.body.style.overflow = "";'
      + '}';
  }
}
