<template>
  <div id="app" class="application">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'splayer',
    mounted() {
      if (process.platform === 'win32') {
        document.querySelector('.application').style.webkitAppRegion = 'no-drag';
        document.querySelector('.application').style.borderRadius = 0;
        document.querySelector('.video').style.borderRadius = 0;
        document.querySelector('.video-controller').style.borderRadius = 0;
      }
    },
  };
</script>

<style lang="scss">
// global scss
@import url('~@/css/style.scss');

</style>
