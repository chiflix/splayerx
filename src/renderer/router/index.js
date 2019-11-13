import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-view',
      component: () => import('@/containers/LandingView.vue'),
    },
    {
      path: '/play',
      name: 'playing-view',
      component: require('@/components/PlayingView.vue').default,
    },
    {
      path: '/browsing',
      name: 'browsing-view',
      component: () => import('@/components/BrowsingView.vue'),
    },
    {
      path: '*',
      redirect: '/language-setting',
    },
    {
      path: '/welcome',
      component: () => import('@/components/Welcome/WelcomeView.vue'),
      children: [
        {
          path: '',
          name: 'welcome-privacy',
          component: () => import('@/components/Welcome/WelcomePrivacy.vue'),
        },
        {
          path: 'language',
          name: 'language-setting',
          component: () => import('@/components/Welcome/LanguageSetting.vue'),
        },
      ],
    },
  ],
});
