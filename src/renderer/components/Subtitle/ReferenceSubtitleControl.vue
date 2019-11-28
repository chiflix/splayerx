<template>
  <div
    ref="subControl"
    class="sub-control"
  >
    <div class="sub-btn-control">
      <transition name="sub-trans-l">
        <div
          v-show="showAttached"
          :style="{
            cursor: 'default',
            transition: showAttached ? '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)' :
              '150ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
            height: `${contHeight + hoverHeight}px`,
            fontWeight: '900',
          }"
          class="no-drag sub-menu-wrapper subtitle-scroll-items"
        >
          <div
            class="backdrop-fallback element bottom"
          >
            <div class="element content">
              <div class="topContainer">
                <p>{{ this.$t('msg.subtitle.referenceSubtitleSelect') }}</p>
              </div>
              <subtitle-list
                :computed-size="computedSize"
                :current-subtitle-index="currentSubtitleIndex"
                :no-subtitle="$t('msg.subtitle.noReferenceSubtitle')"
                :real-items-num="realItemsNum"
                :computed-available-items="computedAvailableItems"
                :hover-height.sync="hoverHeight"
                :item-height="itemHeight"
                :trans-flag.sync="transFlag"
                :show-attached="showAttached"
                :change-subtitle="changeSubtitle"
              />
            </div>
          </div>
        </div>
      </transition>
    </div>
    <div
      ref="sub"
      @mouseup.left="toggleSubMenuDisplay"
      @mousedown.left="handleDown"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
      class="sub-control-btn"
    >
      <!-- <lottie
        :options="defaultOptions"
        @animCreated="handleAnimation"
        lot="playlist"
      /> -->
      <Icon
        type="referenceSubtitle"
      />
    </div>
  </div>
</template>
<script lang="ts">
import {
  mapActions, mapGetters, mapState,
} from 'vuex';
import { AnimationItem } from 'lottie-web';
import {
  Input as InputActions,
  Editor as edActions,
} from '@/store/actionTypes';
import { ISubtitleControlListItem, Type } from '@/interfaces/ISubtitle';
// import lottie from '@/components/lottie.vue';
// import animationData from '@/assets/playlist.json';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import ReferenceSubtitleList from '@/components/Subtitle/ReferenceSubtitleList.vue';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'ReferenceSubtitleControl',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    // lottie,
    Icon,
    'subtitle-list': ReferenceSubtitleList,
  },
  props: {
    showAttached: {
      type: Boolean,
      default: false,
    },
    lastDragging: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      defaultOptions: { animationData: '' },
      anim: {},
      validEnter: false,
      clicks: 0,
      hoverHeight: 0,
      transFlag: true,
    };
  },
  computed: {
    ...mapGetters([
      'winWidth', 'originSrc', 'calculatedNoSub', 'winHeight', 'winRatio',
      'list', 'referenceSubtitle',
      'paused',
      'isProfessional',
    ]),
    ...mapState({
      // @ts-ignore
      currentMousedownComponent: ({ Input }) => Input.mousedownComponentName,
      // @ts-ignore
      currentMouseupComponent: ({ Input }) => Input.mouseupComponentName,
    }),
    computedSize() {
      return this.winRatio >= 1 ? this.winHeight : this.winWidth;
    },
    iconOpacity() {
      return this.isShowingHovered ? 0.9 : 0.77;
    },
    itemHeight() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 27;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 32;
      }
      return 44;
    },
    contHeight() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return (this.realItemsNum * 31) + 45;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return (this.realItemsNum * 37) + 54;
      }
      return (this.realItemsNum * 51) + 76;
    },
    computedAvailableItems() {
      const list = this.list
        .filter((sub: ISubtitleControlListItem) => sub.type !== Type.Modified)
        .map((sub: ISubtitleControlListItem) => ({
          ...sub,
          name: this.getSubName(sub),
        }));
      list.push({
        id: '',
        name: this.$t('msg.advanced.loadLocalSubtitleFile'),
      });
      return list;
    },
    realItemsNum() {
      return this.computedAvailableItems.length + 1;
    },
    currentSubtitleIndex() {
      const { computedAvailableItems, referenceSubtitle } = this;
      if (!referenceSubtitle) return -1;
      return computedAvailableItems
        .findIndex((sub: ISubtitleControlListItem) => sub.id === referenceSubtitle.id);
    },
  },
  watch: {
    showAttached(val: boolean) {
      if (!val) {
        this.anim.playSegments([79, 92], true);
      }
    },
    currentMousedownComponent(val: string) {
      if (val !== 'notification-bubble' && val !== '') {
        if (val !== this.$options.name && this.showAttached) {
          this.anim.playSegments([62, 64], true);
          this.clearMouseup({ componentName: '' });
        }
      }
    },
    currentMouseupComponent(val: string) {
      setTimeout(() => {
        if (this.currentMousedownComponent !== 'notification-bubble' && val !== '') {
          if (this.lastDragging
            || (this.currentMousedownComponent === this.$options.name
              && val === 'the-video-controller')) {
            if (this.showAttached) {
              this.anim.playSegments([79, 85]);
              this.$emit('update:lastDragging', false);
            }
            this.clearMousedown({ componentName: '' });
          } else if (val !== this.$options.name && this.showAttached && this.clicks !== 1) {
            this.$emit('update:showAttached', false);
          }
        }
      }, 0);
    },
  },
  mounted() {
    document.addEventListener('mouseup', () => {
      if (this.validEnter) {
        this.anim.playSegments([47, 51], true);
      } else if (this.currentMousedownComponent === this.$options.name) {
        this.anim.playSegments([37, 41], true);
      }
      this.mouseDown = false;
    });
    document.addEventListener('wheel', this.handleWheel);
  },
  destroyed() {
    document.removeEventListener('wheel', this.handleWheel);
  },
  methods: {
    ...mapActions({
      clearMousedown: InputActions.MOUSEDOWN_UPDATE,
      clearMouseup: InputActions.MOUSEUP_UPDATE,
      updateWheel: InputActions.WHEEL_UPDATE,
      switchReference: edActions.SWITCH_REFERENCE_SUBTITLE,
      loadReferenceFromLocal: edActions.SUBTITLE_EDITOR_LOAD_LOCAL_SUBTITLE,
    }),
    handleAnimation(anim: AnimationItem) {
      this.anim = anim;
    },
    toggleSubMenuDisplay() {
      if (this.mouseDown) {
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
      }
    },
    handleDown() {
      this.mouseDown = true;
      this.anim.playSegments([15, 19], true);
    },
    handleEnter() {
      if (this.animFlag) {
        if (!this.mouseDown) {
          this.anim.playSegments([9, 13], true);
        } else {
          this.anim.playSegments([27, 31], true);
        }
      }
      this.validEnter = true;
      this.animFlag = false;
    },
    handleLeave() {
      if (this.mouseDown) {
        this.anim.playSegments([21, 25], true);
      } else {
        this.anim.playSegments([3, 7], true);
      }
      this.animFlag = true;
      this.validEnter = false;
    },
    getSubName(item: ISubtitleControlListItem) {
      if (item.type === Type.Embedded) {
        return `${this.$t('subtitle.embedded')} ${item.name}`;
      } if (item.type === Type.Modified) {
        return `${this.$t('subtitle.modified')} ${item.name}`;
      }
      return item.name;
    },
    changeSubtitle(item?: ISubtitleControlListItem) {
      const { referenceSubtitle } = this;
      if ((item && referenceSubtitle && item.id === referenceSubtitle.id)
        || (!item && !referenceSubtitle)) return;
      if (item && item.id === '') {
        this.loadReferenceFromLocal();
        return;
      }
      this.switchReference(item);
    },
  },
};
</script>
<style lang="scss" scoped>
.sub-control {
  position: absolute;
  z-index: 14;
  .sub-control-btn {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  .btn:hover, .sub-item:hover {
    cursor: pointer;
  }
  .sub-trans-l-enter, .sub-trans-l-enter-active {
    transform: translateY(0px);
  }
  .sub-trans-l-enter, .sub-trans-l-leave-active {
    transform: translateY(20px);
  }

  .sub-menu-wrapper {
    transition-property: opacity, transform;
    border-radius: 7px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    box-sizing: content-box;
    .element {
      border-radius: 7px;
      position: absolute;
      box-sizing: inherit;
    }
    .bottom {
      overflow: hidden;
      width: 100%;
      height: 100%;
      top: 0;
    }
    .middle {
      width: 100%;
      height: 100%;
      top: 0;
      background: rgba(255, 255, 255, 0.2);
    }
    .content {
      width: calc(100% - 2px);
      height: calc(100% - 2px);
      top: 1px;
      left: 1px;
      background-color: transparent;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
      p {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
  .firstSub, .secondarySub {
    transition: color 90ms linear;
  }
  .refresh {
    cursor: pointer;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    display: none;
    .sub-menu-wrapper {
      display: none;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    right: 25px;
    bottom: 25px;
    width: 26.4px;
    height: 22px;
    .sub-menu-wrapper {
      height: auto;
      min-width: 120px;
      max-height: 138px;
    }
    .topContainer {
      cursor: default;
      width: 100%;
      height: 39px;
      display: flex;
      flex-direction: row;
      p {
        margin: 15px 0 auto 10px;
        letter-spacing: 0.2px;
        line-height: 15px;
        font-size: 13px;
      }
      .refresh {
        width: 13px;
        height: 13px;
        margin: 14px 15px auto auto;
      }
      .subtitleShift {
        width: 30px;
        height: 13px;
        background: rgba(0, 0, 0, 0.09);
        margin: 15px auto auto 6px;
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        .firstSub, .secondarySub {
          width: 50%;
          height: 100%;
          font-size: 9px;
          display: flex;
          span {
            margin: auto;
          }
        }
      }
    }
    .sub-menu-wrapper {
      position: absolute;
      bottom: 32px;
      left: -98px;
      width: 120px;
      max-height: 138px;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    right: 30px;
    bottom: 29px;
    width: 38.4px;
    height: 32px;
    .sub-menu-wrapper {
      height: auto;
      max-height: 239px;
      min-width: 175px;
    }
    .topContainer {
      cursor: default;
      width: 100%;
      height: 47px;
      display: flex;
      flex-direction: row;
      p {
        margin: 18px 0 auto 20.04px;
        letter-spacing: 0.23px;
        line-height: 17px;
        font-size: 15.6px;
      }
      .refresh {
        width: 17px;
        height: 17px;
        margin: 17px 19px auto auto;
      }
      .subtitleShift {
        width: 36px;
        height: 16px;
        background: rgba(0, 0, 0, 0.09);
        margin: 17px auto auto 7.2px;
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        .firstSub, .secondarySub {
          width: 50%;
          height: 100%;
          font-size: 11px;
          display: flex;
          span {
            margin: auto;
          }
        }
      }
    }
    .sub-menu-wrapper {
      position: absolute;
      bottom: 44px;
      left: -143px;
      width: 175px;
      max-height: 239px;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    right: 45px;
    bottom: 37px;
    width: 60px;
    height: 50px;
    .sub-menu-wrapper {
      height: auto;
      max-height: 433px;
      min-width: 280px;
    }
    .topContainer {
      cursor: default;
      width: 100%;
      height: 64px;
      display: flex;
      flex-direction: row;
      p {
        margin: 24px 0 auto 28.48px;
        letter-spacing: 0.32px;
        line-height: 23px;
        font-size: 21.84px;
      }
      .refresh {
        width: 21px;
        height: 21px;
        margin: 23px 26px auto auto;
      }
      .subtitleShift {
        width: 50.4px;
        height: 22px;
        background: rgba(0, 0, 0, 0.09);
        margin: 23px auto auto 10.08px;
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        .firstSub, .secondarySub {
          width: 50%;
          height: 100%;
          font-size: 15px;
          display: flex;
          span {
            margin: auto;
          }
        }
      }
    }
    .sub-menu-wrapper {
      position: absolute;
      bottom: 70px;
      left: -219px;
      width: 270px;
      max-height: 433px;
    }
  }
}

.sub-trans-l-enter-active, .sub-trans-l-leave {
  opacity: 1;
}
.sub-trans-l-enter, .sub-trans-l-leave-active {
  opacity: 0;
}
.sub-trans-l-leave-active {
  position: absolute;
}

.icon-rotate-animation {
  animation: icon-rotate 1s linear 1 normal forwards;
  animation-iteration-count: 10;
}
@keyframes icon-rotate {
  0% { transform: rotate(0deg) }
  25% { transform: rotate(90deg) }
  50% { transform: rotate(180deg) }
  75% { transform: rotate(270deg) }
  100% { transform: rotate(360deg) }
}
</style>
