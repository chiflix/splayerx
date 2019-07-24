<template>
  <div class="privacy">
    <BaseCheckBox v-model="reverseScrolling">
      {{ $t('preferences.general.reverseScrolling') }}
    </BaseCheckBox>
    <div class="privacy_radio">
      <BaseRadioGroup :value="false" v-model="radioValue">
        123
      </BaseRadioGroup>
      <BaseRadioGroup :value="true" v-model="radioValue">
        123
      </BaseRadioGroup>
      {{ radioValue }}
    </div>
  </div>
</template>
<script lang="ts">
import electron from 'electron';
import BaseCheckBox from './BaseCheckBox.vue';
import BaseRadioGroup from './BaseRadioGroup.vue';

export default {
  name: 'Privacy',
  components: {
    BaseCheckBox,
    BaseRadioGroup,
  },
  data() {
    return {
      radioValue: '',
    };
  },
  computed: {
    reverseScrolling: {
      get() {
        return this.$store.getters.reverseScrolling;
      },
      set(val: boolean) {
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
    hideVideoHistoryOnExit: {
      get() {
        return this.$store.getters.hideVideoHistoryOnExit;
      },
      set(val: boolean) {
        if (val) {
          this.$store.dispatch('hideVideoHistoryOnExit').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        } else {
          this.$store.dispatch('nothideVideoHistoryOnExit').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        }
      },
    },
  },
};
</script>
<style lang="scss" scoped>
.privacy {
  .checkbox:nth-of-type(1) {
    margin-top: 0;
    margin-bottom: 15px;
  }
  &_radio {
    width: 366px;
    height: 158px;
    background-color: rgba(0,0,0,0.05);
  }
}
</style>
