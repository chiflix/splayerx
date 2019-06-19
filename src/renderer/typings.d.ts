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
  declare const __static: string;
  interface Screen {
    availLeft: number;
    availTop: number;
  }
  namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {}
    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}
