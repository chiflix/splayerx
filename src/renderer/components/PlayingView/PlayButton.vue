<template>
<div :data-component-name="$options.name"
  @mouseenter.stop="handleMouseenter"
  @mouseleave.stop="handleMouseleave">
  <div class="icon-wrapper"
    @mousedown.stop="handleMousedown">
    <Icon :class="iconAppear && paused ? 'fade-in' : 'fade-out'" class="icon play" type="play"/>
    <Icon :class="iconAppear && !paused ? 'fade-in' : 'fade-out'" class="icon" type="pause"/>
  </div>
</div>
</template>

<script>
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'play-button',
  props: {
    paused: false,
    isFocused: true,
    attachedShown: false,
    showAllWidgets: false,
  },
  data() {
    return {
      iconAppear: false, // control whether the icon show up or not
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
    // showAllWidgets(val) {
    //   if (!this.isFocused && val) this.iconAppear = val;
    //   if (!val) this.iconAppear = val;
    // },
    attachedShown(val) {
      if (!val && this.mouseOver) this.iconAppear = true;
    },
  },
};
</script>


<style lang="scss" scoped>
.fade-in {
  visibility: visible;
  opacity: 1;
  transition: opacity 150ms ease-in;
}
.fade-out {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 300ms, opacity 300ms ease-out;
}
.icon-wrapper {
  position: relative;
}
.icon {
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
@media screen and (max-aspect-ratio: 1/1) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
  .icon-wrapper {
    width: 54px;
    height: 54px;
  }
  .play {
    margin-left: 2px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .icon-wrapper {
    width: 67px;
    height: 67px;
  }
  .play {
    margin-left: 3px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .icon-wrapper {
    width: 93px;
    height: 93px;
  }
  .play {
    margin-left: 3px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .icon-wrapper {
    width: 129px;
    height: 129px;
  }
  .play {
    margin-left: 3px;
  }
}
</style>
