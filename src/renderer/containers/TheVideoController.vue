<template>
  <div
    ref="controller"
    :style="{ cursor: cursorStyle, pointerEvents: isFocused ? 'auto' : 'none' }"
    @mousemove="handleMousemove"
    @mouseenter="handleMouseenter"
    @mouseleave="handleMouseleave"
    @mousedown="handleMousedown"
    @mouseup="handleMouseup"
    @mousedown.left="handleMousedownLeft"
    @click.left="handleMouseupLeft"
    class="the-video-controller"
  >
    <notification-bubble
      ref="nextVideoUI"
      v-if="!isEditable"
      class="notification-bubble"
    />
    <recent-playlist
      ref="recentPlaylist"
      v-fade-in="!isEditable && !isProfessional"
      :display-state="displayState.RecentPlaylist"
      :mousemove-client-position="mousemoveClientPosition"
      :is-dragging="isDragging"
      :paused="paused"
      :last-dragging.sync="lastDragging"
      v-bind.sync="widgetsStatus.RecentPlaylist"
      @can-hover-item="cancelPlayListTimeout"
      @conflict-resolve="conflictResolve"
      @update:playlistcontrol-showattached="updatePlaylistShowAttached"
      class="recent-playlist"
    />
    <div
      v-fade-in="showAllWidgets || progressTriggerStopped"
      v-if="!isProfessional"
      class="masking"
    />
    <play-button
      v-show="!(isSpaceDownInProfessional || isEditable || isDragableInProfessional)"
      :mousedown-on-volume="mousedownOnVolume"
      :mousemove-position="mousemoveClientPosition"
      :show-all-widgets="showAllWidgets"
      :is-focused="isFocused"
      :paused="paused"
      :attached-shown="attachedShown"
      :on-play-button-mouseup="togglePlay"
      @update:playbutton-state="updatePlayButtonState"
      class="play-button"
    />
    <volume-indicator
      ref="volumeIndicator"
      v-show="!(isEditable || isDragableInProfessional)"
      :attached-shown="attachedShown"
      :mousedown-on-play-button="mousedownOnPlayButton"
      :show-all-widgets="showAllWidgets"
      :muted="muted"
      :volume-keydown="volumeKeydown || changeVolumeByMenu"
      :volume="volume"
      :ratio="ratio"
      :is-full-screen="isFullScreen"
      :is-professional="isProfessional"
      :wheel-triggered="wheelTriggered"
      :volume-wheel-triggered="volumeWheelTriggered"
      :current-widget="currentWidget"
      :handle-update-volume="updateVolume"
      :handle-update-muted="updateMuted"
      @update:volume-state="updateVolumeState"
    />
    <transition name="fade">
      <div
        v-show="!isEditable && !isProfessional"
        v-fade-in="showAllWidgets"
        :style="{ marginBottom: preFullScreen ? '10px' : '0' }"
        class="control-buttons"
      >
        <playlist-control
          v-fade-in="displayState.PlaylistControl"
          v-bind.sync="widgetsStatus.PlaylistControl"
          class="button no-drag playlist"
        />
        <subtitle-control
          v-fade-in="displayState.SubtitleControl"
          v-bind.sync="widgetsStatus.SubtitleControl"
          :last-dragging.sync="lastDragging"
          @conflict-resolve="conflictResolve"
          class="button no-drag subtitle"
        />
        <advance-control
          ref="advance"
          v-fade-in="displayState.AdvanceControl"
          v-bind.sync="widgetsStatus.AdvanceControl"
          :last-dragging.sync="lastDragging"
          @conflict-resolve="conflictResolve"
          class="button no-drag advance"
        />
      </div>
    </transition>
    <div
      v-fade-in="isProfessional"
      @mouseup.left.stop=""
      class="sub-control-wrapper"
    >
      <reference-subtitle-control
        :showAttached.sync="referenceShowAttached"
        :last-dragging.sync="lastDragging"
      />
    </div>
    <transition name="fade">
      <the-time-codes
        ref="theTimeCodes"
        v-if="!isProfessional"
        :progress-trigger-stopped.sync="progressTriggerStopped"
        :show-all-widgets="showAllWidgets"
        :duration="duration"
        :show-full-time-code="showFullTimeCode"
        :rate="rate"
        :show-cycle-label="!!singleCycle"
        :show-playlist-loop-label="!!playlistLoop"
        :show-speed-label="showSpeedLabel"
        :on-time-code-click="onTimeCodeClick"
        :style="{ marginBottom: preFullScreen ? '10px' : '0' }"
      />
    </transition>
    <the-progress-bar
      ref="progressbar"
      :show-all-widgets="showAllWidgets"
      :style="{ marginBottom: preFullScreen ? '10px' : '0' }"
    />
    <audio-translate-modal />
    <forbidden-modal />
    <subtitle-editor
      ref="editor"
      :showAttached.sync="referenceShowAttached"
    />
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  mapState, mapGetters, mapActions,
  createNamespacedHelpers,
} from 'vuex';
import { log } from '@/libs/Log';
import {
  Input as inputActions,
  Video as videoActions,
  Subtitle as legacySubtitleActions,
  AudioTranslate as atActions,
  UIStates as uiActions,
} from '@/store/actionTypes';
import { INPUT_COMPONENT_TYPE, getterTypes as iGT } from '@/plugins/input';
import PlayButton from '@/components/PlayingView/PlayButton.vue';
import VolumeIndicator from '@/components/PlayingView/VolumeIndicator.vue';
import AdvanceControl from '@/components/PlayingView/AdvanceControl.vue';
import SubtitleControl from '@/components/PlayingView/SubtitleControl.vue';
import PlaylistControl from '@/components/PlayingView/PlaylistControl.vue';
import TheTimeCodes from '@/components/PlayingView/TheTimeCodes.vue';
import TheProgressBar from '@/containers/TheProgressBar.vue';
import RecentPlaylist from '@/containers/RecentPlaylist.vue';
import NotificationBubble from '@/components/NotificationBubble.vue';
import AudioTranslateModal from '@/containers/AudioTranslateModal.vue';
import ForbiddenModal from '@/containers/ForbiddenModal.vue';
import SubtitleEditor from '@/containers/SubtitleEditor.vue';
import ReferenceSubtitleControl from '@/components/Subtitle/ReferenceSubtitleControl.vue';
import { videodata } from '@/store/video';
import { AudioTranslateStatus } from '../store/modules/AudioTranslate';

const { mapGetters: inputMapGetters } = createNamespacedHelpers('InputPlugin');
/** dom wrapper */
type NamedComponent = {
  name: string,
  element: Element,
};

export default {
  name: 'TheVideoController',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    'play-button': PlayButton,
    'volume-indicator': VolumeIndicator,
    'subtitle-control': SubtitleControl,
    'advance-control': AdvanceControl,
    'playlist-control': PlaylistControl,
    'the-time-codes': TheTimeCodes,
    'the-progress-bar': TheProgressBar,
    'notification-bubble': NotificationBubble,
    'recent-playlist': RecentPlaylist,
    'audio-translate-modal': AudioTranslateModal,
    'forbidden-modal': ForbiddenModal,
    'subtitle-editor': SubtitleEditor,
    'reference-subtitle-control': ReferenceSubtitleControl,
  },
  data() {
    return {
      start: null,
      UIElements: [],
      mouseStopped: false,
      mouseStoppedId: 0,
      mousestopDelay: 3000,
      mouseLeftWindow: false, // 离开当前控件1s后变为false
      mouseleft: false, // 离开当前控件立刻变为false
      mouseLeftId: 0,
      mouseleftDelay: 1000,
      popupShow: false,
      clicksTimer: 0,
      clicksDelay: 250,
      dragDelay: 200,
      widgetsStatus: {},
      lastAttachedShowing: false,
      focusedTimestamp: 0,
      focusDelay: 500,
      listenedWidget: 'TheVideoController',
      attachedShown: false,
      needResetHoverProgressBar: false,
      isMousedown: false,
      isMousemove: false,
      lastDragging: false,
      displayState: {},
      tempRecentPlaylistDisplayState: false,
      clicks: 0,
      videoChanged: false,
      videoChangedTimer: 0,
      isValidClick: true,
      lastMousedownPlaybutton: false,
      playButton: null, // Play Button on Touch Bar
      sidebarButton: null, // Sidebar Button on Touch Bar
      fullScreenBar: null, // Full Screen on Touch Bar
      timeLabel: null, // Time Label which indicates the current time
      scrubber: null,
      touchBar: null,
      lastMousedownVolume: false,
      mousedownOnPlayButton: false,
      mousedownOnVolume: false,
      preFullScreen: false,
      dragOver: false,
      progressTriggerStopped: false,
      openPlayListTimeId: NaN,
      progressDisappearDelay: 1000,
      changeState: false, // 记录是不是要改变显示速率的状态
      changeSrc: false, // 记录是否换过视频
      showSpeedLabel: false, // 是否显示播放速率
      changeVolumeByMenu: false,
      subMenuShow: false,
      subMenuTimer: 0,
      splashTimer: 0,
      invokeAllWidgets: false,
      invokeAllWidgetsTimer: 0,
      referenceShowAttached: false,
    };
  },
  computed: {
    ...mapState({
      currentWidget: ({ Input }) => Input.mousemoveComponentName,
      currentMouseupWidget: ({ Input }) => Input.mouseupComponentName,
      currentMousedownWidget: ({ Input }) => Input.mousedownComponentName,
      mousemoveClientPosition: ({ Input }) => Input.mousemoveClientPosition,
      wheelTime: ({ Input }) => Input.wheelTimestamp,
    }),
    ...mapGetters([
      'originSrc', 'paused', 'ratio', 'duration', 'intrinsicWidth', 'intrinsicHeight', 'singleCycle', 'rate', 'muted', 'volume', 'playlistLoop',
      'winWidth',
      'playingList', 'isFolderList',
      'isFullScreen', 'isFocused', 'isMinimized',
      'leftMousedown', 'progressKeydown', 'volumeKeydown', 'wheelTriggered', 'volumeWheelTriggered',
      'enabledSecondarySub', 'isTranslateModalVisible', 'translateStatus', 'failBubbleId', 'messageInfo',
      'showFullTimeCode',
      'showSidebar',
      'isEditable', 'isProfessional', 'isDragableInProfessional', 'isSpaceDownInProfessional',
    ]),
    ...inputMapGetters({
      inputWheelDirection: iGT.GET_WHEEL_DIRECTION,
    }),
    playlistState() {
      return this.displayState.RecentPlaylist;
    },
    showAllWidgets() {
      if (this.isTranslateModalVisible) return false;
      if (this.invokeAllWidgets) return true;
      return !this.tempRecentPlaylistDisplayState
        && (
          (!this.mouseStopped && !this.mouseLeftWindow)
          || (!this.mouseLeftWindow && this.onOtherWidget)
          || this.attachedShown || this.videoChanged || this.subMenuShow
          || (this.isMousedown && this.currentMousedownWidget === 'PlayButton')
        );
    },
    onOtherWidget() {
      return (
        (this.currentWidget !== this.$options.name)
        && (this.currentWidget !== 'PlayButton')
        && (this.currentWidget !== 'VolumeIndicator')
        && (this.currentWidget !== 'SubtitleEditor')
      );
    },
    cursorStyle() {
      if (this.isTranslateModalVisible || this.isProfessional) {
        return 'default';
      }
      return (this.showAllWidgets || this.tempRecentPlaylistDisplayState)
        && this.isFocused ? 'default' : 'none';
    },
    isDragging() {
      if (this.isMousedown) {
        return this.isMousemove;
      }
      return false;
    },
  },
  watch: {
    showSidebar(val: boolean) {
      if (val) {
        this.conflictResolve('Sidebar');
        this.updateMousedown({ componentName: '' });
      } else {
        this.handleWindowMouseenter();
        this.mouseStoppedId = false;
        clearTimeout(this.mouseStoppedId);
        this.mouseStoppedId = this.clock.setTimeout(() => {
          this.mouseStopped = true;
        }, this.mousestopDelay);
      }
    },
    cursorStyle(style: string) {
      this.$emit('update:update-cursor', style);
    },
    playlistState(val: boolean) {
      this.updatePlaylistState(val);
    },
    originSrc() {
      this.updateShowSidebar(false);
      Object.keys(this.widgetsStatus).forEach((item) => {
        if (item !== 'PlaylistControl') {
          this.widgetsStatus[item].showAttached = false;
        }
      });
      this.isMousedown = false;
      this.videoChanged = true;
      if (this.videoChangedTimer) {
        this.clock.clearTimeout(this.videoChangedTimer);
      }
      this.videoChangedTimer = this.clock.setTimeout(() => {
        this.videoChanged = false;
      }, 3000);
      this.changeSrc = true;
    },
    rate(val: number) {
      // 切换rate的时候如果没有切换过视频就等3秒消失速率图标
      // 切换rate的时候如果有切换过视频就立刻消失速率图标
      // 切换rate的时候如果切成非1的速率就里面显示速率图标
      if (val === 1 && !this.changeSrc) {
        this.changeState = true;
        setTimeout(() => {
          if (this.changeState) {
            this.showSpeedLabel = false;
          }
        }, 3000);
      } else if (val === 1 && this.changeSrc) {
        this.showSpeedLabel = false;
      } else {
        this.changeState = false;
        this.showSpeedLabel = true;
      }
      this.changeSrc = false;
      // 当触发rate 显示界面控件
      this.progressTriggerStopped = true;
      this.clock.clearTimeout(this.progressTriggerId);
      this.progressTriggerId = this.clock.setTimeout(() => {
        this.progressTriggerStopped = false;
      }, this.progressDisappearDelay);
    },
    singleCycle() {
      // 当触发循环播放 显示界面控件
      this.progressTriggerStopped = true;
      this.clock.clearTimeout(this.progressTriggerId);
      this.progressTriggerId = this.clock.setTimeout(() => {
        this.progressTriggerStopped = false;
      }, this.progressDisappearDelay);
    },
    isDragging(val: boolean, oldval: boolean) {
      if (
        !val && oldval
        && !['SubtitleControl', 'AdvanceControl'].includes(this.currentMousedownWidget)
      ) {
        this.lastDragging = true;
      }
    },
    isFocused(newVal: boolean) {
      if (!newVal) {
        this.isValidClick = false;
      }
      this.$emit('update:update-cursor', 'none');
    },
    isMinimized(newVal: boolean, oldVal: boolean) {
      if (!newVal && oldVal) {
        this.isValidClick = true;
      }
    },
    currentWidget(newVal: string, oldVal: string) {
      this.lastWidget = oldVal;
    },
    currentMousedownWidget(newVal: string, oldVal: string) {
      this.lastMousedownWidget = oldVal;
      this.updateMouseup({ componentName: '' });
    },
    currentMouseupWidget(newVal: string, oldVal: string) {
      if (this.showSidebar
        && !this.isDragging
        && ([
          'TheVideoController', 'SubtitleControl', 'PlaylistControl', 'AdvanceControl',
        ].includes(newVal))
      ) {
        this.updateMousedown({ componentName: '' });
        this.updateShowSidebar(false);
      }
      this.lastMouseupWidget = oldVal;
    },
    tempRecentPlaylistDisplayState(val: boolean) {
      this.$event.emit('playlist-display-state', val);
      this.updateMinimumSize();
      if (!val) {
        clearTimeout(this.openPlayListTimeId);
        clearTimeout(this.mouseStoppedId);
        this.mouseStoppedId = this.clock.setTimeout(() => {
          this.mouseStopped = true;
        }, this.mousestopDelay);
      }
    },
    ratio() {
      this.updateMinimumSize();
    },
    isEditable(val: boolean) {
      if (val) {
        Object.keys(this.widgetsStatus).forEach((item) => {
          this.widgetsStatus[item].showAttached = false;
        });
      }
    },
    isFullScreen(val: boolean) {
      this.preFullScreen = process.platform === 'darwin'
      && this.intrinsicWidth / this.intrinsicHeight > window.screen.width / window.screen.height
        ? val : false;
      if (this.fullScreenBar) {
        if (!val) {
          this.fullScreenBar.icon = this.createIcon('touchBar/fullscreen.png');
        } else {
          this.fullScreenBar.icon = this.createIcon('touchBar/resize.png');
        }
      }
    },
    showAllWidgets(val: boolean) {
      this.updateShowAllWidgets(val);
    },
    paused(val: boolean) {
      if (this.playButton) {
        if (val) {
          this.playButton.icon = this.createIcon('touchBar/play.png');
        } else {
          this.playButton.icon = this.createIcon('touchBar/pause.png');
        }
      }
    },
    enabledSecondarySub(val: boolean) {
      if (val) {
        this.updateSubtitleType(false);
        this.subMenuShow = true;
        if (this.subMenuTimer) {
          this.clock.clearTimeout(this.subMenuTimer);
        }
        this.subMenuTimer = this.clock.setTimeout(() => {
          this.subMenuShow = false;
        }, 3000);
        this.tempRecentPlaylistDisplayState = false;
        Object.keys(this.widgetsStatus).forEach((item) => {
          this.widgetsStatus[item].showAttached = item === 'SubtitleControl';
        });
        this.updateMouseup({ componentName: '' });
        this.updateMousedown({ componentName: '' });
      }
    },
    isTranslateModalVisible(visible: boolean) {
      const { ratio } = this;
      let minimumSize = [320, 180];
      // 弹窗出现的时候窗口缩小到一定尺寸应该不能再缩小
      if (visible && ratio > 1) {
        minimumSize = [Math.round(290 * ratio), 290];
      } else if (visible && ratio <= 1) {
        minimumSize = [290, Math.round(290 / ratio)];
      }
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', minimumSize);
    },
  },
  created() {
    this.updateShowAllWidgets(this.showAllWidgets);
    window.addEventListener('mouseover', this.handleWindowMouseenter);
    window.addEventListener('mouseout', this.handleWindowMouseleave);
  },
  beforeDestroy() {
    window.removeEventListener('mouseover', this.handleWindowMouseenter);
    window.removeEventListener('mouseout', this.handleWindowMouseleave);
  },
  mounted() {
    // 当触发seek 显示界面控件
    this.$bus.$on('seek', () => {
      this.progressTriggerStopped = true;
      this.clock.clearTimeout(this.progressTriggerId);
      this.progressTriggerId = this.clock.setTimeout(() => {
        this.progressTriggerStopped = false;
      }, this.progressDisappearDelay);
    });
    this.$bus.$on('titlebar-mousemove', (event: MouseEvent) => {
      this.handleMousemove(event, 'Titlebar');
    });
    this.$bus.$on('show-subtitle-settings', () => {
      this.subMenuShow = true;
      if (this.subMenuTimer) {
        this.clock.clearTimeout(this.subMenuTimer);
      }
      this.subMenuTimer = this.clock.setTimeout(() => {
        this.subMenuShow = false;
      }, 3000);
      this.tempRecentPlaylistDisplayState = false;
      if (this.$refs.advance) {
        this.$refs.advance.handleMenuShow();
      }
      this.updateMouseup({ componentName: '' });
      this.updateMousedown({ componentName: '' });
    });
    this.createTouchBar();
    this.UIElements = this.getAllUIComponents(this.$refs.controller);
    this.UIElements.forEach((value: NamedComponent) => {
      if (value && value.name !== 'ReferenceSubtitleControl') {
        this.displayState[value.name] = value.name !== 'RecentPlaylist';
        if (value.name === 'PlaylistControl' && !this.playingList.length) {
          this.displayState.PlaylistControl = false;
        }
        this.widgetsStatus[value.name] = {
          selected: false,
          showAttached: false,
          mousedownOnOther: false,
          mouseupOnOther: false,
          hovering: false,
        };
      }
    });
    if (this.isFolderList === false) {
      this.widgetsStatus.PlaylistControl.showAttached = true;
      clearTimeout(this.openPlayListTimeId);
      this.openPlayListTimeId = setTimeout(() => {
        this.widgetsStatus.PlaylistControl.showAttached = false;
      }, 4000);
    } else {
      clearTimeout(this.mouseStoppedId);
      this.mouseStoppedId = this.clock.setTimeout(() => {
        this.mouseStopped = true;
      }, this.mousestopDelay);
    }
    this.$bus.$on('open-playlist', () => {
      this.widgetsStatus.PlaylistControl.showAttached = true;
      clearTimeout(this.openPlayListTimeId);
      this.openPlayListTimeId = setTimeout(() => {
        this.widgetsStatus.PlaylistControl.showAttached = false;
      }, 4000);
    });
    this.$bus.$on('switch-playlist', () => {
      this.widgetsStatus.PlaylistControl.showAttached = !this.tempRecentPlaylistDisplayState;
    });
    this.$bus.$on('close-playlist', () => {
      this.widgetsStatus.PlaylistControl.showAttached = false;
    });
    this.$bus.$on('drag-over', () => {
      this.clock.clearTimeout(this.openPlayListTimeId);
      this.dragOver = true;
    });
    this.$bus.$on('drag-leave', () => {
      this.dragOver = false;
    });
    this.$bus.$on('invoke-all-widgets', () => {
      clearTimeout(this.splashTimer);
      clearTimeout(this.invokeAllWidgetsTimer);

      this.$bus.$emit('mask-highlight', true);
      this.splashTimer = setTimeout(() => { this.$bus.$emit('mask-highlight', false); }, 300);

      this.invokeAllWidgets = true;
      this.invokeAllWidgetsTimer = setTimeout(() => { this.invokeAllWidgets = false; }, 3000);
    });
    this.$bus.$on('drop', () => {
      this.dragOver = false;
    });
    this.$bus.$on('to-fullscreen', () => {
      this.handleVolumeUIWhenFullScreenChanged();
    });
    this.$bus.$on('toggle-fullscreen', () => {
      this.handleVolumeUIWhenFullScreenChanged();
    });
    this.$bus.$on('off-fullscreen', () => {
      this.handleVolumeUIWhenFullScreenChanged();
    });
    this.$bus.$on('change-volume-menu', () => {
      this.changeVolumeByMenu = true;
      setTimeout(() => {
        this.changeVolumeByMenu = false;
      });
    });
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('keyup', this.handleKeyup);
    document.addEventListener('wheel', this.handleWheel);
  },
  destroyed() {
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('keyup', this.handleKeyup);
    document.removeEventListener('wheel', this.handleWheel);
  },
  methods: {
    ...mapActions({
      updateMousemove: inputActions.MOUSEMOVE_UPDATE,
      updateMousedown: inputActions.MOUSEDOWN_UPDATE,
      updateMouseup: inputActions.MOUSEUP_UPDATE,
      updateKeydown: inputActions.KEYDOWN_UPDATE,
      updateKeyup: inputActions.KEYUP_UPDATE,
      updateWheel: inputActions.WHEEL_UPDATE,
      updateSubtitleType: legacySubtitleActions.UPDATE_SUBTITLE_TYPE,
      updateHideModalCallback: atActions.AUDIO_TRANSLATE_MODAL_HIDE_CALLBACK,
      updateHideBubbleCallback: atActions.AUDIO_TRANSLATE_BUBBLE_CANCEL_CALLBACK,
      updateShowAllWidgets: uiActions.UPDATE_SHOW_ALLWIDGETS,
      updatePlaylistState: uiActions.UPDATE_PLAYLIST,
      updateShowSidebar: uiActions.UPDATE_SHOW_SIDEBAR,
    }),
    onTimeCodeClick() {
      this.$store.dispatch('showFullTimeCode', !this.showFullTimeCode);
    },
    createTouchBar() {
      const { TouchBar } = this.$electron.remote;
      const {
        TouchBarLabel, TouchBarButton,
        TouchBarSpacer,
      } = TouchBar;

      this.timeLabel = new TouchBarLabel();

      this.sidebarButton = new TouchBarButton({
        icon: this.createIcon('touchBar/sidebar.png'),
        click: () => {
          this.updateShowSidebar(!this.showSidebar);
        },
      });
      this.previousButton = new TouchBarButton({
        icon: this.createIcon('touchBar/lastVideo.png'),
        click: () => {
          if (!this.singleCycle) this.$bus.$emit('previous-video');
          else this.$bus.$emit('seek', 0);
        },
      });
      this.restartButton = new TouchBarButton({
        icon: this.createIcon('touchBar/restart.png'),
        click: () => {
          this.$bus.$emit('seek', 0);
        },
      });
      this.playButton = new TouchBarButton({
        icon: this.createIcon('touchBar/pause.png'),
        click: () => {
          this.$bus.$emit('toggle-playback');
        },
      });
      this.nextButton = new TouchBarButton({
        icon: this.createIcon('touchBar/nextVideo.png'),
        click: () => {
          this.$bus.$emit('seek', Math.ceil(this.duration));
        },
      });
      this.fullScreenBar = new TouchBarButton({
        icon: this.createIcon('touchBar/fullscreen.png'),
        click: () => {
          this.$bus.$emit('toggle-fullscreen');
        },
      });
      this.touchBar = new TouchBar({
        items: [
          this.sidebarButton,
          this.fullScreenBar,
          new TouchBarSpacer({ size: 'large' }),
          this.previousButton,
          this.playButton,
          this.nextButton,
          this.restartButton,
          new TouchBarSpacer({ size: 'large' }),
          this.timeLabel,
          new TouchBarSpacer({ size: 'large' }),
        ],
      });
      this.$electron.remote.getCurrentWindow().setTouchBar(this.touchBar);
    },
    updateMinimumSize() {
      const minimumSize = this.tempRecentPlaylistDisplayState && this.ratio !== 0
        ? [512, Math.round(512 / this.ratio)]
        : [320, 180];
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', minimumSize);
    },
    conflictResolve(name: string) {
      Object.keys(this.widgetsStatus).forEach((item) => {
        this.widgetsStatus[item].showAttached = item === name;
      });
      if (name !== 'Sidebar' && this.showSidebar) this.updateShowSidebar(false);
    },
    cancelPlayListTimeout() {
      clearTimeout(this.openPlayListTimeId);
    },
    updatePlaylistShowAttached(event: boolean) {
      clearTimeout(this.openPlayListTimeId);
      this.widgetsStatus.PlaylistControl.showAttached = event;
    },
    updatePlayButtonState(mousedownState: boolean) {
      this.mousedownOnPlayButton = mousedownState;
    },
    updateVolumeState(mousedownState: boolean) {
      this.mousedownOnVolume = mousedownState;
    },
    onTickUpdate() {
      if (!this.start) {
        this.start = Date.now();
      }
      const timestamp = Date.now();

      const ticks = timestamp - this.start;
      this.clock.tick(ticks > 0 ? ticks : 0);
      this.UIStateManager();
      // 当处于字幕高级编辑模式，不自动播放下一视频
      if (!this.isProfessional && !videodata.paused && videodata.time + 1 >= this.duration) {
        // we need set the paused state to go to next video
        // this state will be reset on mounted of BaseVideoPlayer
        videodata.paused = true;
        // we need to reset the hoverProgressBar for play next video
        this.needResetHoverProgressBar = true;
        // 如果要自动切下个视频的时候，这个时候视频的自能翻译是失败的
        // 但是气泡和modal显示着，就不自动切，用户手动关闭再切
        const translateFailBubbleExist = this.messageInfo
          && this.messageInfo.find((e: { id: string }) => e.id === this.failBubbleId);
        log.debug('TheVideoController.vue', translateFailBubbleExist, this.messageInfo, this.failBubbleId);
        if (this.translateStatus === AudioTranslateStatus.Fail && this.isTranslateModalVisible) {
          this.$store.dispatch(videoActions.PAUSE_VIDEO);
          this.updateHideModalCallback(() => {
            this.$bus.$emit('next-video');
            this.$store.dispatch(videoActions.PLAY_VIDEO);
          });
        } else if (this.translateStatus === AudioTranslateStatus.Fail
          && translateFailBubbleExist) {
          this.$store.dispatch(videoActions.PAUSE_VIDEO);
          this.updateHideBubbleCallback(() => {
            this.$bus.$emit('next-video');
            this.$store.dispatch(videoActions.PLAY_VIDEO);
          });
        } else {
          this.$bus.$emit('next-video');
        }
      }

      this.start = timestamp;

      if (this.isFocused) {
        this.timeLabel.label = this.timecodeFromSeconds(Math.floor(videodata.time));
      }
      /*
      /* Rendering
      /*
      /* UI绘制/动画更新部分应该使用requestAnimationFrame
      /* 当前 UIManager() 的内部实现还需要继续整理和细分 特别像 clock、事件处理、UI状态更新
      /* 如果涉及到播放中的状态更新 可以依赖该UIManager，因为它本身是由video的ontimeupdate触发
      /*                                                                                  */
      requestAnimationFrame(() => {
      // TODO: There is a probability that the properties are undefined and causing test failure.
      // It's not a best practice to use refs frequently.
      // There should be a better way to handle timeline.
        try {
          this.$refs.nextVideoUI.checkNextVideoUI(videodata.time);
          if (this.tempRecentPlaylistDisplayState) {
            this.$refs.recentPlaylist.updatelastPlayedTime(videodata.time);
          } else {
            this.$refs.theTimeCodes.updateTimeContent(videodata.time);
            if (this.needResetHoverProgressBar) {
              this.needResetHoverProgressBar = false;
              // reset hover-progressbar state
              this.$refs.progressbar.updateHoveredProgressBar(videodata.time, -1);
            }
            this.$refs.progressbar.updatePlayProgressBar(videodata.time);
          }
          this.UIDisplayManager();
        } catch (exception) {
          // do nothing
        }
      });
      // loop cues
      if (this.$refs.editor) {
        requestAnimationFrame(this.$refs.editor.loopCues);
      }
    },
    UIDisplayManager() {
      const tempObject = {
        PlaylistControl: true,
        RecentPlaylist: false,
      };
      Object.keys(this.displayState).forEach((index) => {
        tempObject[index] = !this.widgetsStatus.PlaylistControl.showAttached;
      });
      if (this.widgetsStatus.PlaylistControl.showAttached) this.updateShowSidebar(false);
      const ratio = window.innerWidth / window.innerHeight;
      if (ratio < 1 && this.winWidth < 512) {
        tempObject.PlaylistControl = false;
      }
      tempObject.RecentPlaylist = this.widgetsStatus.PlaylistControl.showAttached
        && !this.dragOver;
      this.displayState = tempObject;
      this.tempRecentPlaylistDisplayState = this.widgetsStatus.PlaylistControl.showAttached;
    },
    UIStateManager() {
      const {
        currentMousedownWidget,
        lastMousedownWidget,
        currentMouseupWidget,
        lastMouseupWidget,
      } = this;
      const mousedownChanged = currentMousedownWidget !== lastMousedownWidget;
      const mouseupChanged = currentMouseupWidget !== lastMouseupWidget;
      Object.keys(this.widgetsStatus).forEach((name) => {
        this.widgetsStatus[name].selected = name;
        if (mousedownChanged) {
          this.widgetsStatus[name].mousedownOnOther = currentMousedownWidget !== name;
          // 播放列表与控制它的按钮在实现并不是父子组件，然而在逻辑上是附属关系
          // 因此对于mousedown与mouseup对两者都做了判断
          if (name === 'RecentPlaylist') {
            this.widgetsStatus[name].mousedownOnOther = currentMousedownWidget !== name
              && currentMousedownWidget !== 'PlaylistControl';
          }
        }
        if (mouseupChanged) {
          this.widgetsStatus[name].mouseupOnOther = currentMouseupWidget !== name;
          if (name === 'RecentPlaylist') {
            this.widgetsStatus[name].mouseupOnOther = currentMouseupWidget !== 'PlaylistControl'
              && currentMousedownWidget !== 'PlaylistControl';
          }
        }
        if (!this.showAllWidgets) {
          // 播放列表不受showAllwidgets变量的影响而关闭
          if (name !== 'PlaylistControl') {
            this.widgetsStatus[name].showAttached = false;
          }
        }
      });
      this.attachedShown = Object.keys(this.widgetsStatus)
        .some(key => this.widgetsStatus[key].showAttached === true);
    },
    // Event listeners
    handleMousemove(event: MouseEvent, component: string) {
      const { clientX, clientY, target } = event;
      this.mouseStopped = false;
      if (this.isMousedown) {
        this.isMousemove = true;
      }
      if (this.mouseStoppedId) {
        this.clock.clearTimeout(this.mouseStoppedId);
      }
      if (!this.lastMousedownPlaybutton && !this.tempRecentPlaylistDisplayState) {
        this.mouseStoppedId = this.clock.setTimeout(() => {
          this.mouseStopped = true;
        }, this.mousestopDelay);
      }
      const componentName = component || this.getComponentName(target);
      this.updateMousemove({
        componentName,
        clientPosition: [clientX, clientY],
      });
    },
    handleMouseenter() {
      this.mouseleft = false;
    },
    handleMouseleave() {
      this.mouseleft = true;
    },
    handleWindowMouseenter() {
      this.mouseLeftWindow = false;
      if (this.mouseLeftId) {
        this.clock.clearTimeout(this.mouseLeftId);
      }
    },
    handleWindowMouseleave() {
      this.mouseLeftId = this.clock.setTimeout(() => {
        this.mouseLeftWindow = true;
      }, this.mouseleftDelay);
    },
    handleMousedown(event: MouseEvent) {
      const { target, buttons } = event;
      this.updateMousedown({ componentName: this.getComponentName(target), buttons });
    },
    handleMouseup(event: MouseEvent) {
      const { target, buttons } = event;
      this.updateMouseup({ componentName: this.getComponentName(target), buttons });
    },
    handleMousedownLeft(e: MouseEvent) {
      this.isMousedown = true;
      this.lastMousedownPlaybutton = this.getComponentName(e.target) === 'PlayButton';
      this.lastMousedownVolume = this.getComponentName(e.target) === 'VolumeIndicator';
      if (this.lastMousedownPlaybutton || this.lastMousedownVolume) {
        this.mouseStopped = false;
        if (this.mouseStoppedId) {
          this.clock.clearTimeout(this.mouseStoppedId);
        }
      }
    },
    handleMouseupLeft() { // eslint-disable-line complexity
      this.isMousemove = false;
      this.isValidClick = true;
      this.clicks += 1;
      if (this.clicksTimer) {
        clearTimeout(this.clicksTimer);
      }
      // 这里的事件监听和progress-bar里面document.mouseup 事件有冲突
      // 需要mouse down来记录是否是组件内部事件处理
      if ((this.lastDragging && this.lastAttachedShowing) || !this.isMousedown) {
        this.clicks = 0;
        return;
      }
      if (this.isMousedown && (this.lastMousedownPlaybutton || this.lastMousedownVolume)) {
        this.mouseStoppedId = this.clock.setTimeout(() => {
          this.mouseStopped = true;
        }, this.mousestopDelay);
        this.lastMousedownPlaybutton = false;
        this.lastMousedownVolume = false;
      }
      this.isMousedown = false;
      if (this.clicks === 1) {
        this.clicksTimer = setTimeout(() => {
          this.clicks = 0;
          this.lastDragging = false;
          this.lastAttachedShowing = this.widgetsStatus.SubtitleControl.showAttached
            || this.widgetsStatus.AdvanceControl.showAttached
            || this.widgetsStatus.PlaylistControl.showAttached;
        }, this.clicksDelay);
      } else if (this.clicks === 2) {
        clearTimeout(this.clicksTimer);
        this.clicks = 0;
        if (this.currentMouseupWidget === 'TheVideoController'
          || this.currentMouseupWidget === 'SubtitleEditor') {
          this.toggleFullScreenState();
        }
      }
    },
    handleKeydown({ code }: { code: string }) {
      this.updateKeydown({ pressedKeyboardCode: code });
    },
    handleKeyup({ code }: { code: string }) {
      this.updateKeyup({ releasedKeyboardCode: code });
    },
    handleWheel({ target, timeStamp }: { target: Element; timeStamp: number }) {
      const componentName = this.mouseleft ? 'Sidebar' : this.getComponentName(target);
      this.updateWheel({
        componentName,
        timestamp: timeStamp,
        direction: this.inputWheelDirection,
      });
    },
    // Helper functions
    getAllUIComponents(rootElement: Element) {
      const { children } = rootElement;
      const names: NamedComponent[] = [];
      for (let i = 0; i < children.length; i += 1) {
        this.processSingleElement(children[i]).forEach((componentName: NamedComponent) => {
          names.push(componentName);
        });
      }
      return names;
    },
    isChildComponent(element: Element) {
      let componentName = null;
      this.$children.forEach((childComponenet: Vue) => {
        if (childComponenet && childComponenet.$el === element) {
          componentName = childComponenet.$options.name;
        }
      });
      return componentName;
    },
    processSingleElement(element: Element) {
      const names = [];
      const name = this.isChildComponent(element);
      if (name) {
        names.push({
          name,
          element,
        });
      } else {
        const { children } = element;
        for (let i = 0; i < children.length; i += 1) {
          names.push(this.processSingleElement(children[i])[0]);
        }
      }
      return names;
    },
    getComponentName(element: Element) {
      let componentName = this.$options.name;
      if (element instanceof HTMLElement || element instanceof SVGElement) {
        /* eslint-disable consistent-return */
        this.UIElements.forEach((UIElement: NamedComponent) => {
          if (UIElement.element.contains(element)) {
            componentName = UIElement.name;
            return componentName;
          }
        });
      }
      return componentName;
    },
    toggleFullScreenState() {
      this.$bus.$emit('toggle-fullscreen');
    },
    togglePlay() {
      this.$bus.$emit('toggle-playback');
    },
    updateVolume(val: number) {
      this.$store.dispatch(videoActions.VOLUME_UPDATE, val);
    },
    updateMuted() {
      this.$store.dispatch(videoActions.TOGGLE_MUTED);
    },
    handleVolumeUIWhenFullScreenChanged() {
      const winHeight = window.screen.height;
      const winWidth = window.screen.width;
      const winRatio = winWidth / winHeight;
      // the height of video after scaling
      const videoRealHeight = winRatio > this.ratio ? winHeight : winWidth / this.ratio;
      const backgroundHeight = videoRealHeight <= 1080 ? ((videoRealHeight - 180) / 3) + 100
        : winHeight * 0.37;
      const muteTop = videoRealHeight <= 1080 ? backgroundHeight + 2 : backgroundHeight + 4;
      const showArea = this.$refs.volumeIndicator && this.$refs.volumeIndicator.$refs
        && this.$refs.volumeIndicator.$refs.showArea;
      if (!this.isFullScreen && showArea) {
        requestAnimationFrame(() => {
          showArea.style.setProperty('--background-height', `${backgroundHeight}px`);
          showArea.style.setProperty('--mute-top', `${muteTop}px`);
        });
      } else if (showArea) {
        requestAnimationFrame(() => {
          showArea.style.setProperty('--background-height', '');
          showArea.style.setProperty('--mute-top', '');
        });
      }
    },
  },
};
</script>
<style lang="scss">
.the-video-controller {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  opacity: 1;
  transition: opacity 400ms;
  z-index: auto;
}
.sub-control-wrapper {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 12;
}
.play-button {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: auto;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}
.masking {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 50%;
  opacity: 0.3;
  z-index: 1;
  background-image: linear-gradient(
    -180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.19) 62%,
    rgba(0, 0, 0, 0.29) 100%
  );
}
.notification-bubble {
  z-index: 105;
}
.recent-playlist {
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 100; // in front of all widgets
}

.translate-enter-active, .translate-leave-active {
  transition:
    opacity 300ms cubic-bezier(0.2, 0.3, 0.01, 1),
    transform 300ms cubic-bezier(0.2, 0.3, 0.01, 1);
}
.translate-enter, .translate-leave-to {
  opacity: 0;
  transform: translateY(100px);
}
.control-buttons {
  display: flex;
  justify-content: flex-end;
  position: fixed;
  z-index: 10;
  box-sizing: content-box; // 为了盖住字幕条
  .button {
    cursor: pointer;
    position: relative;
  }
  .subtitle {
    @media
      screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-right: 17.6px;
    }
    @media
      screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-right: 25.6px;
    }
    @media
      screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-right: 40px;
    }
  }
  .playlist {
    @media
      screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-right: 17.6px;
    }
    @media
      screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-right: 25.6px;
    }
    @media
      screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-right: 40px;
    }
  }
  img {
    width: 100%;
    height: 100%;
  }
}
@media
  screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
  .control-buttons {
    display: none;
  }
  .play-button {
    width: 54px;
    height: 54px;
  }
}
@media
  screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .control-buttons {
    width: 115px;
    height: 22px;
    right: 25px;
    bottom: 25px;
    .button {
      width: 26.4px;
      height: 22px;
    }
  }
  .play-button {
    width: 67px;
    height: 67px;
  }
}
@media
  screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .control-buttons {
    width: 167px;
    height: 32px;
    right: 30px;
    bottom: 29px;
    .button {
      width: 38.4px;
      height: 32px;
    }
  }
  .play-button {
    width: 93px;
    height: 93px;
  }
}
@media
  screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .control-buttons {
    width: 260px;
    height: 50px;
    right: 45px;
    bottom: 37px;
    .button {
      width: 60px;
      height: 50px;
    }
  }
  .play-button {
    width: 129px;
    height: 129px;
  }
}
.fade-in {
  visibility: visible;
  opacity: 1;
  transition: opacity 100ms ease-in;
}
.fade-out {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 300ms, opacity 300ms ease-out;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 200ms ease-in;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
