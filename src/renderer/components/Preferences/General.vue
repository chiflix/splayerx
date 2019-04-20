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
    <div class="setting-button no-drag" ref="button"
      @mousedown="mousedownOnSetDefault"
      @mouseup="setDefault">
      <transition name="button" mode="out-in">
        <div key="" v-if="!setState" class="content">{{ $t("preferences.general.setButton") }}</div>
        <div :key="setState" v-else class="result">
          <Icon :type="setState" :class="setState"/>
        </div>
      </transition>
    </div>
  </div>
  <!-- <div class="description-button">
    <div class="setting-content">
      <div class="setting-title">{{ $t("preferences.general.restoreSettings") }}</div>
      <div class="setting-description">{{ $t("preferences.general.restoreSettingsDescription") }}</div>
    </div>
    <div class="setting-button no-drag"
      @mouseup="restoreSettings"><div class="content">{{ $t("preferences.general.setButton") }}</div></div>
  </div> -->
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
import path from 'path';
import { promises as fsPromises } from 'fs';
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
      isSetting: false,
      setState: '',
      buttonContentTimeoutId: NaN,
      languages: ['zhCN', 'zhTW', 'ja', 'ko', 'en', 'es', 'ar'],
    };
  },
  watch: {
    displayLanguage(val) {
      if (val) this.$i18n.locale = val;
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
      if (!this.isSetting) {
        this.$refs.button.style.setProperty('background-color', '');
        this.$refs.button.style.setProperty('opacity', '');
      }
      document.removeEventListener('mouseup', this.mouseupOnOther);
    },
    mousedownOnSetDefault() {
      if (!this.isSetting) {
        this.$refs.button.style.setProperty('background-color', 'rgba(0,0,0,0.20)');
        this.$refs.button.style.setProperty('opacity', '0.5');
        document.addEventListener('mouseup', this.mouseupOnOther);
      }
    },
    async setDefault() {
      if (this.isSetting) return;
      this.isSetting = true;
      try {
        await setAsDefaultApp();
        // TODO: feedback
        clearTimeout(this.buttonContentTimeoutId);
        this.setState = 'success';
        this.$refs.button.style.setProperty('background-color', '');
        this.$refs.button.style.setProperty('opacity', '');
        this.buttonContentTimeoutId = setTimeout(() => {
          this.setState = '';
          this.isSetting = false;
        }, 1500);
      } catch (ex) {
        // TODO: feedback
        clearTimeout(this.buttonContentTimeoutId);
        this.setState = 'failed';
        this.$refs.button.style.setProperty('background-color', '');
        this.$refs.button.style.setProperty('opacity', '');
        this.buttonContentTimeoutId = setTimeout(() => {
          this.setState = '';
          this.isSetting = false;
        }, 1500);
      }
    },
    restoreSettings() {
      console.log('restore-settings');
      // remove dir
      const userData = electron.remote.app.getPath('userData');
      const removeDir = dir => fsPromises.readdir(dir)
        .then(files => files.reduce((result, file) => {
          const filePath = path.join(dir, file);
          return result.then(() => fsPromises.unlink(filePath)
            .then(null, () => removeDir(filePath)));
        }, Promise.resolve()).then(() => {
          if (dir !== userData) return fsPromises.rmdir(dir);
          return Promise.resolve();
        }));
      removeDir(userData)
        .then(() => {
          console.log('success');
        })
        .catch((err) => {
          console.log('failed', err);
        });
      // this.$store.dispatch('init-settings');
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
$dropdown-width: 218px;
$dropdown-height: 156px;
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
    top: 6px;
    right: 6px;
    transform: rotate(90deg);
  }
  .up-arrow {
    position: absolute;
    top: 6px;
    right: 6px;
    transform: rotate(-90deg);
  }
  .description {
    margin-bottom: 13px;
    font-family: $font-medium;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0;
  }
  .drop-down {
    width: $dropdown-width;
    height: 22px;
    margin-bottom: 35px;
    .drop-down-brief {
      position: relative;
      -webkit-app-region: no-drag;
      cursor: pointer;
      z-index: 100;
      width: $dropdown-width;
      height: 22px;
      padding-top: 4px;
      background-color: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 2px;
      font-family: $font-semibold;
      font-size: 12px;
      color: #FFFFFF;
      letter-spacing: 0;
      text-align: center;
    }
    .drop-down-content {
      cursor: pointer;
      position: relative;
      z-index: 50;
      width: $dropdown-width;
      height: $dropdown-height;
      background-image: linear-gradient(90deg, rgba(115,115,115,0.95) 0%, rgba(117,117,117,0.95) 22%, rgba(86,86,86,0.95) 99%);
      border-color: rgba(255,255,255,0.07) rgba(255,255,255,0.0) rgba(255,255,255,0.1) rgba(255,255,255,0.3);
      border-width: 1px 1px 1px 1px;
      border-style: solid;
      border-radius: 2px;
      font-family: $font-semibold;
      font-size: 12px;
      color: #FFFFFF;
      letter-spacing: 0;
      text-align: center;
      .selected {
        margin-top: -1px;
        padding-top: 5px;
        height: 24px;
        background-color: rgba(255,255,255,0.1);
      }
      .content {
        position: absolute;
        cursor: pointer;
        top: 30px;
        left: 8px;
        right: 4px;
        bottom: 3px;
        overflow-y: scroll;
        .selection {
          padding-top: 4px;
          height: 22px;
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
      position: relative;
      align-self: center;
      display: flex;
      justify-content: center;
      align-items: center;
      background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);
      border: 0.5px solid rgba(255,255,255,0.20);
      border-radius: 2px;
      transition: background-color 80ms ease-in, opacity 80ms ease-in;

      width: 61px;
      height: 23px;
      .button-enter, .button-leave-to {
        opacity: 0;
      }
      .button-enter-active {
        transition: opacity 250ms ease-in;
      }
      .button-leave-active {
        transition: opacity 400ms ease-in;
      }
      .content {
        font-family: $font-medium;
        font-size: 11px;
        color: #FFFFFF;
        letter-spacing: 0;
        text-align: center;
        line-height: 13px;
      }
      .result {
        position: absolute;
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
