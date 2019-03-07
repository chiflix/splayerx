<template>
<div class="preference-setting">
  <BaseCheckBox
    :checkboxValue="privacyAgreement"
    @update:checkbox-value="privacyAgreement = $event">
    {{ $t('preferences.privacy.privacyConfirm') }}
  </BaseCheckBox>
  <div class="languages-select">
    <div class="select-content" :style="{opacity: privacyAgreement ? 1 : 0.3}">
      <div class="title">{{ $t('preferences.privacy.languagePriority')}}</div>
      <div class="description">{{ $t('preferences.privacy.languageDescription')}}</div>
      <table>
        <tr>
          <td class="selection-title">{{ $t('preferences.privacy.primary')}}</td>
          <td class="first-selection">
            <div class="drop-down">
            <div class="no-drag" :class="showFirstSelection ? 'drop-down-content' : 'drop-down-brief'"
              :style="{ cursor: privacyAgreement ? 'pointer' : 'default' }"
              @mouseup.stop="openFirstDropdown">
              <div class="selected">{{ codeToLanguageName(primaryLanguage) }}</div>
              <Icon type="rightArrow" :class="showFirstSelection ? 'up-arrow' : 'down-arrow'"/>
              <div class="content" v-if="showFirstSelection"
                @mouseup.stop="">
                <div class="selection"
                  v-for="(language, index) in primaryLanguages"
                  :key="index"
                  @mouseup.stop="handleFirstSelection(language)">
                  {{ codeToLanguageName(language) }}
                </div>
              </div>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="selection-title">{{ $t('preferences.privacy.secondary')}}</td>
          <td class="second-selection">
            <div class="drop-down">
              <div class="no-drag" :class="showSecondSelection ? 'drop-down-content' : 'drop-down-brief'"
                :style="{ cursor: privacyAgreement ? 'pointer' : 'default' }"
                @mouseup.stop="openSecondDropdown">
                <div class="selected">{{ codeToLanguageName(secondaryLanguage) }}</div>
                <Icon type="rightArrow" :class="showSecondSelection ? 'up-arrow' : 'down-arrow'"/>
                <div class="content" v-if="showSecondSelection"
                  @mouseup.stop="">
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
                      style="color: rgba(255,255,255,0.5)">- {{ $t('preferences.privacy.primary') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>
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
  props: ['mouseDown', 'isMoved'],
  data() {
    return {
      showFirstSelection: false,
      showSecondSelection: false,
      languages: [
        '',
        'zh-CN',
        'zh-TW',
        'ja',
        'ko',
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'cs',
        'ru',
        'id',
        'ar',
        'hi',
      ],
      noLanguage: this.$t('preferences.privacy.none'),
    };
  },
  watch: {
    privacyAgreement(val) {
      if (!val) {
        this.showFirstSelection = this.showSecondSelection = false;
      }
    },
    mouseDown(val, oldVal) {
      if (!val && oldVal && !this.isMoved) {
        this.showFirstSelection = this.showSecondSelection = false;
      } else if (!val && oldVal && this.isMoved) {
        this.$emit('move-stoped');
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
$dropdown-width: 218px;
$dropdown-height: 156px;

.preference-setting {
  box-sizing: border-box;
  padding-top: 37px;
  padding-left: 24px;
  width: 100%;
  height: 100%;
  .languages-select {
    background-color: rgba(0,0,0,0.05);
    width: 380px;
    margin-bottom: 24px;
    .select-content {
      padding-top: 20px;
      padding-left: 28px;
      padding-right: 22px;
      padding-bottom: 19px;
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
        margin-bottom: 9px;
      }
      .selection-title {
        text-overflow:ellipsis;
        white-space:nowrap;
        padding-right: 10px;
        padding-top: 13px;
        padding-bottom: 13px;
        font-family: $font-medium;
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        letter-spacing: 0;
        line-height: 13px;
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
      .first-selection {
        display: flex;
        flex-direction: row;
        padding-top: 7px;
        padding-bottom: 7px;
        .drop-down {
          width: $dropdown-width;
          height: 22px;
          -webkit-app-region: no-drag;
          .drop-down-brief {
            position: relative;
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
            border-color: rgba(255,255,255,0.07) rgba(255,255,255,0.0) rgba(255,255,255,0.1) rgba(255,255,255,0.35);
            border-width: 1px 1px 1px 1px;
            border-style: solid;
            border-radius: 2px;
            font-family: $font-semibold;
            font-size: 12px;
            color: #FFFFFF;
            letter-spacing: 0;
            text-align: center;
            .selected {
              padding-top: 4px;
              height: 23px;
              background-color: rgba(255,255,255,0.07);
            }
            .content {
              cursor: pointer;
              position: absolute;
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
      }
      .second-selection {
        display: flex;
        flex-direction: row;
        padding-top: 7px;
        padding-bottom: 7px;
        .drop-down {
          width: $dropdown-width;
          height: 22px;
          .drop-down-brief {
            position: relative;
            cursor: pointer;
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
            position: relative;
            cursor: pointer;
            width: $dropdown-width;
            height: $dropdown-height;
            background-image: linear-gradient(90deg, rgba(115,115,115,0.95) 0%, rgba(117,117,117,0.95) 22%, rgba(86,86,86,0.95) 99%);
            border-color: rgba(255,255,255,0.07) rgba(255,255,255,0.0) rgba(255,255,255,0.1) rgba(255,255,255,0.35);
            border-width: 1px 1px 1px 1px;
            border-style: solid;
            border-radius: 2px;
            font-family: $font-semibold;
            font-size: 12px;
            color: #FFFFFF;
            letter-spacing: 0;
            text-align: center;
            .selected {
              padding-top: 4px;
              height: 23px;
              background-color: rgba(255,255,255,0.07);
            }
            .content {
              cursor: pointer;
              position: absolute;
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
  cursor: pointer;
  border-radius: 2px;
  width: 10px;
  user-select: none;
}
</style>
