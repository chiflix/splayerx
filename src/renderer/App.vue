<template>
  <div
    id="app"
    :class="$route.name !== 'playing-view' ? 'landing-view' : ''"
    class="application"
  >
    <Titlebar
      v-if="$route.name !== 'playing-view'"
      :is-landing-view="$route.name === 'landing-view'"
      :show-sidebar="showSidebar"
      :enable-full-screen-button="['landing-view', 'playing-view', 'browsing-view']
        .includes($route.name)"
    />
    <transition
      :name="transitionMode"
      mode="out-in"
    >
      <router-view
        :open-file-args="openFileArgs"
        @update-side-bar="showSidebar = $event"
      />
    </transition>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer, Event } from 'electron';
import { mapActions } from 'vuex';
import { SubtitleManager as smActions } from '@/store/actionTypes';
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
      openFileArgs: null,
      showSidebar: false,
    };
  },
  watch: {
    $route(to: any, from: any) {
      if (to.name === 'landing-view' && from.name === 'language-setting') this.transitionMode = 'fade';
      if (from.name === 'playing-view' && to.name !== 'playing-view') this.resetManager();
      else this.transitionMode = '';
      this.showSidebar = false;
    },
  },
  mounted() {
    ipcRenderer.on('open-file', (event: Event, args: { onlySubtitle: boolean, files: string[] }) => {
      this.openFileArgs = args;
    });
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
    ...mapActions({
      resetManager: smActions.resetManager,
    }),
    mainCommitProxy(commitType: string, commitPayload: any) {
      this.$store.commit(commitType, commitPayload);
    },
    mainDispatchProxy(actionType: string, actionPayload: any) {
      this.$store.dispatch(actionType, actionPayload);
    },
  },
};
</script>

<style lang="scss">
// global scss
// @import "@/css/style.scss";
.landing-view {
  background-color: #434349;
}

.fade {
  &-enter-active {
    transition: opacity 500ms ease-out;
  }
  &-leave-active {
    transition: opacity 250ms ease-in;
  }
  &-enter {
    opacity: 0;
  }
  &-leave-to {
    opacity: 0;
  }
}
</style>
