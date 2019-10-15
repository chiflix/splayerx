<template>
  <div class="privacy">
    <div class="title">
      {{ $t('welcome.welcomeTitle') }}
    </div>
    <div class="content">
      {{ $t('welcome.welcomeDescription') }}
    </div>
    <p class="privacy-content">
      {{ $t('welcome.agreement') }}
      <u @click="handleLinkClick">{{ $t('welcome.policy') }}</u>
    </p>
  </div>
</template>
<script lang="ts">

export default {
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
    handleLinkClick() {
      if (this.$i18n && this.$i18n.locale === 'zh-Hans') this.$electron.shell.openExternal('http://splayer.org/zh-Hans/terms/');
      else if (this.$i18n && this.$i18n.locale === 'zh-Hant') this.$electron.shell.openExternal('http://splayer.org/zh-Hant/terms/');
      else this.$electron.shell.openExternal('http://splayer.org/en/terms/');
    },
  },
};
</script>
<style lang="scss" scpoed>
.privacy {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  height: 270px;

  .title {
    padding-top: 89px;
    height: 55px;
    font-family: $font-medium;
    font-weight: lighter;
    font-size: 30px;
    color: rgba(255,255,255,0.90);
    letter-spacing: 2.14px;
    text-align: center;
    line-height: 30px;
  }
  .content {
    padding-top: 33px;
    width: 368px;
    height: 64px;
    font-family: $font-normal;
    font-size: 16px;
    color: rgba(255,255,255,0.20);
    letter-spacing: 0;
    text-align: center;
    line-height: 24px;
  }
  .privacy-content {
    margin-top: 40px;
    font-family: $font-medium;
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.3px;
    line-height: 19px;
    user-select: none;
    u {
      display: inline;
      cursor: pointer;
    }
  }
}
</style>
