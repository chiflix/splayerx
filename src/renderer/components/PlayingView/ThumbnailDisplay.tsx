import { mapGetters } from 'vuex';
import Vue, { CreateElement } from 'vue';
import { Component, Prop } from 'vue-property-decorator'
import {
  Getter,
} from 'vuex-class';
import { filePathToUrl } from '@/helpers/path';
import thumbnailService from '@/services/media/thumbnailService'

@Component({
  props: {
    currentTime: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
  },
  computed: {
    ...mapGetters(['originSrc', 'duration', 'mediaHash'])
  },
  watch: {
    currentTime(val: number) {
      this.currentIndex = Math.abs(Math.floor(val / (this.duration / this.thumbnailCount)));
    },
    originSrc() {
      this.isSaved = false;
      this.imgExisted = false;
      this.imgSrc = '';
    },
  },
})
export default class ThumbnailDisplay extends Vue {
  currentIndex: number = 0
  thumbnailCount: number = 0
  isSaved: boolean = false
  imgExisted: boolean = false
  imgSrc: string = ''
  @Prop(Number) readonly currentTime!: number
  @Prop(Number) readonly thumbnailWidth!: number
  @Prop(Number) readonly thumbnailHeight!: number
  @Getter('originSrc') originSrc: string
  @Getter('duration') duration: number
  @Getter('mediaHash') mediaHash: string
  get backPos() {
    const index = this.currentIndex;
    const column = index === 0 ? 0 : Math.ceil(index / 10) - 1;
    const row = index - (10 * column);
    return `-${row * 100}% -${column * 100}%`;
  }
  get backSize() {
    return `1000% ${Math.ceil(this.thumbnailCount / 10) * 100}%`;
  }
  get src() {
    return this.imgExisted || this.isSaved ? `url("${filePathToUrl(this.imgSrc)}")` : '';
  }
  render(h: CreateElement) {
    // const style = `width: ${this.thumbnailWidth}px`;
    return <div class="thumbnail-display"><div style={{ width: `${this.thumbnailWidth}px` }}></div></div>
  }
  mounted() {
    this.$bus.$on('set-thumbnail-src', (src: string) => {
      if (src === this.originSrc) {
        this.isSaved = true;
      }
    });
    this.$bus.$on('generate-thumbnails', async (num: number) => {
      // try {
      //   this.imgSrc = await thumbnailService.getImage(this.mediaHash, this.originSrc, num);;
      // } catch (err) {
      // }

    });
  }
}

/**
 * @description ThumbnailDisplay UI组件抽象的接口
 * @author tanghaixiang@xindong.com
 * @date 2019-05-20
 * @export
 * @interface ThumbnailRequest
 */
export interface ThumbnailRequest {
  getImage(mediaHash: string): Promise<string | null>
  generateImage(mediaHash: string, videoSrc: string, cols: number): Promise<string>
}