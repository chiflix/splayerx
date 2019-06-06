import { INFO_DATABASE_NAME, DATADB_NAME } from '@/constants';
import DataBase from '@/libs/DataBase';
import { InfoDB } from '@/helpers/infoDB';
import { DataDb } from '@/helpers/dataDb';

describe('DataBase', () => {
  const database = new DataBase();
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
  const subtitleData1 = {
    format: 'a',
    language: 'b',
    src: 'c',
    type: 'd',
  };
  const subtitleData2 = {
    format: 'c',
    language: 'b',
    src: 'a',
    type: 'd',
  };

  beforeEach(async () => {
    await database.clear(INFO_DATABASE_NAME, 'recent-played');
    await database.clear(INFO_DATABASE_NAME, 'media-item');
    await database.clear(DATADB_NAME, 'subtitles');
  });

  describe('method - getDB', () => {
    it('get infoDB', () => {
      database.getDB(INFO_DATABASE_NAME);
      expect(database.db).to.be.an.instanceof(InfoDB);
      expect(database.currentDB).to.equal(INFO_DATABASE_NAME);
    });
    it('get dataDb', () => {
      database.getDB(DATADB_NAME);
      expect(database.db).to.be.an.instanceof(DataDb);
      expect(database.currentDB).to.equal(DATADB_NAME);
    });
    it('get wrong DB', () => {
      const wrongName = 'wrong database name';
      expect(() => { database.getDB(wrongName); }).to.throw(Error, 'Wrong Database Name');
    });
  });
  describe('method - add', () => {
    it('add to infoDB', async () => {
      const key = await database.add(INFO_DATABASE_NAME, 'media-item', mediaItemData1);
      const result = await database.getValueByKey(INFO_DATABASE_NAME, 'media-item', key);
      expect(result).to.deep.equal({ ...mediaItemData1, videoId: key });
    });
    it('add to dataDb', async () => {
      const key = await database.add(DATADB_NAME, 'subtitles', subtitleData1);
      const result = await database.getValueByKey(DATADB_NAME, 'subtitles', key);
      expect(result).to.deep.equal(subtitleData1);
    });
  });
  describe('method - update', () => {
    it('update to infoDB', async () => {
      const key = await database.add(INFO_DATABASE_NAME, 'media-item', mediaItemData1);
      const updateKey = await database.update(INFO_DATABASE_NAME, 'media-item', key, { ...mediaItemData2, videoId: key });
      const result = await database.getValueByKey(INFO_DATABASE_NAME, 'media-item', key);
      expect(result).to.deep.equal({ ...mediaItemData2, videoId: key });
      expect(key).to.equal(updateKey);
    });
    it('update to dataDb', async () => {
      const key = await database.add(DATADB_NAME, 'subtitles', subtitleData1);
      const updateKey = await database.update(DATADB_NAME, 'subtitles', key, subtitleData2);
      const result = await database.getValueByKey(DATADB_NAME, 'subtitles', key);
      expect(result).to.deep.equal(subtitleData2);
      expect(key).to.equal(updateKey);
    });
  });
  describe('method - delete', () => {
    it('delete data from infoDB', async () => {
      const key = await database.add(INFO_DATABASE_NAME, 'media-item', mediaItemData1);
      await database.delete(INFO_DATABASE_NAME, 'media-item', key);
      const result = await database.getValueByKey(INFO_DATABASE_NAME, 'media-item', key);
      expect(result).to.be.undefined;
    });
    it('delete data from dataDb', async () => {
      const key = await database.add(DATADB_NAME, 'subtitles', subtitleData1);
      await database.delete(DATADB_NAME, 'subtitles', key);
      const result = await database.getValueByKey(DATADB_NAME, 'subtitles', key);
      expect(result).to.be.undefined;
    });
  });
  describe('method - clear', () => {
    it('clear all data from infoDB - media-item', async () => {
      const key1 = await database.add(INFO_DATABASE_NAME, 'media-item', mediaItemData1);
      const key2 = await database.add(INFO_DATABASE_NAME, 'media-item', mediaItemData2);
      const result1 = await database.getValueByKey(INFO_DATABASE_NAME, 'media-item', key1);
      const result2 = await database.getValueByKey(INFO_DATABASE_NAME, 'media-item', key2);
      expect(result1).not.to.be.undefined;
      expect(result2).not.to.be.undefined;

      await database.clear(INFO_DATABASE_NAME, 'media-item');
      const results = database.getAll(INFO_DATABASE_NAME, 'media-item');
      expect(results).to.be.empty;
    });
    it('clear all data from dataDb - subtitles', async () => {
      const key1 = await database.add(DATADB_NAME, 'subtitles', subtitleData1);
      const key2 = await database.add(DATADB_NAME, 'subtitles', subtitleData2);
      const result1 = await database.getValueByKey(DATADB_NAME, 'subtitles', key1);
      const result2 = await database.getValueByKey(DATADB_NAME, 'subtitles', key2);
      expect(result1).not.to.be.undefined;
      expect(result2).not.to.be.undefined;

      await database.clear(DATADB_NAME, 'subtitles');
      const results = database.getAll(DATADB_NAME, 'subtitles');
      expect(results).to.be.empty;
    });
  });
  describe('method - getAll', () => {
    it('get all data from infoDB - media-item', async () => {
      await database.clear(INFO_DATABASE_NAME, 'media-item');
      let results = await database.getAll(INFO_DATABASE_NAME, 'media-item');
      expect(results).to.be.empty;

      const key1 = await database.add(INFO_DATABASE_NAME, 'media-item', mediaItemData1);
      const key2 = await database.add(INFO_DATABASE_NAME, 'media-item', mediaItemData2);
      results = await database.getAll(INFO_DATABASE_NAME, 'media-item');
      const expectResults = [
        { ...mediaItemData1, videoId: key1 },
        { ...mediaItemData2, videoId: key2 },
      ];
      expect(results).to.deep.equal(expectResults);
    });
    it('get all data from dataDb - subtitles', async () => {
      await database.clear(DATADB_NAME, 'subtitles');
      let results = await database.getAll(DATADB_NAME, 'subtitles');
      expect(results).to.be.empty;

      await database.add(DATADB_NAME, 'subtitles', subtitleData1);
      await database.add(DATADB_NAME, 'subtitles', subtitleData2);
      results = await database.getAll(DATADB_NAME, 'subtitles');
      const expectResults = [
        subtitleData1,
        subtitleData2,
      ];
      expect(results).to.deep.equal(expectResults);
    });
  });
  describe('method - getValueByKey', () => {
    it('get data from infoDB', async () => {
      const key = await database.add(INFO_DATABASE_NAME, 'recent-played', playlistItemData1);
      const result = await database.getValueByKey(INFO_DATABASE_NAME, 'recent-played', key);
      expect(result).to.deep.equal({ ...playlistItemData1, id: key });
    });
    it('get data from dataDb', async () => {
      const key = await database.add(DATADB_NAME, 'subtitles', subtitleData1);
      const result = await database.getValueByKey(DATADB_NAME, 'subtitles', key);
      expect(result).to.deep.equal(subtitleData1);
    });
  });
  describe('method - getValueByIndex', () => {
    it('get playlistItem by lastOpened', async () => {
      const key = await database.add(INFO_DATABASE_NAME, 'recent-played', playlistItemData1);
      await database.add(INFO_DATABASE_NAME, 'recent-played', playlistItemData2);
      const result = await database.getValueByIndex(INFO_DATABASE_NAME, 'recent-played', 'lastOpened', playlistItemData1.lastOpened);
      expect(result).to.deep.equal({ ...playlistItemData1, id: key });
    });
    it('get subtitleItem by format', async () => {
      await database.add(DATADB_NAME, 'subtitles', subtitleData1);
      await database.add(DATADB_NAME, 'subtitles', subtitleData2);
      const result = await database.getValueByIndex(DATADB_NAME, 'subtitles', 'format', subtitleData1.format);
      expect(result).to.deep.equal(subtitleData1);
    });
  });
  describe('method - getAllValueByIndex', () => {
    it('get All media-item that had no source', async () => {
      const key1 = await database.add(INFO_DATABASE_NAME, 'media-item', mediaItemData1);
      const key2 = await database.add(INFO_DATABASE_NAME, 'media-item', mediaItemData2);
      const results = await database.getAllValueByIndex(INFO_DATABASE_NAME, 'media-item', 'source', '');
      const expectResults = [
        { ...mediaItemData1, videoId: key1 },
        { ...mediaItemData2, videoId: key2 },
      ];
      expect(results).to.deep.equal(expectResults);
    });
    it('get All subtitles that language equal to b', async () => {
      await database.add(DATADB_NAME, 'subtitles', subtitleData1);
      await database.add(DATADB_NAME, 'subtitles', subtitleData2);
      const results = await database.getAllValueByIndex(DATADB_NAME, 'subtitles', 'language', 'b');
      const expectResults = [
        subtitleData1,
        subtitleData2,
      ];
      expect(results).to.deep.equal(expectResults);
    });
  });
});

