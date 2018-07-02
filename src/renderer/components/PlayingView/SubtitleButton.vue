<template>
  <div class="subtitle">
    <div class="subtitle-wrapper"
      :style="{bottom: subtitleBottom+'px'}">
      <div class="subtitle-controller"
        v-show="subtitleAppearFlag">
        <div class="subtitle-menu"
          v-show="subtitleMenuAppearFlag">
          <SubtitleList/>
        </div>
        <div class="subtitle-menu-button"
          @click.stop.capture.left="toggleSubtitleMenu"
          :title="curSubtitleName">
          {{curSubtitleName}}
        </div>
        <!-- <div class="subtitle-add-button"
          @click.stop.capture.left="subtitleAdd">+</div> -->
      </div>
      <div class="main-subtitle-content"
        v-for="(div, key) in subtitleDivs"
        :key="key"
        v-if="subtitleAppearFlag"
        v-html="div.innerHTML"
      >
      </div>
      <!-- <div class="minor-subtitle-content"
        v-for="(div, key) in minorSubDivs"
        :key="key"
        v-if="minorSubAppearFlag"
        v-html="div.innerHTML">
      </div> -->
    </div>
    <div class="subtitle-button"
      @click.stop.capture="toggleSubtitle">
      <img src="" alt="subtitle-button">
    </div>
  </div>
</template>;

<script>
import fs from 'fs';
import srt2vtt from 'srt-to-vtt';
import { WebVTT } from 'vtt.js';
import path from 'path';
import subtitleMixin from '@/commons/js/mixin';
import { SUBTITLE_BOTTOM } from '@/constants';
import SubtitleList from './SubtitleList/SubtitleList';

/**
 * Todo:
 * 1. 当无字幕时的处理。
 * 2. css样式修改。
 */
export default {
  mixins: [subtitleMixin],
  components: {
    SubtitleList,
  },
  data() {
    return {
      subtitleDivs: [],
      minorSubDivs: [],
      subtitleMenuAppearFlag: false,
      subtitleAppearFlag: true,
      minorSubAppearFlag: false,
      subtitleCtrlFlag: false,
      subtitleBottom: 0,
    };
  },
  methods: {
    // 可以考虑其他的传递方法
    loadTextTracks() {
      const vid = this.$store.state.PlaybackState.VideoCanvas;
      const startIndex = vid.textTracks.length;
      this.$store.commit('StartIndex', startIndex);
      // hide every text text/subtitle tracks at beginning
      for (let i = this.$store.state.PlaybackState.CurrentIndex; i < startIndex; i += 1) {
        vid.textTracks[i].mode = 'disabled';
      }
      this.findSubtitleFilesByVidPath(decodeURI(vid.src), (subPath) => {
        const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
        const filename = path.parse(subPath).name;
        const sub = vid.addTextTrack('subtitles', filename);

        // 后期改变字幕时间轴时在这里进行处理，保存一个新文件进行读取
        parser.oncue = (cue) => {
          sub.addCue(cue);
        };
        // 每当有一个字幕加载，为其添加oncuechange事件，并改变mode为disabled
        // 可以拆分出来做一个函数
        sub.mode = 'disabled';
        sub.oncuechange = (cue) => {
          if (sub.activeCues.length === 0) {
            this.subtitleDivs.pop();
          } else {
            const cueText = cue.currentTarget.activeCues[0].text;
            const div = WebVTT.convertCueToDOMTree(window, cueText);
            // subtitleDivs没有内容时，无效的pop
            this.subtitleDivs.pop();
            this.subtitleDivs.push(div);
          }
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
        this.subtitleShow(startIndex);
      });
    },
    toggleSubtitle() {
      this.subtitleAppearFlag = !this.subtitleAppearFlag;
    },
    toggleSubtitleCtrl() {
      this.subtitleCtrlFlag = !this.subtitleCtrlFlag;
    },
    toggleSubtitleMenu() {
      this.subtitleMenuAppearFlag = !this.subtitleMenuAppearFlag;
    },
  },
  computed: {
    curSubtitleName() {
      if (!this.$store.state.PlaybackState.VideoCanvas) {
        return '';
      }
      return this.$store.state.PlaybackState.VideoCanvas
        .textTracks[this.$store.state.PlaybackState.CurrentIndex].label;
    },
  },
  created() {
    this.$bus.$on('metaLoaded', () => {
      console.log('loadTextTracks');
      // console.log(this.$store.state.PlaybackState.VideoCanvas);
      this.loadTextTracks();
    });
    this.$bus.$on('progressslider-appear', () => {
      this.subtitleBottom = SUBTITLE_BOTTOM;
    });
    this.$bus.$on('progressbar-appear', () => {
      this.subtitleBottom = SUBTITLE_BOTTOM;
    });
    this.$bus.$on('progressbar-hide', () => {
      this.subtitleBottom = 0;
    });
  },
};
</script>

<style lang="scss">
.video-controller .subtitle {

  .subtitle-wrapper {
    position: absolute;
    width: 100%;
    display: -webkit-flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .subtitle-controller {
      display: inline;
      .subtitle-menu {
        // height: 100px;
        // width: 250px;
      }

      .subtitle-menu-button {
        display: inline-block;
        width: 250px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .subtitle-add-button {
        width: 50px;
        text-align: center;
        display: inline-block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .subtitle-add-button:hover, .subtitle-menu-button:hover {
        cursor: pointer;
      }
    }
    .main-subtitle-content {
      font-size: 20px;
      color: greenyellow;
      text-align: center;
      white-space: pre;
    }
  }

}
.video-controller .subtitle-button {
  position: absolute;
  bottom: 20px;
  right: 100px;
  float: right;
}
.video-controller .subtitle-button:hover {
  cursor: pointer;
}
</style>
