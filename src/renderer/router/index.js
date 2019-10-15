import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

const landingView = () => import('@/containers/LandingView.vue');
const playingView = () => import('@/components/PlayingView.vue');
const browsingView = () => import('@/components/BrowsingView.vue');

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-view',
      component: landingView,
    },
    {
      path: '/play',
      name: 'playing-view',
      component: playingView,
    },
    {
      path: '/browsing',
      name: 'browsing-view',
      component: browsingView,
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
