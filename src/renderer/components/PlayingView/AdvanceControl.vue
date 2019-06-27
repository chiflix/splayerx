<template>
  <div>
    <div class="advanceControl">
      <transition name="advance-trans-l">
        <div
          v-show="showAttached"
          :style="{
            transition: showAttached ? '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)' :
              '150ms cubic-bezier(0.17, 0.67, 0.17, 0.98)'
          }"
          class="advanced"
        >
          <advance-main-menu
            :clear-state="showAttached"
            class="mainMenu"
          />
        </div>
      </transition>
      <div
        ref="adv"
        @mouseup.left="toggleAdvMenuDisplay"
        @mousedown.left="handleDown"
        @mouseenter="handleEnter"
        @mouseleave="handleLeave"
      >
        <lottie
          :options="defaultOptions"
          @animCreated="handleAnimation"
          lot="advance"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
//  @ts-ignore
import { mapActions, mapGetters, mapState } from 'vuex';
import { AnimationItem } from 'lottie-web';
import lottie from '@/components/lottie.vue';
import animationData from '@/assets/advance.json';
import { Input as InputActions } from '@/store/actionTypes';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import AdvanceMainMenu from '@/containers/AdvanceMainMenu.vue';

export default {
  name: 'AdvanceControl',
  //  @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    lottie,
    'advance-main-menu': AdvanceMainMenu,
  },
  props: {
    showAttached: Boolean,
    lastDragging: Boolean,
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
  computed: {
    ...mapGetters(['originSrc']),
    ...mapState({
      currentMousedownComponent: ({ Input }) => Input.mousedownComponentName,
      currentMouseupComponent: ({ Input }) => Input.mouseupComponentName,
    }),
  },
  watch: {
    originSrc() {
      this.$emit('update:showAttached', false);
    },
    showAttached(val: boolean) {
      if (!val) {
        this.animFlag = true;
        if (!this.validEnter) {
          this.anim.playSegments([68, 89], true);
        } else {
          this.showFlag = true;
          this.anim.playSegments([68, 83], true);
          setTimeout(() => { this.showFlag = false; }, 250);
        }
      }
    },
    currentMousedownComponent(val: string) {
      if (val !== 'notification-bubble' && val !== '') {
        if (val !== this.$options.name && this.showAttached) {
          this.anim.playSegments([37, 41], true);
          this.clearMouseup({ componentName: '' });
        }
      }
    },
    currentMouseupComponent(val: string) {
      setTimeout(() => {
        if (this.currentMousedownComponent !== 'notification-bubble' && val !== '') {
          if (this.lastDragging || (this.currentMousedownComponent === this.$options.name
              && val === 'the-video-controller')) {
            if (this.showAttached) {
              this.anim.playSegments([68, 73], true);
              this.$emit('update:lastDragging', false);
            }
            this.clearMousedown({ componentName: '' });
          } else if (val !== this.$options.name && this.showAttached) {
            this.$emit('update:showAttached', false);
          }
        }
      }, 0);
    },
  },
  methods: {
    ...mapActions({
      clearMousedown: InputActions.MOUSEDOWN_UPDATE,
      clearMouseup: InputActions.MOUSEUP_UPDATE,
    }),
    handleAnimation(anim: AnimationItem) {
      this.anim = anim;
    },
    handleDown() {
      this.mouseDown = true;
      if (!this.showAttached) {
        this.anim.playSegments([17, 21], true);
      } else {
        this.clearMouseup({ componentName: '' });
        this.anim.playSegments([37, 41], true);
      }
      document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          if (!this.showAttached) {
            if (this.validEnter) {
              this.anim.playSegments([23, 36], true);
            } else if (this.currentMousedownComponent === this.$options.name) {
              this.anim.playSegments([105, 109], true);
            }
          } else if (this.currentMousedownComponent === this.$options.name
            && this.currentMouseupComponent !== this.$options.name) {
            this.anim.playSegments([68, 73], true);
          }
          this.mouseDown = false;
        }
      });
    },
    handleEnter() {
      if (this.animFlag && !this.showAttached) {
        if (!this.mouseDown) {
          this.anim.playSegments([3, 7], true);
        } else {
          this.anim.playSegments([95, 99], true);
        }
      }
      this.showFlag = false;
      this.validEnter = true;
      this.animFlag = false;
    },
    handleLeave() {
      if (!this.showAttached) {
        if (this.mouseDown) {
          this.anim.playSegments([90, 94], true);
        } else if (this.showFlag) {
          this.anim.addEventListener('complete', () => {
            this.anim.playSegments([10, 14], true);
            this.showFlag = false;
            this.anim.removeEventListener('complete');
          });
        } else {
          this.anim.playSegments([10, 14], true);
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
          this.$emit('conflict-resolve', this.$options.name);
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
};
</script>

<style lang="scss" scoped>
.advanced {
  position: absolute;
  z-index: 100;
  transition-property: opacity, transform;
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    display: none;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    bottom: 32px;
    right: 3px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    bottom: 44px;
    right: 3px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    bottom: 70px;
    right: 7px;
  }
  .mainMenu, .subtitleSetup, .audioItems {
    position: absolute;
    right: 0;
    bottom: 0;
  }
}
.advance-trans-l-enter, .advance-trans-l-leave-active {
  transform: translateY(20px);
}
.advance-trans-l-enter-active, .advance-trans-l-leave {
  opacity: 1;
}
.advance-trans-l-enter, .advance-trans-l-leave-active {
  opacity: 0;
}
.advance-trans-l-leave-active {
  position: absolute;
}
</style>
