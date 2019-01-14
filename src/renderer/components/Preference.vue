<template>
  <div class="preference">
    <div class="left">
      <div class="mac-icons"
        v-if="isDarwin"
        @mouseover="handleMouseOver"
        @mouseout="handleMouseOut">
        <Icon class="title-button no-drag"
              type="titleBarClose"
              :state="state"
              @click.native="handleClose">
        </Icon>
        <Icon class="title-button-disable no-drag"
              type="titleBarExitFull">
        </Icon>
        <Icon class="title-button-disable no-drag"
              :type="itemType">
        </Icon>
        </Icon>
      </div>
      <div class="general">{{ $t('preferences.generalSetting') }}</div>
    </div>
    <div class="right">
      <div class="right-content"
        @click="showFirstSelection = showSecondSelection = false">
        <label class="container">{{ $t('preferences.privacyConfirm') }}
          <input type="checkbox" checked="privacyAgreement" v-model="privacyAgreement">
          <span class="checkmark"></span>
          <Icon type="nike" class="nike"/>
        </label>
        <div class="languages-select">
          <div class="select-content">
            <div class="title">{{ $t('preferences.languagePriority')}}</div>
            <div class="description">{{ $t('preferences.languageDescription')}}</div>
            <div class="first-selection">
              <div class="title">{{ $t('preferences.firstLanguage')}}</div>
              <div class="drop-down"
                @click.stop="openFirstDropdown">{{ firstLanguage }}
                <Icon type="rightArrow" :class="showFirstSelection ? 'up-arrow' : 'down-arrow'"/>
              </div>
              <div class="drop-down-content"
                v-show="showFirstSelection">
                <div class="content">
                  <div class="selection"
                    v-for="(language, index) in firstLanguages"
                    @click="handleFirstSelection(language)">
                    {{ language }}
                    <span v-if="language === secondLanguage && language !== '无'"
                      style="color: rgba(255,255,255,0.5)">- {{ $t('preferences.secondLanguage') }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="second-selection">
             <div class="title">{{ $t('preferences.secondLanguage')}}</div>
              <div class="drop-down"
                @click.stop="openSecondDropdown">{{ secondLanguage }}
                  <Icon type="rightArrow" :class="showSecondSelection ? 'up-arrow' : 'down-arrow'"/>                
                </div>
              <div class="drop-down-content"
                v-show="showSecondSelection">
                <div class="content">
                  <div class="selection"
                    v-for="(language, index) in secondLanguages"
                    @click="handleSecondSelection(language)">
                    {{ language }}
                    <span v-if="language === firstLanguage && language !== '无'"
                      style="color: rgba(255,255,255,0.5)">- {{ $t('preferences.firstLanguage') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <label class="container">{{ $t('preferences.clearHistory') }}
          <input type="checkbox" checked="deleteVideoHistoryOnExit" v-model="deleteVideoHistoryOnExit">
          <span class="checkmark"></span>
          <Icon type="nike" class="nike"/>
        </label>
        <label class="container">{{ $t('preferences.setAsDefault') }}
          <input type="checkbox" checked="checked">
          <span class="checkmark"></span>
          <Icon type="nike" class="nike"/>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
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
      itemType: 'titleBarFull',
      showFirstSelection: false,
      showSecondSelection: false,
      firstLanguage: '无',
      secondLanguage: '无',
      languages: [
        '无',
        '影片源语言',
        '简体中文',
        '繁體中文',
        'English',
        'Español',
        '日本語',
        'Français',
        '한국어',
        'Português',
        'العربية',
        'Deutsch',
        'Русский',
        'हिन्दी',
        'Italiano',
      ],
      checked: true,
    };
  },
  computed: {
    ...mapGetters(['deleteVideoHistoryOnExit', 'privacyAgreement']),
    firstLanguages() {
      return this.languages.filter(language => language !== this.firstLanguage);
    },
    secondLanguages() {
      return this.languages.filter(language => language !== this.secondLanguage);
    },
    privacyAgreement: {
      get() {
        return this.$store.getters.privacyAgreement;
      },
      set(val) {
        if (val) {
          this.$store.dispatch('agreeOnPrivacyPolicy');
        } else {
          this.$store.dispatch('disagreeOnPrivacyPolicy');
        }
      },
    },
    deleteVideoHistoryOnExit: {
      get() {
        return this.$store.getters.deleteVideoHistoryOnExit;
      },
      set(val) {
        if (val) {
          this.$store.dispatch('deleteVideoHistoryOnExit');
        } else {
          this.$store.dispatch('notDeleteVideoHistoryOnExit');
        }
      },
    },
    name() {
      return electron.remote.app.getName();
    },
    version() {
      return electron.remote.app.getVersion();
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  methods: {
    handleFirstSelection(selection) {
      if (selection === this.secondLanguage) this.secondLanguage = '无';
      this.firstLanguage = selection;
    },
    handleSecondSelection(selection) {
      if (selection === this.firstLanguage) this.firstLanguage = '无';
      this.secondLanguage = selection;
    },
    openFirstDropdown() {
      if (this.showFirstSelection) {
        this.showFirstSelection = false;
      } else {
        this.showFirstSelection = true;
        this.showSecondSelection = false;
      }
    },
    openSecondDropdown() {
      if (this.showSecondSelection) {
        this.showSecondSelection = false;
      } else {
        this.showSecondSelection = true;
        this.showFirstSelection = false;
      }
    },
    handleMouseOver() {
      this.state = 'hover';
    },
    handleMouseOut() {
      this.state = 'default';
    },
    // Methods to handle window behavior
    handleClose() {
      electron.remote.getCurrentWindow().close();
    },
  },
};
</script>

<style scoped lang="scss">
  .preference {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
    .mac-icons {
      margin-top: 12px;
      margin-left: 12px;
      display: flex;
      flex-wrap: nowrap;
    }
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
    .left {
      flex-basis: 110px;
      height: 100%;
      background-image: linear-gradient(-28deg, rgba(65,65,65,0.75) 0%, rgba(84,84,84,0.75) 47%, rgba(123,123,123,0.75) 100%);
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
      height: 100%;
      background-image: linear-gradient(-28deg, rgba(65,65,65,0.95) 0%, rgba(84,84,84,0.95) 47%, rgba(123,123,123,0.95) 100%);
      .right-content {
        padding-top: 37px;
        padding-left: 26px;
        .container {
          display: block;
          position: relative;
          padding-left: 29px;
          padding-top: 2px;
          margin-bottom: 18px;
          width: fit-content;
          cursor: pointer;
          opacity: 0.7;
          font-family: PingFangSC-Medium;
          font-size: 13px;
          color: #FFFFFF;
          letter-spacing: 0.32px;
          line-height: 13px;
          user-select: none;
          input {
            position: absolute;
            display: none;
            cursor: pointer;
          }
          .checkmark {
            position: absolute;
            top: 0;
            left: 0;
            width: 17px;
            height: 17px;
            border-radius: 4px;
            border: 0.5px solid rgba(255,255,255,0.20);
            background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);
          }
          input:checked ~ .nike {
            display: block;
          }
          .nike {
            position: absolute;
            display: none;
            top: 3px;
            left: 1.5px;
          }
        }
        .languages-select {
          background-color: rgba(0,0,0,0.05);
          width: 348px;
          height: 170px;
          margin-bottom: 24px;
          .select-content {
            padding-top: 26px;
            padding-left: 28px;
            .title {
              font-family: PingFangSC-Medium;
              font-size: 13px;
              margin-bottom: 7px;
              color: rgba(255,255,255,0.9);
              letter-spacing: 0;
              line-height: 13px;
            }
            .description {
              font-family: PingFangSC-Medium;
              font-size: 11px;
              color: rgba(255,255,255,0.5);
              letter-spacing: 0;
              margin-bottom: 16px;
            }
            .first-selection {
              display: flex;
              flex-direction: row;
              margin-bottom: 14px;
              position: relative;
              .title {
                position: relative;
                top: 6px;
                margin-right: 12px;
                font-family: PingFangSC-Medium;
                font-size: 12px;
                color: rgba(255,255,255,0.7);
                letter-spacing: 0;
                line-height: 13px;
              }
              .drop-down {
                position: relative;
                z-index: 100;
                width: 228px;
                height: 22px;
                padding-top: 4px;
                background-color: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.07);
                border-radius: 2px;
                font-family: PingFangSC-Semibold;
                font-size: 12px;
                color: #FFFFFF;
                letter-spacing: 0;
                text-align: center;

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
              }
              .drop-down-content {
                position: absolute;
                z-index: 50;
                top: 0;
                left: 60px;
                width: 228px;
                height: 182px;
                opacity: 0.95;
                background-image: linear-gradient(90deg, rgba(115,115,115,0.95) 0%, rgba(117,117,117,0.95) 22%, rgba(86,86,86,0.95) 99%);
                border-color: rgba(255,255,255,0.07) rgba(255,255,255,0.07) rgba(255,255,255,0.25) rgba(255,255,255,0.35);
                border-width: 1px 1px 1px 1px;
                border-style: solid;
                border-radius: 2px;
                .content {
                  position: absolute;
                  left: 8px;
                  right: 4px;
                  bottom: 2px;
                  height: 150px;
                  overflow-y: scroll;
                  .selection {
                    padding-top: 5px;
                    height: 21px;
                    font-family: PingFangSC-Semibold;
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
            }
            .second-selection {
              display: flex;
              flex-direction: row;
              position: relative;
              .title {
                position: relative;
                top: 6px;
                margin-right: 12px;
                font-family: PingFangSC-Medium;
                font-size: 12px;
                color: rgba(255,255,255,0.7);
                letter-spacing: 0;
                line-height: 13px;
              }
              .drop-down {
                position: relative;
                z-index: 40;
                width: 228px;
                height: 22px;
                padding-top: 4px;
                background-color: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.07);
                border-radius: 2px;
                font-family: PingFangSC-Semibold;
                font-size: 12px;
                color: #FFFFFF;
                letter-spacing: 0;
                text-align: center;
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
              }
              .drop-down-content {
                position: absolute;
                z-index: 10;
                top: 0;
                left: 60px;
                width: 228px;
                height: 152px;
                opacity: 0.95;
                background-image: linear-gradient(90deg, rgba(115,115,115,0.95) 0%, rgba(117,117,117,0.95) 22%, rgba(86,86,86,0.95) 99%);
                border-color: rgba(255,255,255,0.07) rgba(255,255,255,0.07) rgba(255,255,255,0.25) rgba(255,255,255,0.35);
                border-width: 1px 1px 1px 1px;
                border-style: solid;
                border-radius: 2px;
                .content {
                  position: absolute;
                  left: 8px;
                  right: 4px;
                  bottom: 2px;
                  height: 120px;
                  overflow-y: scroll;
                  .selection {
                    padding-top: 5px;
                    height: 21px;
                    font-family: PingFangSC-Semibold;
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
  border-radius: 2px;
  width: 10px;
  user-select: none;
}
</style>
