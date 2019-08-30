<template>
  <div class="bubble">
    <div class="black-gradient-result" />
    <div class="result-container backdrop-fallback">
      <div class="bubble-content">
        <p class="content"><!--eslint-disable-line-->{{ content }}</p>
      </div>
      <div
        :class="{
          hover: hovered,
        }"
        @mouseover.stop="hovered = true"
        @mouseout.stop="hovered = false"
        @mouseup="close"
        class="button"
      >
        <div class="button-info">
          {{ $t('alertBubble.button') }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'AlertBubble',
  props: {
    useBlur: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      required: true,
    },
    close: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      hovered: false,
    };
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
.black-gradient-result {
  position: absolute;
  width: 100%;
  height: 100%;
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.3);
  border-radius: 7px;
}

.result-container {
  display: flex;
  align-items: center;
  background-image: radial-gradient(
    80% 130%,
    rgba(85, 85, 85, 0.88) 20%,
    rgba(85, 85, 85, 0.78) 50%,
    rgba(85, 85, 85, 0.72) 60%,
    rgba(85, 85, 85, 0.46) 80%,
    rgba(85, 85, 85, 0) 100%
  );
  backdrop-filter: blur(8px);
  border-radius: 7px;
  .bubble-content {
    width: auto;
    max-width: 240px;
    margin: 14px 18px;
    .content {
      white-space: pre-line;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      line-height: 14px;
      letter-spacing: 0.2px;
    }
  }
  .hover {
    cursor: pointer;
    background-image: none;
    background-color: rgba(255,255,255,0.2);
  }
  .button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 80ms linear;
    height: 24px;
    margin-right: 16px;
    border-radius: 11px;
    background-image:
      radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);
    // backdrop-filter: blur(3px);
    &:active {
      background-image: none;
      background-color: rgba(0,0,0,0.2);
    }
  }
  .button-info {
    color: rgba(255,255,255,0.5);
    font-weight: 700;
    padding-left: 12px;
    padding-right: 12px;
    font-size: 10px;
    letter-spacing: 0.2px;
    line-height: 10px;
  }
}
</style>
