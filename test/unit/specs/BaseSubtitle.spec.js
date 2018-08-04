import Vuex from 'vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import BaseSubtitle from '@/components/PlayingView/BaseSubtitle';
import { mount, createLocalVue } from '@vue/test-utils';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('BaseSubtitle.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          mutations: PlaybackState.mutations,
          getters: PlaybackState.getters,
        },
      },
    });
  });

  it('should load correct data', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    expect(wrapper.vm.startIndex).equal(0);
    expect(wrapper.vm.firstSubIndex).equal(null);
    expect(wrapper.vm.secondSubIndex).equal(null);
    expect(wrapper.vm.firstCueHTML).deep.equal([]);
    expect(wrapper.vm.secondCueHTML).deep.equal([]);
    expect(wrapper.vm.subNameArr).deep.equal([]);
    expect(wrapper.vm.subStyle).deep.equal({});
    expect(wrapper.vm.curStyle.fontSize).equal(24);
    expect(wrapper.vm.curStyle.letterSpacing).equal(1);
    expect(wrapper.vm.curStyle.opacity).equal(1);
    expect(wrapper.vm.curStyle.color).equal('');
    expect(wrapper.vm.curStyle.border).equal('');
    expect(wrapper.vm.curStyle.background).equal('');
  });

  it('concatStream error test', (done) => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const callback = sinon.spy();
    const subPath = '../../../test/assets/test3.srt';
    const vttStream = fs.createReadStream(subPath);
    wrapper.vm.concatStream(vttStream, callback);
    done();
    sinon.assert.calledOnce(callback);
  });

  it('$_subNameProcess test', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const file = '../../../test/assets/test3.srt';
    const result = wrapper.vm.$_subNameProcess(file);
    const target = {
      title: path.parse(file).name,
      status: null,
    };
    expect(result).deep.equal(target);
  });
});
