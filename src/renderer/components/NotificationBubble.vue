<template>
  <div class="errorContainer"
    v-if='bubbleAppear'
    :class="bubble_ani"
    @animationend="animationEnd">
    <div class="bubbleContent">
      <div class="title">{{ notificationTitle }}</div>
      <div class="content">{{ notificationContent }}</div>
    </div>
    <Icon type="bubble" class="bubbleClose" @mousedown.native.left="closeError"></Icon>
  </div>
</template>

<script>
import Icon from './BaseIconContainer';
export default {
  name: 'NotificationBubble',
  components: {
    Icon,
  },
  data() {
    return {
      bubbleAppear: false,
      bubble_ani: '',
      aniFlag: false,
    };
  },
  props: {
    notificationTitle: {
      type: String,
      require: true,
    },
    notificationContent: {
      type: String,
      require: true,
    },
  },
  mounted() {
    this.$bus.$on('notification-bubble-appear', () => {
      this.bubbleAppear = true;
      this.bubble_ani = 'bubble-appear';
    });
  },
  methods: {
    animationEnd() {
      if (this.aniFlag) {
        this.bubbleAppear = false;
        this.aniFlag = false;
      } else {
        setTimeout(() => {
          this.bubbleAppear = false;
        }, 3000);
      }
    },
    closeError() {
      this.bubble_ani = 'bubble-close';
      this.aniFlag = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.errorContainer {
    position: absolute;
    display: flex;
    border-radius: 6px;
    background-color: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(9.8px);
    z-index: 6;
    border: 0.9px solid rgba(255, 255, 255, 0.1);
    @media screen and (min-width: 320px) and (max-width: 512px) {
      top: 12px;
      right: 15px;
      width: 217px;
      height: 48px;
    }
    @media screen and (min-width: 513px) and (max-width: 854px) {
      top: 21px;
      right: 27px;
      width: 241px;
      height: 54px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      top: 25px;
      right: 32px;
      width: 289px;
      height: 63px;
    }
}
.bubbleContent {
  margin: auto 13px;
  .title {
    color: rgba(255, 255, 255, 1);
    @media screen and (min-width: 320px) and (max-width: 512px) {
      font-size: 11px;
      letter-spacing: 0.37px;
    }
    @media screen and (min-width: 513px) and (max-width: 854px) {
      font-size: 12px;
      letter-spacing: 0.4px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      font-size: 14px;
      letter-spacing: 0.47px;
    }
  }
  .content {
    color: rgba(255, 255, 255, 0.7);
    @media screen and (min-width: 320px) and (max-width: 512px) {
      font-size: 9px;
      letter-spacing: 0.3px;
    }
    @media screen and (min-width: 513px) and (max-width: 854px) {
      font-size: 10px;
      letter-spacing: 0.33px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      font-size: 12px;
      letter-spacing: 0.4px;
    }
  }
}

.bubbleClose {
   margin: auto;
   cursor: pointer;
}

.bubble-appear {
  animation: ytp-bezel-fadeout1 150ms linear 1 normal forwards;
}

@keyframes ytp-bezel-fadeout1 {
  0% {opacity: 0; transform: translateX(60px)}
  50% {opacity: 0.5; transform: translateX(30px)}
  100% {opacity: 1; transform: translateX(0px)}
}

.bubble-close {
  animation: ytp-bezel-fadeout2 150ms linear 1 normal forwards;
}

@keyframes ytp-bezel-fadeout2 {
  0% {opacity: 1; transform: translateX(0px)}
  %25 {opacity: 0.5; transform: translateX(60px)}
  50% {opacity: 0.2; transform: translateX(250px)}
  75% {opacity: 0.1; transform: translateX(300px)}
  100% {opacity: 0; transform: translateX(400px)}
}
</style>
