<template>
  <div
    id="app"
    :class="currentRouteName !== 'playing-view' ? 'landing-view' : ''"
    class="application"
  >
    <Titlebar v-if="currentRouteName !== 'playing-view'" />
    <transition :name="transitionMode">
      <router-view />
    </transition>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer, Event } from 'electron';
import Titlebar from '@/components/Titlebar.vue';
import '@/css/style.scss';
import drag from '@/helpers/drag';

export default {
  name: 'Splayer',
  components: {
    Titlebar,
  },
  data() {
    return {
      transitionMode: '',
    };
  },
  computed: {
    currentRouteName() {
      return this.$route.name;
    },
    isWelcomeView() {
      return this.currentRouteName === 'welcome-view';
    },
    isLanguageSetting() {
      return this.currentRouteName === 'language-setting';
    },
    isPlayingView() {
      return this.currentRouteName === 'playing-view';
    },
    isLandingView() {
      return this.currentRouteName === 'landing-view';
    },
  },
  watch: {
    currentRouteName(val: string, oldVal: string) {
      if (val === 'language-setting') this.transitionMode = 'transform';
      if (val === 'landing-view' && oldVal !== 'playing-view') this.transitionMode = 'fade';
      if (val === 'playing-view') this.transitionMode = '';
    },
  },
  mounted() {
    // to-do: specify commitType and commitPayload with vuex typescriptened
    ipcRenderer.on('mainCommit', (event: Event, commitType: string, commitPayload: any) => {
      this.mainCommitProxy(commitType, commitPayload);
    });
    ipcRenderer.on('mainDispatch', (event: Event, actionType: string, actionPayload: any) => {
      this.mainDispatchProxy(actionType, actionPayload);
    });
    ipcRenderer.send('windowInit');
    ipcRenderer.on('thumbnail-saved', (event: Event, src: string) => {
      this.$bus.$emit('set-thumbnail-src', src);
    });
    drag(this.$el);
    this.$ga.event('app', 'mounted');
    setInterval(() => {
      this.$ga.event('app', 'heartbeat');
    }, 1500000); // keep alive every 25 min.
  },
  methods: {
    mainCommitProxy(commitType: string, commitPayload: any) {
      this.$store.commit(commitType, commitPayload);
    },
    mainDispatchProxy(actionType: string, actionPayload: any) {
      this.$store.dispatch(actionType, actionPayload);
    },
    handleWindowSizeChange(windowSize: any) {
      this.$store.commit('windowSize', windowSize);
    },
  },
};
</script>

<style lang="scss">
// global scss
// @import "@/css/style.scss";
.landing-view {
  background-image: linear-gradient(-28deg, #414141 0%, #545454 47%, #7B7B7B 100%);
}
.transform-enter-active {
  transition-property: transform, opacity;
  transition-duration: 500ms;
  transition-delay: 250ms;
  transition-timing-function: ease-out;
}
.transform-leave-active {
  transition-property: transform, opacity;
  transition-duration: 450ms;
  transition-timing-function: ease-in;
}
.transform-enter {
  transform: translateX(200px);
  opacity: 0;
}
.transform-leave-to {
  transform: translateX(-400px);
  opacity: 0;
}
.fade-enter-active {
  transition-property: opacity;
  transition-duration: 500ms;
  transition-delay: 400ms;
  transition-timing-function: ease-out;
}
.fade-leave-active {
  transition-property: opacity;
  transition-duration: 450ms;
  transition-timing-function: ease-in;
}
.fade-enter {
  opacity: 0;
}
.fade-leave-to {
  opacity: 0;
}
</style>
