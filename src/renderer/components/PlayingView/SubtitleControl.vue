<template>
  <div
    v-fade-in="showAllWidgets"
    data-component-name="$options.name"
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
                <p>{{ this.$t('msg.subtitle.subtitleSelect') }}</p>
                <div
                  v-show="enabledSecondarySub"
                  @mouseup="subTypeShift"
                  @mouseover="shiftItemHover"
                  @mouseleave="shiftItemLeave"
                  class="subtitleShift"
                >
                  <div
                    :style="{
                      color: isFirstSubtitle || shiftItemHovered ?
                        'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                      background: isFirstSubtitle ? 'rgba(255, 255, 255, 0.13)' : '',
                      boxShadow: isFirstSubtitle ? '1px 0 2px rgba(0, 0, 0, 0.09)' : '',
                      borderRadius: isFirstSubtitle ? '2px' : '',
                    }"
                    class="firstSub"
                  >
                    <span>1</span>
                  </div>
                  <div
                    :style="{
                      color: !isFirstSubtitle || shiftItemHovered ?
                        'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                      background: !isFirstSubtitle ? 'rgba(255, 255, 255, 0.13)' : '',
                      boxShadow: !isFirstSubtitle ? '-1px 0 2px rgba(0, 0, 0, 0.09)' : '',
                      borderRadius: !isFirstSubtitle ? '2px' : '',
                    }"
                    class="secondarySub"
                  >
                    <span>2</span>
                  </div>
                </div>
                <Icon
                  ref="refreshRotate"
                  :class="animClass ? 'icon-rotate-animation' : ''"
                  @mouseup.native="handleRefresh"
                  type="refresh"
                  class="refresh"
                />
              </div>
              <subtitle-list
                :computed-size="computedSize"
                :current-subtitle-index="currentSubtitleIndex"
                :no-subtitle="noSubtitle"
                :real-items-num="realItemsNum"
                :computed-available-items="computedAvailableItems"
                :loading-types="loadingTypes"
                :hover-height.sync="hoverHeight"
                :trans-flag.sync="transFlag"
                :is-first-subtitle="isFirstSubtitle"
                :show-attached="showAttached"
                :ref-animation.sync="refAnimation"
                :enabled-secondary-sub="enabledSecondarySub"
                :change-subtitle="changeSubtitle"
                :translate-progress="translateProgress"
                :translate-language="selectedTargetLanugage"
                @off-subtitle="offCurrentSubtitle"
                @remove-subtitle="deleteCurrentSubtitle"
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
    >
      <lottie
        :options="defaultOptions"
        :style="{
          opacity: iconOpacity,
          transition: 'opacity 150ms',
        }"
        @animCreated="handleAnimation"
        lot="subtitle"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { mapActions, mapGetters, mapState } from 'vuex';
import { AnimationItem } from 'lottie-web';
import { flatMap, sortBy } from 'lodash';
import {
  Input as InputActions,
  Subtitle as subtitleActions,
  SubtitleManager as smActions,
  AudioTranslate as atActions,
} from '@/store/actionTypes';
import { SubtitleControlListItem, Type } from '@/interfaces/ISubtitle';
import lottie from '@/components/lottie.vue';
import animationData from '@/assets/subtitle.json';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import SubtitleList from '@/components/PlayingView/SubtitleList.vue';
import Icon from '../BaseIconContainer.vue';
import { addBubble } from '@/helpers/notificationControl';
import { SUBTITLE_OFFLINE, TRANSLATE_NO_LINE } from '@/helpers/notificationcodes';

export default {
  name: 'SubtitleControl',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    lottie,
    Icon,
    'subtitle-list': SubtitleList,
  },
  props: {
    showAllWidgets: Boolean,
    showAttached: Boolean,
    lastDragging: Boolean,
  },
  data() {
    return {
      clicks: 0,
      defaultOptions: { animationData },
      anim: {},
      validEnter: false,
      hoverHeight: 0,
      count: 1,
      stopCount: 10,
      animClass: false,
      computedAvailableItems: [],
      isShowingHovered: false,
      isInitial: true,
      onAnimation: false,
      refAnimation: '',
      transFlag: true,
      shiftItemHovered: false,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'originSrc', 'primarySubtitleId', 'secondarySubtitleId', 'list', 'privacyAgreement',
      'calculatedNoSub', 'winHeight', 'isFirstSubtitle', 'enabledSecondarySub', 'isRefreshing', 'winRatio', 'translateProgress', 'selectedTargetLanugage']),
    ...mapState({
      loadingTypes: ({ Subtitle }) => {
        const { loadingStates, types } = Subtitle;
        const loadingSubtitles = Object.keys(loadingStates)
          .filter(id => loadingStates[id] === 'loading');
        const result: string[] = [];
        loadingSubtitles.forEach((id) => {
          if (!result.includes(types[id])) result.push(types[id]);
        });
        return result;
      },
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
    contHeight() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return (this.realItemsNum * 31) + 45;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return (this.realItemsNum * 37) + 54;
      }
      return (this.realItemsNum * 51) + 76;
    },
    realItemsNum() {
      return this.computedAvailableItems.length + 1 + this.loadingTypes.length;
    },
    currentSubtitleIndex() {
      const { computedAvailableItems } = this;
      return !this.isFirstSubtitle && this.enabledSecondarySub
        ? computedAvailableItems
          .findIndex((sub: SubtitleControlListItem) => sub.id === this.secondarySubtitleId)
        : computedAvailableItems
          .findIndex((sub: SubtitleControlListItem) => sub.id === this.primarySubtitleId);
    },
    noSubtitle() {
      if (this.animClass) {
        return this.$t('msg.subtitle.menuLoading');
      }
      return this.calculatedNoSub
        ? this.$t('msg.subtitle.noSubtitle') : this.$t('msg.subtitle.notToShowSubtitle');
    },
  },
  watch: {
    enabledSecondarySub(val: boolean) {
      if (!val) this.updateSubtitleType(true);
    },
    list(val: SubtitleControlListItem[]) {
      val = flatMap(val
        .reduce((prev, currentSub) => {
          switch (currentSub.type) {
            default:
              break;
            case Type.Local:
              prev[0].push(currentSub);
              break;
            case Type.Embedded:
              prev[1].push(currentSub);
              break;
            case Type.Online:
            case Type.Translated:
              prev[2].push(currentSub);
              break;
          }
          return prev;
        }, [[], [], []] as SubtitleControlListItem[][])
        .map((subList, index) => {
          switch (index) {
            default:
              return subList;
            case 1: // this is embedded subtitle list
              // @ts-ignore
              return sortBy(subList, ({ source }) => source.streamIndex);
          }
        }));
      this.computedAvailableItems = val.map((sub: SubtitleControlListItem) => ({
        ...sub,
        name: this.getSubName(sub, val),
      }));
    },
    isRefreshing(val: boolean) {
      if (!val) {
        if (this.showAttached) {
          this.stopCount = this.count + 1;
        } else {
          this.animClass = false;
        }
        this.transFlag = true;
        setTimeout(() => {
          this.isInitial = false;
          if (this.onAnimation) {
            this.anim.addEventListener('complete', () => {
              this.anim.setSpeed(1.5);
            });
            this.onAnimation = false;
            this.anim.loop = false;
          }
          this.refAnimation = 'refresh-animation';
          if (this.$refs.scroll) this.$refs.scroll.scrollTop = 0;
        }, 1000);
      } else {
        this.transFlag = false;
        this.animClass = true;
        if (this.isInitial) {
          setTimeout(() => {
            if (!this.showAttached) {
              this.onAnimation = true;
              this.anim.loop = true;
              this.anim.setSpeed(0.6);
              this.anim.playSegments([115, 146], true);
            }
          }, 1000);
        }
      }
    },
    count(val: number) {
      if (val === this.stopCount) {
        this.animClass = false;
      }
    },
    animClass(val: boolean) {
      if (!val) {
        this.count = 1;
        this.stopCount = 10;
      }
    },
    originSrc() {
      // Switch video, reset isInitial
      this.isInitial = true;
      this.$emit('update:showAttached', false);
      this.computedAvailableItems = [];
      this.updateSubtitleType(true);
    },
    showAttached(val: boolean) {
      if (!val) {
        this.anim.playSegments([79, 92], true);
        if (!this.validEnter) {
          this.isShowingHovered = false;
        }
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
          } else if (val !== this.$options.name && this.showAttached) {
            this.$emit('update:showAttached', false);
          }
        }
      }, 0);
    },
  },
  mounted() {
    this.$refs.refreshRotate.$el.addEventListener('animationiteration', () => {
      this.count += 1;
    });
    document.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 0) {
        if (!this.showAttached) {
          let isUpOnSubtitleControl;
          const advance = document.querySelector('.sub-control');
          if (advance) {
            const nodeList = advance.childNodes;
            for (let i = 0; i < nodeList.length; i += 1) {
              isUpOnSubtitleControl = nodeList[i].contains(e.target as Node);
              if (isUpOnSubtitleControl) {
                break;
              }
            }
          }
          if (this.validEnter
            || (this.currentMousedownComponent === this.$options.name && isUpOnSubtitleControl)) {
            this.anim.playSegments([46, 60], true);
          } else if (this.currentMousedownComponent === this.$options.name) {
            this.anim.playSegments([40, 44], true);
          }
        } else if (this.currentMousedownComponent === this.$options.name
          && this.currentMouseupComponent !== this.$options.name) {
          this.anim.playSegments([79, 85], true);
        }
        this.mouseDown = false;
      }
    });
  },
  methods: {
    ...mapActions({
      clearMousedown: InputActions.MOUSEDOWN_UPDATE,
      clearMouseup: InputActions.MOUSEUP_UPDATE,
      initializeManager: smActions.initializeManager,
      changeFirstSubtitle: smActions.changePrimarySubtitle,
      changeSecondarySubtitle: smActions.changeSecondarySubtitle,
      refreshSubtitles: smActions.refreshSubtitles,
      deleteCurrentSubtitle: smActions.deleteSubtitlesByUuid,
      updateSubtitleType: subtitleActions.UPDATE_SUBTITLE_TYPE,
      showAudioTranslateModal: atActions.AUDIO_TRANSLATE_SHOW_MODAL,
    }),
    offCurrentSubtitle() {
      if (this.isFirstSubtitle) {
        this.changeFirstSubtitle('');
      } else {
        this.changeSecondarySubtitle('');
      }
    },
    shiftItemHover() {
      this.shiftItemHovered = true;
    },
    shiftItemLeave() {
      this.shiftItemHovered = false;
    },
    subTypeShift() {
      this.updateSubtitleType(!this.isFirstSubtitle);
    },
    handleRefresh() {
      if (navigator.onLine && !this.isRefreshing) this.refreshSubtitles();
      else if (!navigator.onLine) addBubble(SUBTITLE_OFFLINE);
    },
    handleAnimation(anim: AnimationItem) {
      this.anim = anim;
    },
    handleDown() {
      this.mouseDown = true;
      if (!this.showAttached) {
        this.anim.playSegments([28, 32], true);
      } else {
        this.clearMouseup({ componentName: '' });
        this.anim.playSegments([62, 64], true);
      }
    },
    handleEnter() {
      if (this.onAnimation) {
        this.anim.addEventListener('complete', () => {
          this.anim.setSpeed(1.5);
        });
        this.anim.loop = false;
      }
      if (!this.showAttached) {
        this.isShowingHovered = true;
      }
      this.validEnter = this.currentMousedownComponent === this.$options.name;
    },
    handleLeave() {
      if (!this.showAttached) {
        if (this.onAnimation) {
          this.anim.loop = true;
          this.anim.setSpeed(0.6);
          this.anim.playSegments([115, 146], true);
        }
        this.isShowingHovered = false;
      }
      this.validEnter = false;
    },
    toggleSubMenuDisplay() {
      if (this.mouseDown) {
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
      }
    },
    getSubName(item: SubtitleControlListItem) {
      if (item.type === Type.Embedded) {
        return `${this.$t('subtitle.embedded')} ${item.name}`;
      }
      return item.name;
    },
    changeSubtitle(item: SubtitleControlListItem) {
      if (!navigator.onLine && item.type === Type.Translated && item.source === '') {
        addBubble(TRANSLATE_NO_LINE);
      } else if (item.type === Type.Translated && item.source === '') {
        this.showAudioTranslateModal(item);
        // ga 字幕面板中点击 "Generate" 的次数
        this.$ga.event('app', 'ai-translate-generate-button-click');
      } else if (this.isFirstSubtitle) {
        this.changeFirstSubtitle(item.id);
      } else {
        this.changeSecondarySubtitle(item.id);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.sub-control {
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
    .sub-menu-wrapper {
      display: none;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    .sub-menu-wrapper {
      height: auto;
      min-width: 172px;
      max-height: 138px;
    }
    .topContainer {
      cursor: default;
      width: 100%;
      height: 39px;
      display: flex;
      flex-direction: row;
      p {
        margin: 15px 0 auto 17px;
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
      left: -113px;
      width: 180px;
      max-height: 138px;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    .sub-menu-wrapper {
      height: auto;
      max-height: 239px;
      min-width: 206px;
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
      left: -117px;
      width: 216px;
      max-height: 239px;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    .sub-menu-wrapper {
      height: auto;
      max-height: 433px;
      min-width: 288px;
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
      left: -148.8px;
      width: 302.4px;
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
