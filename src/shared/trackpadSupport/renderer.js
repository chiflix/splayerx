class TrackpadWheelManager {
  #_duration = 0;
  set duration(newVal) {
    if (typeof newVal === 'number' && newVal > 0 && Number.isFinite(newVal)) {
      console.log('TrackPad:', newVal);
      this._duration = newVal;
    }
  }
  get duration() { return this._duration; }

  install(Vue) {
    const self = this;
    Vue.mixin({
      methods: {
        registerDurationWatcher() {
          // console.log('TrackPad: hahaha.');
          // console.log(this.$store.state.Video.duration);
          this.unregisterDurationWatcher = this.$watch(
            () => this.$store.state.Video.duration,
            (newVal) => { self.duration = newVal; },
          );
        },
      },
      created() {
        if (this === this.$root) this.registerDurationWatcher();
      },
      destoryed() {
        if (this === this.$root && typeof this.unregisterDurationWatcher === 'function') {
          this.unregisterDurationWatcher();
        }
      },
    });
  }
}

export default new TrackpadWheelManager();
