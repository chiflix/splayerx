<template>
<div :data-component-name="$options.name"
  @mouseenter="handleMouseenter"
  @mouseleave="handleMouseleave">
  <div class="icon-wrapper"
    v-fade-in="iconAppear"
    @mousedown.left.stop="handleMousedown"
    @mouseup="handleMouseup">
    <transition name="scale" mode="out-in">
    <Icon :key="paused" :class="iconClass" :type="paused ? 'play' : 'pause'"/>
    </transition>
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
      isMousedown: false,
    };
  },
  components: {
    Icon,
  },
  computed: {
    iconClass() {
      return {
        icon: true,
        play: this.paused,
        'scale-enter': this.isMousedown,
      };
    },
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
      this.isMousedown = true;
    },
    handleMouseup() {
      if (!this.attachedShown) {
        this.$bus.$emit('toggle-playback');
      }
    },
  },
  watch: {
    showAllWidgets(val) {
      if (!val && !this.isMousedown) this.iconAppear = val;
    },
    attachedShown(val) {
      if (!val && this.mouseOver) this.iconAppear = true;
    },
  },
  created() {
    document.addEventListener('mouseup', () => {
      if (this.isMousedown) this.isMousedown = false;
    });
  },
};
</script>


<style lang="scss" scoped>
.scale-enter {
  transform: scale(0.8);
}
.scale-enter-to {
  transform: scale(1.0);
}
.icon-wrapper {
  position: relative;
}
.icon {
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: transform 50ms ease-in;
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
