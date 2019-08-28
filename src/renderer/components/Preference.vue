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
          @click.native="handleClose"
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
import electron from 'electron';
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
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
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
      this.$router.push({ name: panel });
    },
  },
};
</script>

<style scoped lang="scss">
.preference {
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

      .titlebar__button {
        margin: 0px 2px 2px 0px;
        width: 45px;
        height: 28px;
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
    background-color: #39383F;
  }

  &__tab {
    cursor: pointer;
    -webkit-app-region: no-drag;
    font-family: $font-semibold;
    font-size: 14px;
    padding-left: 15px;
    letter-spacing: 0;
    line-height: 42px;
    color: rgba(255,255,255,0.3);
    border-left: 1px solid rgba(0,0,0,0);
    background-color: rgba(255,255,255,0);
    transition: background-color 200ms;
    &:hover {
      background-color: rgba(255,255,255,0.03);
    }

    &--selected {
      color: rgba(255,255,255,1);
      border-left: 1px solid white;
      background-image: linear-gradient(
        99deg,
        rgba(243,243,243,0.15) 0%,
        rgba(255,255,255,0.0675) 81%
      );
      &:hover {
        background-color: rgba(255,255,255,0);
      }
    }
  }

  &__tabpanel {
    width: 430px;
    background-color: #444349;
  }

  &__tabcontent {
    padding: 32px 32px;
  }
}
</style>
