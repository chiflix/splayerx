<template>
  <transition
    name="bubble"
    mode="out-in"
  >
    <div
      class="privacy-bubble"
    >
      <div
        :class="useBlur ? 'backdrop' : 'backdrop-fallback'"
        class="plane-background"
      >
        <div class="plane">
          <div class="content">
            <p class="info-state-1">
              {{ $t('protectBubble.content') }}
            </p>
            <div class="buttons">
              <div
                :class="{
                  hover: agreeHovered,
                }"
                @mouseover.stop="agreeHovered = true"
                @mouseout.stop="agreeHovered = false"
                @mouseup.stop="handleAgree"
                class="agree-button"
              >
                {{ $t('protectBubble.agree') }}
              </div>
              <div
                @mouseup.stop="handleSetting"
                class="disagree-button"
              >
                {{ $t('protectBubble.setting') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
<script lang="ts">
export default {
  name: 'PrivacyBubble',
  props: {
    useBlur: {
      type: Boolean,
      default: false,
    },
    handleAgree: {
      type: Function,
      required: true,
    },
    handleSetting: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      /*
        use class transition other than native :hover
        because of unknown flashing bug
       */
      agreeHovered: false,
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
.plane-background {
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    display: none;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    border-radius: 7px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    border-radius: 8.4px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    border-radius: 11.76px;
  }
}
.plane {
  border-style: solid;
  border-width: 0.5px;
  border-color: rgba(255,255,255,0.1);

  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    border-radius: 7px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    border-radius: 8.4px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    border-radius: 11.76px;
  }
  .content {
    display: flex;
    flex-direction: row;
    align-items: center;

    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      min-height: 54px;
      margin-top: 8px;
      margin-left: 18px;
      margin-right: 15px;
      margin-bottom: 8px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      min-height: 62px;
      margin-top: 17px;
      margin-left: 19px;
      margin-right: 14px;
      margin-bottom: 17px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      min-height: 87px;
      margin-top: 25px;
      margin-left: 26px;
      margin-right: 28px;
      margin-bottom: 25px;
    }
    .info-state-1 {
      color: rgba(255,255,255,0.7);
      height: fit-content;
      font-weight: 900;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        margin-right: 5px;
        width: 245px;

        font-size: 11px;
        letter-spacing: 0.2px;
        line-height: 15px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        margin-right: 8px;
        width: 314px;

        font-size: 13px;
        letter-spacing: 0.24px;
        line-height: 18px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        margin-right: 15px;
        width: 438px;

        font-size: 18px;
        letter-spacing: 0.6px;
        line-height: 25.2px;
      }
    }
    .buttons {
      display: flex;
      flex-direction: column;

      .disagree-button {
        align-items: center;
        transition: color 80ms linear;
        color: rgba(255,255,255,0.18);
        font-weight: 900;
        letter-spacing: 0.2px;
        @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
        screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
          height: 24px;
          line-height: 24px;
          font-size: 10px;
          letter-spacing: 0.2px;
          padding-left: 6px;
          padding-right: 6px;
        }
        @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
        screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
          height: 28px;
          line-height: 28px;
          font-size: 12px;
          padding-left: 7px;
          padding-right: 7px;
          letter-spacing: 0.24px;
        }
        @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
        screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
          height: 39px;
          line-height: 39px;
          font-size: 17px;
          padding-left: 10px;
          padding-right: 10px;
          letter-spacing: 0.34px;
          line-height: 17px;
        }
        &:hover {
          cursor: pointer;
          color: rgba(255,255,255,0.5);
        }
        &:active {
          color: rgba(0,0,0,0.2);
        }
      }
    }
    .hover {
      cursor: pointer;
      background-image: none;
      background-color: rgba(255,255,255,0.2);
    }
    .agree-button {
      transition: background-color 100ms linear, background-image 100ms linear;
      background-color: rgba(255,255,255,0);
      text-align: center;
      vertical-align: middle;
      color: rgba(255,255,255,0.5);
      font-weight: 900;
      letter-spacing: 0.2px;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        height: 24px;
        line-height: 24px;
        border-radius: 11px;
        background-image: radial-gradient(
          60% 134%,
          rgba(255,255,255,0.09) 44%,
          rgba(255,255,255,0.05) 100%
        );

        backdrop-filter: blur(3px);
        font-size: 10px;
        letter-spacing: 0.2px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        height: 28px;
        line-height: 28px;
        border-radius: 13.2px;
        background-image: radial-gradient(
          60% 134%,
          rgba(255,255,255,0.09) 44%,
          rgba(255,255,255,0.05) 100%
        );

        backdrop-filter: blur(3px);
        font-size: 12px;
        letter-spacing: 0.24px;
        text-align: center;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        height: 39px;
        line-height: 39px;
        border-radius: 18.5px;
        background-image: radial-gradient(
          60% 134%,
          rgba(255,255,255,0.09) 44%,
          rgba(255,255,255,0.05) 100%
        );

        backdrop-filter: blur(5px);
        font-size: 17px;
        letter-spacing: 0.34px;
        text-align: center;
      }
      &:active {
        background-image: none;
        background-color: rgba(0,0,0,0.2);
      }
    }
  }
}
</style>
