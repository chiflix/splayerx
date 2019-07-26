import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-view',
      component: require('@/containers/LandingView.vue').default,
    },
    {
      path: '/play',
      name: 'playing-view',
      component: require('@/components/PlayingView.vue').default,
    },
    {
      path: '/browsing',
      name: 'browsing-view',
      component: require('@/components/BrowsingView.vue').default,
    },
    {
      path: '*',
      redirect: '/language-setting',
    },
    {
      path: '/welcome',
      component: require('@/components/Welcome/WelcomeView.vue').default,
      children: [
        {
          path: '',
          name: 'welcome-privacy',
          component: require('@/components/Welcome/WelcomePrivacy.vue').default,
        },
        {
          path: 'language',
          name: 'language-setting',
          component: require('@/components/Welcome/LanguageSetting.vue').default,
        },
      ],
    },
  ],
});
