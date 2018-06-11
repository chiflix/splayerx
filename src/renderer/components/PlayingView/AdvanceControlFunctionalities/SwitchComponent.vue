<template>
  <div class="switch">
    <div class="functionality"
      v-if="direction === 'column'">
      <div class="on-button"
      @mousedown="currentState = true">
        On
      </div>
      <div class="off-button"
       @mousedown="currentState = false">
        Off
      </div>
    </div>
    <div class="brief-info"
      v-else-if="direction === 'row'">
      {{ breifInfo }}
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
      currentState: true,
    };
  },
  computed: {
    breifInfo() {
      return this.currentState ? 'On' : 'Off';
    },
  },
};
</script>

<style lang="scss">
.switch {
  order: 2;

  .functionality {
    font-size: 16px;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }
  .on-button:hover, .off-button:hover {
    cursor: pointer;
  }
}
</style>
