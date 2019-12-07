<template>
  <div :class="[container, 'no-drag', { rtl: isRtl }]">
    <transition name="nextvideo">
      <NextVideo
        ref="nextVideo"
        v-if="showNextVideo && !isProfessional"
        @close-next-video="closeNextVideo"
        @manualclose-next-video="manualClose"
        @ready-to-show="readyToShow = true"
        class="nextVideo"
      />
    </transition>
    <PrivacyBubble
      v-if="showPrivacyBubble && !isMas"
      @close-privacy-bubble="closePrivacyBubble"
      class="privacy-bubble"
    />
    <transition name="bubble">
      <ConfirmBubble
        v-if="showPrivacyBubble && isMas"
        :content="$t('privacyBubble.masVersion.content')"
        :confirm-button-text="$t('privacyBubble.masVersion.agree')"
        :cancel-button-text="$t('privacyBubble.masVersion.disagree')"
        :confirm="handleAgreePrivacy"
        :cancel="handleDisagreePrivacy"
        class="mas-privacy-bubble"
      />
    </transition>
    <transition name="bubble">
      <ConfirmBubble
        v-if="showNSFWBubble"
        :content="$t('protectBubble.content')"
        :confirm-button-text="$t('protectBubble.agree')"
        :cancel-button-text="$t('protectBubble.setting')"
        :confirm="handleAgreeNSFW"
        :cancel="handleNSFWSetting"
        class="mas-privacy-bubble"
      />
    </transition>
    <transition name="bubble">
      <ConfirmBubble
        v-if="showUpdateBubble"
        :content="checkForUpdatesContent"
        :confirm-button-text="$t('checkForUpdatesBubble.needUpdate.confirm')"
        :cancel-button-text="$t('checkForUpdatesBubble.needUpdate.cancel')"
        :confirm="confirmUpdate"
        :cancel="cancelUpdate"
        class="mas-privacy-bubble"
      />
    </transition>
    <transition name="bubble">
      <AlertBubble
        v-if="showLastestUpdateBubble"
        :content="lastestUpdateContent"
        :close="closeLastestUpdateBubble"
        class="mas-privacy-bubble"
      />
    </transition>
    <transition name="bubble">
      <AlertBubble
        v-if="showNotExportEmbeddedSubtitleBubble"
        :content="$t('notExportEmbeddedSubtitle.content')"
        :close="closeNotExportEmbeddedSubtitleBubble"
        class="mas-privacy-bubble"
      />
    </transition>
    <transition name="bubble">
      <AlertBubble
        v-if="showNotEditorBubble"
        :content="$t('editorBubble.notWork.content')"
        :close="closeNotEditorBubble"
        class="mas-privacy-bubble"
      />
    </transition>
    <transition name="bubble">
      <ConfirmBubble
        v-if="showDeleteSubtitleBubble"
        :content="$t('editorBubble.deleteSubtitleBubble.content')"
        :confirm-button-text="$t('editorBubble.deleteSubtitleBubble.confirm')"
        :cancel-button-text="$t('editorBubble.deleteSubtitleBubble.cancel')"
        :confirm="confirmDeleteSubtitle"
        :cancel="cancelDeleteSubtitle"
        class="mas-privacy-bubble"
      />
    </transition>
    <transition name="bubble">
      <TranslateBubble
        v-if="isTranslateBubbleVisible"
        :message="translateBubbleMessage"
        :type="translateBubbleType"
        @disCardTranslate="discardTranslate"
        @backStageTranslate="backStageTranslate"
        @hide="hideTranslateBubble"
      />
    </transition>
    <transition-group
      name="toast"
      class="transGroup"
    >
      <div
        v-for="m in messages"
        :id="'item' + m.id"
        :key="m.id"
        :style="{
          zIndex: isProfessional ? '15': '8',
        }"
        class="messageContainer"
      >
        <ErrorBubble
          v-if="m.type === 'result'"
          :id="m.id"
          :title="m.title"
          :content="m.content"
          :close="closeMessage"
        />
        <PendingBubble
          v-else-if="m.type === 'pending'"
          :id="m.id"
          :success-content="m.successContent"
          :pending-content="m.pendingContent"
          :pending="m.pending"
        />
        <StatusBubble
          v-else
          :content="m.content"
        />
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import StatusBubble from '@/components/Bubbles/StatusBubble.vue';
import ErrorBubble from '@/components/Bubbles/ErrorBubble.vue';
import PendingBubble from '@/components/Bubbles/PendingBubble.vue';
import AlertBubble from '@/components/Bubbles/AlertBubble.vue';
import ConfirmBubble from '@/components/Bubbles/ConfirmBubble.vue';
import NextVideo from '@/components/Bubbles/NextVideo.vue';
import PrivacyBubble from '@/components/Bubbles/PrivacyConfirmBubble.vue';
import TranslateBubble from '@/components/Bubbles/TranslateBubble.vue';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import {
  AudioTranslate as atActions,
} from '@/store/actionTypes';
import { skipCheckForUpdate } from '../libs/utils';

export default {
  name: 'NotificationBubble',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    StatusBubble,
    ErrorBubble,
    AlertBubble,
    ConfirmBubble,
    NextVideo,
    PrivacyBubble,
    TranslateBubble,
    PendingBubble,
  },
  data() {
    return {
      manualClosed: false, // if nextVideo was manually closed then it won't appear again
      showNextVideo: false,
      readyToShow: false, // show after video element is loaded
      showPrivacyBubble: false,
      showNSFWBubble: false,
      showUpdateBubble: false, // show update bubble
      checkForUpdatesContent: '',
      checkForUpdatesDownloadUrl: '',
      checkForUpdatesReleaseUrl: '',
      checkForUpdatesVersion: '',
      showLastestUpdateBubble: false, // show update bubble
      lastestUpdateContent: '',
      showNotExportEmbeddedSubtitleBubble: false,
      showNotEditorBubble: false,
      showDeleteSubtitleBubble: false, // 删除自制字幕，显示确认气泡
    };
  },
  computed: {
    ...mapGetters([
      'nextVideo', 'nextVideoPreviewTime', 'duration', 'singleCycle', 'privacyAgreement', 'nsfwProcessDone',
      'translateBubbleMessage', 'translateBubbleType', 'isTranslateBubbleVisible', 'failBubbleId', 'preferenceData',
      'isProfessional', 'deleteSubtitleConfirm',
    ]),
    messages() {
      const messages = this.$store.getters.messageInfo;
      if (this.showNextVideo && this.showPrivacyBubble) {
        return messages.slice(0, 1);
      }
      if (this.showNextVideo || this.showPrivacyBubble) {
        return messages.slice(0, 2);
      }
      return messages;
    },
    isMas() {
      if (process.platform === 'darwin' && process.mas) {
        return true;
      }
      return false;
    },
    container() {
      return process.platform === 'win32' ? 'winContainer' : 'container';
    },
    isRtl() {
      return /ar/.test(this.$i18n.locale);
    },
  },
  watch: {
    singleCycle(val: boolean) {
      this.showNextVideo = !val;
    },
    privacyAgreement(val: boolean) {
      if (val) {
        this.showPrivacyBubble = false;
      }
    },
  },
  mounted() {
    this.$bus.$on('nsfw', () => {
      if (!this.nsfwProcessDone) this.showNSFWBubble = true;
    });
    this.$bus.$on('privacy-confirm', () => {
      this.showPrivacyBubble = true;
    });
    this.$bus.$on('new-version', (info: { version: string, landingPage: string, url: string }) => {
      this.checkForUpdatesContent = this.$t('checkForUpdatesBubble.needUpdate.content', { version: info.version });
      this.checkForUpdatesDownloadUrl = info.url;
      this.checkForUpdatesReleaseUrl = info.landingPage;
      this.checkForUpdatesVersion = info.version;
      this.showUpdateBubble = true;
    });
    // 检查当前版本是最新版本
    this.$bus.$on('lastest-version', (info: { version: string }) => {
      this.lastestUpdateContent = this.$t('checkForUpdatesBubble.noNeed.content', { version: info.version });
      this.showLastestUpdateBubble = true;
    });
    this.$bus.$on('embedded-subtitle-can-not-export', () => {
      this.showNotExportEmbeddedSubtitleBubble = true;
    });
    this.$bus.$on('subtitle-can-not-editor', () => {
      this.showNotEditorBubble = true;
    });
    this.$bus.$on('delete-modified-confirm', (show: boolean) => {
      this.showDeleteSubtitleBubble = show;
    });
  },
  methods: {
    ...mapActions({
      hideTranslateBubble: atActions.AUDIO_TRANSLATE_HIDE_BUBBLE,
      discardTranslate: atActions.AUDIO_TRANSLATE_DISCARD,
      backStageTranslate: atActions.AUDIO_TRANSLATE_BACKSATGE,
      hideBubbleCallBack: atActions.AUDIO_TRANSLATE_HIDE_BUBBLE,
    }),
    closePrivacyBubble() {
      this.showPrivacyBubble = false;
    },
    handleAgreePrivacy() {
      this.$store.dispatch('agreeOnPrivacyPolicy').then(() => {
        this.$electron.ipcRenderer.send('main-to-preference', this.preferenceData);
      });
    },
    handleDisagreePrivacy() {
      this.$store.dispatch('disagreeOnPrivacyPolicy').then(() => {
        this.$electron.ipcRenderer.send('main-to-preference', this.preferenceData);
      });
    },
    handleAgreeNSFW() {
      this.showNSFWBubble = false;
      this.$store.dispatch('nsfwProcessDone');
    },
    handleNSFWSetting() {
      this.$electron.ipcRenderer.send('add-preference', 'privacy');
      this.showNSFWBubble = false;
      this.$store.dispatch('nsfwProcessDone');
    },
    closeLastestUpdateBubble() {
      this.showLastestUpdateBubble = false;
    },
    closeNotExportEmbeddedSubtitleBubble() {
      this.showNotExportEmbeddedSubtitleBubble = false;
    },
    closeNotEditorBubble() {
      this.showNotEditorBubble = false;
    },
    manualClose() {
      this.manualClosed = true;
      this.showNextVideo = false;
    },
    closeNextVideo() {
      this.manualClosed = false;
      this.showNextVideo = false;
    },
    closeMessage(id: string) {
      this.$store.dispatch('removeMessages', id);
      // 如果是x掉智能翻译失败的气泡，就执行智能翻译bubble cancal的回调
      if (id === this.failBubbleId) {
        this.hideBubbleCallBack();
      }
    },
    checkNextVideoUI(time: number) {
      if (time > this.nextVideoPreviewTime && time < this.duration - 1 && this.duration > 240) {
        if (this.nextVideo && !this.manualClosed) {
          this.showNextVideo = true;
        }
      } else {
        this.manualClosed = false;
        this.showNextVideo = false;
      }
      if (this.$refs.nextVideo) {
        this.$refs.nextVideo.updatePlayingTime(time);
      }
    },
    confirmUpdate() {
      // go to web site
      const { checkForUpdatesDownloadUrl, checkForUpdatesReleaseUrl } = this;
      this.$electron.shell.openExternal(checkForUpdatesDownloadUrl);
      this.$electron.shell.openExternal(checkForUpdatesReleaseUrl);
      this.showUpdateBubble = false;
    },
    cancelUpdate() {
      // this version not auto check show
      const { checkForUpdatesVersion } = this;
      skipCheckForUpdate(checkForUpdatesVersion);
      this.showUpdateBubble = false;
    },
    cancelDeleteSubtitle() {
      this.$bus.$emit('delete-modified-cancel', true);
      this.showDeleteSubtitleBubble = false;
    },
    confirmDeleteSubtitle() {
      this.$bus.$emit('delete-modified-cancel', false);
      this.showDeleteSubtitleBubble = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.winContainer {
  position: absolute;
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    top: 28px;
    right: 19px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    top: 34px;
    right: 28px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    top: 34px;
    right: 34px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    top: 45px;
    right: 52px;
  }

  .nextVideo {
    transition: 200ms ease-out;
    transition-property: opacity, transform;
    @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
    screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
      display: none;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-bottom: 12px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-bottom: 15px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-bottom: 18px;
    }
  }
}
.container {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: auto;
  height: auto;

  .nextVideo {
    transition: 200ms ease-out;
    transition-property: opacity, transform;
    @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
    screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
      display: none;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-bottom: 12px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-bottom: 15px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-bottom: 18px;
    }
  }
  .nextvideo-enter, .nextvideo-enter-active {
    transform: translateX(0px);
  }
  .nextvideo-enter, .nextvideo-leave-active {
    transform: translateX(403px);
  }
  .privacy-bubble {
    position: relative;
    z-index: 8;
    @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
    screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
      display: none;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-bottom: 12px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-bottom: 15px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-bottom: 18px;
    }
  }
  .mas-privacy-bubble {
    position: relative;
    z-index: 8;
    @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
    screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
      display: none;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-bottom: 12px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-bottom: 15px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-bottom: 18px;
    }
  }
  .toast-enter, .toast-enter-active {
    transform: translateX(0px);
  }
  .toast-enter, .toast-leave-active {
    transform: translateX(403px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    top: 13px;
    right: 14px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    top: 22px;
    right: 28px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    top: 25px;
    right: 34px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    top: 45px;
    right: 52px;
  }
}
.transGroup {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.messageContainer {
  z-index: 8;
  transition: 400ms cubic-bezier(0.17, 0.67, 0.17, 0.98);
  transition-property: opacity, transform;
  width: auto;
  white-space: nowrap;
  right: 0;
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    margin-bottom: 8px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    margin-bottom: 12px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    margin-bottom: 15px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    margin-bottom: 18px;
  }
}
.toast-leave-active {
  // position: absolute;
  transition: transform 500ms cubic-bezier(0.17, 0.67, 0.17, 0.98);
}
.toast-enter-active {
  transition: transform 250ms cubic-bezier(0.17, 0.67, 0.17, 0.98);
}
.toast-enter, .toast-leave-to {
  transform: translateX(350px);
}
.nextvideo-enter-active, .nextvideo-leave {
  opacity: 1;
}
.nextvideo-enter, .nextvideo-leave-active {
  opacity: 0;
}
.nextvideo-leave-active {
  position: absolute;
}
</style>
