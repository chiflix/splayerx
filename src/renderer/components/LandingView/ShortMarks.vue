<template>
  <div
    :style="{ right: isDarwin ? '15px' : '', left: isDarwin ? '' : '15px' }"
    class="short-marks no-drag"
  >
    <div
      ref="marksDetail"
      :class="marksAnimClass"
      @animationend="handleMarksAnimEnd"
      :style="{ order: isDarwin ? '1' : '2' }"
      class="marks-details"
    >
      <div
        v-for="(item, index) in marks"
        @mouseover="marksMouseOver(index)"
        @mouseleave="marksMouseLeave()"
        @mouseup="handleBrowsingOpen(item)"
        :style="{
          background: markHoverIndex === index ?
            'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)',
          color: markHoverIndex === index ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
        }"
        class="marks-container"
      >
        <Icon
          :type="item.type"
          :style="{
            opacity: markHoverIndex === index ? '1' : 'calc(4 / 9)'
          }"
          class="marks-icon"
        />
        <p>{{ item.name }}</p>
      </div>
    </div>
    <Icon
      @mouseup.native="handleMarksDisplay"
      :style="{
        order: isDarwin ? '2' : '1',
        margin: isDarwin ? 'auto 0 auto 10px' : 'auto 0 auto 0',
        transform: `rotate(${rotateNum}deg)`,
        transition: 'transform 100ms linear'
      }"
      type="showMarks"
      class="display-marks"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
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
    ...mapGetters(['browsingSize']),
    marksAnimClass() {
      if (this.isDarwin) {
        return this.showMarks ? 'marks-show-animation' : 'marks-hide-animation';
      }
      return this.showMarks ? 'win-marks-show-animation' : 'win-marks-hide-animation';
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
    rotateNum() {
      if (this.isDarwin) {
        return this.showMarks ? 180 : 0;
      }
      return this.showMarks ? 0 : 180;
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
      if (!this.showMarks) {
        this.$refs.marksDetail.style.display = 'flex';
      }
      this.showMarks = !this.showMarks;
    },
    handleBrowsingOpen(item) {
      this.$electron.ipcRenderer.send('add-browsingView', { size: this.browsingSize, url: item.url });
    },
    handleMarksAnimEnd(e) {
      if (e.target.classList.contains('marks-hide-animation') || e.target.classList.contains('win-marks-hide-animation')) {
        this.$refs.marksDetail.style.display = 'none';
      }
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
    display: none;
    width: auto;
    height: 26px;
    .marks-container {
      width: auto;
      height: 100%;
      display: flex;
      margin-left: 10px;
      border-radius: 13px;
      cursor: pointer;
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
    cursor: pointer;
  }
}
.marks-show-animation {
  animation: marks-show 100ms linear 1 normal forwards;
}
.marks-hide-animation {
  animation: marks-hide 100ms linear 1 normal forwards;
}
@keyframes marks-show {
  0% { transform: translateX(43px); opacity: 0 }
  50% { transform: translateX(21.5px); opacity: 0.5 }
  100% { transform: translateX(0); opacity: 1 }
}
@keyframes marks-hide {
  0% { transform: translateX(0); opacity: 1 }
  50% { transform: translateX(21.5px); opacity: 0.5 }
  100% { transform: translateX(43px); opacity: 0 }
}

.win-marks-show-animation {
  animation: win-marks-show 100ms linear 1 normal forwards;
}
.win-marks-hide-animation {
  animation: win-marks-hide 100ms linear 1 normal forwards;
}
@keyframes win-marks-show {
  0% { transform: translateX(-43px); opacity: 0 }
  50% { transform: translateX(-21.5px); opacity: 0.5 }
  100% { transform: translateX(0); opacity: 1 }
}
@keyframes win-marks-hide {
  0% { transform: translateX(0); opacity: 1 }
  50% { transform: translateX(-21.5px); opacity: 0.5 }
  100% { transform: translateX(-43px); opacity: 0 }
}
</style>
