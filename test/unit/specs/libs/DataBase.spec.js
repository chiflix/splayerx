import { info } from '@/libs/DataBase';

describe('DataBase', () => {
  const playlistItemData1 = {
    items: [4],
    hpaths: ['fa#$%ke-qu%#%ick-Ha#$$sh4l'],
    lastOpened: 8,
    playedIndex: 0,
  };
  const playlistItemData2 = {
    items: [1, 2, 3],
    hpaths: ['fa#$%ke-qu%#%ick-Ha#$$sh1l', 'fa#$%ke-qu%#%ick-Ha#$$sh2', 'fa#$%ke-qu%#%ick-Ha#$$sh3'],
    lastOpened: 4,
    playedIndex: 1,
  };
  const mediaItemData1 = {
    quickHash: 'fa#$%ke-qu%#%ick-Ha#$$sh',
    lastPlayedTime: 0,
    duration: 1,
    source: '',
  };
  const mediaItemData2 = {
    quickHash: 'fa#$%ke-qu%#%ick-Ha#$$sh',
    lastPlayedTime: 5,
    duration: 10,
    source: '',
  };
  // const subtitleData1 = {
  //   format: 'a',
  //   language: 'b',
  //   src: 'c',
  //   type: 'd',
  // };
  // const subtitleData2 = {
  //   format: 'c',
  //   language: 'b',
  //   src: 'a',
  //   type: 'd',
  // };

  beforeEach(async () => {
    await info.clear('recent-played');
    await info.clear('media-item');
  });

  describe('method - add', () => {
    it('add to infoDB', async () => {
      const key = await info.add('media-item', mediaItemData1);
      const result = await info.getValueByKey('media-item', key);
      expect(result).to.deep.equal({ ...mediaItemData1, videoId: key });
    });
  });
  describe('method - update', () => {
    it('update to infoDB', async () => {
      const key = await info.add('media-item', mediaItemData1);
      const updateKey = await info.update('media-item', key, { ...mediaItemData2, videoId: key });
      const result = await info.getValueByKey('media-item', key);
      expect(result).to.deep.equal({ ...mediaItemData2, videoId: key });
      expect(key).to.equal(updateKey);
    });
  });
  describe('method - delete', () => {
    it('delete data from infoDB', async () => {
      const key = await info.add('media-item', mediaItemData1);
      await info.delete('media-item', key);
      const result = await info.getValueByKey('media-item', key);
      expect(result).to.be.undefined;
    });
  });
  describe('method - clear', () => {
    it('clear all data from infoDB - media-item', async () => {
      const key1 = await info.add('media-item', mediaItemData1);
      const key2 = await info.add('media-item', mediaItemData2);
      const result1 = await info.getValueByKey('media-item', key1);
      const result2 = await info.getValueByKey('media-item', key2);
      expect(result1).not.to.be.undefined;
      expect(result2).not.to.be.undefined;

      await info.clear('media-item');
      const results = info.getAll('media-item');
      expect(results).to.be.empty;
    });
  });
  describe('method - getAll', () => {
    it('get all data from infoDB - media-item', async () => {
      await info.clear('media-item');
      let results = await info.getAll('media-item');
      expect(results).to.be.empty;

      const key1 = await info.add('media-item', mediaItemData1);
      const key2 = await info.add('media-item', mediaItemData2);
      results = await info.getAll('media-item');
      const expectResults = [
        { ...mediaItemData1, videoId: key1 },
        { ...mediaItemData2, videoId: key2 },
      ];
      expect(results).to.deep.equal(expectResults);
    });
  });
  describe('method - getValueByKey', () => {
    it('get data from infoDB', async () => {
      const key = await info.add('recent-played', playlistItemData1);
      const result = await info.getValueByKey('recent-played', key);
      expect(result).to.deep.equal({ ...playlistItemData1, id: key });
    });
  });
  describe('method - getValueByIndex', () => {
    it('get playlistItem by lastOpened', async () => {
      const key = await info.add('recent-played', playlistItemData1);
      await info.add('recent-played', playlistItemData2);
      const result = await info.getValueByIndex('recent-played', 'lastOpened', playlistItemData1.lastOpened);
      expect(result).to.deep.equal({ ...playlistItemData1, id: key });
    });
  });
  describe('method - getAllValueByIndex', () => {
    it('get All media-item that had no source', async () => {
      const key1 = await info.add('media-item', mediaItemData1);
      const key2 = await info.add('media-item', mediaItemData2);
      const results = await info.getAllValueByIndex('media-item', 'source', '');
      const expectResults = [
        { ...mediaItemData1, videoId: key1 },
        { ...mediaItemData2, videoId: key2 },
      ];
      expect(results).to.deep.equal(expectResults);
    });
  });
});
