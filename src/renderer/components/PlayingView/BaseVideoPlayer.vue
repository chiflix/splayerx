<template>
  <div
    :data-component-name="$options.name"
    class="base-video-player">
    <video class="video-element" ref="video"></video>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import _ from 'lodash';
import { DEFAULT_VIDEO_EVENTS } from '@/constants';
import { videodata } from '../../store/video';

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
    // VideoCanvas and ThumbnailVideoPlayer both use the the BaseVideoPlayer.
    // The VideoCanvas provides the main video as a player, it needs to
    // care the ontimeupdate callback to render the time-bar, so need
    // the needtimeupdate tag.
    needtimeupdate: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters(['audioTrackList']),
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
      [this.$refs.video.currentTime] = newVal || 0;

      // update the seek time
      if (this.needtimeupdate) {
        videodata.time = this.$refs.video.currentTime;
      }
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
        this.audioTrackList.forEach((track) => {
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
      // update the play state
      videodata.paused = newVal;
      this.$refs.video[newVal ? 'pause' : 'play']();
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
    this.addEvents(this.events);
    this.setStyle(this.styles);
    if (this.needtimeupdate) {
      // reset paused state to play a new video
      videodata.paused = false;
      this.$refs.video.ontimeupdate = this.currentTimeUpdate;
    }
  },
  methods: {
    basicInfoInitialization(videoElement) {
      const basicInfo = [
        'src', 'crossOrigin', 'preload',
        'defaultPlaybackRate', 'autoplay',
        'defaultMuted', 'muted', 'volume',
      ];
      basicInfo.forEach((settingItem) => {
        videoElement[settingItem] = this[settingItem];
      });
      // following code is to make preview-thumbnail pause
      if (this.paused) {
        videoElement.pause();
      }
    },
    // Video default methods
    videoElement() {
      return this.$refs.video;
    },
    currentTimeUpdate() {
      videodata.time = this.$refs.video.currentTime;
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
    this.$refs.video.ontimeupdate = null;
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
  object-fit: cover;
}
</style>
