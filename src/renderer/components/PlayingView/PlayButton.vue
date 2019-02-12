<template>
<div :data-component-name="$options.name"
  @mouseenter.stop="handleMouseenter"
  @mouseleave.stop="handleMouseleave"
  @mousedown.stop="handleMousedown">
  <Icon v-fade-in="iconAppear && paused" class="icon" type="pause"/>
  <Icon v-fade-in="iconAppear && !paused" class="icon play" type="play"/>
</div>
</template>

<script>
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'play-button',
  props: {
    paused: false,
    attachedShown: false,
  },
  data() {
    return {
      iconAppear: false, // control whether the icon show up or not
      animateTimer: NaN,
      mouseOver: false,
    };
  },
  components: {
    Icon,
  },
  methods: {
    handleMouseenter() {
      this.mouseOver = true;
      if (!this.attachedShown) this.iconAppear = true;
    },
    handleMouseleave() {
      this.iconAppear = this.mouseOver = false;
    },
    handleMousedown() {
      if (!this.attachedShown) {
        this.$bus.$emit('toggle-playback');
      }
    },
  },
  watch: {
    paused() {
      this.iconAppear = true;
      if (this.animateTimer) {
        clearTimeout(this.animateTimer);
      }
      this.animateTimer = setTimeout(() => {
        if (!this.mouseOver) this.iconAppear = false;
      }, 1000);
    },
  },
};
</script>


<style lang="scss" scoped>
.icon {
  position: absolute;
  cursor: pointer;
}
@media screen and (max-aspect-ratio: 1/1) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
  .icon {
    width: 54px;
    height: 54px;
  }
  .play {
    left: 2px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .icon {
    width: 67px;
    height: 67px;
  }
  .play {
    left: 3px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .icon {
    width: 93px;
    height: 93px;
  }
  .play {
    left: 3px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .icon {
    width: 129px;
    height: 129px;
  }
  .play {
    left: 3px;
  }
}
</style>
