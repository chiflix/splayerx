import Vue from 'vue';

declare module '*.vue' {
  export default Vue;
}


declare module 'vue/types/vue' {
  interface Vue {
    $bus: Vue;
    $ga: any;
    $electron: Electron.RendererInterface;
  }
  interface VueConstructor {
    http: any;
  }
}

declare global {
  interface Screen {
    availLeft: number;
    availTop: number;
  }
}
