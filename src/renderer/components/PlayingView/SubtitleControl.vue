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
            height: hiddenText ? `${contHeight + hoverHeight}px` : `${contHeight}px`,
            fontWeight: '900',
          }"
          class="sub-menu-wrapper subtitle-scroll-items"
        >
          <div class="element bottom">
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

              <div class="sub-menu">
                <div
                  ref="scroll"
                  :class="refAnimation"
                  :style="{
                    transition: '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
                    height: hiddenText ? `${scopeHeight + hoverHeight}px` : `${scopeHeight}px`,
                    overflowY: isOverFlow,
                  }"
                  @animationend="finishAnimation"
                  class="scrollScope"
                >
                  <div class="itemContainer">
                    <div v-if="!(loadingSubsPlaceholders.length > 0)">
                      <div
                        :style="{
                          color: hoverIndex === -1 || currentSubtitleIndex === -1 ?
                            'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                          height: `${itemHeight}px`,
                          cursor: currentSubtitleIndex === -1 ? 'default' : 'pointer',
                        }"
                        @mouseup="$bus.$emit('off-subtitle')"
                        @mouseover="toggleItemsMouseOver(-1)"
                        @mouseleave="toggleItemsMouseLeave(-1)"
                        class="menu-item-text-wrapper"
                      >
                        <div class="text">
                          {{ noSubtitle }}
                        </div>
                      </div>
                    </div>

                    <div
                      v-for="(item, index) in computedAvailableItems"
                      :key="item.rank"
                    >
                      <div
                        :id="'item'+index"
                        :style="{
                          transition: isOverFlow ? '' : '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
                          color: hoverIndex === index || currentSubtitleIndex === index ?
                            'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                          height: hoverIndex === index && hiddenText ?
                            `${itemHeight + hoverHeight}px` : `${itemHeight}px`,
                          cursor: currentSubtitleIndex === index ? 'default' : 'pointer',
                        }"
                        @mouseup="toggleItemClick($event, index)"
                        @mouseover="toggleItemsMouseOver(index)"
                        @mouseleave="toggleItemsMouseLeave(index)"
                        class="menu-item-text-wrapper"
                      >
                        <div class="textContainer">
                          <div
                            :style="{
                              wordBreak: hoverIndex === index && hiddenText ? 'break-all' : '',
                              whiteSpace: hoverIndex === index && hiddenText ? '' : 'nowrap'
                            }"
                            class="text"
                          >
                            {{ getSubName(item) }}
                          </div>
                        </div>
                        <div class="iconContainer">
                          <transition name="sub-delete">
                            <Icon
                              v-show="item.type === 'local' && hoverIndex === index"
                              @mouseup.native="handleSubDelete($event, item)"
                              type="deleteSub"
                              class="deleteIcon"
                            />
                          </transition>
                        </div>
                      </div>
                    </div>

                    <div
                      v-for="(item, index) in loadingTypes"
                      :key="`${item}-${index}`"
                      class="placeholders-wrapper"
                    >
                      <div class="placeholder-item-text-wrapper">
                        <div class="text">
                          {{ item }}
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="0 <= computedAvailableItems.length"
                      :style="{
                        height: hiddenText && currentSubtitleIndex === hoverIndex ?
                          `${itemHeight + hoverHeight}px` : `${itemHeight}px`,
                        marginTop: hiddenText && currentSubtitleIndex <= hoverIndex ?
                          `${-cardPos - hoverHeight}px` : `${-cardPos}px`,
                        transition: transFlag ?
                          'all 100ms cubic-bezier(0.17, 0.67, 0.17, 0.98)' : '',
                      }"
                      class="card"
                    />
                  </div>
                </div>
              </div>
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
import difference from 'lodash/difference';
import debounce from 'lodash/debounce';
import path, { extname } from 'path';
import { AnimationItem } from 'lottie-web';
import { Subtitle as subtitleActions, Input as InputActions } from '@/store/actionTypes';
import { log } from '@/libs/Log';
import lottie from '@/components/lottie.vue';
import animationData from '@/assets/subtitle.json';
// import SubtitleStorage from '@/services/storage/SubtitleStorage';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import Icon from '../BaseIconContainer.vue';
import {
  ONLINE_LOADING,
  SUBTITLE_OFFLINE,
  REQUEST_TIMEOUT,
} from '../../../shared/notificationcodes';

const deleteSubtitles = (subtitles: any[], videoSrc: string) => Promise.resolve([
  subtitles,
  videoSrc,
]);

export default {
  name: 'SubtitleControl',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    lottie,
    Icon,
  },
  props: {
    showAllWidgets: Boolean,
    showAttached: Boolean,
    lastDragging: Boolean,
  },
  data() {
    return {
      loadingSubsPlaceholders: {
        local: '',
        embedded: '',
        online: '',
      },
      clicks: 0,
      defaultOptions: { animationData },
      anim: {},
      validEnter: false,
      hoverIndex: -5,
      hiddenText: false,
      hoverHeight: 0,
      count: 1,
      stopCount: 10,
      animClass: false,
      loadingType: '',
      detailTimer: null,
      breakTimer: null,
      computedAvailableItems: [],
      continueRefresh: false,
      isShowingHovered: false,
      isInitial: true,
      onAnimation: false,
      refAnimation: '',
      refRotate: '',
      // @ts-ignore
      debouncedHandler: debounce(this.handleRefresh, 1000),
      transFlag: true,
      subTypeHoverIndex: 1,
      shiftItemHovered: false,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'originSrc', 'privacyAgreement', 'currentFirstSubtitleId',
      'currentSecondSubtitleId', 'subtitleNewList', 'calculatedNoSub', 'winHeight', 'isFirstSubtitle',
      'enabledSecondarySub', 'winRatio']),
    ...mapState({
      loadingTypes: ({ Subtitle }) => {
        const { loadingStates, types } = Subtitle;
        const loadingSubtitles = Object.keys(loadingStates)
          .filter(id => loadingStates[id] === 'loading');
        const result: any[] = [];
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
    noSubtitle() {
      if (this.animClass) {
        return this.$t('msg.subtitle.menuLoading');
      }
      return this.calculatedNoSub
        ? this.$t('msg.subtitle.noSubtitle') : this.$t('msg.subtitle.notToShowSubtitle');
    },
    iconOpacity() {
      return this.isShowingHovered ? 0.9 : 0.77;
    },
    textHeight() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 13;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 14;
      }
      return 18;
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
    realItemsNum() {
      return this.computedAvailableItems.length + 1 + this.loadingTypes.length;
    },
    isOverFlow() { // eslint-disable-line complexity
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return this.realItemsNum > 3
        || (this.scopeHeight + this.hoverHeight > 89 && this.hiddenText) ? 'scroll' : '';
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return this.realItemsNum > 5
        || (this.scopeHeight + this.hoverHeight > 180 && this.hiddenText) ? 'scroll' : '';
      }
      return this.realItemsNum > 7
      || (this.scopeHeight + this.hoverHeight > 350 && this.hiddenText) ? 'scroll' : '';
    },
    scopeHeight() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return (this.realItemsNum * 31) - 4;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return (this.realItemsNum * 37) - 5;
      }
      return (this.realItemsNum * 51) - 7;
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
    cardPos() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return this.computedAvailableItems.length > 0
          ? ((this.computedAvailableItems.length + this.loadingTypes.length)
            - this.currentSubtitleIndex) * 31
          : this.scopeHeight + 4;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return this.computedAvailableItems.length > 0
          ? ((this.computedAvailableItems.length + this.loadingTypes.length)
            - this.currentSubtitleIndex) * 37
          : this.scopeHeight + 5;
      }
      return this.computedAvailableItems.length > 0
        ? ((this.computedAvailableItems.length + this.loadingTypes.length)
          - this.currentSubtitleIndex) * 51
        : this.scopeHeight + 7;
    },
    currentSubtitleIndex() {
      const { computedAvailableItems } = this;
      return !this.isFirstSubtitle && this.enabledSecondarySub
        ? computedAvailableItems
          .findIndex((subtitle: any) => subtitle.id === this.currentSecondSubtitleId)
        : computedAvailableItems
          .findIndex((subtitle: any) => subtitle.id === this.currentFirstSubtitleId);
    },
    currentScrollTop() {
      const marginFactors = [4, 5, 7];
      return this.currentSubtitleIndex
        * (this.itemHeight + marginFactors[[27, 32, 44].indexOf(this.itemHeight)]);
    },
  },
  watch: {
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
      this.$emit('update:showAttached', false);
      this.computedAvailableItems = [];
    },
    currentSubtitleIndex(val: number) {
      if (val === 0) {
        this.$refs.scroll.scrollTop = 0;
      }
    },
    showAttached(val: boolean) {
      this.$refs.scroll.scrollTop = this.currentScrollTop;
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
    subtitleNewList(val: any, oldval: any) {
      if (val.length > oldval.length) {
        // @ts-ignore
        this.loadingType = difference(val, oldval)[0].type;
      }
      this.computedAvailableItems = val;
    },
    loadingType(val: string) {
      if (val === 'local') {
        this.loadingSubsPlaceholders.local = 'loading';
      } else if (val === 'online') {
        this.loadingSubsPlaceholders.online = 'loading';
      } else if (val === 'embedded') {
        this.loadingSubsPlaceholders.embedded = 'loading';
      }
    },
    enabledSecondarySub(val: boolean) {
      if (!val) this.updateSubtitleType(true);
      this.$refs.scroll.scrollTop = val ? 0 : this.currentScrollTop;
    },
    isFirstSubtitle() {
      this.$refs.scroll.scrollTop = this.currentScrollTop;
    },
    computedAvailableItems(val: any) {
      this.updateNoSubtitle(!val.length);
    },
  },
  created() {
    this.$bus.$on('subtitle-refresh-from-menu', this.debouncedHandleRefresh);
    this.$bus.$on('subtitle-refresh-from-src-change', (e: Event, hasOnlineSubtitles: boolean) => {
      this.isInitial = true;
      if (this.privacyAgreement) {
        this.debouncedHandleRefresh(hasOnlineSubtitles);
      } else {
        this.$bus.$emit('refresh-subtitles', { types: ['local', 'embedded'] });
      }
    });
    this.$bus.$on('refresh-finished', (timeout: boolean) => {
      if (this.showAttached) {
        this.stopCount = this.count + 1;
      } else {
        this.animClass = false;
      }
      this.transFlag = true;
      if (timeout) {
        setTimeout(() => {
          log.error('SubtitleControll.vue', 'Request Timeout .');
          this.$addBubble(REQUEST_TIMEOUT);
        }, 500);
      }
      setTimeout(() => {
        this.$bus.$emit('finished-add-subtitles');
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
    });
  },
  mounted() {
    this.$refs.refreshRotate.$el.addEventListener('animationiteration', () => {
      this.count += 1;
    });
    this.$bus.$on('subtitle-refresh-continue', () => {
      if (this.continueRefresh) {
        this.continueRefresh = false;
        this.debouncedHandleRefresh();
      }
    });
    this.$bus.$on('online-subtitle-found', () => {
      clearTimeout(this.breakTimer);
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        if (!this.showAttached) {
          if (this.validEnter) {
            this.anim.playSegments([46, 60], true);
          } else if (this.currentMousedownComponent === this.$options.name) {
            this.anim.playSegments([40, 44], true);
          }
        } else if (this.currentMousedownComponent === this.$options.name
          && this.currentMouseupComponent !== this.$options.name) {
          this.anim.playSegments([79, 85], true);
        }
      }
    });
  },
  destroyed() {
    if (this.breakTimer) {
      clearTimeout(this.breakTimer);
    }
  },
  methods: {
    ...mapActions({
      // @ts-ignore
      addSubtitles: subtitleActions.ADD_SUBTITLES,
      resetSubtitles: subtitleActions.RESET_SUBTITLES,
      offCurrentSubtitle: subtitleActions.OFF_SUBTITLES,
      clearMousedown: InputActions.MOUSEDOWN_UPDATE,
      clearMouseup: InputActions.MOUSEUP_UPDATE,
      removeLocalSub: subtitleActions.REMOVE_LOCAL_SUBTITLE,
      updateSubtitleType: subtitleActions.UPDATE_SUBTITLE_TYPE,
      updateNoSubtitle: subtitleActions.UPDATE_NO_SUBTITLE,
    }),
    shiftItemHover() {
      this.shiftItemHovered = true;
    },
    shiftItemLeave() {
      this.shiftItemHovered = false;
    },
    subTypeShift() {
      this.updateSubtitleType(!this.isFirstSubtitle);
    },
    handleSubDelete(e: MouseEvent, item: any) {
      if ((e.target as HTMLElement).nodeName !== 'DIV') {
        this.transFlag = false;
        this.removeLocalSub(item.id);
        this.hoverHeight = 0;
        if (item.id === this.currentFirstSubtitleId) {
          this.$bus.$emit('off-subtitle');
        }
        deleteSubtitles([item.id], this.originSrc).then((result: any) => {
          log.info('SubtitleControl.vue', `Subtitle delete { successId:${result.success}, failureId:${result.failure} }`);
          this.transFlag = true;
        });
      }
    },
    finishAnimation() {
      this.refAnimation = '';
    },
    getSubName(item: any) {
      if (item.path) {
        return path.basename(item);
      }
      if (item.type === 'embedded') {
        return `${this.$t('subtitle.embedded')} ${item.name}`;
      }
      return item.name;
    },
    debouncedHandleRefresh(e: MouseEvent, hasOnlineSubtitles = false) {
      this.debouncedHandler(e, hasOnlineSubtitles);
    },
    handleRefresh(e: MouseEvent, hasOnlineSubtitles = false) {
      if (navigator.onLine) {
        if (!this.privacyAgreement) {
          this.$bus.$emit('privacy-confirm');
          this.continueRefresh = true;
        } else if (this.privacyAgreement && !this.animClass) {
          this.transFlag = false;
          this.animClass = true;
          const types = ['local'];
          if (this.isInitial) types.push('embedded');
          if (!hasOnlineSubtitles
            && (!this.isInitial
              || ['ts', 'avi', 'mkv', 'mp4']
                .includes(extname(this.originSrc).slice(1).toLowerCase()))) {
            types.push('online');
          }
          // three suitations for variable 'types':
          // first open && matched extensions: ['local', 'embedded', 'online']
          // first open && !matched extensions: ['local', 'embedded']
          // !first open: ['local', 'online']
          this.updateSubtitleType(true);
          this.$bus.$emit('refresh-subtitles', { types, isInitial: this.isInitial });
          if (!this.isInitial) {
            log.info('SubtitleControl.vue', 'Online subtitles loading .');
            this.$addBubble(ONLINE_LOADING);
          } else {
            setTimeout(() => {
              if (!this.showAttached) {
                this.onAnimation = true;
                this.anim.loop = true;
                this.anim.setSpeed(0.6);
                this.anim.playSegments([115, 146], true);
              }
            }, 1000);
          }
          clearTimeout(this.breakTimer);
          this.breakTimer = setTimeout(() => {
            if (this.animClass) {
              this.$bus.$emit('refresh-finished', !this.isInitial);
            }
          }, 10000);
        }
      } else {
        log.error('SubtitleConyrol.vue', 'Offline error .');
        this.$addBubble(SUBTITLE_OFFLINE);
      }
    },
    handleAnimation(anim: AnimationItem) {
      this.anim = anim;
    },
    handleDown() {
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
      this.validEnter = true;
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
    toggleItemsMouseOver(index: number) {
      this.showSubtitleDetails(index);
      this.hoverIndex = index;
    },
    showSubtitleDetails(index: number) {
      if (index >= 0) {
        clearTimeout(this.detailTimer);
        const hoverItem: HTMLElement|null = document.querySelector(`#item${index} .text`);
        if (hoverItem && hoverItem.clientWidth < hoverItem.scrollWidth) {
          this.hoverHeight = this.textHeight
            * (Math.ceil(hoverItem.scrollWidth / hoverItem.clientWidth) - 1);
          this.detailTimer = setTimeout(() => {
            this.hiddenText = true;
          }, 1500);
        }
      }
    },
    toggleItemsMouseLeave() {
      clearTimeout(this.detailTimer);
      this.hoverHeight = 0;
      this.hiddenText = false;
      this.hoverIndex = -5;
    },
    toggleItemClick(event: MouseEvent, index: number) {
      if ((event.target as HTMLElement).nodeName === 'DIV') {
        const { computedAvailableItems } = this;
        this.$bus.$emit('change-subtitle', computedAvailableItems[index].id);
        setTimeout(() => {
          this.showSubtitleDetails(index);
        }, 0);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
::-webkit-scrollbar {
  width: 2px;
}
::-webkit-scrollbar-thumb {
  border-radius: 1.2px;
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.15);
}
.sub-control {
  .btn:hover, .sub-item:hover{
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
    -webkit-app-region: no-drag;
    .element {
      border-radius: 7px;
      position: absolute;
      box-sizing: inherit;
    }
    .bottom {
      width: 100%;
      height: 100%;
      top: 0;
      background: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
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
  .menu-item-text-wrapper {
    .iconContainer {
      display: flex;
    }
    .deleteIcon {
      transition-delay: 75ms;
    }
    .text {
      transition: color 90ms linear;
      transition-delay: 75ms;
      overflow: hidden; //超出的文本隐藏
      text-overflow: ellipsis;
    }
  }
  .placeholder-item-text-wrapper {
    .text {
      overflow: hidden; //超出的文本隐藏
      white-space: nowrap;
      text-overflow: ellipsis;
      color: grey;
    }
  }
  .placeholders-wrapper {
    cursor: default;
  }
  .card {
    position: relative;
    z-index: -5;
    border-radius: 7px;
    opacity: 0.4;
    border: 0.5px solid rgba(255, 255, 255, 0.20);
    box-sizing: border-box;
    box-shadow: 0 1px 2px rgba(0, 0, 0, .2);
    background-image: radial-gradient(60% 134%,
      rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 180px) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 180px) and (max-height: 288px) {
    .sub-menu-wrapper {
      display: none;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    .topContainer {
      cursor: default;
      width: 100%;
      height: 39px;
      display: flex;
      flex-direction: row;
      p {
        margin: 15px 0 auto 14px;
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
      left: -102px;
      width: 170px;
      max-height: 138px;
    }
    .scrollScope {
      width: 160px;
      margin: auto auto 10px auto;
      max-height: 89px
    }
    .menu-item-text-wrapper {
      width: 142px;
      display: flex;
      margin: auto auto 4px 9px;
      .textContainer {
        width: 116px;
        display: flex;
      }
      .text {
        font-size: 11px;
        letter-spacing: 0.2px;
        line-height: 13px;
        margin: auto 0 auto 9px;
      }
      .iconContainer {
        width: 26px;
        height: 27px;
        .deleteIcon {
          margin: auto 9px auto auto;
        }
      }
    }
    .placeholder-item-text-wrapper {
      width: 142px;
      height: 27px;
      display: flex;
      margin-left: 9px;
      margin-bottom: 4px;
      .text {
        font-size: 11px;
        letter-spacing: 0.2px;
        line-height: 15px;
        margin: auto 9.43px;
      }
    }
    .card {
      width: 142px;
      margin-left: 9px;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    .topContainer {
      cursor: default;
      width: 100%;
      height: 47px;
      display: flex;
      flex-direction: row;
      p {
        margin: 18px 0 auto 16px;
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
    .scrollScope {
      width: 191px;
      margin: auto auto 12px auto;
      max-height: 180px
    }
    .sub-menu-wrapper {
      position: absolute;
      bottom: 44px;
      left: -106px;
      width: 204px;
      max-height: 239px;
    }
    .menu-item-text-wrapper {
      width: 174px;
      display: flex;
      margin: auto auto 5px 9.5px;
      .textContainer {
        width: 141px;
        display: flex;
      }
      .text {
        font-size: 13.2px;
        letter-spacing: 0.2px;
        line-height: 16px;
        margin: auto 0 auto 12.73px;
      }
      .iconContainer {
        width: 33px;
        height: 32px;
        .deleteIcon {
          margin: auto 10.8px auto auto;
        }
      }
    }
    .placeholder-item-text-wrapper {
      width: 174px;
      height: 32px;
      display: flex;
      margin-left: 9.5px;
      margin-bottom: 5px;
      .text {
        font-size: 12px;
        letter-spacing: 0.2px;
        line-height: 16px;
        margin: auto 12.73px;
      }
    }
    .card {
      width: 172px;
      margin-left: 9.5px;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    .topContainer {
      cursor: default;
      width: 100%;
      height: 64px;
      display: flex;
      flex-direction: row;
      p {
        margin: 24px 0 auto 24px;
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
    .scrollScope {
      width: 266px;
      margin: auto auto 19px auto;
      max-height: 350px
    }
    .sub-menu-wrapper {
      position: absolute;
      bottom: 70px;
      left: -133px;
      width: 286px;
      max-height: 433px;
    }
    .menu-item-text-wrapper {
      width: 242px;
      display: flex;
      margin: auto auto 7px 12px;
      .textContainer {
        width: 196px;
        display: flex;
      }
      .text {
        font-size: 18.48px;
        letter-spacing: 0.27px;
        line-height: 20px;
        margin: auto 0 auto 17.89px;
      }
      .iconContainer {
        width: 46px;
        height: 44px;
        .deleteIcon {
          margin: auto 15.12px auto auto;
        }
      }
    }
    .placeholder-item-text-wrapper {
      width: 242px;
      height: 44px;
      display: flex;
      margin-left: 12px;
      margin-bottom: 7px;
      .text {
        font-size: 16px;
        letter-spacing: 0.27px;
        line-height: 16px;
        margin: auto 17.89px;
      }
    }
    .card {
      width: 242px;
      margin-left: 12px;
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

.sub-delete-enter-active, .sub-delete-leave-active {
  transition: opacity 150ms;
}
.sub-delete-enter, .sub-delete-leave-to {
  opacity: 0;
}

.refresh-animation {
  animation: menu-refresh 300ms linear 1 normal forwards;
}
.icon-rotate-animation {
  animation: icon-rotate 1s linear 1 normal forwards;
  animation-iteration-count: 10;
}
@keyframes menu-refresh {
  0% { opacity: 1 }
  25% { opacity: 0.5 }
  50% { opacity: 0 }
  75% { opacity: 0.5 }
  100% { opacity: 1 }
}
@keyframes icon-rotate {
  0% { transform: rotate(0deg) }
  25% { transform: rotate(90deg) }
  50% { transform: rotate(180deg) }
  75% { transform: rotate(270deg) }
  100% { transform: rotate(360deg) }
}
</style>
