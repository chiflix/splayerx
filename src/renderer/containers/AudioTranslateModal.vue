<template>
  <div
    v-fade-in="isTranslateModalVisible"
    class="audio-translate"
  >
    <div
      class="modal-mask"
    />
    <div
      class="select-language-modal"
    >
      <div
        v-if="(!isProgress && !isConfirmCancelTranlate) || isPermissionFail || isGoPremium"
        @click="hideTranslateModal"
        class="close-box"
      >
        <Icon
          class="icon"
          type="closeSquare"
        />
      </div>
      <div
        v-if="!isProgress && !isConfirmCancelTranlate && !isGoPremium"
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
      <h1 v-else-if="isGoPremium">
        {{ isAPPX ? $t('forbiddenModal.translate.titleAPPX')
          : $t('forbiddenModal.translate.title') }}
      </h1>
      <p v-if="!isProgress && !isConfirmCancelTranlate && !isGoPremium">
        {{ isTranslateLimit ? $t('translateModal.select.contentLimit')
          : $t('translateModal.select.content') }}
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
      <p
        v-else-if="isGoPremium"
        v-html="premiumContent"
      />
      <div
        v-if="!isProgress && !isConfirmCancelTranlate && !isGoPremium"
        class="select"
      >
        <div class="left">
          <label for="">{{ $t("translateModal.videoLanguageLabel") }}</label>
          <Select
            :static-label="''"
            :selected.sync="audioLanguage"
            :list="lanugages"
          />
        </div>
        <div class="middle">
          →
        </div>
        <div class="right">
          <label for="">{{ $t("translateModal.subtitleLanguageLabel") }}</label>
          <div class="target">
            {{ translateLanguageLabel }}
          </div>
        </div>
      </div>
      <div
        v-else-if="showProgress && !isConfirmCancelTranlate && !isGoPremium"
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
        v-if="!isProgress && !isLoading && !isConfirmCancelTranlate && !isGoPremium"
        @click="translate"
        :class="`${audioLanguage.value ? '' : 'disabled'} button`"
      >
        {{ $t('translateModal.generate') }}
      </div>
      <div
        v-else-if="isLoading"
        class="disabled button"
      >
        {{ $t('translateModal.loading') }}
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
        v-else-if="isTranslateFail && !isPermissionFail"
        @click="hideTranslateModal"
        class="button"
      >
        {{ $t('translateModal.cancel') }}
      </div>
      <div
        v-else-if="isTranslateFail && isPermissionFail"
        @click="goPremium"
        class="button"
      >
        {{ isAPPX ? $t("translateModal.okAPPX") : $t('translateModal.upgrade') }}
      </div>
      <div
        @click.stop="goPremium"
        v-else-if="isGoPremium"
        class="button"
      >
        {{ isAPPX ? $t("translateModal.okAPPX") : $t('forbiddenModal.translate.button') }}
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
import { ipcRenderer } from 'electron';
import { mapActions, mapGetters } from 'vuex';
import { remove, findIndex } from 'lodash';
import {
  Input as inputActions,
  AudioTranslate as atActions,
  UserInfo as usActions,
} from '@/store/actionTypes';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import { codeToLanguageName, normalizeCode } from '@/libs/language';
import Select from '@/components/PlayingView/Select.vue';
import Icon from '@/components/BaseIconContainer.vue';
import Progress from '@/components/PlayingView/Progress.vue';
import { AudioTranslateStatus, AudioTranslateFailType } from '../store/modules/AudioTranslate';
import { getJsonConfig, forceRefresh, isTranslateLimit } from '@/helpers/featureSwitch';
import { log } from '@/libs/Log';

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
    const placeholder = this.$t('translateModal.audioLanguageLoading');
    return {
      audioLanguage: { label, value: '' },
      lanugages: [{
        value: '',
        label: placeholder,
      }],
      isConfirmCancelTranlate: false,
      didGrab: false, // 是否提取音频，区分听写和机翻
      loadConfigCatCompleted: false,
      isTranslateLimit: false,
      audioLanguageString: '',
    };
  },
  computed: {
    ...mapGetters([
      'currentAudioTrackId', 'mediaHash', 'audioTrackList', 'currentAudioTrackId', 'displayLanguage',
      'isTranslateModalVisible', 'translateProgress', 'isTranslating', 'selectedTargetLanugage',
      'translateEstimateTime', 'translateStatus', 'lastAudioLanguage', 'failType',
      'userInfo',
    ]),
    isAPPX() {
      return process.windowsStore;
    },
    translateLanguageLabel() {
      return codeToLanguageName(this.selectedTargetLanugage);
    },
    isLoading() {
      return this.translateStatus === AudioTranslateStatus.Searching;
    },
    isProgress() {
      return this.isTranslating || this.translateStatus === AudioTranslateStatus.Fail
        || this.translateStatus === AudioTranslateStatus.Success;
    },
    isGoPremium() {
      return this.translateStatus === AudioTranslateStatus.GoPremium;
    },
    isTranslateFail() {
      return this.translateStatus === AudioTranslateStatus.Fail;
    },
    showProgress() {
      return this.isProgress && this.failType !== AudioTranslateFailType.Permission;
    },
    isPermissionFail() {
      return this.failType === AudioTranslateFailType.Permission;
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
      } else if (this.failType === AudioTranslateFailType.Forbidden) {
        title = this.$t('translateModal.ForbiddenFail.title');
      } else if (this.failType === AudioTranslateFailType.Permission && this.isAPPX) {
        title = this.$t('translateModal.PermissionFailAPPX.title');
      } else if (this.failType === AudioTranslateFailType.Permission) {
        title = this.$t('translateModal.PermissionFail.title');
      }
      return title;
    },
    failContent() {
      let message = this.$t('translateModal.serverErrorFail.content');
      if (this.failType === AudioTranslateFailType.NoLine) {
        message = this.$t('translateModal.noLineFail.content');
      } else if (this.failType === AudioTranslateFailType.TimeOut) {
        message = this.$t('translateModal.timeOutFail.content');
      } else if (this.failType === AudioTranslateFailType.Forbidden) {
        message = this.$t('translateModal.ForbiddenFail.content');
      } else if (this.failType === AudioTranslateFailType.Permission && this.isAPPX) {
        message = this.$t('translateModal.PermissionFailAPPX.content');
      } else if (this.failType === AudioTranslateFailType.Permission) {
        message = this.$t('translateModal.PermissionFail.content');
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
    premiumContent() {
      return this.isAPPX ? this.$t('forbiddenModal.translate.contentAPPX')
        : `${this.$t('forbiddenModal.translate.content')}<br/><br/>${this.audioLanguageString}`;
    },
  },
  watch: {
    displayLanguage() {
      this.audioLanguage = { label: this.$t('translateModal.selectLanguageLabel'), value: '' };
    },
    mediaHash() {
      this.audioLanguage = { label: this.$t('translateModal.selectLanguageLabel'), value: '' };
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
    async isTranslateModalVisible(visible: boolean) {
      if (visible) {
        if (!this.loadConfigCatCompleted) await forceRefresh();
        await this.refreshConfig();
      }
    },
    audioLanguage(n: {
      label: string,
      value: string
    }, o: {
      label: string,
      value: string
    }) {
      if (n.value === 'premium') {
        this.audioLanguage = o;
        this.updateStatus(AudioTranslateStatus.GoPremium);
      }
    },
  },
  async mounted() {
    this.refreshConfig();
    this.isTranslateLimit = await isTranslateLimit();
    this.audioLanguageString = this.$t('forbiddenModal.audioLanguage');
    try {
      const configString = await this.getMoreLanguages();
      if (configString) {
        this.audioLanguageString = configString;
      }
    } catch (error) {
      // empty
    }
  },
  methods: {
    ...mapActions({
      hideTranslateModal: atActions.AUDIO_TRANSLATE_HIDE_MODAL,
      startTranslate: atActions.AUDIO_TRANSLATE_START,
      discardTranslate: atActions.AUDIO_TRANSLATE_DISCARD,
      updateStatus: atActions.AUDIO_TRANSLATE_UPDATE_STATUS,
      updateWheel: inputActions.WHEEL_UPDATE,
      showForbidden: usActions.SHOW_FORBIDDEN_MODAL,
    }),
    getAudioLanguage() {
      const { lanugages } = this;
      let audioLanguage = '';
      try {
        const track = this.audioTrackList
          .find((track: { id: string }) => track.id === String(this.currentAudioTrackId));
        log.debug('translate', track);
        if (track && normalizeCode(track.language) === 'zh-CN') {
          audioLanguage = 'zh';
        } else if (track && normalizeCode(track.language) === 'en') {
          audioLanguage = 'en';
        } else if (track && normalizeCode(track.language) === 'ja') {
          audioLanguage = 'ja-JP';
        }
      } catch (ex) {
        // empty
      }
      const language = lanugages
        .find((l: { value: string, label: string }) => l.value === audioLanguage);
      if (language && language.value) {
        this.audioLanguage = language;
      }
    },
    async refreshConfig() {
      try {
        const isVip = this.userInfo && this.userInfo.isVip;
        const supportedAudioLanguage = isVip ? await getJsonConfig('vipAudioLanguage', null)
          : await getJsonConfig('audioLanguage', null);
        if (supportedAudioLanguage && supportedAudioLanguage['list']) {
          this.lanugages = supportedAudioLanguage['list'];
          // this.getAudioLanguage();
          if (!isVip) {
            const goPremiumLabel = this.$t('translateModal.selectLanguageMoreLabel');
            this.lanugages.push({
              value: 'premium',
              label: goPremiumLabel,
            });
          }
        } else {
          throw new Error();
        }
      } catch (ex) {
        const failLabel = this.$t('translateModal.audioLanguageLoadFail');
        this.lanugages = [{
          value: '',
          label: failLabel,
        }];
      } finally {
        // this.loadConfigCatCompleted = true;
      }
    },
    async getMoreLanguages() {
      const vipAudioLanguage = await getJsonConfig('vipAudioLanguage', null);
      const normalAudioLanguage = await getJsonConfig('audioLanguage', null);
      if (vipAudioLanguage && vipAudioLanguage['list']) {
        const list = vipAudioLanguage['list'];
        const normal = normalAudioLanguage && normalAudioLanguage['list'] ? normalAudioLanguage['list'] : [];
        remove(list, (e: {
          value: string,
          label: string,
        }) => {
          if (!normal || !normal.length) {
            return false;
          }
          const index = findIndex(normal, (item: {
            value: string,
            label: string,
          }) => item.value === e.value);
          return index > -1;
        });
        return list.map((e: {
          value: string,
          label: string,
        }) => e.label).join(', ');
      }
      return '';
    },
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
    goPremium() {
      if (!this.isAPPX) {
        ipcRenderer.send('add-preference', 'premium');
      }
      this.hideTranslateModal();
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
  width: 330px;
  padding: 24px 30px;
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
  .close-box {
    position: absolute;
    top: 15px;
    right: 15px;
    -webkit-app-region: no-drag;
    .icon {
      width: 11px;
      height: 11px;
      cursor: pointer;
    }
  }
  .select-title {
    display: flex;
    .beta-mark {
      width: 20px;
      height: 12px;
      background: rgba(103, 103, 103, 0.8);
      border-radius: 3px;
      margin-left: 3px;
      margin-right: 3px;
      font-size: 7px;
      line-height: 13px;
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
    line-height: 14px;
    margin-bottom: 10px;
  }
  span {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
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
    display: flex;
    width: 100%;
    margin-bottom: 10px;
    z-index: 100;
    justify-content: space-between;
    .left {
      cursor: pointer;
    }
    .left, .right {
      width: 120px;
      label {
        font-size: 11px;
        color: rgba(255,255,255,0.70);
        font-weight: 500;
        letter-spacing: 0.2px;
        line-height: 16px;
        margin-bottom: 5px;
        display: block;
      }
    }
    .right {
      .target {
        background: rgba(0,0,0,0.04);
        border: 1px solid rgba(255,255,255,0.30);
        border-radius: 2px;
        font-size: 11px;
        color: rgba(255,255,255,0.80);
        letter-spacing: 0;
        text-align: center;
        line-height: 27.5px;
      }
    }
    .middle {
      padding-top: 22px;
      line-height: 28px;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }
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
      width: 126px;
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
