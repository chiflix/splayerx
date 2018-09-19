<template>
  <div
    :data-component-name="$options.name"
    class="base-video-player">
    <video class="video-element" ref="video"></video>
  </div>
</template>

<script>
import { DEFAULT_VIDEO_EVENTS } from '@/constants';
export default {
  name: 'base-video-player',
  props: {
    playbackRate: {
      type: Number,
      default: 1,
      validator: value => value > 0 && value <= 100,
    },
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
    volume: {
      type: Number,
      default: 0.7,
      validator: value => typeof value === 'number' && value >= 0 && value <= 1,
    },
    defaultEvents: {
      type: Array,
      required: true,
      default: () => ([
        'loadedmetadata',
      ]),
      validator: value => Array.isArray(value) && (
        value.length === 0 ||
        value.every(element => DEFAULT_VIDEO_EVENTS.indexOf(element) !== -1)),
    },
    defaultOptions: {
      type: Object,
      default: () => ({
        autoplay: true,
        crossOrigin: false,
        defaultMuted: false,
        defaultPlaybackRate: 1,
        loop: false,
        // mediaGroup: null,
        muted: false,
        preload: 'auto',
      }),
    },
    customOptions: {
      type: Object,
      default: () => ({
        pauseOnStart: false,
        commitToVuex: false,
      }),
    },
    styleObject: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      onEdEvents: [],
    };
  },
  watch: {
    playbackRate(newValue) {
      this.$refs.video.setAttribute('playbackrate', newValue);
    },
    src(newValue) {
      if (this.$options.props.src.validator(newValue)) {
        this.$refs.video.setAttribute('src', newValue);
      }
    },
    volume(newValue) {
      if (this.$options.props.volume.validator(newValue)) {
        this.$refs.video.setAttribute('volume', newValue);
      }
    },
  },
  mounted() {
    this.initializeVideoPlayer();
  },
  methods: {
    initializeVideoPlayer() {
      this.basicInfoInitialization(this.$refs.video);
      this.onEdEvents = this.defaultEventsInitialization(
        this.defaultEvents,
        this.$refs.video,
      );
      this.defaultOptionsInitialization(this.defaultOptions, this.$refs.video);
      this.customOptionsInitialization(this.customOptions, this.$refs.video);
      this.initializeStyleObject(this.styleObject);
    },
    basicInfoInitialization(videoElement) {
      videoElement.setAttribute('playbackRate', this.playbackRate);
      videoElement.setAttribute('src', this.src);
      videoElement.setAttribute('volume', this.volume);
      return videoElement;
    },
    defaultEventsInitialization(eventsArray) {
      // Watch default events
      const onEdEvents = [];
      eventsArray.forEach((event) => {
        if (DEFAULT_VIDEO_EVENTS.indexOf(event) !== -1) {
          // this.$on(event, this.emitPlayerState(event));
          this.$refs.video.addEventListener(event, (value) => {
            this.emitPlayerState(event, value);
          });
          onEdEvents.push(event);
        }
      });
      return onEdEvents;
    },
    emitPlayerState(event, value) {
      if (event && !value) {
        this.$emit(event);
      } else if (value) {
        this.$emit(event, { [event]: value });
      }
    },
    defaultOptionsInitialization(optionsObject, videoElement) {
      Object.keys(optionsObject).forEach((optionName) => {
        videoElement.setAttribute(optionName, optionsObject[optionName]);
      });
    },
    customOptionsInitialization(optionsObject, videoElement) {
      if (optionsObject.pauseOnStart) {
        videoElement.addEventListener('loadedmetadata', this.pause);
      }
    },
    initializeStyleObject(styleObject) {
      const style = Object.keys(styleObject);
      if (style.length > 0) {
        style.forEach((styleName) => {
          this.$refs.video.style[styleName] = styleObject[styleName];
        });
      }
    },
    // Video default methods
    videoElement() {
      return this.$refs.video;
    },
    pause() {
      this.$refs.video.pause();
    },
    currentTime(value) {
      if (value) {
        this.$refs.video.currentTime = value;
      }
      return this.$refs.video.currentTime;
    },
    duration() {
      return this.$refs.video.duration;
    },
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
