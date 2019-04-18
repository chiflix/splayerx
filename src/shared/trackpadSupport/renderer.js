class TrackpadWheelManager {
  #_duration = 0;
  set duration(newVal) {
    if (typeof newVal === 'number' && newVal > 0 && Number.isFinite(newVal)) {
      console.log('TrackPad:', newVal);
      this._duration = newVal;
    }
  }
  get duration() { return this._duration; }

  isTrackpadBegan = false;
  isTrackpadEnd = true;

  direction = '';

  install(Vue) {
    const self = this;
    Vue.mixin({
      methods: {
        registerDurationWatcher() {
          this.unregisterDurationWatcher = this.$watch(
            () => this.$store.state.Video.duration,
            (newVal) => { self.duration = newVal; },
          );
        },
      },
      created() {
        if (this === this.$root) {
          this.registerDurationWatcher();
          this?.$electron.ipcRenderer.on('scroll-touch-begin', () => {
            self.isTrackpadBegan = true;
            self.isTrackpadEnd = false;
          });
          this?.$electron.ipcRenderer.on('scroll-touch-end', () => {
            self.isTrackpadBegan = false;
            self.isTrackpadEnd = true;
            self.direction = '';
          });

          // eslint-disable-next-line complexity
          document.addEventListener('wheel', (event) => {
            const { ctrlKey } = event;
            const { isTrackpadBegan, direction } = self;
            if (!ctrlKey && isTrackpadBegan) {
              const { deltaX, deltaY } = event;
              if (deltaX && (!direction || direction === 'left' || direction === 'right')) {
                self.direction = deltaX > 0 ? 'left' : 'right';
              } else if (deltaY && (!direction || direction === 'up' || direction === 'down')) {
                self.direction = deltaY > 0 ? 'up' : 'down';
              }
            }
          });
        }
      },
    });
  }
}

export default new TrackpadWheelManager();
