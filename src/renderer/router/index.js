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
      path: '/winAbout',
      name: 'windows-about-view',
      component: require('@/components/winAbout.vue').default,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
