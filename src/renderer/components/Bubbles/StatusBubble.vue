<template>
  <div class="bubble">
    <div class="black-gradient-state" />
    <div class="state-container backdrop-fallback">
      <div class="bubble-content">
        <p class="content"><!--eslint-disable-line-->{{ content }}</p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'StatusBubble',
  props: {
    useBlur: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
    };
  },
};
</script>
<style lang="scss" scoped>
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
.black-gradient-state {
  position: absolute;
  width: 100%;
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  border-radius: 7px;
  z-index: -1;
}
.state-container {
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
