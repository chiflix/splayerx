<template>
<div class="preference-setting">
  <div class="title">{{ $t("preferences.general.displayLanguage") }}</div>
  <div class="description">{{ $t("preferences.general.switchDisplayLanguages")}}</div>
  <div class="drop-down">
    <div class="no-drag" :class="showSelection ? 'drop-down-content' : 'drop-down-brief'"
      @mouseup.stop="showSelection = !showSelection">
      <div class="selected">{{ mapCode(displayLanguage) }}</div>
      <Icon type="rightArrow" :class="showSelection ? 'up-arrow' : 'down-arrow'"/>
      <div class="content" v-if="showSelection"
        @mouseup.stop="">
        <div class="selection"
          v-for="(language, index) in displayLanguages"
          :key="index"
          @mouseup.stop="handleSelection(language)">
          {{ mapCode(language) }}
        </div>
      </div>
    </div>
  </div>
  <div class="description-button">
    <div class="setting-content">
      <div class="setting-title">{{ $t("preferences.general.setDefault") }}</div>
      <div class="setting-description">{{ $t("preferences.general.setDefaultDescription") }}</div>
    </div>
    <div class="setting-button no-drag" ref="button1"
      @mousedown="mousedownOnSetDefault">
      <transition name="button" mode="out-in">
        <div key="" v-if="!defaultState" class="content">{{ $t("preferences.general.setButton") }}</div>
        <div :key="defaultState" v-else class="result"  :style="{ top: !isMac ? '2px' : '' }">
          <Icon :type="defaultState" :class="defaultState"/>
        </div>
      </transition>
    </div>
  </div>
  <div class="description-button" v-if="isMac">
    <div class="setting-content">
      <div class="setting-title">{{ $t("preferences.general.restoreSettings") }}</div>
      <div class="setting-description">{{ $t("preferences.general.restoreSettingsDescription") }}</div>
    </div>
    <div class="setting-button no-drag" ref="button2"
      @mousedown="mousedownOnRestore">
      <transition name="button" mode="out-in">
        <div :key="needToRelaunch" class="content" ref="restoreContent">{{ restoreContent }}</div>
      </transition>
    </div>
  </div>
  <div class="title other-title">{{ $t("preferences.general.others") }}</div>
  <BaseCheckBox v-if="isMac"
    :checkboxValue="reverseScrolling"
    @update:checkbox-value="reverseScrolling = $event">
    {{ $t('preferences.general.reverseScrolling') }}
  </BaseCheckBox>
  <BaseCheckBox
    :checkboxValue="deleteVideoHistoryOnExit"
    @update:checkbox-value="deleteVideoHistoryOnExit = $event">
    {{ $t('preferences.general.clearHistory') }}
  </BaseCheckBox>
</div>
</template>

<script>
import electron from 'electron';
import { setAsDefaultApp } from '@/../shared/system';
import Icon from '@/components/BaseIconContainer.vue';
import { codeToLanguageName } from '@/helpers/language';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'General',
  components: {
    BaseCheckBox,
    Icon,
  },
  props: ['mouseDown', 'isMoved'],
  data() {
    return {
      showSelection: false,
      isSettingDefault: false,
      isRestoring: false,
      defaultState: '',
      restoreState: '',
      defaultButtonTimeoutId: NaN,
      restoreButtonTimeoutId: NaN,
      needToRelaunch: false,
      restoreContent: '',
      languages: ['zhCN', 'zhTW', 'ja', 'ko', 'en', 'es', 'ar'],
    };
  },
  created() {
    electron.ipcRenderer.once('restore-state', (event, state) => {
      this.restoreContent = state ? this.$t('preferences.general.relaunch')
        : this.$t('preferences.general.setButton');
    });
  },
  watch: {
    displayLanguage(val) {
      if (val) this.$i18n.locale = val;
      electron.ipcRenderer.send('get-restore-state');
      electron.ipcRenderer.once('restore-state', (event, state) => {
        this.restoreContent = state ? this.$t('preferences.general.relaunch')
          : this.$t('preferences.general.setButton');
      });
    },
    mouseDown(val, oldVal) {
      if (!val && oldVal && !this.isMoved) {
        this.showSelection = false;
      } else if (!val && oldVal && this.isMoved) {
        this.$emit('move-stoped');
      }
    },
  },
  computed: {
    isMac() {
      return process.platform === 'darwin';
    },
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    reverseScrolling: {
      get() {
        return this.$store.getters.reverseScrolling;
      },
      set(val) {
        if (val) {
          this.$store.dispatch('reverseScrolling').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        } else {
          this.$store.dispatch('notReverseScrolling').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        }
      },
    },
    deleteVideoHistoryOnExit: {
      get() {
        return this.$store.getters.deleteVideoHistoryOnExit;
      },
      set(val) {
        if (val) {
          this.$store.dispatch('deleteVideoHistoryOnExit').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        } else {
          this.$store.dispatch('notDeleteVideoHistoryOnExit').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        }
      },
    },
    displayLanguage: {
      get() {
        return this.$store.getters.displayLanguage;
      },
      set(val) {
        this.$store.dispatch('displayLanguage', val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
    displayLanguages() {
      return this.languages.filter(language => language !== this.displayLanguage);
    },
  },
  methods: {
    mouseupOnOther() {
      if (!this.isSettingDefault) {
        this.$refs.button1.style.setProperty('background-color', '');
        this.$refs.button1.style.setProperty('opacity', '');
      }
      if (!this.isRestoring) {
        this.$refs.button2.style.setProperty('background-color', '');
        this.$refs.button2.style.setProperty('opacity', '');
      }
      document.removeEventListener('mouseup', this.mouseupOnOther);
      this.$refs.button1.removeEventListener('mouseup', this.setDefault);
      this.$refs.button2.removeEventListener('mouseup', this.restoreSettings);
    },
    mousedownOnSetDefault() {
      if (!this.isSettingDefault) {
        this.$refs.button1.style.setProperty('background-color', 'rgba(0,0,0,0.20)');
        this.$refs.button1.style.setProperty('opacity', '0.5');
        this.$refs.button1.addEventListener('mouseup', this.setDefault);
        document.addEventListener('mouseup', this.mouseupOnOther);
      }
    },
    mousedownOnRestore() {
      if (!this.isSettingDefault) {
        this.$refs.button2.style.setProperty('transition-delay', '');
        this.$refs.button2.style.setProperty('background-color', 'rgba(0,0,0,0.20)');
        this.$refs.button2.style.setProperty('opacity', '0.5');
        this.$refs.button2.addEventListener('mouseup', this.restoreSettings);
        document.addEventListener('mouseup', this.mouseupOnOther);
      }
    },
    async setDefault() {
      if (this.isSettingDefault) return;
      this.isSettingDefault = true;
      try {
        await setAsDefaultApp();
        // TODO: feedback
        clearTimeout(this.defaultButtonTimeoutId);
        this.defaultState = 'success';
        this.$refs.button1.style.setProperty('transition-delay', '350ms');
        this.$refs.button1.style.setProperty('background-color', '');
        this.$refs.button1.style.setProperty('opacity', '');
        this.defaultButtonTimeoutId = setTimeout(() => {
          this.defaultState = '';
          this.isSettingDefault = false;
          this.$refs.button1.style.setProperty('transition-delay', '');
        }, 1500);
      } catch (ex) {
        // TODO: feedback
        clearTimeout(this.defaultButtonTimeoutId);
        this.defaultState = 'failed';
        this.$refs.button1.style.setProperty('transition-delay', '350ms');
        this.$refs.button1.style.setProperty('background-color', '');
        this.$refs.button1.style.setProperty('opacity', '');
        this.defaultButtonTimeoutId = setTimeout(() => {
          this.defaultState = '';
          this.isSettingDefault = false;
          this.$refs.button1.style.setProperty('transition-delay', '');
        }, 1500);
      } finally {
        this.$refs.button1.removeEventListener('mouseup', this.setDefault);
      }
    },
    restoreSettings() {
      this.isRestoring = true;
      if (this.restoreContent === this.$t('preferences.general.setButton')) {
        electron.ipcRenderer.send('apply');
        this.needToRelaunch = true;
        this.restoreContent = this.$t('preferences.general.relaunch');
        this.$refs.button2.style.setProperty('transition-delay', '400ms');
        this.$refs.button2.style.setProperty('background-color', '');
        this.$refs.button2.style.setProperty('opacity', '');
        this.isRestoring = false;
        return;
      }
      electron.ipcRenderer.send('relaunch');
      this.isRestoring = false;
      this.$refs.button2.removeEventListener('mouseup', this.restoreSettings);
    },
    mapCode(code) {
      return codeToLanguageName(code);
    },
    handleSelection(language) {
      this.displayLanguage = language;
      this.showSelection = false;
    },
  },
};
</script>
<style scoped lang="scss">
$dropdown-height: 148px;
.preference-setting {
  box-sizing: border-box;
  padding-top: 37px;
  padding-left: 26px;
  width: 100%;
  height: 100%;
  .title {
    margin-bottom: 7px;
    font-family: $font-medium;
    font-size: 13px;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0;
    line-height: 13px;
  }
  .other-title {
    margin-bottom: 12px;
  }
  .down-arrow {
    position: absolute;
    top: 7px;
    right: 8px;
    transform: rotate(90deg);
    transition: transform 200ms;
  }
  .up-arrow {
    position: absolute;
    top: 7px;
    right: 8px;
    transform: rotate(-90deg);
    transition: transform 200ms;
  }
  .description {
    margin-bottom: 13px;
    font-family: $font-medium;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0;
  }
  .drop-down {
    width: 200px;
    margin-bottom: 35px;
    height: 28px;
    -webkit-app-region: no-drag;
    .drop-down-brief {
      position: relative;
      -webkit-app-region: no-drag;
      cursor: pointer;
      width: 100%;
      height: 28px;
      background-color: rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 2px;
      font-family: $font-semibold;
      font-size: 12px;
      line-height: 28px;
      color: #FFFFFF;
      letter-spacing: 0;
      text-align: center;
      transition: border 200ms, background-color 200ms;
      &:hover {
        border: 1px solid rgba(255,255,255,0.3);
        background-color: rgba(255,255,255,0.07);
      }
    }
    .drop-down-content {
      cursor: pointer;
      position: relative;
      z-index: 50;
      width: 100%;
      height: $dropdown-height;
      background-color: rgba(100,100,100,.95);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 2px;
      font-family: $font-semibold;
      font-size: 12px;
      color: #FFFFFF;
      letter-spacing: 0;
      text-align: center;
      .selected {
        height: 28px;
        line-height: 28px;
        background-color: rgba(255,255,255,0.1);
      }
      .content {
        cursor: pointer;
        position: absolute;
        top: 32px;
        left: 8px;
        right: 4px;
        bottom: 4px;
        overflow-y: scroll;
        .selection {
          height: 28px;
          line-height: 28px;
        }
        .selection:hover {
          background-image: linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.069) 23%, rgba(255,255,255,0.00) 100%);
        }
      }
    }
  }
  .description-button {
    display: flex;
    justify-content: space-between;
    margin-bottom: 35px;
    width: 349px;
    height: fit-content;
    .setting-content {
      width: 238px;
      .setting-title {
        white-space: nowrap;
        margin-bottom: 6px;
        font-family: $font-medium;
        font-size: 13px;
        color: rgba(255,255,255,0.9);
        letter-spacing: 0;
        line-height: 13px;
      }
      .setting-description {
        font-family: $font-medium;
        font-size: 11px;
        color: rgba(255,255,255,0.5);
        letter-spacing: 0;
      }
    }
    .setting-button {
      cursor: pointer;
      box-sizing: border-box;
      align-self: center;
      background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);
      border: 0.5px solid rgba(255,255,255,0.20);
      border-radius: 2px;
      transition-property: background-color, opacity;
      transition-duration: 80ms;
      transition-timing-function: ease-in;
      width: 61px;
      height: 23px;

      .button-enter, .button-leave-to {
        opacity: 0;
      }
      .button-enter-active {
        transition: opacity 250ms ease-in;
      }
      .button-leave-active {
        transition: opacity 300ms ease-in;
      }
      .content {
        font-family: $font-medium;
        font-size: 11px;
        color: #FFFFFF;
        letter-spacing: 0;
        text-align: center;
        line-height: 23px;
      }
      .result {
        position: relative;
        top: 3px;
        left: 23px;
      }
    }
  }
  ::-webkit-scrollbar {
  width: 3px;
  user-select: none;
}
/* Handle */
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1.5px;
}
::-webkit-scrollbar-track {
  border-radius: 2px;
  width: 10px;
  user-select: none;
}
}
</style>
