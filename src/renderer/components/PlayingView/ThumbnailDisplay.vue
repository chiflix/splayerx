<template>
  <div
    :data-component-name="$options.name"
    class="thumbnail-display">
    <base-image-display
      v-if="imageReady"
      :imgSrc="image"
      :width="thumbnailWidth"
      :height="thumbnailHeight" />
  </div>
</template>
<script>
import { THUMBNAIL_DB_NAME } from '@/constants';
import idb from 'idb';
import BaseImageDisplay from './BaseImageDisplay';
export default {
  name: 'thumbnail-display',
  components: {
    'base-image-display': BaseImageDisplay,
  },
  props: {
    quickHash: String,
    autoGenerationIndex: {
      type: Number,
      validator: value => value > 0,
    },
    maxThumbnailWidth: Number,
    currentIndex: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
  },
  data() {
    return {
      thumbnailMap: new Map(),
      tempThumbnailArray: [],
      image: null,
      imageReady: false,
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
    currentIndex(newValue) {
      if (this.thumbnailMap.has(newValue)) {
        this.image = this.thumbnailMap.get(newValue);
      } else {
        this.$once('image-all-get', () => {
          if (this.thumbnailMap.has(newValue)) {
            this.image = this.thumbnailMap.get(newValue);
          }
        });
      }
    },
  },
  methods: {
    async getThumbnail(startIndex, thumbnailCount) {
      const objectStoreName = `thumbnail-width-${this.maxThumbnailWidth}`;
      let result = [];
      if (thumbnailCount === 1) {
        const object = await idb.open(THUMBNAIL_DB_NAME).then((db) => {
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
          this.$emit('image-all-get');
          this.$bus.$emit('image-all-get', startIndex + thumbnailCount);
        });
      }
      return result;
    },
    arrayToMap(array) {
      array.forEach((thumbnail) => {
        this.thumbnailMap.set(thumbnail.index, thumbnail.image);
      });
    },
  },
  created() {
    this.imageReady = false;
    this.getThumbnail(0, this.autoGenerationIndex).then((result) => {
      this.$once('image-all-get', () => {
        this.arrayToMap(result);
        this.image = this.thumbnailMap.get(this.currentIndex);
        this.imageReady = true;
      });
    });
  },
};
</script>
