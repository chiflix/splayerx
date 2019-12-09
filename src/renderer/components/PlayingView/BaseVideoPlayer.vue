<template>
  <div class="base-video-player">
    <video
      id="play-video"
      ref="video"
      @error="handleError"
      class="video-element"
    />
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import _ from 'lodash';
import { DEFAULT_VIDEO_EVENTS } from '@/constants';
import { addBubble } from '@/helpers/notificationControl';
import { ENOENT } from '@/helpers/notificationcodes';
import { log } from '@/libs/Log';
import { videodata } from '../../store/video';

export default {
  name: 'BaseVideoPlayer',
  props: {
    // network state
    src: {
      type: String,
      required: true,
      validator(value: string) {
        const fileSrcRegexes = [
          RegExp('^(http|https)://'),
          RegExp('^file:///?'),
          RegExp(/^[a-zA-Z]:\\[\\\S|*\S]?.*$/),
        ];
        const valid = value.length > 0 && fileSrcRegexes.some(rule => rule.test(value));
        if (!valid) log.debug('BaseVideoPlayer props.src.validator', value);
        return valid;
      },
    },
    crossOrigin: {
      default: null,
      validator: (value: string) => [null, 'anonymous', 'user-credentials'].includes(value),
    },
    lastAudioTrackId: {
      type: Number,
      default: 0,
    },
    preload: {
      type: String,
      default: 'metadata',
      validator: (value: string) => ['none', 'metadata', 'auto', ''].includes(value),
    },
    // playback state
    currentTime: {
      type: Array,
      default: () => [0],
      validator: (value: number[]) => Number.isFinite(value[0]),
    },
    playbackRate: {
      type: Number,
      default: 1,
      validator: (value: number) => value > 0 && value <= 16,
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
      validator: (value: number) => typeof value === 'number' && value >= 0 && value <= 5,
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
      validator: (value: string[]) => (
        value.length === 0
        || value.every(element => DEFAULT_VIDEO_EVENTS.includes(element))),
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
  data() {
    return {
      eventListeners: new Map(),
      currentTimeAnimationFrameId: 0,
      duration: 0,
    };
  },
  computed: {
    ...mapGetters(['audioTrackList']),
  },
  watch: {
    // network state
    // playback state
    currentTime(newVal: number[]) {
      // calculate the seek time
      let [finalSeekTime] = newVal;
      if (finalSeekTime < 0 || !newVal || !finalSeekTime) finalSeekTime = 0;
      else if (finalSeekTime > this.duration) finalSeekTime = this.duration;
      // seek the video
      if (Number.isFinite(finalSeekTime)) {
        this.$refs.video.currentTime = finalSeekTime;
      } else {
        log.warn('BaseVideoPlayer', `Invalid currentTime: ${JSON.stringify(finalSeekTime)}`);
      }
      // update the seek time
      if (this.needtimeupdate) {
        videodata.time = this.$refs.video.currentTime;
      }
    },
    playbackRate(newVal: number) {
      this.$refs.video.playbackRate = newVal;
    },
    loop(newVal: boolean) {
      this.$refs.video.loop = newVal;
    },
    // tracks
    currentAudioTrackId(newVal: string, oldVal: string) {
      if (parseInt(oldVal, 10) !== -1) {
        for (let i = 0; i < this.$refs.video.audioTracks.length; i += 1) {
          this.$refs.video.audioTracks[i].enabled = this.$refs.video.audioTracks[i].id === newVal;
        }
        this.$bus.$emit('seek', videodata.time);
      }
    },
    // controls
    controls(newVal: boolean) {
      this.$refs.video.controls = newVal;
    },
    volume(newVal: number) {
      if (newVal <= 1) this.$refs.video.volume = newVal;
    },
    muted(newVal: boolean) {
      this.$refs.video.muted = newVal;
    },
    // custom
    async paused(newVal: boolean) {
      // update the play state
      videodata.paused = newVal;
      try {
        const action = newVal ? 'pause' : 'play';
        log.info(action, this.$refs.video.src); // TODO: debugging SPLAYER-1A
        await this.$refs.video[action]();
      } catch (ex) {
        log.warn('play video error', ex);
        addBubble(ENOENT);
      }
    },
    // events
    events(newVal: string[], oldVal: string[]) {
      this.addEvents(newVal.filter((event: string) => !oldVal.includes(event)));
      this.removeEvents(oldVal.filter((event: string) => !newVal.includes(event)));
    },
    // styles
    styles(newVal: Record<string, string>) {
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
    this.duration = this.$refs.video.duration;
  },
  beforeDestroy() {
    this.$refs.video.ontimeupdate = null;
    this.removeEvents(this.events);
  },
  methods: {
    basicInfoInitialization(videoElement: HTMLVideoElement) {
      const basicInfo = [
        'src', 'crossOrigin', 'preload',
        'playbackRate', 'autoplay',
        'defaultMuted', 'muted', 'volume', 'loop',
      ];
      basicInfo.forEach((settingItem) => {
        if (settingItem === 'volume' && this.volume >= 1) videoElement.volume = 1;
        else videoElement[settingItem] = this[settingItem];
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
    emitEvents(event: string, value: Event) {
      if (event && !value) {
        this.$emit(event);
      } else if (value) {
        this.$emit(event, value);
      }
    },
    addEvents(events: string[]) {
      events.forEach(async (event) => {
        if (!this.eventListeners.has(event)) {
          if (event !== 'audiotrack') {
            const listener = _.partial(this.emitEvents, event);
            this.$refs.video.addEventListener(event, listener);
            this.eventListeners.set(event, listener);
          } else {
            const generateAudioEvent = (type: string) => (trackEvent: TrackEvent) => {
              if (!this.$refs.video) return;
              const track = trackEvent.track as AudioTrack;
              const {
                id, kind, label, language,
              } = track;
              let enabled;
              if (this.lastAudioTrackId > 0) {
                enabled = this.lastAudioTrackId === Number(id);
                for (let i = 0; i < this.$refs.video.audioTracks.length; i += 1) {
                  const currentTrack = this.$refs.video.audioTracks[i];
                  currentTrack.enabled = Number(currentTrack.id) === this.lastAudioTrackId;
                }
              } else {
                enabled = track.enabled;
              }
              this.$emit('audiotrack', {
                type,
                track: {
                  id, kind, label, language, enabled,
                },
              });
            };
            // 通过video元素的audioTracks，获取视屏的tracks
            this.$refs.video.audioTracks.onaddtrack = generateAudioEvent('add');
            this.$refs.video.audioTracks.onremovetrack = generateAudioEvent('remove');
          }
        }
      });
    },
    removeEvents(events: string[]) {
      events.forEach((event) => {
        if (this.eventListeners.has(event)) {
          const listener = this.eventListeners.get(event);
          this.$refs.video.removeEventListener(event, listener);
          this.eventListeners.delete(event);
        }
      });
    },
    setStyle(styles: Record<string, string>) {
      const style = Object.keys(styles);
      if (style.length > 0) {
        style.forEach((styleName) => {
          this.$refs.video.style[styleName] = styles[styleName];
        });
      }
    },
    handleError() {
      if (!this.$refs.video || !this.$refs.video.error) return;
      const { code, message } = this.$refs.video.error;
      log.warn('video element onerror', `${code}:${message}`);
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
