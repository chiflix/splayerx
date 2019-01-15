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
        </Icon>
      </div>
      <div class="general">{{ $t('preferences.generalSetting') }}</div>
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
        </Icon>
      </div>
      <component :is="currentPreference"></component>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';
import General from './Preferences/General.vue';

export default {
  name: 'Preference',
  components: {
    Icon,
    General,
  },
  data() {
    return {
      state: 'default',
      currentPreference: 'General',
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
      console.log('sss');
      this.$store.dispatch(actionType, actionPayload);
    },
  },
  created() {
    electron.ipcRenderer.on('preferenceDispatch', (event, actionType, actionPayload) => {
      this.mainDispatchProxy(actionType, actionPayload);
    });
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
    flex-basis: 110px;
    height: 100%;
    background-image: linear-gradient(-28deg, rgba(65,65,65,0.85) 0%, rgba(84,84,84,0.85) 47%, rgba(123,123,123,0.85) 100%);
    .general {
      border-left: 1px solid white;
      margin-top: 18px;
      padding-left: 15px;
      padding-top: 13px;
      padding-bottom: 13px;

      font-family: PingFangSC-Semibold;
      font-size: 14px;
      color: #FFFFFF;
      letter-spacing: 0;
      line-height: 16px;

      background-image: linear-gradient(99deg, rgba(243,243,243,0.15) 0%, rgba(255,255,255,0.0675) 81%);
    }
  }
  .right {
    flex-basis: 400px;
    background-image: linear-gradient(-28deg, rgba(65,65,65,0.97) 0%, rgba(84,84,84,0.97) 47%, rgba(123,123,123,0.97) 100%);
  }
}
</style>
