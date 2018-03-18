import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-view',
      component: require('@/components/LandingView').default,
    },
    {
      path: '/play',
      name: 'playing-view',
      component: require('@/components/PlayingView').default,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
