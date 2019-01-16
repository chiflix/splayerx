<template>
  <div ref="controller"
    :data-component-name="$options.name"
    class="the-video-controller"
    :style="{ cursor: cursorStyle }"
    @mousemove="handleMousemove"
    @mouseenter="handleMouseenter"
    @mouseleave="handleMouseleave"
    @mousedown="handleMousedown"
    @mouseup="handleMouseup"
    @mousedown.left="handleMousedownLeft"
    @mouseup.left="handleMouseupLeft"
    @dblclick="handleDblclick">
    <titlebar currentView="Playingview" :showAllWidgets="showAllWidgets" :recentPlaylist="displayState['recent-playlist']"></titlebar>
    <notification-bubble ref="nextVideoUI"/>
    <recent-playlist class="recent-playlist" ref="recentPlaylist"
    :displayState="displayState['recent-playlist']"
    :mousemovePosition="mousemovePosition"
    :isDragging="isDragging"
    :lastDragging.sync="lastDragging"
    v-bind.sync="widgetsStatus['recent-playlist']"
    @conflict-resolve="conflictResolve"
    @update:playlistcontrol-showattached="updatePlaylistShowAttached"/>
    <div class="masking" v-fade-in="showAllWidgets"/>
    <play-button :paused="paused" />
    <volume-indicator :showAllWidgets="showAllWidgets" />
    <div class="control-buttons" v-fade-in="showAllWidgets">
      <playlist-control class="button playlist" v-fade-in="displayState['playlist-control']" v-bind.sync="widgetsStatus['playlist-control']"/>
      <subtitle-control class="button subtitle" v-fade-in="displayState['subtitle-control']"
      v-bind.sync="widgetsStatus['subtitle-control']" :lastDragging.sync="lastDragging"
      @conflict-resolve="conflictResolve"/>
      <advance-control class="button advance" v-fade-in="displayState['advance-control']"
      v-bind.sync="widgetsStatus['advance-control']" :lastDragging.sync="lastDragging"
      @conflict-resolve="conflictResolve"/>
    </div>
    <the-time-codes ref="theTimeCodes" :showAllWidgets="showAllWidgets" />
    <the-progress-bar ref="progressbar" :showAllWidgets="showAllWidgets" />
  </div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';
import { Input as inputMutations } from '@/store/mutationTypes';
import { Input as inputActions } from '@/store/actionTypes';
import Titlebar from '../Titlebar.vue';
import PlayButton from './PlayButton.vue';
import VolumeIndicator from './VolumeIndicator.vue';
import AdvanceControl from './AdvanceControl.vue';
import SubtitleControl from './SubtitleControl.vue';
import PlaylistControl from './PlaylistControl.vue';
import TheTimeCodes from './TheTimeCodes.vue';
import TheProgressBar from './TheProgressBar.vue';
import NotificationBubble from '../NotificationBubble.vue';
import RecentPlaylist from './RecentPlaylist.vue';
import SpeedLabel from './RateLabel.vue';
import { videodata } from '../../store/video';

export default {
  name: 'the-video-controller',
  components: {
    titlebar: Titlebar,
    'play-button': PlayButton,
    'volume-indicator': VolumeIndicator,
    'subtitle-control': SubtitleControl,
    'advance-control': AdvanceControl,
    'playlist-control': PlaylistControl,
    'the-time-codes': TheTimeCodes,
    'the-progress-bar': TheProgressBar,
    'notification-bubble': NotificationBubble,
    'recent-playlist': RecentPlaylist,
    SpeedLabel,
  },
  data() {
    return {
      start: null,
      UIElements: [],
      mouseStopped: false,
      mouseStoppedId: 0,
      mousestopDelay: 3000,
      mouseLeftWindow: false,
      mouseLeftId: 0,
      mouseleftDelay: 1000,
      popupShow: false,
      clicksTimer: 0,
      clicksDelay: 200,
      dragDelay: 200,
      widgetsStatus: {},
      preventSingleClick: false,
      lastAttachedShowing: false,
      focusedTimestamp: 0,
      focusDelay: 500,
      listenedWidget: 'the-video-controller',
      attachedShown: false,
      needResetHoverProgressBar: false,
      isMousedown: false,
      isMousemove: false,
      lastDragging: false,
      displayState: {},
      tempRecentPlaylistDisplayState: false,
      videoChanged: false,
      videoChangedTimer: 0,
    };
  },
  computed: {
    ...mapState({
      currentWidget: state => state.Input.mousemoveTarget,
      currentMouseupWidget: state => state.Input.mouseupTarget,
      currentMousedownWidget: state => state.Input.mousedownTarget,
      mousemovePosition: state => state.Input.mousemovePosition,
      wheelTime: state => state.Input.wheelTimestamp,
    }),
    ...mapGetters(['paused', 'duration', 'leftMousedown', 'ratio', 'playingList', 'originSrc']),
    onlyOneVideo() {
      return this.playingList.length === 1;
    },
    showAllWidgets() {
      return !this.tempRecentPlaylistDisplayState &&
        ((!this.mouseStopped && !this.mouseLeftWindow) ||
        (!this.mouseLeftWindow && this.onOtherWidget) ||
        this.attachedShown || this.videoChanged);
    },
    onOtherWidget() {
      return this.currentWidget !== this.$options.name;
    },
    cursorStyle() {
      return this.showAllWidgets || !this.isFocused ||
        this.tempRecentPlaylistDisplayState ? 'default' : 'none';
    },
    isFocused() {
      return this.$store.state.Window.isFocused;
    },
    isDragging() {
      if (this.isMousedown) {
        return this.isMousemove;
      }
      return false;
    },
  },
  watch: {
    originSrc() {
      Object.keys(this.widgetsStatus).forEach((item) => {
        if (item !== 'playlist-control') {
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
    },
    isDragging(val, oldval) {
      if (!val && oldval) {
        this.lastDragging = true;
      }
    },
    isFocused(newValue) {
      if (newValue) {
        this.focusedTimestamp = Date.now();
      }
    },
    currentWidget(newVal, oldVal) {
      this.lastWidget = oldVal;
    },
    currentMousedownWidget(newVal, oldVal) {
      this.lastMousedownWidget = oldVal;
    },
    currentMouseupWidget(newVal, oldVal) {
      this.lastMouseupWidget = oldVal;
    },
    tempRecentPlaylistDisplayState() {
      this.updateMinimumSize();
    },
    ratio() {
      this.updateMinimumSize();
    },
  },
  mounted() {
    this.UIElements = this.getAllUIComponents(this.$refs.controller);
    this.UIElements.forEach((value) => {
      this.displayState[value.name] = true;
      if (value.name === 'recent-playlist') this.displayState[value.name] = false;
      if (value.name === 'playlist-control' && this.onlyOneVideo) {
        this.displayState['playlist-control'] = false;
      }
      this.widgetsStatus[value.name] = {
        selected: false,
        showAttached: false,
        mousedownOnOther: false,
        mouseupOnOther: false,
        hovering: false,
      };
    });

    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('keyup', this.handleKeyup);
    document.addEventListener('wheel', this.handleWheel);
  },
  methods: {
    ...mapMutations({
      updateMousemoveTarget: inputMutations.MOUSEMOVE_TARGET_UPDATE,
    }),
    ...mapActions({
      updateMousemovePosition: inputActions.MOUSEMOVE_POSITION,
      updateMousedown: inputActions.MOUSEDOWN_UPDATE,
      updateMouseup: inputActions.MOUSEUP_UPDATE,
      updateKeydown: inputActions.KEYDOWN_UPDATE,
      updateKeyup: inputActions.KEYUP_UPDATE,
      updateWheel: inputActions.WHEEL_UPDATE,
    }),
    updateMinimumSize() {
      const minimumSize = this.tempRecentPlaylistDisplayState
        ? [512, Math.round(512 / this.ratio)]
        : [320, 180];
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', minimumSize);
    },
    conflictResolve(name) {
      Object.keys(this.widgetsStatus).forEach((item) => {
        if (item !== name) {
          this.widgetsStatus[item].showAttached = false;
        }
      });
    },
    updatePlaylistShowAttached(event) {
      this.widgetsStatus['playlist-control'].showAttached = event;
    },
    onTickUpdate() {
      if (!this.start) {
        this.start = Date.now();
      }
      const timestamp = Date.now();

      this.clock.tick(timestamp - this.start);
      this.UIStateManager();

      if (!videodata.paused && videodata.time + 1 >= this.duration) {
        // we need set the paused state to go to next video
        // this state will be reset on mounted of BaseVideoPlayer
        videodata.paused = true;
        // we need to reset the hoverProgressBar for play next video
        this.needResetHoverProgressBar = true;
        this.$bus.$emit('next-video');
      }

      this.start = timestamp;


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
    },
    UIDisplayManager() {
      const tempObject = {};
      Object.keys(this.displayState).forEach((index) => {
        tempObject[index] = !this.widgetsStatus['playlist-control'].showAttached;
      });
      tempObject['recent-playlist'] = this.widgetsStatus['playlist-control'].showAttached;
      tempObject['playlist-control'] = !this.onlyOneVideo;
      this.displayState = tempObject;
      this.tempRecentPlaylistDisplayState = this.widgetsStatus['playlist-control'].showAttached;
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
          if (name === 'recent-playlist') {
            this.widgetsStatus[name].mousedownOnOther = currentMousedownWidget !== name
              && currentMousedownWidget !== 'playlist-control';
          }
        }
        if (mouseupChanged) {
          this.widgetsStatus[name].mouseupOnOther = currentMouseupWidget !== name;
          if (name === 'recent-playlist') {
            this.widgetsStatus[name].mouseupOnOther = currentMouseupWidget !== 'playlist-control'
              && currentMousedownWidget !== 'playlist-control';
          }
        }
        if (!this.showAllWidgets) {
          // 播放列表不受showAllwidgets变量的影响而关闭
          if (name !== 'playlist-control') {
            this.widgetsStatus[name].showAttached = false;
          }
        }
      });
      this.attachedShown = Object.keys(this.widgetsStatus)
        .some(key => this.widgetsStatus[key].showAttached === true);
    },
    // Event listeners
    handleMousemove(event) {
      const { clientX, clientY, target } = event;
      this.mouseStopped = false;
      if (this.isMousedown) {
        this.isMousemove = true;
      }
      if (this.mouseStoppedId) {
        this.clock.clearTimeout(this.mouseStoppedId);
      }
      this.mouseStoppedId = this.clock.setTimeout(() => {
        this.mouseStopped = true;
      }, this.mousestopDelay);
      this.updateMousemovePosition([clientX, clientY]);
      this.updateMousemoveTarget(this.getComponentName(target));
    },
    handleMouseenter() {
      this.mouseLeftWindow = false;
      if (this.mouseLeftId) {
        this.clock.clearTimeout(this.mouseLeftId);
      }
    },
    handleMousedown(event) {
      const { target, buttons } = event;
      this.updateMousedown({ target: this.getComponentName(target), buttons });
    },
    handleMouseup(event) {
      const { target, buttons } = event;
      this.updateMouseup({ target: this.getComponentName(target), buttons });
    },
    handleMouseleave() {
      this.mouseLeftId = this.clock.setTimeout(() => {
        this.mouseLeftWindow = true;
      }, this.mouseleftDelay);
    },
    handleMousedownLeft() {
      this.isMousedown = true;
    },
    handleMouseupLeft() {
      this.isMousemove = false;
      this.isMousedown = false;
      if (this.clicksTimer) {
        clearTimeout(this.clicksTimer);
      }
      if (!this.isValidClick() || (this.lastDragging && this.lastAttachedShowing)) {
        return;
      }
      this.clicksTimer = setTimeout(() => {
        const attachedShowing = this.lastAttachedShowing;
        if (
          this.currentMousedownWidget === 'the-video-controller' &&
          this.currentMouseupWidget === 'the-video-controller' && !this.preventSingleClick && !attachedShowing && !this.lastDragging) {
          this.togglePlayback();
        }
        this.lastDragging = false;
        this.preventSingleClick = false;
        this.lastAttachedShowing = this.widgetsStatus['subtitle-control'].showAttached || this.widgetsStatus['advance-control'].showAttached || this.widgetsStatus['playlist-control'].showAttached;
      }, this.clicksDelay);
    },
    handleDblclick() {
      clearTimeout(this.clicksTimer); // cancel the time out
      this.preventSingleClick = true;
      if (this.currentMouseupWidget === 'the-video-controller') {
        this.toggleFullScreenState();
        this.preventSingleClick = false;
      }
    },
    handleKeydown({ code }) {
      this.updateKeydown(code);
    },
    handleKeyup({ code }) {
      this.updateKeyup(code);
    },
    handleWheel(event) {
      this.updateWheel({
        target: this.getComponentName(event.target),
        timestamp: event.timeStamp,
      });
    },
    // Helper functions
    getAllUIComponents(rootElement) {
      const { children } = rootElement;
      const names = [];
      for (let i = 0; i < children.length; i += 1) {
        this.processSingleElement(children[i]).forEach((componentName) => {
          names.push(componentName);
        });
      }
      return names;
    },
    isChildComponent(element) {
      let componentName = null;
      this.$children.forEach((childComponenet) => {
        if (childComponenet.$el === element) {
          componentName = childComponenet.$options.name;
        }
      });
      return componentName;
    },
    processSingleElement(element) {
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
    getComponentName(element) {
      let componentName = this.$options.name;
      if (element instanceof HTMLElement || element instanceof SVGElement) {
        /* eslint-disable consistent-return */
        this.UIElements.forEach((UIElement) => {
          if (UIElement.element.contains(element)) {
            componentName = UIElement.name;
            return componentName;
          }
        });
      }
      return componentName;
    },
    isValidClick() {
      return Date.now() - this.focusedTimestamp > this.focusDelay;
    },
    toggleFullScreenState() {
      this.$bus.$emit('toggle-fullscreen');
    },
    togglePlayback() {
      this.$bus.$emit('toggle-playback');
    },
  },
};
</script>
<style lang="scss">
.the-video-controller {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  opacity: 1;
  transition: opacity 400ms;
  z-index: auto;
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
.recent-playlist {
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 1000; // in front of all widgets
}

.translate-enter-active, .translate-leave-active {
  transition: opacity 300ms cubic-bezier(0.2, 0.3, 0.01, 1), transform 300ms cubic-bezier(0.2, 0.3, 0.01, 1);
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
  .button {
    -webkit-app-region: no-drag;
    cursor: pointer;
    position: relative;
  }
  .subtitle {
    @media screen and (min-width: 513px) and (max-width: 854px) {
      margin-right: 17.6px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      margin-right: 25.6px;
    }
    @media screen and (min-width: 1921px) {
      margin-right: 40px;
    }
  }
  .playlist {
    @media screen and (min-width: 513px) and (max-width: 854px) {
      margin-right: 17.6px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      margin-right: 25.6px;
    }
    @media screen and (min-width: 1921px) {
      margin-right: 40px;
    }
  }
  img {
    width: 100%;
    height: 100%;
  }
}
@media screen and (max-width: 512px) {
  .control-buttons {
    display: none;
  }
}
@media screen and (min-width: 513px) and (max-width: 854px) {
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
}
@media screen and (min-width: 855px) and (max-width: 1920px) {
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
}
@media screen and (min-width: 1921px) {
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
</style>
