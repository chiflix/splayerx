<template>
    <div class="subtitle-wrapper">
      <!-- Need a way to avoid v-html -->
      <div class='flex-box'>
        <div class='subtitle-content'
          :style="subStyle"
          v-for="(html, key) in firstCueHTML"
          :key="key"
          v-html="html"></div>
      </div>
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
      Sagi: null,
      mediaHash: '',
      firstActiveCues: [],
      secondActiveCues: [],
      firstCueHTML: [],
      secondCueHTML: [],
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
    subtitleInitialize() {
      const vid = this.$parent.$refs.videoCanvas.videoElement();
      this.mediaHash = this.mediaQuickHash(decodeURI(vid.src.replace('file://', '')));
      // This code is aim to get mediaHash of video
      // fs.writeFile('111.txt', this.mediaHash, (err) => {
      //   console.log(err);
      // });
      this.Sagi = this.sagi();
      const files = [];
      // Find local subtitles
      this.findSubtitleFilesByVidPath(decodeURI(vid.src), (subPath) => {
        files.push(subPath);
      });

      if (files.length > 0) {
        this.loadLocalTextTracks(files, () => {
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
     * @param {Array.<string>} files File pathes array
     * @param {function} cb callback after finished function
     */
    loadLocalTextTracks(files, cb) {
      /* TODO:
       * 字幕代码我自己觉得很不满意，期待更好的处理 - Tomasen
       * move subtitle process to another component
       * DOCs:
       * https://gist.github.com/denilsonsa/aeb06c662cf98e29c379
       * https://developer.mozilla.org/en-US/docs/Web/API/VTTCue
       * https://hacks.mozilla.org/2014/07/adding-captions-and-subtitles-to-html5-video/
       */
      /*
       * TODO:
       * If there is already text track, load it
       * If there is already subtitle files(opened or loaded), load it
       * If there is no (chinese/default language) text track, try translate api
       */
      // If there is already subtitle files(same dir), load it
      this.addVttToVideoElement(files, () => {
        this.$_clearSubtitle();
        const subNameArr = files.map(file => this.$_subNameFromLocalProcess(file));
        this.$store.commit('SubtitleNameArr', subNameArr);
        cb();
      });
    },
    /**
     * @param {function} cb callback function to process result
     * after server transcript loaded.
     * @description Load transcript from server and do callback function
     * after finished all request.
     */
    loadServerTextTracks(cb) {
      this.Sagi.mediaTranslate(this.mediaHash)
        .then((res) => {
          // handle 2 situations:
          if (res.array[0][1] && res.array[0][1] !== 'OK') {
            console.log('Warning: No server transcripts.');
            console.log('Please load stream translate.');
          } else {
            const textTrackList = res.array[1];

            this.getAllTranscriptsFromServer(textTrackList)
              .then((resArray) => {
                for (let i = 0; i < resArray.length; i += 1) {
                  const res = resArray[i];
                  this.addCuesArray(res.array[1]);
                }

                // Only when all subtitles are successfully loaded,
                // users can see the server subtitles in Subtitle Menu.
                this.$_clearSubtitle();
                const subtitleNameArr = textTrackList
                  .map(textTrack => this.$_subnameFromServerProcess(textTrack));
                this.$store.commit('SubtitleNameArr', subtitleNameArr);

                cb();
              })
              .catch((err) => {
                console.log('-----');
                console.log('Error: load all transcripts error');
                console.log(err);
              });
          }
        })
        .catch((err) => {
          console.log('------');
          console.log('Error: load textTrackList error');
          console.log(err);
        });
    },

    /* this method is used to convert the timecodes extracted from matroska-subtitle
      library (convert) to the timecodes format for VTT format.

    msToTime(s) {
      const ms = s % 1000;
      s = (s - ms) / 1000;
      const secs = s % 60;
      s = (s - secs) / 60;
      const mins = s % 60;
      const hrs = (s - mins) / 60;
      return (`${z(2, hrs)}:${z(2, mins)}:${z(2, secs)}.${z(3, ms)}`);
    }, */


    /*
    the following method reads the subtitles embeded in the MKV files,
    and add these subtitles into the video's texttracks.
    But the structure of this method need to be changed and improved.

    autoloadMkvSubtitles(filePath, cb) {
      console.log(filePath);
      const ectractFn = filePath => new Promise((resolve) => {
        let tracks;
        const subs = new MatroskaSubtitles();
        subs.once('tracks', (track) => {
          console.log(track);
          tracks = track;
          tracks.forEach((trac) => {
            trac.subContent = '';
          });
        });
        subs.on('subtitle', (sub, trackNumber) => {
          const currentTrackIndex = trackNumber - 1;
          let currentContent = '';
          // the indices for each cue is probably can be ignored as it's VTT format

          currentContent += `${this.msToTime(sub.time)} -->
            ${this.msToTime(sub.time + sub.duration)}\r\n`;
          currentContent += `${(sub.text)}\r\n\r\n`;

          tracks[currentTrackIndex].subContent += currentContent;
        });

        subs.on('finish', () => {
          resolve(tracks);
        });
        const realPath = filePath.substring(8);
        fs.createReadStream(realPath).pipe(subs);
      });
      ectractFn(filePath).then((realTracks) => {
        // now transfer string into VTT
        console.log(realTracks);
        const vid = this.$parent.$refs.videoCanvas.videoElement();

        const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
        for (let i = 0; i < realTracks.length; i += 1) {
          const sub = vid.addTextTrack('subtitles');
          sub.mode = 'disabled';
          parser.oncue = (cue) => {
            sub.addCue(cue);
          };
          const webVttFormatStr = 'WEBVTT\r\n\r\n';
          const preResult = realTracks[i].subContent;
          const result = webVttFormatStr.concat(preResult);
          parser.parse(result);
        }
        parser.onflush = cb;
        parser.flush();
      });
    },
    */
    /**
     * @description Process subtitles and add subtitles to video element
     * @param {Array.<string>} files File pathes array
     * @param {function} cb Callback function to process result
     */
    addVttToVideoElement(files, cb) {
      const vid = this.$parent.$refs.videoCanvas.videoElement();
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
          const result = results[i];
          parser.parse(result.toString('utf8'));
        }
        parser.onflush = cb;
        parser.flush();
      });
    },
    /**
     * @description Load all transcrips from server
     */
    async getAllTranscriptsFromServer(textTrackList) {
      let resArray = [];
      const waitArray = [];
      for (let i = 0; i < textTrackList.length; i += 1) {
        const transcriptId = textTrackList[i][0];
        const res = this.Sagi.getTranscript(transcriptId);
        waitArray.push(res);
      }
      resArray = await Promise.all(waitArray);
      return resArray;
    },
    /**
     * @description Transfer cues array from server to vtt files
     * and add these cues into video subtitles.
     */
    addCuesArray(cueArray) {
      const vid = this.$parent.$refs.videoCanvas.videoElement();
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
      const vid = this.$parent.$refs.videoCanvas.videoElement();
      const targetIndex = this.$store.state.PlaybackState.SubtitleNameArr[index].textTrackID;
      if (type === 'first') {
        if (vid.textTracks.length > targetIndex) { // Video has available subtitles
          this.$_onCueChangeEventAdd(vid.textTracks[targetIndex]);
          vid.textTracks[targetIndex].mode = 'hidden';
          this.$store.commit('SubtitleOn', { index: targetIndex, status: type });
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
     * @param {function} cb Callback function to process result.
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
     * @param {function} cb Callback function to process result
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
      if (textTrack[1]) {
        title += textTrack[1];
      } else {
        console.log('Error: No language code');
        console.log('Use default subtitle name');
        title = 'subtitle';
      }
      // process language code to subtitle name
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
        const { activeCues } = cue.currentTarget;
        this.firstActiveCues.pop();
        this.firstActiveCues.push(activeCues);
      };
      const secondSubEvent = (cue) => {
        const { activeCues } = cue.currentTarget;
        this.secondActiveCues.pop();
        this.secondActiveCues.push(activeCues);
      };
      // write a same sub event to handle same subtitle situation
      textTrack.oncuechange = type === 'first' ? firstSubEvent : secondSubEvent;
    },
    /**
     * @description function to clear former subtitles
     * @param {string} type clear first, second or all subtitles
     */
    $_clearSubtitle(type = 'first') {
      if (type === 'first') {
        if (this.firstSubState) {
          const vid = this.$parent.$refs.videoCanvas.videoElement();
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
      return this.$store.getters.firstSubIndex !== -1;
    },
  },
  watch: {
    firstSubState(newVal) {
      const vid = this.$parent.$refs.videoCanvas.videoElement();
      if (newVal && vid.textTracks[this.firstSubIndex].mode === 'disabled') {
        vid.textTracks[this.firstSubIndex].mode = 'hidden';
      } else if (!newVal && vid.textTracks[this.firstSubIndex].mode !== 'disabled') {
        this.firstActiveCues.pop();
        vid.textTracks[this.firstSubIndex].mode = 'disabled';
      } else {
        console.log('Error: mode is not correct');
      }
    },
    // 需要对这一部分内容优化
    firstActiveCues(newVal) {
      // 此处的处理方式不够完美，需要后期重写
      // 根据vtt.js的代码，重写一个对于cue的处理函数，添加到div中
      // 涵盖了各种style与字幕位置
      const activeCues = newVal[0];
      while (this.firstCueHTML.length !== 0) {
        this.firstCueHTML.pop();
      }
      for (let i = 0; activeCues && i < activeCues.length; i += 1) {
        this.firstCueHTML.push(WebVTT.convertCueToDOMTree(window, activeCues[i].text).innerHTML);
      }
      // const divs = WebVTT.processCues(window, activeCues, this.$refs.firstSubtitleContent);
      // console.log(divs);
    },
  },
  created() {
    this.$bus.$on('video-loaded', this.subtitleInitialize);

    this.$bus.$on('sub-first-change', (targetIndex) => {
      this.$_clearSubtitle();
      this.subtitleShow(targetIndex);
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
        this.$_clearSubtitle();
        this.subtitleShow(size);
      });
    });

    this.$bus.$on('load-server-transcripts', () => {
      this.loadServerTextTracks(() => {
        this.$_clearSubtitle();
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
    left: 0;
    bottom: 20px;
    width: 100%;
  }
  .subtitle-content {
    white-space: pre;
    text-align: center;
  }
  .flex-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}
// 将来放弃flex时使用
// .video {
  // .subtitle-wrapper {
  //   position: absolute;
  //   top: 0;
  //   left: 0;
  //   width: 100%;
  //   height: 100%;

  //   .subtitle-content {
  //     position: absolute;
  //     bottom: 20px;
  //     text-align: center;
  //     width: 100%;
  //     white-space: pre;
  //   }
  // }
// }
</style>

