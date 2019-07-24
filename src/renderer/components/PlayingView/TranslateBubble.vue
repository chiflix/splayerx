<template>
  <div @mouseup.stop="">
    <div
      :class="`${
        showWhenGrab || showWhenStopTranslate
          ? 'bubbleLayout--column'
          : 'bubbleLayout--row'
      }`"
      class="bubble"
    >
      <p class="bubble__info">
        {{ message }}
      </p>
      <!-- 提取音频时，气泡 -->
      <div
        v-if="showWhenGrab"
        class="buttonGroup"
      >
        <div
          @mouseup.stop="$emit('disCardTranslate');"
          class="bubble__button--lower"
        >
          {{ $t('translateBubble.leave') }}
        </div>
        <div
          @mouseup.stop="$emit('hide');"
          class="bubble__button"
        >
          {{ $t('translateBubble.continue') }}
        </div>
      </div>
      <!-- 后台翻译，切换视频和关闭窗口的气泡 -->
      <div v-else-if="showHideWhenTranslate">
        <div
          @mouseup.stop="$emit('backStageTranslate');"
          class="bubble__button"
        >
          {{ $t('translateBubble.ok') }}
        </div>
      </div>
      <!-- 正在翻译，想使用其他翻译或者刷新字幕 -->
      <div
        v-else-if="showWhenStopTranslate"
        class="buttonGroup"
      >
        <div
          @mouseup.stop="$emit('disCardTranslate');"
          class="bubble__button--lower"
        >
          {{ $t('translateBubble.leave') }}
        </div>
        <div
          @mouseup.stop="$emit('hide');"
          class="bubble__button"
        >
          {{ $t('translateBubble.continue') }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { AudioTranslateBubbleType } from '../../store/modules/AudioTranslate';

export default Vue.extend({
  name: 'TanslateBubble',
  props: {
    type: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  computed: {
    showWhenGrab() {
      // 当前正在提取音频,确认删除
      return this.type === AudioTranslateBubbleType.ChangeWhenGrab
      || this.type === AudioTranslateBubbleType.NextVideoWhenGrab
      || this.type === AudioTranslateBubbleType.CloseWhenGrab;
    },
    showHideWhenTranslate() {
      return this.type === AudioTranslateBubbleType.ChangeWhenTranslate
      || this.type === AudioTranslateBubbleType.NextVideoWhenTranslate
      || this.type === AudioTranslateBubbleType.CloseWhenTranslate;
    },
    showWhenStopTranslate() {
      return this.type === AudioTranslateBubbleType.ClickWhenTranslate
       || this.type === AudioTranslateBubbleType.RefreshWhenTranslate;
    },
  },
});
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
  zoom: 1;
  box-sizing: border-box;
  padding: 14px 18px;
  margin-bottom: 12px;
  display: flex;
  border-radius: 7px;
  border: 1px solid rgba(160,160,160,0.7);
  background-image: radial-gradient(
    80% 130%,
    rgba(85,85,85,0.88) 20%,
    rgba(85,85,85,0.78) 50%,
    rgba(85,85,85,0.72) 60%,
    rgba(85,85,85,0.46) 80%,
    rgba(85,85,85,0.00) 100%
  );
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  max-width: 296px;
  min-height: 54px;
  &__info {
    width: 100%;
    color: rgba(255,255,255,0.7);
    font-weight: 500;
    height: fit-content;
    font-size: 11px;
    line-height: 15px;
  }
  &__button {
    color: rgba(255,255,255,0.5);
    font-weight: 700;
    transition: background-color 80ms linear;
    white-space: nowrap;
    height: 24px;
    margin-left: 12px;
    padding-left: 12px;
    padding-right: 12px;
    border-radius: 12px;
    font-size: 10px;
    line-height: 24px;
    text-align: center;
    background-color: rgba(255,255,255,0.1);
    cursor: pointer;
    &:hover {
      background-image: none;
      background-color: rgba(255,255,255,0.2);
    }
    &:active {
      background-image: none;
      background-color: rgba(0,0,0,0.2);
    }
    &--lower {
      cursor: pointer;
      height: 24px;
      font-size: 10px;
      line-height: 24px;
      background: none;
      color: rgba(255,255,255,0.2);
      &:hover {
        color: rgba(255,255,255,0.4);
      }
    }
  }
  .buttonGroup {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
  }
  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    & {
      display: none;
    }
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
.bubbleLayout {
  &--row {
    min-width: 148px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  &--column {
    min-width: 296px;
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>
