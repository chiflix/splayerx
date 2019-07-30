<template>
  <div class="privacy">
    <BaseCheckBox v-model="protectPrivacy">
      {{ $t('preferences.general.reverseScrolling') }}
    </BaseCheckBox>
    <div
      :style="{ opacity: !protectPrivacy ? 0.3: 1.0 }"
      class="privacy_background"
    >
      <div class="privacy_radio">
        <BaseRadio
          v-model="radioValue"
          value="intelligentMode"
          name="mode"
        >
          {{ $t('preferences.privacy.intelligentMode') }}
        </BaseRadio>
        <div class="privacy_radio_description">
          {{ $t('preferences.privacy.intelligentDescription') }}
        </div>
        <BaseRadio
          v-model="radioValue"
          value="seamlessMode"
          name="mode"
          class="privacy_radio2"
        >
          {{ $t('preferences.privacy.seamlessMode') }}
        </BaseRadio>
        <div class="privacy_radio_description">
          {{ $t('preferences.privacy.seamlessDescription') }}
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
      radioValue: 'intelligentMode',
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
      if (val === 'intelligentMode') this.hideNSFW = true;
      else if (val === 'seamlessMode') this.hideNSFW = false;
    },
  },
  created() {
    if (this.protectPrivacy && !this.hideNSFW) this.radioValue = 'seamlessMode';
    else this.radioValue = 'intelligentMode';
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
    height: 158px;
    margin-top: 15px;
    background-color: rgba(0,0,0,0.05);
  }
  &_radio {
    margin-left: 29px;
    padding-top: 20px;
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
