<template>
  <div class="browsing-control">
    <div class="pages-control">
      <Icon :type="backType" class="back-icon" @mouseup.native="handleUrlBack"></Icon>
      <Icon :type="forwardType" class="forward-icon" @mouseup.native="handleUrlForward"></Icon>
      <Icon type="pageRefresh" class="page-refresh-icon" @mouseup.native="handleUrlReload"></Icon>
    </div>
    <div class="link-input" :style="{
      background: addressToInput ? 'rgba(0, 0, 0, 0.2)' : '',
      borderRight: !addressToInput && marksToShow.length ? '0.6px solid rgba(0, 0, 0, 0.2)' : '0.6px solid rgba(0, 0, 0, 0)',
      borderLeft: addressToInput ? '0.6px solid rgba(0, 0, 0, 0)' : '0.6px solid rgba(0, 0, 0, 0.2)',
      borderRadius: addressToInput ? '2.5px' : '',
      width: `${inputWidth}px`,
    }">
      <Icon type="starActive" class="collection-star"></Icon>
      <div class="address-show" v-show="!addressToInput" @mousedown="handleUrlInput" :style="{ width: `${inputWidth}px` }">
        <p>{{ url }}</p>
      </div>
      <input class="address-input" ref="urlInput" v-model="url" @blur="handleInputBlur" v-show="addressToInput" @keypress="handleEnterKey" onfocus="select()">
    </div>
    <div class="address-marks" v-show="marksToShow.length">
      <div class="marks-margin">
        <div v-for="(item, index) in marksToShow" class="marks-container" @mouseup="handleMarksMouseup(index)" :style="{
          background: index === selectedMarks ? 'rgba(255, 255, 255, 0.5)' : '',
          cursor: 'pointer'
        }">
          <div class="marks-img">{{ item }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'BrowsingControl',
  data() {
    return {
      marks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      selectedMarks: -1,
      addressToInput: false,
      backType: 'back',
      forwardType: 'forward',
    };
  },
  props: {
    url: {
      type: String,
    },
  },
  computed: {
    ...mapGetters(['winWidth']),
    showMarksNum() {
      const marksWidth = process.platform === 'darwin' ? this.winWidth - 499 : this.winWidth - 523;
      if (marksWidth >= 60) {
        return Math.floor((marksWidth - 60) / 40) + 1;
      }
      return 0;
    },
    marksToShow() {
      if (this.marks.length > this.showMarksNum) {
        return this.marks.slice(this.marks.length - this.showMarksNum, this.marks.length);
      }
      return this.marks;
    },
    inputWidth() {
      return process.platform === 'darwin' ? this.winWidth - 336 - (this.showMarksNum * 40) : this.winWidth - 375 - (this.showMarksNum * 40);
    },
  },
  mounted() {
    this.$bus.$on('web-info', (info) => {
      this.backType = info.canGoBack ? 'back' : 'backDisabled';
      this.forwardType = info.canGoForward ? 'forward' : 'forwardDisabled';
    });
  },
  watch: {
    addressToInput(val) {
      if (val) {
        setTimeout(() => {
          this.$refs.urlInput.focus();
        }, 0);
      }
    },
  },
  components: {
    Icon,
  },
  methods: {
    handleUrlReload() {
      this.$bus.$emit('url-reload');
    },
    handleUrlBack() {
      this.$bus.$emit('url-back');
    },
    handleUrlForward() {
      this.$bus.$emit('url-forward');
    },
    handleEnterKey(e) {
      if (e.key === 'Enter') {
        this.$bus.$emit('search-with-url', this.url);
        this.addressToInput = false;
      }
    },
    handleMarksMouseup(index) {
      this.selectedMarks = index;
    },
    handleInputBlur() {
      this.addressToInput = false;
    },
    handleUrlInput() {
      if (!this.addressToInput) {
        this.addressToInput = true;
      }
    },
  },
};
</script>

<style scoped lang="scss">
::selection {
  background-color: rgba(255, 255, 255, 0.2);
}
.browsing-control {
  width: auto;
  height: 40px;
  display: flex;
  order: 1;
  .pages-control {
    display: flex;
    width: 93px;
    height: 40px;
    .back-icon {
      margin: 12px 10px 12px 0;
      cursor: pointer;
    }
    .forward-icon {
      margin: 12px 20px 12px 0;
      cursor: pointer;
    }
    .page-refresh-icon {
      margin: 12px 15px 12px 0;
      cursor: pointer;
    }
  }
  .link-input {
    min-width: 220px;
    height: 28px;
    margin: auto 0 auto 0;
    display: flex;
    flex: 1;
    width: auto;
    -webkit-app-region: no-drag;
    .collection-star {
      margin: 6px 5px 6px 6px;
    }
    .address-input {
      flex: 1;
      margin: auto 10px auto 0;
      height: 16px;
      border: none;
      outline: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      text-indent: 2px;
      font-family: $font-normal;
    }
    .address-show {
      flex: 1;
      margin: auto 10px auto 0;
      height: 16px;
      p {
        width: 100%;
        height: 100%;
        font-size: 13px;
        text-indent: 2px;
        line-height: 16px;
        color: rgba(255, 255, 255, 0.8);
        font-family: $font-normal;
        vertical-align: middle;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
  .address-marks {
    width: auto;
    height: 40px;
    .marks-margin {
      margin: 0 10px 0 10px;
      width: auto;
      height: 40px;
      display: flex;
      .marks-container {
        width: 40px;
        height: 40px;
        display: flex;
        .marks-img{
          width: 20px;
          height: 20px;
          margin: auto;
          border: 0.5px solid rgba(151, 151, 151, 1);
        }
      }
    }
  }
}
</style>
