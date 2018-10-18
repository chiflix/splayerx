import Vue from 'vue';
import Vuex from 'vuex';
import VueI18n from 'vue-i18n';
import VueElectronJSONStorage from 'vue-electron-json-storage';

import LandingView from '@/components/LandingView';
import messages from '@/locales';
import helpers from '@/helpers';
import App from '@/store/modules/App';
import Window from '@/store/modules/Window';

describe('LandingView.vue', () => {
  let store;

  beforeEach(() => {
    // state = PlaybackState.state;
    store = new Vuex.Store({
      modules: {
        App,
        Window,
      },
    });
  });

  it('should render correct contents', () => {
    Vue.use(VueI18n);
    Vue.use(VueElectronJSONStorage);
    Vue.mixin(helpers);

    const i18n = new VueI18n({
      locale: 'en', // set locale
      messages, // set locale messages
    });

    const vm = new Vue({
      el: document.createElement('div'),
      i18n,
      store,
      render: h => h(LandingView),
    }).$mount();

    expect(vm.$el.querySelector('.title').textContent).contains('SPlayerX');
  });
});
