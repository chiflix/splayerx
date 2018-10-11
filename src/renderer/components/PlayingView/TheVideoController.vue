<template>
  <div ref="controller"
    :data-component-name="$options.name"
    class="the-video-controller"
    :style="{ cursor: cursorStyle }"
    @mousemove="handleMousemove"
    @mouseenter="handleMouseenter"
    @mouseleave="handleMouseleave"
    @mousedown.right="handleMousedownRight"
    @mousedown.left="handleMousedownLeft"
    @mouseup.left="handleMouseupLeft"
    @dblclick="handleDblclick">
    <titlebar currentView="Playingview" v-hidden="displayState['titlebar']" ></titlebar>
    <div class="masking" v-hidden="showAllWidgets"></div>
    <play-button />
    <base-invisible-background v-show="!mute" />
    <volume-indicator v-hidden="displayState['volume-indicator']"/>
    <div class="control-buttons">
      <subtitle-control class="button subtitle" v-hidden="displayState['subtitle-control']" v-bind.sync="widgetsStatus['subtitle-control']" />
      <advance-control class="button advance" v-hidden="displayState['advance-control']" />
    </div>
    <the-time-codes v-hidden="displayState['the-time-progress-bar']" />
    <the-time-progress-bar v-hidden="displayState['the-time-progress-bar']" :src="src" />
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import TimerManager from '@/helpers/timerManager.js';
import Titlebar from '../Titlebar.vue';
import PlayButton from './PlayButton.vue';
import VolumeIndicator from './VolumeIndicator.vue';
import AdvanceControl from './AdvanceControl.vue';
import SubtitleControl from './SubtitleControl.vue';
import TheTimeCodes from './TheTimeCodes.vue';
import TimeProgressBar from './TimeProgressBar.vue';
import BaseInvisibleBackground from './BaseInvisibleBackground.vue';
export default {
  name: 'the-video-controller',
  components: {
    titlebar: Titlebar,
    'play-button': PlayButton,
    'volume-indicator': VolumeIndicator,
    'subtitle-control': SubtitleControl,
    'advance-control': AdvanceControl,
    'the-time-codes': TheTimeCodes,
    'the-time-progress-bar': TimeProgressBar,
    'base-invisible-background': BaseInvisibleBackground,
  },
  directives: {
    hidden: {
      update(el, binding) {
        const { oldValue, value } = binding;
        if (oldValue !== value) {
          if (value) {
            el.classList.add('fade-in');
            el.classList.remove('fade-out');
          } else {
            el.classList.add('fade-out');
            el.classList.remove('fade-in');
          }
        }
      },
    },
  },
  props: {
    src: String,
  },
  data() {
    return {
      start: null,
      UIElements: [],
      currentWidget: this.$options.name,
      mouseStopMoving: false,
      mousestopDelay: 3000,
      mouseLeftWindow: false,
      mouseleftDelay: 1000,
      hideVolume: false,
      muteDelay: 3000,
      hideVolumeDelay: 1000,
      hideProgressBar: false,
      popupShow: false,
      clicksTimer: 0,
      clicksDelay: 200,
      dragDelay: 200,
      displayState: {},
      widgetsStatus: {},
      currentSelectedWidget: 'the-video-controller',
      preventSingleClick: false,
      lastAttachedShowing: false,
      isDragging: false,
      focusedTimestamp: 0,
      focusDelay: 500,
    };
  },
  computed: {
    ...mapGetters(['mute']),
    showAllWidgets() {
      return (!this.mouseStopMoving && !this.mouseLeftWindow) ||
        (!this.mouseLeftWindow && this.onOtherWidget);
    },
    onOtherWidget() {
      return this.currentWidget !== this.$options.name && this.currentWidget !== 'base-invisible-background';
    },
    cursorStyle() {
      return this.showAllWidgets || !this.isFocused ? 'default' : 'none';
    },
    isFocused() {
      return this.$store.state.WindowState.isFocused;
    },
  },
  watch: {
    isFocused(newValue) {
      if (newValue) {
        this.focusedTimestamp = Date.now();
      }
    },
  },
  created() {
    this.eventInfo = new Map([
      ['mousemove', {}],
      ['mousedown', {}],
      ['mouseenter', {}],
      ['wheel', {}],
      ['keydown', {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false,
        KeyM: false,
      }],
    ]);
    // Use Object due to vue's lack support of reactive Map
    this.timerState = {};
    // Use Map constructor to shallow-copy eventInfo
    this.lastEventInfo = new Map(this.eventInfo);
    this.timerManager = new TimerManager();
    this.timerManager.addTimer('mouseStopMoving', this.mousestopDelay);
    this.timerManager.addTimer('sleepingVolumeButton', this.mousestopDelay);
    this.timerManager.addTimer('sleepingProgressBar', this.mousestopDelay);
  },
  mounted() {
    this.UIElements = this.getAllUIComponents(this.$refs.controller);
    this.UIElements.forEach((value) => {
      this.timerState[value.name] = true;
      this.displayState[value.name] = true;
      this.widgetsStatus[value.name] = { selected: false, showAttached: false };
    });

    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('keyup', this.handleKeyup);
    document.addEventListener('wheel', this.handleWheel);
    requestAnimationFrame(this.UIManager);
  },
  methods: {
    // UIManagers
    UIManager(timestamp) {
      if (!this.start) {
        this.start = timestamp;
      }

      // Use Map constructor to shallow-copy eventInfo
      const lastEventInfo = new Map(this.inputProcess(this.eventInfo, this.lastEventInfo));
      this.UITimerManager(timestamp - this.start);
      // this.UILayerManager();
      this.UIDisplayManager();
      this.UIStateManager();
      this.lastEventInfo = lastEventInfo;

      this.start = timestamp;
      requestAnimationFrame(this.UIManager);
    },
    inputProcess(currentEventInfo, lastEventInfo) {
      // mousemove timer
      this.currentWidget = this.getComponentName(currentEventInfo.get('mousemove').target);
      const currentPosition = currentEventInfo.get('mousemove').position;
      const lastPosition = lastEventInfo.get('mousemove').position;
      this.mouseStopMoving = currentPosition === lastPosition;
      if (!this.mouseStopMoving) { this.timerManager.updateTimer('mouseStopMoving', this.mousestopDelay, false); }
      // mouseenter timer
      const { mouseLeavingWindow } = currentEventInfo.get('mouseenter');
      const changed = mouseLeavingWindow !== lastEventInfo.get('mouseenter').mouseLeavingWindow;
      if (mouseLeavingWindow && changed) {
        this.timerManager.addTimer('mouseLeavingWindow', this.mouseleftDelay);
      } else if (!mouseLeavingWindow && changed) {
        this.timerManager.removeTimer('mouseLeavingWindow');
        this.mouseLeftWindow = false;
      }
      // hideVolume timer
      const volumeKeydown = currentEventInfo.get('keydown').ArrowUp || currentEventInfo.get('keydown').ArrowDown || currentEventInfo.get('keydown').KeyM; // eslint-disable-line
      const mouseScrolling = currentEventInfo.get('wheel').time !== lastEventInfo.get('wheel').time;
      const lastWidget = this.getComponentName(lastEventInfo.get('mousemove').target); // eslint-disable-line
      const mouseWakingUpVolume = (this.currentWidget === 'base-invisible-background' || this.currentWidget === 'volume-indicator') &&
        (lastWidget !== 'base-invisible-background' && lastWidget !== 'volume-indicator'); // eslint-disable-line
      const mouseLeavingVolume = (this.currentWidget !== 'base-invisible-background' && this.currentWidget !== 'volume-indicator') &&
        (lastWidget === 'base-invisible-background' || lastWidget === 'volume-indicator'); // eslint-disable-line
      const mouseInVolume = !this.mouseStopMoving && (this.currentWidget === 'base-invisible-background' || this.currentWidget === 'volume-indicator') &&
        (lastWidget === 'base-invisible-background' || lastWidget === 'volume-indicator'); // eslint-disable-line
      const wakingupVolume = volumeKeydown || mouseScrolling || (!this.mute && (mouseWakingUpVolume || mouseLeavingVolume || mouseInVolume)); // eslint-disable-line
      if (wakingupVolume) {
        this.timerManager.updateTimer('sleepingVolumeButton', mouseWakingUpVolume || mouseInVolume ? this.muteDelay : this.hideVolumeDelay);
        // Prevent all widgets display before volume-control
        if (this.showAllWidgets && mouseInVolume) {
          this.timerManager.updateTimer('mouseStopMoving', this.mousestopDelay);
        }
        this.hideVolume = false;
      }
      // hideProgressBar timer
      const progressKeydown = currentEventInfo.get('keydown').ArrowLeft || currentEventInfo.get('keydown').ArrowRight;
      if (progressKeydown) {
        this.timerManager.updateTimer('sleepingProgressBar', this.mousestopDelay);
        // Prevent all widgets display before the-time-progress-bar
        if (this.showAllWidgets) {
          this.timerManager.updateTimer('mouseStopMoving', this.mousestopDelay);
        }
        this.hideProgressBar = false;
      }

      // mousedown status
      if (lastEventInfo.get('mousedown').leftMousedown !== currentEventInfo.get('mousedown').leftMousedown) {
        this.currentSelectedWidget = this.getComponentName(currentEventInfo.get('mousedown').target);
      }

      Object.keys(this.timerState).forEach((uiName) => {
        this.timerState[uiName] = this.showAllWidgets;
      });
      this.timerState['volume-indicator'] = !this.hideVolume;
      this.timerState['the-time-progress-bar'] = !this.hideProgressBar;
      return currentEventInfo;
    },
    UITimerManager(frameTime) {
      this.timerManager.tickTimer('mouseStopMoving', frameTime);
      this.timerManager.tickTimer('mouseLeavingWindow', frameTime);
      this.timerManager.tickTimer('sleepingVolumeButton', frameTime);
      this.timerManager.tickTimer('sleepingProgressBar', frameTime);

      const timeoutTimers = this.timerManager.timeoutTimers();
      this.mouseStopMoving = timeoutTimers.includes('mouseStopMoving');
      this.mouseLeftWindow = timeoutTimers.includes('mouseLeavingWindow');
      this.hideVolume = timeoutTimers.includes('sleepingVolumeButton');
      this.hideProgressBar = timeoutTimers.includes('sleepingProgressBar');

      this.timerState['volume-indicator'] = !this.hideVolume;
      this.timerState['the-time-progress-bar'] = !this.hideProgressBar;
    },
    // UILayerManager() {
    // },
    UIDisplayManager() {
      const tempObject = {};
      Object.keys(this.displayState).forEach((index) => {
        tempObject[index] = this.showAllWidgets ||
          (!this.showAllWidgets && this.timerState[index]);
      });
      tempObject['volume-indicator'] = !this.mute ? this.timerState['volume-indicator'] : tempObject['volume-indicator'];
      this.displayState = tempObject;
    },
    UIStateManager() {
      Object.keys(this.widgetsStatus).forEach((name) => {
        this.widgetsStatus[name].selected = this.currentSelectedWidget === name;
      });
      if (
        (this.currentSelectedWidget !== 'subtitle-control' && this.widgetsStatus['subtitle-control'].showAttached) ||
        !this.showAllWidgets) {
        this.widgetsStatus['subtitle-control'].showAttached = false;
      }
    },
    // Event listeners
    handleMousemove(event) {
      this.eventInfo.set('mousemove', {
        target: event.target,
        position: [event.clientX, event.clientY],
      });
      if (this.eventInfo.get('mousedown').leftMousedown) {
        this.isDragging = true;
      }
    },
    handleMouseenter() {
      this.eventInfo.set('mouseenter', { mouseLeavingWindow: false });
    },
    handleMouseleave() {
      this.eventInfo.set('mouseenter', {
        mouseLeavingWindow: true,
      });
    },
    handleMousedownRight() {
      this.eventInfo.set('mousedown', Object.assign(
        {},
        this.eventInfo.get('mousedown'),
        { rightMousedown: true },
      ));
      if (process.platform !== 'darwin') {
        const menu = this.$electron.remote.Menu.getApplicationMenu();
        menu.popup(this.$electron.remote.getCurrentWindow());
        this.popupShow = true;
      }
    },
    handleMousedownLeft(event) {
      if (!this.isValidClick()) { return; }
      this.eventInfo.set('mousedown', Object.assign(
        {},
        this.eventInfo.get('mousedown'),
        { leftMousedown: true },
        { target: event.target },
      ));
      if (process.platform !== 'darwin') {
        const menu = this.$electron.remote.Menu.getApplicationMenu();
        if (this.popupShow === true) {
          menu.closePopup();
          this.popupShow = false;
        }
      }
    },
    handleMouseupLeft(event) {
      if (!this.isValidClick()) { return; }
      this.eventInfo.set('mousedown', Object.assign(
        {},
        this.eventInfo.get('mousedown'),
        { leftMousedown: false, target: event.target },
      ));
      this.clicksTimer = setTimeout(() => {
        const attachedShowing = this.lastAttachedShowing;
        if (this.currentSelectedWidget === 'the-video-controller' && !this.preventSingleClick && !attachedShowing && !this.isDragging) {
          this.togglePlayback();
        }
        this.preventSingleClick = false;
        this.lastAttachedShowing = this.widgetsStatus['subtitle-control'].showAttached;
        this.isDragging = false;
      }, this.clicksDelay);
    },
    handleDblclick() {
      clearTimeout(this.clicksTimer); // cancel the time out
      this.preventSingleClick = true;
      if (this.currentSelectedWidget === 'the-video-controller') {
        this.toggleFullScreenState();
      }
    },
    handleKeydown(event) {
      this.eventInfo.set('keydown', Object.assign(
        {},
        this.eventInfo.get('keydown'),
        { [event.code]: true },
      ));
    },
    handleKeyup(event) {
      this.eventInfo.set('keydown', Object.assign(
        {},
        this.eventInfo.get('keydown'),
        { [event.code]: false },
      ));
    },
    handleWheel(event) {
      this.eventInfo.set('wheel', { time: event.timeStamp });
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  opacity: 1;
  transition: opacity 400ms;
}
.masking {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 50%;
  opacity: 0.3;
  background-image: linear-gradient(
    -180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.19) 62%,
    rgba(0, 0, 0, 0.29) 100%
  );
}
.control-buttons {
  display: flex;
  justify-content: space-between;
  position: fixed;
  .button {
    -webkit-app-region: no-drag;
    cursor: pointer;
    position: relative;
  }
  .subtitle {
    order: 1;
  }
  .advance {
    order: 3;
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
    width: 119px;
    height: 18px;
    right: 27px;
    bottom: 20px;
    .button {
      width: 23px;
      height: 18px;
    }
  }
}
@media screen and (min-width: 855px) and (max-width: 1920px) {
  .control-buttons {
    width: 159px;
    height: 24px;
    right: 32px;
    bottom: 24px;
    .button {
      width: 30.67px;
      height: 24px;
    }
  }
}
@media screen and (min-width: 1921px) {
  .control-buttons {
    width: 238px;
    height: 36px;
    right: 48px;
    bottom: 35px;
    .button {
      width: 46px;
      height: 36px;
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
