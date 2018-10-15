<template>
  <div class="container">
    <NextVideo v-if="showNextVideo" @close-nextvideo="closemousedown" class="next-video"/>
    <transition-group name="toast">
      <div v-for="m in messages" :key="m.id"
        :id="'item' + m.id"
        :class="m.type === 'error' ? 'errorContainer' : 'loadingContainer'">
        <div class="bubbleContent">
          <div class="title" v-if="m.type === 'error'">{{ m.title }}</div>
          <div class="content">{{ m.content }}</div>
        </div>
        <Icon v-if="m.type === 'error'" type="close" class="bubbleClose" @click.native.left="closeMessage(m.id)"></Icon>
      </div>
    </transition-group>
  </div>
</template>

<script>
import NextVideo from '@/components/PlayingView/NextVideo.vue';
import Icon from './BaseIconContainer';
export default {
  name: 'notification-bubble',
  components: {
    Icon,
    NextVideo,
  },
  data() {
    return {
      showNextVideo: false,
    };
  },
  computed: {
    messages() {
      return this.$store.getters.messageInfo;
    },
  },
  mounted() {
  },
  methods: {
    closemousedown() {
      console.log('closemousedown');
    },
    closeMessage(id) {
      this.$store.dispatch('removeMessages', id);
    },
  },
};
</script>

<style lang="scss">

.container {
  -webkit-app-region: no-drag;
  position: absolute;
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
  transition: 400ms cubic-bezier(0.17, 0.67, 0.17, 0.98), left 150ms linear;
  transition-property: opacity, transform;
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


.errorContainer {
  position: relative;
  display: flex;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  z-index: 8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: 400ms cubic-bezier(0.17, 0.67, 0.17, 0.98), left 150ms linear;
  transition-property: opacity, transform;
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

.toast-enter-active, .toast-leave {
  opacity: 1;
}
.toast-enter, .toast-leave-active {
  opacity: 0;
}
.toast-leave-active {
  position: absolute;
}

</style>
