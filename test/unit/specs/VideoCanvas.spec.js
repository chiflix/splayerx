/* TOOD: fix these tests after npm update and under travis
import { createLocalVue, mount } from '@vue/test-utils';
import VideoCanvas from '@/components/PlayingView/VideoCanvas.vue';
import sinon from 'sinon';
import Vuex from 'vuex';
import Video from '@/store/modules/Video';
import Playlist from '@/store/modules/Playlist';
import Window from '@/store/modules/Window';
import { Video as videoActions } from '@/store/actionTypes';

const localVue = createLocalVue();
localVue.use(Vuex);


describe('Component - VideoCanvas', () => {
  const store = new Vuex.Store({
    modules: {
      Video: {
        state: Video.state,
        mutations: Video.mutations,
        getters: Video.getters,
      },
      Playlist: {
        state: Playlist.state,
        mutations: Playlist.mutations,
        getters: Playlist.getters,
      },
      Window: {
        state: Window.state,
        mutations: Window.mutations,
        getters: Window.getters,
      },
    },
  });
  let wrapper;
  let sandbox;
  beforeEach(() => {
    wrapper = mount(VideoCanvas, {
      store,
      localVue
    });
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('Sanity - should VideoCanvas be properly rendered', () => {
    expect(wrapper.contains(VideoCanvas)).to.equal(true);
  });

  describe('Methods', () => {
    describe('Method - onMetaLoaded', () => {
      const fakeEvent = {
        target: {
          duration: 1300,
          videoWidth: 1920,
          videoHeight: 1080,
        },
      };
      it(`should invoke Vuex action: ${videoActions.INITIALIZE}`, () => {
        const fakeAction = sandbox.spy();
        const store = new Vuex.Store({
          modules: {
            Video: {
              state: Video.state,
              mutations: Video.mutations,
              getters: Video.getters,
              actions: {
                [videoActions.INITIALIZE]: fakeAction,
                [videoActions.META_INFO]: sandbox.spy(),
              },
            },
            Playlist: {
              state: Playlist.state,
              mutations: Playlist.mutations,
              getters: Playlist.getters,
            },
            Window: {
              state: Window.state,
              mutations: Window.mutations,
              getters: Window.getters,
            },
          },
        });
        const wrapperWithFakeActions = mount(VideoCanvas, {
          store,
          localVue,
        });

        wrapperWithFakeActions.vm.onMetaLoaded(fakeEvent);

        sinon.assert.calledOnce(fakeAction);
      });

      it(`should invoke Vuex action: ${videoActions.META_INFO}`, () => {
        const fakeAction = sandbox.spy();
        const store = new Vuex.Store({
          modules: {
            Video: {
              state: Video.state,
              mutations: Video.mutations,
              getters: Video.getters,
              actions: {
                [videoActions.INITIALIZE]: sandbox.spy(),
                [videoActions.META_INFO]: fakeAction,
              },
            },
            Playlist: {
              state: Playlist.state,
              mutations: Playlist.mutations,
              getters: Playlist.getters,
            },
            Window: {
              state: Window.state,
              mutations: Window.mutations,
              getters: Window.getters,
            },
          },
        });
        const wrapperWithFakeActions = mount(VideoCanvas, {
          store,
          localVue,
        });

        wrapperWithFakeActions.vm.onMetaLoaded(fakeEvent);

        sinon.assert.calledOnce(fakeAction);
      });

      it('should invoke function changeWindowSize', () => {
        const store = new Vuex.Store({
          modules: {
            Video: {
              state: Video.state,
              mutations: Video.mutations,
              getters: Video.getters,
              actions: {
                [videoActions.INITIALIZE]: sandbox.spy(),
                [videoActions.META_INFO]: sandbox.spy(),
              },
            },
            Playlist: {
              state: Playlist.state,
              mutations: Playlist.mutations,
              getters: Playlist.getters,
            },
            Window: {
              state: Window.state,
              mutations: Window.mutations,
              getters: Window.getters,
            },
          },
        });
        const wrapperWithFakeActions = mount(VideoCanvas, {
          store,
          localVue,
        });

        wrapperWithFakeActions.vm.onMetaLoaded(fakeEvent);
        const fakeAction = sandbox.spy();
        wrapperWithFakeActions.vm.changeWindowSize = fakeAction;

        wrapperWithFakeActions.vm.onMetaLoaded(fakeEvent);

        sinon.assert.calledOnce(fakeAction);
      });
    });
    describe('Method - calculateWindowSize', () => {
      const minSize = [320, 180];
      const maxSize = [1920, 1200];

      it('should return origin video size when video is smaller than maxSize', () => {
        const videoSize = [1920, 1080];

        const result = wrapper.vm.calculateWindowSize(minSize, maxSize, videoSize);

        expect(result).to.deep.equal(videoSize);
      });

      it('should return size by windowWidth and videoRatio when video > window && '
        + 'videoRatio > windowRatio', () => {
        const videoSize = [2560, 1080];
        const expectedResult = [1920, 810];

        const result = wrapper.vm.calculateWindowSize(minSize, maxSize, videoSize);

        expect(result).to.deep.equal(expectedResult);
      });

      it('should return size by windowHeight and videoRatio when video > window && '
        + 'videoRatio < windowRatio', () => {
        const videoSize = [2560, 1920];
        const expectedResult = [1600, 1200];

        const result = wrapper.vm.calculateWindowSize(minSize, maxSize, videoSize);

        expect(result).to.deep.equal(expectedResult);
      });

      it('should return size by windowWidth and videoRatio when video < window && '
        + 'videoRatio > windowRatio', () => {
        const videoSize = [256, 108];
        const expectedResult = [427, 180];

        const result = wrapper.vm.calculateWindowSize(minSize, maxSize, videoSize);

        expect(result).to.deep.equal(expectedResult);
      });

      it('should return size by windowHeight and videoRatio when video < window && '
        + 'videoRatio < windowRatio', () => {
        const videoSize = [256, 192];
        const expectedResult = [320, 240];

        const result = wrapper.vm.calculateWindowSize(minSize, maxSize, videoSize);

        expect(result).to.deep.equal(expectedResult);
      });
    });
    describe('Method - calculateWindowPosition', () => {
      const windowRect = [0, 23, 1920, 1177];
      const newSize = [427, 180];
      it('should return new position based on center point', () => {
        const getCenterPoint = rect => rect.slice(0, 2)
          .map((value, index) => Math.round(value + (rect.slice(2, 4)[index] / 2)));
        const currentRect = [0, 40, 800, 600];

        const result = wrapper.vm.calculateWindowPosition(currentRect, windowRect, newSize);

        expect(getCenterPoint(currentRect)).to.deep.equal(getCenterPoint(result.concat(newSize)));
      });

      it('should move to right when window is left out ot window', () => {
        const currentRect = [-300, 23, 800, 600];
        const expectedResult = [0, 23];
        const newSize = [800, 600];

        const result = wrapper.vm.calculateWindowPosition(currentRect, windowRect, newSize);

        expect(result).to.deep.equal(expectedResult);
      });

      it('should move to left when window is right out ot window', () => {
        const currentRect = [2220, 23, 800, 600];
        const expectedResult = [1120, 23];
        const newSize = [800, 600];

        const result = wrapper.vm.calculateWindowPosition(currentRect, windowRect, newSize);

        expect(result).to.deep.equal(expectedResult);
      });

      it('should move up when window is bottom out ot window', () => {
        const currentRect = [0, 623, 800, 600];
        const expectedResult = [0, 600];
        const newSize = [800, 600];

        const result = wrapper.vm.calculateWindowPosition(currentRect, windowRect, newSize);

        expect(result).to.deep.equal(expectedResult);
      });

      it('should move down when window is top out ot window', () => {
        const currentRect = [0, -277, 800, 600];
        const expectedResult = [0, 23];
        const newSize = [800, 600];

        const result = wrapper.vm.calculateWindowPosition(currentRect, windowRect, newSize);

        expect(result).to.deep.equal(expectedResult);
      });
    });
    describe('Method - changeWindowSize', () => {
      it('should invoke function calculateWindowSize', () => {
        const fakeFunction = sandbox.spy(wrapper.vm, 'calculateWindowSize');
        wrapper.vm.calculateWindowSize = fakeFunction;
        wrapper.vm.calculateWindowPosition = sandbox.spy(wrapper.vm, 'calculateWindowPosition');
        wrapper.vm.controlWindowRect = sandbox.spy(wrapper.vm, 'controlWindowRect');

        wrapper.vm.changeWindowSize();

        sinon.assert.calledOnce(fakeFunction);
      });

      it('should invoke function calculateWindowPosition', () => {
        const fakeFunction = sandbox.spy(wrapper.vm, 'calculateWindowPosition');
        wrapper.vm.calculateWindowPosition = fakeFunction;
        wrapper.vm.calculateWindowSize = sandbox.spy(wrapper.vm, 'calculateWindowSize');
        wrapper.vm.controlWindowRect = sandbox.spy(wrapper.vm, 'controlWindowRect');

        wrapper.vm.changeWindowSize();

        sinon.assert.calledOnce(fakeFunction);
      });

      it('should invoke function controlWindowRect', () => {
        const fakeFunction = sandbox.spy(wrapper.vm, 'controlWindowRect');
        wrapper.vm.controlWindowRect = fakeFunction;
        wrapper.vm.calculateWindowSize = sandbox.spy(wrapper.vm, 'calculateWindowSize');
        wrapper.vm.calculateWindowPosition = sandbox.spy(wrapper.vm, 'calculateWindowPosition');

        wrapper.vm.changeWindowSize();

        sinon.assert.calledOnce(fakeFunction);
      });

      it('should videoExisted be changed after called changeWindowSize', () => {
        wrapper.vm.calculateWindowSize = sandbox.spy(wrapper.vm, 'calculateWindowSize');
        wrapper.vm.calculateWindowPosition = sandbox.spy(wrapper.vm, 'calculateWindowPosition');
        wrapper.vm.controlWindowRect = sandbox.spy(wrapper.vm, 'controlWindowRect');
        const previous = wrapper.vm.videoExisted;

        wrapper.vm.changeWindowSize();

        expect(wrapper.vm.videoExisted).to.not.equal(previous);
      });
    });
  });
});
*/
