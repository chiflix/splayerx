<template>
  <div ref="controller"
    :data-component-name="$options.name"
    class="the-video-controller"
    @mousemove="handleMousemove"
    @mouseenter="handleMouseenter"
    @mouseleave="handleMouseleave"
    @mousedown.right="handleRightMouseDown">
    <titlebar currentView="Playingview" v-show="showAllWidgets" ></titlebar>
    <the-time-codes v-show="showAllWidgets" />
    <div class="control-buttons">
      <volume-control class="button volume" v-show="showAllWidgets" />
      <subtitle-control class="button subtitle" v-show="showAllWidgets" />
      <advance-control class="button advance" v-show="showAllWidgets" />
    </div>
    <the-time-progress-bar v-show="showAllWidgets" :src="this.$store.state.PlaybackState.SrcOfVideo" />
  </div>
</template>
<script>
import Titlebar from '../Titlebar.vue';
import TheTimeCodes from './TheTimeCodes.vue';
import VolumeControl from './VolumeControl';
import AdvanceControl from './AdvanceControl';
import SubtitleControl from './SubtitleControl';
import TimeProgressBar from './TimeProgressBar.vue';
export default {
  name: 'the-video-controller',
  components: {
    titlebar: Titlebar,
    'the-time-codes': TheTimeCodes,
    'subtitle-control': SubtitleControl,
    'volume-control': VolumeControl,
    'advance-control': AdvanceControl,
    'the-time-progress-bar': TimeProgressBar,
  },
  data() {
    return {
      UIElements: [],
      currentWidget: this.$options.name,
      mousestop: false,
      mousestopTimer: 0,
      mousestopDelay: 3000,
      mouseleft: false,
      mouseleftTimer: 0,
      mouseleftDelay: 1500,
      popupShow: false,
    };
  },
  computed: {
    showAllWidgets() {
      // truth table
      // this.mousestop this.mouseleft this.onOtherWidget result
      // 0 0 0 1
      // 0 0 1 1
      // 0 1 0 0
      // 0 1 1 0
      // 1 0 0 0
      // 1 0 1 1
      // 1 1 0 0
      // 1 1 1 0
      return (!this.mousestop && !this.mouseleft) || (!this.mouseleft && this.onOtherWidget);
    },
    onOtherWidget() {
      return this.currentWidget !== this.$options.name;
    },
  },
  mounted() {
    this.UIElements = this.getAllUIComponents(this.$refs.controller);
  },
  methods: {
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
    processSingleElement(element) {
      const names = [];
      const name = element.dataset.componentName;
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
      if (element instanceof HTMLElement) {
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
    handleMousemove(event) {
      // Set currentWidget
      this.currentWidget = this.getComponentName(event.target);
      // Mousestop timer
      this.mousestop = false;
      if (this.mousestopTimer) clearTimeout(this.mousestopTimer);
      this.mousestopTimer = setTimeout(() => {
        this.mousestop = true;
      }, this.mousestopDelay);
    },
    handleMouseenter() {
      this.mouseleft = false;
      clearTimeout(this.mouseleftTimer);
    },
    handleMouseleave() {
      this.mouseleftTimer = setTimeout(() => {
        this.mouseleft = true;
      }, this.mouseleftDelay);
    },
    handleRightMouseDown() {
      if (process.platform !== 'darwin') {
        const menu = this.$electron.remote.Menu.getApplicationMenu();
        menu.popup(this.$electron.remote.getCurrentWindow());
        this.popupShow = true;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
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
.control-buttons {
  display: flex;
  justify-content: space-between;
  position: fixed;
  .button {
    -webkit-app-region: no-drag;
    cursor: pointer;
    position: relative;
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
</style>
