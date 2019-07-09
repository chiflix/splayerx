<template>
  <transition
    name=""
    mode=""
  >
    <div @mouseup.stop="">
      <div class="plane-background">
        <div class="plane">
          <div class="content">
            <p :class="infoCSS">
              {{ message }}
            </p>
            <div
              v-if="showDiscardButton"
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
              v-if="showCancelButton"
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
            <div
              v-if="showOKButton"
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
            <div
              v-if="showStopTranslateButton"
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
    };
  },
  computed: {
    showDiscardButton() {
      return this.type === AudioTranslateBubbleType.ChangeWhenGrab;
    },
    showCancelButton() {
      return this.type === AudioTranslateBubbleType.ChangeWhenGrab;
    },
    showBackStageButton() {
      return this.type === AudioTranslateBubbleType.ChangeWhenTranslate;
    },
    showOKButton() {
      return this.type === AudioTranslateBubbleType.ClickWhenTranslate
        || this.type === AudioTranslateBubbleType.FailAfterTranslate;
    },
    showStopTranslateButton() {
      return this.type === AudioTranslateBubbleType.ClickWhenTranslate;
    },
    infoCSS() {
      if (this.$i18n.locale === 'en') {
        if (this.state === 1) {
          return 'info-en-state-1';
        }
        return 'info-en-state-2';
      }
      if (this.state === 1) {
        return 'info-state-1';
      }
      return 'info-state-2';
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
.plane-background {
  background-color: rgba(0,0,0,0.1);
  backdrop-filter: blur(9.6px);
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    display: none;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    border-radius: 7px;
    clip-path: inset(0px round 7px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    border-radius: 8.4px;
    clip-path: inset(0px round 8.4px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    border-radius: 11.76px;
    clip-path: inset(0px round 11.76px);
  }
}
.plane {
  border-style: solid;
  border-width: 0.5px;
  border-color: rgba(255,255,255,0.1);

  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    border-radius: 7px;
    clip-path: inset(0px round 7px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    border-radius: 8.4px;
    clip-path: inset(0px round 8.4px);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    border-radius: 11.76px;
    clip-path: inset(0px round 11.76px);
  }
  .content {
    display: flex;
    justify-content: flex-end;
    align-items: center;

    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      min-height: 54px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      min-height: 62px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      min-height: 87px;
    }
    .underline {
      text-decoration: underline;
      &:hover {
        cursor: pointer;
      }
    }
    .info-state-1 {
      color: rgba(255,255,255,0.7);
      height: fit-content;
      font-weight: 500;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        margin-left: 18px;
        margin-right: 14px;
        margin-top: 14px;
        margin-bottom: 14px;
        width: 202px;

        font-size: 11px;
        letter-spacing: 0.2px;
        line-height: 15px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        margin-left: 19px;
        margin-right: 16px;
        margin-top: 14px;
        margin-bottom: 14px;
        width: 221px;

        font-size: 12px;
        letter-spacing: 0.24px;
        line-height: 18px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        margin-left: 26px;
        margin-right: 20px;
        margin-top: 20px;
        margin-bottom: 20px;
        width: 313px;

        font-size: 17px;
        letter-spacing: 0.34px;
        line-height: 25.2px;
      }
    }
    .info-state-2 {
      color: rgba(255,255,255,0.7);
      height: fit-content;
      font-weight: 500;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        margin-left: 18px;
        margin-right: 14px;
        margin-top: 14px;
        margin-bottom: 14px;
        width: 161px;

        font-size: 11px;
        letter-spacing: 0.2px;
        line-height: 15px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        margin-left: 19px;
        margin-right: 16px;
        margin-top: 14px;
        margin-bottom: 14px;
        width: 174px;

        font-size: 12px;
        letter-spacing: 0.24px;
        line-height: 18px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        margin-left: 26px;
        margin-right: 20px;
        margin-top: 20px;
        margin-bottom: 20px;
        width: 245px;

        font-size: 17px;
        letter-spacing: 0.34px;
        line-height: 25.2px;
      }
    }
    .info-en-state-1 {
      color: rgba(255,255,255,0.7);
      height: min-content;
      font-weight: 500;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        margin-left: 18px;
        margin-right: 14px;
        margin-top: 10px;
        margin-bottom: 12px;
        width: 206px;

        font-size: 11px;
        line-height: 15px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        margin-left: 19px;
        margin-right: 16px;
        margin-top: 12px;
        margin-bottom: 14px;
        width: 247px;

        font-size: 13.2px;
        line-height: 18px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        margin-left: 26px;
        margin-right: 20px;
        margin-top: 20px;
        margin-bottom: 20px;
        width: 345px;

        font-size: 18.48px;
        line-height: 25.2px;
      }
    }
    .info-en-state-2 {
      color: rgba(255,255,255,0.7);
      height: min-content;
      font-weight: 500;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        margin-left: 18px;
        margin-right: 14px;
        margin-top: 12px;
        margin-bottom: 12px;
        width: 153px;

        font-size: 11px;
        line-height: 15px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        margin-left: 19px;
        margin-right: 16px;
        margin-top: 13px;
        margin-bottom: 14px;
        width: 184px;

        font-size: 13.2px;
        line-height: 18px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        margin-left: 26px;
        margin-right: 20px;
        margin-top: 20px;
        margin-bottom: 20px;
        width: 257px;

        font-size: 18.48px;
        line-height: 25.2px;
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
}
</style>
