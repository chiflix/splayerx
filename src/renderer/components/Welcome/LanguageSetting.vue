<template>
  <div class="welcome">
    <div class="title">
      设置常用字幕语言<br>以获取智能翻译结果
    </div>
    <Dropdown
      v-model="showFirstDropdown"
      :selected="primaryLanguage"
      :selections="primaryLanguages"
      :selected-formater="primaryLanguageFormater"
      :selection-formater="codeToLanguageName"
      :handle-selection="handlePrimarySelection"
      class='dropdown1'
    />
    <Dropdown
      v-model="showSecondDropdown"
      :selected="secondaryLanguage"
      :selections="secondaryLanguages"
      :selection-formater="codeToLanguageName"
      :handle-selection="handleSecondarySelection"
      class='dropdown2'
    />
    <div class="content">* 稍后您可以在偏好设置里更改</div>
    <div
      @mousedown="handleIconMousedown"
      @mouseup="handleIconMouseup"
      class="icon no-drag"
    >
      <Icon type="welcomeNike" />
    </div>
  </div>
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';
import Dropdown from '@/components/Welcome/Dropdown.vue';
import { codeToLanguageName } from '@/libs/language';

export default {
  components: {
    Icon,
    Dropdown,
  },
  data() {
    return {
      mousedown: false,
      showFirstDropdown: false,
      showSecondDropdown: false,
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
      noLanguage: '选择次要语言',
    };
  },
  computed: {
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    primaryLanguage: {
      get() {
        return this.$store.getters.primaryLanguage;
      },
      set(val: string) {
        this.$store.dispatch('primaryLanguage', val).then(() => {
          this.$electron.ipcRenderer.send('main-to-preference', this.preferenceData);
        });
      },
    },
    secondaryLanguage: {
      get() {
        return this.$store.getters.secondaryLanguage;
      },
      set(val: string) {
        this.$store.dispatch('secondaryLanguage', val).then(() => {
          this.$electron.ipcRenderer.send('main-to-preference', this.preferenceData);
        });
      },
    },
    primaryLanguages() {
      return this.languages.filter((lan: string) => lan && lan !== this.primaryLanguage);
    },
    secondaryLanguages() {
      return this.languages.filter((lan: string) => lan !== this.secondaryLanguage);
    },
  },
  watch: {
    showFirstDropdown(val: boolean) {
      if (this.showSecondDropdown) this.showSecondDropdown = false;
    },
  },
  created() {
    document.addEventListener('mouseup', this.globalMouseupHandler);
  },
  destroyed() {
    document.removeEventListener('mouseup', this.globalMouseupHandler);
  },
  methods: {
    primaryLanguageFormater(code: string) {
      return `${code} - 首要语言`;
    },
    codeToLanguageName(code: string) {
      if (!code) return this.noLanguage;
      return codeToLanguageName(code);
    },
    handleIconMousedown() {
      this.mousedown = true;
    },
    handleIconMouseup() {
      if (this.mousedown) this.$router.push({ name: 'landing-view' });
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
.welcome {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  height: 100%;
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
.icon {
  width: 40px;
  height: 40px;
  margin-top: 42px;
}
</style>
