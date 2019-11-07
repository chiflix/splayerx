<template>
  <router-view />
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Product',
});
</script>
<style lang="scss">
  body {
    -webkit-app-region: drag;
    background-color: #3B3B41;
  }
  .fade-in {
    visibility: visible;
    opacity: 1;
    transition: opacity 100ms ease-in;
  }
  .fade-out {
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s 300ms, opacity 300ms ease-out;
  }
</style>
