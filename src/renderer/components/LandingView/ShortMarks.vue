<template>
  <div class="short-marks" :style="{ right: isDarwin ? '15px' : '', left: isDarwin ? '' : '15px' }">
    <div class="marks-details" v-show="showMarks" :style="{ order: isDarwin ? '1' : '2' }">
      <div class="marks-container" v-for="(item, index) in marks" @mouseover="marksMouseOver(index)" @mouseleave="marksMouseLeave()"
      @mouseup="handleBrowsingOpen(item)"
      :style="{
        background: markHoverIndex === index ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)',
        color: markHoverIndex === index ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)'
      }">
        <Icon :type="item.type" class="marks-icon" :style="{
          opacity: markHoverIndex === index ? '1' : 'calc(4 / 9)'
        }"/>
        <p>{{ item.name }}</p>
      </div>
    </div>
    <Icon :type="showMarksType" class="display-marks" @mouseup.native="handleMarksDisplay" :style="{
      order: isDarwin ? '2' : '1',
      margin: isDarwin ? 'auto 0 auto 10px' : 'auto 0 auto 0'
    }"></Icon>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { Browsing as browsingActions } from '@/store/actionTypes';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'ShortMarks',
  components: { Icon },
  data() {
    return {
      marks: [
        { name: '优酷', type: 'youku', url: 'https://www.youku.com' },
        { name: 'Bilibili', type: 'bilibili', url: 'https://www.bilibili.com' },
        { name: 'YouTube', type: 'youtube', url: 'https://www.youtube.com' },
      ],
      markHoverIndex: -1,
      showMarks: false,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    showMarksType() {
      if (this.isDarwin) {
        return this.showFavicon ? 'hideMarks' : 'showMarks';
      }
      return this.showFavicon ? 'showMarks' : 'hideMarks';
    },
  },
  methods: {
    ...mapActions({
      updateInitialUrl: browsingActions.UPDATE_INITIAL_URL,
    }),
    marksMouseOver(index) {
      this.markHoverIndex = index;
    },
    marksMouseLeave() {
      this.markHoverIndex = -1;
    },
    handleMarksDisplay() {
      this.showMarks = !this.showMarks;
    },
    handleBrowsingOpen(item) {
      this.updateInitialUrl(item.url);
      this.$router.push({
        name: 'browsing-view',
      });
    },
  },
};
</script>

<style scoped lang="scss">
.short-marks {
  width: auto;
  height: 26px;
  display: flex;
  position: absolute;
  top: 8px;
  z-index: 6;
  .marks-details {
    display: flex;
    width: auto;
    height: 26px;
    .marks-container {
      width: auto;
      height: 100%;
      display: flex;
      margin-left: 10px;
      border-radius: 13px;
      p {
        font-size: 13px;
        margin: auto 10px auto 0;
      }
      .marks-icon {
        margin: auto 5px auto 10px;
        width: 20px;
        height: 20px;
      }
    }
  }
  .display-marks {
    z-index: 6;
    width: 18px;
    height: 18px;
  }
}
</style>
