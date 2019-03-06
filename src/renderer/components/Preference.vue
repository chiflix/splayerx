<template>
  <div class="preference">
    <div class="left">
      <div class="mac-icons no-drag"
        v-if="isDarwin"
        @mouseover="state = 'hover'"
        @mouseout="state = 'default'">
        <Icon class="title-button"
              type="titleBarClose"
              :state="state"
              @click.native="handleClose"/>
        <Icon class="title-button-disable" type="titleBarExitFull"/>
        <Icon class="title-button-disable" type="titleBarFull"/>
      </div>
      <div class="preferenceTitle"
          :class="currentPreference === 'General' ? 'chosen' : ''"
          @mouseup="handleMouseup('General')">{{ $t('preferences.general.generalSetting') }}</div>
      <div class="preferenceTitle"
          :class="currentPreference === 'Privacy' ? 'chosen' : ''"
          @mouseup="handleMouseup('Privacy')">{{ $t('preferences.privacy.privacySetting') }}</div>
    </div>
    <div class="right">
      <div class="win-icons no-drag"
        v-if="!isDarwin"
        @mouseover="state = 'hover'"
        @mouseout="state = 'default'">
        <Icon class="title-button-disable"
              type="titleBarWinExitFull"/>
        <Icon class="title-button-disable" type="titleBarWinFull"/>
        <Icon class="title-button" type="titleBarWinClose" @click.native="handleClose"/>
      </div>
      <component :is="currentPreference"
      @move-stoped="isMoved = false"
      :mouseDown="mouseDown" :isMoved="isMoved"/>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';
import General from './Preferences/General.vue';
import Privacy from './Preferences/Privacy.vue';

export default {
  name: 'Preference',
  components: {
    Icon,
    General,
    Privacy,
  },
  data() {
    return {
      state: 'default',
      currentPreference: 'General',
      mouseDown: false,
      isMoved: false,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  methods: {
    // Methods to handle window behavior
    handleClose() {
      electron.remote.getCurrentWindow().close();
    },
    mainDispatchProxy(actionType, actionPayload) {
      this.$store.dispatch(actionType, actionPayload);
    },
    handleMouseup(panel) {
      this.currentPreference = panel;
    },
  },
  created() {
    electron.ipcRenderer.on('preferenceDispatch', (event, actionType, actionPayload) => {
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
  beforeDestroy() {
    window.onmousedown = null;
    window.onmousemove = null;
    window.onmouseup = null;
  },
};
</script>

<style scoped lang="scss">
.preference {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  .win-icons {
    display: flex;
    flex-wrap: nowrap;
    position: fixed;
    top: 0;
    right: 0;
    .title-button {
      margin: 0px 2px 2px 0px;
      width: 45px;
      height: 28px;
      background-color: rgba(255,255,255,0);
      transition: background-color 200ms;
      &:hover {
        background-color: rgba(221, 221, 221, 0.2);
      }
      &:active {
        background-color: rgba(221, 221, 221, 0.5);
      }
    }
    .title-button-disable {
      pointer-events: none;
      opacity: 0.25;
    }
  }
  .mac-icons {
    margin-top: 12px;
    margin-left: 12px;
    margin-bottom: 18px;
    width: fit-content;
    display: flex;
    flex-wrap: nowrap;
    .title-button {
      width: 12px;
      height: 12px;
      margin-right: 8px;
      background-repeat: no-repeat;
      -webkit-app-region: no-drag;
      border-radius: 100%;
    }
    .title-button-disable {
      pointer-events: none;
      opacity: 0.25;
    }
  }
  .left {
    flex-basis: 112px;
    height: 100%;
    background-image: linear-gradient(-28deg, rgba(65,65,65,0.85) 0%, rgba(84,84,84,0.85) 47%, rgba(123,123,123,0.85) 100%);
    .preferenceTitle {
      cursor: pointer;
      -webkit-app-region: no-drag;
      border-left: 1px solid rgba(0,0,0,0);
      padding-left: 15px;
      padding-top: 13px;
      padding-bottom: 13px;

      font-family: $font-semibold;
      font-size: 14px;
      color: rgba(255,255,255,0.3);
      letter-spacing: 0;
      line-height: 16px;
    }
    .chosen {
      border-left: 1px solid white;
      color: rgba(255,255,255,1);
      background-image: linear-gradient(99deg, rgba(243,243,243,0.15) 0%, rgba(255,255,255,0.0675) 81%);
    }
  }
  .right {
    flex-basis: 428px;
    background-image: linear-gradient(-28deg, rgba(65,65,65,0.97) 0%, rgba(84,84,84,0.97) 47%, rgba(123,123,123,0.97) 100%);
  }
}
</style>
