<template>
    <div class="subtitle-wrapper">
      <!-- Need a way to avoid v-html -->
      <div class='subtitle-content'
        :style="subStyle"
        v-for="(html, key) in firstCueHTML"
        v-html="html"></div>
      <div class='subtitle-content'
        :style="subStyle"
        v-for="(html, key) in secondCueHTML"
        v-html="html"></div>
    </div>
</template>

<script>
import fs from 'fs';
import srt2vtt from 'srt-to-vtt';
import { WebVTT } from 'vtt.js';
import path from 'path';
import parallel from 'run-parallel';

export default {
  data() {
    return {
      startIndex: 0,
      firstSubIndex: null,
      secondSubIndex: null,
      firstActiveCue: null,
      secondActiveCue: null,
      firstCueHTML: [],
      secondCueHTML: [],
      subNameArr: [],
      subStyle: {},
      curStyle: {
        fontSize: 24,
        letterSpacing: 1,
        opacity: 1,
        color: '',
        border: '',
        background: '',
      },
    };
  },
  methods: {
    /**
     * Todo:
     * 1. process ass subtitles
     * 2. second subtitle css
     * 3. accept subtitle from drag event and menu
     * 4. detect subtitle language
     */
    /**
     * Load all available text tracks in the
     * same path
     */
    autoLoadTextTracks() {
      /* TODO:
       * 字幕代码我自己觉得很不满意，期待更好的处理 - Tomasen
       * move subtitle process to another component
       * DOCs:
       * https://gist.github.com/denilsonsa/aeb06c662cf98e29c379
       * https://developer.mozilla.org/en-US/docs/Web/API/VTTCue
       * https://hacks.mozilla.org/2014/07/adding-captions-and-subtitles-to-html5-video/
       */
      this.$_clearSubtitle();
      const vid = this.$parent.$refs.videoCanvas;
      this.startIndex = vid.textTracks.length;

      // hide every text text/subtitle tracks at beginning
      // 没有做对内挂字幕的处理
      // for (let i = this.$store.state.PlaybackState.CurrentIndex; i < this.startIndex; i += 1) {
      //   vid.textTracks[i].mode = 'disabled';
      // }

      /*
       * TODO:
       * If there is already text track, load it
       * If there is already subtitle files(opened or loaded), load it
       * If there is no (chinese/default language) text track, try translate api
       */
      // If there is already subtitle files(same dir), load it
      const files = [];
      this.findSubtitleFilesByVidPath(decodeURI(vid.src), (subPath) => {
        files.push(subPath);
      });

      const subNameArr = files.map(file => this.$_subNameProcess(file));
      this.$store.commit('SubtitleNameArr', subNameArr);
      this.$bus.$emit('subName-loaded');

      this.addVttToVideoElement(files, () => {
        console.log('finished reading subtitle files');
        this.subStyleChange();
        this.subtitleShow(0);
      });
    },
    /**
     * @link https://github.com/mafintosh/pumpify
     * @param {Pumpify} stream duplex stream for subtitles
     * @param {resultCallback} cb Callback function to process result.
     * (err, result) are two arguments of callback.
     */
    concatStream(stream, cb) {
      const chunks = [];
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      stream.on('end', () => {
        if (cb) {
          cb(null, Buffer.concat(chunks));
        }
        cb = null;
      });
      stream.once('error', (err) => {
        if (cb) {
          cb(err);
        }
        cb = null;
      });
    },
    /**
     * @param {string} file Subtitle file path
     * @returns {object} Returns an object that contains subtitle name
     * and default status(status can be null, first and second)
     */
    $_subNameProcess(file) {
      return {
        title: path.parse(file).name,
        status: null,
      };
    },
    /**
     * @param {string} subPath Subtitle Path
     * @param {resultCallback} cb Callback function to process result
     */
    $_createSubtitleStream(subPath, cb) {
      const vttStream = fs.createReadStream(subPath).pipe(srt2vtt());
      this.concatStream(vttStream, (err, buf) => {
        if (err) {
          console.error(err);
        }
        cb(null, buf);
      });
    },
    /**
     * @param {Array.<string>} files Subtitle pathes array
     * @param {resultCallback} cb Callback function to process result
     * @description Process subtitles and add subtitles to video element
     */
    addVttToVideoElement(files, cb) {
      const vid = this.$parent.$refs.videoCanvas;
      /**
       * Referenced from WebTorrent
       */
      /* eslint-disable arrow-parens */
      const tasks = files.map((subPath) => (cb) => this.$_createSubtitleStream(subPath, cb));
      parallel(tasks, (err, results) => {
        if (err) {
          console.error(err);
        }
        const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
        for (let i = 0; i < results.length; i += 1) {
          const sub = vid.addTextTrack('subtitles');
          sub.mode = 'disabled';
          parser.oncue = (cue) => {
            sub.addCue(cue);
          };
          parser.onflush = cb;
          const result = results[i];
          parser.parse(result.toString('utf8'));
        }
        parser.flush();
      });
    },
    // 待改善函数结构
    // 判断重合情况
    /**
     * @param {number} index Target index of subtitle to show
     * @param {string} type First or second subtitle
     */
    subtitleShow(index, type = 'first') {
      const vid = this.$parent.$refs.videoCanvas;
      const targetIndex = index + this.startIndex;
      if (type === 'first') {
        // 当直接播放无字幕视频时，会报错,需要error handle
        // 判断有无字幕
        const curVidIndex = this.firstSubIndex + this.startIndex;
        if (vid.textTracks.length > targetIndex) {
          vid.textTracks[curVidIndex].mode = 'disabled';
          vid.textTracks[curVidIndex].oncuechange = null;

          this.$_onCueChangeEventAdd(vid.textTracks[targetIndex]);
          vid.textTracks[targetIndex].mode = 'hidden';

          this.$store.commit('SubtitleOn', { index, status: 'first' });
          this.firstSubIndex = index;
        } else {
          // this.$store.commit('SubtitleOff', index);
          // this.$store.commit('FristSubtitleOff');
          console.log('no subtitle');
        }
      }
      if (type === 'second') {
        console.log('show second subtitle');
      }
    },
    /**
     * @param {object} obj Contains style property
     * @description obj contains 6 values to control
     * the css style of the subtitle. Each unset
     * property will use default value.
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
     * @param {TextTrack} textTrack target textTrack
     * @param {string} type Choose first or second subtitle
     * @description function for oncuechange event
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
    /**
     * @description function to clear former subtitles
     */
    $_clearSubtitle() {
      const vid = this.$parent.$refs.videoCanvas;
      const curVidFirstIndex = this.firstSubIndex + this.startIndex;
      const curVidSecondIndex = this.secondSubIndex + this.startIndex;
      if (this.firstSubIndex === null) {
        console.log('first subtitle not set');
      } else {
        console.log(curVidFirstIndex);
        vid.textTracks[curVidFirstIndex].mode = 'disabled';
        vid.textTracks[curVidFirstIndex].oncuechange = null;
        this.firstSubIndex = null;
      }
      // 未设置第二字幕时，消除字幕的error handler
      if (this.secondSubIndex === null) {
        console.log('second subtitle not set');
      } else {
        vid.textTracks[curVidSecondIndex].mode = 'disabled';
        vid.textTracks[curVidSecondIndex].oncuechange = null;
        this.secondSubIndex = null;
      }
    },
  },
  computed: {
    firstSubState() {
      console.log(this.$store.getters.firstSubIndex);
      return this.$store.getters.firstSubIndex !== -1;
    },
    // secondSubState() {
    //   return this.$store.state.PlaybackState.SecondSubtitleState;
    // },
  },
  watch: {
    firstSubState(newVal) {
      const vid = this.$parent.$refs.videoCanvas;
      const curVidFirstSubIndex = this.startIndex + this.firstSubIndex;
      // 这里有个报错需要处理，每当读取新的视频时，会将subtitlenamearr清空，这时firstSubState也产生了变化
      // 所以会进入watcher，发生undefined错误
      console.log(vid.textTracks[curVidFirstSubIndex].mode);
      if (newVal && vid.textTracks[curVidFirstSubIndex].mode === 'disabled') {
        vid.textTracks[curVidFirstSubIndex].mode = 'hidden';
      } else if (!newVal && vid.textTracks[curVidFirstSubIndex].mode !== 'disabled') {
        this.firstActiveCue = null;
        vid.textTracks[curVidFirstSubIndex].mode = 'disabled';
      } else {
        console.log(newVal);
        console.log(curVidFirstSubIndex);
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
    // secondActiveCue(newVal) {
    //   this.secondCueHTML.pop();
    //   // console.log(newVal);
    //   if (newVal) {
    //     // 这里对cue进行处理
    //     // 得到cue的line和position确定位置
    //     this.secondCueHTML.push(WebVTT.convertCueToDOMTree(window, this.secondActiveCue.text)
    //       .innerHTML);
    //   }
    // },
  },
  created() {
    this.$bus.$on('video-loaded', this.autoLoadTextTracks);
    // 可以二合一
    this.$bus.$on('sub-first-change', (targetIndex) => {
      this.subtitleShow(targetIndex);
    });
    this.$bus.$on('sub-second-change', (targetIndex) => {
      this.subtitleShow(targetIndex, 'second');
    });

    this.$bus.$on('first-subtitle-on', () => {
      this.$store.commit('SubtitleOn', { index: this.firstSubIndex, status: 'first' });
    });
    this.$bus.$on('first-subtitle-off', () => {
      this.$store.commit('SubtitleOff', this.firstSubIndex);
    });

    this.$bus.$on('sub-style-change', this.subStyleChange);
    /**
     * Todo:
     * handle multiple pathes
     */
    this.$bus.$on('add-subtitle', (files) => {
      const size = this.$store.getters.SubtitleNameArrSize;
      const subtitleName = files.map(file => this.$_subNameProcess(file));
      this.$store.commit('AddSubtitle', subtitleName);
      this.addVttToVideoElement(files, () => {
        this.subtitleShow(size);
      });
    });
  },
};
</script>

<style lang="scss" scoped>
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
