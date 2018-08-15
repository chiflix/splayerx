import Vuex from 'vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import BaseSubtitle from '@/components/PlayingView/BaseSubtitle';
import { mount, createLocalVue } from '@vue/test-utils';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import srt2vtt from 'srt-to-vtt';

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
    expect(wrapper.vm.textTrackID).equal(0);
    expect(wrapper.vm.firstSubIndex).equal(null);
    expect(wrapper.vm.Sagi).equal(null);
    expect(wrapper.vm.mediaHash).equal('');
    expect(wrapper.vm.firstActiveCues).deep.equal([]);
    expect(wrapper.vm.secondActiveCues).deep.equal([]);
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

  it('subtitleInitialize and load local subtitles', () => {
  })

  it('$_concatStream success test', (done) => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const subPath = './test/assets/test3.srt';
    const vttStream = fs.createReadStream(subPath).pipe(srt2vtt());
    wrapper.vm.$_concatStream(vttStream, (err, res) => {
      expect(err).equal(null);
      done();
    });
  });

  it('$_concatStream error test', (done) => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const subPath = './test/assets/test3.srt';
    const vttStream = fs.createReadStream(subPath).pipe(srt2vtt());
    wrapper.vm.$nextTick(() => {
      vttStream.emit('error', new Error('OOPS'));
    });
    wrapper.vm.$_concatStream(vttStream, (err, res) => {
      expect(err).not.equal(null);
      done();
    });
  });

  it('$_timeProcess test', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const res = wrapper.vm.$_timeProcess();
    expect(res).equal(0);
  });

  it('$_subNameFromLocalProcess test', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const file = './test/assets/test3.srt';
    const result = wrapper.vm.$_subNameFromLocalProcess(file);
    const target = {
      title: path.parse(file).name,
      status: null,
      textTrackID: 0,
      origin: 'local',
    };
    expect(result).deep.equal(target);
  });

  it('$_createSubtitleStream success', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const subPath = './test/assets/test3.srt';
    const spy = sinon.spy();
    const concatStream = sinon.stub(wrapper.vm, '$_concatStream');
    concatStream.yields();
    wrapper.vm.$_createSubtitleStream(subPath, spy);
    // done();
    concatStream.restore();
    sinon.assert.calledOnce(spy);
  });

  // it('addVttToVideoElement success', () => {
  //   const wrapper = mount(BaseSubtitle, { store, localVue });
  //   const files = ['./test/assets/test3.srt'];
  //   const spy = sinon.spy();
  //   const stub = sinon.stub(wrapper.vm, 'addVttToVideoElement');
  //   // stub.yields();
  //   // stub(files, spy);
  //   // stub.restore();
  //   // wrapper.vm.addVttToVideoElement(files, (err, res) => {
  //   //   spy();
  //   // });
  //   // sinon.assert.calledOnce(spy);
  // });
});
