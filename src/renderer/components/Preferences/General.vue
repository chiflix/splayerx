<template>
  <div class="general tabcontent">
    <div class="settingItem">
      <div class="settingItem__title">
        {{ $t("preferences.general.displayLanguage") }}
      </div>
      <div class="settingItem__description">
        {{ $t("preferences.general.switchDisplayLanguages") }}
      </div>
      <div class="settingItem__input dropdown">
        <div
          :class="showSelection ? 'dropdown__toggle--list' : 'dropdown__toggle--display'"
          @mouseup.stop="showSelection = !showSelection"
          class="dropdown__toggle no-drag"
        >
          <div class="dropdown__displayItem">
            {{ mapCode(displayLanguage) }}
          </div>
          <div
            @mouseup.stop=""
            class="dropdown__listItems"
          >
            <div
              v-for="(language, index) in displayLanguages"
              :key="index"
              @mouseup.stop="handleSelection(language)"
              class="dropdownListItem"
            >
              {{ mapCode(language) }}
            </div>
          </div>
          <Icon
            :class="showSelection ? 'dropdown__icon--arrowUp' : 'dropdown__icon--arrowDown'"
            type="rightArrow"
          />
        </div>
      </div>
    </div>
    <div
      v-if="!isMas"
      class="settingItem--justify"
    >
      <div class="flex">
        <div class="settingItem__title">
          {{ $t("preferences.general.setDefault") }}
        </div>
        <div class="settingItem__description">
          {{ $t("preferences.general.setDefaultDescription") }}
        </div>
      </div>
      <div
        ref="button1"
        :class="{ 'button--mouseDown': buttonDown === 2 }"
        @mousedown="mousedownOnSetDefault"
        class="settingItem__input button no-drag"
      >
        <transition
          name="button"
          mode="out-in"
        >
          <div
            key=""
            v-if="!defaultState"
            class="button__text"
          >
            {{ $t("preferences.general.setButton") }}
          </div>
          <div
            v-else
            :key="defaultState"
            class="button__result"
          >
            <Icon
              :type="defaultState"
              :class="defaultState"
            />
          </div>
        </transition>
      </div>
    </div>
    <div class="settingItem--justify">
      <div class="flex">
        <div class="settingItem__title">
          {{ $t("preferences.general.restoreSettings") }}
        </div>
        <div class="settingItem__description">
          {{ needToRelaunch
            ? $t("preferences.general.restoreSettingsAfterRelaunch")
            : $t("preferences.general.restoreSettingsDescription")
          }}
        </div>
      </div>
      <div
        ref="button2"
        @mousedown="mousedownOnRestore"
        :class="{
          'button--mouseDown': buttonDown === 2 || (needToRelaunch && isMas),
          'disabled': needToRelaunch && isMas,
        }"
        class="settingItem__input button no-drag"
      >
        <transition
          name="button"
          mode="out-in"
        >
          <div
            ref="restoreContent"
            :key="needToRelaunch"
            class="button__text"
          >
            {{ restoreContent }}
          </div>
        </transition>
      </div>
    </div>
    <div class="settingItem__title">
      {{ $t("preferences.general.others") }}
    </div>
    <BaseCheckBox
      :checkbox-value="reverseScrolling"
      @update:checkbox-value="reverseScrolling = $event"
    >
      {{ $t('preferences.general.reverseScrolling') }}
    </BaseCheckBox>
    <BaseCheckBox
      :checkbox-value="deleteVideoHistoryOnExit"
      @update:checkbox-value="deleteVideoHistoryOnExit = $event"
    >
      {{ $t('preferences.general.clearHistory') }}
    </BaseCheckBox>
  </div>
</template>

<script>
import electron from 'electron';
import { setAsDefaultApp } from '@/../shared/system';
import Icon from '@/components/BaseIconContainer.vue';
import { codeToLanguageName } from '@/libs/language';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'General',
  components: {
    BaseCheckBox,
    Icon,
  },
  props: {
    mouseDown: Boolean,
    isMoved: Boolean,
  },
  data() {
    return {
      showSelection: false,
      isSettingDefault: false,
      isRestoring: false,
      defaultState: '',
      restoreState: '',
      defaultButtonTimeoutId: NaN,
      restoreButtonTimeoutId: NaN,
      needToRelaunch: !!window.localStorage.needToRelaunch,
      languages: ['zh-Hans', 'zh-Hant', 'ja', 'ko', 'en', 'es', 'ar'],
      buttonDown: 0,
    };
  },
  computed: {
    isMas() {
      return !!process.mas;
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
    restoreContent() {
      return (this.needToRelaunch && !this.isMas)
        ? this.$t('preferences.general.relaunch')
        : this.$t('preferences.general.setButton');
    },
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
  methods: {
    mouseupOnOther() {
      if (!this.isSettingDefault) {
        this.buttonDown = 1;
      } else if (!this.isRestoring) {
        this.buttonDown = 2;
      }
      document.removeEventListener('mouseup', this.mouseupOnOther);
      this.$refs.button1.removeEventListener('mouseup', this.setDefault);
      this.$refs.button2.removeEventListener('mouseup', this.restoreSettings);
    },
    mousedownOnSetDefault() {
      if (!this.isSettingDefault) {
        this.buttonDown = 1;
        this.$refs.button1.addEventListener('mouseup', this.setDefault);
        document.addEventListener('mouseup', this.mouseupOnOther);
      }
    },
    mousedownOnRestore() {
      if (!this.isSettingDefault) {
        this.buttonDown = 2;
        this.$refs.button2.addEventListener('mouseup', this.restoreSettings);
        document.addEventListener('mouseup', this.mouseupOnOther);
      }
    },
    async setDefault() {
      if (this.isSettingDefault) return;
      this.isSettingDefault = true;
      try {
        await setAsDefaultApp();
        clearTimeout(this.defaultButtonTimeoutId);
        this.defaultState = 'success';
        this.defaultButtonTimeoutId = setTimeout(() => {
          this.defaultState = '';
          this.isSettingDefault = false;
          this.$refs.button1.style.setProperty('transition-delay', '');
        }, 1500);
      } catch (ex) {
        clearTimeout(this.defaultButtonTimeoutId);
        this.defaultState = 'failed';
        this.defaultButtonTimeoutId = setTimeout(() => {
          this.defaultState = '';
          this.isSettingDefault = false;
          this.$refs.button1.style.setProperty('transition-delay', '');
        }, 1500);
      } finally {
        this.buttonDown = 0;
        this.$refs.button1.removeEventListener('mouseup', this.setDefault);
      }
    },
    restoreSettings() {
      this.isRestoring = true;
      if (!this.needToRelaunch) {
        electron.ipcRenderer.send('need-to-restore');
        window.localStorage.needToRelaunch = true;
        this.needToRelaunch = true;
        this.isRestoring = false;
        this.buttonDown = 0;
        return;
      }
      if (!this.isMas) {
        electron.ipcRenderer.send('relaunch');
        this.isRestoring = false;
        this.$refs.button2.removeEventListener('mouseup', this.restoreSettings);
      }
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
.tabcontent {
  .settingItem {
    margin-bottom: 30px;

    &__title {
      font-family: $font-medium;
      font-size: 13px;
      color: rgba(255,255,255,0.9);
    }

    &__description {
      font-family: $font-medium;
      font-size: 11px;
      color: rgba(255,255,255,0.5);
      margin-top: 7px;
    }

    &__input {
      -webkit-app-region: no-drag;
      cursor: pointer;
      font-family: $font-semibold;
      font-size: 11px;
      color: #FFFFFF;
      text-align: center;
      border-radius: 2px;
      border: 1px solid rgba(255,255,255,0.1);
      background-color: rgba(255,255,255,0.03);
      transition: all 200ms;

      &:not(.disabled):hover {
        border: 1px solid rgba(255,255,255,0.2);
        background-color: rgba(255,255,255,0.08);
      }
      &.disabled {
        cursor: default;
      }
    }

    &--justify {
      @extend .settingItem;
      display: flex;
      justify-content: space-between;
    }
  }
  .dropdown {
    position: relative;
    width: 240px;
    height: 28px;
    margin-top: 13px;

    &__toggle {
      position: absolute;
      width: 100%;
      margin-top: -1px;
      margin-left: -1px;
      transition: all 200ms;
      border-radius: 2px;
      overflow: hidden;


      &--display {
        height: 28px;
        border: 1px solid rgba(255,255,255,0);
        background-color: rgba(255, 255, 255, 0);
      }

      &--list {
        height: 148px;
        border: 1px solid rgba(255,255,255,0.3);
        background-color: rgba(120,120,120,1);
        .dropdown__displayItem {
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
      }
    }

    &__displayItem {
      height: 28px;
      line-height: 28px;
      border-bottom: 1px solid rgba(255,255,255,0);
    }

    &__listItems {
      cursor: pointer;
      position: relative;
      height: 112px;
      margin: 4px 4px 4px 6px;
      overflow-y: scroll;
    }

    .dropdownListItem {
      height: 28px;
      line-height: 28px;

      &:hover {
        background-image: linear-gradient(
          90deg,
          rgba(255,255,255,0.00) 0%,
          rgba(255,255,255,0.069) 23%,
          rgba(255,255,255,0.00) 100%
        );
      }
    }

    &__icon {
      position: absolute;
      top: 7px;
      right: 8px;
      transition: transform 200ms;
      &--arrowDown {
        @extend .dropdown__icon;
        transform: rotate(90deg);
      }
      &--arrowUp {
        @extend .dropdown__icon;
        z-index: 100;
        transform: rotate(-90deg);
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
  .button {
    box-sizing: border-box;
    align-self: center;
    width: 61px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;

    .button-enter, .button-leave-to {
      opacity: 0;
    }
    .button-enter-active {
      transition: opacity 200ms ease-in;
    }
    .button-leave-active {
      transition: opacity 200ms ease-in;
    }

    &__text {
      font-family: $font-medium;
      font-size: 11px;
      color: #FFFFFF;
      letter-spacing: 0;
      text-align: center;
      line-height: 26px;
    }
    &__result {
      width: 15px;
      height: 15px;
    }
    &--mouseDown {
      opacity: 0.5;
    }
  }
}
</style>
