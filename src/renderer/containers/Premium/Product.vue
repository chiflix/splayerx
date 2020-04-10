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
  @media (prefers-color-scheme: light), (prefers-color-scheme: no-preference) {
    body {
      background-color: #434348;
    }
  }
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #434348;
    }
  }

  body {
    -webkit-app-region: drag;
    &.platform-win32 {
      padding-top: 36px;
      overflow: hidden;
    }
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
