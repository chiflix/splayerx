<template>
  <div :class="[container, { rtl: isRtl }]">
    <transition name="nextvideo">
      <NextVideo
        ref="nextVideo"
        v-if="showNextVideo"
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
    <MASPrivacyBubble
      v-if="showPrivacyBubble && isMas"
      @close-privacy-bubble="closePrivacyBubble"
      class="mas-privacy-bubble"
    />
    <transition-group
      name="toast"
      class="transGroup"
    >
      <div
        v-for="m in messages"
        :id="'item' + m.id"
        :key="m.id"
        class="messageContainer"
      >
        <div :class="m.type === 'result' ? 'black-gradient-result' : 'black-gradient-state'" />
        <div :class="m.type === 'result' ? 'resultContainer' : `stateContainer`">
          <div class="bubbleContent">
            <p
              v-if="m.type === 'result'"
              class="title"
            >
              {{ m.title }}
            </p>
            <p class="content">
              {{ m.content }}
            </p>
          </div>
          <Icon
            v-if="m.type === 'result'"
            @click.native.left="closeMessage(m.id, m.title)"
            type="close"
            class="bubbleClose"
          />
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import NextVideo from '@/components/PlayingView/NextVideo.vue';
import PrivacyBubble from '@/components/PlayingView/PrivacyConfirmBubble.vue';
import MASPrivacyBubble from '@/components/PlayingView/MASPrivacyConfirmBubble.vue';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import Icon from './BaseIconContainer.vue';

export default {
  name: 'NotificationBubble',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    Icon,
    NextVideo,
    PrivacyBubble,
    MASPrivacyBubble,
  },
  data() {
    return {
      manualClosed: false, // if nextVideo was manually closed then it won't appear again
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
    closeMessage(id: string) {
      this.$store.dispatch('removeMessages', id);
    },
    checkNextVideoUI(time: number) {
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
  -webkit-app-region: no-drag;
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
.stateContainer {
  display: flex;
  justify-content: flex-start;
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  z-index: 8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    height: 32px;
    border-radius: 6px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    height: 36px;
    border-radius: 7px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    height: 43px;
    border-radius: 8px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    height: 60px;
    border-radius: 11px;
  }

  .bubbleContent {
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
      width: auto;
      height: 11px;
      margin: auto 14px auto 14px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      width: auto;
      height: 12px;
      margin: auto 16px auto 16px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      width: auto;
      height: 15px;
      margin: auto 19px auto 19px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      width: auto;
      height: 21px;
      margin: auto 26px auto 26px;
    }
    .content {
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
        font-size: 11px;
        line-height: 11px;
        letter-spacing: 0.4px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        font-size: 12px;
        line-height: 12px;
        letter-spacing: 0.4px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        font-size: 15px;
        line-height: 15px;
        letter-spacing: 0.4px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        font-size: 21px;
        line-height: 21px;
        letter-spacing: 0.7px;
      }
    }
  }
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
.black-gradient-result {
  position: absolute;
  width: 100%;
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    height: 47px;
    border-radius: 6px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    height: 52px;
    border-radius: 7px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    height: 62px;
    border-radius: 8px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    height: 87px;
    border-radius: 11px;
  }
}
.black-gradient-state {
  position: absolute;
  width: 100%;
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    height: 32px;
    border-radius: 6px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    height: 36px;
    border-radius: 7px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    height: 43px;
    border-radius: 8px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    height: 60px;
    border-radius: 11px;
  }
}

.resultContainer {
  display: flex;
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    height: 47px;
    border-radius: 6px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    height: 52px;
    border-radius: 7px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    height: 62px;
    border-radius: 8px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    height: 87px;
    border-radius: 11px;
  }

  .bubbleContent {
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
      width: auto;
      height: 23px;
      margin: 12px 10px auto 14px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      width: auto;
      height: 26px;
      margin: 13px 15px auto 16px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      width: auto;
      height: 32px;
      margin: 15px 20px auto 19px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      width: auto;
      height: 45px;
      margin: 21px 25px auto 26px;
    }
    .title {
      color: rgba(255, 255, 255, 1);
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
        font-size: 11px;
        line-height: 11px;
        letter-spacing: 0.4px;
        margin-bottom: 3px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        font-size: 12px;
        line-height: 12px;
        letter-spacing: 0.4px;
        margin-bottom: 4px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        font-size: 15px;
        line-height: 15px;
        letter-spacing: 0.4px;
        margin-bottom: 5px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        font-size: 21px;
        line-height: 21px;
        letter-spacing: 0.7px;
        margin-bottom: 7px;
      }
    }
    .content {
      color: rgba(255, 255, 255, 0.7);
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
        font-size: 9px;
        line-height: 9px;
        letter-spacing: 0.2px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        font-size: 10px;
        line-height: 10px;
        letter-spacing: 0.2px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        font-size: 12px;
        line-height: 12px;
        letter-spacing: 0.24px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        font-size: 17px;
        line-height: 17px;
        letter-spacing: 0.3px;
      }
    }
  }

  .bubbleClose {
    cursor: pointer;

    @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
      width: 20px;
      height: 20px;
      margin: 13.5px 14px auto auto;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      width: 22px;
      height: 22px;
      margin: 15px 16px auto auto;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      width: 26px;
      height: 26px;
      margin: 18px 20px auto auto;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      width: 36px;
      height: 36px;
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
