<template>
  <div class="plus-minus">
    <div class="functionality"
      v-if="direction === 'column'">
      <div class="minus-button"
      @mousedown="onMinusButtonClick">
        -
      </div>
      <div class="current-speed">
        {{ playbackRate }}x
      </div>
      <div class="plus-button"
       @mousedown="onPlusButtonClick">
        +
      </div>
      <div class="reset-button"
      @mousedown="onResetButtonClick">
        @
      </div>
    </div>
    <div class="brief-info"
      v-else-if="direction === 'row'">
      {{ playbackRate + 'x' }}
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
      //
    };
  },
  methods: {
    onMinusButtonClick() {
      if (this.playbackRate > 0) {
        this.$store.commit('PlaybackRate', this.playbackRate - 0.1);
      } else {
        this.$store.commit('PlaybackRate', 0);
      }
    },
    onPlusButtonClick() {
      this.$store.commit('PlaybackRate', this.playbackRate + 0.1);
    },
    onResetButtonClick() {
      this.$store.commit('PlaybackRate', 1);
    },
  },
  computed: {
    playbackRate() {
      return Math.round(this.$store.state.PlaybackState.PlaybackRate * 10) / 10;
    },
  },
};
</script>

<style lang="scss">
.plus-minus {
  order: 2;

  .functionality {
    font-size: 16px;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }

  .plus-button:hover, .minus-button:hover, .reset-button:hover {
    cursor: pointer;
  }

  .current-speed {
    cursor: default;
    width: 5px;
  }

  .brief-info {

  }
}
</style>
