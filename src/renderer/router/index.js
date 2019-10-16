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
      component: () => import('@/components/PlayingView.vue'),
    },
    {
      path: '/browsing',
      name: 'browsing-view',
      // will crash if imported asynced
      component: require('@/components/BrowsingView.vue').default,
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
