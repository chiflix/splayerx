
import idb from 'idb';

class InfoDB {
  constructor() {
    idb.open('Info', 1, (upgradeDB) => {
      upgradeDB.createObjectStore('recent-played', { keyPath: 'quickHash' });
    }).then((db) => {
      const tx = db.transaction('recent-played', 'readonly');
      this.data = tx.objectStore('recent-played').getAll();
      return tx.complete;
    }).then((allVal) => {
      console.log(`infoData = ${allVal}`);
    });
  }

  set(data) {
    idb.open('Info').then(async (db) => {
      const tx = db.transaction('recent-played', 'readwrite');
      const store = tx.objectStore('recent-played');
      await store.put(data);
      this.data = store.getAll();
      return tx.complete;
    });
  }
}

export default InfoDB;
