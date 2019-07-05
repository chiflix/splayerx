<template>
  <transition
    name="bubble"
    mode="out-in"
  >
    <div
      :key="state"
      class="privacy-bubble"
    >
      <div
        :class="{ 'backdrop': useBlur }"
        class="plane-background"
      >
        <div class="plane">
          <div class="content">
            <p :class="infoCSS">
              {{ partOne }}<span
                @mouseup="underlineMouseup"
                class="underline"
              >{{ underlinedContent }}</span>{{ partTwo }}
            </p>
            <div
              :class="{
                hover: hovered,
              }"
              @mouseover.stop="hovered = true"
              @mouseout.stop="hovered = false"
              @mouseup="handleCloseMouseup"
              class="button"
            >
              <div class="button-info">
                {{ button }}
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
  },
  data() {
    return {
      state: 1,
      hovered: false,
    };
  },
  computed: {
    preferenceData() {
      return this.$store.getters.preferenceData;
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
    partOne() {
      if (this.state === 1) {
        return this.$t('privacyBubble.tryToDisable.partOne');
      }
      return this.$t('privacyBubble.confirmDisable.partOne');
    },
    partTwo() {
      if (this.state === 1) {
        return this.$t('privacyBubble.tryToDisable.partTwo');
      }
      return this.$t('privacyBubble.confirmDisable.partTwo');
    },
    underlinedContent() {
      if (this.state === 1) {
        return this.$t('privacyBubble.tryToDisable.underlinedContent');
      }
      return this.$t('privacyBubble.confirmDisable.underlinedContent');
    },
    button() {
      if (this.state === 1) {
        return this.$t('privacyBubble.tryToDisable.button');
      }
      return this.$t('privacyBubble.confirmDisable.button');
    },
  },
  methods: {
    handleCloseMouseup() {
      if (this.state === 1) {
        this.$store.dispatch('agreeOnPrivacyPolicy').then(() => {
          this.$electron.ipcRenderer.send('main-to-preference', this.preferenceData);
        });
        this.$bus.$emit('subtitle-refresh-continue', true);
        this.$emit('close-privacy-bubble');
      } else {
        this.state = 1;
      }
    },
    underlineMouseup() {
      if (this.state === 1) {
        this.state = 2;
      } else {
        this.$store.dispatch('disagreeOnPrivacyPolicy').then(() => {
          this.$electron.ipcRenderer.send('main-to-preference', this.preferenceData);
        });
        this.$bus.$emit('subtitle-refresh-continue', false);
        this.$emit('close-privacy-bubble');
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
.plane-background {
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
.backdrop {
  border-width: 0;
  background-image: none;
  background-color: rgba(0,0,0,0.1);
  backdrop-filter: blur(9.6px);
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
        background-image:
          radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

        backdrop-filter: blur(3px);
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        height: 28px;
        margin-right: 20px;
        border-radius: 13.2px;
        background-image:
          radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

        backdrop-filter: blur(3px);
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        height: 39px;
        margin-right: 28px;
        border-radius: 18.5px;
        background-image:
          radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

        backdrop-filter: blur(5px);
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
