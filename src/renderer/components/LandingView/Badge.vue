<template>
  <div class="badge default">
    <span><slot /></span>
  </div>
</template>

<style lang="scss">
.badge.default {
  padding: 0 13px;
  height: 21px;
  background-color: #3B3B41;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;

  span {
    font-size: 11px;
    opacity: 0.27;
    color: white;
  }
}
</style>
