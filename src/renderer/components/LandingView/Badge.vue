<template>
  <div class="badge default">
    <span><slot /></span>
  </div>
</template>

<style lang="scss">
.badge.default {
  padding: 0 13px;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.15);
  text-align: center;
  // magic trick to center span in div (step #2)
  line-height: 20px;
  text-align: center;
  border-radius: 4px;

  span {
    // magic trick to center span in div (step #2)
    display: inline-block;
    vertical-align: middle;
    font-size: 11px;
    opacity: 0.27;
    color: white;
  }
}
</style>
