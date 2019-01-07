<template>
  <div class="content">
    <div class="winLogo"></div>
  </div>
</template>

<script>
export default {
  name: 'winAbout',
};
</script>

<style scoped lang="scss">
  .content {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    .winLogo {
      width: 96px;
      height: 96px;
    }
  }
</style>
