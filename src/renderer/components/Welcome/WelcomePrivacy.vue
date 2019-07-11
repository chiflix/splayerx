<template>
  <div class="privacy">
    <div class="title">
      {{ $t('welcome.welcomeTitle') }}
    </div>
    <div class="content">
      {{ $t('welcome.welcomeDescription') }}
    </div>
    <BaseCheckBox
      v-model="privacyAgreement"
      class="checkbox"
    >
      {{ $t('welcome.agreement') }}<a @click.stop="handleLinkClick">{{ $t('welcome.policy') }}</a>
    </BaseCheckBox>
  </div>
</template>
<script lang="ts">
import BaseCheckBox from '@/components/Preferences/BaseCheckBox.vue';

export default {
  components: {
    BaseCheckBox,
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
}
</style>
