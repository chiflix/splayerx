<template>
  <div
    :style="{
      left: canvasRect.x + 'px',
      top: canvasRect.y + 'px',
      width: canvasRect.width + 'px',
      height: canvasRect.height + 'px',
    }"
    class="subtitle-image-renderer"
  />
</template>
<script lang="ts">
import Vue from 'vue';
import { isEqual, pick } from 'lodash';
import { mapGetters } from 'vuex';
import { ImageCue } from '../interfaces/ISubtitle';
import { isValidNumber } from '../plugins/input/helpers/validators';

export default Vue.extend({
  props: {
    currentCues: {
      type: Array,
      default: () => [],
    },
    metadata: {
      type: String,
      default: 'size: 1920x1080',
    },
    windowWidth: {
      type: Number,
      default: 1920,
    },
    windowHeight: {
      type: Number,
      default: 1080,
    },
  },
  data() {
    return {
      needUpdateCues: false,
      lastCanvasSize: { width: 1920, height: 1080 },
      imageUrls: new Map(),
      lastCues: [],
    };
  },
  computed: {
    canvasSize() {
      const matchedResult = (this.metadata as string).match(/size: (\d+)x(\d+)/);
      if (matchedResult) return { width: matchedResult[1], height: matchedResult[2] };
      return { ...this.lastCanvasSize };
    },
    canvasRect() {
      const windowRatio = this.windowWidth / this.windowHeight;
      const canvasRatio = this.canvasSize.width / this.canvasSize.height;
      const convertedCanvasWidth = windowRatio > canvasRatio
        ? Math.floor(this.canvasSize.width * (this.windowHeight / this.canvasSize.height))
        : Math.floor(this.windowWidth);
      const convertedCanvasHeight = windowRatio > canvasRatio
        ? Math.floor(this.windowHeight)
        : Math.floor(this.canvasSize.height * (this.windowWidth / this.canvasSize.width));
      return {
        x: windowRatio > canvasRatio
          ? Math.floor((this.windowWidth - convertedCanvasWidth) / 2) : 0,
        y: windowRatio > canvasRatio
          ? 0 : Math.floor((this.windowHeight - convertedCanvasHeight) / 2),
        width: convertedCanvasWidth,
        height: convertedCanvasHeight,
      };
    },
    ...mapGetters(['duration', 'mediaHash']),
    maxCueInterval() {
      if (!isValidNumber(this.duration)) return 100;
      return Math.min(100, this.duration / 20);
    },
    currentImageCues() {
      return this.currentCues
        .filter((cue: ImageCue) => cue.payload && cue.end - cue.start < this.maxCueInterval);
    },
    imageRatio() {
      const windowRatio = this.windowWidth / this.windowHeight;
      const canvasRatio = this.canvasSize.width / this.canvasSize.height;
      return windowRatio > canvasRatio
        ? this.windowHeight / this.canvasSize.height
        : this.windowWidth / this.canvasSize.width;
    },
  },
  watch: {
    canvasSize(newVal: { width: number, height: number }) {
      this.lastCanvasSize.width = newVal.width;
      this.lastCanvasSize.height = newVal.height;
    },
    currentImageCues(newVal: ImageCue[], oldVal: ImageCue[]) {
      if (!this.areEqualCues(newVal, oldVal)) this.needUpdateCues = true;
    },
    canvasRect() { this.needUpdateCues = true; },
    needUpdateCues(newVal: boolean) {
      if (newVal) {
        (this.$el as HTMLDivElement).childNodes.forEach(node => this.$el.removeChild(node));
        this.currentImageCues.forEach(this.drawImage);
        this.needUpdateCues = false;
        this.lastCues = this.currentImageCues;
      }
    },
    mediaHash() {
      (this.$el as HTMLDivElement).childNodes.forEach(node => this.$el.removeChild(node));
      (this.imageUrls as Map<string, string>).forEach(url => URL.revokeObjectURL(url));
      (this.imageUrls as Map<string, string>).clear();
    },
  },
  methods: {
    drawImage(image: ImageCue) {
      const {
        start, end, position: p, payload,
      } = image;
      const id = `${this.mediaHash}-${start}-${end}-${p.x}-${p.y}`;
      const newLeftValue = `${Math.floor(p.x * this.imageRatio)}px`;
      const newTopValue = `${Math.floor(p.y * this.imageRatio)}px`;
      const newWidthValue = Math.floor(p.width * this.imageRatio);
      const newHeightValue = Math.floor(p.height * this.imageRatio);
      if (document.getElementById(id)) {
        const imageElement = document.getElementById(id) as HTMLImageElement;
        imageElement.width = newWidthValue;
        imageElement.height = newHeightValue;
        imageElement.style.left = newLeftValue;
        imageElement.style.top = newTopValue;
      } else {
        if (!this.imageUrls.has(id)) {
          const blob = new Blob([payload], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          this.imageUrls.set(id, url);
        }
        if (this.imageUrls.has(id)) {
          const url = this.imageUrls.get(id);
          const imageElement = new Image();
          if (!document.getElementById(id)) {
            imageElement.src = url;
            imageElement.width = newWidthValue;
            imageElement.height = newHeightValue;
            imageElement.style.left = newLeftValue;
            imageElement.style.top = newTopValue;
            imageElement.id = id;
            this.$el.appendChild(imageElement);
          }
        }
      }
    },
    areEqualCues(cues1: ImageCue[], cues2: ImageCue[]) {
      return isEqual(
        cues1.map(cue => pick(cue, 'start', 'end', 'position')),
        cues2.map(cue => pick(cue, 'start', 'end', 'position')),
      );
    },
  },
});
</script>
<style lang="scss">
.subtitle-image-renderer {
  position: relative;
  & > img {
    position: absolute;
  }
}
</style>
