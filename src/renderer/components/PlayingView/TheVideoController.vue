<template>
  <div ref="controller"
    :data-component-name="$options.name"
    class="the-video-controller"
    @mousemove="handleMousemove">
    <div class="control-buttons">
      <volume-control class="button volume" />
      <subtitle-control class="button subtitle" />
      <advance-control class="button advance"/>
    </div>
  </div>
</template>
<script>
import VolumeControl from './VolumeControl.vue';
import AdvanceControl from './AdvanceControl.vue';
import SubtitleControl from './SubtitleControl.vue';
export default {
  name: 'the-video-controller',
  components: {
    'subtitle-control': SubtitleControl,
    'volume-control': VolumeControl,
    'advance-control': AdvanceControl,
  },
  data() {
    return {
      UIElements: [],
      currentWidget: this.$options.name,
    };
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
      this.currentWidget = this.getComponentName(event.target);
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
