
class InfoDB {
  constructor() {
    const req = indexedDB.open('Info');
    this.data = [];
    req.onsuccess = () => {
      this.db = req.result;
      console.log('initDb DONE');
    };
    req.onerror = (evt) => {
      console.error('initDb:', evt.target.errorCode);
    };

    req.onupgradeneeded = (evt) => {
      console.log('initDb.onupgradeneeded');
      const store = evt.target.result.createObjectStore('recent-played', { keyPath: 'quickHash' });

      store.createIndex('lastOpened', 'lastOpened', { unique: false });
    };
  }

  get() {
    if (!indexedDB) {
      console.log('doesn\'t support indexedDB');
    }
    if (this.db) {
      const req = this.db.transaction('recent-played', 'readwrite').objectStore('recent-played').getAll();
      req.onsuccess = () => {
        this.data = req.result;
      };
    }
  }

  set(data) {
    this.get();
    if (!indexedDB) {
      console.log('doesn\'t support indexedDB');
    }
    console.log('invoked');
    if (this.db) {
      this.db.transaction('recent-played', 'readwrite').objectStore('recent-played').put(data);
    }
  }
}

export default new InfoDB();
