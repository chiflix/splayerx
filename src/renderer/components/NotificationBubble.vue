<template>
  <div :class="container">
    <transition name="nextvideo">
      <NextVideo class="next-video" ref="nextVideo"
        v-if="showNextVideo"
        @close-next-video="closeNextVideo"
        @manualclose-next-video="manualClose"
        @ready-to-show="readyToShow = true"/>
    </transition>
    <PrivacyBubble class="privacy-bubble"
      v-if="showPrivacyBubble && !isMas"
      @close-privacy-bubble="closePrivacyBubble"/>
    <MASPrivacyBubble class="mas-privacy-bubble"
      v-if="showPrivacyBubble && isMas"
      @close-privacy-bubble="closePrivacyBubble"/>
    <div>
    <transition-group name="toast">
      <div v-for="m in messages" :key="m.id"
        class="messageContainer"
        :id="'item' + m.id">
        <div :class="m.type === 'error' ? 'black-gradient-error' : 'black-gradient-loading'"/>
        <div
        :class="m.type === 'error' ? 'errorContainer' : 'loadingContainer'">
          <div class="bubbleContent">
            <div class="title" v-if="m.type === 'error'">{{ m.title }}</div>
            <div class="content">{{ m.content }}</div>
          </div>
          <Icon v-if="m.type === 'error'" type="close" class="bubbleClose" @click.native.left="closeMessage(m.id, m.title)"></Icon>
        </div>
      </div>
    </transition-group>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import osLocale from 'os-locale';
import asyncStorage from '@/helpers/asyncStorage';
import NextVideo from '@/components/PlayingView/NextVideo.vue';
import PrivacyBubble from '@/components/PlayingView/PrivacyConfirmBubble.vue';
import MASPrivacyBubble from '@/components/PlayingView/MASPrivacyConfirmBubble.vue';
import Icon from './BaseIconContainer.vue';

export default {
  name: 'notification-bubble',
  components: {
    Icon,
    NextVideo,
    PrivacyBubble,
    MASPrivacyBubble,
  },
  data() {
    return {
      manualClosed: false, // if next-video was manually closed then it won't appear again
      showNextVideo: false,
      readyToShow: false, // show after video element is loaded
      showPrivacyBubble: false,
    };
  },
  computed: {
    ...mapGetters(['nextVideo', 'nextVideoPreviewTime', 'duration', 'singleCycle', 'privacyAgreement']),
    messages() {
      const messages = this.$store.getters.messageInfo;
      if (this.showNextVideo && this.showPrivacyBubble) {
        return messages.slice(0, 1);
      } else if (this.showNextVideo || this.showPrivacyBubble) {
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
  },
  watch: {
    singleCycle(val) {
      this.showNextVideo = !val;
    },
    privacyAgreement(val) {
      if (val) {
        this.showPrivacyBubble = false;
      }
    },
  },
  mounted() {
    asyncStorage.get('preferences').then((data) => {
      this.showPrivacyBubble = data.privacyAgreement === undefined;
      if (!data.primaryLanguage) {
        const { app } = this.$electron.remote;
        const locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
        if (locale === 'zh_TW' || locale === 'zh_CN') {
          this.$store.dispatch('primaryLanguage', locale.replace('_', '-'));
        } else {
          this.$store.dispatch('primaryLanguage', 'en');
        }
      }
      if (!data.secondaryLanguage) {
        this.$store.dispatch('secondaryLanguage', '');
      }
    });
    this.$bus.$on('privacy-confirm', () => {
      this.showPrivacyBubble = true;
    });
  },
  methods: {
    closePrivacyBubble() {
      this.showPrivacyBubble = false;
    },
    manualClose() {
      this.manualClosed = true;
      this.showNextVideo = false;
    },
    closeNextVideo() {
      this.manualClosed = false;
      this.showNextVideo = false;
    },
    closeMessage(id, title) {
      this.$store.dispatch('removeMessages', id);
      if (title === this.$t('errorFile.fileNonExist.title')) {
        this.$bus.$emit('delete-file');
      }
    },
    checkNextVideoUI(time) {
      if (time > this.nextVideoPreviewTime && time < this.duration - 1 && this.duration > 240) {
        if (this.nextVideo && !this.manualClosed) {
          this.$store.dispatch('UpdatePlayingList');
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
  },
};
</script>

<style lang="scss" scoped>
.winContainer {
  -webkit-app-region: no-drag;
  position: absolute;
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    top: 28px;
    right: 19px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    top: 34px;
    right: 28px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    top: 34px;
    right: 34px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    top: 45px;
    right: 52px;
  }
}
.container {
  -webkit-app-region: no-drag;
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  .next-video {
    transition: 200ms ease-out;
    transition-property: opacity, transform;
    @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
      display: none;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-bottom: 12px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-bottom: 15px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
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
    @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
      display: none;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-bottom: 12px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-bottom: 15px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-bottom: 18px;
    }
  }
  .mas-privacy-bubble {
    position: relative;
    z-index: 8;
    @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
      display: none;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-bottom: 12px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-bottom: 15px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-bottom: 18px;
    }
  }
  .toast-enter, .toast-enter-active {
    transform: translateX(0px);
  }
  .toast-enter, .toast-leave-active {
    transform: translateX(403px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    top: 13px;
    right: 14px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    top: 22px;
    right: 28px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    top: 25px;
    right: 34px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    top: 45px;
    right: 52px;
  }
}
.transContainer {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.loadingContainer {
  position: relative;
  display: flex;
  justify-content: flex-start;
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  z-index: 8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    width: 166px;
    height: 32px;
    margin-left: 50px;
    margin-bottom: 8px;
    border-radius: 6px;
    clip-path: inset(0 round 6px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 178px;
    height: 36px;
    margin-left: 62px;
    margin-bottom: 12px;
    border-radius: 7px;
    clip-path: inset(0 round 7px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 218px;
    height: 43px;
    margin-left: 70px;
    margin-bottom: 15px;
    border-radius: 8px;
    clip-path: inset(0 round 8px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 306px;
    height: 60px;
    margin-left: 97px;
    margin-bottom: 18px;
    border-radius: 11px;
    clip-path: inset(0 round 11px);
  }

  .bubbleContent {
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
      width: auto;
      height: 11px;
      margin: auto;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      width: auto;
      height: 12px;
      margin: auto;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      width: auto;
      height: 15px;
      margin: auto;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      width: auto;
      height: 21px;
      margin: auto;
    }
    .content {
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
        font-size: 11px;
        line-height: 11px;
        letter-spacing: 0.4px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        font-size: 12px;
        line-height: 12px;
        letter-spacing: 0.4px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        font-size: 15px;
        line-height: 15px;
        letter-spacing: 0.4px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        font-size: 21px;
        line-height: 21px;
        letter-spacing: 0.7px;
      }
    }
  }
}
.messageContainer {
  position: relative;
  z-index: 8;
  transition: 400ms cubic-bezier(0.17, 0.67, 0.17, 0.98);
  transition-property: opacity, transform;
}
.black-gradient-error {
  position: absolute;
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    width: 216px;
    height: 47px;
    margin-bottom: 8px;
    border-radius: 6px;
    clip-path: inset(0 round 6px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 240px;
    height: 52px;
    margin-bottom: 12px;
    border-radius: 7px;
    clip-path: inset(0 round 7px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 288px;
    height: 62px;
    margin-bottom: 15px;
    border-radius: 8px;
    clip-path: inset(0 round 8px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 403px;
    height: 87px;
    margin-bottom: 18px;
    border-radius: 11px;
    clip-path: inset(0 round 11px);
  }
}
.black-gradient-loading {
  position: absolute;
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    width: 186px;
    height: 32px;
    margin-left: 30px;
    margin-bottom: 8px;
    border-radius: 6px;
    clip-path: inset(0 round 6px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 204px;
    height: 36px;
    margin-left: 36px;
    margin-bottom: 12px;
    border-radius: 7px;
    clip-path: inset(0 round 7px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 248px;
    height: 43px;
    margin-left: 40px;
    margin-bottom: 15px;
    border-radius: 8px;
    clip-path: inset(0 round 8px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 348px;
    height: 60px;
    margin-left: 55px;
    margin-bottom: 18px;
    border-radius: 11px;
    clip-path: inset(0 round 11px);
  }
}

.errorContainer {
  display: flex;
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    width: 216px;
    height: 47px;
    margin-bottom: 8px;
    border-radius: 6px;
    clip-path: inset(0 round 6px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 240px;
    height: 52px;
    margin-bottom: 12px;
    border-radius: 7px;
    clip-path: inset(0 round 7px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 288px;
    height: 62px;
    margin-bottom: 15px;
    border-radius: 8px;
    clip-path: inset(0 round 8px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 403px;
    height: 87px;
    margin-bottom: 18px;
    border-radius: 11px;
    clip-path: inset(0 round 11px);
  }

  .bubbleContent {
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
      width: 160px;
      height: 23px;
      margin: 12px auto auto 14px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      width: 178px;
      height: 26px;
      margin: 13px auto auto 16px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      width: 214px;
      height: 32px;
      margin: 15px auto auto 19px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      width: 300px;
      height: 45px;
      margin: 21px auto auto 26px;
    }
    .title {
      color: rgba(255, 255, 255, 1);
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
        font-size: 11px;
        line-height: 11px;
        letter-spacing: 0.4px;
        margin-bottom: 3px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        font-size: 12px;
        line-height: 12px;
        letter-spacing: 0.4px;
        margin-bottom: 4px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        font-size: 15px;
        line-height: 15px;
        letter-spacing: 0.4px;
        margin-bottom: 5px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        font-size: 21px;
        line-height: 21px;
        letter-spacing: 0.7px;
        margin-bottom: 7px;
      }
    }
    .content {
      color: rgba(255, 255, 255, 0.7);
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
        font-size: 9px;
        line-height: 9px;
        letter-spacing: 0.2px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        font-size: 10px;
        line-height: 10px;
        letter-spacing: 0.2px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        font-size: 12px;
        line-height: 12px;
        letter-spacing: 0.24px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        font-size: 17px;
        line-height: 17px;
        letter-spacing: 0.3px;
      }
    }
  }

  .bubbleClose {
    cursor: pointer;
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
      margin: 13.5px 14px auto auto;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin: 15px 16px auto auto;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin: 18px 20px auto auto;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin: 25.5px 28px auto auto;
    }
  }
}


.toast-leave-active {
  position: absolute;
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
