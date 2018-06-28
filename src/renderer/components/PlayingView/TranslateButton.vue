<template>
  <div>
    <div class="subtitle">
      <div class="subtitle-wrapper">
        <div class="subtitle-content"
          v-for="(div, keys) in subtitleDivs"
          :key="keys"
          v-show="subtitleAppearFlag"
          v-html="div.innerHTML">
        </div>
      </div>
      <div class="subtitle-button"
        @click="toggleSubtitle">
        <img src="" alt="subtitle-button">
      </div>
    </div>
  </div>
</template>;

<script>
import fs from 'fs';
import srt2vtt from 'srt-to-vtt';
import { WebVTT } from 'vtt.js';

export default {
  data() {
    return {
      vid: {},
      subtitleDivs: [],
      subtitleArr: [],
      startIndex: 0,
      subtitleAppearFlag: true,
    };
  },
  methods: {
    // 可以考虑其他的传递方法
    loadTextTracks() {
      const { vid } = this;
      this.startIndex = vid.textTracks.length;
      // hide every text text/subtitle tracks at beginning
      for (let i = this.startIndex; i < this.startIndex; i += 1) {
        vid.textTracks[i].mode = 'disabled';
      }
      this.findSubtitleFilesByVidPath(decodeURI(vid.src), (subPath) => {
        const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
        const sub = vid.addTextTrack('subtitles', 'splayer-custom');
        this.subtitleArr.push(subPath);

        // 后期改变字幕时间轴时在这里进行处理，保存一个新文件进行读取
        parser.oncue = (cue) => {
          sub.addCue(cue);
        };
        // parser.onflush = () => {
        // };
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
        this.showSubtitle(this.startIndex);
      });
    },
    showSubtitle(id) {
      const { vid } = this;
      // 消除之前的字幕oncuechange事件
      vid.textTracks[0].oncuechange = null;
      vid.textTracks[id].oncuechange = (cue) => {
        if (vid.textTracks[id].activeCues.length === 0) {
          this.subtitleDivs.pop();
        } else {
          const cueText = cue.currentTarget.activeCues[0].text;
          const div = WebVTT.convertCueToDOMTree(window, cueText);
          // subtitleDivs没有内容时，无效的pop
          this.subtitleDivs.pop();
          this.subtitleDivs.push(div);
        }
        console.log(this.subtitleDivs);
      };
    },
    toggleSubtitle() {
      this.subtitleAppearFlag = !this.subtitleAppearFlag;
    },
  },
  created() {
    this.$bus.$on('metaLoaded', (video) => {
      this.vid = video;
      this.loadTextTracks();
    });
  },
};
</script>

<style>
.subtitle {
  position: absolute;
  width: 100%;
  bottom: 20px;
}
.subtitle-button {
  position: absolute;
  bottom: 10px;
  right: 100px;
  float: right;
}
.subtitle-button:hover {
  cursor: pointer;
}
.subtitle-content {
  font-size: 20px;
  color: yellow;
  text-align: center;
  white-space: pre;
}
</style>
