import Vue from 'vue';
import axios from 'axios';

import App from './App';
import router from './router';
import store from './store';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>',
  mounted() {
    window.addEventListener('keypress', (e) => {
      if (e.keyCode === 32) { // space
        this.$store.dispatch('togglePlayback');
      }
    });
  },
}).$mount('#app');
