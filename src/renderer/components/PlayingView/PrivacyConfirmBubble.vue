<template>
<transition name="bubble" mode="out-in">
<div
  class="privacy-bubble"
  :key="state">
  <div class="plane-background">
    <div class="plane">
      <div :class="{ 'content-en': $i18n.locale === 'en', 'content': $i18n.locale !== 'en' }">
        <div class="info">
          {{ partOne }}
          <span class="underline"
            @mouseup.stop="underlineMouseup"
          >{{ underlinedContent }}</span>
          {{ partTwo }}
        </div>
        <div class="button"
          :class="{
            hover: hovered,
          }"
          @mouseover.stop="hovered = true"
          @mouseout.stop="hovered = false"
          @mouseup.stop="handleCloseMouseup">
          <div class="button-info">{{ button }}</div>
        </div> 
      </div>
    </div>
  </div>
</div>
</transition>
</template>
<script>
import { mapGetters } from 'vuex';
import asyncStorage from '@/helpers/asyncStorage';
export default {
  name: 'privacy-bubble',
  data() {
    return {
      state: 1,
      hovered: false,
    };
  },
  methods: {
    handleCloseMouseup() {
      if (this.state === 1) {
        asyncStorage.set('privacy-preference', { privacyAgreement: true });
        this.$emit('close-privacy-bubble');
      } else {
        this.state = 1;
      }
    },
    underlineMouseup() {
      if (this.state === 1) {
        this.state = 2;
      } else {
        asyncStorage.set('privacy-preference', { privacyAgreement: false });
        this.$emit('close-privacy-bubble');
      }
    },
  },
  computed: {
    ...mapGetters(['nextVideo', 'finalPartTime', 'isFolderList', 'currentTime', 'duration']),
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
  mounted() {
    this.$electron.remote.app.getLocale();
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
.privacy-bubble {
  .plane-background {
    background-color: rgba(0,0,0,0.20);
    backdrop-filter: blur(9.6px);
    box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);

    @media screen and (min-width: 513px) and (max-width: 854px) {
      width: 296px;
      border-radius: 7px;
      clip-path: inset(0px round 7px);
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      width: 355px;
      border-radius: 8.4px;
      clip-path: inset(0px round 8.4px);
    }
    @media screen and (min-width: 1921px) {
      width: 497px;
      border-radius: 11.76px;
      clip-path: inset(0px round 11.76px);
    }
  }
  .plane {
    border-style: solid;
    border-width: 0.5px;
    border-color: rgba(255,255,255,0.1);
    width: 100%;
    background-color: rgba(255,255,255,0.20);

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
      justify-content: space-between;
      align-items: center;
      width: 100%;

      @media screen and (min-width: 513px) and (max-width: 854px) {
        min-height: 54px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        min-height: 62px;
      }
      @media screen and (min-width: 1921px) {
        min-height: 87px;
      }
      .info {
        color: rgba(255,255,255,0.7);
        height: min-content;
        font-weight: 500;
        @media screen and (min-width: 513px) and (max-width: 854px) {
          margin-left: 18px;
          width: 208px;

          font-size: 10px;
          letter-spacing: 0.2px;
          line-height: 15px;
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
          margin-left: 19px;
          width: 250px;

          font-size: 12px;
          letter-spacing: 0.24px;
          line-height: 18px;
        }
        @media screen and (min-width: 1921px) {
          margin-left: 26px;
          width: 350px;

          font-size: 17px;
          letter-spacing: 0.34px;
          line-height: 25.2px;
        }
        .underline {
          text-decoration: underline;
          &:hover {
            cursor: pointer;
          }
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
}
.hover {
  background-image: none;
  background-color: rgba(255,255,255,0.2);
}
.button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media screen and (min-width: 513px) and (max-width: 854px) {
    height: 24px;
    margin-right: 16px;
    border-radius: 11px;
    background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

    backdrop-filter: blur(3px);
    clip-path: inset(0px round 11px);
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    height: 28px;
    margin-right: 20px;
    border-radius: 13.2px;
    background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

    backdrop-filter: blur(3px);
    clip-path: inset(0px round 13.2px);
  }
  @media screen and (min-width: 1921px) {
    height: 39px;
    margin-right: 28px;
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
.content-en {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  @media screen and (min-width: 513px) and (max-width: 854px) {
    min-height: 67px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    min-height: 80px;
  }
  @media screen and (min-width: 1921px) {
    min-height: 112px;
  }
  .info {
    color: rgba(255,255,255,0.7);
    height: min-content;
    font-weight: 500;
    @media screen and (min-width: 513px) and (max-width: 854px) {
      margin-left: 18px;
      width: 206px;

      font-size: 11px;
      line-height: 15px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      margin-left: 19px;
      width: 247px;

      font-size: 13.2px;
      line-height: 18px;
    }
    @media screen and (min-width: 1921px) {
      margin-left: 26px;
      margin-right: 25px;
      width: 345px;

      font-size: 18.48px;
      line-height: 25.2px;
    }
    .underline {
      text-decoration: underline;
      &:hover {
        cursor: pointer;
      }
    }
  }
  .button-info {
    color: rgba(255,255,255,0.5);
    font-weight: 700;
    @media screen and (min-width: 513px) and (max-width: 854px) {
      padding-left: 12px;
      padding-right: 12px;

      font-size: 11px;
      letter-spacing: 0.2px;
      text-align: center;
      line-height: 10px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      padding-left: 14px;
      padding-right: 14px;

      font-size: 13.2px;
      letter-spacing: 0.26px;
      text-align: center;
      line-height: 12px;          
    }
    @media screen and (min-width: 1921px) {
      padding-left: 20px;
      padding-right: 20px;

      font-size: 17px;
      letter-spacing: 1px;
      text-align: center;
      line-height: 17px;
    }
  }
}
</style>