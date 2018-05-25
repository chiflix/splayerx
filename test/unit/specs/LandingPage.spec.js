import Vue from 'vue';
import VueI18n from 'vue-i18n';
import VueElectronJSONStorage from 'vue-electron-json-storage';

import LandingView from '@/components/LandingView';
import messages from '@/locales';
import helpers from '@/helpers';

describe('LandingView.vue', () => {
  it('should render correct contents', () => {
    Vue.use(VueI18n);
    Vue.use(VueElectronJSONStorage);
    Vue.mixin(helpers);
    Vue.prototype.$bus = new Vue(); // Global event bus

    const i18n = new VueI18n({
      locale: 'en', // set locale
      messages, // set locale messages
    });

    const vm = new Vue({
      el: document.createElement('div'),
      i18n,
      render: h => h(LandingView),
    }).$mount();

    expect(vm.$el.querySelector('.title').textContent).to.contain('SPlayer');
  });
});
