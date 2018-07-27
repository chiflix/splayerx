import Thumbnail from '@/components/PlayingView/Thumbnail';
import { shallowMount } from '@vue/test-utils';
import sinon from 'sinon';

describe('Thumbnail Unit Tests', () => {
  // Setup sinon sandbox
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  // Some vue options
  const propsData = {
    src: 'file:///',
  };

  it('should have default props type', () => {
    const wrapper = shallowMount(Thumbnail, { propsData });
    const vmShortcut = wrapper.vm;

    // Props type check
    expect(vmShortcut.src).to.be.a('string');
    expect(vmShortcut.screenshotContent).to.be.a('string');
    expect(vmShortcut.currentTime).to.be.a('number');
    expect(vmShortcut.positionOfScreenshot).to.be.a('number');
    expect(vmShortcut.widthOfThumbnail).to.be.a('number');
    expect(vmShortcut.heightOfThumbnail).to.be.a('number');
    expect(vmShortcut.maxThumbnailWidth).to.be.a('number');
    expect(vmShortcut.maxThumbnailHeight).to.be.a('number');
  });
  it('should have default props value', () => {
    const wrapper = shallowMount(Thumbnail, { propsData });
    const vmShortcut = wrapper.vm;

    // Props value check
    expect(vmShortcut.src).to.equal('file:///');
    expect(vmShortcut.screenshotContent).to.equal('00:00');
    expect(vmShortcut.positionOfScreenshot).to.equal(16);
    expect(vmShortcut.widthOfThumbnail).to.equal(170);
    expect(vmShortcut.heightOfThumbnail).to.equal(95);
    expect(vmShortcut.currentTime).to.equal(0);
    expect(vmShortcut.maxThumbnailWidth).to.equal(240);
    expect(vmShortcut.maxThumbnailHeight).to.equal(136);
  });
  it('should have default data type', () => {
    const wrapper = shallowMount(Thumbnail, { propsData });
    const vmShortcut = wrapper.vm;

    // Data type check
    expect(vmShortcut.videoCanvasShow).to.be.a('boolean');
    expect(vmShortcut.autoGeneration).to.be.a('boolean');
    expect(vmShortcut.autoGenerationDelay).to.be.a('number');
    expect(vmShortcut.videoInfo).to.be.a('object');
    expect(vmShortcut.videoInfo.duration).to.be.a('number');
    expect(vmShortcut.videoInfo.currentTime).to.be.a('number');
    expect(vmShortcut.videoInfo.currentIndex).to.be.a('number');
    expect(vmShortcut.thumbnailInfo).to.be.a('object');
    expect(vmShortcut.thumbnailInfo.canvas).to.be.null;
    expect(vmShortcut.thumbnailInfo.video).to.be.null;
    expect(vmShortcut.thumbnailInfo.count).to.be.a('number');
    expect(vmShortcut.thumbnailInfo.generationInterval).to.be.a('number');
    expect(vmShortcut.thumbnailInfo.finished).to.be.a('boolean');
    expect(vmShortcut.imageMap).to.be.a('map');
    expect(vmShortcut.manualGenerationIndex).to.be.a('number');
    expect(vmShortcut.MAX_THUMBNAIL_COUNT).to.be.a('number');
    expect(vmShortcut.thumbnailWorker).to.be.a('worker');
  });
  it('should have default data value', () => {
    const wrapper = shallowMount(Thumbnail, { propsData });
    const vmShortcut = wrapper.vm;

    // Data value check
    expect(vmShortcut.videoCanvasShow).to.equal(true);
    expect(vmShortcut.autoGeneration).to.equal(false);
    expect(vmShortcut.autoGenerationDelay).to.equal(0);
    expect(vmShortcut.videoInfo.duration).to.equal(0);
    expect(vmShortcut.videoInfo.currentTime).to.equal(0);
    expect(vmShortcut.videoInfo.currentIndex).to.equal(0);
    expect(vmShortcut.thumbnailInfo.canvas).to.be.null;
    expect(vmShortcut.thumbnailInfo.video).to.be.null;
    expect(vmShortcut.thumbnailInfo.count).to.equal(0);
    expect(vmShortcut.thumbnailInfo.generationInterval).to.equal(0);
    expect(vmShortcut.thumbnailInfo.finished).to.equal(false);
    expect(vmShortcut.manualGenerationIndex).to.equal(0);
    expect(vmShortcut.MAX_THUMBNAIL_COUNT).to.equal(100);
  });
});
