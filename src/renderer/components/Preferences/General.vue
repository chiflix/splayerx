<template>
<div class="general-setting">
  <BaseCheckBox
    :checkboxValue="privacyAgreement"
    @update:checkbox-value="privacyAgreement = $event">
    {{ $t('preferences.general.privacyConfirm') }}
  </BaseCheckBox>
  <div class="languages-select">
    <div class="select-content" :style="{opacity: privacyAgreement ? 1 : 0.3}">
      <div class="title">{{ $t('preferences.general.languagePriority')}}</div>
      <div class="description">{{ $t('preferences.general.languageDescription')}}</div>
      <div class="first-selection">
        <div class="selection-title">{{ $t('preferences.general.primary')}}</div>
        <div class="drop-down"
          :class="{ 'drop-down-en': $i18n.locale === 'en' }"
          :style="{ cursor: privacyAgreement ? 'pointer' : 'default' }"
          @mouseup.stop="openFirstDropdown">
          {{ codeToLanguageName(primaryLanguage) }}
          <Icon type="rightArrow" :class="showFirstSelection ? 'up-arrow' : 'down-arrow'"/>
        </div>
        <div class="drop-down-content no-drag"
          :class="{ 'drop-down-content-en': $i18n.locale === 'en' }"
          v-if="showFirstSelection">
          <div class="content">
            <div class="selection"
              v-for="(language, index) in primaryLanguages"
              :key="index"
              @mouseup.stop="handleFirstSelection(language)">
              {{ codeToLanguageName(language) }}
            </div>
          </div>
        </div>
      </div>
      <div class="second-selection">
        <div class="selection-title">{{ $t('preferences.general.secondary')}}</div>
        <div class="drop-down"
          :class="{ 'drop-down-en': $i18n.locale === 'en' }"
          :style="{ cursor: privacyAgreement ? 'pointer' : 'default' }"
          @mouseup.stop="openSecondDropdown">
          {{ codeToLanguageName(secondaryLanguage) }}
          <Icon type="rightArrow" :class="showSecondSelection ? 'up-arrow' : 'down-arrow'"/>                
        </div>
        <div class="drop-down-content no-drag"
          :class="{ 'drop-down-content-en': $i18n.locale === 'en' }"
          v-if="showSecondSelection">
          <div class="content">
            <div class="selection" ref="secondarySelection"
              v-for="(language, index) in secondaryLanguages"
              :key="index"
              :style="{
                color: (language === primaryLanguage && language !== noLanguage) ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,1)',
              }"
              @mouseover="mouseover(index)"
              @mouseout="mouseout(index)"
              @mouseup.stop="handleSecondSelection(language, index)">
              {{ codeToLanguageName(language) }}
              <span v-if="language === primaryLanguage && language !== noLanguage"
                style="color: rgba(255,255,255,0.5)">- {{ $t('preferences.general.primary') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <BaseCheckBox
    :checkboxValue="deleteVideoHistoryOnExit"
    @update:checkbox-value="deleteVideoHistoryOnExit = $event">
    {{ $t('preferences.general.clearHistory') }}
  </BaseCheckBox>
</div>
</template>

<script>
import electron from 'electron';
import { codeToLanguageName } from '@/helpers/language';
import Icon from '@/components/BaseIconContainer.vue';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'General',
  components: {
    Icon,
    BaseCheckBox,
  },
  data() {
    return {
      showFirstSelection: false,
      showSecondSelection: false,
      languages: [
        '',
        'zh-CN',
        'zh-TW',
        'en',
      ],
      mouseDown: false,
      isMoved: false,
      noLanguage: this.$t('preferences.general.none'),
    };
  },
  created() {
    window.onmousedown = () => {
      this.mouseDown = true;
      this.isMoved = false;
    };
    window.onmousemove = () => {
      if (this.mouseDown) this.isMoved = true;
    };
    window.onmouseup = () => {
      if (!this.isMoved) {
        this.showFirstSelection = this.showSecondSelection = false;
      }
      this.mouseDown = false;
      this.isMoved = false;
    };
  },
  beforeDestroy() {
    window.onmousedown = null;
    window.onmousemove = null;
    window.onmouseup = null;
  },
  watch: {
    privacyAgreement(val) {
      if (!val) {
        this.showFirstSelection = this.showSecondSelection = false;
      }
    },
  },
  computed: {
    primaryLanguages() {
      return this.languages.filter(language => language && language !== this.primaryLanguage);
    },
    secondaryLanguages() {
      return this.languages.filter(language => language !== this.secondaryLanguage);
    },
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    primaryLanguage: {
      get() {
        return this.$store.getters.primaryLanguage;
      },
      set(val) {
        this.$store.dispatch('primaryLanguage', val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
    secondaryLanguage: {
      get() {
        return this.$store.getters.secondaryLanguage;
      },
      set(val) {
        this.$store.dispatch('secondaryLanguage', val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
    privacyAgreement: {
      get() {
        return this.$store.getters.privacyAgreement;
      },
      set(val) {
        if (val) {
          this.$store.dispatch('agreeOnPrivacyPolicy').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        } else {
          this.$store.dispatch('disagreeOnPrivacyPolicy').then(() => {
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
  },
  methods: {
    codeToLanguageName(code) {
      if (!code) return this.noLanguage;
      return codeToLanguageName(code);
    },
    mouseover(index) {
      if (this.secondaryLanguages[index] !== this.primaryLanguage) {
        this.$refs.secondarySelection[index].classList.add('selection-hover');
      }
    },
    mouseout(index) {
      if (this.secondaryLanguages[index] !== this.primaryLanguage) {
        this.$refs.secondarySelection[index].classList.remove('selection-hover');
      }
    },
    handleFirstSelection(selection) {
      if (selection === this.secondaryLanguage) this.secondaryLanguage = '';
      this.primaryLanguage = selection;
      this.showFirstSelection = false;
    },
    handleSecondSelection(selection, index) {
      if (selection !== this.primaryLanguage) {
        this.secondaryLanguage = selection;
        this.showSecondSelection = false;
        this.$refs.secondarySelection[index].classList.remove('selection-hover');
      }
    },
    openFirstDropdown() {
      if (this.privacyAgreement) {
        if (this.showFirstSelection) {
          this.showFirstSelection = false;
        } else {
          this.showFirstSelection = true;
          this.showSecondSelection = false;
        }
      }
    },
    openSecondDropdown() {
      if (this.privacyAgreement) {
        if (this.showSecondSelection) {
          this.showSecondSelection = false;
        } else {
          this.showSecondSelection = true;
          this.showFirstSelection = false;
        }
      }
    },
  },
};
</script>
<style scoped lang="scss">
.general-setting {
  box-sizing: border-box;
  padding-top: 37px;
  padding-left: 26px;
  width: 100%;
  height: 100%;
  .languages-select {
    background-color: rgba(0,0,0,0.05);
    width: 348px;
    margin-bottom: 24px;
    .select-content {
      padding-top: 20px;
      padding-left: 28px;
      padding-right: 22px;
      padding-bottom: 24px;
      .title {
        font-family: $font-medium;
        font-size: 13px;
        margin-bottom: 5px;
        color: rgba(255,255,255,0.9);
        letter-spacing: 0;
      }
      .description {
        font-family: $font-medium;
        font-size: 11px;
        color: rgba(255,255,255,0.5);
        letter-spacing: 0;
        margin-bottom: 14px;
      }
      .selection-title {
        text-overflow:ellipsis;
        white-space:nowrap;
        margin-right: 12px;
        font-family: $font-medium;
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        letter-spacing: 0;
        line-height: 28px;
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
      .first-selection {
        display: flex;
        flex-direction: row;
        margin-bottom: 14px;
        position: relative;
        .drop-down {
          -webkit-app-region: no-drag;
          cursor: pointer;
          position: absolute;
          right: 10px;
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
        .drop-down-en {
          width: 210px;
        }
        .drop-down-content {
          cursor: pointer;
          position: absolute;
          z-index: 50;
          top: 0;
          left: 58px;
          width: 228px;
          height: 85px;
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
        .drop-down-content-en {
          left: 76px;
          width: 210px;
          height: 85px;
        }
      }
      .second-selection {
        display: flex;
        flex-direction: row;
        position: relative;
        .drop-down {
          -webkit-app-region: no-drag;
          cursor: pointer;
          position: absolute;
          right: 10px;
          z-index: 40;
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
        .drop-down-en {
          width: 210px;
        }
        .drop-down-content {
          position: absolute;
          z-index: 10;
          top: 0;
          left: 58px;
          width: 228px;
          height: 112px;
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
              letter-spacing: 0;
              text-align: center;
            }
            .selection-hover {
              cursor: pointer;
              background-image: linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.069) 23%, rgba(255,255,255,0.00) 100%);
            }
          }
        }
        .drop-down-content-en {
          left: 76px;
          width: 210px;
          height: 112px;
        }
      }
    }
  }
}
::-webkit-scrollbar {
  width: 3px;
  user-select: none;
}
/* Handle */
::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1); 
  border-radius: 1.5px;
}
::-webkit-scrollbar-track {
  border-radius: 2px;
  width: 10px;
  user-select: none;
}
</style>
