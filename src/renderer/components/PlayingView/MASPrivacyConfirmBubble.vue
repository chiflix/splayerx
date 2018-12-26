<template>
<transition name="bubble" mode="out-in">
<div
  class="privacy-bubble">
  <div class="plane-background">
    <div class="plane">
      <div class="content">
        <div :class="infoCSS">
          {{ content }}
        </div>
        <div :class="$i18n.locale === 'en' ? 'en-buttons' : 'buttons'">
          <div class="agree-button"
            :class="{
              hover: agreeHovered,
            }"
            @mouseover.stop="agreeHovered = true"
            @mouseout.stop="agreeHovered = false"
            @mouseup.stop="handleAgreeMouseup">
            <div class="button-info">{{ agreeButton }}</div>
          </div>
          <div class="disagree-button"
            @mouseup.stop="handleDisagreeMouseup">
            {{ disagreeButton }}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</transition>
</template>
<script>
export default {
  name: 'privacy-bubble',
  data() {
    return {
      /*
        use class transition other than native :hover
        because of unknown flashing bug
       */
      agreeHovered: false,
    };
  },
  methods: {
    handleAgreeMouseup() {
      this.$store.dispatch('agreeOnPrivacyPolicy');
      this.$emit('close-privacy-bubble');
    },
    handleDisagreeMouseup() {
      this.$store.dispatch('disagreeOnPrivacyPolicy');
      this.$emit('close-privacy-bubble');
    },
  },
  computed: {
    infoCSS() {
      if (this.$i18n.locale === 'en') {
        return 'info-en-state-1';
      }
      return 'info-state-1';
    },
    content() {
      return this.$t('privacyBubble.masVersion.content');
    },
    agreeButton() {
      return this.$t('privacyBubble.masVersion.agree');
    },
    disagreeButton() {
      return this.$t('privacyBubble.masVersion.disagree');
    },
  },
};
</script>
<style lang="scss" scoped>
.bubble-enter-active, .bubble-leave-active {
  transition: transform 400ms cubic-bezier(0.17, 0.67, 0.17, 0.98);
}
.bubble-enter, .bubble-leave-to {
  @media screen and (min-width: 513px) and (max-width: 854px) {
    transform: translateX(350px);
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    transform: translateX(420px);
  }
  @media screen and (min-width: 1921px) {
    transform: translateX(593px);
  }
}
.plane-background {
  background-color: rgba(0,0,0,0.1);
  backdrop-filter: blur(9.6px);
  box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);
  @media screen and (max-width: 512px) {
    display: none;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    border-radius: 7px;
    clip-path: inset(0px round 7px);
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    border-radius: 8.4px;
    clip-path: inset(0px round 8.4px);
  }
  @media screen and (min-width: 1921px) {
    border-radius: 11.76px;
    clip-path: inset(0px round 11.76px);
  }
}
.plane {
  border-style: solid;
  border-width: 0.5px;
  border-color: rgba(255,255,255,0.1);

  @media screen and (min-width: 513px) and (max-width: 854px) {
    border-radius: 7px;
    clip-path: inset(0px round 7px);
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    border-radius: 8.4px;
    clip-path: inset(0px round 8.4px);
  }
  @media screen and (min-width: 1921px) {
    border-radius: 11.76px;
    clip-path: inset(0px round 11.76px);
  }
  .content {
    display: flex;
    flex-direction: row;
    align-items: flex-end;

    @media screen and (min-width: 513px) and (max-width: 854px) {
      min-height: 54px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      min-height: 62px;
    }
    @media screen and (min-width: 1921px) {
      min-height: 87px;
    }
    .info-state-1 {
      color: rgba(255,255,255,0.7);
      height: fit-content;
      font-weight: 500;
      @media screen and (min-width: 513px) and (max-width: 854px) {
        margin-top: 15px;
        margin-left: 18px;
        margin-right: 5px;
        margin-bottom: 15px;
        width: 245px;

        font-size: 11px;
        letter-spacing: 0.2px;
        line-height: 15px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        margin-top: 17px;
        margin-left: 19px;
        margin-right: 8px;
        margin-bottom: 17px;
        width: 314px;

        font-size: 13px;
        letter-spacing: 0.24px;
        line-height: 18px;
      }
      @media screen and (min-width: 1921px) {
        margin-top: 25px;
        margin-left: 26px;
        margin-right: 15px;
        margin-bottom: 25px;
        width: 438px;

        font-size: 18px;
        letter-spacing: 0.6px;
        line-height: 25.2px;
      }
    }
    .info-en-state-1 {
      color: rgba(255,255,255,0.7);
      height: min-content;
      font-weight: 500;
      @media screen and (min-width: 513px) and (max-width: 854px) {
        margin-top: 12px;
        margin-left: 18px;
        margin-right: 12px;
        margin-bottom: 12px;
        width: 317px;

        font-size: 11px;
        line-height: 15px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        margin-top: 14px;
        margin-left: 19px;
        margin-right: 15px;
        margin-bottom: 14px;
        width: 367px;

        font-size: 13.2px;
        line-height: 18px;
      }
      @media screen and (min-width: 1921px) {
        margin-top: 20px;
        margin-left: 29px;
        margin-right: 16px;
        margin-bottom: 20px;
        width: 500px;

        font-size: 18.48px;
        line-height: 25.2px;
      }
    }
    .en-buttons {
      display: flex;
      flex-direction: column;
      @media screen and (min-width: 513px) and (max-width: 854px) {
        margin-right: 16px;
        margin-bottom: 21px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        margin-right: 20px;
        margin-bottom: 25px;
      }
      @media screen and (min-width: 1921px) {
        margin-right: 26px;
        margin-bottom: 37px;
      }
      .disagree-button {
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: color 80ms linear;
        color: rgba(255,255,255,0.18);
        font-weight: 700;
        letter-spacing: 0.2px;
        @media screen and (min-width: 513px) and (max-width: 854px) {
          font-size: 10px;
          letter-spacing: 0.2px;
          margin-top: 8px;
          padding-left: 10px;
          line-height: 10px;
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
          font-size: 12px;
          margin-top: 9px;
          padding-left: 13px;
          letter-spacing: 0.24px;
          line-height: 12px;
        }
        @media screen and (min-width: 1921px) {
          font-size: 17px;
          margin-top: 12px;
          padding-left: 18px;
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
    .buttons {
      display: flex;
      flex-direction: column;
      @media screen and (min-width: 513px) and (max-width: 854px) {
        margin-right: 12px;
        margin-bottom: 10px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        margin-right: 14px;
        margin-bottom: 12px;
      }
      @media screen and (min-width: 1921px) {
        margin-right: 28px;
        margin-bottom: 20px;
      }
      .disagree-button {
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: color 80ms linear;
        color: rgba(255,255,255,0.18);
        font-weight: 700;
        letter-spacing: 0.2px;
        @media screen and (min-width: 513px) and (max-width: 854px) {
          height: 24px;
          font-size: 10px;
          letter-spacing: 0.2px;
          padding-left: 12px;
          line-height: 10px;
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
          height: 28px;
          font-size: 12px;
          padding-left: 14px;
          letter-spacing: 0.24px;
          line-height: 12px;
        }
        @media screen and (min-width: 1921px) {
          height: 39px;
          font-size: 17px;
          padding-left: 20px;
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 100ms linear;
      @media screen and (min-width: 513px) and (max-width: 854px) {
        height: 24px;
        border-radius: 11px;
        background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

        backdrop-filter: blur(3px);
        clip-path: inset(0px round 11px);
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        height: 28px;
        border-radius: 13.2px;
        background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

        backdrop-filter: blur(3px);
        clip-path: inset(0px round 13.2px);
      }
      @media screen and (min-width: 1921px) {
        height: 39px;
        border-radius: 18.5px;
        background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

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
      @media screen and (min-width: 513px) and (max-width: 854px) {
        padding-left: 12px;
        padding-right: 12px;

        font-size: 10px;
        letter-spacing: 0.2px;
        line-height: 10px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        padding-left: 14px;
        padding-right: 14px;

        font-size: 12px;
        letter-spacing: 0.24px;
        text-align: center;
        line-height: 12px;
      }
      @media screen and (min-width: 1921px) {
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
