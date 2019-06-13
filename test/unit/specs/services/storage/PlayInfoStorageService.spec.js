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
    const result = await playInfoStorageService.updateMediaItemBy('1', {});
    expect(result).to.be.equal(true);
  });

  it('should fail updateMediaItemBy when video do not have storage', async () => {
    const demo = null;
    sinon.stub(info, 'getValueByKey').callsFake(() => demo);
    sinon.stub(info, 'update').callsFake(() => demo);
    const result = await playInfoStorageService.updateMediaItemBy('1', {});
    expect(result).to.be.equal(false);
  });

  it('should successfully updateRecentPlayedBy', async () => {
    const demo = {
      id: 1,
    };
    sinon.stub(info, 'getValueByKey').callsFake(() => demo);
    sinon.stub(info, 'update').callsFake(() => demo);
    const result = await playInfoStorageService.updateRecentPlayedBy('1', {});
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
    const result = await playInfoStorageService.updateRecentPlayedBy('1', {});
    expect(result).to.be.equal(false);
  });

  it('should fail updateRecentPlayedBy when update throw error', async () => {
    const demo = {
      id: 1,
    };
    sinon.stub(info, 'getValueByKey').callsFake(() => demo);
    sinon.stub(info, 'update').callsFake(() => { throw new Error(); });
    const result = await playInfoStorageService.updateRecentPlayedBy('1', {});
    expect(result).to.be.equal(false);
  });

  it('should successfully deleteRecentPlayedBy', async () => {
    const demo = {
      id: 1,
    };
    sinon.stub(info, 'delete').callsFake(() => demo);
    const result = await playInfoStorageService.deleteRecentPlayedBy('1', {});
    expect(result).to.be.equal(true);
  });

  it('should fail deleteRecentPlayedBy when throw error', async () => {
    sinon.stub(info, 'delete').callsFake(() => { throw new Error(); });
    const result = await playInfoStorageService.deleteRecentPlayedBy('1', {});
    expect(result).to.be.equal(false);
  });
});
