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
            :data="sub.width"
            :style="{
              left: `${sub.left}px`,
              right: `${sub.right}px`,
            }">
            <i class="drag-left"></i>
            <i class="drag-right"></i>
          </div>
        </div>
      </div>
    </div>
    <div class="sub-editor-body">
      <subtitle-renderer
      :key="subtitleInstance && subtitleInstance.id"
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
import { videodata } from '@/store/video';
import TheProgressBar from '@/components/PlayingView/TheProgressBar.vue';
import SubtitleRenderer from './SubtitleRenderer.vue';
import SubtitleInstance from './SubtitleLoader/index';

export default {
  name: 'subtitle-editor',
  components: {
    'the-progress-bar': TheProgressBar,
    SubtitleRenderer,
  },
  data() {
    return {
      dialogues: [],
      currentLeft: 0, // 时间轴左偏移 --|-.-|--
      currentTime: 0, // 当前时间轴中分时间刻度，时间轴的中心时间不一定是播放的时间
      preciseTime: 0, // 当前视频的播放时间
      timeLineDraging: false, // 标记是否是拖拽时间轴
      dragStartX: 0, // 标记拖拽时间轴起始位置
      dragStartLeft: 0, // 标记开始拖拽当前时间轴left
      dragStartTime: 0, // 标记开始拖拽时间轴当前播放时间
      timeLineClickDelay: 300, // 点击时间轴刻度反应的延迟时间
      timeLineClickTimestamp: 0,
      subDragMoving: false, // 标记是不是拖拽字幕条
      subLeftDraging: false, // 标记是不是向左伸缩字幕条
      subRightDraging: false, // 标记是不是向右伸缩字幕条
      subDragStartX: 0, // 标记拖拽字幕条起始位置
      subDragElement: null, // 标记拖拽的字幕条dom元素
      subDragCurrentSub: null, // 标记拖拽的字幕条model
      subDragTimeLineMoving: false,
      triggerCount: 1, // rerender doms count
      space: 85, // 1s pxs
      showAddInput: false, // 可以显示添加字幕的属性
      newSubHolder: null, // 配合showAddInput，存储添加字幕的数据格式以及插入位置
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
      if (this.subtitleInstance && this.subtitleInstance.metaInfo) {
        return this.subtitleInstance.metaInfo.format;
      }
      return '';
    },
    times() {
      return [...Array(this.scales).keys()]
        .map(e => (this.currentTime * 1) + ((e * 1) - this.offset));
    },
    validitySubs() {
      const filters = this.dialogues
        .map((e, i) => Object.assign({}, e, { index: i }))
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
        let right = (3 * this.winWidth) - (left + width);
        let minLeft = (0 - this.times[0]) * this.space;
        let maxLeft = ((this.duration - this.times[0]) - (e.end - e.start)) * this.space;
        if (i !== 0) {
          const prevLeft = (filters[i - 1].start - this.times[0]) * this.space;
          const prevWidth = (filters[i - 1].end - filters[i - 1].start) * this.space;
          minLeft = prevLeft + prevWidth;
        }
        if (i !== (filters.length - 1)) {
          const nextLeft = (filters[i + 1].start - this.times[0]) * this.space;
          maxLeft = nextLeft - width;
        }
        let maxRight = (3 * this.winWidth) - (minLeft + width);
        let minRight = (3 * this.winWidth) - (maxLeft + width);
        left = parseFloat(left.toFixed(2), 10);
        right = parseFloat(right.toFixed(2), 10);
        width = parseFloat(width.toFixed(2), 10);
        minLeft = parseFloat(minLeft.toFixed(2), 10);
        maxLeft = parseFloat(maxLeft.toFixed(2), 10);
        minRight = parseFloat(minRight.toFixed(2), 10);
        maxRight = parseFloat(maxRight.toFixed(2), 10);
        return Object.assign({
          triggerCount: this.triggerCount,
        }, e, {
          originStart: e.start,
          originEnd: e.end,
          minLeft,
          maxLeft,
          minRight,
          maxRight,
          left,
          right,
          width,
          originLeft: left,
          originRight: right,
          originWidth: width,
          text,
          focus, // 是否是当前播放的字幕
        });
      });
    },
    currentSub() {
      return this.validitySubs.find(e => e.start <= this.preciseTime && e.end >= this.preciseTime);
    },
  },
  watch: {
    paused() {
      requestAnimationFrame(this.updateWhenPlaying);
      this.triggerCount += 1;
    },
    currentSub(val) {
      this.computedCanShowAddBtn(val);
    },
    triggerCount() {
      this.computedCanShowAddBtn(this.currentSub);
    },
    subtitleInstance: {
      immediate: true,
      deep: true,
      handler(val) {
        if (val && val.parsed && this.dialogues.length !== val.parsed.dialogues.length) {
          this.dialogues = val.parsed.dialogues;
        }
      },
    },
    winWidth() {
      // 当resize的时候，重新render timeline
      this.resetCurrentTime();
    },
  },
  created() {
  },
  mounted() {
    this.resetCurrentTime(videodata.time);
    this.computedCanShowAddBtn(this.currentSub);
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
      sub.setAttribute('style', `width: 1px;
        position: absolute;
        top: 12vh;
        height: 3vh;
        max-height: 30px;
        z-index: 1;
        background: rgba(255,255,255,0.39);
        border: 1px solid rgba(255,255,255,0.46);
        left: ${(this.preciseTime - this.times[0]) * this.space}px`);
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
    computedCanShowAddBtn(currentSub) { // eslint-disable-line
      // 当前有显示的字幕, 或者刚刚开始
      if (currentSub || this.preciseTime < 0.2) {
        this.showAddInput = false;
        this.newSubHolder = null;
        return;
      }
      // 完全无字幕
      if (this.dialogues.length === 0) {
        this.newSubHolder = {
          distance: this.preciseTime - 0,
          preciseTime: this.preciseTime,
          last: {
            start: 0,
            end: 0,
            tags: {
              alignment: 2,
              pos: null,
            },
            text: '',
          },
          insertIndex: 0,
        };
        this.showAddInput = true;
      } else {
        const last = this.validitySubs.slice().reverse().find(e => e.end < this.preciseTime);
        if (last && (this.preciseTime - last.end) > 0.2) {
          // 当前时间段有字幕、且可以显示按钮
          this.showAddInput = true;
          this.newSubHolder = {
            distance: this.preciseTime - last.end,
            preciseTime: this.preciseTime,
            last,
            insertIndex: last.index + 1,
          };
        } else if (last) {
          // 有字幕，但是不能显示按钮
          this.showAddInput = false;
          this.newSubHolder = null;
        } else {
          // 当前时间段没有字幕，需要找dialogues中合法的上个字幕
          let insertIndex = 0;
          let last = null;
          const len = this.dialogues.length;
          for (let i = 0; i < len; i += 1) {
            const e = this.dialogues[i];
            const tags = e.fragments && e.fragments[0] && e.fragments[0].tags;
            const isOtherPos = this.type === 'ass' && tags && (tags.pos || tags.alignment !== 2);
            if (!isOtherPos) {
              last = e;
            } else if (e.end < this.preciseTime) {
              insertIndex = i + 1;
            } else if (last && e.start > this.preciseTime) {
              break;
            }
          }
          this.showAddInput = true;
          this.newSubHolder = {
            distance: this.preciseTime - 0,
            preciseTime: this.preciseTime,
            last,
            insertIndex,
          };
        }
      }
    },
    validityTime(time) {
      return time >= 0 && time <= this.duration ? '' : ' illegal';
    },
    afterBridgeAnimation(obj, sub) {
      // 新增字幕，动画结束，触发modified-subtitle事件
      if (this.newSubHolder) {
        obj.sub.parsed.dialogues.splice(this.newSubHolder.insertIndex, 0, obj.add);
        this.$bus.$emit('modified-subtitle', { sub: obj.sub });
        if (obj.sub.type !== 'modified') {
          setTimeout(() => {
            sub.parentNode.removeChild(sub);
          }, 200);
        } else {
          sub.parentNode.removeChild(sub);
        }
        this.newSubHolder = null;
        this.triggerCount += 1;
      }
    },
    resetCurrentTime(currentTime) {
      // 同步时间轴中位时间和当前播放时间
      if (typeof currentTime === 'undefined') {
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
        this.$refs.progressbar && this.$refs.progressbar.updatePlayProgressBar(this.preciseTime);
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
      this.$refs.progressbar && this.$refs.progressbar.updatePlayProgressBar(this.preciseTime);
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
      this.triggerCount += 1;
      this.$bus.$emit('seek', this.preciseTime);
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.transitionend);
      this.timeLineClickTimestamp = 0;
    },
    handleDoubleClickSub(e, sub) {
      // 双击字幕条，触发时间轴运动到字幕条开始位置
      const offset = (this.preciseTime - sub.start) * this.space;
      if (Math.abs(offset) < 1) return; // 偏移太小就不触发运动
      // this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.addEventListener('transitionend', this.doubleClickTransitionend, false);
      this.$refs.timeLine.style.transition = 'left 0.3s ease-in-out';
      this.currentLeft += offset;
      this.preciseTime = sub.start + 0.01;
    },
    doubleClickTransitionend() {
      // 时间轴运动到字幕条开始位置，动画结束，重设时间
      this.resetCurrentTime(this.preciseTime);
      this.triggerCount += 1;
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
      // 当拖拽字幕条时，保持hover的UI
      const className = `sub draging${sub.focus ? ' focus' : ''}`;
      subElement.setAttribute('class', className);
    },
    handleDragingSub(e) {
      if (this.subLeftDraging || this.subLeftDraging || this.subDragMoving) {
        requestAnimationFrame(throttle(() => {
          const offset = e.pageX - this.subDragStartX;
          this.updateSubWhenDraging(offset, this.subDragCurrentSub, this.subDragElement);
          this.subDragStartX = e.pageX;
        }, 100));
      }
    },
    updateSubWhenDraging(offset, sub, subElement) { // eslint-disable-line
      if (subElement && this.subDragMoving) {
        sub.left += offset;
        sub.right -= offset;
        sub.left = sub.left > sub.maxLeft ? sub.maxLeft : sub.left;
        sub.left = sub.left < sub.minLeft ? sub.minLeft : sub.left;
        sub.right = sub.right > sub.maxRight ? sub.maxRight : sub.right;
        sub.right = sub.right < sub.minRight ? sub.minRight : sub.right;
        subElement.style.left = `${sub.left}px`;
        subElement.style.right = `${sub.right}px`;
      } else if (this.subLeftDraging && subElement) {
        if (!(offset < 0 && sub.left === sub.minLeft)) {
          sub.left += offset;
          sub.left = sub.left < sub.minLeft ? sub.minLeft : sub.left;
          const maxL = (sub.originLeft + sub.originWidth) - (0.2 * this.space);
          sub.left = sub.left > maxL ? maxL : sub.left;
          subElement.style.left = `${sub.left}px`;
        }
      } else if (this.subRightDraging && subElement) {
        sub.right -= offset;
        sub.right = sub.right < sub.minRight ? sub.minRight : sub.right;
        const maxR = sub.originRight + (sub.originWidth - (0.2 * this.space));
        sub.right = sub.right > maxR ? maxR : sub.right;
        subElement.style.right = `${sub.right}px`;
      }
    },
    handleDragEndSub() {
      if (this.subLeftDraging || this.subLeftDraging || this.subDragMoving) {
        this.finishSubDrag(this.subDragCurrentSub);
      }
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
        newEnd = (sub.originEnd * 1) - ((sub.right - sub.originRight) / this.space);
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
      // 拖拽字幕条结束，移除hover的UI
      const className = `sub${sub.focus ? ' focus' : ''}`;
      this.subDragElement.setAttribute('class', className);
      this.subDragStartX = 0;
      this.subDragMoving = false;
      this.subLeftDraging = false;
      this.subRightDraging = false;
      this.triggerCount += 1;
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
    // background-image: url(../../assets/dot.svg);
    // background-repeat: no-repeat;
    // background-position-x: center;
    // background-position-y: -2px;
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
      border: 1px solid rgba(255,255,255,0.21);
      border-radius: 1px;
      // transition: border 0.3s ease-in-out;
      &::before {
        content: "";
        width: 50%;
        height: 80%;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -55%);
        background-image: url(../../assets/subtitle-editor-drag.svg);
        background-repeat: no-repeat;
        background-size: 100% 100%;
        background-position: center;
        opacity: 0;
        // transition: all 0.3s ease-in-out;
      }
      &.focus {
        background: rgba(255,255,255,0.39);
        border-color: rgba(255,255,255,0.46);
      }
      &:hover {
        border-color: rgba(255,255,255,0.40);
        &::before {
          opacity: 1;
        }
      }
      &.draging {
        border-color: rgba(255,255,255,0.40);
        &::before {
          opacity: 1;
        }
      }
      .drag-left {
        position: absolute;
        width: 5%;
        height: 100%;
        left: 0;
        top: 0;
        z-index: 1;
        cursor: col-resize;
      }
      .drag-right {
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
