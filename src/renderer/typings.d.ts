import Vue, { VNode } from 'vue';
import { AxiosInstance } from 'axios';

declare module '*.vue' {
  export default Vue;
}

declare module 'vue/types/vue' {
  interface Vue {
    $store: any;
    $bus: Vue;
    $ga: any;
    $electron: Electron.RendererInterface;
    axios: AxiosInstance;
    $http: AxiosInstance;
  }

  namespace Vue {
    const axios: AxiosInstance;
  }
}

declare global {
  declare const __static: string; //eslint-disable-line
  interface Screen {
    availLeft: number;
    availTop: number;
  }
  namespace JSX {
    interface Element extends VNode {} //eslint-disable-line
    interface ElementClass extends Vue {} //eslint-disable-line
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}
