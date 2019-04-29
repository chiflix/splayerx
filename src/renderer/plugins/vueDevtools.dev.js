import { install, uninstall } from 'vue-devtools';

export const VueDevtools = {
  install() {
    uninstall();
    install();
  },
};
