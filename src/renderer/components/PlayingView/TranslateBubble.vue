<template>
  <transition
    name=""
    mode=""
  >
    <div @mouseup.stop="">
      <div class="plane-background">
        <div class="plane">
          <div :class="`content ${showWhenGrab || showWhenStopTranslate ? 'two' : 'one'}`">
            <p class="info">
              {{ message }}
            </p>
            <!-- 提取音频时，气泡 -->
            <div v-if="showWhenGrab">
              <div
                :class="{
                  hover: hovered,
                }"
                @mouseover.stop="hovered = true"
                @mouseout.stop="hovered = false"
                @mouseup.stop="$emit('disCardTranslate');"
                class="button"
              >
                <div class="button-info">
                  仍要关闭
                </div>
              </div>
              <div
                :class="{
                  hover: seconButtonHovered,
                }"
                @mouseover.stop="seconButtonHovered = true"
                @mouseout.stop="seconButtonHovered = false"
                @mouseup.stop="$emit('hide');"
                class="button"
              >
                <div class="button-info">
                  取消
                </div>
              </div>
            </div>
            <!-- 后台翻译，关闭窗口气泡 -->
            <div v-else-if="showDiscardWhenTranlate">
              <div
                :class="{
                  hover: hovered,
                }"
                @mouseover.stop="hovered = true"
                @mouseout.stop="hovered = false"
                @mouseup.stop="$emit('disCardTranslate');"
                class="button"
              >
                <div class="button-info">
                  好的
                </div>
              </div>
            </div>
            <!-- 后台翻译，切换视频的气泡 -->
            <div v-else-if="showHideWhenTranslate">
              <div
                v-if="showBackStageButton"
                :class="{
                  hover: hovered,
                }"
                @mouseover.stop="hovered = true"
                @mouseout.stop="hovered = false"
                @mouseup.stop="$emit('backStageTranslate');"
                class="button"
              >
                <div class="button-info">
                  好的
                </div>
              </div>
            </div>
            <!-- 正在翻译，想使用其他翻译或者刷新字幕 -->
            <div v-else-if="showWhenStopTranslate">
              <div
                :class="{
                  hover: hovered,
                }"
                @mouseover.stop="hovered = true"
                @mouseout.stop="hovered = false"
                @mouseup.stop="$emit('disCardTranslate');"
                class="button"
              >
                <div class="button-info">
                  好的
                </div>
              </div>
              <div
                :class="{
                  hover: seconButtonHovered,
                }"
                @mouseover.stop="seconButtonHovered = true"
                @mouseout.stop="seconButtonHovered = false"
                @mouseup.stop="$emit('disCardTranslate');"
                class="button"
              >
                <div class="button-info">
                  停止翻译
                </div>
              </div>
            </div>
            <!-- 当翻译结束，失败的时候 -->
            <div v-else-if="showWhenError">
              <div
                :class="{
                  hover: hovered,
                }"
                @mouseover.stop="hovered = true"
                @mouseout.stop="hovered = false"
                @mouseup.stop="$emit('hide');"
                class="button"
              >
                <div class="button-info">
                  好的
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
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
  data() {
    return {
      hovered: false,
      seconButtonHovered: false,
      bubbleLayout: '',
    };
  },
  computed: {
    showWhenGrab() {
      // 当前正在提取音频,确认删除
      return this.type === AudioTranslateBubbleType.ChangeWhenGrab
      || this.type === AudioTranslateBubbleType.CloseWhenGrab;
    },
    showDiscardWhenTranlate() {
      return this.type === AudioTranslateBubbleType.CloseWhenTranslate;
    },
    showHideWhenTranslate() {
      return this.type === AudioTranslateBubbleType.ChangeWhenTranslate;
    },
    showWhenStopTranslate() {
      return this.type === AudioTranslateBubbleType.ClickWhenTranslate;
    },
    showWhenError() {
      return this.type === AudioTranslateBubbleType.FailAfterTranslate;
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
.bubblePlane {
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
  display: flex;
  justify-content: flex-end;
  align-items: center;
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    border-radius: 7px;
    min-height: 54px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    border-radius: 8.4px;
    min-height: 62px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    border-radius: 11.76px;
    min-height: 87px;
  }
  .underline {
    text-decoration: underline;
    &:hover {
      cursor: pointer;
    }
  }
  .info {
    color: rgba(255,255,255,0.7);
    font-weight: 500;
    height: fit-content;
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin: 14px 14px 14px 18px;
      font-size: 11px;
      line-height: 15px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin: 14px 16px 14px 19px;
      font-size: 12px;
      line-height: 18px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin: 20px 20px 20px 26px;
      font-size: 17px;
      line-height: 25px;
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
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      height: 24px;
      margin-right: 16px;
      border-radius: 11px;
      background-image: radial-gradient(
        60% 134%,
        rgba(255,255,255,0.09) 44%,
        rgba(255,255,255,0.05) 100%
      );
      backdrop-filter: blur(3px);
      clip-path: inset(0px round 11px);
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      height: 28px;
      margin-right: 20px;
      border-radius: 13.2px;
      background-image: radial-gradient(
        60% 134%,
        rgba(255,255,255,0.09) 44%,
        rgba(255,255,255,0.05) 100%
      );
      backdrop-filter: blur(3px);
      clip-path: inset(0px round 13.2px);
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      height: 39px;
      margin-right: 28px;
      border-radius: 18.5px;
      background-image: radial-gradient(
        60% 134%,
        rgba(255,255,255,0.09) 44%,
        rgba(255,255,255,0.05) 100%
      );
      backdrop-filter: blur(5px);
      clip-path: inset(0px round 18.5px);
    }
    &:active {
      background-image: none;
      background-color: rgba(0,0,0,0.2);
    }
  }
  .button-info {
    color: rgba(255,255,255,0.5);
    font-weight: 700;
    letter-spacing: 0.2px;
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      padding-left: 12px;
      padding-right: 12px;

      font-size: 10px;
      letter-spacing: 0.2px;
      line-height: 10px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      padding-left: 14px;
      padding-right: 14px;

      font-size: 12px;
      letter-spacing: 0.24px;
      text-align: center;
      line-height: 12px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      padding-left: 20px;
      padding-right: 20px;

      font-size: 17px;
      letter-spacing: 0.34px;
      text-align: center;
      line-height: 17px;
    }
  }
}
</style>
