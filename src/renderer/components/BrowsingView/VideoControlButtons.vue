<template>
  <div class="video-control-buttons" :style="{
    width: isDarwin === 'win32' ? '90px' : '96px',
    direction: isDarwin ? '' : 'rtl',
    order: isDarwin ? '2' : '0',
  }">
    <div class="left-border" :style="{ borderLeft: isDarwin ? '0.6px solid rgba(0, 0, 0, 0.2)' : '' }">
      <Icon type="download" class="download-icon" :style="{
        margin: isDarwin ? '6px 0 6px 17px' : '6px 24px 6px 0',
        cursor: 'pointer',
      }"></Icon>
      <Icon type="picInpic" class="picture-in-picture" :style="{
        margin: isDarwin ? '6px 20px 6px 23px' : '6px 15px 6px 15px',
        cursor: 'pointer',
      }"></Icon>
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
