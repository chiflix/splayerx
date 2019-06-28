import { INPUT_COMPONENT_TYPE, VuexStore, nameDefaultOption } from './constants';
import { addComponent, removeComponent } from './helpers';
import module from './vuex';
import {
  generateMousemoveListener,
  generateMousedownAndMouseupListener,
  generateKeyDownAndKeyUpListener,
  generateWheelListener,
} from './listeners';


export {
  INPUT_COMPONENT_TYPE,
  actionTypes, mutationTypes, getterTypes,
} from './constants';
export default {
  install(Vue, options) {
    // register generated vuex module
    const name = options.name || nameDefaultOption;
    VuexStore.registerModule(name, module(options));

    // generate event listeners
    const {
      mouse: mouseOptions = {},
      keyboard: keyboardOptions = {},
      wheel: wheelOptions = {},
      namespaced, // vuex options
    } = options;
    const {
      mousemove: mousemoveOptions = {},
      mousedown: mousedownOptions = {},
    } = mouseOptions;
    const vuexOptions = { name, namespaced };
    const mousemove = generateMousemoveListener(mousemoveOptions, vuexOptions);
    const {
      mousedown, mouseup,
    } = generateMousedownAndMouseupListener(mousedownOptions, vuexOptions);
    const { keydown, keyup } = generateKeyDownAndKeyUpListener(keyboardOptions, vuexOptions);
    const wheel = generateWheelListener(wheelOptions, vuexOptions);

    Vue.mixin({
      mounted() {
        const { name, type } = this.$options;
        if (name && type === INPUT_COMPONENT_TYPE) addComponent(name, this.$el, this.$vnode.key);
        if (this === this.$root && this.$el) {
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
        if (this === this.$root && this.$el) {
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
