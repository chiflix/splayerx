import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-view',
      component: require('@/components/LandingView.vue').default,
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
      redirect: '/',
    },
  ],
});
