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
        @mousedown="mousedownOnClearHistory"
        class="settingItem__input button no-drag"
      >
        <div
          :class="{ 'button--mousedown': mousedown }"
          class="button__text"
        >
          {{ $t("preferences.general.setButton") }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import electron from 'electron';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'Privacy',
  components: {
    BaseCheckBox,
  },
  data() {
    return {
      mousedown: false,
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
      document.addEventListener('mouseup', this.mouseupOnClearHistory, { once: true });
    },
    mouseupOnClearHistory() {
      this.mousedown = false;
      electron.ipcRenderer.send('clear-history');
    },
  },
};
</script>
<style lang="scss" scoped>
.privacy {
  .title {
    font-family: $font-medium;
    font-size: 13px;
    color: rgba(255,255,255,0.7);
  }
  .checkbox:nth-of-type(1) {
    margin-top: 0;
  }
  .settingItem {
    margin-top: 30px;
    &__title {
      font-family: $font-medium;
      font-size: 13px;
      color: rgba(255,255,255,0.7);
    }

    &__description {
      font-family: $font-medium;
      font-size: 11px;
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
