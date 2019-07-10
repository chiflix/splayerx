<template>
  <div class="welcome">
    <div class="title">
      欢迎使用射手影音
    </div>
    <div class="content">
      强劲的视频播放能力、先锋的智能翻译与全新轻量级的设计相结合，颠覆您的视频观赏体验。
    </div>
    <BaseCheckBox
      v-model="privacyAgreement"
      class="checkbox"
    >
      我已阅读并同意用户隐私条款
    </BaseCheckBox>
    <div
      @mousedown="handleIconMousedown"
      @mouseup="handleIconMouseup"
      class="icon no-drag"
    >
      <Icon
        :type="iconType"
        :style="{ cursor: iconType === 'nextStepDisable' ? '' : 'pointer' }"
      />
    </div>
  </div>
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';
import BaseCheckBox from '@/components/Preferences/BaseCheckBox.vue';
import { codeToLanguageName } from '@/libs/language';

export default {
  components: {
    Icon,
    BaseCheckBox,
  },
  data() {
    return {
      iconType: 'nextStepDisable',
    };
  },
  created() {
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setResizable', [false]);
  },
  computed: {
    privacyAgreement: {
      get() {
        return this.$store.getters.privacyAgreement;
      },
      set(val: boolean) {
        if (val) {
          this.$store.dispatch('agreeOnPrivacyPolicy');
          this.iconType = 'nextStep';
        } else {
          this.$store.dispatch('disagreeOnPrivacyPolicy');
          this.iconType = 'nextStepDisable';
        }
      },
    },
  },
  methods: {
    handleIconMousedown() {
      this.mousedown = true;
    },
    handleIconMouseup() {
      if (this.mousedown && this.iconType === 'nextStep') {
        this.$router.push({ name: 'language-setting' });
      }
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

  .title {
    padding-top: 89px;
    height: 55px;
    font-family: $font-light;
    font-weight: lighter;
    font-size: 30px;
    color: rgba(255,255,255,0.90);
    letter-spacing: 2.14px;
    text-align: center;
    line-height: 30px;
  }
  .content {
    padding-top: 16px;
    width: 362px;
    height: 64px;
    font-family: $font-normal;
    font-size: 16px;
    color: rgba(255,255,255,0.20);
    letter-spacing: 1.14px;
    text-align: center;
    line-height: 24px;
  }
  .checkbox {
    margin-top: 25px;
  }
  .icon {
    width: 40px;
    height: 40px;
    padding-top: 42px;
  }
}
</style>
