<template>
  <div class="base-video-player">
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
      validator: value => value !== 0 && value <= 100,
    },
    src: {
      type: String,
      required: true,
      default: ' ',
      validator: value => value.length > 0,
    },
    volume: {
      type: Number,
      default: 0.7,
      validator: value => value >= 0 && value <= 10,
    },
    defaultEvents: {
      type: Array,
      required: true,
      validator: value => value.every(event => DEFAULT_VIDEO_EVENTS.indexOf(event) !== -1),
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
  },
  data() {
    return {
      onEdEvents: [],
    };
  },
  watch: {
    currentTime(newValue) {
      console.log('[BaseVideoPlayer|CurrentTime]:', newValue);
      this.$refs.video.currentTime = newValue;
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
    },
    basicInfoInitialization(videoElement) {
      videoElement.setAttribute('currentTime', this.currentTime);
      videoElement.setAttribute('playbackRate', this.playbackRate);
      videoElement.setAttribute('src', this.src);
      videoElement.setAttribute('volume', this.volume);
    },
    defaultEventsInitialization(eventsArray) {
      // Watch default events
      const onEdEvents = [];
      eventsArray.forEach((event) => {
        this.$on(event, this.emitPlayerState(event));
        onEdEvents.push(event);
      });
      console.log('[BaseVideoPlayer|Events]:', onEdEvents);
      return onEdEvents;
    },
    emitPlayerState(event, value) {
      if (event) {
        this.$emit(event);
      }
      if (value) {
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
        videoElement.addEventListener('loadedmetadata', (event) => {
          event.target.pause();
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
video {
  object-fit: contain;
  width: 240px;
  height: 135px;
}
</style>

