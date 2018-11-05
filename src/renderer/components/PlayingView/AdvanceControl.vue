<template>
  <div :data-component-name="$options.name">
    <div class="advanceControl">
      <div class="advanced" v-show="showAttached">
        <advance-main-menu class="mainMenu" v-show="stateMessage[0]"></advance-main-menu>
        <advance-subtitle-setup class="subtitleSetup" v-show="stateMessage[1]"></advance-subtitle-setup>
        <advance-audio-items class="audioItems" v-show="stateMessage[2]"></advance-audio-items>
      </div>
      <div ref="adv" @mouseup.left="toggleAdvMenuDisplay" @mousedown.left="handleDown" @mouseenter="handleEnter" @mouseleave="handleLeave">
        <lottie v-on:animCreated="handleAnimation" :options="defaultOptions" lot="advance"></lottie>
      </div>
    </div>
  </div>
</template>

<script>
import lottie from '@/components/lottie.vue';
import * as animationData from '@/assets/advance.json';
import AdvanceMainMenu from './AdvanceControlFunctionalities/AdvanceMainMenu.vue';
import AdvanceSubtitleSetup from './AdvanceControlFunctionalities/AdvanceSubtitleSetup';
import AdvanceAudioItems from './AdvanceControlFunctionalities/AdvanceAudioItems';
export default {
  name: 'advance-control',
  components: {
    lottie,
    'advance-main-menu': AdvanceMainMenu,
    'advance-subtitle-setup': AdvanceSubtitleSetup,
    'advance-audio-items': AdvanceAudioItems,
  },
  props: {
    showAttached: Boolean,
    mousedownOnOther: Boolean,
    mouseupOnOther: Boolean,
  },
  computed: {
    stateMessage() {
      return this.$store.getters.stateInfo;
    },
  },
  data() {
    return {
      isAcitve: false,
      defaultOptions: { animationData },
      animationSpeed: 1,
      anim: {},
      animFlag: true,
      mouseDown: false,
      validEnter: false,
      clicks: 0,
      showFlag: false,
      mainShow: true,
      subShow: false,
      audioShow: false,
    };
  },
  watch: {
    showAttached(val) {
      if (!val) {
        this.animFlag = true;
        if (!this.validEnter) {
          this.anim.playSegments([68, 89], false);
        } else {
          this.showFlag = true;
          this.anim.playSegments([68, 83], false);
          setTimeout(() => { this.showFlag = false; }, 250);
        }
      }
    },
    mousedownOnOther(val) {
      if (val && this.showAttached) {
        this.anim.playSegments([37, 41], false);
        if (this.mouseupOnOther) {
          this.$emit('update:showAttached', false);
        }
      }
    },
    mouseupOnOther(val) {
      if (val && this.showAttached) {
        this.$emit('update:showAttached', false);
      }
    },
  },
  methods: {
    handleAnimation(anim) {
      this.anim = anim;
    },
    handleDown() {
      this.mouseDown = true;
      if (!this.showAttached) {
        this.anim.playSegments([17, 21], false);
      } else {
        this.anim.playSegments([37, 41], false);
      }
      document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          if (!this.showAttached) {
            if (this.validEnter) {
              this.anim.playSegments([23, 36], false);
            } else if (!this.mousedownOnOther) {
              this.anim.playSegments([105, 109], false);
            }
          }
          this.mouseDown = false;
        }
      });
    },
    handleEnter() {
      if (this.animFlag && !this.showAttached) {
        if (!this.mouseDown) {
          this.anim.playSegments([3, 7], false);
        } else {
          this.anim.playSegments([95, 99], false);
        }
      }
      this.showFlag = false;
      this.validEnter = true;
      this.animFlag = false;
    },
    handleLeave() {
      if (!this.showAttached) {
        if (this.mouseDown) {
          this.anim.playSegments([90, 94], false);
        } else if (this.showFlag) {
          this.anim.addEventListener('complete', () => {
            this.anim.playSegments([10, 14], false);
            this.showFlag = false;
            this.anim.removeEventListener('complete');
          });
        } else {
          this.anim.playSegments([10, 14], false);
        }
        this.animFlag = true;
      }
      this.validEnter = false;
    },
    toggleAdvMenuDisplay() {
      this.clicks = this.showAttached ? 1 : 0;
      this.clicks += 1;
      switch (this.clicks) {
        case 1:
          this.$emit('update:showAttached', true);
          break;
        case 2:
          this.$emit('update:showAttached', false);
          this.clicks = 0;
          break;
        default:
          this.clicks = 0;
          break;
      }
    },
  },
  created() {
    this.$bus.$on('change-menu-list', (changedLevel) => {
      this.menuList = changedLevel;
      this.$_fitMenuSize();
    });
  },
};
</script>

<style lang="scss" scoped>
button {
  border: none;
}
button:focus {
  outline: none;
}
button:hover {
  cursor: pointer;
}
.advanced {
  position: absolute;
  width: auto;
  height: auto;
  bottom: 36px;
  right: -2px;
  z-index: 10;
  .mainMenu, .subtitleSetup, .audioItems {
    position: relative;
    left: 0;
    top: 0;
  }
}

</style>
