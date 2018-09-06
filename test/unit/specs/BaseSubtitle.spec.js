import Vuex from 'vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import WindowState from '@/store/modules/WindowState';
import BaseSubtitle from '@/components/PlayingView/BaseSubtitle';
import VideoCanvas from '@/components/PlayingView/VideoCanvas';
import { mount, createLocalVue } from '@vue/test-utils';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import srt2vtt from 'srt-to-vtt';
import helpers from '@/helpers';

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
        WindowState: {
          state: WindowState.state,
          mutations: WindowState.mutations,
          getters: WindowState.getters,
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
    expect(wrapper.vm.subStyle).deep.equal({});
    expect(wrapper.vm.curStyle.fontSize).equal(5);
    expect(wrapper.vm.curStyle.letterSpacing).equal(1);
    expect(wrapper.vm.curStyle.opacity).equal(1);
    expect(wrapper.vm.curStyle.color).equal('');
    expect(wrapper.vm.curStyle.border).equal('');
    expect(wrapper.vm.curStyle.background).equal('');
  });

  it('subtitleInitialize to load local subtitles', async () => {
    const wrapper = mount(VideoCanvas, {
      store,
      localVue,
      propsData: {
        src: 'file://./../../../../test/assets/test.avi',
      },
    });
    const childWrapper = wrapper.find(BaseSubtitle);
    childWrapper.setData({ readingMkv: true });
    const stub = sinon.stub(childWrapper.vm, 'loadLocalTextTracks');
    await childWrapper.vm.subtitleInitialize();

    sinon.assert.called(stub);
    expect(childWrapper.vm.readingMkv).equal(false);
    stub.restore();
  });

  it('subtitleInitialize to load server subtitles', async () => {
    const wrapper = mount(VideoCanvas, {
      store,
      localVue,
      propsData: {
        src: 'file://./../../../../test/assets/testServer.avi',
      },
    });
    const childWrapper = wrapper.find(BaseSubtitle);
    const stub = sinon.stub(childWrapper.vm, 'loadServerTextTracks');
    await childWrapper.vm.subtitleInitialize();
    sinon.assert.called(stub);
    stub.restore();
  });

  it('subtitleInitialize to load embedded subtitles', async () => {
    const wrapper = mount(VideoCanvas, {
      store,
      localVue,
      propsData: {
        src: 'file://./../../../../test/assets/testMkv.mkv',
      },
    });
    const childWrapper = wrapper.find(BaseSubtitle);
    const stub = sinon.stub(childWrapper.vm, 'mkvProcess');
    await childWrapper.vm.subtitleInitialize();
    sinon.assert.called(stub);
    stub.restore();
  });

  it('should emit an event when no subtitles found', async () => {
    const wrapper = mount(VideoCanvas, {
      store,
      localVue,
      propsData: {
        src: 'file://./../../../../test/assets/testServer.avi',
      },
    });
    const childWrapper = wrapper.find(BaseSubtitle);
    const statusStub = sinon.stub(childWrapper.vm, 'subtitleInitializingStatus').callsFake(() => new Promise((resolve) => {
      resolve([
        {
          found: false,
          size: 0,
        },
        {
          found: false,
          size: 0,
        },
        {
          found: false,
          size: 0,
        },
      ]);
    }));
    const spy = sinon.spy(childWrapper.vm.$bus, '$emit');
    await childWrapper.vm.subtitleInitialize();
    sinon.assert.called(spy);
    sinon.assert.called(statusStub);
    expect(spy.calledWith('toggle-no-subtitle-menu')).equal(true);
    spy.restore();
    statusStub.restore();
  });

  it('loadLocalTextTracks test', (done) => {
    const wrapper = mount(VideoCanvas, {
      store,
      localVue,
      propsData: {
        src: 'file:///./test/assets/test.avi',
      },
    });
    const childWrapper = wrapper.find(BaseSubtitle);
    const files = ['./test/assets/test3.srt', './test/assets/test.srt'];
    const spy = sinon.spy(childWrapper.vm, 'addVttToVideoElement');
    childWrapper.vm.loadLocalTextTracks(files, () => {
      sinon.assert.called(spy);
      spy.restore();
      done();
    });
  });

  it('loadServerTextTracks error test', (done) => {
    const Sagi = helpers.methods.sagi();
    const wrapper = mount(VideoCanvas, {
      store,
      localVue,
      propsData: {
        src: 'file:///./test/assets/test.avi',
      },
    });
    const childWrapper = wrapper.find(BaseSubtitle);
    childWrapper.setData({
      Sagi,
    });
    const cb = sinon.spy(() => {
      sinon.assert.called(cb);
      done();
    });
    childWrapper.vm.loadServerTextTracks(cb);
  });

  it('loadServerTextTracks success test', (done) => {
    const stub = sinon.stub(helpers.methods.sagi(), 'getTranscript').callsFake(() => new Promise((resolve) => {
      resolve({
        array: [
          0, [
            [
              0,
              0,
              ['test'],
            ],
          ],
        ],
      });
    }));
    const Sagi = helpers.methods.sagi();
    const mediaHash = helpers.methods.mediaQuickHash(decodeURI('file://./test/assets/test.avi'.replace('file://', '')));
    const wrapper = mount(VideoCanvas, {
      store,
      localVue,
      propsData: {
        src: 'file:///./test/assets/test.avi',
      },
    });
    const childWrapper = wrapper.find(BaseSubtitle);
    childWrapper.setData({
      Sagi,
      mediaHash,
    });
    childWrapper.vm.loadServerTextTracks(() => {
      stub.restore();
      done();
    });
  });

  it('mkvProcess method works fine', async () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    wrapper.setData({ mkvSubsInitialized: false });
    const stub = sinon.stub(wrapper.vm, 'mkvProcessInit');
    wrapper.vm.mkvProcess();
    sinon.assert.calledOnce(stub);
    stub.restore();
  });

  it('concatStream success test', (done) => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const subPath = './test/assets/test3.srt';
    const vttStream = fs.createReadStream(subPath).pipe(srt2vtt());
    wrapper.vm.concatStream(vttStream, (err) => {
      expect(err).equal(null);
      done();
    });
  });

  it('concatStream error test', (done) => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const subPath = './test/assets/test3.srt';
    const vttStream = fs.createReadStream(subPath).pipe(srt2vtt());
    wrapper.vm.$nextTick(() => {
      vttStream.emit('error', new Error('OOPS'));
    });
    wrapper.vm.concatStream(vttStream, (err) => {
      expect(err).not.equal(null);
      done();
    });
  });

  it('timeProcess test', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const res = wrapper.vm.timeProcess();
    expect(res).equal(0);
  });

  it('createSubtitleStream success', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const subPath = './test/assets/test3.srt';
    const spy = sinon.spy();
    const concatStream = sinon.stub(wrapper.vm, 'concatStream');
    concatStream.yields();
    wrapper.vm.createSubtitleStream(subPath, spy);
    concatStream.restore();
    sinon.assert.calledOnce(spy);
  });

  it('subNameFromLocalProcess test', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const file = './test/assets/test3.srt';
    const result = wrapper.vm.subNameFromLocalProcess(file);
    const target = {
      title: path.parse(file).name,
      status: null,
      textTrackID: 0,
      origin: 'local',
    };
    expect(result).deep.equal(target);
  });

  it('subNameFromServerProcess has language code', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const textTrack = [1, 'CN'];
    const target = {
      title: 'CN',
      status: null,
      textTrackID: 0,
      origin: 'server',
    };
    const res = wrapper.vm.subnameFromServerProcess(textTrack);
    expect(res).deep.equal(target);
  });

  it('subNameFromServerProcess does not have language code', () => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    const textTrack = [1, ''];
    const target = {
      title: 'subtitle',
      status: null,
      textTrackID: 0,
      origin: 'server',
    };
    const res = wrapper.vm.subnameFromServerProcess(textTrack);
    expect(res).deep.equal(target);
  });

  // Event Bus Test
  it('test video-loaded event listener', (done) => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    wrapper.vm.$bus.$emit('video-loaded');
    const stub1 = sinon.stub(wrapper.vm.$bus, '$on');
    const stub2 = sinon.stub(wrapper.vm, 'subtitleInitialize').callsFake(() => {
      done();
    });
    stub1.yields();
    stub1('video-loaded', stub2);
    sinon.assert.called(stub2);
    stub1.restore();
    stub2.restore();
  });

  it('test sub-first-change event listened', (done) => {
    const wrapper = mount(BaseSubtitle, { store, localVue });
    wrapper.vm.$bus.$emit('sub-first-change');
    const stub1 = sinon.stub(wrapper.vm.$bus, '$on');
    const stub2 = sinon.stub(wrapper.vm, 'subtitleShow').callsFake(() => {
      done();
    });
    stub1.yields();
    stub1('sub-first-change', stub2);
    sinon.assert.called(stub2);
    stub1.restore();
    stub2.restore();
  });
});
