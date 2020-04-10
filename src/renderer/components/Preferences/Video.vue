<template>
  <div class="video">
    <BaseCheckBox
      v-model="hwhevc"
      v-if="isDarwin"
    >
      {{ $t('preferences.general.HD') }}
    </BaseCheckBox>
    <div
      v-if="isDarwin"
      v-html="$t('preferences.general.HDDescription', { link: sendLink })"
      @click="handleSend"
      class="settingItem__description"
    />
  </div>
</template>

<script>
import electron from 'electron';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'Video',
  components: {
    BaseCheckBox,
  },
  props: {
    mouseDown: Boolean,
    isMoved: Boolean,
  },
  data() {
    return {
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    isMas() {
      return !!process.mas;
    },
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    sendLink() {
      return `<span class="send">${this.$t('preferences.general.HDLink')}</span>`;
    },
    hwhevc: {
      get() {
        return this.$store.getters.hwhevc;
      },
      set(val) {
        this.$store.dispatch('hwhevc', val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
  },
  methods: {
    handleSend(e) {
      const path = e.path || (e.composedPath && e.composedPath());
      const origin = path.find(e => e.tagName === 'SPAN' && e.className.includes('send'));
      if (origin) {
        // call shell
        electron.shell.openExternalSync('https://feedback.splayer.org/');
      }
    },
  },
};
</script>
<style scoped lang="scss">
.video {
  .settingItem {
    margin-bottom: 30px;
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
      button {
        outline: none;
        &:active {
          opacity: 0.5;
        }
      }
    }
  }
}
</style>
<style lang="scss">
span.send {
  text-decoration: underline;
  text-underline-position: under;
  cursor: pointer;
  -webkit-app-region: no-drag;
  &:hover {
    color: rgba(255,255,255,.7);
  }
}
</style>
