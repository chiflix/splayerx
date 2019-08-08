<template>
  <div
    v-fade-in="isTranslateModalVisiable"
    class="audio-translate"
  >
    <div
      class="modal-mask"
    />
    <div
      class="select-language-modal"
    >
      <div
        v-if="!isProgress && !isConfirmCancelTranlate"
        class="select-title"
      >
        <h1>
          {{ $t('translateModal.select.title') }}
        </h1>
        <div
          class="beta-mark"
        >
          Beta
        </div>
      </div>
      <h1 v-else-if="isConfirmCancelTranlate">
        {{ $t('translateModal.discard.title') }}
      </h1>
      <h1 v-else-if="isProgress && isTranslateSuccess">
        {{ $t('translateModal.success.title') }}
      </h1>
      <h1 v-else-if="isProgress && isTranslateFail">
        {{ failTitle }}
      </h1>
      <h1 v-else-if="isProgress">
        {{ $t('translateModal.translate.title', { time: estimateTimeText }) }}
      </h1>
      <p v-if="!isProgress && !isConfirmCancelTranlate">
        {{ $t('translateModal.select.content') }}
      </p>
      <p v-else-if="isConfirmCancelTranlate">
        {{ $t('translateModal.discard.content') }}
      </p>
      <p v-else-if="isProgress && isTranslateSuccess">
        {{ $t('translateModal.success.content') }}
      </p>
      <p v-else-if="isProgress && isTranslateFail">
        {{ failContent }}
      </p>
      <p
        v-else-if="isProgress"
        class="two-line"
      >
        {{ progressContent }}
      </p>
      <div
        v-if="!isProgress && !isConfirmCancelTranlate"
        class="select"
      >
        <Select
          :static-label="translateLanguageLabel"
          :selected.sync="audioLanguage"
          :list="lanugages"
        />
      </div>
      <div
        v-else-if="isProgress && !isConfirmCancelTranlate"
        class="progress-wraper"
      >
        <Progress
          :front-color="isTranslateFail ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)'"
          :animate="!isTranslateFail"
          :progress="translateProgress"
        />
        <div
          v-if="isTranslateFail"
          @click="retryTranslate"
          class="icon-wraper"
        >
          <Icon
            class="icon"
            type="restart"
          />
        </div>
        <div
          v-else-if="isTranslateSuccess"
          class="icon-wraper"
        >
          <Icon
            class="icon"
            type="complete"
          />
        </div>
        <div
          v-else
          @click="isConfirmCancelTranlate = true;"
          class="icon-wraper"
        >
          <Icon
            class="icon"
            type="close"
          />
        </div>
      </div>
      <div
        v-if="!isProgress && !isConfirmCancelTranlate"
        class="button-wraper"
      >
        <div
          @click="hideTranslateModal"
          class="button"
        >
          {{ $t('translateModal.cancel') }}
        </div>
        <div
          @click="translate"
          :class="`${audioLanguage.value ? '' : 'disabled'} button`"
        >
          {{ $t('translateModal.generate') }}
        </div>
      </div>
      <div
        v-else-if="isConfirmCancelTranlate"
        class="button-wraper"
      >
        <div
          @click="isConfirmCancelTranlate = false;"
          class="button"
        >
          {{ $t('translateModal.continue') }}
        </div>
        <div
          @click="cancelTranslate"
          class="button"
        >
          {{ $t('translateModal.quit') }}
        </div>
      </div>
      <div
        v-else
        @click="hideTranslateModal"
        class="button"
      >
        {{ $t('translateModal.ok') }}
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import {
  Input as inputActions,
  AudioTranslate as atActions,
} from '@/store/actionTypes';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import { codeToLanguageName } from '@/libs/language';
import Select from '@/components/PlayingView/Select.vue';
import Icon from '@/components/BaseIconContainer.vue';
import Progress from '@/components/PlayingView/Progress.vue';
import { AudioTranslateStatus, AudioTranslateFailType } from '../store/modules/AudioTranslate';

export default Vue.extend({
  name: 'AudioTranslateModal',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    Icon,
    Select,
    Progress,
  },
  data() {
    const label = this.$t('translateModal.selectLanguageLabel');
    return {
      audioLanguage: { label, value: '' },
      lanugages: [
        {
          value: 'en',
          label: 'English',
        },
        {
          value: 'zh',
          label: '普通话（国语）',
        },
        {
          value: 'yue-Hant-HK',
          label: '廣東話（粤语）',
        },
        {
          value: 'ja-JP',
          label: '日本語',
        },
        {
          value: 'ko-KR',
          label: '한국어',
        },
      ],
      isConfirmCancelTranlate: false,
      didGrab: false, // 是否提取音频，区分听写和机翻
    };
  },
  computed: {
    ...mapGetters([
      'currentAudioTrackId', 'mediaHash',
      'isTranslateModalVisiable', 'translateProgress', 'isTranslating', 'selectedTargetLanugage',
      'translateEstimateTime', 'translateStatus', 'lastAudioLanguage', 'failType',
    ]),
    translateLanguageLabel() {
      return codeToLanguageName(this.selectedTargetLanugage);
    },
    isProgress() {
      return this.isTranslating || this.translateStatus === AudioTranslateStatus.Fail
        || this.translateStatus === AudioTranslateStatus.Success;
    },
    isTranslateFail() {
      return this.translateStatus === AudioTranslateStatus.Fail;
    },
    isTranslateSuccess() {
      return this.translateStatus === AudioTranslateStatus.Success;
    },
    estimateTimeText() {
      const time = this.translateEstimateTime;
      if (time >= 60 * 60) {
        return this.$t('translateModal.translate.hour', { number: Math.ceil(time / (60 * 60)) });
      } if (time >= 60) {
        return this.$t('translateModal.translate.minute', { number: Math.ceil(time / 60) });
      }
      return this.$t('translateModal.translate.minute', { number: 1 });
    },
    failTitle() {
      let title = this.$t('translateModal.serverErrorFail.title');
      if (this.failType === AudioTranslateFailType.NoLine) {
        title = this.$t('translateModal.noLineFail.title');
      } else if (this.failType === AudioTranslateFailType.TimeOut) {
        title = this.$t('translateModal.timeOutFail.title');
      }
      return title;
    },
    failContent() {
      let message = this.$t('translateModal.serverErrorFail.content');
      if (this.failType === AudioTranslateFailType.NoLine) {
        message = this.$t('translateModal.noLineFail.content');
      } else if (this.failType === AudioTranslateFailType.TimeOut) {
        message = this.$t('translateModal.timeOutFail.content');
      }
      return message;
    },
    progressContent() {
      const { didGrab, translateStatus } = this;
      let message = this.$t('translateModal.translate.content');
      if (translateStatus === AudioTranslateStatus.Searching) {
        message = this.$t('translateModal.translate.contentSearch');
      } else if (translateStatus === AudioTranslateStatus.Grabbing) {
        message = this.$t('translateModal.translate.contentGrabbing');
      } else if (translateStatus === AudioTranslateStatus.GrabCompleted) {
        message = this.$t('translateModal.translate.contentGrabComplated');
      } else if (translateStatus === AudioTranslateStatus.Translating && didGrab) {
        message = this.$t('translateModal.translate.contentSpeech');
      } else if (translateStatus === AudioTranslateStatus.Translating) {
        message = this.$t('translateModal.translate.contentTranslate');
      }
      return message;
    },
  },
  watch: {
    mediaHash() {
      this.audioLanguage = { label: this.$t('translateModal.selectLanguageLabel'), value: '' };
      this.audioTranslateStoreInit();
    },
    currentAudioTrackId() {
      this.audioLanguage = { label: this.$t('translateModal.selectLanguageLabel'), value: '' };
    },
    lastAudioLanguage(val: string, old: string) {
      if (val && !old) {
        this.audioLanguage = {
          label: this.getLanguageLabel(val),
          value: val,
        };
      }
    },
    translateStatus(status: AudioTranslateStatus) {
      if (status === AudioTranslateStatus.GrabCompleted
        || status === AudioTranslateStatus.Grabbing) {
        this.didGrab = true;
      } else if (status === AudioTranslateStatus.Searching) {
        this.didGrab = false;
      }
    },
  },
  methods: {
    ...mapActions({
      hideTranslateModal: atActions.AUDIO_TRANSLATE_HIDE_MODAL,
      startTranslate: atActions.AUDIO_TRANSLATE_START,
      discardTranslate: atActions.AUDIO_TRANSLATE_DISCARD,
      updateWheel: inputActions.WHEEL_UPDATE,
      audioTranslateStoreInit: atActions.AUDIO_TRANSLATE_INIT,
    }),
    translate() {
      const { audioLanguage } = this;
      if (audioLanguage && audioLanguage.value) {
        this.startTranslate(audioLanguage.value);
        // ga 真正开始翻译的次数 (即点击 "Confirm"的次数)
        this.$ga.event('app', 'ai-translate-confirm-button-click');
      }
    },
    retryTranslate() {
      const { audioLanguage } = this;
      if (audioLanguage && audioLanguage.value) {
        this.startTranslate(audioLanguage.value);
        // ga 重新翻译的次数
        this.$ga.event('app', 'ai-translate-retry-button-click');
      }
    },
    cancelTranslate() {
      this.hideTranslateModal();
      this.discardTranslate();
      setTimeout(() => {
        this.isConfirmCancelTranlate = false;
      }, 500);
    },
    getLanguageLabel(code: string) {
      const l = this.lanugages.find((l: { value: string, label: string }) => l.value === code);
      return l ? l.label : codeToLanguageName(code);
    },
  },
});
</script>
<style lang="scss" scoped>
.modal-mask {
  width: 100%;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  opacity: 0.7;
  background: #000000;
}
.select-language-modal {
  position: fixed;
  width: 280px;
  padding: 22px;
  box-sizing: border-box;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  border: 1px solid rgba(160,160,160,0.7);
  background-image: radial-gradient(
    80% 130%,
    rgba(85,85,85,0.88) 20%,
    rgba(85,85,85,0.78) 50%,
    rgba(85,85,85,0.72) 60%,
    rgba(85,85,85,0.46) 80%,
    rgba(85,85,85,0.00) 100%
  );
  border-radius: 7px;
  box-shadow: 0 0 1px 0 rgba(0,0,0,0.10);
  zoom: 1;
  .select-title {
    display: flex;
    .beta-mark {
      width: 20px;
      height: 12px;
      background: rgba(103, 103, 103, 0.8);
      border-radius: 7px;
      margin-left: 3px;
      font-size: 7px;
      line-height: 12px;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
    }
  }

  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    & {
      display: none;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    zoom: 1;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    zoom: 1.3;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    zoom: 1.68;
  }

  h1 {
    font-size: 13px;
    color: rgba(255,255,255,0.90);
    letter-spacing: 1px;
    line-height: 13px;
    margin-bottom: 10px;
  }
  p {
    font-size: 11px;
    color: rgba(255,255,255,0.50);
    line-height: 16px;
    margin-bottom: 10px;
    &.two-line {
      height: 32px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  }
  .select {
    cursor: pointer;
    width: 100%;
    margin-bottom: 10px;
    z-index: 100;
  }
  .progress-wraper {
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    .icon-wraper {
      display: flex;
      align-items: center;
    }
    .icon {
      width: 15px;
      height: 15px;
      margin-left: 6px;
      // border-radius: 50%;
      cursor: pointer;
    }
  }
  .progress {
    height: 7px;
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
      width: 111px;
    }
  }
  .button {
    cursor: pointer;
    font-size: 11px;
    color: #FFFFFF;
    text-align: center;
    border-radius: 2px;
    line-height: 28px;
    border: 1px solid rgba(255,255,255,0.1);
    background-color: rgba(255,255,255,0.03);
    transition: all 200ms;

    &:not(.disabled):hover {
      border: 1px solid rgba(255,255,255,0.2);
      background-color: rgba(255,255,255,0.08);
    }
    &.disabled {
      // opacity: 0.3;
      cursor: default;
      color: rgba(255,255,255,0.3);
      border: 1px solid rgba(255,255,255,0.03);
      background-color: rgba(255,255,255,0.009);
    }
  }
}
</style>
