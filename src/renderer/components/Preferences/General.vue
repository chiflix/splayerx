<template>
<div class="preference-setting">
  <BaseCheckBox
    :checkboxValue="deleteVideoHistoryOnExit"
    @update:checkbox-value="deleteVideoHistoryOnExit = $event">
    {{ $t('preferences.general.clearHistory') }}
  </BaseCheckBox>
  <BaseCheckBox
    :checkboxValue="$i18n.locale === 'zhCN'"
    @update:checkbox-value="displayLanguage = 'zhCN'">
    {{ '中文' }}
  </BaseCheckBox>
  <BaseCheckBox
    :checkboxValue="$i18n.locale === 'en'"
    @update:checkbox-value="displayLanguage = 'en'">
    {{ '英文' }}
  </BaseCheckBox>
</div>
</template>

<script>
import electron from 'electron';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'General',
  components: {
    BaseCheckBox,
  },
  data() {
    return {
    };
  },
  watch: {
    displayLanguage(val) {
      this.$i18n.locale = val;
    },
  },
  computed: {
    preferenceData() {
      return this.$store.getters.preferenceData;
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
  },
  methods: {
  },
};
</script>
<style scoped lang="scss">
.preference-setting {
  box-sizing: border-box;
  padding-top: 37px;
  padding-left: 26px;
  width: 100%;
  height: 100%;
}
</style>
