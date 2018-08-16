<template>
  <span>{{ currentIndex }}</span>
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
    currentIndex: Number,
  },
  data() {
    return {
      thumbnailMap: new Map(),
      tempThumbnailArray: [],
    };
  },
  watch: {
    autoGenerationIndex(newValue, oldValue) {
      const thumbnailCount = newValue - oldValue;
      const startIndex = oldValue;
      this.getThumbnail(startIndex, thumbnailCount).then((result) => {
        this.$once('image-all-get', () => {
          this.arrayToMap(result);
        });
      });
    },
  },
  methods: {
    async getThumbnail(startIndex, thumbnailCount) {
      const objectStoreName = `thumbnail-width-${this.maxThumbnailWidth}`;
      let result = [];
      if (thumbnailCount === 1) {
        const object = await idb.open(THUMBNAIL_DB_NAME).then((db) => {
          console.log(objectStoreName);
          const tx = db.transaction(objectStoreName, 'readonly');
          return tx.objectStore(objectStoreName).get(`${startIndex}-${this.quickHash}`);
        });
        result.push(Object.assign(
          {},
          { index: object.index },
          { image: object.imageBitmap },
        ));
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
                  { image: value.imageBitmap },
                ));
              });
            }
            cursor.continue();
          });
          return tx.complete;
        }).then(() => {
          console.log(`${thumbnailCount} images get!`);
          this.$emit('image-all-get');
        });
      }
      return result;
    },
    arrayToMap(array) {
      array.forEach((thumbnail) => {
        this.thumbnailMap.set(thumbnail.index, thumbnail.image);
      });
      console.log(this.thumbnailMap);
    },
  },
  created() {
    this.getThumbnail(0, this.autoGenerationIndex).then((result) => {
      this.$once('image-all-get', () => {
        this.arrayToMap(result);
      });
    });
  },
};
</script>
