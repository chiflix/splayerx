import { INPUT_COMPONENT_TYPE, VuexStore } from './constants';
import { addComponent, removeComponent } from './helpers';
import module from './vuex';
import {
  generateMousemoveListener,
  generateMousedownAndMouseupListener,
  generateKeyDownAndKeyUpListener,
  generateWheelListener,
} from './listeners';


export { INPUT_COMPONENT_TYPE } from './constants';
export default {
  install(Vue, options) {
    // register generated vuex module
    VuexStore.registerModule('InputPlugin', module(options));

    // generate event listeners
    const mousemove = generateMousemoveListener(options);
    const { mousedown, mouseup } = generateMousedownAndMouseupListener(options);
    const { keydown, keyup } = generateKeyDownAndKeyUpListener(options);
    const wheel = generateWheelListener(options);

    Vue.mixin({
      mounted() {
        const { name, type } = this.$options;
        if (name && type === INPUT_COMPONENT_TYPE) addComponent(name, this.$el, this.$vnode.key);
        if (this === this.$root) {
          // setup event listeners
          document.addEventListener('mousemove', mousemove);
          document.addEventListener('mousedown', mousedown);
          document.addEventListener('mouseup', mouseup);
          document.addEventListener('keydown', keydown);
          document.addEventListener('keyup', keyup);
          document.addEventListener('wheel', wheel);
        }
      },
      beforeDestroy() {
        const { name, type } = this.$options;
        if (name && type === INPUT_COMPONENT_TYPE) removeComponent(this.$el);
        if (this === this.$root) {
          // remove event listeners
          document.removeEventListener('mousemove', mousemove);
          document.removeEventListener('mousedown', mousedown);
          document.removeEventListener('mouseup', mouseup);
          document.removeEventListener('keydown', keydown);
          document.removeEventListener('keyup', keyup);
          document.removeEventListener('wheel', wheel);
        }
      },
    });
  },
};
