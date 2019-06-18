import sinon from 'sinon';
import RecentPlayService from '@/services/media/RecentPlayService';
import { mediaStorageService } from '@/services/storage/MediaStorageService';
import { info } from '@/libs/DataBase';


describe('RecentPlayService', () => {
  const path = 'path/to/video';
  const videoId = 5;
  const mediaHash = 'fa#$%ke-qu%#%ick-Ha#$$sh4l';
  let recentPlayService;
  const factoryMediaItem = (path, lastPlayedTime, smallShortCut) => ({
    quickHash: mediaHash,
    path,
    type: 'video',
    source: '',
    lastPlayedTime,
    smallShortCut,
  });
  beforeEach(() => {
    recentPlayService = new RecentPlayService(mediaStorageService, path, videoId);
  });
  describe('getCover', () => {
    it('getCover', async () => {
      const getImageByStub = sinon.stub(mediaStorageService, 'getImageBy');
      const coverPath = 'path/to/cover';
      getImageByStub.withArgs(mediaHash, 'cover').returns(coverPath);
      const result = await recentPlayService.getCover(mediaHash);
      expect(getImageByStub.called).to.be.true;
      expect(result).to.equal(coverPath);
    });
  });
  describe('getRecord', () => {
    beforeEach(() => {
      recentPlayService = new RecentPlayService(mediaStorageService, path, videoId);
    });
    it('with videoId', async () => {
      const getStub = sinon.stub(info, 'getValueByKey');
      const mediaItem = {
        quickHash: mediaHash,
        path,
        type: 'video',
        source: 'playlist',
        lastPlayedTime: 1000,
        smallShortCut: 'shortCut',
      };
      getStub.withArgs('media-item', videoId).returns(mediaItem);
      await recentPlayService.getRecord(videoId);
      expect(getStub.calledWith('media-item', videoId)).to.be.true;
      expect(recentPlayService.lastPlayedTime).to.equal(mediaItem.lastPlayedTime);
      expect(recentPlayService.imageSrc).to.equal(mediaItem.smallShortCut);
    });
    it('without videoId', async () => {
      const getAllStub = sinon.stub(info, 'getAllValueByIndex');
      const mediaItems = [];
      const mediaItem1 = ['path/to/video', 1200, 'shortCut1'];
      const mediaItem2 = ['path/to/video2', 100, 'shortCut2'];

      mediaItems.push(factoryMediaItem(...mediaItem1));
      mediaItems.push(factoryMediaItem(...mediaItem2));

      getAllStub.withArgs('media-item', 'source', '').returns(mediaItems);
      await recentPlayService.getRecord();
      expect(getAllStub.calledWith('media-item', 'source', '')).to.be.true;
      expect(recentPlayService.lastPlayedTime).to.equal(1200);
      expect(recentPlayService.imageSrc).to.equal('shortCut1');
    });
  });
});
