import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import sinon from 'sinon';
import TheProgressBar from '@/containers/TheProgressBar.vue';

describe('Component - TheProgressBar', () => {
  let sandbox;
  let wrapper;
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
    modules: {
      Video: {
        getters: {
          winWidth: () => 1920,
        },
      },
      Windos: {
        getters: {
          duration: () => 2000,
          currentTime: () => 1400,
          ratio: () => 1.78,
        },
      },
    },
  });

  beforeEach(() => {
    wrapper = shallowMount(TheProgressBar, { store, localVue, attachToDocument: true });
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('Sanity - should render TheProgressBar properly', () => {
    expect(wrapper.contains(TheProgressBar)).to.equal(true);
  });


  describe('Event handlers', () => {
    describe('Event - mousemove', () => {
      it('should mousemove set hoveredPageX', () => {
        const oldHoveredPageX = wrapper.vm.hoveredPageX;

        wrapper.trigger('mousemove');

        wrapper.vm.$nextTick((done) => {
          expect(wrapper.vm.hoveredPageX).to.not.equal(oldHoveredPageX);
          done();
        });
      });

      it('should mousemove set mouseleave to false', () => {
        wrapper.trigger('mousemove');

        expect(wrapper.vm.mouseleave).to.equal(false);
      });

      it('should mousemove set showThumbnail to true when move to other area', () => {
        wrapper.find('.progress').trigger('mousemove');

        expect(wrapper.vm.showThumbnail).to.equal(true);
      });
    });

    describe('Event - mouseleave', () => {
      it('should mouseleave set hovering to false when not mousedown', () => {
        wrapper.vm.mousedown = false;

        wrapper.trigger('mouseleave');

        expect(wrapper.vm.hovering).to.equal(false);
      });

      it('should mouseleave set showThumbnail to false when not mousedown', () => {
        wrapper.vm.mousedown = false;

        wrapper.trigger('mouseleave');

        expect(wrapper.vm.showThumbnail).to.equal(false);
      });


      it('should mouseleave do not set hovering when mousedown', () => {
        wrapper.vm.mousedown = true;
        const oldHovering = wrapper.vm.hovering;

        wrapper.trigger('mouseleave');

        expect(wrapper.vm.hovering).to.equal(oldHovering);
      });

      it('should mouseleave set mouseleave to true', () => {
        wrapper.trigger('mouseleave');

        expect(wrapper.vm.mouseleave).to.equal(true);
      });
    });

    describe('Event - mousedown', () => {
      it('should mousedown set mousedown to true', () => {
        wrapper.trigger('mousedown');

        expect(wrapper.vm.mousedown).to.equal(true);
      });

      it('should mousedown set showThumbnail to false when down on leftInvisible', () => {
        wrapper.find({ ref: 'leftInvisible' }).trigger('mousedown');

        expect(wrapper.vm.showThumbnail).to.equal(false);
      });

      it('should mousedown not set showThumbnail to false when not down on leftInvisible', () => {
        wrapper.vm.showThumbnail = true;

        wrapper.find('.progress').trigger('mousedown');

        expect(wrapper.vm.showThumbnail).to.equal(true);
      });

      it('should mousedown emit seek event on event bus with hoveredCurrentTime', () => {
        const busSpy = sandbox.spy(wrapper.vm.$bus, '$emit');
        wrapper.trigger('mousedown');

        sinon.assert.calledWithExactly(busSpy, 'seek', wrapper.vm.hoveredCurrentTime);
      });
    });
  });

  describe('Methods', () => {
    describe('Method - pageXToProportion', () => {
      const fakeButtonWidth = 30;
      const winWidth = 1920;
      it('should return 0 when pageX <= fakeButtonWidth', () => {
        const pageX = fakeButtonWidth - 1;

        const result = wrapper.vm.pageXToProportion(pageX, fakeButtonWidth, winWidth);

        expect(result).to.equal(0);
      });

      it('should return 1 when pageX >= winWidth - fakeButtonWidth', () => {
        const pageX = (winWidth - fakeButtonWidth) + 20;

        const result = wrapper.vm.pageXToProportion(pageX, fakeButtonWidth, winWidth);

        expect(result).to.equal(1);
      });

      it('should return proper proportion when given pageX in range', () => {
        const pageX = 1000;
        const expectedResult = (pageX - fakeButtonWidth) / (winWidth - (fakeButtonWidth * 2));

        const result = wrapper.vm.pageXToProportion(pageX, fakeButtonWidth, winWidth);

        expect(result).to.equal(expectedResult);
      });
    });

    describe('Method - pageXToThumbnailPosition', () => {
      const fakeButtonWidth = 30;
      const thumbnailWidth = 136;
      const winWidth = 1920;
      it('should return fakeButtonWidth when pageX <= fakeButtonWidth + (thumbnailWidth / 2)', () => {
        const pageX = (fakeButtonWidth + (thumbnailWidth / 2)) - 20;

        const result = wrapper.vm.pageXToThumbnailPosition(
          pageX, fakeButtonWidth,
          thumbnailWidth, winWidth,
        );

        expect(result).to.equal(fakeButtonWidth);
      });

      it('should return proper value when pageX > winWidth - (fakeButtonWidth + (thumbnailWidth / 2))', () => {
        const pageX = (winWidth - (fakeButtonWidth + (thumbnailWidth / 2))) + 20;
        const expectedResult = winWidth - (fakeButtonWidth + thumbnailWidth);

        const result = wrapper.vm.pageXToThumbnailPosition(
          pageX, fakeButtonWidth,
          thumbnailWidth, winWidth,
        );

        expect(result).to.equal(expectedResult);
      });

      it('should return proper value when given pageX in range', () => {
        const pageX = 1000;
        const expectedResult = pageX - (thumbnailWidth / 2);

        const result = wrapper.vm.pageXToThumbnailPosition(
          pageX, fakeButtonWidth,
          thumbnailWidth, winWidth,
        );

        expect(result).to.equal(expectedResult);
      });
    });
  });
});
