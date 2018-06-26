<template>
  <div>
    <div class="subtitle"></div>
  </div>
</template>;

<script>
import fs from 'fs';
import srt2vtt from 'srt-to-vtt';
import { WebVTT } from 'vtt.js';

export default {
  data() {
    return {

    };
  },
  methods: {
    // 可以考虑其他的传递方法
    loadTextTracks(vid) {
      /* TODO:
       * 字幕代码我自己觉得很不满意，期待更好的处理 - Tomasen
       * move subtitle process to another component
       * DOCs:
       * https://gist.github.com/denilsonsa/aeb06c662cf98e29c379
       * https://developer.mozilla.org/en-US/docs/Web/API/VTTCue
       * https://hacks.mozilla.org/2014/07/adding-captions-and-subtitles-to-html5-video/
       */

      // hide every text text/subtitle tracks at beginning
      for (let i = 0; i < vid.textTracks.length; i += 1) {
        vid.textTracks[i].mode = 'hidden';
      }

      // create our own text/subtitle track

      const subtitleArr = [];
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
        // const sub = vid.addTextTrack('subtitles', 'splayer-custom');
        const textTrack = [];
        parser.oncue = (cue) => {
          // sub.addCue(cue);
          // textTrack.push(cue);
          textTrack.push({
            endTime: cue.endTime,
            startTime: cue.startTime,
            text: cue.text,
          });
        };
        parser.onflush = () => {
          // if (!shownTextTrack) {
          //   // sub.mode = 'showing';
          //   shownTextTrack = true;
          // }
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
            subtitleArr.push(textTrack);
          });
      });

      console.log(subtitleArr);
      // if (process.env.NODE_ENV !== 'production') {
      //   const sub = vid.addTextTrack('subtitles', 'splayer-custom');
      //   console.log(`loadingTextTrack ${loadingTextTrack}`);
      //   if (!loadingTextTrack) {
      //     // Loading subtitle test
      //     const cue = new VTTCue(0, 30000, '字幕测试 Subtitle Test');
      //     sub.addCue(cue);
      //     sub.mode = 'showing';
      //   }
      // }
    },
  },
  created() {
    this.$bus.$on('metaLoaded', (vid) => {
      this.loadTextTracks(vid);
    });
  },
};
</script>

<style>
</style>
