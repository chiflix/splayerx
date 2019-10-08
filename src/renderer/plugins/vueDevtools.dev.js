import { install, uninstall } from 'vue-devtools'; // eslint-disable-line import/no-extraneous-dependencies

export const VueDevtools = {
  install() {
    uninstall();
    install();
  },
};
