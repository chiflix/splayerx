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
    <div class="subtitle-wrapper">
      <!-- Need a way not to use v-html -->
      <div class='subtitle-content'
        :style="subStyle"
        v-for="(html, key) in firstCueHTML"
        v-html="html"></div>
      <div class='subtitle-content'
        :style="subStyle"
        v-for="(html, key) in secondCueHTML"
        v-html="html"></div>
    </div>
    <canvas class="canvas" ref="thumbnailCanvas"></canvas>
  </div>
</template>;

<script>
import fs from 'fs';
import srt2vtt from 'srt-to-vtt';
import { WebVTT } from 'vtt.js';
import path from 'path';
// https://www.w3schools.com/tags/ref_av_dom.asp

export default {
  data() {
    return {
      videoExisted: false,
      shownTextTrack: false,
      newWidthOfWindow: 0,
      newHeightOfWindow: 0,
      videoWidth: 0,
      videoHeight: 0,
      timeUpdateIntervalID: null,
      firstActiveCue: null,
      secondActiveCue: null,
      firstCueHTML: [],
      secondCueHTML: [],
      subNameArr: [],
      // 将style的内容修改为object
      subStyle: {},
      curStyle: {
        fontSize: 24,
        letterSpacing: 1,
        opcacity: 1,
        color: '',
        border: '',
        background: '',
      },
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
      this.$_getThumbnail();
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
        if (t % 10 === 0) { this.$_getThumbnail(); }
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
      const startIndex = vid.textTracks.length;
      this.$store.commit('StartIndex', startIndex);
      // hide every text text/subtitle tracks at beginning
      // 没有做对内挂字幕的处理
      for (let i = this.$store.state.PlaybackState.CurrentIndex; i < startIndex; i += 1) {
        vid.textTracks[i].mode = 'disabled';
      }

      // // create our own text/subtitle track
      // const sub0 = vid.addTextTrack('subtitles', 'splayer-custom');

      /*
       * TODO:
       * If there is already text track, load it
       * If there is already subtitle files(opened or loaded), load it
       * If there is no (chinese/default language) text track, try translate api
       */

      // let loadingTextTrack = false;
      // let shownTextTrack = false;
      // If there is already subtitle files(same dir), load it
      this.findSubtitleFilesByVidPath(decodeURI(vid.src), (subPath) => {
        // console.log(subPath);
        // Automatically track and cleanup files at exit
        // temp.track();
        // const stream = temp.createWriteStream({ suffix: '.vtt' });
        const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
        const filename = path.parse(subPath).name;
        const sub = vid.addTextTrack('subtitles', filename);
        parser.oncue = (cue) => {
          sub.addCue(cue);
        };

        sub.mode = 'disabled';
        parser.onflush = () => {
          if (!this.shownTextTrack) {
            // sub.mode = 'showing';
            this.shownTextTrack = true;
            this.$bus.$emit('subtitle-loaded');
          }
        };
        // loadingTextTrack = true;

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


      // create our own text/subtitle track
      // const sub0 = vid.addTextTrack('subtitles', 'splayer-custom');

      // if (process.env.NODE_ENV !== 'production') {
      //   console.log(`loadingTextTrack ${loadingTextTrack}`);
      //   if (!loadingTextTrack) {
      //     // Loading subtitle test
      //     const cue0 = new VTTCue(0, 30000, '字幕测试 Subtitle Test');
      //     sub0.addCue(cue0);
      //     sub0.mode = 'showing';
      //   }
      // }
      this.subStyleChange();
      // 需要消除之前的字幕
      this.$_clearSubtitle();
      this.subtitleShow(startIndex, 'first');
      this.$_loadSubNameArr();
    },
    // 待改善函数结构
    // 判断重合情况
    // 主字幕与副字幕选择同一个字幕情况下，是消去一个字幕还是保持上次的结果？
    subtitleShow(index, type) {
      const vid = this.$refs.videoCanvas;
      if (type === 'first') {
        // 当直接播放无字幕视频时，会报错,需要error handle
        // 判断有无字幕
        if (vid.textTracks.length > index) {
          this.$store.commit('FirstSubtitleOn');
          const firstSubIndex = this.$store.state.PlaybackState.FirstSubIndex;
          vid.textTracks[firstSubIndex].mode = 'disabled';
          vid.textTracks[firstSubIndex].oncuechange = null;
          this.$_onCueChangeEventAdd(vid.textTracks[index]);
          vid.textTracks[index].mode = 'hidden';
          this.$store.commit('FirstSubIndex', index);
        } else {
          this.$store.commit('FirstSubtitleOff');
          console.log('no subtitle');
        }
      }
      if (type === 'second') {
        // 需要重写
        console.log('showSecondSub');
        const secondSubIndex = this.$store.state.PlaybackState.SecondSubIndex;
        if (index !== this.$store.state.PlaybackState.FirstSubIndex) {
          if (secondSubIndex !== -1) {
            vid.textTracks[secondSubIndex].mode = 'disabled';
            this.$store.commit('SecondSubtitleOn');
          } else {
            this.$store.commit('SecondSubtitleOff');
            console.log('Warning: no selected second subtitle');
          }
          this.$_onCueChangeEventAdd(vid.textTracks[index], 'second');
          vid.textTracks[index].mode = 'hidden';
          this.$store.commit('SecondSubIndex', index);
        }
      }
    },
    /**
     * @param obj contains all needed style property
     *
     * obj contains 6 values to control the css
     * style of the subtitle. Each unset property
     * will use default value.
     */
    subStyleChange(obj = {}) {
      const fontSize = obj.fontSize ? obj.fontSize : this.curStyle.fontSize;
      const letterSpacing = obj.letterSpacing ? obj.letterSpacing : this.curStyle.letterSpacing;
      const opacity = obj.opacity ? obj.opacity : this.curStyle.opacity;
      const color = obj.color ? obj.color : this.curStyle.color;
      const border = obj.border ? obj.border : this.curStyle.border;
      const background = obj.background ? obj.background : this.curStyle.background;

      this.subStyle = {
        fontSize: `${fontSize}px`,
        letterSpacing: `${letterSpacing}px`,
        opacity,
        color,
        border,
        background,
      };
      this.curStyle = {
        fontSize,
        letterSpacing,
        opacity,
        color,
        border,
        background,
      };
    },
    /**
     * 不需要这么麻烦，可以直接在loadTextTrack中获得字幕文件名，
     * 存入数组中后commit, 需要对index进行处理.
     */
    $_loadSubNameArr() {
      const vid = this.$refs.videoCanvas;
      const subNameARR = [];
      const startIndex = this.$store.state.PlaybackState.StartIndex;
      for (let i = startIndex; i < vid.textTracks.length; i += 1) {
        subNameARR.push({
          title: vid.textTracks[i].label,
          index: i - startIndex,
        });
      }
      this.$store.commit('SubtitleNameArr', subNameARR);
    },
    /**
     * @param textTrack target textTrack
     * @param type choose first or second subtitle
     */
    $_onCueChangeEventAdd(textTrack, type = 'first') {
      const firstSubEvent = (cue) => {
        const tempCue = cue.currentTarget.activeCues[0];
        this.firstActiveCue = tempCue;
      };
      const secondSubEvent = (cue) => {
        const tempCue = cue.currentTarget.activeCues[0];
        this.secondActiveCue = tempCue;
      };
      // write a same sub event to handle same subtitle situation
      textTrack.oncuechange = type === 'first' ? firstSubEvent : secondSubEvent;
    },
    $_clearSubtitle() {
      const vid = this.$refs.videoCanvas;
      const firstSubIndex = this.$store.state.PlaybackState.FirstSubIndex;
      const secondSubIndex = this.$store.state.PlaybackState.SecondSubIndex;
      vid.textTracks[firstSubIndex].mode = 'disabled';
      vid.textTracks[firstSubIndex].oncuechange = null;
      // 未设置第二字幕时，消除字幕的error handler
      if (secondSubIndex === -1) {
        console.log('second subtitle not set');
      } else {
        vid.textTracks[secondSubIndex].mode = 'disabled';
        vid.textTracks[secondSubIndex].oncuechange = null;
        this.$store.commit('SecondSubIndex', -1);
      }
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

    firstSubState() {
      return this.$store.state.PlaybackState.FirstSubtitleState;
    },
    secondSubState() {
      return this.$store.state.PlaybackState.SecondSubtitleState;
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

    firstSubState(newVal) {
      const vid = this.$refs.videoCanvas;
      const firstSubIndex = this.$store.state.PlaybackState.FirstSubIndex;
      if (newVal && vid.textTracks[firstSubIndex].mode === 'disabled') {
        vid.textTracks[firstSubIndex].mode = 'hidden';
      } else if (!newVal && vid.textTracks[firstSubIndex].mode !== 'disabled') {
        this.firstActiveCue = null;
        vid.textTracks[firstSubIndex].mode = 'disabled';
      } else {
        console.log('Error: mode is not correct');
      }
    },
    secondSubState(newVal) {
      const vid = this.$refs.videoCanvas;
      const secondSubIndex = this.$store.state.PlaybackState.SecondSubIndex;
      // 如果未选第二字幕的时候开启，如何处理
      if (secondSubIndex === -1) {
        console.log('Warn: No Second Subtitle');
      } else if (newVal && vid.textTracks[secondSubIndex].mode === 'disabled') {
        vid.textTracks[secondSubIndex].mode = 'hidden';
      } else if (!newVal && vid.textTracks[secondSubIndex].mode !== 'disabled') {
        this.secondActiveCue = null;
        vid.textTracks[secondSubIndex].mode = 'disabled';
      } else {
        console.log('Error: mode is not correct');
      }
    },
    // 需要对这一部分内容优化
    firstActiveCue(newVal) {
      this.firstCueHTML.pop();
      // console.log(newVal);
      if (newVal) {
        // 这里对cue进行处理
        // 得到cue的line和position确定位置
        this.firstCueHTML.push(WebVTT.convertCueToDOMTree(window, this.firstActiveCue.text)
          .innerHTML);
      }
    },
    secondActiveCue(newVal) {
      this.secondCueHTML.pop();
      // console.log(newVal);
      if (newVal) {
        // 这里对cue进行处理
        // 得到cue的line和position确定位置
        this.secondCueHTML.push(WebVTT.convertCueToDOMTree(window, this.secondActiveCue.text)
          .innerHTML);
      }
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

    // 可以二合一
    this.$bus.$on('subFirstChange', (targetIndex) => {
      const index = this.$store.state.PlaybackState.StartIndex + targetIndex;
      this.subtitleShow(index, 'first');
    });
    this.$bus.$on('subSecondChange', (targetIndex) => {
      const index = this.$store.state.PlaybackState.StartIndex + targetIndex;
      // 增加一个判断第一字幕是否开启的状态
      this.subtitleShow(index, 'second');
    });

    this.$bus.$on('subStyleChange', this.subStyleChange);
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

.video {
  .subtitle-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .subtitle-content {
      position: absolute;
      bottom: 20px;
      text-align: center;
      width: 100%;
      white-space: pre;
    }
  }
}
</style>
