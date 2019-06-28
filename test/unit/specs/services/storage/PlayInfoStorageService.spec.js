import sinon from 'sinon';
import { info } from '@/libs/DataBase';
import PlayInfoStorageService from '../../../../../src/renderer/services/storage/PlayInfoStorageService';

describe('PlayInfoStorageService logic service', () => {
  let playInfoStorageService;
  beforeEach(() => {
    playInfoStorageService = new PlayInfoStorageService();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should successfully updateMediaItemBy when video has storage', async () => {
    const demo = {
      videoId: 1,
    };
    sinon.stub(info, 'getValueByKey').callsFake(() => demo);
    sinon.stub(info, 'update').callsFake(() => demo);
    const result = await playInfoStorageService.updateMediaItemBy(1, {});
    expect(result).to.be.equal(true);
  });

  it('should fail updateMediaItemBy when video do not have storage', async () => {
    const demo = null;
    sinon.stub(info, 'getValueByKey').callsFake(() => demo);
    sinon.stub(info, 'update').callsFake(() => demo);
    const result = await playInfoStorageService.updateMediaItemBy(1, {});
    expect(result).to.be.equal(false);
  });

  it('should successfully updateRecentPlayedBy', async () => {
    const demo = {
      id: 1,
    };
    sinon.stub(info, 'getValueByKey').callsFake(() => demo);
    sinon.stub(info, 'update').callsFake(() => demo);
    const result = await playInfoStorageService.updateRecentPlayedBy(1, {});
    expect(result).to.be.equal(true);
  });

  // 如果 updateRecentPlayedBy方法中，如果出现取出来的数据不对，需不需要 throw error
  // 目前验证数据库取出的数据
  // it('should fail updateRecentPlayedBy with error data', async () => {
  //   const demo = {
  //     xx: 1,
  //   };
  //   sinon.stub(info, 'getValueByKey').callsFake(() => demo);
  //   sinon.stub(info, 'update').callsFake(() => demo);
  //   const result = await playInfoStorageService.updateRecentPlayedBy('1', {});
  //   expect(result).to.be.equal(false);
  // });

  it('should fail updateRecentPlayedBy when getValueByKey throw error', async () => {
    const demo = {
      id: 1,
    };
    sinon.stub(info, 'getValueByKey').callsFake(() => { throw new Error(); });
    sinon.stub(info, 'update').callsFake(() => demo);
    const result = await playInfoStorageService.updateRecentPlayedBy(1, {});
    expect(result).to.be.equal(false);
  });

  it('should fail updateRecentPlayedBy when update throw error', async () => {
    const demo = {
      id: 1,
    };
    sinon.stub(info, 'getValueByKey').callsFake(() => demo);
    sinon.stub(info, 'update').callsFake(() => { throw new Error(); });
    const result = await playInfoStorageService.updateRecentPlayedBy(1, {});
    expect(result).to.be.equal(false);
  });
  describe('PlayInfoService - deleteRecentPlayedBy', () => {
    const playlist = {
      id: 1,
      items: [1, 2, 3],
    };
    let deleteStub;
    beforeEach(() => {
      deleteStub = sinon.stub(info, 'delete');
      sinon.stub(info, 'getValueByKey').resolves(playlist);
    });
    afterEach(() => {
      sinon.restore();
    });


    it('should successfully deleteRecentPlayedBy', async () => {
      const result = await playInfoStorageService.deleteRecentPlayedBy(1);
      expect(deleteStub.calledWith('media-item', 1)).to.be.true;
      expect(deleteStub.calledWith('media-item', 2)).to.be.true;
      expect(deleteStub.calledWith('media-item', 3)).to.be.true;
      expect(deleteStub.calledWith('recent-played', 1)).to.be.true;
      expect(result).to.be.true;
    });
    it('should skip the non-existed media-item', async () => {
      deleteStub.withArgs('media-item', 1).resolves();
      deleteStub.withArgs('media-item', 2).rejects();
      deleteStub.withArgs('media-item', 3).resolves();
      const result = await playInfoStorageService.deleteRecentPlayedBy(1);
      expect(deleteStub.calledWith('media-item', 1)).to.be.true;
      expect(deleteStub.calledWith('media-item', 2)).to.be.true;
      expect(deleteStub.calledWith('media-item', 3)).to.be.true;
      expect(deleteStub.calledWith('recent-played', 1)).to.be.true;
      expect(result).to.be.true;
    });
    it('should fail deleteRecentPlayedBy when cannot delete playlist', async () => {
      deleteStub.withArgs('recent-played', 1).rejects();
      const result = await playInfoStorageService.deleteRecentPlayedBy(1);
      expect(result).to.be.false;
    });
  });
  describe('PLayInfoService - getAllRecentPlayed', () => {
    it('should get sorted result from recent-played', async () => {
      const getAllResults = [
        { lastOpened: 1 },
        { lastOpened: 3 },
        { lastOpened: 2 },
        { lastOpened: 4 },
      ];
      sinon.stub(info, 'getAll').returns(getAllResults);
      const results = await playInfoStorageService.getAllRecentPlayed();
      const expectResults = [
        { lastOpened: 4 },
        { lastOpened: 3 },
        { lastOpened: 2 },
        { lastOpened: 1 },
      ];
      expect(results).to.deep.equal(expectResults);
    });
  });
  it('should successfully getPlaylistRecord', async () => {
    const demo = {
      id: 1,
    };
    sinon.stub(info, 'getValueByKey').resolves(demo);
    const result = await playInfoStorageService.getPlaylistRecord(1);
    expect(result).to.be.deep.equal(demo);
  });
});
