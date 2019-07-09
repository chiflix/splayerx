<template>
  <div class="player">
    <the-video-canvas ref="videoCanvas" />
    <the-video-controller ref="videoctrl" />
    <subtitle-renderer
      :key="originSrc"
      :currentCues="concatCurrentCues"
      :subPlayRes="subPlayRes"
      :scaleNum="scaleNum"
      :subToTop="subToTop"
      :currentFirstSubtitleId="primarySubtitleId"
      :winHeight="winHeight"
      :chosenStyle="chosenStyle"
      :chosenSize="chosenSize"
    />
    <div
      v-fade-in="isTranslateModalVisiable"
      class="select-language-modal"
    >
      <h1 v-if="!isTranslating">
        选择视频源语言
      </h1>
      <h1 v-else>
        大约还需5分钟
      </h1>
      <p v-if="!isTranslating">
        目前尚无此语言的智能翻译结果，请准确选择您在视频中所听到的语言，翻译将持续一段时间。
      </p>
      <p v-else>
        请不要关闭播放器，您可以在该视频的翻译结果列表中查看进度。
      </p>
      <div
        v-if="!isTranslating"
        class="select"
      >
        <Select
          :static-label="translateLanguageLabel"
          :selected.sync="audioLanguage"
          :list="lanugages"
        />
      </div>
      <div
        v-else
        class="progress-wraper"
      >
        <Progress
          :progress="translateProgress"
        />
      </div>
      <div
        v-if="!isTranslating"
        class="button-wraper"
      >
        <div
          @click="hideTranslateModal"
          class="button"
        >
          取消
        </div>
        <div
          @click="translate"
          class="button"
        >
          确定
        </div>
      </div>
      <div
        v-else
        @click="hideTranslateModal"
        class="button"
      >
        确定
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex';
import {
  Subtitle as subtitleActions,
  SubtitleManager as smActions,
  AudioTranslate as atActions,
} from '@/store/actionTypes';
// grab libs
import { codeToLanguageName } from '@/libs/language';
// grab libs
import SubtitleRenderer from '@/components/Subtitle/SubtitleRenderer.vue';
import Select from '@/components/PlayingView/Select.vue';
import Progress from '@/components/PlayingView/Progress.vue';
import VideoCanvas from '@/containers/VideoCanvas.vue';
import TheVideoController from '@/containers/TheVideoController.vue';
import { videodata } from '../store/video';

export default {
  name: 'PlayingView',
  components: {
    Select,
    Progress,
    'the-video-controller': TheVideoController,
    'the-video-canvas': VideoCanvas,
    'subtitle-renderer': SubtitleRenderer,
  },
  data() {
    return {
      currentCues: [
        {
          cues: [],
          subPlayResX: 720,
          subPlayResY: 405,
        },
        {
          cues: [],
          subPlayResX: 720,
          subPlayResY: 405,
        },
      ],
      // grab btn datas
      audioLanguage: { label: codeToLanguageName('en'), value: 'en' },
      lanugages: ['zh-Hans', 'zh-Hant', 'ja', 'ko', 'en', 'es', 'ar']
        .map((e: string) => ({ label: codeToLanguageName(e), value: e })),
    };
  },
  computed: {
    ...mapGetters([
      'scaleNum', 'subToTop', 'primarySubtitleId', 'secondarySubtitleId', 'winHeight',
      'chosenStyle', 'chosenSize', 'originSrc', 'mediaHash', 'primaryLanguage', 'duration',
      'isTranslateModalVisiable', 'translateProgress', 'isTranslating', 'selectedTargetLanugage',
    ]),
    concatCurrentCues() {
      if (this.currentCues.length === 2) {
        return [this.currentCues[0].cues, this.currentCues[1].cues];
      }
      return [];
    },
    subPlayRes() {
      if (this.currentCues.length === 2) {
        return [
          { x: this.currentCues[0].subPlayResX, y: this.currentCues[0].subPlayResY },
          { x: this.currentCues[1].subPlayResX, y: this.currentCues[1].subPlayResY },
        ];
      }
      return [];
    },
    translateLanguageLabel() {
      return codeToLanguageName(this.selectedTargetLanugage);
    },
  },
  watch: {
    originSrc(newVal: string) {
      if (newVal) {
        this.initializeManager();
      }
    },
    async primarySubtitleId() {
      this.currentCues = await this.getCues(videodata.time);
    },
    async secondarySubtitleId() {
      this.currentCues = await this.getCues(videodata.time);
    },
  },
  created() {
  },
  mounted() {
    this.$store.dispatch('initWindowRotate');
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [320, 180]);
    videodata.checkTick();
    videodata.onTick = this.onUpdateTick;
    requestAnimationFrame(this.loopCues);
    this.$bus.$on('add-subtitles', (subs: { src: string, type: string }[]) => {
      const paths = subs.map((sub: { src: string, type: string }) => (sub.src));
      this.addLocalSubtitlesWithSelect(paths);
    });
    this.$bus.$on('show-modal', () => {
      this.isModalShow = true;
    });
  },
  beforeDestroy() {
    this.updateSubToTop(false);
    videodata.stopCheckTick();
  },
  methods: {
    ...mapActions({
      updateSubToTop: subtitleActions.UPDATE_SUBTITLE_TOP,
      initializeManager: smActions.initializeManager,
      addLocalSubtitlesWithSelect: smActions.addLocalSubtitlesWithSelect,
      getCues: smActions.getCues,
      updatePlayTime: smActions.updatePlayedTime,
      hideTranslateModal: atActions.AUDIO_TRANSLATE_HIDE_MODAL,
      startTranslate: atActions.AUDIO_TRANSLATE_START,
    }),
    // Compute UI states
    // When the video is playing the ontick is triggered by ontimeupdate of Video tag,
    // else it is triggered by setInterval.
    onUpdateTick() {
      requestAnimationFrame(this.loopCues);
      this.$refs.videoctrl.onTickUpdate();
    },
    async loopCues() {
      if (!this.time) this.time = videodata.time;
      // TODO @Yvon Yan confirm the impact on subtitle play time
      // onUpdateTick Always get the latest subtitles
      // if (this.time !== videodata.time) {
      const cues = await this.getCues(videodata.time);
      this.updatePlayTime({ start: this.time, end: videodata.time });
      this.currentCues = cues;
      // }
      this.time = videodata.time;
    },
    changeLanguage() {
    },
    translate() {
      this.startTranslate();
    },
  },
};
</script>

<style lang="scss">
.player {
  width: 100%;
  height: 100%;
  background-color: black;
}
.select-language-modal {
  position: fixed;
  width: 280px;
  padding: 22px;
  box-sizing: border-box;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(10px);
  z-index: 3;
  background: rgba(0,0,0,0.10);
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 0 1px 0 rgba(0,0,0,0.10);
  border-radius: 7px;
  h1 {
    font-size: 13px;
    color: rgba(255,255,255,0.90);
    letter-spacing: 1px;
    line-height: 13px;
    margin-bottom: 7px;
  }
  p {
    font-size: 11px;
    color: rgba(255,255,255,0.50);
    letter-spacing: 0.2px;
    line-height: 16px;
    margin-bottom: 10px;
  }
  .select {
    width: 100%;
    margin-bottom: 10px;
  }
  .progress-wraper {
    margin-bottom: 17px;
  }
  .progress {
    height: 9px;
    background: rgba(0,0,0,0.10);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    &::before {
      content: "";
      position: absolute;
      width: var(--tooltip-width);
      height: 100%;
      background: #ffffff;
      border-radius: 6px;
    }
  }
  .button-wraper {
    display: flex;
    justify-content: space-between;
    .button {
      width: 45%;
    }
  }
  .button {
    font-size: 11px;
    color: rgba(255,255,255,0.80);
    letter-spacing: 0;
    text-align: center;
    line-height: 28px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 2px;
    cursor: pointer;
  }
}
</style>
