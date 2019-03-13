<template>
  <div class="sub-editor no-drag"
    @mousedown.left.stop="handleDragStartEditor"
    @mousemove.left="handleDragingEditor"
    @mouseleave.left="handleDragEndEditor"
    @mouseup.left="handleDragEndEditor">
    <div class="sub-editor-head">
      <div class="sub-editor-time-line"
        ref="timeLine"
        @mouseup.left="handleMouseUpOnTimeLine"
        :style="{
          width: `${3 * winWidth}px`,
          left: `${currentLeft}px`
        }">
        <div class="scales" :style="{
          width: `${scales * space}px`
        }">
          <div v-for="(time) in times"
            :key="time"
            :class="'scale' + validityTime(time)"
            :style="{
              width: `${space}px`
            }">
            <i></i>
            <span>{{transcode(time)}}</span>
          </div>
        </div>
        <div class="subtitles" ref="subtitles">
          <div class="sub" v-for="(sub, i) in validitySubs"
            :key="`${i}-${sub.start}-${sub.end}`"
            @mousedown.left.stop="handleDragStartSub($event, sub)"
            @mousemove.left="handleDragingSub($event, sub)"
            @mouseup.left="handleDragEndSub($event, sub)"
            @dblclick.left="handleDoubleClickSub($event, sub)"
            :class="sub.focus ? 'focus' : ''"
            :style="{
              left: `${sub.left}px`,
              width: `${sub.width}px`,
            }">
            <i class="drag-left"></i>
            <i class="drag-right"></i>
          </div>
        </div>
      </div>
    </div>
    <div class="sub-editor-body">
      <subtitle-input
      :key="subtitleInstance.id"
      :showAddInput="showAddInput"
      :newSubHolder="newSubHolder"
      :currentSub="currentSub"
      :subtitleInstance="subtitleInstance"/>
    </div>
    <div class="sub-editor-foot">
      <div class="times-wrap">
        <div class="cont">
          <div class="timing">
            <span class="timeContent">{{transcode(preciseTime, 1)}}</span>
          </div>
        </div>
      </div>
      <the-progress-bar ref="progressbar" :showAllWidgets="true" />
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import { throttle } from 'lodash';
// import { videodata } from '@/store/video';
import TheProgressBar from '@/components/PlayingView/TheProgressBar.vue';
import SubtitleInput from './SubtitleInput.vue';
import SubtitleInstance from './SubtitleLoader/index';

export default {
  name: 'subtitle-editor',
  components: {
    'the-progress-bar': TheProgressBar,
    SubtitleInput,
  },
  data() {
    return {
      timeLineDraging: false,
      dragStartX: 0,
      dragStartLeft: 0,
      dragStartTime: 0,
      currentLeft: 0,
      currentTime: 0,
      preciseTime: 0,
      timeLineClickDelay: 300,
      timeLineClickTimestamp: 0,
      subDragMoving: false,
      subLeftDraging: false,
      subRightDraging: false,
      subDragStartX: 0,
      subDragElement: null,
      subDragCurrentSub: null,
      subDragTimeLineMoving: false,
      triggerCount: 1,
      space: 85,
      lastSubIndex: null,
      showAddInput: false,
      newSubHolder: null,
    };
  },
  props: {
    subtitleInstance: SubtitleInstance,
  },
  computed: {
    ...mapGetters([
      'winWidth', 'duration', 'paused',
    ]),
    scales() {
      return Math.ceil((3 * this.winWidth) / this.space);
    },
    offset() {
      return Math.ceil((3 * this.winWidth) / (this.space * 2));
    },
    type() {
      return this.subtitleInstance.metaInfo.format;
    },
    times() {
      return [...Array(this.scales).keys()]
        .map(e => (this.currentTime * 1) + ((e * 1) - this.offset));
    },
    validitySubs() {
      const filters = this.subtitleInstance.parsed.dialogues
        .filter((e) => {
          const isInRange = e.start >= (this.preciseTime - this.offset)
          && e.end <= (this.preciseTime + this.offset);
          const tags = e.fragments && e.fragments[0] && e.fragments[0].tags;
          const isOtherPos = this.type === 'ass' && tags && (tags.pos || tags.alignment !== 2);
          return isInRange && !isOtherPos;
        });
      return filters.map((e, i) => {
        const text = e.fragments && e.fragments[0] && e.fragments[0].text;
        const focus = e.start <= this.preciseTime && e.end >= this.preciseTime;
        let left = (e.start - this.times[0]) * this.space;
        let width = (e.end - e.start) * this.space;
        let minLeft = 0;
        let maxLeft = (this.winWidth * 3) - width;
        if (i !== 0) {
          const prevLeft = (filters[i - 1].start - this.times[0]) * this.space;
          const prevWidth = (filters[i - 1].end - filters[i - 1].start) * this.space;
          minLeft = prevLeft + prevWidth;
        }
        if (i !== (filters.length - 1)) {
          const nextLeft = (filters[i + 1].start - this.times[0]) * this.space;
          maxLeft = nextLeft - width;
        }
        left = parseFloat(left.toFixed(2), 10);
        width = parseFloat(width.toFixed(2), 10);
        minLeft = parseFloat(minLeft.toFixed(2), 10);
        maxLeft = parseFloat(maxLeft.toFixed(2), 10);
        return Object.assign({
          triggerCount: this.triggerCount,
        }, e, {
          originStart: e.start,
          originEnd: e.end,
          minLeft,
          maxLeft,
          left,
          width,
          originLeft: left,
          originWidth: width,
          text,
          focus,
        });
      });
    },
    currentSub() {
      const currentSub = this.parsedFragments(this.subtitleInstance.parsed.dialogues
        .find((e, i) => {
          const tags = e.fragments && e.fragments[0] && e.fragments[0].tags;
          const isOtherPos = this.type === 'ass' && tags && (tags.pos || tags.alignment !== 2);
          if (e.start <= this.preciseTime && e.end >= this.preciseTime && !isOtherPos) {
            this.lastSubIndex = i;
            return true;
          }
          return false;
        }));
      return currentSub;
    },
  },
  watch: {
    paused() {
      requestAnimationFrame(this.updateWhenPlaying);
      this.triggerCount += 1;
    },
    currentSub(val) {
      const len = this.subtitleInstance.parsed.dialogues.length;
      let insertIndex = this.lastSubIndex;
      if (!val && this.lastSubIndex && this.lastSubIndex < len) {
        let last = this.subtitleInstance.parsed.dialogues[this.lastSubIndex];
        if (this.preciseTime < last.start) {
          last = this.subtitleInstance.parsed.dialogues[this.lastSubIndex - 1];
          insertIndex = this.lastSubIndex - 1;
        }
        insertIndex += 1;
        this.showAddInput = (this.preciseTime - last.end) > 0.2;
        this.newSubHolder = {
          distance: this.preciseTime - last.end,
          preciseTime: this.preciseTime,
          last,
          insertIndex,
        };
      } else {
        this.showAddInput = false;
        this.newSubHolder = null;
      }
    },
    triggerCount() {
      const len = this.subtitleInstance.parsed.dialogues.length;
      let insertIndex = this.lastSubIndex;
      if (!this.currentSub && this.lastSubIndex && this.lastSubIndex < len) {
        let last = this.subtitleInstance.parsed.dialogues[this.lastSubIndex];
        if (this.preciseTime < last.start) {
          last = this.subtitleInstance.parsed.dialogues[this.lastSubIndex - 1];
          insertIndex = this.lastSubIndex - 1;
        }
        this.showAddInput = (this.preciseTime - last.end) > 0.2;
        insertIndex += 1;
        this.newSubHolder = {
          distance: this.preciseTime - last.end,
          preciseTime: this.preciseTime,
          last,
          insertIndex,
        };
      } else {
        this.showAddInput = false;
        this.newSubHolder = null;
      }
    },
  },
  created() {
  },
  mounted() {
    this.resetCurrentTime();
    this.$refs.progressbar && this.$refs.progressbar.updatePlayProgressBar(this.preciseTime);
    // init
    document.addEventListener('mousemove', this.handleDragingSub);
    document.addEventListener('mouseup', this.handleDragEndSub);
    // 接受seek事件，触发时间轴重新计算
    this.$bus.$on('seek', (e) => {
      if (!this.timeLineDraging) {
        this.preciseTime = e;
        this.currentTime = parseInt(e, 10);
        this.currentLeft = ((this.currentTime - e) * this.space) -
        ((this.offset * this.space) - (this.winWidth / 2));
      }
    });
    // 添加字幕条，需要先播放动画，在往字幕对象新增一条字幕
    this.$bus.$on('modified-subtitle-bridge', (obj) => {
      const sub = document.createElement('div');
      const attr = this.$refs.subtitles && this.$refs.subtitles.attributes[0];
      sub.setAttribute(attr.name, '');
      sub.className = 'sub focus';
      sub.style.left = `${(this.preciseTime - this.times[0]) * this.space}px`;
      sub.style.width = `${1}px`;
      this.$refs.subtitles && this.$refs.subtitles.appendChild(sub);
      sub.style.transition = 'all 0.3s ease-in-out';
      sub.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'left') {
          this.afterBridgeAnimation(obj, sub);
        }
      }, false);
      setImmediate(() => {
        sub.style.left = `${(obj.add.start - this.times[0]) * this.space}px`;
        sub.style.width = `${(obj.add.end - obj.add.start) * this.space}px`;
      });
    });
  },
  methods: {
    validityTime(time) {
      return time >= 0 && time <= this.duration ? '' : ' illegal';
    },
    afterBridgeAnimation(obj, sub) {
      // 新增字幕，动画结束，触发modified-subtitle事件
      if (this.newSubHolder) {
        this.subtitleInstance.parsed.dialogues.splice(this.newSubHolder.insertIndex, 0, obj.add);
        this.$bus.$emit('modified-subtitle', { sub: this.subtitleInstance });
        sub.parentNode.removeChild(sub);
        this.newSubHolder = null;
        this.triggerCount += 1;
      }
    },
    resetCurrentTime(currentTime) {
      // 同步时间轴中位时间和当前播放时间
      if (!currentTime) {
        const b = document.getElementsByTagName('video')[0];
        currentTime = b.currentTime;
      }
      this.currentTime = parseInt(currentTime, 10);
      this.preciseTime = currentTime;
      this.currentLeft = ((this.currentTime - currentTime) * this.space) -
      ((this.offset * this.space) - (this.winWidth / 2));
    },
    updateWhenPlaying() { // eslint-disable-line
      if (!this.paused) {
        // 播放中，时间轴同步运动，当时间轴中位时间和当前播放时间相差一屏宽度时，重新设置时间轴中位时间
        const b = document.getElementsByTagName('video')[0];
        const currentTime = b.currentTime;
        if (Math.abs(currentTime - this.currentTime) * this.space >= this.winWidth) {
          this.currentTime = parseInt(currentTime, 10);
        }
        this.currentLeft = ((this.currentTime - currentTime) * this.space) -
        ((this.offset * this.space) - (this.winWidth / 2));
        this.preciseTime = currentTime;
        requestAnimationFrame(this.updateWhenPlaying);
      }
    },
    handleDragStartEditor(e) {
      // 开始拖动时间轴，记录拖动位置、时间、暂停播放
      this.dragStartX = e.pageX;
      this.dragStartLeft = this.currentLeft;
      this.dragStartTime = this.preciseTime;
      this.timeLineDraging = true;
      if (!this.paused) {
        this.$bus.$emit('toggle-playback');
      }
    },
    handleDragingEditor(e) {
      if (this.timeLineDraging) {
        // 正在拖动时间轴， 处理越界
        let offset = e.pageX - this.dragStartX;
        const seekTime = this.preciseTime - (offset / this.space);
        if (seekTime <= 0) {
          offset = this.dragStartTime * this.space;
        }
        if (seekTime <= this.duration) {
          requestAnimationFrame(throttle(() => {
            this.updateWhenMoving(offset);
          }, 100));
        }
      }
    },
    handleDragEndEditor(e) {
      // 拖动时间轴结束，重设时间、位置信息
      if (this.timeLineDraging) {
        if (e.pageX !== this.dragStartX) {
          this.resetCurrentTime();
        }
        this.dragStartX = 0;
        this.timeLineDraging = false;
      }
    },
    updateWhenMoving(offset) {
      // 时间轴偏移计算
      this.currentLeft = this.dragStartLeft + offset;
      this.preciseTime = this.dragStartTime - (offset / this.space);
      // this.$refs.progressbar && this.$refs.progressbar.updatePlayProgressBar(this.preciseTime);
      this.$bus.$emit('seek', this.preciseTime);
    },
    handleMouseUpOnTimeLine(e) {
      const doubleClickTime = (Date.now() - this.timeLineClickTimestamp);
      // 单机时间轴、触发时间轴运动到点击位置
      if (doubleClickTime > this.timeLineClickDelay && (e.pageX - this.dragStartX) === 0) {
        const offset = (this.winWidth / 2) - e.pageX;
        const seekTime = this.preciseTime - (offset / this.space);
        if (seekTime >= 0 && seekTime <= this.duration) {
          // this.$refs.timeLine.style.transition = '';
          this.$refs.timeLine.addEventListener('transitionend', this.transitionend, false);
          this.$refs.timeLine.style.transition = 'left 0.3s ease-in-out';
          this.currentLeft += offset;
          this.preciseTime = seekTime;
        }
      }
      this.timeLineClickTimestamp = Date.now();
    },
    transitionend() {
      // 时间轴运动到点击位置，动画结束，重设时间
      this.resetCurrentTime(this.preciseTime);
      this.$bus.$emit('seek', this.preciseTime);
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.transitionend);
      this.timeLineClickTimestamp = 0;
    },
    handleDoubleClickSub(e, sub) {
      // 双击字幕条，触发时间轴运动到字幕条开始位置
      const offset = (this.preciseTime - sub.start) * this.space;
      // this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.addEventListener('transitionend', this.doubleClickTransitionend, false);
      this.$refs.timeLine.style.transition = 'left 0.3s ease-in-out';
      this.currentLeft += offset;
      this.preciseTime = sub.start + 0.01;
    },
    doubleClickTransitionend() {
      // 时间轴运动到字幕条开始位置，动画结束，重设时间
      this.resetCurrentTime(this.preciseTime);
      this.$bus.$emit('seek', this.preciseTime);
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.doubleClickTransitionend);
    },
    handleDragStartSub(e, sub) {
      // 开始拖动字幕条，需要计算拉升还是位移
      this.subDragStartX = e.pageX;
      const path = e.path || (e.composedPath && e.composedPath());
      const subElement = path.find(e => e.tagName === 'DIV' && e.className.includes('sub'));
      const leftTarget = path.find(e => e.tagName === 'I' && e.className.includes('drag-left'));
      const rightTarget = path.find(e => e.tagName === 'I' && e.className.includes('drag-right'));
      this.subDragElement = subElement;
      this.subDragCurrentSub = sub;
      if (leftTarget) {
        this.subLeftDraging = true;
      } else if (rightTarget) {
        this.subRightDraging = true;
      } else {
        this.subDragMoving = true;
      }
      if (!this.paused) {
        this.$bus.$emit('toggle-playback');
      }
    },
    handleDragingSub(e) {
      requestAnimationFrame(throttle(() => {
        const offset = e.pageX - this.subDragStartX;
        this.updateSubWhenDraging(offset, this.subDragCurrentSub, this.subDragElement);
        this.subDragStartX = e.pageX;
      }, 100));
    },
    updateSubWhenDraging(offset, sub, subElement) { // eslint-disable-line
      if (subElement && this.subDragMoving) {
        sub.left += offset;
        sub.left = sub.left > sub.maxLeft ? sub.maxLeft : sub.left;
        sub.left = sub.left < sub.minLeft ? sub.minLeft : sub.left;
        subElement.style.left = `${sub.left}px`;
      } else if (this.subLeftDraging && subElement) {
        if (!(offset < 0 && sub.left === sub.minLeft)) {
          sub.left += offset;
          sub.left = sub.left < sub.minLeft ? sub.minLeft : sub.left;
          const maxL = (sub.originLeft + sub.originWidth) - (0.2 * this.space);
          sub.left = sub.left > maxL ? maxL : sub.left;
          sub.width -= offset;
          sub.width = sub.width < 0.2 * this.space ? 0.2 * this.space : sub.width;
          subElement.style.left = `${sub.left}px`;
          subElement.style.width = `${sub.width}px`;
        }
      } else if (this.subRightDraging && subElement) {
        sub.width += offset;
        sub.width = sub.width > ((sub.maxLeft - sub.left) + sub.originWidth) ?
          ((sub.maxLeft - sub.left) + sub.originWidth) : sub.width;
        sub.width = sub.width < 0.2 * this.space ? 0.2 * this.space : sub.width;
        subElement.style.width = `${sub.width}px`;
      }
    },
    handleDragEndSub() {
      this.finishSubDrag(this.subDragCurrentSub);
    },
    finishSubDrag(sub) {
      this.subDragTimeLineMoving = false;
      let newStart = 0;
      let newEnd = 0;
      if (this.subDragMoving) {
        newStart = sub.originStart + ((sub.left - sub.originLeft) / this.space);
        newEnd = newStart + (sub.originEnd - sub.originStart);
        newStart = parseFloat(newStart.toFixed(2), 10);
        newEnd = parseFloat(newEnd.toFixed(2), 10);
      } else if (this.subLeftDraging) {
        newStart = sub.originStart + ((sub.left - sub.originLeft) / this.space);
        newEnd = sub.originEnd;
        newStart = parseFloat(newStart.toFixed(2), 10);
      } else if (this.subRightDraging) {
        newStart = sub.originStart;
        newEnd = (sub.originEnd * 1) + ((sub.width - sub.originWidth) / this.space);
        newEnd = parseFloat(newEnd.toFixed(2), 10);
      }
      if (newStart && newEnd) {
        this.subtitleInstance.parsed.dialogues.forEach((e) => {
          if (e.start === sub.originStart && e.end === sub.originEnd) {
            e.start = newStart;
            e.end = newEnd;
          }
        });
        this.$bus.$emit('modified-subtitle', { sub: this.subtitleInstance });
      }
      this.subDragStartX = 0;
      this.subDragMoving = false;
      this.subLeftDraging = false;
      this.subRightDraging = false;
      this.triggerCount += 1;
    },
    handleDocumentMouseupWhenDragSub() {
      this.finishSubDrag(this.subDragCurrentSub);
    },
    transcode(time, num) {
      if (time < 0) {
        return '';
      } else if (time > this.duration) {
        return '';
      }
      const secNum = time;
      let hours = Math.floor(secNum / 3600);
      let minutes = Math.floor((secNum - (hours * 3600)) / 60);
      let seconds = secNum - (hours * 3600) - (minutes * 60);
      seconds = num ? seconds.toFixed(num) : Math.round(seconds);
      hours = hours < 10 ? `0${hours}` : hours;
      minutes = minutes < 10 ? `0${minutes}` : minutes;
      seconds = seconds < 10 ? `0${seconds}` : seconds;
      if (minutes === '00' && hours === '00') {
        return seconds;
      } else if (hours === '00') {
        return `${minutes}:${seconds}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    },
    parsedFragments(cues) {
      if (this.type === 'ass' && cues) {
        let currentText = '';
        cues.fragments.forEach((cue) => {
          currentText += cue.text;
        });
        return Object.assign({}, cues, { text: currentText });
      }
      return cues;
    },
  },
  destroyed() {
    document.removeEventListener('mousemove', this.handleDragingSub);
    document.removeEventListener('mouseup', this.handleDragEndSub);
  },
};
</script>
<style lang="scss" scoped>
  .sub-editor {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    cursor: pointer;
    background-image: radial-gradient(50% 136%, rgba(0,0,0,0.36) 50%, rgba(0,0,0,0.48) 100%);
    // background-color: rgba(0, 0, 0, .36);
  }
  .sub-editor-head {
    height: 60vh;
    position: relative;
    &::before {
      content: "";
      display: block;
      height: 6vh;
      max-height: 60px;
      backdrop-filter: blur(4px); 
      background: rgba(255,255,255,0.06);
    }
    &:after {
      content: "";
      width: 2px;
      height: 15.75vh;
      position: absolute;
      top: 0;
      left: 50%;
      z-index: 1;
      transform: translateX(-50%);
      background-color: #d8d8d8;
      box-shadow: 0 0 1px 0 rgba(255,255,255,0.50);
      border-radius: 0 0 1px 1px;
    }
  }
  .sub-editor-time-line {
    width: 100%;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 2;
    cursor: pointer;
    // background-color: aquamarine;
    .scales {
      display: flex;
      align-items: center;
      width: 100%;
      height: 6vh;
      max-height: 60px;
    }
    .scale {
      height: 100%;
      display: flex;
      position: relative;
      align-items: center;
      &.illegal {
        &::before, &::after, i, span {
          display: none;
        }
      }
      &::before {
        content: "";
        width: 100%;
        height: 2px;
        position: absolute;
        left: -2px;
        bottom: 0;
        border-left: 1px solid #ffffff;
        border-right: 1px solid #ffffff;
      }
      &::after {
        content: "";
        width: 20%;
        height: 2px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 0;
        border-left: 1px solid rgba(255,255,255,0.5);
        border-right: 1px solid rgba(255,255,255,0.5);
      }
      i {
        width: 60%;
        height: 2px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 0;
        border-left: 1px solid rgba(255,255,255,0.5);
        border-right: 1px solid rgba(255,255,255,0.5);
      }
      span {
        transform: translateX(-50%);
      }
    }
    .sub {
      position: absolute;
      top: 12vh;
      height: 3vh;
      max-height: 30px;
      z-index: 1;
      background: rgba(255,255,255,0.13);
      border: 1px solid rgba(255,255,255,0.40);
      &.focus {
        background: rgba(255,255,255,0.39);
        border-color: rgba(255,255,255,0.46);
      }
      .drag-left {
        // content: '';
        position: absolute;
        width: 5%;
        height: 100%;
        left: 0;
        top: 0;
        z-index: 1;
        cursor: col-resize;
      }
      .drag-right {
        // content: '';
        position: absolute;
        width: 5%;
        height: 100%;
        right: 0;
        top: 0;
        z-index: 1;
        cursor: col-resize;
      }
    }
  }
</style>
