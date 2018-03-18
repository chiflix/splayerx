import Vue from 'vue';
import LandingView from '@/components/LandingView';

describe('LandingView.vue', () => {
  it('should render correct contents', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: h => h(LandingView),
    }).$mount();

    expect(vm.$el.querySelector('.title').textContent).to.contain('Welcome to your new project!');
  });
});
