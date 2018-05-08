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

Vue.prototype.$bus = new Vue(); // Global event bus

Vue.mixin({
  methods: {
    timecodeFromSeconds(s) {
      const dt = new Date(s * 1000);
      let hours = dt.getUTCHours();
      let minutes = dt.getUTCMinutes();
      let seconds = dt.getUTCSeconds();

      // the above dt.get...() functions return a single digit
      // so I prepend the zero here when needed
      if (minutes < 10) {
        minutes = `0${minutes}`;
      }
      if (seconds < 10) {
        seconds = `0${seconds}`;
      }
      if (hours > 0) {
        if (hours < 10) {
          hours = `0${hours}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      return `${minutes}:${seconds}`;
    },
  },
});

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>',
  mounted() {
    window.addEventListener('keypress', (e) => {
      if (e.key === ' ') { // space
        this.$bus.$emit('toggle-playback');
      }
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        this.$bus.$emit('volumeslider-appear');
        this.$bus.$emit('VolumeControlAppear');
        if (this.$store.state.PlaybackState.Volume + 0.1 < 1) {
          this.$store.commit('Volume', this.$store.state.PlaybackState.Volume + 0.1);
        } else {
          this.$store.commit('Volume', 1);
        }
      } else if (e.key === 'ArrowDown') {
        this.$bus.$emit('volumeslider-appear');
        if (this.$store.state.PlaybackState.Volume - 0.1 > 0) {
          this.$store.commit('Volume', this.$store.state.PlaybackState.Volume - 0.1);
        } else {
          this.$store.commit('Volume', 0);
        }
      } else if (e.key === 'ArrowLeft') {
        this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime - 10);
      } else if (e.key === 'ArrowRight') {
        this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime + 10);
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
