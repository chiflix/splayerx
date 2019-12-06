<template>
  <div class="editor-setting">
    <BaseCheckBox v-model="enableQuickEdit">
      {{ $t("preferences.translationEdit.quickEdit") }}
    </BaseCheckBox>
    <div class="settingItem__description">
      {{ $t('preferences.translationEdit.quickEditDescription') }}
    </div>
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
  .checkbox:nth-of-type(1) {
    margin-top: 0;
  }
  .settingItem {
    margin-top: 30px;
    &__title {
      font-family: $font-medium;
      font-size: 14px;
      color: rgba(255,255,255,0.7);
    }

    &__description {
      font-family: $font-medium;
      font-size: 12px;
      color: rgba(255,255,255,0.25);
      margin-top: 7px;
    }
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
