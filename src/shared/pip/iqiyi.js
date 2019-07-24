export function iqiyiBarrageAdapt(barrageState) {
  return `document.getElementsByClassName("iqp-barrage")[document.getElementsByClassName("iqp-barrage").length - 1].style.opacity = ${barrageState} ? "1" : "0";`;
}

const iqiyi = (barrageState, winSize) => ({
  adapter: `document.body.style.overflow = "hidden";
    var header = document.querySelector(".qy-header");
    if (header) header.style.display = "none";
    ${iqiyiBarrageAdapt(barrageState)}
    var iqpPlayer = document.querySelector(".iqp-player");
    iqpPlayer.style.position = "fixed";
    iqpPlayer.style.left = "0";
    iqpPlayer.style.top = "0";
    iqpPlayer.style.zIndex="9999";
    iqpPlayer.style.width="${winSize[0]}px";
    iqpPlayer.style.height="${winSize[1] - 1}px";
    var blockA = document.querySelector(".player-mnc");
    if (blockA) {blockA.style.zIndex = "9999";};
    var blockB = document.querySelector("#block-W1");
    if (blockB) {blockB.style.display = "none"};`,
  watcher: `document.querySelector(".iqp-player").style.width="${winSize[0]}px";document.querySelector(".iqp-player").style.height="${winSize[1] - 1}px"`,
  recover: 'var iqpPlayer = document.querySelector(".iqp-player");'
    + 'iqpPlayer.style.position = "relative";'
    + 'iqpPlayer.style.left = "";'
    + 'iqpPlayer.style.top = "";'
    + 'iqpPlayer.style.zIndex="0";'
    + 'var header = document.querySelector(".qy-header");'
    + 'if (header) header.style.display = "";'
    + 'document.getElementsByClassName("iqp-barrage")[document.getElementsByClassName("iqp-barrage").length - 1].style.opacity = "1";'
    + 'document.body.style.overflow = "";'
    + 'iqpPlayer.style.width="100%";'
    + 'iqpPlayer.style.height="100%";var blockA = document.querySelector(".player-mnc");'
    + 'if (blockA) {blockA.style.zIndex = "";};'
    + 'var blockB = document.querySelector("#block-W1");'
    + 'if (blockB) {blockB.style.display = ""};',
});

export default iqiyi;
