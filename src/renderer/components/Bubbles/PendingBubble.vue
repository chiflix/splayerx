<template>
  <transition
    name="bubble"
    mode="out-in"
  >
    <div
      :key="pendingState"
      class="bubble"
    >
      <div class="black-gradient" />
      <div class="container backdrop-fallback">
        <div class="bubble-content">
        <p class="content"><!--eslint-disable-line-->{{ pendingState ? pendingContent : successContent }}</p>
        </div>
      </div>
    </div>
  </transition>
</template>
<script lang="ts">
export default {
  name: 'PendingBubble',
  props: {
    id: {
      type: String,
      required: true,
    },
    pending: {
      type: Boolean,
      default: true,
    },
    pendingContent: {
      type: String,
      required: true,
    },
    successContent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      pendingState: true,
      pendingStartTime: Date.now(),
    };
  },
  watch: {
    pending(val: boolean) {
      if (!val) {
        if ((Date.now() - this.pendingStartTime) < 3000) {
          setTimeout(() => {
            this.pendingState = val;
            setTimeout(() => {
              this.$store.dispatch('removeMessages', this.id);
            }, 2000);
          }, 3000);
        } else {
          this.pendingState = val;
          setTimeout(() => {
            this.$store.dispatch('removeMessages', this.id);
          }, 2000);
        }
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.bubble-enter-active, .bubble-leave-active {
  transition: transform 400ms cubic-bezier(0.17, 0.67, 0.17, 0.98);
}
.bubble-enter, .bubble-leave-to {
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    transform: translateX(350px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    transform: translateX(420px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    transform: translateX(593px);
  }
}
.bubble {
  position: relative;
  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    zoom: 0.8;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    zoom: 1;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    zoom: 1.2;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    zoom: 1.68;
  }
}
.black-gradient {
  position: absolute;
  width: 100%;
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  border-radius: 7px;
  z-index: -1;
}
.container {
  display: flex;
  justify-content: flex-start;
  background-image: radial-gradient(
    80% 130%,
    rgba(85,85,85,0.88) 20%,
    rgba(85,85,85,0.78) 50%,
    rgba(85,85,85,0.72) 60%,
    rgba(85,85,85,0.46) 80%,
    rgba(85,85,85,0.00) 100%
  );
  // backdrop-filter: blur(8px);
  z-index: 8;
  border-radius: 8px;
  .bubble-content {
    margin: 12px 16px;
    .content {
      white-space: pre-line;
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
      font-size: 12px;
      line-height: 12px;
      letter-spacing: 0.4px;
    }
  }
}
</style>
