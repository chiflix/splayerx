<template>
  <div>
    <div class="subtitle">
      <div class="subtitle-wrapper"
        :style="{bottom: subtitleBottom+'px'}">
        <div class="subtitle-controller"
          v-show="subtitleCtrlFlag">
          <span class="subtitle-menu-button"
          @click.stop.capture="subtitleChange">
            测试字幕1
          </span>
          <span class="subtitle-show-button"
            @click.stop.capture="toggleSubtitle">
            <img src="" alt="button">
          </span>
          <span class="subtitle-add-button"
            @click.stop.capture="subtitleAdd">+</span>
        </div>
        <div class="subtitle-content"
          v-for="(div, keys) in subtitleDivs"
          :key="keys"
          v-if="subtitleAppearFlag"
          v-html="div.innerHTML"
        >
        </div>
      </div>
      <div class="subtitle-button"
        @click.stop.capture="toggleSubtitleCtrl">
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
      curIndex: 0,
      subtitleAppearFlag: true,
      subtitleBottom: 0,
      subtitleCtrlFlag: false,
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
        this.curIndex = this.startIndex;
        this.showSubtitle(this.startIndex);
      });
    },
    showSubtitle(id) {
      const { vid } = this;
      // 消除之前的字幕oncuechange事件
      vid.textTracks[this.curIndex].oncuechange = null;
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
    toggleSubtitleCtrl() {
      this.subtitleCtrlFlag = !this.subtitleCtrlFlag;
    },
    subtitleChange() {
      const targetSubtitle = this.curIndex + 1;
      this.showSubtitle(targetSubtitle);
      this.curIndex = targetSubtitle;
    },
    subtitleAdd() {

    },
  },
  created() {
    this.$bus.$on('metaLoaded', (video) => {
      this.vid = video;
      this.loadTextTracks();
    });
    this.$bus.$on('progressslider-appear', () => {
      this.subtitleBottom = 10;
    });
    this.$bus.$on('progressbar-appear', () => {
      this.subtitleBottom = 10;
    });
    this.$bus.$on('progressbar-hide', () => {
      this.subtitleBottom = 0;
    });
  },
};
</script>

<style>
.video-controller .subtitle {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}
.subtitle-wrapper {
  position: absolute;
  width: 100%;
  display: -webkit-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.subtitle-show-button:hover, .subtitle-add-button:hover, .subtitle-menu-button:hover {
  cursor: pointer;
}
.subtitle-content {
  font-size: 20px;
  color: yellow;
  text-align: center;
  white-space: pre;
}
.subtitle-button {
  position: absolute;
  bottom: 20px;
  right: 100px;
  float: right;
}
.subtitle-button:hover {
  cursor: pointer;
}
</style>
