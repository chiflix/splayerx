<template>
  <div class="privacy">
    <BaseCheckBox v-model="protectPrivacy">
      {{ $t('preferences.privacy.enable') }}
    </BaseCheckBox>
    <div
      :style="{ opacity: !protectPrivacy ? 0.3: 1.0 }"
      class="privacy_background"
    >
      <div class="privacy_radio">
        <BaseRadio
          v-model="radioValue"
          value="smartMode"
          name="mode"
        >
          {{ $t('preferences.privacy.smartMode') }} <span style="opacity: 0.6">Beta</span>
        </BaseRadio>
        <div class="privacy_radio_description">
          {{ $t('preferences.privacy.smartDescription') }}
        </div>
        <BaseRadio
          v-model="radioValue"
          value="incognitoMode"
          name="mode"
          class="privacy_radio2"
        >
          {{ $t('preferences.privacy.incognitoMode') }}
        </BaseRadio>
        <div class="privacy_radio_description">
          {{ $t('preferences.privacy.incognitoDescription') }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import electron from 'electron';
import BaseCheckBox from './BaseCheckBox.vue';
import BaseRadio from './BaseRadio.vue';

export default {
  name: 'Privacy',
  components: {
    BaseCheckBox,
    BaseRadio,
  },
  data() {
    return {
      radioValue: 'smartMode',
    };
  },
  computed: {
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    protectPrivacy: {
      get() {
        return this.$store.getters.protectPrivacy;
      },
      set(val: boolean) {
        if (val) {
          this.$store.dispatch('protectPrivacy').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        } else {
          this.$store.dispatch('notprotectPrivacy').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        }
      },
    },
    hideNSFW: {
      get() {
        return this.$store.getters.hideNSFW;
      },
      set(val: boolean) {
        this.$store.dispatch('hideNSFW', !!val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
  },
  watch: {
    radioValue(val: string) {
      if (val === 'smartMode') this.hideNSFW = true;
      else if (val === 'incognitoMode') this.hideNSFW = false;
    },
  },
  created() {
    if (this.protectPrivacy && !this.hideNSFW) this.radioValue = 'incognitoMode';
    else this.radioValue = 'smartMode';
  },
};
</script>
<style lang="scss" scoped>
.privacy {
  .checkbox:nth-of-type(1) {
    margin-top: 0;
  }
  &_background {
    width: 366px;
    height: fit-content;
    margin-top: 15px;
    background-color: rgba(0,0,0,0.05);
  }
  &_radio {
    margin-left: 29px;
    padding-top: 20px;
    padding-bottom: 20px;
    &2 {
      margin-top: 15px;
    }
    &_description {
      width: 282px;
      font-family: $font-medium;
      font-size: 11px;
      color: rgba(255,255,255,0.50);
      letter-spacing: 0;
      line-height: 16px;
      margin-top: 6px;
      margin-left: 27px;
    }
  }
}
</style>
