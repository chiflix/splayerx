<template>
  <div class="plus-minus">
    <div class="functionality"
      v-if="direction === 'column'">
      <div class="plus-button">
        +
      </div>
      <div class="current-speed">
        {{ speed }}
      </div>
      <div class="minus-button">
        -
      </div>
      <div class="">
        @
      </div>
    </div>
    <div class="brief-info"
      v-else-if="direction === 'row'">
      {{ speed + 'x' }}
    </div>
  </div>
</template>;

<script>
export default {
  props: {
    direction: String,
  },
  data() {
    return {
      speed: 1,
    };
  },
};
</script>

<style lang="scss">
.plus-minus {
  order: 2;

  .functionality {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }

  .brief-info {

  }
}
</style>
