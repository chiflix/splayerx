<template>
  <div
    id="app"
    :class="$route.name !== 'playing-view' ? 'landing-view' : ''"
    class="application"
  >
    <Titlebar v-if="currentRoute !== 'playing-view'" />
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
  watch: {
    $route({ name: to }: { name: string }, { name: from }: { name: string }) {
      if (to === 'language-setting') this.transitionMode = 'transform';
      else if (from === 'language-setting' && to === 'landing-view') this.transitionMode = 'fade-transform';
      else this.transitionMode = '';
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
.transform {
  &-enter-active {
    transition-property: transform, opacity;
    transition-duration: 500ms;
    transition-delay: 250ms;
    transition-timing-function: ease-out;
  }
  &-leave-active {
    transition-property: transform, opacity;
    transition-duration: 450ms;
    transition-timing-function: ease-in;
  }
  &-enter {
    transform: translateX(200px);
    opacity: 0;
  }
  &-leave-to {
    transform: translateX(-400px);
    opacity: 0;
  }
}

.fade-transform {
  &-enter-active {
    transition: opacity 450ms ease-in 450ms;
  }
  &-leave-active {
    transition: opacity 450ms ease-in;
  }
  &-enter {
    opacity: 0;
  }
  &-leave-to {
    opacity: 0;
  }
}
</style>
