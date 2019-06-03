import { createSandBox } from 'sinon';
import { INFO_DATABASE_NAME, DATADB_NAME } from '@/constants';
import DataBase from '@/libs/DataBase';
import { InfoDB } from '@/helpers/infoDB';
import { DataDb } from '@/helpers/dataDb';

describe.only('DataBase libs', () => {
  describe('method - getDB', () => {
    const database = new DataBase();
    it('get infoDB', () => {
      database.getDB(INFO_DATABASE_NAME);
      expect(database.db).to.be.an.instanceof(InfoDB);
      expect(database.currentDB).to.equal(INFO_DATABASE_NAME);
    });
    it('get dataDB', () => {
      database.getDB(DATADB_NAME);
      expect(database.db).to.be.an.instanceof(DataDb);
      expect(database.currentDB).to.equal(DATADB_NAME);
    });
    it('get wrong DB', () => {
      const wrongName = 'wrong database name';
      expect(() => { database.getDB(wrongName); }).to.throw(Error, 'Wrong Database Name');
    });
  });
  describe.only('method - add', () => {
    let sandbox; 
    beforeEach(() => {
      sandbox = createSandBox();
    });
    afterEach(() => {
      sandbox.restore();
    });
    describe('add to infoDB', () => {

    });

  });
  describe('method - update', () => {

  });
  describe('method - delete', () => {

  });
  describe('method - getAll', () => {

  });
  describe('method - getValueByKey', () => {

  });
  describe('method - getValueByIndex', () => {

  });
  describe('method - getAllValueByIndex', () => {

  });
});

