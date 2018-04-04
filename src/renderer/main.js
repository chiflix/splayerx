import Vue from 'vue';
import axios from 'axios';
import VueElectronJSONStorage from 'vue-electron-json-storage';

import App from './App';
import router from './router';
import store from './store';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

Vue.use(VueElectronJSONStorage);

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
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const { files } = e.dataTransfer;
      console.log(files);
      // TODO: play it if it's video file
      alert(`drag and drop are not yet supported.\nfile: ${files[0].path} ${files[0].name}`);
      /*
      for (const file in files) {
        if (files.hasOwnProperty(file)) {
          const filename = files[file].name
          const fileExt = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()
          if (Videos.allowedExtensions().indexOf(fileExt) !== -1) {
            const video = {
              id: videos.length + 1,
              status: 'loading',
              name: filename,
              path: files[file].path,
              size: files[file].size
            }
            videos.push(video)
          }
        }
      } */
    });
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  },
}).$mount('#app');
