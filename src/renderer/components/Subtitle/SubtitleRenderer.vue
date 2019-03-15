<template>
  <div class="subtitle-loader">
    <subtitle-input
      v-if="!isProfessional"
      :key="subtitleInstance && subtitleInstance.id"
      :subtitleInstance="subtitleInstance"/>
    <subtitle-editor
      v-if="isProfessional"
      :subtitleInstance="subtitleInstance"/>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import SubtitleEditor from './SubtitleEditor.vue';
import SubtitleInput from './SubtitleInput.vue';
import SubtitleInstance from './SubtitleLoader/index';

export default {
  name: 'subtitle-renderer',
  props: {
    subtitleInstance: SubtitleInstance,
  },
  components: {
    SubtitleEditor,
    SubtitleInput,
  },
  data() {
    return {
    };
  },
  computed: {
    ...mapGetters([
      'duration', 'scaleNum', 'subtitleDelay', 'intrinsicHeight', 'intrinsicWidth', 'mediaHash', 'subToTop', 'subtitleList',
      'paused',
      'isEditable', 'isProfessional',
      'computedWidth', 'computedHeight', // to determine the subtitle renderer's container size
    ]),
  },
  watch: {
  },
  created() {
  },
  mounted() {
  },
  methods: {
  },
};
</script>
<style scoped lang="scss">
</style>
