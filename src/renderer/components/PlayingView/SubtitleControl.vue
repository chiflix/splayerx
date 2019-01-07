<template>
  <div data-component-name="$options.name" class="sub-control" v-fade-in="showAllWidgets">
    <div class="sub-btn-control">
      <transition name="sub-trans-l">
        <div class="sub-menu-wrapper subtitle-scroll-items"
          v-show="showAttached"
          :style="{
            cursor: 'default',
            transition: showAttached ? '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)' : '150ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
            height: hiddenText ? `${contHeight + hoverHeight}px` : `${contHeight}px`,
            fontWeight: '900',
          }">
          <div class="element bottom">
            <div class="element content">

              <div class="topContainer">
                <div class="title">{{ this.$t('msg.subtitle.subtitleSelect' ) }}</div>
                <Icon type="refresh" class="refresh" @mouseup.native="handleRefresh"
                  :style="{
                    cursor: 'pointer',
                    transform: `rotate(${rotateTime * 360}deg)`,
                    transition: 'transform 1s linear',
                    transformOrigin: 'center',
                  }"/>
              </div>

              <div class="sub-menu">
                <div class="scrollScope"
                  :style="{
                    transition: '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
                    height: hiddenText ? `${scopeHeight + hoverHeight}px` : `${scopeHeight}px`,
                    overflowY: isOverFlow,
                  }">
                  <div class="itemContainer">
                    <div v-if="foundSubtitles && !(loadingSubsPlaceholders.length > 0)">
                      <div class="menu-item-text-wrapper"
                        @mouseup="$bus.$emit('off-subtitle')"
                        @mouseover="toggleItemsMouseOver(-1)"
                        @mouseleave="toggleItemsMouseLeave(-1)"
                        :style="{
                          color: hoverIndex === -1 || currentSubtitleIndex === -1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                          height: `${itemHeight}px`,
                          cursor: currentSubtitleIndex === -1 ? 'default' : 'pointer',
                        }">
                        <div class="text">{{ this.$t('msg.subtitle.noSubtitle') }}</div>
                      </div>
                    </div>

                    <div v-if="foundSubtitles"
                      v-for="(item, index) in computedAvaliableItems" :key="item.rank">
                      <div class="menu-item-text-wrapper"
                        @mouseup="toggleItemClick(index)"
                        @mouseover="toggleItemsMouseOver(index)"
                        @mouseleave="toggleItemsMouseLeave(index)"
                        :id="'item'+index"
                        :style="{
                          transition: isOverFlow ? '' : '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
                          color: hoverIndex === index || currentSubtitleIndex === index ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                          height: hoverIndex === index && hiddenText ? `${itemHeight + hoverHeight}px` : `${itemHeight}px`,
                          cursor: currentSubtitleIndex === index ? 'default' : 'pointer',
                        }">
                        <div class="text"
                          :style="{ wordBreak: hoverIndex === index && hiddenText ? 'break-all' : '',
                            whiteSpace: hoverIndex === index && hiddenText ? '' : 'nowrap'
                          }">{{ item.path ? getSubName(item.path) : item.name }}</div>
                      </div>
                    </div>

                    <div v-if="loadingTypes.length > 0"
                      v-for="(item, index) in loadingTypes"
                      class="placeholders-wrapper"
                      :key="`${item}-${index}`">
                      <div class="placeholder-item-text-wrapper">
                        <div class="text">{{ item }}</div>
                      </div>
                    </div>

                    <div class="card" v-if="0 <= computedAvaliableItems.length"
                      :style="{
                        height: hiddenText && currentSubtitleIndex === hoverIndex ? `${itemHeight + hoverHeight}px` : `${itemHeight}px`,
                        top: hiddenText && currentSubtitleIndex <= hoverIndex ? `${-hoverHeight}px` : '',
                        marginTop: `${-cardPos}px`,
                        transition: 'all 100ms cubic-bezier(0.17, 0.67, 0.17, 0.98)'
                      }"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
    <div ref="sub" @mouseup.left="toggleSubMenuDisplay" @mousedown.left="handleDown" @mouseenter="handleEnter" @mouseleave="handleLeave" >
      <lottie v-on:animCreated="handleAnimation" :options="defaultOptions" lot="subtitle"></lottie>
    </div>
  </div>
</template>
<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import difference from 'lodash/difference';
import path from 'path';
import { Subtitle as subtitleActions, Input as InputActions } from '@/store/actionTypes';
import lottie from '@/components/lottie.vue';
import animationData from '@/assets/subtitle.json';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'subtitle-control',
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
      foundSubtitles: true,
      clicks: 0,
      defaultOptions: { animationData },
      anim: {},
      animFlag: true,
      mouseDown: false,
      validEnter: false,
      showFlag: false,
      hoverIndex: -5,
      hiddenText: false,
      hoverHeight: 0,
      timer: null,
      count: 0,
      rotateTime: 0,
      loadingType: '',
      detailTimer: null,
      breakTimer: null,
      continueRefresh: false,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'originSrc', 'privacyAgreement', 'currentSubtitleId']),
    ...mapGetters({
      computedAvaliableItems: 'subtitleList',
    }),
    ...mapState({
      loadingTypes: ({ Subtitle }) => {
        const { loadingStates, types } = Subtitle;
        const loadingSubtitles = Object.keys(loadingStates).filter(id => loadingStates[id] === 'loading');
        const result = [];
        loadingSubtitles.forEach((id) => {
          if (!result.includes(types[id])) result.push(types[id]);
        });
        return result;
      },
    }),
    mousedownCurrentTarget() {
      return this.$store.state.Input.mousedownTarget;
    },
    mouseupCurrentTarget() {
      return this.$store.state.Input.mouseupTarget;
    },
    textHeight() {
      if (this.winWidth > 512 && this.winWidth <= 854) {
        return 13;
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return 14;
      }
      return 18;
    },
    itemHeight() {
      if (this.winWidth > 512 && this.winWidth <= 854) {
        return 27;
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return 32;
      }
      return 44;
    },
    isOverFlow() {
      if (this.andify(this.winWidth > 512, this.winWidth <= 854)) {
        return this.orify(this.andify(this.contHeight + this.hoverHeight > 138, this.hiddenText), this.computedAvaliableItems.length + this.loadingTypes.length > 2) ? 'scroll' : '';
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return this.orify(this.andify(this.contHeight + this.hoverHeight > 239, this.hiddenText), this.computedAvaliableItems.length + this.loadingTypes.length > 4) ? 'scroll' : '';
      }
      return this.orify(this.andify(this.contHeight + this.hoverHeight >= 433, this.hiddenText), this.computedAvaliableItems.length + this.loadingTypes.length > 6) ? ' scroll' : '';
    },
    scopeHeight() {
      if (this.winWidth > 512 && this.winWidth <= 854) {
        return this.computedAvaliableItems.length > 2 ?
          (this.loadingTypes.length * 31) + 89 :
          (((this.computedAvaliableItems.length + 1) * 31) - 4) +
          (this.loadingTypes.length * 31);
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return this.computedAvaliableItems.length > 4 ?
          (this.loadingTypes.length * 37) + 180 :
          (((this.computedAvaliableItems.length + 1) * 37) - 5) +
          (this.loadingTypes.length * 37);
      }
      return this.computedAvaliableItems.length > 6 ?
        (this.loadingTypes.length * 51) + 350 :
        (((this.computedAvaliableItems.length + 1) * 51) - 7) +
        (this.loadingTypes.length * 51);
    },
    contHeight() {
      if (this.winWidth > 512 && this.winWidth <= 854) {
        return this.computedAvaliableItems.length > 2 ?
          (this.loadingTypes.length * 31) + 138 :
          45 + ((this.computedAvaliableItems.length + 1) * 31) +
          (this.loadingTypes.length * 31);
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return this.computedAvaliableItems.length > 4 ?
          (this.loadingTypes.length * 37) + 239 :
          54 + ((this.computedAvaliableItems.length + 1) * 37) +
          (this.loadingTypes.length * 37);
      }
      return this.computedAvaliableItems.length > 6 ?
        (this.loadingTypes.length * 51) + 433 :
        76 + ((this.computedAvaliableItems.length + 1) * 51) +
        (this.loadingTypes.length * 51);
    },
    cardPos() {
      if (this.winWidth > 512 && this.winWidth <= 854) {
        return this.computedAvaliableItems.length > 0 ?
          ((this.computedAvaliableItems.length + this.loadingTypes.length)
            - this.currentSubtitleIndex) * 31 :
          this.scopeHeight + 4;
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return this.computedAvaliableItems.length > 0 ?
          ((this.computedAvaliableItems.length + this.loadingTypes.length)
            - this.currentSubtitleIndex) * 37 :
          this.scopeHeight + 5;
      }
      return this.computedAvaliableItems.length > 0 ?
        ((this.computedAvaliableItems.length + this.loadingTypes.length)
          - this.currentSubtitleIndex) * 51 :
        this.scopeHeight + 7;
    },
    currentSubtitleIndex() {
      return this.computedAvaliableItems.findIndex(subtitle =>
        subtitle.id === this.currentSubtitleId);
    },
  },
  watch: {
    currentSubtitleIndex(val) {
      this.$bus.$emit('clear-last-cue');
      if (val === 0) {
        document.querySelector('.scrollScope').scrollTop = 0;
      }
    },
    showAttached(val) {
      if (!val) {
        this.animFlag = true;
        if (!this.validEnter) {
          this.anim.playSegments([79, 98], false);
        } else {
          this.showFlag = true;
          this.anim.playSegments([79, 92], false);
          setTimeout(() => { this.showFlag = false; }, 250);
        }
      }
    },
    mousedownCurrentTarget(val) {
      if (val !== this.$options.name && this.showAttached) {
        this.anim.playSegments([62, 64], false);
        if (this.lastDragging) {
          this.clearMouseup({ target: '' });
        } else if (this.mouseupCurrentTarget !== this.$options.name && this.mouseupCurrentTarget !== '') {
          this.$emit('update:showAttached', false);
        }
      }
    },
    mouseupCurrentTarget(val) {
      if (this.lastDragging) {
        if (this.showAttached) {
          this.anim.playSegments([79, 85]);
        }
        this.clearMousedown({ target: '' });
      } else if (val !== this.$options.name && this.showAttached) {
        this.$emit('update:showAttached', false);
      }
    },
    computedAvaliableItems(val, oldval) {
      if (val.length > oldval.length) {
        this.loadingType = difference(val, oldval)[0].type;
      }
    },
    loadingType(val) {
      if (val === 'local') {
        this.loadingSubsPlaceholders.local = 'loading';
      } else if (val === 'online') {
        this.loadingSubsPlaceholders.online = 'loading';
      } else if (val === 'embedded') {
        this.loadingSubsPlaceholders.embedded = 'loading';
      }
    },
  },
  methods: {
    ...mapActions({
      addSubtitles: subtitleActions.ADD_SUBTITLES,
      resetSubtitles: subtitleActions.RESET_SUBTITLES,
      changeCurrentSubtitle: subtitleActions.CHANGE_CURRENT_SUBTITLE,
      offCurrentSubtitle: subtitleActions.OFF_SUBTITLES,
      clearMousedown: InputActions.MOUSEDOWN_UPDATE,
      clearMouseup: InputActions.MOUSEUP_UPDATE,
    }),
    getSubName(subPath) {
      return path.basename(subPath);
    },
    handleRefresh() {
      if (!this.privacyAgreement) {
        this.$bus.$emit('privacy-confirm');
        this.continueRefresh = true;
      } else if (this.privacyAgreement && !this.timer) {
        this.timer = setInterval(() => {
          this.count += 1;
          this.rotateTime = Math.ceil(this.count / 100);
        }, 10);
        document.querySelector('.scrollScope').scrollTop = 0;
        this.$bus.$emit('refresh-subtitles');
        clearTimeout(this.breakTimer);
        this.breakTimer = setTimeout(() => {
          if (this.timer) {
            this.$bus.$emit('refresh-finished');
          }
        }, 20000);
      }
    },
    orify(...args) {
      return args.some(arg => arg == true); // eslint-disable-line
    },
    andify(...args) {
      return args.every(arg => arg == true); // eslint-disable-line
    },
    handleAnimation(anim) {
      this.anim = anim;
    },
    handleDown() {
      this.mouseDown = true;
      if (!this.showAttached) {
        this.anim.playSegments([28, 32], false);
      } else {
        this.anim.playSegments([62, 64], false);
      }
    },
    handleEnter() {
      if (this.animFlag && !this.showAttached) {
        if (!this.mouseDown) {
          this.anim.playSegments([4, 8], false);
        } else {
          this.anim.playSegments([102, 105], false);
        }
      }
      this.showFlag = false;
      this.validEnter = true;
      this.animFlag = false;
    },
    handleLeave() {
      if (!this.showAttached) {
        if (this.mouseDown) {
          this.anim.playSegments([35, 38], false);
        } else if (this.showFlag) {
          this.anim.addEventListener('complete', () => {
            this.anim.playSegments([95, 98], false);
            this.showFlag = false;
            this.anim.removeEventListener('complete');
          });
        } else {
          this.anim.playSegments([95, 98], false);
        }
        this.animFlag = true;
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
    toggleItemsMouseOver(index) {
      if (index >= 0) {
        clearTimeout(this.detailTimer);
        const hoverItem = document.querySelector(`#item${index} .text`);
        if (hoverItem.clientWidth < hoverItem.scrollWidth) {
          this.hoverHeight = this.textHeight *
            (Math.ceil(hoverItem.scrollWidth / hoverItem.clientWidth) - 1);
          this.detailTimer = setTimeout(() => {
            this.hiddenText = true;
          }, 1500);
        }
      }
      this.hoverIndex = index;
    },
    toggleItemsMouseLeave() {
      clearTimeout(this.detailTimer);
      this.hoverHeight = 0;
      this.hiddenText = false;
      this.hoverIndex = -5;
    },
    toggleItemClick(index) {
      const { computedAvaliableItems } = this;
      this.$bus.$emit('change-subtitle', computedAvaliableItems[index].id);
    },
  },
  created() {
    this.$bus.$on('refresh-finished', () => {
      clearInterval(this.timer);
      this.count = this.rotateTime * 100;
      setTimeout(() => {
        this.$bus.$emit('finished-add-subtitles');
        this.timer = null;
      }, 1000);
    });
  },
  mounted() {
    this.$bus.$on('menu-subtitle-refresh', this.handleRefresh);
    this.$bus.$on('subtitle-refresh-continue', () => {
      if (this.continueRefresh) {
        this.continueRefresh = false;
        this.handleRefresh();
      }
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        if (!this.showAttached) {
          if (this.validEnter) {
            this.anim.playSegments([46, 60], false);
          } else if (this.mousedownCurrentTarget === this.$options.name) {
            this.anim.playSegments([40, 44], false);
          }
        }
        this.mouseDown = false;
      }
    });
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
      clip-path: inset(0 round 7px);
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
    }
  }
  .title {
    color: rgba(255, 255, 255, 0.6);
  }
  .menu-item-text-wrapper {
    .text {
      overflow: hidden; //超出的文本隐藏
      text-overflow: ellipsis;
      text-transform: capitalize;
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
    box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
    background-image: radial-gradient(60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
  }
  @media screen and (min-width: 320px) and (max-width: 512px) {
    .sub-menu-wrapper {
      display: none;
    }
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    .topContainer {
      cursor: default;
      width: 100%;
      height: 39px;
      display: flex;
      flex-direction: row;
      .title {
        font-size: 13px;
        margin: 15px auto auto 16px;
        letter-spacing: 0.2px;
        line-height: 15px;
      }
      .refresh {
        width: 13px;
        height: 13px;
        margin: 14px 15px auto auto;
      }
    }
    .sub-menu-wrapper {
      position: absolute;
      bottom: 32px;
      left: -58px;
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
      .text {
        font-size: 11px;
        letter-spacing: 0.2px;
        line-height: 13px;
        margin: auto 9.43px;
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
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    .topContainer {
      cursor: default;
      width: 100%;
      height: 47px;
      display: flex;
      flex-direction: row;
      .title {
        font-size: 15.6px;
        margin: 18px auto auto 19px;
        letter-spacing: 0.23px;
        line-height: 17px;
      }
      .refresh {
        width: 17px;
        height: 17px;
        margin: 17px 19px auto auto;
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
      left: -42px;
      width: 204px;
      max-height: 239px;
    }
    .menu-item-text-wrapper {
      width: 174px;
      display: flex;
      margin: auto auto 5px 9.5px;
      .text {
        font-size: 12px;
        letter-spacing: 0.2px;
        line-height: 14px;
        margin: auto 12.73px;
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
        line-height: 14px;
        margin: auto 12.73px;
      }
    }
    .card {
      width: 172px;
      margin-left: 9.5px;
    }
  }
  @media screen and (min-width: 1921px) {
    .topContainer {
      cursor: default;
      width: 100%;
      height: 64px;
      display: flex;
      flex-direction: row;
      .title {
        font-size: 21.84px;
        margin: 24px auto auto 26px;
        letter-spacing: 0.32px;
        line-height: 23px;
      }
      .refresh {
        width: 21px;
        height: 21px;
        margin: 23px 26px auto auto;
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
      left: -33px;
      width: 286px;
      max-height: 433px;
    }
    .menu-item-text-wrapper {
      width: 242px;
      display: flex;
      margin: auto auto 7px 12px;
      .text {
        font-size: 16px;
        letter-spacing: 0.27px;
        line-height: 18px;
        margin: auto 17.89px;
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
</style>
