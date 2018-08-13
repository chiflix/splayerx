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
      textTrackID: 0,
      firstSubIndex: null,
      firstActiveCue: null,
      secondActiveCue: null,
      Sagi: null,
      firstCueHTML: [],
      secondCueHTML: [],
      subNameArr: [],
      subStyle: {},
      mediaHash: '',
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
    init() {
      const vid = this.$parent.$refs.videoCanvas;
      this.mediaHash = this.mediaQuickHash(decodeURI(vid.src.replace('file://', '')));
      // fs.writeFile('111.txt', this.mediaHash, (err) => {
      //   console.log(err);
      // });
      this.Sagi = this.sagi();
      this.loadLocalTextTracks();
    },
    /**
     * Todo:
     * 1. process ass subtitles
     * 2. second subtitle css
     * 3. accept subtitle from drag event and menu
     * 4. detect subtitle language
     */
    /**
     * @description Load all available text tracks in the
     * same path. If no avalible subtitles, try to load
     * textTracks from server.
     */
    loadLocalTextTracks() {
      /* TODO:
       * 字幕代码我自己觉得很不满意，期待更好的处理 - Tomasen
       * move subtitle process to another component
       * DOCs:
       * https://gist.github.com/denilsonsa/aeb06c662cf98e29c379
       * https://developer.mozilla.org/en-US/docs/Web/API/VTTCue
       * https://hacks.mozilla.org/2014/07/adding-captions-and-subtitles-to-html5-video/
       */
      const vid = this.$parent.$refs.videoCanvas;

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

      if (files.length > 0) {
        const subNameArr = files.map(file => this.$_subNameFromLocalProcess(file));
        this.$store.commit('SubtitleNameArr', subNameArr);

        this.addVttToVideoElement(files, () => {
          console.log('finished reading subtitle files');
          this.subStyleChange();
          this.subtitleShow(0);
        });
      } else {
        this.loadServerTextTracks(() => {
          this.subStyleChange();
          this.subtitleShow(0);
        });
      }
    },
    /**
     * @param {resultCallback} cb callback function to process result
     * after server transcript loaded.
     * @description Load transcript from server and do callback function
     * after finished all request.
     */
    loadServerTextTracks(cb) {
      this.Sagi.mediaTranslate(this.mediaHash)
        .then((res) => {
          // handle 2 situations:
          if (res.array[0][1]) {
            console.log('Warning: No server transcripts.');
            console.log(res);
          } else {
            const textTrackList = res.array[1];

            const subtitleNameArr = textTrackList
              .map(textTrack => this.$_subnameFromServerProcess(textTrack));
            this.$store.commit('SubtitleNameArr', subtitleNameArr);

            this.getAllTranscriptsFromServer(textTrackList).then((resArray) => {
              for (let i = 0; i < resArray.length; i += 1) {
                const res = resArray[i];
                this.addCuesArray(res.array[1]);
              }
              cb();
            });
          }
        }, (err) => {
          console.log(err);
        });
    },
    /**
     * @param {Array.<string>} files Subtitle pathes array
     * @param {resultCallback} cb Callback function to process result
     * @description Process subtitles and add subtitles to video element
     */
    addVttToVideoElement(files, cb) {
      const vid = this.$parent.$refs.videoCanvas;
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
    // Todo:
    // 这里有个问题，获取后端字幕的速度不够快，会有一定时间的延迟
    /**
     * @description This is a
     */
    async getAllTranscriptsFromServer(textTrackList) {
      let resArray = [];
      const waitArray = [];
      for (let i = 0; i < textTrackList.length; i += 1) {
        const transcriptId = textTrackList[i][0];
        const res = this.Sagi.getTranscript(transcriptId);
        waitArray.push(res);
        console.log(res);
      }
      resArray = await Promise.all(waitArray);
      return resArray;
    },
    /**
     * @description Transfer cues array from server to vtt files
     * and add these cues into video subtitles.
     */
    addCuesArray(cueArray) {
      const vid = this.$parent.$refs.videoCanvas;
      const subtitle = vid.addTextTrack('subtitles');
      subtitle.mode = 'disabled';
      // Add cues to TextTrack
      for (let i = 0; i < cueArray.length; i += 1) {
        const element = cueArray[i];
        const startTime = this.$_timeProcess(element[0][0], element[0][1]);
        const endTime = this.$_timeProcess(element[1][0], element[1][1]);
        subtitle.addCue(new VTTCue(startTime, endTime, element[2]));
      }
    },
    /**
     * @param {number} index Target index of subtitle to show
     * @param {string} type First or second subtitle
     */
    subtitleShow(index, type = 'first') {
      const vid = this.$parent.$refs.videoCanvas;
      const targetIndex = this.$store.getters.subtitleNameArr[index].textTrackID;
      if (type === 'first') {
        this.$_clearSubtitle('first');
        if (vid.textTracks.length > targetIndex) { // Video has available subtitles
          this.$_onCueChangeEventAdd(vid.textTracks[targetIndex]);
          vid.textTracks[targetIndex].mode = 'hidden';
          this.$store.commit('SubtitleOn', { index: targetIndex, status: 'first' });
          this.firstSubIndex = targetIndex;
        } else {
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
     * @link https://github.com/mafintosh/pumpify
     * @param {Pumpify} stream duplex stream for subtitles
     * @param {resultCallback} cb Callback function to process result.
     * (err, result) are two arguments of callback.
     */
    $_concatStream(stream, cb) {
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
     * @param {Number} second
     * @param {Number} nanosecond
     * @returns {Number}
     */
    $_timeProcess(second = 0, nanosecond = 0) {
      const ns = nanosecond / 1000000000;
      return second + ns;
    },
    /**
     * @param {string} subPath Subtitle Path
     * @param {resultCallback} cb Callback function to process result
     */
    $_createSubtitleStream(subPath, cb) {
      const vttStream = fs.createReadStream(subPath).pipe(srt2vtt());
      this.$_concatStream(vttStream, (err, buf) => {
        if (err) {
          console.error(err);
        }
        cb(null, buf);
      });
    },
    /**
     * @param {string} file Subtitle file path
     * @returns {object} Returns an object that contains subtitle name
     * and default status(status can be null, first and second)
     */
    $_subNameFromLocalProcess(file) {
      const res = {
        title: path.parse(file).name,
        status: null,
        textTrackID: this.textTrackID,
        origin: 'local',
      };
      this.textTrackID += 1;
      return res;
    },
    /**
     * @param {TextTranslationResponse.Text} textTrack translation result for the requested text
     */
    $_subnameFromServerProcess(textTrack) {
      let title = '';
      if (textTrack[2]) {
        console.log(textTrack);
      }
      // process language code to subtitle name
      title = 'subtitle';
      const res = {
        title,
        status: null,
        textTrackID: this.textTrackID,
        origin: 'server',
      };
      this.textTrackID += 1;
      return res;
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
    $_clearSubtitle(type = 'first') {
      if (type === 'first') {
        if (this.firstSubState) {
          const vid = this.$parent.$refs.videoCanvas;
          vid.textTracks[this.firstSubIndex].mode = 'disabled';
          vid.textTracks[this.firstSubIndex].oncuechange = null;
          this.$store.commit('SubtitleOff');
          this.firstSubIndex = null;
        } else {
          console.log('first subtitle not set');
        }
      }
    },
  },
  computed: {
    firstSubState() {
      console.log(this.$store.getters.firstSubIndex);
      return this.$store.getters.firstSubIndex !== -1;
    },
  },
  watch: {
    firstSubState(newVal) {
      const vid = this.$parent.$refs.videoCanvas;
      console.log(vid.textTracks[this.firstSubIndex].mode);
      if (newVal && vid.textTracks[this.firstSubIndex].mode === 'disabled') {
        vid.textTracks[this.firstSubIndex].mode = 'hidden';
      } else if (!newVal && vid.textTracks[this.firstSubIndex].mode !== 'disabled') {
        this.firstActiveCue = null;
        vid.textTracks[this.firstSubIndex].mode = 'disabled';
      } else {
        console.log(newVal);
        console.log(this.firstSubIndex);
        console.log('Error: mode is not correct');
      }
    },
    // 需要对这一部分内容优化
    firstActiveCue(newVal) {
      this.firstCueHTML.pop();
      if (newVal) {
        // 这里对cue进行处理
        // 得到cue的line和position确定位置
        this.firstCueHTML.push(WebVTT.convertCueToDOMTree(window, this.firstActiveCue.text)
          .innerHTML);
      }
    },
  },
  created() {
    this.$bus.$on('video-loaded', this.init);
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
      this.$store.commit('SubtitleOff');
    });

    this.$bus.$on('sub-style-change', this.subStyleChange);

    this.$bus.$on('add-subtitle', (files) => {
      const size = this.$store.getters.subtitleNameArrSize;
      const subtitleName = files.map(file => this.$_subNameFromLocalProcess(file));
      this.$store.commit('AddSubtitle', subtitleName);
      this.addVttToVideoElement(files, () => {
        this.subtitleShow(size);
      });
    });

    this.$bus.$on('load-server-transcripts', () => {
      this.loadServerTextTracks(() => {
        this.subtitleShow(0);
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

