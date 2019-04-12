<template>
  <div class="browsing-control">
    <div class="pages-control">
      <Icon type="back" class="back-icon"></Icon>
      <Icon type="forward" class="forward-icon"></Icon>
      <Icon type="pageRefresh" class="page-refresh-icon"></Icon>
    </div>
    <div class="link-input" :style="{
      background: addressToInput ? 'rgba(0, 0, 0, 0.2)' : '',
      borderRight: addressToInput ? '' : '0.6px solid rgba(0, 0, 0, 0.2)',
      borderLeft: addressToInput ? '' : '0.6px solid rgba(0, 0, 0, 0.2)',
      borderRadius: addressToInput ? '2.5px' : '',
    }">
      <Icon type="starActive" class="collection-star"></Icon>
      <div class="address-show" v-show="!addressToInput" @mousedown="handleUrlInput">
        <p>{{ address }}</p>
      </div>
      <input class="address-input" ref="urlInput" v-model="address" @blur="handleInputBlur" v-show="addressToInput" @keypress="handleEnterKey">
    </div>
    <div class="address-marks">
      <div class="marks-margin">
        <div v-for="(item, index) in marksToShow" class="marks-container" @mouseup="handleMarksMouseup(index)" :style="{
          background: index === selectedMarks ? 'rgba(255, 255, 255, 0.5)' : '',
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
      address: 'https://www.youtube.com',
      addressToInput: false,
    };
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
    handleEnterKey(e) {
      if (e.key === 'Enter') {
        this.$bus.$emit('search-with-url', this.address);
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
    .collection-star {
      margin: 6px 5px 6px 6px;
    }
    .address-input {
      flex: 1;
      margin: auto 10px auto 0;
      height: 16px;
      border: none;
      outline: none;
      background: rgba(255, 255, 255, 0.2);
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
