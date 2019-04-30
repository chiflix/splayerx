
const videodata = {
  tick: 0,
  paused: false, // the video is paused or playing.
  checktickid: null,
  /*
   * The onTick MUST BE use to compute the UI states.
   * When the video is playing the ontick is triggered by ontimeupdate of Video tag,
   * else it is triggered by setInterval.
  */

  onTick: () => {},
  set time(val) {
    this.tick = val;
    this.onTick();
  },
  get time() { return this.tick; },
  checkTick() {
    if (this.checktickid) {
      clearInterval(this.checktickid);
    }
    // we don't care this interval,
    // it is only working when the video isn't playing.
    this.checktickid = setInterval(() => {
      videodata.paused && videodata.onTick();
    }, 200);
  },
  stopCheckTick() {
    if (this.checktickid) {
      clearInterval(this.checktickid);
      this.checktickid = null;
    }
  },
};

export { videodata };
