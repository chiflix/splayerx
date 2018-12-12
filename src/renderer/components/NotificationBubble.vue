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
      v-if="showPrivacyBubble"
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
          <Icon v-if="m.type === 'error'" type="close" class="bubbleClose" @click.native.left="closeMessage(m.id)"></Icon>
        </div>
      </div>
    </transition-group>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import asyncStorage from '@/helpers/asyncStorage';
import NextVideo from '@/components/PlayingView/NextVideo.vue';
import PrivacyBubble from '@/components/PlayingView/PrivacyConfirmBubble.vue';
import Icon from './BaseIconContainer';
export default {
  name: 'notification-bubble',
  components: {
    Icon,
    NextVideo,
    PrivacyBubble,
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
    ...mapGetters(['nextVideo', 'nextVideoPreviewTime', 'duration']),
    messages() {
      const messages = this.$store.getters.messageInfo;
      if (this.showNextVideo && this.showPrivacyBubble) {
        return messages.slice(0, 1);
      } else if (this.showNextVideo || this.showPrivacyBubble) {
        return messages.slice(0, 2);
      }
      return messages;
    },
    container() {
      return process.platform === 'win32' ? 'winContainer' : 'container';
    },
  },
  mounted() {
    asyncStorage.get('preferences').then((data) => {
      this.showPrivacyBubble = data.privacyAgreement === undefined;
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
    closeMessage(id) {
      this.$store.dispatch('removeMessages', id);
      this.$bus.$emit('delete-file');
    },
    checkNextVideoUI(time) {
      if (time > this.nextVideoPreviewTime &&
        !this.showNextVideo &&
        this.nextVideo !== '' &&
        !this.manualClosed) {
        this.$store.dispatch('UpdatePlayingList');
        this.showNextVideo = true;
      } else {
        this.manualClosed = false;
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
  @media screen and (min-width: 320px) and (max-width: 512px) {
    top: 28px;
    right: 19px;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    top: 34px;
    right: 28px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    top: 34px;
    right: 34px;
  }
  @media screen and (min-width: 1921px){
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
    @media screen and (max-width: 512px) {
      display: none;
    }
    @media screen and (min-width: 513px) and (max-width: 854px) {
      margin-bottom: 12px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      margin-bottom: 15px;
    }
    @media screen and (min-width: 1921px){
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
    @media screen and (max-width: 512px) {
      display: none;
    }
    @media screen and (min-width: 513px) and (max-width: 854px) {
      margin-bottom: 12px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      margin-bottom: 15px;
    }
    @media screen and (min-width: 1921px){
      margin-bottom: 18px;
    }
  }
  .toast-enter, .toast-enter-active {
    transform: translateX(0px);
  }
  .toast-enter, .toast-leave-active {
    transform: translateX(403px);
  }
  @media screen and (min-width: 320px) and (max-width: 512px) {
    top: 13px;
    right: 34px;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    top: 22px;
    right: 28px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    top: 25px;
    right: 34px;
  }
  @media screen and (min-width: 1921px){
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
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  z-index: 8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  @media screen and (min-width: 320px) and (max-width: 512px) {
    width: 136px;
    height: 32px;
    margin-left: 80px;
    margin-bottom: 8px;
    border-radius: 6px;
    clip-path: inset(0 round 6px);
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 148px;
    height: 36px;
    margin-left: 92px;
    margin-bottom: 12px;
    border-radius: 7px;
    clip-path: inset(0 round 7px);
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 182px;
    height: 43px;
    margin-left: 106px;
    margin-bottom: 15px;
    border-radius: 8px;
    clip-path: inset(0 round 8px);
  }
  @media screen and (min-width: 1921px) {
    width: 256px;
    height: 60px;
    margin-left: 147px;
    margin-bottom: 18px;
    border-radius: 11px;
    clip-path: inset(0 round 11px);
  }

  .bubbleContent {
    @media screen and (min-width: 320px) and (max-width: 512px) {
      width: 108px;
      height: 11px;
      margin: 11px 14px auto 14px;
    }
    @media screen and (min-width: 513px) and (max-width: 854px) {
      width: 116px;
      height: 12px;
      margin: 12.5px 16px auto 16px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      width: 144px;
      height: 15px;
      margin: 14.5px 19px auto 19px;
    }
    @media screen and (min-width: 1921px) {
      width: 204px;
      height: 21px;
      margin: 20px 26px auto 26px;
    }
    .content {
      color: rgba(255, 255, 255, 0.8);
      @media screen and (min-width: 320px) and (max-width: 512px) {
        font-size: 11px;
        line-height: 11px;
        letter-spacing: 0.4px;
      }
      @media screen and (min-width: 513px) and (max-width: 854px) {
        font-size: 12px;
        line-height: 12px;
        letter-spacing: 0.4px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        font-size: 15px;
        line-height: 15px;
        letter-spacing: 0.4px;
      }
      @media screen and (min-width: 1921px) {
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
  background-color: rgba(0,0,0,0.20);
  backdrop-filter: blur(9.6px);
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  @media screen and (min-width: 320px) and (max-width: 512px) {
    width: 216px;
    height: 47px;
    margin-bottom: 8px;
    border-radius: 6px;
    clip-path: inset(0 round 6px);
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 240px;
    height: 52px;
    margin-bottom: 12px;
    border-radius: 7px;
    clip-path: inset(0 round 7px);
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 288px;
    height: 62px;
    margin-bottom: 15px;
    border-radius: 8px;
    clip-path: inset(0 round 8px);
  }
  @media screen and (min-width: 1921px) {
    width: 403px;
    height: 87px;
    margin-bottom: 18px;
    border-radius: 11px;
    clip-path: inset(0 round 11px);
  }
}
.black-gradient-loading {
  position: absolute;
  background-color: rgba(0,0,0,0.20);
  backdrop-filter: blur(9.6px);
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  @media screen and (min-width: 320px) and (max-width: 512px) {
    width: 136px;
    height: 32px;
    margin-left: 80px;
    margin-bottom: 8px;
    border-radius: 6px;
    clip-path: inset(0 round 6px);
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 148px;
    height: 36px;
    margin-left: 92px;
    margin-bottom: 12px;
    border-radius: 7px;
    clip-path: inset(0 round 7px);
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 182px;
    height: 43px;
    margin-left: 106px;
    margin-bottom: 15px;
    border-radius: 8px;
    clip-path: inset(0 round 8px);
  }
  @media screen and (min-width: 1921px) {
    width: 256px;
    height: 60px;
    margin-left: 147px;
    margin-bottom: 18px;
    border-radius: 11px;
    clip-path: inset(0 round 11px);
  }
}

.errorContainer {
  display: flex;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  @media screen and (min-width: 320px) and (max-width: 512px) {
    width: 216px;
    height: 47px;
    margin-bottom: 8px;
    border-radius: 6px;
    clip-path: inset(0 round 6px);
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 240px;
    height: 52px;
    margin-bottom: 12px;
    border-radius: 7px;
    clip-path: inset(0 round 7px);
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 288px;
    height: 62px;
    margin-bottom: 15px;
    border-radius: 8px;
    clip-path: inset(0 round 8px);
  }
  @media screen and (min-width: 1921px) {
    width: 403px;
    height: 87px;
    margin-bottom: 18px;
    border-radius: 11px;
    clip-path: inset(0 round 11px);
  }

  .bubbleContent {
    @media screen and (min-width: 320px) and (max-width: 512px) {
      width: 160px;
      height: 23px;
      margin: 12px auto auto 14px;
    }
    @media screen and (min-width: 513px) and (max-width: 854px) {
      width: 178px;
      height: 26px;
      margin: 13px auto auto 16px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      width: 214px;
      height: 32px;
      margin: 15px auto auto 19px;
    }
    @media screen and (min-width: 1921px) {
      width: 300px;
      height: 45px;
      margin: 21px auto auto 26px;
    }
    .title {
      color: rgba(255, 255, 255, 1);
      @media screen and (min-width: 320px) and (max-width: 512px) {
        font-size: 11px;
        line-height: 11px;
        letter-spacing: 0.4px;
        margin-bottom: 3px;
      }
      @media screen and (min-width: 513px) and (max-width: 854px) {
        font-size: 12px;
        line-height: 12px;
        letter-spacing: 0.4px;
        margin-bottom: 4px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        font-size: 15px;
        line-height: 15px;
        letter-spacing: 0.4px;
        margin-bottom: 5px;
      }
      @media screen and (min-width: 1921px) {
        font-size: 21px;
        line-height: 21px;
        letter-spacing: 0.7px;
        margin-bottom: 7px;
      }
    }
    .content {
      color: rgba(255, 255, 255, 0.7);
      @media screen and (min-width: 320px) and (max-width: 512px) {
        font-size: 9px;
        line-height: 9px;
        letter-spacing: 0.2px;
      }
      @media screen and (min-width: 513px) and (max-width: 854px) {
        font-size: 10px;
        line-height: 10px;
        letter-spacing: 0.2px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        font-size: 12px;
        line-height: 12px;
        letter-spacing: 0.24px;
      }
      @media screen and (min-width: 1921px) {
        font-size: 17px;
        line-height: 17px;
        letter-spacing: 0.3px;
      }
    }
  }

  .bubbleClose {
    cursor: pointer;
    @media screen and (min-width: 320px) and (max-width: 512px) {
      margin: 13.5px 14px auto auto;
    }
    @media screen and (min-width: 513px) and (max-width: 854px) {
      margin: 15px 16px auto auto;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      margin: 18px 20px auto auto;
    }
    @media screen and (min-width: 1921px) {
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
