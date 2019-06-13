<template>
  <div
    @mousedown="handleMousedown"
    @mouseup="handleMouseup"
    @mouseenter="handleMouseenter"
    @mouseleave="handleMouseleave"
  >
    <div
      :class="iconClass"
      class="icon-wrapper"
    >
      <Icon
        v-show="showPlayIcon"
        :class="animationMode"
        :style="{cursor: cursorAppear ? 'pointer' : 'none'}"
        class="icon play"
        type="play"
      />
      <Icon
        v-show="!showPlayIcon"
        :class="animationMode"
        :style="{cursor: cursorAppear ? 'pointer' : 'none'}"
        class="icon"
        type="pause"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'PlayButton',
  components: {
    Icon,
  },
  props: {
    paused: Boolean,
    isFocused: Boolean,
    attachedShown: Boolean,
    showAllWidgets: Boolean,
    mousedownOnVolume: Boolean,
    mousemovePosition: {
      type: Object,
      default: () => {},
    },
    handleMouseUp: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return {
      cursorAppear: false, // control whether the cursor show up or not
      mouseover: false,
      mousedown: false,
      showPlayIcon: false,
      animationMode: 'icon-ani-fade-in',
      iconClass: 'fade-out',
      iconFadingId: NaN,
      detectMovePosition: false,
      justCloseAttached: false,
      justFocused: false,
      justMousedownOnVolume: false,
    };
  },
  watch: {
    showAllWidgets(val: boolean) {
      if (!val && !this.mousedown) {
        this.cursorAppear = false;
        this.iconClass = 'fade-out';
      } else if (val && this.mouseover) {
        this.detectMovePosition = true;
      }
    },
    attachedShown(val: boolean, oldVal: boolean) {
      if (!val && this.mouseover) {
        if (oldVal) this.justCloseAttached = true;
        this.detectMovePosition = true;
      }
    },
    isFocused(val: boolean, oldVal: boolean) {
      if (val && !oldVal && this.mouseover) {
        this.justFocused = true;
      }
    },
    mousedownOnVolume(val: boolean, oldVal: boolean) {
      if (!val && oldVal) {
        this.justMousedownOnVolume = true;
        if (this.mouseover) this.detectMovePosition = true;
      }
    },
    mousemovePosition(newVal: {x: number; y: number}, oldVal: {x: number; y: number}) {
      if (this.detectMovePosition && this.isFocused) {
        if (Math.abs(newVal.x - oldVal.x) > 0 || Math.abs(newVal.y - oldVal.y) > 0) {
          this.justFocused = this.justCloseAttached = this.justMousedownOnVolume = false;
          this.cursorAppear = true;
          this.iconClass = 'fade-in';
          this.detectMovePosition = false;
        }
      }
    },
    paused(val: boolean) {
      this.showPlayIcon = val;
    },
  },
  created() {
    document.addEventListener('mouseup', () => {
      if (this.mousedown) {
        this.mousedown = false;
        this.animationMode = 'icon-ani-fade-in';
        this.$emit('update:playbutton-state', false);
      }
    });
  },
  methods: {
    handleMouseenter() {
      this.mouseover = true;
      if (!this.attachedShown && this.isFocused && !this.mousedownOnVolume) {
        this.cursorAppear = true;
        this.iconClass = 'fade-in';
        this.justMousedownOnVolume = false;
      } else if (!this.isFocused) {
        this.detectMovePosition = true;
      }
      if (this.iconFadingId) clearTimeout(this.iconFadingId);
    },
    handleMouseleave() {
      this.cursorAppear = this.mouseover = false;
      if (this.iconFadingId) clearTimeout(this.iconFadingId);
      this.iconFadingId = setTimeout(() => {
        this.iconClass = 'fade-out';
      }, 200);
    },
    handleMousedown() { // eslint-disable-line complexity
      if (this.justFocused || (this.showAllWidgets
        && (this.justCloseAttached || this.justMousedownOnVolume))) {
        this.justFocused = this.justCloseAttached = this.justMousedownOnVolume = false;
        this.cursorAppear = true;
        this.iconClass = 'fade-in';
      } else if (this.showAllWidgets && !this.attachedShown && this.isFocused) {
        this.cursorAppear = true;
        this.iconClass = 'fade-in';
        this.mousedown = true;
        this.animationMode = 'icon-ani-fade-out';
        this.$emit('update:playbutton-state', true);
      } else if (!this.showAllWidgets && !this.attachedShown && this.isFocused) {
        this.cursorAppear = true;
        this.iconClass = 'fade-in';
      }
    },
    handleMouseup() {
      if (this.mousedown && !this.attachedShown) {
        this.showPlayIcon = !this.showPlayIcon;
        this.handleMouseUp();
      }
    },
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
@keyframes fadein {
  0% {opacity: 0};
  100% {opacity: 1};
}
@keyframes fadeout {
  0% {opacity: 1};
  100% {opacity: 0};
}
.fade-in {
  animation: fadein 100ms linear 1 normal forwards;
}
.fade-out {
  animation: fadeout 300ms linear 1 normal forwards;
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
@media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
  .icon-wrapper {
    width: 54px;
    height: 54px;
  }
  .play {
    margin-left: 2px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .icon-wrapper {
    width: 67px;
    height: 67px;
  }
  .play {
    margin-left: 3px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .icon-wrapper {
    width: 93px;
    height: 93px;
  }
  .play {
    margin-left: 3px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .icon-wrapper {
    width: 129px;
    height: 129px;
  }
  .play {
    margin-left: 3px;
  }
}
</style>
