<template>
<div :data-component-name="$options.name"
  @mouseenter="handleMouseenter"
  @mouseleave="handleMouseleave">
  <div class="icon-wrapper"
    v-fade-in="iconAppear"
    @mousedown="handleMousedown"
    @mouseup="handleMouseup">
    <Icon class="icon play"
      type="play"
      ref="play"
      v-show="showPlayIcon"
      :class="ani_mode"
      :style="{cursor: iconAppear ? 'pointer' : 'none'}"/>
    <Icon class="icon"
      type="pause"
      ref="pause"
      v-show="!showPlayIcon"
      :class="ani_mode"
      :style="{cursor: iconAppear ? 'pointer' : 'none'}"/>
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
      showPlayIcon: false,
      ani_mode: 'icon-ani-fade-in',
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
      this.isMousedown = true;
      this.ani_mode = 'icon-ani-fade-out';
    },
    handleMouseup() {
      if (this.isMousedown && !this.attachedShown) {
        this.showPlayIcon = !this.showPlayIcon;
        this.ani_mode = 'icon-ani-fade-in';
        this.$bus.$emit('toggle-playback');
      }
    },
  },
  watch: {
    showAllWidgets(val) {
      if ((!val && !this.isMousedown) || (val && this.mouseOver)) this.iconAppear = val;
    },
    attachedShown(val) {
      if (!val && this.mouseOver) this.iconAppear = true;
    },
    paused(val) {
      this.showPlayIcon = val;
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
.icon-ani-fade-in {
  animation: ytp-bezel-fadein 110ms linear 1 normal forwards;
}
.icon-ani-fade-out {
  animation: ytp-bezel-fadeout 110ms linear 1 normal forwards;
}
@keyframes ytp-bezel-fadein {
  0% {opacity: 0.7; transform: scale(0.8)};
  100% {opacity: 1; transform: scale(1)};
}
@keyframes ytp-bezel-fadeout {
  0% {opacity: 1; transform: scale(1)};
  100% {opacity: 0.7; transform: scale(0.8)};
}
.scale-enter {
  opacity: 0.7;
  transform: scale(0.8);
}
.scale-enter-to {
  opacity: 1;
  transform: scale(1.0);
}
.icon-wrapper {
  position: relative;
}
.icon {
  position: absolute;
  width: 100%;
  height: 100%;
  transition: transform 90ms cubic-bezier(0, 1, 1, 1);
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
