<template>
  <div class="privacy">
    <BaseCheckBox v-model="incognitoMode">
      {{ $t('preferences.privacy.incognitoMode') }}
    </BaseCheckBox>
    <div class="settingItem__description">
      {{ $t("preferences.privacy.incognitoDescription") }}
    </div>
    <div
      class="settingItem--justify"
    >
      <div class="flex">
        <div class="settingItem__title">
          {{ $t("preferences.privacy.clearHistory") }}
        </div>
        <div class="settingItem__description">
          {{ $t("preferences.privacy.clearHistoryDescription") }}
        </div>
      </div>
      <div
        :class="{ 'button--mousedown': mousedown }"
        @mousedown="mousedownOnClearHistory"
        @mouseup="mouseupOnClearHistory"
        class="settingItem__input button no-drag"
      >
        <transition
          name="button"
          mode="out-in"
        >
          <div
            key=""
            v-if="!buttonState"
            class="button__text"
          >
            {{ $t("preferences.general.setButton") }}
          </div>
          <div
            v-else
            :key="buttonState"
            class="button__result"
          >
            <Icon
              :type="buttonState"
              :class="buttonState"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'Privacy',
  components: {
    BaseCheckBox,
    Icon,
  },
  data() {
    return {
      mousedown: false,
      buttonState: '',
      buttonTimeoutId: NaN,
    };
  },
  computed: {
    isMas() {
      return !!process.mas;
    },
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    incognitoMode: {
      get() {
        return this.$store.getters.incognitoMode;
      },
      set(val: boolean) {
        this.$store.dispatch('incognitoMode', val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
  },
  methods: {
    mousedownOnClearHistory() {
      this.mousedown = true;
      document.addEventListener('mouseup', this.mouseupOnOther, { once: true });
    },
    mouseupOnClearHistory() {
      electron.ipcRenderer.send('clear-history');
      this.buttonState = 'success';
      clearTimeout(this.buttonTimeoutId);
      this.buttonTimeoutId = setTimeout(() => {
        this.buttonState = '';
      }, 1500);
      this.mousedown = false;
    },
    mouseupOnOther() {
      this.mousedown = false;
    },
  },
};
</script>
<style lang="scss" scoped>
.privacy {
  .checkbox:nth-of-type(1) {
    margin-top: 0;
  }
  .settingItem {
    margin-top: 30px;
    &__title {
      font-family: $font-medium;
      font-size: 14px;
      color: rgba(255,255,255,0.7);
    }

    &__description {
      font-family: $font-medium;
      font-size: 12px;
      color: rgba(255,255,255,0.25);
      margin-top: 7px;
    }

    &__input {
      -webkit-app-region: no-drag;
      cursor: pointer;
      font-family: $font-semibold;
      font-size: 11px;
      color: rgba(255,255,255,.7);
      text-align: center;
      border-radius: 2px;
      border: 1px solid rgba(255,255,255,0.1);
      background-color: rgba(255,255,255,0.03);
      transition: all 200ms;

      &:not(.disabled):hover {
        border: 1px solid rgba(255,255,255,0.2);
        background-color: rgba(255,255,255,0.08);
      }
      &.disabled {
        cursor: default;
      }
    }

    &--justify {
      @extend .settingItem;
      display: flex;
      justify-content: space-between;
    }
  }
  .button {
    box-sizing: border-box;
    align-self: center;
    width: 61px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    .button-enter, .button-leave-to {
      opacity: 0;
    }
    .button-enter-active {
      transition: opacity 200ms ease-in;
    }
    .button-leave-active {
      transition: opacity 200ms ease-in;
    }
    &__text {
      font-family: $font-medium;
      font-size: 11px;
      color: rgba(255,255,255,.7);
      letter-spacing: 0;
      text-align: center;
      line-height: 26px;
    }
    &__result {
      width: 15px;
      height: 15px;
    }
    &--mousedown {
      transition: opacity 50ms ease-in;
      opacity: 0.5;
    }
  }
}
</style>
