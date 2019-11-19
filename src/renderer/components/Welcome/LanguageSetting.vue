<template>
  <div class="language-setting">
    <div class="title">
      {{ $t('welcome.languageTitle1') }}<br>{{ $t('welcome.languageTitle2') }}
    </div>
    <Dropdown
      v-model="showFirstDropdown"
      :selected="primaryLanguage"
      :selections="primaryLanguages"
      :selected-formater="primaryLanguageFormater"
      :selection-formater="primarySelectionFormater"
      :handle-selection="handlePrimarySelection"
      class="dropdown1"
    />
    <Dropdown
      v-model="showSecondDropdown"
      :use-default="secondaryLanguage === undefined"
      :default-value="$t('welcome.chooseSecondary')"
      :selected="secondaryLanguage"
      :selections="secondaryLanguages"
      :selected-formater="secondaryLanguageFormater"
      :selection-formater="secondarySelectionFormater"
      :handle-selection="handleSecondarySelection"
      class="dropdown2"
    />
    <div class="content">
      {{ $t('welcome.languageDescription') }}
    </div>
  </div>
</template>
<script lang="ts">
import { concat } from 'lodash';
import Dropdown from '@/components/Welcome/Dropdown.vue';
import { codeToLanguageName, LanguageCode } from '@/libs/language';

export default {
  components: {
    Dropdown,
  },
  data() {
    return {
      mousedown: false,
      showFirstDropdown: false,
      showSecondDropdown: false,
      noLanguage: this.$t('welcome.none'),
      iconDisplay: true,
      payload: null,
      supportedLanguageCodes: [
        LanguageCode.en,
        LanguageCode['zh-CN'],
        LanguageCode['zh-TW'],
        LanguageCode.ja,
        LanguageCode.ko,
        LanguageCode.es,
        LanguageCode.fr,
        LanguageCode.de,
        LanguageCode.it,
        LanguageCode.pt,
        LanguageCode.ca,
        LanguageCode.ru,
        LanguageCode.id,
        LanguageCode.ar,
        LanguageCode.tr,
        LanguageCode.nl,
        LanguageCode.ro,
      ],
    };
  },
  computed: {
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    languages() {
      return concat('', this.supportedLanguageCodes);
    },
    primaryLanguage: {
      get() {
        return this.payload.primaryLanguage;
      },
      set(val: string) {
        this.payload.primaryLanguage = val;
        this.$emit('language-setting', this.payload);
      },
    },
    secondaryLanguage: {
      get() {
        return this.payload.secondaryLanguage;
      },
      set(val: string) {
        this.payload.secondaryLanguage = val;
        this.$emit('language-setting', this.payload);
      },
    },
    primaryLanguages() {
      return this.languages
        .filter((lan: string) => lan && lan !== this.primaryLanguage)
        .map((lan: string) => ({ selection: lan, disabled: false }));
    },
    secondaryLanguages() {
      return this.languages
        .filter((lan: string) => lan !== this.secondaryLanguage)
        .map((lan: string) => ({ selection: lan, disabled: lan === this.primaryLanguage }));
    },
  },
  watch: {
    showFirstDropdown() {
      if (this.showSecondDropdown) this.showSecondDropdown = false;
    },
  },
  created() {
    this.payload = {
      primaryLanguage: this.$store.getters.primaryLanguage,
      secondaryLanguage: this.$store.getters.secondaryLanguage,
    };
    this.$emit('language-setting', this.payload);
    document.addEventListener('mouseup', this.globalMouseupHandler);
  },
  beforeDestroy() {
    this.iconDisplay = false;
  },
  destroyed() {
    document.removeEventListener('mouseup', this.globalMouseupHandler);
  },
  methods: {
    primaryLanguageFormater(code: string) {
      return `${code} - ${this.$t('welcome.primary')}`;
    },
    secondaryLanguageFormater(code: string) {
      if (code === this.$t('welcome.chooseSecondary')) return code;
      return `${code} - ${this.$t('welcome.secondary')}`;
    },
    primarySelectionFormater(code: string) {
      if (!code) return this.noLanguage;
      return codeToLanguageName(code);
    },
    secondarySelectionFormater(code: string) {
      if (!code) return this.noLanguage;
      if (code === this.primaryLanguage) return `${codeToLanguageName(code)} - ${this.$t('welcome.primary')}`;
      return codeToLanguageName(code);
    },
    handleIconMousedown() {
      this.mousedown = true;
    },
    handlePrimarySelection(selection: string) {
      if (selection === this.secondaryLanguage) this.secondaryLanguage = '';
      this.primaryLanguage = selection;
      this.showFirstDropdown = false;
    },
    handleSecondarySelection(selection: string) {
      if (selection !== this.primaryLanguage) {
        this.secondaryLanguage = selection;
        this.showSecondDropdown = false;
      }
    },
    globalMouseupHandler() {
      this.mousedown = false;
      this.showFirstDropdown = this.showSecondDropdown = false;
    },
  },
};
</script>
<style lang="scss" scoped>
.language-setting {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  height: 270px;
}
.title {
  padding-top: 64px;
  height: 80px;
  font-family: $font-medium;
  font-weight: lighter;
  font-size: 30px;
  color: rgba(255,255,255,0.90);
  letter-spacing: 2.14px;
  text-align: center;
  line-height: 40px;
}
.dropdown {
  position: relative;
  &1 {
    margin-top: 30px;
    z-index: 10;
  }
  &2 {
    z-index: 5;
  }
}
.content {
  margin-top: 12px;
  font-family: $font-medium;
  font-size: 12px;
  color: rgba(255,255,255,0.20);
  letter-spacing: 0.86px;
  text-align: center;
}
</style>
