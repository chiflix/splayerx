<template>
  <div :data-component-name="$options.name"
    @mouseover="appearVolumeSlider"
    @mouseout="hideVolumeSlider">
    <transition name="fade">
    <div class="container"
      @mousedown.left="onVolumeSliderClick"
      v-show="showVolumeSlider">
      <div class="background" ref="sliderContainer">
        <div class="slider" ref="slider"
          :style="{ height: volume + '%' }">
        </div>
      </div>
    </div>
    </transition>
    <div @mousedown.left="onVolumeButtonClick">
      <Icon class="volume-icon" type="volume" :effect="srcOfVolumeButtonImage"></Icon>
    </div>
  </div>
</template>;

<script>
import Icon from '../IconContainer';
export default {
  name: 'volume-control',
  data() {
    return {
      showVolumeSlider: false,
      onVolumeSliderMousedown: false,
      currentVolume: 0,
      timeoutIdOfVolumeControllerDisappearDelay: 0,
      volumeMaskAppear: false,
    };
  },
  components: {
    Icon,
  },
  methods: {
    onVolumeButtonClick() {
      if (this.volume !== 0) {
        this.currentVolume = this.volume;
        this.$bus.$emit('volume', 0);
      } else {
        this.$bus.$emit('volume', this.currentVolume / 100);
      }
    },
    onVolumeSliderClick(e) {
      this.onVolumeSliderMousedown = true;
      const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
      let volumeHeight = sliderOffsetBottom - e.clientY;
      if (volumeHeight < 0) {
        volumeHeight = 0;
      } else if (volumeHeight > this.$refs.sliderContainer.clientHeight) {
        volumeHeight = this.$refs.sliderContainer.clientHeight;
      }
      this.$bus.$emit('volume', volumeHeight / this.$refs.sliderContainer.clientHeight);
      this.$_documentVoluemeDragClear();
      this.$_documentVolumeSliderDragEvent();
    },
    appearVolumeSlider() {
      this.showVolumeSlider = true;
    },
    hideVolumeSlider() {
      if (!this.onVolumeSliderMousedown) {
        this.showVolumeSlider = false;
      }
    },
    hideVolumeController() {
      if (!this.onVolumeSliderMousedown) {
        if (this.showVolumeSlider) {
          this.showVolumeSlider = false;
        }
      }
    },
    /**
     * @param e mousemove event
     */
    $_effectVolumeSliderDrag(e) {
      const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
      if (sliderOffsetBottom - e.clientY > 1) {
        const volume = (sliderOffsetBottom - e.clientY) / this.$refs.sliderContainer.clientHeight;
        if (volume >= 1) {
          this.$bus.$emit('volume', 1);
        } else {
          this.$bus.$emit('volume', volume);
        }
      } else {
        this.$bus.$emit('volume', 0);
      }
    },
    /**
     * $_documentVolumeSliderDragEvent fuction help to set a
     * mouse move event to change the volume when the
     * cursor is at mouse down event and is moved in
     * the screen.
     */
    $_documentVolumeSliderDragEvent() {
      document.onmousemove = (e) => {
        this.$_effectVolumeSliderDrag(e);
      };
    },
    /**
     * documentVolumeMoveClear function is an event to
     * clear the document mouse move event and clear
     * mouse down status
     */
    $_documentVoluemeDragClear() {
      document.onmouseup = () => {
        this.onVolumeSliderMousedown = false;
        document.onmousemove = null;
      };
    },
  },
  computed: {
    volume() {
      return 100 * this.$store.state.PlaybackState.Volume;
    },
    srcOfVolumeButtonImage() {
      let srcOfVolumeButtonImage;
      if (this.volume === 0) {
        srcOfVolumeButtonImage = 'mute';
      } else if (this.volume > 0 && this.volume <= 25) {
        srcOfVolumeButtonImage = 'level1';
      } else if (this.volume > 25 && this.volume <= 50) {
        srcOfVolumeButtonImage = 'level2';
      } else if (this.volume > 50 && this.volume <= 75) {
        srcOfVolumeButtonImage = 'level3';
      } else if (this.volume > 75 && this.volume <= 100) {
        srcOfVolumeButtonImage = 'level4';
      }
      return srcOfVolumeButtonImage;
    },
  },
  created() {
    this.$bus.$on('volumeslider-appear', () => {
      this.appearVolumeSlider();
      if (this.timeoutIdOfVolumeControllerDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfVolumeControllerDisappearDelay);
        this.timeoutIdOfVolumeControllerDisappearDelay
          = setTimeout(this.hideVolumeController, 3000);
      } else {
        this.timeoutIdOfVolumeControllerDisappearDelay
          = setTimeout(this.hideVolumeController, 3000);
      }
    });
  },
};
</script>

<style lang="scss" scoped>
.container {
  clip-path: inset(0px round 10px);
  backdrop-filter: blur(18px);
  display: flex;
  justify-content: space-around;
  align-items: center;
  -webkit-app-region: no-drag;
  position: absolute;
  background-color: rgba(0, 0, 0, 0.2);
  &:hover {
    cursor: pointer;
  }

  .background{
    position: absolute;
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.2);
  }
  .slider {
    width: 100%;
    position: absolute;
    bottom: 0;
    background: rgba(255,255,255,0.7);
    border-radius: 1px;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    bottom: 30px;
    width: 30px;
    height: 126px;
    .background {
      width: 4px;
      height: 100px;
    }
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    bottom: 40px;
    width: 34px;
    height: 164px;
    .background {
      width: 4px;
      height: 134px;
    }
  }
  @media screen and (min-width: 1921px) {
    bottom: 66px;
    width: 51px;
    height: 260px;
    .background {
      width: 4px;
      height: 214px;
    }
  }
}
button {
  .volume-icon {
    position: absolute;
    left: 0;
    bottom: 0;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    height: 30px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    height: 40px;
  }
  @media screen and (min-width: 1921px) {
    height: 66px;
  }
}
.fade-enter-active {
 transition: opacity 100ms;
}

.fade-leave-active {
 transition: opacity 200ms;
}

.fade-enter-to, .fade-leave {
 opacity: 1;
}

.fade-enter, .fade-leave-to {
 opacity: 0;
}
</style>
