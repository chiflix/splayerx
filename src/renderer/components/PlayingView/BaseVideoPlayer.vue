<template>
  <div
    :data-component-name="$options.name"
    class="base-video-player">
    <video class="video-element" ref="video"></video>
  </div>
</template>

<script>
import _ from 'lodash';
import { DEFAULT_VIDEO_EVENTS } from '@/constants';
export default {
  name: 'base-video-player',
  props: {
    // network state
    src: {
      type: String,
      required: true,
      validator(value) {
        const fileSrcRegexes = [
          RegExp('^(http|https)://'),
          RegExp('^file:///?'),
          RegExp(/^[a-zA-Z]:\/(((?![<>:"//|?*]).)+((?<![ .])\/)?)*$/),
        ];
        return value.length > 0 && fileSrcRegexes.some(rule => rule.test(value));
      },
    },
    crossOrigin: {
      default: null,
      validator: value => [null, 'anonymous', 'user-credentials'].includes(value),
    },
    preload: {
      type: String,
      default: 'metadata',
      validator: value => ['none', 'metadata', 'auto', ''].includes(value),
    },
    // playback state
    currentTime: {
      type: Array,
      default: () => [0],
      validator: value => value[0] >= 0,
    },
    defaultPlaybackRate: {
      type: Number,
      default: 1,
      validator: value => value >= 0 && value <= 16,
    },
    playbackRate: {
      type: Number,
      default: 1,
      validator: value => value > 0 && value <= 16,
    },
    autoplay: {
      type: Boolean,
      default: true,
    },
    loop: {
      type: Boolean,
      default: true,
    },
    // tracks
    currentAudioTrackId: {
      type: String,
      default: '1',
    },
    // controls
    controls: {
      type: Boolean,
      default: false,
    },
    volume: {
      type: Number,
      default: 0.7,
      validator: value => typeof value === 'number' && value >= 0 && value <= 1,
    },
    muted: {
      type: Boolean,
      default: false,
    },
    defaultMuted: {
      type: Boolean,
      default: false,
    },
    // custom
    paused: {
      type: Boolean,
      default: false,
    },
    updateCurrentTime: {
      type: Boolean,
      default: false,
    },
    // video events
    events: {
      type: Array,
      required: true,
      default: () => ['loadedmetadata'],
      validator: value => (
        value.length === 0 ||
        value.every(element => DEFAULT_VIDEO_EVENTS.includes(element))),
    },
    // video style
    styles: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      eventListeners: new Map(),
      currentTimeAnimationFrameId: 0,
      currentAudioTrack: null,
    };
  },
  watch: {
    // network state
    // playback state
    currentTime(newVal) {
      [this.$refs.video.currentTime] = newVal;
    },
    playbackRate(newVal) {
      this.$refs.video.playbackRate = newVal;
    },
    loop(newVal) {
      this.$refs.video.loop = newVal;
    },
    // tracks
    currentAudioTrackId(newVal) {
      const { id } = this.currentAudioTrack;
      if (newVal !== id) {
        this.$refs.audioTracks.forEach((track) => {
          if (track.id === newVal) {
            track.enabled = true;
            const {
              id, kind, label, language, enabled,
            } = track;
            this.$emit('audiotrack', {
              type: 'switch',
              track: {
                id, kind, label, language, enabled,
              },
            });
          } else {
            track.enabled = false;
          }
        });
      }
    },
    // controls
    controls(newVal) {
      this.$refs.video.controls = newVal;
    },
    volume(newVal) {
      this.$refs.video.volume = newVal;
    },
    muted(newVal) {
      this.$refs.video.muted = newVal;
    },
    // custom
    paused(newVal) {
      this.$refs.video[newVal ? 'pause' : 'play']();
    },
    updateCurrentTime(newVal) {
      if (newVal) {
        this.currentTimeAnimationFrameId = requestAnimationFrame(this.currentTimeUpdate);
      } else {
        cancelAnimationFrame(this.currentTimeAnimationFrameId);
      }
    },
    // events
    events(newVal, oldVal) {
      this.addEvents(newVal.filter(event => !oldVal.includes(event)));
      this.removeEvents(oldVal.filter(event => !newVal.includes(event)));
    },
    // styles
    styles(newVal) {
      this.setStyle(newVal);
    },
  },
  mounted() {
    this.basicInfoInitialization(this.$refs.video);
    if (this.updateCurrentTime) {
      this.currentTimeAnimationFrameId = requestAnimationFrame(this.currentTimeUpdate);
    }
    this.addEvents(this.events);
    this.setStyle(this.styles);
  },
  methods: {
    basicInfoInitialization(videoElement) {
      const basicInfo = [
        'src', 'crossOrigin', 'preload',
        'defaultPlaybackRate', 'autoplay',
        'defaultMuted',
      ];
      basicInfo.forEach((settingItem) => {
        videoElement[settingItem] = this[settingItem];
      });
      if (this.paused) {
        videoElement.pause();
      }
    },
    // Video default methods
    videoElement() {
      return this.$refs.video;
    },
    currentTimeUpdate() {
      const { currentTime } = this.$refs.video;
      this.$emit('update:currentTime', currentTime);
      this.currentTimeAnimationFrameId = requestAnimationFrame(this.currentTimeUpdate);
    },
    // helper functions
    emitEvents(event, value) {
      if (event && !value) {
        this.$emit(event);
      } else if (value) {
        this.$emit(event, value);
      }
    },
    addEvents(events) {
      events.forEach((event) => {
        if (!this.eventListeners.has(event)) {
          if (event !== 'audiotrack') {
            const listener = _.partial(this.emitEvents, event);
            this.$refs.video.addEventListener(event, listener);
            this.eventListeners.set(event, listener);
          } else {
            const generateAudioEvent = type => (trackEvent) => {
              const {
                id, kind, label, language, enabled,
              } = trackEvent.track;
              if (type === 'add' && enabled) {
                this.currentAudioTrack = trackEvent.track;
              }
              this.$emit('audiotrack', {
                type,
                track: {
                  id, kind, label, language, enabled,
                },
              });
            };
            this.$refs.video.audioTracks.onaddtrack = generateAudioEvent('add');
            this.$refs.video.audioTracks.onremovetrack = generateAudioEvent('remove');
          }
        }
      });
    },
    removeEvents(events) {
      events.forEach((event) => {
        if (this.eventListeners.has(event)) {
          const listener = this.eventListeners.get(event);
          this.$refs.video.removeEventListener(event, listener);
          this.eventListeners.delete(event);
        }
      });
    },
    setStyle(styles) {
      const style = Object.keys(styles);
      if (style.length > 0) {
        style.forEach((styleName) => {
          this.$refs.video.style[styleName] = styles[styleName];
        });
      }
    },
  },
  beforeDestroy() {
    if (this.updateCurrentTime) {
      cancelAnimationFrame(this.currentTimeAnimationFrameId);
      this.$emit('update:updateCurrentTime', false);
    }
    this.removeEvents(this.events);
  },
};
</script>
<style lang="scss" scoped>
.video-element {
  width: 100%;
  /*
  ** Note:
  ** Adding the opacity properity to solve windows brightness when appling the backdrop-filter.
  ** (This should be fixed in libcc.)
  */
  opacity: 0.9999;
  object-fit: cover;
}
</style>
