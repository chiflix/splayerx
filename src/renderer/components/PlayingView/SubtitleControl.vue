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
            :class="{ 'backdrop': useBlur }"
            class="element bottom"
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
                :use-blur="useBlur"
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
                :change-subtitle="isFirstSubtitle ? changeFirstSubtitle : changeSecondarySubtitle"
                @off-subtitle="offCurrentSubtitle"
                @remove-subtitle="deleteCurrentSubtitle"
              />
              <!-- grab btn -->
              <div
                v-if="computedAvailableItems.length === 0"
                :style="{
                  color: '#fff',
                  lineHeight: '32px',
                  fontSize: '13.2px',
                  width: '176px',
                  margin: '0 auto',
                  cursor: 'pointer',
                  position: 'relative',
                  top: '-5px',
                }"
              >
                <div v-if="!isTranslated">
                  <div
                    v-if="aiSelectClicked"
                    :style="{
                      display: 'flex',
                    }"
                  >
                    <span
                      :style="{
                        marginLeft: '5px',
                        marginRight: '5px',
                      }"
                    >音频语言: </span>
                    <div
                      :style="{
                        paddingTop: '2px',
                        width: '42%',
                      }"
                    >
                      <Select
                        :selected="audioLanguage.label"
                        :list="lanugages"
                        :change="changeLanguage"
                      />
                    </div>
                    <div
                      @click="translate"
                      :style="{
                        marginLeft: '5px',
                      }"
                    >
                      确定
                    </div>
                  </div>
                  <span
                    v-if="!aiSelectClicked"
                    @click="aiSelectClicked = true"
                    :style="{
                      marginLeft: '12.73px',
                    }"
                  >自能翻译</span>
                </div>
                <div v-if="isTranslated">
                  正在自能翻译 {{ grabProgress }}%
                </div>
              </div>
              <!-- grab btn -->
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
import { Input as InputActions, Subtitle as subtitleActions, SubtitleManager as smActions } from '@/store/actionTypes';
import { SubtitleControlListItem, Type } from '@/interfaces/ISubtitle';
// grab libs
import { audioGrabService } from '@/services/media/AudioGrabService';
import { codeToLanguageName } from '@/libs/language';
import { AITaskInfo } from '@/interfaces/IMediaStorable';
import { TranscriptInfo } from '@/services/subtitle';
import Select from '@/components/PlayingView/Select.vue';
// grab libs
import lottie from '@/components/lottie.vue';
import animationData from '@/assets/subtitle.json';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import SubtitleList from '@/components/PlayingView/SubtitleList.vue';
import Icon from '../BaseIconContainer.vue';
import { addBubble } from '@/helpers/notificationControl';
import { SUBTITLE_OFFLINE } from '@/helpers/notificationcodes';

export default {
  name: 'SubtitleControl',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    lottie,
    Icon,
    Select,
    'subtitle-list': SubtitleList,
  },
  props: {
    showAllWidgets: Boolean,
    showAttached: Boolean,
    lastDragging: Boolean,
  },
  data() {
    return {
      useBlur: false,
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
      // grab btn datas
      audioLanguage: { label: codeToLanguageName('en'), value: 'en' },
      lanugages: ['zh-Hans', 'zh-Hant', 'ja', 'ko', 'en', 'es', 'ar']
        .map((e: string) => ({ label: codeToLanguageName(e), value: e })),
      aiSelectClicked: false,
      isTranslated: false,
      grabProgress: 0,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'originSrc', 'primarySubtitleId', 'secondarySubtitleId', 'list', 'privacyAgreement', 'meidaHash', 'primaryLanguage', 'duration',
      'calculatedNoSub', 'winHeight', 'isFirstSubtitle', 'enabledSecondarySub', 'isRefreshing', 'winRatio']),
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
      // grab btn logic
      let nums = this.realItemsNum;
      if (this.computedAvailableItems.length === 0) {
        nums += 1;
      }
      // grab btn logic
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return (nums * 31) + 45;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return (nums * 37) + 54;
      }
      return (nums * 51) + 76;
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
    computedAvailableItems(val: SubtitleControlListItem[]) {
      this.updateNoSubtitle(!val.length);
    },
    list(val: SubtitleControlListItem[]) {
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
  created() { this.useBlur = window.devicePixelRatio === 1; },
  mounted() {
    this.$refs.refreshRotate.$el.addEventListener('animationiteration', () => {
      this.count += 1;
    });
    document.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 0) {
        if (!this.showAttached) {
          if (this.validEnter || this.currentMousedownComponent === this.$options.name) {
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
    if (navigator.onLine) {
      this.initializeManager();
    }
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
      updateNoSubtitle: subtitleActions.UPDATE_NO_SUBTITLE,
      updateSubtitleType: subtitleActions.UPDATE_SUBTITLE_TYPE,
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
    changeLanguage(item: any) {
      this.audioLanguage = item;
    },
    translate() {
      this.isTranslated = true;
      const grab = audioGrabService.send({
        mediaHash: this.mediaHash,
        videoSrc: this.originSrc,
        audioLanguageCode: this.audioLanguage.value,
        targetLanguageCode: this.primaryLanguage,
      });
      if (grab) {
        grab.on('grab', (time: number) => {
          this.grabProgress = Math.ceil((time / this.duration) * 100);
        });
        grab.on('error', (error: Error) => {
          console.log(error);
        });
        grab.on('task', (taskInfo: AITaskInfo) => {
          console.log(taskInfo);
        });
        grab.on('transcriptInfo', (transcriptInfo: TranscriptInfo) => {
          console.log(transcriptInfo);
        });
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
    overflow: hidden;
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
      width: 100%;
      height: 100%;
      top: 0;
      border: 1px solid rgba(160,160,160,0.7);
      background-image: radial-gradient(
        80% 130%,
        rgba(85,85,85,0.88) 20%,
        rgba(85,85,85,0.78) 50%,
        rgba(85,85,85,0.72) 60%,
        rgba(85,85,85,0.46) 80%,
        rgba(85,85,85,0.00) 100%
      );
    }
    .backdrop {
      border-width: 0px;
      background-image: none;
      background-color: rgba(0, 0, 0, 0.1);
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
      max-height: 138px;
    }
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
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    .sub-menu-wrapper {
      height: auto;
      max-height: 239px;
    }
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
    .sub-menu-wrapper {
      position: absolute;
      bottom: 44px;
      left: -106px;
      width: 204px;
      max-height: 239px;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    .sub-menu-wrapper {
      height: auto;
      max-height: 433px;
    }
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
    .sub-menu-wrapper {
      position: absolute;
      bottom: 70px;
      left: -133px;
      width: 286px;
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

.sub-delete-enter-active, .sub-delete-leave-active {
  transition: opacity 150ms;
}
.sub-delete-enter, .sub-delete-leave-to {
  opacity: 0;
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
