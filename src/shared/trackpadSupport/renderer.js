import { Video as videoActions } from '@/store/actionTypes';

class TrackpadWheelManager {
  #_duration = 0;
  set duration(newVal) {
    if (typeof newVal === 'number' && newVal > 0 && Number.isFinite(newVal)) {
      this._duration = newVal;
    }
  }
  get duration() { return this._duration; }

  isTrackpadBegan = false;
  isTrackpadEnd = true;

  direction = '';

  speedMap = {
    slow: {
      trackpad: 20,
      seek: 5,
    },
    normal: {
      trackpad: 250,
      seek: '2.5%',
    },
    fast: {
      trackpad: 250,
      seek: '100%',
    },
  };
  _seekSpeedToSeekSeconds(seekSpeed) {
    if (typeof seekSpeed === 'number') {
      const minimiumSeekSeconds = this.duration / 100 <= 1 ? 1 : this.duration / 100;
      return seekSpeed < minimiumSeekSeconds ? seekSpeed : minimiumSeekSeconds;
    } else if (typeof seekSpeed === 'string') {
      const seekPercent = parseFloat(seekSpeed);
      return (this.duration / 100) * seekPercent;
    }
    return 0;
  }
  trackpadSpeedToSeekSeconds(trackSpeed) {
    let seekSeconds = 5;
    trackSpeed = Math.abs(trackSpeed);
    if (trackSpeed < this.speedMap.slow.trackpad) {
      seekSeconds = this._seekSpeedToSeekSeconds(this.speedMap.slow.seek);
    } else if (trackSpeed < this.speedMap.normal.trackpad) {
      seekSeconds = this._seekSpeedToSeekSeconds(this.speedMap.normal.seek);
    } else if (trackSpeed >= this.speedMap.fast.trackpad) {
      seekSeconds = this._seekSpeedToSeekSeconds(this.speedMap.fast.seek);
    }
    return seekSeconds;
  }

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
            const { ctrlKey, deltaX, deltaY } = event;
            const { isTrackpadBegan, direction } = self;
            if (!ctrlKey) {
              const isTrackPad = isTrackpadBegan && (!!deltaX || !!deltaY);
              if (isTrackPad) {
                if (deltaX && (!direction || direction === 'left' || direction === 'right')) {
                  self.direction = deltaX > 0 ? 'left' : 'right';
                  const seekDelta = self.trackpadSpeedToSeekSeconds(deltaX);
                  this.$bus.$emit(`seek-${deltaX > 0 ? 'backward' : 'forward'}`, seekDelta);
                } else if (deltaY && (!direction || direction === 'up' || direction === 'down')) {
                  self.direction = deltaY > 0 ? 'up' : 'down';
                  this.$store.dispatch(
                    deltaY > 0 ? videoActions.INCREASE_VOLUME : videoActions.DECREASE_VOLUME,
                    Math.abs(deltaY) * 0.06,
                  );
                }
              }
            }
          });
          // even though it's deprecated,
          // but it's necessary for detecting whether it's trackpad or mouse wheel
          document.onmousewheel(({ deltaY }) => {
            this.$store.dispatch(
              deltaY < 0 ? videoActions.INCREASE_VOLUME : videoActions.DECREASE_VOLUME,
              Math.abs(deltaY) * 0.06,
            );
          });
        }
      },
    });
  }
}

export default new TrackpadWheelManager();
