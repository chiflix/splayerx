<template>
  <div id="app" class="application">
    <titlebar></titlebar>
    <router-view></router-view>
  </div>
</template>

<script>
  import Titlebar from '@/components/Titlebar.vue';
  export default {
    name: 'splayer',
    components: {
      Titlebar,
    },
  };
</script>

<style lang="scss">
// global scss
@import url('~@/css/style.scss');

</style>
