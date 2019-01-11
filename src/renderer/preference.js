import Vue from 'vue';
import VueI18n from 'vue-i18n';
import osLocale from 'os-locale';
import '@/css/style.scss';
import messages from '@/locales';
import Preference from '@/components/Preference.vue';

Vue.use(VueI18n);

function getSystemLocale() {
  const locale = osLocale.sync();
  if (locale === 'zh-TW') {
    return 'zhTW';
  } else if (locale.startsWith('zh')) {
    return 'zhCN';
  }
  return 'en';
}

const i18n = new VueI18n({
  locale: getSystemLocale(), // set locale
  messages, // set locale messages
});

new Vue({
  i18n,
  components: { Preference },
  data: {},
  template: '<Preference/>',
}).$mount('#app');
