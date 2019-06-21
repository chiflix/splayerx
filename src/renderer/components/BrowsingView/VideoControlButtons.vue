<template>
  <div
    :style="{
      width: isDarwin === 'win32' ? '90px' : '96px',
      direction: isDarwin ? '' : 'rtl',
      order: isDarwin ? '2' : '0',
    }"
    class="video-control-buttons"
  >
    <div
      :style="{ borderLeft: isDarwin ? '0.6px solid rgba(0, 0, 0, 0.2)' : '' }"
      class="left-border"
    >
      <Icon
        :style="{
          margin: isDarwin ? '6px 0 6px 17px' : '6px 24px 6px 0',
          cursor: 'pointer',
        }"
        type="download"
        class="download-icon"
      />
      <Icon
        :style="{
          margin: isDarwin ? '6px 20px 6px 23px' : '6px 15px 6px 15px',
          cursor: 'pointer',
        }"
        type="picInpic"
        class="picture-in-picture"
      />
    </div>
  </div>
</template>

<script>
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'VideoControlButtons',
  components: {
    Icon,
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
};
</script>

<style scoped lang="scss">
.video-control-buttons {
  height: 40px;
  display: flex;
  .left-border {
    height: 28px;
    display: flex;
    margin: auto;
  }
}
</style>
