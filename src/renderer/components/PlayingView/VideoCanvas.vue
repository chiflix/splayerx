<template>
  <div class="video">
    <video ref="videoCanvas"
      preload="metadata"
      @playing="onPlaying"
      @pause="onPause"
      @canplay="onCanPlay"
      @timeupdate="onTimeupdate"
      @loadedmetadata="onMetaLoaded"
      @durationchange="onDurationChange"
      :src="src">
    </video>
    <canvas class="canvas" ref="thumbnailCanvas"></canvas>
  </div>
</template>;

<script>
import fs from 'fs';
import srt2vtt from 'srt-to-vtt';
import { WebVTT } from 'vtt.js';
// https://www.w3schools.com/tags/ref_av_dom.asp

export default {
  data() {
    return {
      videoExisted: false,
      newWidthOfWindow: 0,
      newHeightOfWindow: 0,
      videoWidth: 0,
      videoHeight: 0,
      timeUpdateIntervalID: null,
    };
  },
  props: {
    src: {
      type: String,
      required: true,
      validator(value) {
        // TODO: check if its a file or url
        if (value.length <= 0) {
          return false;
        }
        return true;
      },
    },
  },
  methods: {
    accurateTimeUpdate() {
      const { currentTime, duration } = this.$refs.videoCanvas;
      if (currentTime >= duration || this.$refs.videoCanvas.paused) {
        clearInterval(this.timeUpdateIntervalID);
      } else {
        this.$store.commit('AccurateTime', currentTime);
      }
    },
    onPause() {
      console.log('onpause');
    },
    onPlaying() {
      console.log('onplaying');
      // set interval to get update time
      const { duration } = this.$refs.videoCanvas;
      if (duration <= 240) {
        this.timeUpdateIntervalID = setInterval(this.accurateTimeUpdate, 10);
      }
    },
    onCanPlay() {
      // the video is ready to start playing
      this.$store.commit('Volume', this.$refs.videoCanvas.volume);
    },
    onMetaLoaded() {
      console.log('loadedmetadata');
      this.$bus.$emit('play');
      this.$_getThumbnail();
      this.videoWidth = this.$refs.videoCanvas.videoWidth;
      this.videoHeight = this.$refs.videoCanvas.videoHeight;
      this.$bus.$emit('screenshot-sizeset', this.videoWidth / this.videoHeight);
      if (this.videoExisted) {
        this.$_calculateWindowSizeInConditionOfVideoExisted();
        this.$_controlWindowSize();
      } else {
        this.$_calculateWindowSizeAtTheFirstTime();
        this.$_controlWindowSize();
        this.videoExisted = true;
      }

      this.loadTextTracks();
    },
    onTimeupdate() {
      console.log('ontimeupdate');
      this.$store.commit('AccurateTime', this.$refs.videoCanvas.currentTime);
      const t = Math.floor(this.$refs.videoCanvas.currentTime);
      if (t !== this.$store.state.PlaybackState.CurrentTime) {
        this.$store.commit('CurrentTime', t);
      }
    },
    onDurationChange() {
      console.log('durationchange');
      const t = Math.floor(this.$refs.videoCanvas.duration);
      if (t !== this.$store.state.PlaybackState.duration) {
        this.$store.commit('Duration', t);
      }
    },
    onSubTrackLoaded() {
      console.log('onSubTrackLoaded');
      this.$refs.customTrack.mode = 'showing';
    },
    loadTextTracks() {
      /* TODO:
       * 字幕代码我自己觉得很不满意，期待更好的处理 - Tomasen
       * move subtitle process to another component
       * DOCs:
       * https://gist.github.com/denilsonsa/aeb06c662cf98e29c379
       * https://developer.mozilla.org/en-US/docs/Web/API/VTTCue
       * https://hacks.mozilla.org/2014/07/adding-captions-and-subtitles-to-html5-video/
       */

      const vid = this.$refs.videoCanvas;

      // hide every text text/subtitle tracks at beginning
      for (let i = 0; i < vid.textTracks.length; i += 1) {
        vid.textTracks[i].mode = 'hidden';
      }

      // create our own text/subtitle track
      const sub0 = vid.addTextTrack('subtitles', 'splayer-custom');

      /*
       * TODO:
       * If there is already text track, load it
       * If there is already subtitle files(opened or loaded), load it
       * If there is no (chinese/default language) text track, try translate api
       */

      let loadingTextTrack = false;
      let shownTextTrack = false;
      // If there is already subtitle files(same dir), load it
      this.findSubtitleFilesByVidPath(decodeURI(vid.src), (subPath) => {
        console.log(subPath);
        // Automatically track and cleanup files at exit
        // temp.track();
        // const stream = temp.createWriteStream({ suffix: '.vtt' });
        const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
        parser.oncue = (cue) => {
          sub0.addCue(cue);
          // console.log(cue);
        };
        parser.onflush = () => {
          if (!shownTextTrack) {
            sub0.mode = 'showing';
            shownTextTrack = true;
          }
        };
        loadingTextTrack = true;

        const readStream = fs.createReadStream(subPath).pipe(srt2vtt());
        readStream
          .on('data', (chunk) => {
            parser.parse(chunk.toString('utf8'));
          })
          .on('end', () => {
            parser.flush();
            console.log('finish reading srt');
          });
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log(`loadingTextTrack ${loadingTextTrack}`);
        if (!loadingTextTrack) {
          // Loading subtitle test
          const cue0 = new VTTCue(0, 30000, '字幕测试 Subtitle Test');
          sub0.addCue(cue0);
          sub0.mode = 'showing';
        }
      }
    },
    $_controlWindowSize() {
      const currentWindow = this.$electron.remote.getCurrentWindow();
      currentWindow.setBounds({
        x: 0,
        y: 0,
        width: parseInt(this.newWidthOfWindow, 10),
        height: parseInt(this.newHeightOfWindow, 10),
      });
      currentWindow.setAspectRatio(this.newWidthOfWindow / this.newHeightOfWindow);
    },

    $_calculateWindowSizeAtTheFirstTime() {
      const currentWindow = this.$electron.remote.getCurrentWindow();
      const currentScreen = this.$electron.screen.getPrimaryDisplay();

      const { width: screenWidth, height: screenHeight } = currentScreen.workAreaSize;
      const [minWidth, minHeight] = currentWindow.getMinimumSize();
      const screenRatio = screenWidth / screenHeight;
      const minWindowRatio = minWidth / minHeight;
      const videoRatio = this.videoWidth / this.videoHeight;

      if (this.videoWidth > screenWidth || this.videoHeight > screenHeight) {
        if (videoRatio > screenRatio) {
          this.newWidthOfWindow = screenWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (videoRatio < screenRatio) {
          this.newHeightOfWindow = screenHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (videoRatio === screenRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow] = [screenWidth, screenHeight];
        }
      } else if (this.videoWidth < minWidth || this.videoHeight < minHeight) {
        if (videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (videoRatio === minWindowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [this.videoWidth, this.videoHeight];
        }
      } else {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [this.videoWidth, this.videoHeight];
      }
    },

    $_calculateWindowSizeInConditionOfVideoExisted() {
      const currentWindow = this.$electron.remote.getCurrentWindow();

      const [windowWidth, windowHeight] = currentWindow.getSize();
      const [minWidth, minHeight] = currentWindow.getMinimumSize();

      const windowRatio = windowWidth / windowHeight;
      const minWindowRatio = minWidth / minHeight;
      const videoRatio = this.videoWidth / this.videoHeight;

      if (this.videoWidth < windowWidth && this.videoHeight < windowHeight) {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [this.videoWidth, this.videoHeight];
      } else if (this.videoWidth > windowWidth || this.videoHeight > windowHeight) {
        if (videoRatio > windowRatio) {
          this.newWidthOfWindow = windowWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (videoRatio < windowRatio) {
          this.newHeightOfWindow = windowHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (videoRatio === windowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [windowWidth, windowHeight];
        }
      }

      if (this.newWidthOfWindow < minWidth || this.newHeightOfWindow < minHeight) {
        if (videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (videoRatio === minWindowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [this.videoWidth, this.videoHeight];
        }
      }
      console.log(this.newWidthOfWindow);
    },
    $_getThumbnail() {
      const canvas = this.$refs.thumbnailCanvas;
      const canvasCTX = canvas.getContext('2d');
      const { videoHeight, videoWidth } = this.$refs.videoCanvas;
      [canvas.width, canvas.height] = [videoWidth, videoHeight];
      const landingViewWidth = 768;

      canvasCTX.drawImage(
        this.$refs.videoCanvas, 0, 0, videoWidth, videoHeight,
        0, 0, videoWidth, videoHeight,
      );
      const imagePath = canvas.toDataURL('image/png', landingViewWidth / videoWidth);
      this.$storage.get('recent-played', (err, data) => {
        if (err) {
          // TODO: proper error handle
          console.error(err);
        } else {
          const object = data[0];
          const iterator = Object.keys(object).indexOf('path');
          if (iterator !== -1) {
            object.shortCut = imagePath;
            object.lastPlayedTime = this.currentTime;
            object.duration = this.$store.state.PlaybackState.Duration;
            data.splice(0, 1);
            data.unshift(object);
            this.$storage.set('recent-played', data);
          }
        }
      });
      console.log('shortCut!');
    },
  },
  computed: {
    calculateHeightByWidth() {
      return this.newWidthOfWindow / (this.videoWidth / this.videoHeight);
    },
    calculateWidthByHeight() {
      return this.newHeightOfWindow * (this.videoWidth / this.videoHeight);
    },
    currentTime() {
      return this.$store.state.PlaybackState.CurrentTime;
    },
    playbackRate() {
      return this.$store.state.PlaybackState.PlaybackRate;
    },
    volume() {
      return this.$store.state.PlaybackState.Volume;
    },
  },
  watch: {
    volume(newVolume) {
      console.log(`set video volume ${newVolume}`);
      this.$refs.videoCanvas.volume = newVolume;
    },
    playbackRate(newRate) {
      console.log(`set video playbackRate ${newRate}`);
      this.$refs.videoCanvas.playbackRate = newRate;
    },
  },
  created() {
    this.$bus.$on('reset-windowsize', () => {
      this.$_controlWindowSize(this.newWidthOfWindow, this.newHeightOfWindow);
    });
    this.$bus.$on('toggle-playback', () => {
      console.log('toggle-playback event has been triggered');
      if (this.$refs.videoCanvas.paused) {
        this.$bus.$emit('play');
        this.$bus.$emit('twinkle-play-icon');
      } else {
        this.$bus.$emit('pause');
        this.$bus.$emit('twinkle-pause-icon');
      }
    });
    this.$bus.$on('play', () => {
      console.log('play event has been triggered');
      this.$refs.videoCanvas.play();
    });
    this.$bus.$on('pause', () => {
      console.log('pause event has been triggered');
      this.$refs.videoCanvas.pause();
      this.$_getThumbnail();
    });
    this.$bus.$on('seek', (e) => {
      console.log('seek event has been triggered', e);
      this.$refs.videoCanvas.currentTime = e;
      this.$store.commit('CurrentTime', e);
      this.$store.commit('AccurateTime', e);
    });
  },
};
</script>

<style lang="scss">

.video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

// https://www.w3.org/TR/webvtt1/
video::cue {
  color: yellow;
  text-shadow: 0px 0px 2px black;
  background-color: transparent;
}
</style>
