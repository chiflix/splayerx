<template>
    <div
      :data-component-name="$options.name"
      class="subtitle-wrapper">
      <!-- Need a way to avoid v-html -->
      <div class='flex-box'>
        <div class='subtitle-content'
          :style="subStyle"
          v-for="(html, key) in firstCueHTML"
          :key="key"
          v-html="html"></div>
        <div class='subtitle-border-content'
          :style="subBorderStyle"
          v-for="(html, key) in firstCueHTML"
          :key="key"
          v-html="html"></div>
      </div>
    </div>
</template>

<script>
/* eslint-disable no-loop-func, no-use-before-define */
import { mapGetters } from 'vuex';
import fs from 'fs';
import srt2vtt from 'srt-to-vtt';
import ass2vtt from 'ass-to-vtt';
import { WebVTT } from 'vtt.js';
import path from 'path';
import parallel from 'run-parallel';
import MatroskaSubtitles from 'matroska-subtitles';
import LanguageDetect from 'languagedetect';
import z from 'zero-fill';
import asyncStorage from '@/helpers/asyncStorage';
// 后期查找服务端字幕也许会用到
// import { fileUrlToPath } from '@/helpers/path';

export default {
  name: 'base-subtitle',
  data() {
    return {
      textTrackID: 0,
      firstSubIndex: null,
      Sagi: null,
      mediaHash: '',
      readingMkv: false,
      currentParsedMkvTime: 0,
      mkvSubsInitialized: false,
      mkvSubsSeekedParsed: false,
      mkvSubsFullyParsed: false,
      idleCallbackID: null,
      mkvParsedTimes: [],
      mkvSubArray: [], // which is the mkvSubNamesArray
      firstActiveCues: [],
      secondActiveCues: [],
      firstCueHTML: [],
      secondCueHTML: [],
      subStyle: {},
      subIndex: 0,
      subBorderStyle: {},
    };
  },
  methods: {
    async subtitleInitialize() {
      if (this.readingMkv) {
        this.$emit('stop-reading-mkv-subs', 'Stopped.');
        this.readingMkv = false;
        // the following 3 lines may cause bugs, need to consider the
        // logic more carefully.
        this.currentParsedMkvTime = 0;
        this.mkvSubArray = [];
        this.$bus.$emit('subtitles-finished-loading', 'Embedded');
      }

      const subStatus = await this.subtitleInitializingStatus();

      const localSubsStatus = subStatus[0];
      const embeddedSubsStatus = subStatus[1];
      const serverSubsStatus = subStatus[2];

      const localSubsOn = localSubsStatus.found;
      const embeddedSubsOn = embeddedSubsStatus.found;
      const serverSubsOn = serverSubsStatus.found;

      // logic of loading subtitles:
      // if there are some subtitle files in the same direction, load them
      // also if the video has embedded subtitles, load them
      // if there are no local or embedded subtitles found, load server subtitles
      if (localSubsOn || embeddedSubsOn || serverSubsOn) {
        if (localSubsOn || embeddedSubsOn) {
          // the 'onlyEmbedded' constant aims to identify if the following situation
          // happens:
          // the video only contains embedded subtitles
          // or
          // the video contains local subtitles and embedded subtitles
          const onlyEmbedded = (!localSubsOn) && embeddedSubsOn;

          if (localSubsOn) {
            this.$bus.$emit('loading-subtitles', {
              type: 'Local',
              size: localSubsStatus.size,
            });
            this.loadLocalTextTracks(localSubsStatus.fileList, () => {
              this.toggleSutitleShow();
              this.$bus.$emit('subtitles-finished-loading', 'Local');
            });
          }
          if (embeddedSubsOn) {
            this.$bus.$emit('loading-subtitles', {
              type: 'Embedded',
              size: embeddedSubsStatus.size,
            });
            this.mkvProcess(this.originSrc, onlyEmbedded, () => {
              this.toggleSutitleShow();
              this.$bus.$emit('subtitles-finished-loading', 'Embedded');
            });
          }
        } else {
          this.$bus.$emit('loading-subtitles', {
            type: 'Server',
            size: serverSubsStatus.size,
          });
          this.loadServerTextTracks((err) => {
            if (err) {
              this.addLog('error', err);
              throw err;
            }
            this.toggleSutitleShow();
            this.$bus.$emit('subtitles-finished-loading', 'Server');
          });
        }
      } else {
        // there are no subtitles found, no local, embedded or server subtitles
        // then emit an event to tell subtitleControl to toggle the small menu
        this.$bus.$emit('toggle-no-subtitle-menu');
      }
    },
    async subtitleInitializingStatus() {
      const vidSrc = this.originSrc;
      let subStatus = [];
      this.mediaHash = this.mediaQuickHash(vidSrc);
      this.Sagi = this.sagi();

      // serverSubsExist
      let serverSubsStatus;
      const res = await this.Sagi.mediaTranslate(this.mediaHash);
      if (!(res.array[0][1] && res.array[0][1] !== 'OK')) {
        serverSubsStatus = {
          found: true,
          size: res.array[1].length,
        };
      } else {
        serverSubsStatus = {
          found: false,
          size: 0,
        };
      }

      const files = [];
      this.findSubtitleFilesByVidPath(vidSrc, (subPath) => {
        files.push(subPath);
      });
      const localSubsStatus = {
        found: files.length > 0,
        size: files.length,
        fileList: files,
      };

      const re = new RegExp('^(.mkv)$');
      let embeddedSubsStatus;
      if (re.test(path.extname(vidSrc))) {
        embeddedSubsStatus = await this.hasEmbeddedSubs(vidSrc);
      } else {
        embeddedSubsStatus = {
          found: false,
          size: 0,
        };
      }
      subStatus = [localSubsStatus, embeddedSubsStatus, serverSubsStatus];
      return subStatus;
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
        this.clearSubtitle();
        const subNameArr = files.map(file => this.subNameFromLocalProcess(file));
        this.$store.commit('SubtitleNames', subNameArr);
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
          this.addLog('info', res.array);
          // handle 2 situations:
          if (res.array[0][1] && res.array[0][1] !== 'OK') {
            this.addLog('warn', 'Warning: No server transcripts.  Please load stream translate.');
            cb('No server transcripts');
          } else {
            const textTrackList = res.array[1];
            const delay = res.array[4];

            this.getAllTranscriptsFromServer(textTrackList)
              .then((resArray) => {
                for (let i = 0; i < resArray.length; i += 1) {
                  const res = resArray[i];
                  this.addCuesArray(res.array[1], delay);
                }

                // Only when all subtitles are successfully loaded,
                // users can see the server subtitles in Subtitle Menu.
                this.clearSubtitle();
                const subtitleNames = textTrackList
                  .map(textTrack => this.subnameFromServerProcess(textTrack));
                this.$store.commit('SubtitleNames', subtitleNames);

                cb();
              })
              .catch((err) => {
                this.addLog('error', '-----Error: load all transcripts error');
                this.addLog('error', err);
                cb(err);
              });
          }
        })
        .catch((err) => {
          this.addLog('error', '-----Error: load textTrackList error');
          this.addLog('error', err);
          cb(err);
        });
    },
    hasEmbeddedSubs(filePath) {
      return new Promise((resolve) => {
        let foo;
        const subs = new MatroskaSubtitles();
        subs.once('tracks', (track) => {
          if (track) {
            resolve({
              found: true,
              size: track.length,
            });
          }
        });
        subs.on('finish', () => {
          if (foo === undefined) {
            resolve({
              found: false,
              size: 0,
            });
          }
        });
        fs.createReadStream(filePath).pipe(subs);
      });
    },
    mkvProcess(vidPath, onlyEmbedded, cb) {
      this.mkvProcessInit(vidPath, onlyEmbedded, () => {
        this.addLog('info', 'finished reading initial mkv subtitles');
        cb();
        this.mkvSubsInitialized = true;
      });
    },
    mkvProcessInit(filePath, onlyEmbedded, cb) {
      const accurateTime = this.$store.state.Video.currentTime;
      const startTime = accurateTime * 1000;
      const endTime = this.mkvInitializingReadingEndTime * 1000;
      const processSubNames = true;
      this.parseMkvSubs(filePath, startTime, endTime, onlyEmbedded, processSubNames)
        .then((tracks) => {
          this.addMkvSubtitlesToVideoElement(tracks, onlyEmbedded, processSubNames, cb);
        });
    },
    addMkvSubtitlesToVideoElement(tracks, onlyEmbedded, processSubNames, cb) {
      const vid = this.$parent.$refs.videoCanvas.videoElement();
      const embededSubNames = [];
      const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
      let sub;
      for (let i = 0; i < tracks.length; i += 1) {
        if (processSubNames) {
          const currentSubObj = {
            trackNumber: tracks[i].number,
            textTrackID: this.textTrackID,
          };
          this.mkvSubArray.push(currentSubObj);
          embededSubNames[i] = {
            title: `${this.findMode(tracks[i].subLangs)}`,
            status: null,
            textTrackID: this.textTrackID,
            origin: 'local',
          };
          this.textTrackID += 1;
          sub = vid.addTextTrack('subtitles');
          sub.mode = 'disabled';
        } else {
          const currentArrIndex = this.mkvSubArray
            .findIndex(trac => trac.trackNumber === tracks[i].number);
          const currentTextTrackID = this.mkvSubArray[currentArrIndex].textTrackID;
          sub = vid.textTracks[currentTextTrackID];
        }
        parser.oncue = (cue) => {
          sub.addCue(cue);
        };
        const webVttFormatStr = 'WEBVTT\r\n\r\n';
        const preResult = tracks[i].subContent;
        const result = webVttFormatStr.concat(preResult);
        parser.parse(result);
      }
      parser.onflush = cb;
      if (processSubNames) {
        this.clearSubtitle();
        if (onlyEmbedded) {
          this.$store.commit('SubtitleNames', embededSubNames);
        } else {
          this.$store.commit('AddSubtitle', embededSubNames);
        }
      }
      this.readingMkv = false;
      parser.flush();
    },
    parseMkvSubs(filePath, startTime, endTime, onlyEmbedded, processSubNames) {
      this.readingMkv = true;
      const self = this;
      return new Promise((resolve, reject) => {
        let tracks = [];
        const parser = new MatroskaSubtitles();
        const lngDetector = new LanguageDetect();

        parser.once('tracks', (track) => {
          tracks = track;
          tracks.forEach((trac) => {
            trac.subContent = '';
            if (processSubNames) {
              trac.subLangs = [];
            }
          });
        });

        self.$on('stop-reading-mkv-subs', (error) => {
          this.addLog('error', error);
          parser.emit('finish', error);
        });

        parser.on('subtitle', (sub, trackNumber) => {
          if (endTime && sub.time > endTime) {
            self.currentParsedMkvTime = sub.time;
            parser.emit('finish');
          }
          // even currently we can not read subtitles from a specific time
          // straightly, but this if condition does improve some performance
          // avoiding adding unnecessary subtitles
          if (startTime < sub.time && this.notParsedYet(sub.time)) {
            const currentIndex = tracks.findIndex(track => trackNumber === track.number);
            let currentContent = '';
            currentContent += `${this.msToTime(sub.time)} --> ${this.msToTime(sub.time + sub.duration)}\r\n`;
            currentContent += `${(sub.text)}\r\n\r\n`;

            tracks[currentIndex].subContent += currentContent;

            if (processSubNames) {
              let currentLangDetected = '';
              const temp = lngDetector.detect(sub.text, 3);
              if (temp === undefined || temp[0] === undefined) {
                currentLangDetected += 'nothing';
              } else {
                currentLangDetected += temp[0][0];
              }

              tracks[currentIndex].subLangs.push(currentLangDetected);
            }
          }
        });

        parser.on('finish', (err) => {
          if (err) {
            this.addLog('error', err);
            reject(err);
          } else {
            const parsedMkvTimesObj = {
              start: startTime,
              end: endTime,
            };
            this.mkvParsedTimes.push(parsedMkvTimesObj);
            resolve(tracks);
          }
        });
        fs.createReadStream(filePath).pipe(parser);
      });
    },
    /**
     * @description Process subtitles and add subtitles to video element
     * @param {Array.<string>} files File pathes array
     * @param {function} cb Callback function to process result
     */
    addVttToVideoElement(files, cb) {
      const vid = this.$parent.$refs.videoCanvas.videoElement();
      /* eslint-disable arrow-parens */
      const tasks = files.map((subPath) => (cb) => this.createSubtitleStream(subPath, cb));
      parallel(tasks, (err, results) => {
        if (err) {
          this.addLog('error', err);
          throw err;
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
     * @param {Number} delay time offset
     */
    addCuesArray(cueArray, delay) {
      const vid = this.$parent.$refs.videoCanvas.videoElement();
      const subtitle = vid.addTextTrack('subtitles');
      subtitle.mode = 'disabled';
      // Add cues to TextTrack
      for (let i = 0; i < cueArray.length; i += 1) {
        const element = cueArray[i];
        const startTime = this.timeProcess(element[0], delay);
        const endTime = this.timeProcess(element[1], delay);
        subtitle.addCue(new VTTCue(startTime, endTime, element[2]));
      }
    },
    /**
     * @param {number} index Target index of subtitle to show
     * @param {string} type First or second subtitle
     */
    subtitleShow(index, type = 'first') {
      const vid = this.$parent.$refs.videoCanvas.videoElement();
      const targetIndex = this.$store.state.Subtitle.SubtitleNames[index].textTrackID;
      if (type === 'first') {
        if (vid.textTracks.length > targetIndex) { // Video has available subtitles
          this.onCueChangeEventAdd(vid.textTracks[targetIndex]);
          vid.textTracks[targetIndex].mode = 'hidden';
          this.$store.commit('SubtitleOn', { index: targetIndex, status: type });
          this.firstSubIndex = targetIndex;
        } else {
          this.addLog('info', 'no subtitle');
        }
      }
      if (type === 'second') {
        this.addLog('info', 'show second subtitle');
      }
    },
    /**
     * @param {object} obj Contains style property
     * @description obj contains 6 values to control
     * the css style of the subtitle. Each unset
     * property will use default value.
     */
    subStyleChange() {
      this.subStyle = {
        fontFamily: this.curStyle.fontFamily,
        fontSize: this.curStyle.fontSize,
        letterSpacing: `${this.curStyle.letterSpacing}px`,
        opacity: this.curStyle.opacity,
        color: this.curStyle.color,
        fontWeight: this.curStyle.fontWeight,
        transform: this.curStyle.transform,
        transformOrigin: this.curStyle.transformOrigin,
        webkitFontSmoothing: this.curStyle.webkitFontSmoothing,
      };
      this.subBorderStyle = {
        fontFamily: this.curBorderStyle.fontFamily,
        fontSize: this.curBorderStyle.fontSize,
        letterSpacing: `${this.curBorderStyle.letterSpacing}px`,
        padding: this.curBorderStyle.padding,
        textFillColor: this.curBorderStyle.textFillColor,
        textStroke: this.curBorderStyle.textStroke,
        fontWeight: this.curBorderStyle.fontWeight,
        textShadow: this.curBorderStyle.textShadow,
        backgroundColor: this.curBorderStyle.backgroundColor,
        transform: this.curBorderStyle.transform,
        transformOrigin: this.curBorderStyle.transformOrigin,
        webkitFontSmoothing: this.curStyle.webkitFontSmoothing,
      };
    },
    notParsedYet(subStartTime) {
      for (let i = 0; i < this.mkvParsedTimes.length; i += 1) {
        const startTime = this.mkvParsedTimes[i].start;
        const endTime = this.mkvParsedTimes[i].end;
        if (subStartTime >= startTime && subStartTime <= endTime) {
          return false;
        }
      }
      return true;
    },
    msToTime(s) {
      const ms = s % 1000;
      s = (s - ms) / 1000;
      const secs = s % 60;
      s = (s - secs) / 60;
      const mins = s % 60;
      const hrs = (s - mins) / 60;
      return (`${z(2, hrs)}:${z(2, mins)}:${z(2, secs)}.${z(3, ms)}`);
    },
    findMode(array) {
      const map = new Map();
      let maxFreq = 0;
      let mode;

      for (let i = 0; i < array.length; i += 1) {
        let freq = map.has(array[i]) ? map.get(array[i]) : 0;
        freq += 1;

        if (freq > maxFreq) {
          maxFreq = freq;
          mode = array[i];
        }

        map.set(array[i], freq);
      }
      return mode;
    },
    /**
     * @link https://github.com/mafintosh/pumpify
     * @param {Pumpify} stream duplex stream for subtitles
     * @param {function} cb Callback function to process result.
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
        this.addLog('error', err);
        if (cb) {
          cb(err);
        }
        cb = null;
      });
    },
    /**
     * @param {Number} second
     * @param {Number} delay
     * @returns {Number}
     */
    timeProcess(second, delay) {
      // Now as per official proto3 documentation, default values are not
      // serialized to save space during wire transmission.
      // so if input is 0, it may become undefined
      if (!second) {
        return 0;
      }
      if (delay) {
        second += delay;
      }
      return second;
    },
    /**
     * @param {string} subPath Subtitle Path
     * @param {function} cb Callback function to process result
     */
    createSubtitleStream(subPath, cb) {
      const reSrt = new RegExp('^(.srt)$');
      const reAss = new RegExp('^(.ass)$');
      const subExtName = path.extname(subPath);

      let vttStream;
      if (reSrt.test(subExtName)) {
        vttStream = fs.createReadStream(subPath).pipe(srt2vtt());
      }
      if (reAss.test(subExtName)) {
        vttStream = fs.createReadStream(subPath).pipe(ass2vtt());
      }

      this.concatStream(vttStream, (err, buf) => {
        if (err) {
          this.addLog('error', err);
          throw err;
        }
        cb(null, buf);
      });
    },
    /**
     * @param {string} file Subtitle file path
     * @returns {object} Returns an object that contains subtitle name
     * and default status(status can be null, first and second)
     */
    subNameFromLocalProcess(file) {
      const res = {
        title: file.language === undefined ? path.parse(file).name : file.language,
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
    subnameFromServerProcess(textTrack) {
      let title = '';
      if (textTrack[1]) {
        title += textTrack[1];
      } else {
        this.addLog('error', 'Error: No language code  Use default subtitle name');
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
    onCueChangeEventAdd(textTrack, type = 'first') {
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
    clearSubtitle(type = 'first') {
      if (type === 'first') {
        if (this.firstSubState) {
          const vid = this.$parent.$refs.videoCanvas.videoElement();
          vid.textTracks[this.firstSubIndex].mode = 'disabled';
          vid.textTracks[this.firstSubIndex].oncuechange = null;
          this.$store.commit('SubtitleOff');
          this.firstSubIndex = null;
        } else {
          this.addLog('info', 'first subtitle not set');
        }
      }
    },
    toggleSutitleShow() {
      this.subStyleChange();
      this.subtitleShow(0);
    },
  },
  computed: {
    ...mapGetters(['duration', 'originSrc', 'currentTime', 'SubtitleDelay', 'curStyle', 'curBorderStyle']),
    firstSubState() { // lazy computed and lazy watched
      return this.$store.getters.firstSubtitleIndex !== -1;
    },
    mkvInitializingReadingEndTime() {
      const { duration, currentTime } = this;
      return duration > 3000 ? currentTime + 300 : currentTime + (duration / 10);
    },
  },
  watch: {
    SubtitleDelay(val, oldval) {
      if (this.subIndex !== -1) {
        const vid = this.$parent.$refs.videoCanvas.videoElement();
        const trackLength = vid.textTracks[this.subIndex].cues.length;
        for (let i = 0; i < trackLength; i += 1) {
          vid.textTracks[this.subIndex].cues[i].startTime += (val - oldval) / 1000;
          vid.textTracks[this.subIndex].cues[i].endTime += (val - oldval) / 1000;
        }
      }
    },
    curBorderStyle: {
      handler() {
        this.subStyleChange();
      },
      deep: true,
    },
    curStyle: {
      handler() {
        this.subStyleChange();
      },
      deep: true,
    },
    firstSubState(newVal) {
      const vid = this.$parent.$refs.videoCanvas.videoElement();
      if (newVal && vid.textTracks[this.firstSubIndex].mode === 'disabled') {
        vid.textTracks[this.firstSubIndex].mode = 'hidden';
      } else if (!newVal && vid.textTracks[this.firstSubIndex].mode !== 'disabled') {
        this.firstActiveCues.pop();
        vid.textTracks[this.firstSubIndex].mode = 'disabled';
      } else {
        this.addLog('error', 'Error: mode is not correct');
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
    mkvSubsInitialized(newVal) {
      if (newVal) {
        // if new value is true -- where should be called in the callback of initialize
        // stage, if new value is true, toggle the request idle
        // options can also be passed, [timeout] option
        const filePath = this.originSrc;
        this.idleCallbackID = window.requestIdleCallback(() => {
          this.parseMkvSubs(filePath, 0, null, false, false)
            .then((tracks) => {
              this.addMkvSubtitlesToVideoElement(tracks, false, false, () => {
                this.addLog('info', 'Rest of embedded subtitles have been added.');
                this.mkvSubsFullyParsed = true;
              });
            });
        });
      }
    },
    mkvSubsSeekedParsed(newVal) {
      if (newVal) {
        // if new value is true -- where should be called in the callback of seek sub
        // stage, if new value is true, toggle the request idle
        // options can also be passed, [timeout] option
        const filePath = this.originSrc;
        this.idleCallbackID = window.requestIdleCallback(() => {
          this.parseMkvSubs(filePath, 0, null, false, false)
            .then((tracks) => {
              this.addMkvSubtitlesToVideoElement(tracks, false, false, () => {
                this.addLog('info', 'Rest of embedded subtitles have been added.');
                this.mkvSubsFullyParsed = true;
              });
            });
        });
      }
    },
  },
  created() {
    asyncStorage.get('subtitle-style').then((data) => {
      if (data.curStyle) {
        this.$store.dispatch('updateStyle', data.curStyle);
      }
      if (data.curBorderStyle) {
        this.$store.dispatch('updateBorderStyle', data.curBorderStyle);
      }
    });
    this.$bus.$on('video-loaded', this.subtitleInitialize);

    this.$bus.$on('sub-first-change', (targetIndex) => {
      this.subIndex = targetIndex;
      this.clearSubtitle();
      this.subtitleShow(targetIndex);
    });

    this.$bus.$on('first-subtitle-on', () => {
      this.$store.commit('SubtitleOn', { index: this.firstSubIndex, status: 'first' });
    });
    this.$bus.$on('first-subtitle-off', () => {
      this.subIndex = -1;
      this.$store.commit('SubtitleOff');
    });

    this.$bus.$on('add-subtitle', (files) => {
      const size = this.$store.getters.subtitleCount;
      const subtitleName = files.map(file => this.subNameFromLocalProcess(file));
      this.$store.commit('AddSubtitle', subtitleName);
      this.addVttToVideoElement(files, () => {
        this.clearSubtitle();
        this.subtitleShow(size);
        this.$bus.$emit('added-local-subtitles', size);
      });
    });

    this.$bus.$on('load-server-transcripts', () => {
      this.loadServerTextTracks((err) => {
        if (err) {
          this.addLog('error', err);
          throw err;
        }
        // handles when users want to load server subs after initializing stage;
        this.$bus.$emit('finished-loading-server-subs');
        this.clearSubtitle();
        this.subtitleShow(0);
      });
      // cb();
    });
    this.$bus.$on('seek-subtitle', (e) => {
      if (this.mkvSubsInitialized && !this.mkvSubsFullyParsed) {
        this.mkvSubsSeekedParsed = false;
        if (this.idleCallbackID !== 0 || this.readingMkv) {
          window.cancelIdleCallback(this.idleCallbackID);
          this.$emit('stop-reading-mkv-subs', 'stopped');
        }
        const filePath = this.originSrc;
        this.parseMkvSubs(filePath, (e * 1000), (e + 120) * 1000, false, false)
          .then((tracks) => {
            this.addMkvSubtitlesToVideoElement(tracks, false, false, () => {
              this.addLog('info', 'seeked subtitles have been added');
              this.mkvSubsSeekedParsed = true;
            });
          });
      }
    });
  },
};
</script>

<style lang="scss" scoped>
.video {
  .subtitle-wrapper {
    position: absolute;
    left: 0;
    width: 100%;
    z-index: 5;
  }
  .subtitle-content {
    z-index: 1;
    white-space: pre;
    text-align: center;
  }
  .subtitle-border-content {
    position: absolute;
    z-index: 0;
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
