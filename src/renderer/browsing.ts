import Vue from 'vue';
// @ts-ignore
import BrowsingPip from '@/components/BrowsingPip.vue';
import '@/css/style.scss';

new Vue({
  components: { BrowsingPip },
  data: {},
  template: '<BrowsingPip/>',
}).$mount('#app');
