<template>
  <div class="bubble">
    <div class="black-gradient-result" />
    <div class="result-container backdrop-fallback">
      <div class="bubble-content">
        <p
          v-if="title !== ''"
          class="title"
        >
          {{ title }}
        </p>
        <p class="content"><!--eslint-disable-line-->{{ content }}</p>
      </div>
      <Icon
        @click.native.left="close(id, title)"
        type="close"
        class="bubble-close"
      />
    </div>
  </div>
</template>
<script lang="ts">
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'ErrorBubble',
  components: {
    Icon,
  },
  props: {
    useBlur: {
      type: Boolean,
      default: false,
    },
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
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
    .title {
      color: rgba(255, 255, 255, 1);
      font-size: 12px;
      line-height: 12px;
      letter-spacing: 0.4px;
      margin-bottom: 4px;
    }
    .content {
      white-space: pre-line;
      color: rgba(255, 255, 255, 0.7);
      font-size: 10px;
      line-height: 14px;
      letter-spacing: 0.2px;
    }
  }
  .bubble-close {
    cursor: pointer;
    width: 22px;
    height: 22px;
    margin-right: 16px;
  }
}
</style>
