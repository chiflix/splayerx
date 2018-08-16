<template>
  <span>hhh</span>
</template>
<script>
import { THUMBNAIL_DB_NAME } from '@/constants';
import idb from 'idb';
export default {
  name: 'thumbnail-display',
  props: {
    quickHash: String,
    autoGenerationIndex: {
      type: Number,
      validator: value => value > 0,
    },
    maxThumbnailWidth: Number,
  },
  watch: {
    autoGenerationIndex(newValue, oldValue) {
      console.log('[ThumbnailDisplay]:', newValue, oldValue);
    },
  },
  methods: {
    async getThumbnail(startIndex, thumbnailCount) {
      const objectStoreName = `thumbnail-width-${this.maxThumbnailWidth}`;
      let result;
      if (thumbnailCount === 1) {
        const object = await idb.open(THUMBNAIL_DB_NAME).then((db) => {
          console.log(objectStoreName);
          const tx = db.transaction(objectStoreName, 'readonly');
          return tx.objectStore(objectStoreName).get(`${startIndex}-${this.quickHash}`);
        });
        result = Object.assign(
          {},
          { index: object.index },
          { imageBitmap: object.imageBitmap },
        );
      } else {
        result = [];
        idb.open(THUMBNAIL_DB_NAME).then((db) => {
          const hashRange = IDBKeyRange.only(this.quickHash);
          const numRegex = new RegExp(/^(\d+)/);
          const tx = db.transaction(objectStoreName, 'readonly');
          const store = tx.objectStore(objectStoreName);
          store.index('quickHash').iterateKeyCursor(hashRange, (cursor) => {
            if (!cursor) return;
            const { primaryKey } = cursor;
            const index = parseInt(primaryKey.match(numRegex)[0], 10);
            if (index >= startIndex && index < startIndex + thumbnailCount) {
              store.get(primaryKey).then((value) => {
                result.push(Object.assign(
                  {},
                  { index: value.index },
                  { imageBitmap: value.imageBitmap },
                ));
              });
            }
            cursor.continue();
          });
          return tx.complete;
        });
      }
      return result;
    },
  },
  created() {
    this.getThumbnail(0, this.autoGenerationIndex).then((result) => {
      console.log(result);
    });
  },
};
</script>
