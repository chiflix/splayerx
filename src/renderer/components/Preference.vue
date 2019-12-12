<template>
  <div class="preference tablist">
    <div class="tablist__tabs">
      <div
        v-if="isDarwin"
        @mouseover="state = 'hover'"
        @mouseout="state = 'default'"
        class="titlebar titlebar--mac no-drag"
      >
        <Icon
          :state="state"
          @mouseup.native="handleClose"
          class="titlebar__button"
          type="titleBarClose"
        />
        <Icon
          class="titlebar__button--disable"
          type="titleBarExitFull"
        />
        <Icon
          class="titlebar__button--disable"
          type="titleBarFull"
        />
      </div>
      <div
        :class="$route.name === 'General' ? 'tablist__tab--selected' : ''"
        :style="{
          marginTop: !isDarwin ? '10px' : '',
        }"
        @mouseup="handleMouseup('General')"
        class="tablist__tab"
      >
        {{ $t('preferences.general.generalSetting') }}
      </div>
      <div
        :class="$route.name === 'Translate' ? 'tablist__tab--selected' : ''"
        @mouseup="handleMouseup('Translate')"
        class="tablist__tab"
      >
        {{ $t('preferences.translate.translateSetting') }}
      </div>
      <div
        :class="$route.name === 'Privacy' ? 'tablist__tab--selected' : ''"
        @mouseup="handleMouseup('Privacy')"
        class="tablist__tab"
      >
        {{ $t('preferences.privacy.privacySetting') }}
      </div>
      <div
        :class="$route.name === 'Account' ? 'tablist__tab--selected' : ''"
        @mouseup="handleMouseup('Account')"
        class="tablist__tab"
      >
        {{ $t('preferences.account.accountSetting') }}
      </div>
      <div
        v-if="!isAPPX"
        :class="$route.name === 'Premium' ? 'tablist__tab--selected' : ''"
        @mouseup="handleMouseup('Premium')"
        class="tablist__tab"
      >
        {{ $t('preferences.premium.premiumSetting') }}
      </div>
    </div>
    <div class="tablist__tabpanel">
      <div
        v-if="!isDarwin"
        @mouseover="state = 'hover'"
        @mouseout="state = 'default'"
        class="titlebar titlebar--win no-drag"
      >
        <Icon
          class="titlebar__button--disable"
          type="titleBarWinExitFull"
        />
        <Icon
          class="titlebar__button--disable"
          type="titleBarWinFull"
        />
        <Icon
          @click.native="handleClose"
          class="titlebar__button"
          type="titleBarWinClose"
        />
      </div>
      <div class="tablist__tabcontent">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import electron, { ipcRenderer } from 'electron';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'Preference',
  components: {
    Icon,
  },
  data() {
    return {
      state: 'default',
      mouseDown: false,
      isMoved: false,
      disableRoute: false,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    isAPPX() {
      return process.windowsStore;
    },
    displayLanguage: {
      get() {
        return this.$store.getters.displayLanguage;
      },
    },
  },
  watch: {
    displayLanguage(val: string) {
      if (val) this.$i18n.locale = val;
    },
  },
  created() {
    electron.ipcRenderer.on('preferenceDispatch', (event: Event, actionType: string, actionPayload: string) => {
      this.mainDispatchProxy(actionType, actionPayload);
    });
    window.onmousedown = () => {
      this.mouseDown = true;
      this.isMoved = false;
    };
    window.onmousemove = () => {
      if (this.mouseDown) this.isMoved = true;
    };
    window.onmouseup = () => {
      this.mouseDown = false;
    };
  },
  mounted() {
    document.title = 'Preference SPlayer';
    document.body.classList.add('drag');
    ipcRenderer.on('add-payment', () => {
      this.disableRoute = true;
    });
    ipcRenderer.on('close-payment', () => {
      this.disableRoute = false;
    });
  },
  beforeDestroy() {
    window.onmousedown = null;
    window.onmousemove = null;
    window.onmouseup = null;
  },
  methods: {
    // Methods to handle window behavior
    handleClose() {
      electron.remote.getCurrentWindow().close();
    },
    mainDispatchProxy(actionType: string, actionPayload: string) {
      this.$store.dispatch(actionType, actionPayload);
    },
    handleMouseup(panel: string) {
      if (!this.disableRoute) {
        this.$router.push({ name: panel });
      }
    },
  },
};
</script>

<style scoped lang="scss">
.preference {
  background-color: #3B3B41;
  .titlebar {
    display: flex;
    flex-wrap: nowrap;

    &--mac {
      margin-top: 12px;
      margin-left: 12px;
      margin-bottom: 18px;
      width: fit-content;

      .titlebar__button {
        margin-right: 8px;
        width: 12px;
        height: 12px;
        background-repeat: no-repeat;
        -webkit-app-region: no-drag;
        border-radius: 100%;

        &--disable {
          pointer-events: none;
          opacity: 0.25;
        }
      }
    }

    &--win {
      top: 0;
      right: 0;
      position: fixed;
      z-index: 2;
      .titlebar__button {
        width: 45px;
        height: 36px;
        background-color: rgba(255,255,255,0);
        transition: background-color 200ms;

        &--disable {
          pointer-events: none;
          opacity: 0.25;
        }
        &:hover {
          background-color: rgba(221, 221, 221, 0.2);
        }
        &:active {
          background-color: rgba(221, 221, 221, 0.5);
        }
      }
    }
  }
}
.tablist {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;

  &__tabs {
    width: 110px;
    height: 100%;
    box-sizing: border-box;
    background-color: #3B3B41;
    border-right: 1px solid rgba(255,255,255,.03);
  }

  &__tab {
    cursor: pointer;
    -webkit-app-region: no-drag;
    font-family: $font-semibold;
    font-size: 14px;
    letter-spacing: 0;
    line-height: 42px;
    text-align: center;
    color: rgba(255,255,255,.25);
    margin: 5px 10px;
    background-color: rgba(83, 52, 52, 0);
    transition: background-color 200ms;
    border-radius: 50px;
    &:hover {
      color: rgba(255,255,255,.7);
    }

    &--selected {
      color: rgba(255,255,255,.7);
      background-color: rgba(0,0,0,0.12);
      &:hover {
        color: rgba(255,255,255,.7);
      }
    }
  }

  &__tabpanel {
    width: 430px;
    background-color: #3B3B41;
  }

  &__tabcontent {
    padding: 32px 32px;
    position: relative;
  }
}
</style>
<style lang="scss">

.fade-in {
  visibility: visible;
  opacity: 1;
  transition: opacity 100ms ease-in;
}
.fade-out {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 300ms, opacity 300ms ease-out;
}
</style>
