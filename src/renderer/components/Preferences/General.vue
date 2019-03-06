<template>
<div class="preference-setting">
  <div class="title">{{ $t("preferences.general.displayLanguage") }}</div>
  <div class="description">{{ $t("preferences.general.switchDisplayLanguages")}}</div>
  <div class="selection-box">
    <div class="drop-down"
      @mouseup.stop="showSelection = !showSelection">
      {{ mapCode(displayLanguage) }}
      <Icon type="rightArrow" :class="showSelection ? 'up-arrow' : 'down-arrow'"/>
    </div>
    <div class="drop-down-content no-drag"
      v-if="showSelection">
      <div class="content">
        <div class="selection"
          v-for="(language, index) in displayLanguages"
          :key="index"
          @mouseup.stop="handleSelection(language)">
          {{ mapCode(language) }}
        </div>
      </div>
    </div>
  </div>
  <div class="title other-title">{{ $t("preferences.general.others") }}</div>
  <BaseCheckBox
    :checkboxValue="deleteVideoHistoryOnExit"
    @update:checkbox-value="deleteVideoHistoryOnExit = $event">
    {{ $t('preferences.general.clearHistory') }}
  </BaseCheckBox>
</div>
</template>

<script>
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';
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
      languages: ['zhCN', 'zhTW', 'en', 'ja'],
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
    preferenceData() {
      return this.$store.getters.preferenceData;
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
    mapCode(code) {
      const languages = {
        en: 'English',
        zhCN: '简体中文',
        zhTW: '繁体中文',
        ja: '日本語',
      };
      return languages[code];
    },
    handleSelection(language) {
      this.displayLanguage = language;
      this.showSelection = false;
    },
  },
};
</script>
<style scoped lang="scss">
.preference-setting {
  box-sizing: border-box;
  padding-top: 37px;
  padding-left: 26px;
  width: 100%;
  height: 100%;
  .title {
    margin-bottom: 7px;
    font-family: PingFangSC-Medium;
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
    right: 10px;
    bottom: 7px;
    transform: rotate(90deg);
  }
  .up-arrow {
    position: absolute;
    top: 7px;
    right: 10px;
    bottom: 7px;
    transform: rotate(-90deg);
  }
  .description {
    margin-bottom: 13px;
    font-family: PingFangSC-Medium;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0;
  }
  .selection-box {
    position: relative;
  }
  .drop-down {
    -webkit-app-region: no-drag;
    cursor: pointer;
    position: relative;
    margin-bottom: 35px;
    z-index: 100;
    width: 228px;
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
    position: absolute;
    z-index: 50;
    top: 0;
    left: 0;
    width: 228px;
    height: 111px;
    background-image: linear-gradient(90deg, rgba(115,115,115,0.95) 0%, rgba(117,117,117,0.95) 22%, rgba(86,86,86,0.95) 99%);
    border-color: rgba(255,255,255,0.07) rgba(255,255,255,0.07) rgba(255,255,255,0.25) rgba(255,255,255,0.35);
    border-width: 1px 1px 1px 1px;
    border-style: solid;
    border-radius: 2px;
    .content {
      position: absolute;
      top: 30px;
      left: 8px;
      right: 4px;
      bottom: 3px;
      overflow-y: scroll;
      .selection {
        padding-top: 5px;
        height: 21px;
        font-family: $font-semibold;
        font-size: 12px;
        color: #FFFFFF;
        letter-spacing: 0;
        text-align: center;
      }
      .selection:hover {
        background-image: linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.069) 23%, rgba(255,255,255,0.00) 100%);
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
