<template>
  <div class="badge default">
    <span><slot /></span>
  </div>
</template>

<style lang="scss">
.badge.default {
  width: 70px;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.15);
  text-align: center;
  line-height: 20px;
  border-radius: 4px;

  span {
    font-size: 11px;
    opacity: 0.27;
    color: white;
  }
}
</style>
