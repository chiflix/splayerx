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
  </div>
</template>;

<script>
import fs from 'fs';
import srt2vtt from 'srt-to-vtt';
import { WebVTT } from 'vtt.js';
import { setInterval, clearInterval } from 'timers';
// https://www.w3schools.com/tags/ref_av_dom.asp

export default {
  data() {
    return {
      videoExisted: false,
      newWidthOfWindow: 0,
      newHeightOfWindow: 0,
      globalIntervalFunc: null,
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
    timeUpdate() {
      const { currentTime, duration } = this.$refs.videoCanvas;
      if (currentTime >= duration || this.$refs.videoCanvas.paused) {
        clearInterval(this.globalIntervalFunc);
      } else {
        console.log('time update');
        this.$store.commit('AccurateTime', currentTime);
      }
    },
    onPause() {
      console.log('onpause');
    },
    onPlaying() {
      console.log('onplaying');
      // set interval to get update time
      if (this.$refs.videoCanvas.duration <= 120) {
        this.globalIntervalFunc = setInterval(this.timeUpdate, 50);
      }
    },
    onCanPlay() {
      // the video is ready to start playing
      this.$store.commit('Volume', this.$refs.videoCanvas.volume);
    },
    onMetaLoaded() {
      console.log('loadedmetadata');
      this.$bus.$emit('play');
      const { videoHeight, videoWidth } = this.$refs.videoCanvas;
      this.$bus.$emit('screenshot-sizeset', videoWidth / videoHeight);
      if (this.videoExisted) {
        this.$_calculateWindowSizeInConditionOfVideoExisted(videoWidth, videoHeight);
        this.$_controlWindowSize(this.newWidthOfWindow, this.newHeightOfWindow);
      } else {
        this.$_calculateWindowSizeAtTheFirstTime(videoWidth, videoHeight);
        this.$_controlWindowSize(this.newWidthOfWindow, this.newHeightOfWindow);
        this.videoExisted = true;
      }

      this.loadTextTracks();
    },
    onTimeupdate() {
      console.log('ontimeupdate');
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
      this.findSubtitleFilesByVidPath(vid.src, (subPath) => {
        console.log(subPath);
        // Automatically track and cleanup files at exit
        // temp.track();
        // const stream = temp.createWriteStream({ suffix: '.vtt' });
        const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
        parser.oncue = (cue) => {
          sub0.addCue(cue);
          console.log(cue);
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
    $_controlWindowSize(newWidth, newHeight) {
      this.currentWindow.setBounds({
        x: 0, y: 0, width: parseInt(newWidth, 10), height: parseInt(newHeight, 10),
      });
      this.currentWindow.setAspectRatio(newWidth / newHeight);
    },

    $_calculateWindowSizeAtTheFirstTime(videoWidth, videoHeight) {
      const { width: screenWidth, height: screenHeight } = this.currentScreen.workAreaSize;
      const [minWidth, minHeight] = this.currentWindow.getMinimumSize();
      const screenRatio = screenWidth / screenHeight;
      const videoRatio = videoWidth / videoHeight;
      const minWindowRatio = minWidth / minHeight;

      if (videoWidth > screenWidth || videoHeight > screenHeight) {
        if (videoRatio > screenRatio) {
          this.newWidthOfWindow = screenWidth;
          this.newHeightOfWindow
            = this.$_calculateHeightByWidth(videoWidth, videoHeight, this.newWidthOfWindow);
        } else if (videoRatio < screenRatio) {
          this.newHeightOfWindow = screenHeight;
          this.newWidthOfWindow
            = this.$_calculateWidthByHeight(videoWidth, videoHeight, this.newHeightOfWindow);
        } else if (videoRatio === screenRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow] = [screenWidth, screenHeight];
        }
      } else if (videoWidth < minWidth || videoHeight < minHeight) {
        if (videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow
            = this.$_calculateWidthByHeight(videoWidth, videoHeight, this.newHeightOfWindow);
        } else if (videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow
            = this.$_calculateHeightByWidth(videoWidth, videoHeight, this.newWidthOfWindow);
        } else if (videoRatio === minWindowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [videoWidth, videoHeight];
        }
      } else {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [videoWidth, videoHeight];
      }
    },

    $_calculateWindowSizeInConditionOfVideoExisted(videoWidth, videoHeight) {
      const [windowWidth, windowHeight] = this.currentWindow.getSize();
      const [minWidth, minHeight] = this.currentWindow.getMinimumSize();

      const videoRatio = videoWidth / videoHeight;
      const windowRatio = windowWidth / windowHeight;
      const minWindowRatio = minWidth / minHeight;

      if (videoWidth < windowWidth && videoHeight < windowHeight) {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [videoWidth, videoHeight];
      } else if (videoWidth > windowWidth || videoHeight > windowHeight) {
        if (videoRatio > windowRatio) {
          this.newWidthOfWindow = windowWidth;
          this.newHeightOfWindow
            = this.$_calculateHeightByWidth(videoWidth, videoHeight, this.newWidthOfWindow);
        } else if (videoRatio < windowRatio) {
          this.newHeightOfWindow = windowHeight;
          this.newWidthOfWindow
            = this.$_calculateWidthByHeight(videoWidth, videoHeight, this.newHeightOfWindow);
        } else if (videoRatio === windowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [windowWidth, windowHeight];
        }
      }

      if (this.newWidthOfWindow < minWidth || this.newHeightOfWindow < minHeight) {
        if (videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow
            = this.$_calculateWidthByHeight(videoWidth, videoHeight, this.newHeightOfWindow);
        } else if (videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow
            = this.$_calculateHeightByWidth(videoWidth, videoHeight, this.newWidthOfWindow);
        } else if (videoRatio === minWindowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [videoWidth, videoHeight];
        }
      }
    },

    $_calculateHeightByWidth(videoWidth, videoHeight, newWidth) {
      return newWidth / (videoWidth / videoHeight);
    },

    $_calculateWidthByHeight(videoWidth, videoHeight, newHeight) {
      return newHeight * (videoWidth / videoHeight);
    },
  },
  computed: {
    volume() {
      return this.$store.state.PlaybackState.Volume;
    },
    currentWindow() {
      return this.$electron.remote.getCurrentWindow();
    },
    currentScreen() {
      return this.$electron.screen.getPrimaryDisplay();
    },
  },
  watch: {
    volume(newVolume) {
      console.log(`set video volume ${newVolume}`);
      this.$refs.videoCanvas.volume = newVolume;
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
      } else {
        this.$bus.$emit('pause');
      }
    });
    this.$bus.$on('play', () => {
      console.log('play event has been triggered');
      this.$refs.videoCanvas.play();
    });
    this.$bus.$on('pause', () => {
      console.log('pause event has been triggered');
      this.$refs.videoCanvas.pause();
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
}
.video video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

// https://www.w3.org/TR/webvtt1/
video::cue {
  color: yellow;
  text-shadow: 0px 0px 2px black;
  background-color: transparent;
}
</style>
