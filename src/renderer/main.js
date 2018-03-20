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
      console.log(String.fromCharCode(e.keyCode));
      if (event.keyCode === 32) {
        console.log('pausing');
        this.$store.dispatch('pausePlayback');
      }
    });
  },
}).$mount('#app');
