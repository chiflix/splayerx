<template>
<transition name="bubble" mode="out-in">
<div
  class="privacy-bubble"
  :key="state">
  <div class="plane-background">
    <div class="plane">
      <div class="content"
        :style="{
          minHeight: $i18n.locale !== 'en' ? '54px' : '67px',
        }">
        <div class="info"
          :style="{
            letterSpacing: $i18n.locale !== 'en' ? '0.2px' : '0',
            fontWeight: $i18n.locale !== 'en' ? '500' : '600',
            fontSize: $i18n.locale !== 'en' ? '10px' : '11px',
          }">{{ partOne }}
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
  transform: translateX(403px);
}
.privacy-bubble {
  .plane-background {
    background-color: rgba(0,0,0,0.20);
    backdrop-filter: blur(9.6px);
    clip-path: inset(0px round 8px);
    box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);

    border-radius: 8px;
    @media screen and (min-width: 513px) and (max-width: 854px) {
      height: 70px;
      width: 340px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      width: 296px;
    }
    @media screen and (min-width: 1921px) {
      height: 118px;
      width: 571px;
    }
  }
  .plane {
    border-style: solid;
    border-width: 0.5px;
    border-color: rgba(255,255,255,0.2);
    width: 100%;

    clip-path: inset(0px round 8px);

    background-color: rgba(255,255,255,0.20);
    border-radius: 8px;

    @media screen and (min-width: 513px) and (max-width: 854px) {
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
    }
    @media screen and (min-width: 1921px) {
    }
    .content {
      display: flex;
      align-items: center;
      width: 100%;
      .info {
        color: rgba(255,255,255,0.7);
        height: min-content;

        @media screen and (min-width: 513px) and (max-width: 854px) {
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
          margin-left: 18px;

          width: 206px;
          line-height: 15px;
        }
        @media screen and (min-width: 1921px) {
        }
        .underline {
          text-decoration: underline;
          &:hover {
            cursor: pointer;
          }
        }
      }
      .hover {
        background-image: none;
        background-color: rgba(255,255,255,0.2);
      }
      .button {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        @media screen and (min-width: 513px) and (max-width: 854px) {
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
          height: 24px;
          margin-right: 16px;
          margin-left: 9px;
          border-radius: 11px;
          background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

          backdrop-filter: blur(3px);
          clip-path: inset(0px round 11px);
        }
        @media screen and (min-width: 1921px) {
        }
        &:active {
          background-image: none;
          background-color: rgba(0,0,0,0.2);
        }
        .button-info {
          opacity: 0.5;
          color: #FFFFFF;
          font-weight: 700;
          letter-spacing: 0.2px;
          @media screen and (min-width: 513px) and (max-width: 854px) {
          }
          @media screen and (min-width: 855px) and (max-width: 1920px) {
            padding-left: 12px;
            padding-right: 12px;
            line-height: 11px;
            font-size: 11px;            
          }
          @media screen and (min-width: 1921px) {
          }
        }
      }
    }
  }
}
</style>