<template>
  <div class="editor-setting">
    <div class="title">
      {{ $t("preferences.translationEdit.quickEdit") }}
    </div>
    <BaseCheckBox
      v-model="enableQuickEdit"
    >
      {{ $t('preferences.translationEdit.quickEditDescription') }}
    </BaseCheckBox>
  </div>
</template>

<script>
import electron from 'electron';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'Editor',
  components: {
    BaseCheckBox,
  },
  data() {
    return {
    };
  },
  computed: {
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    enableQuickEdit: {
      get() {
        return !this.$store.getters.disableQuickEdit;
      },
      set(val) {
        this.$store.dispatch('quickEditStatus', !val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
  },
  watch: {
  },
  methods: {
  },
};
</script>
<style scoped lang="scss">
.editor-setting {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  .title {
    margin-bottom: 12px;
    font-family: $font-medium;
    font-size: 13px;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0;
    line-height: 13px;
  }
}
::-webkit-scrollbar {
  width: 3px;
  user-select: none;
}
/* Handle */
::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 1.5px;
}
::-webkit-scrollbar-track {
  cursor: pointer;
  border-radius: 2px;
  width: 10px;
  user-select: none;
}
</style>
