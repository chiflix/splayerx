<template>
  <div class="sub-editor"
    :style="{
      zIndex: dragingMode !== 'default' || spaceKeyPressStartTime > 0 ? '9999' : '11',
      cursor: dragingMode
    }">
    <div class="sub-editor-head">
      <div class="sub-editor-time-line no-drag"
        ref="timeLine"
        @dblclick.left.stop="handleMouseUpOnTimeLine"
        @mousedown.left.stop="handleDragStartEditor"
        @mousemove.left="handleDragingEditor"
        @mouseup.left="handleDragEndEditor"
        :style="{
          width: `${3 * winWidth}px`,
          left: `${currentLeft}px`,
          height: spaceKeyPressStartTime > 0 ? '100vh' : 'auto',
          cursor: dragingMode !== 'default' ? dragingMode : 'grab',
          zIndex: spaceKeyPressStartTime > 0 ? '9999' : '2',
        }">
        <div class="scales" :style="{
          width: `${scales * space}px`
        }">
          <div v-for="(time) in times"
            :key="time"
            :class="'scale' + validityTime(time) + `${isHighlight(time) ? ' highlight' : ''}`"
            :style="{
              width: `${space}px`,
              fontSize: winHeight > 1000 ? '22px': '2.1vh',
            }">
            <i></i>
            <span>{{isHighlight(time) ? transcode(time) : getSecond(time)}}</span>
          </div>
        </div> 
        <div class="subtitles" ref="subtitles">
          <div v-for="(sub) in validitySubs"
            :key="`${sub.width}-${sub.index}-${sub.track}-${sub.text}`"
            @mouseover.stop="handleHoverIn($event, sub)"
            @mouseleave.stop="handleHoverOut($event, sub)"
            @mousedown.left.stop="handleDragStartSub($event, sub)"
            @mousemove.left="handleDragingSub($event, sub)"
            @mouseup.left="handleDragEndSub($event, sub)"
            @dblclick.left.stop="handleDoubleClickSub($event, sub)"
            :class="computedSubClass(sub.index)+' no-drag sub-line-mark'+`${sub.focus ? ' focus' : ''}`"
            :data="`${sub.width}-${sub.index}-${chooseIndexs}-${sub.track}-${sub.text}`"
            :style="{
              left: `${sub.left}px`,
              right: `${sub.right}px`,
              top: `${((6 + (sub.track - 1) * 4) * vh) + 33}px`,
              opacity: `${sub.opacity}`,
              cursor: dragingMode !== 'default' ? dragingMode : 'grab'
            }">
            <i class="drag-left"
              :style="{
                cursor: dragingMode !== 'default' ? dragingMode : 'col-resize'
              }"></i>
            <i class="drag-right"
              :style="{
                cursor: dragingMode !== 'default' ? dragingMode : 'col-resize'
              }"></i>
          </div>
        </div>
      </div>
    </div>
    <div class="sub-editor-body">
      <div class="exit-btn-wrap" @click.stop="handleClickProfessional"
        :style="{
          cursor: dragingMode !== 'default' ? dragingMode : 'pointer'
        }">
        <Icon type="subtitleEditorExit" class="subtitle-editor-exit"/>
      </div>
      <subtitle-renderer
        v-if="!subDragTimeLineMoving"
        :key='originSrc+currentFirstSubtitleId'
        :showAddInput="showAddInput"
        :newSubHolder="newSubHolder"
        :currentSub="currentSub"
        :chooseIndexs.sync="chooseIndexs"
        :dragingMode="dragingMode"
        :subtitleInstance="subtitleInstance"/>
    </div>
    <div class="sub-editor-foot">
      <div class="times-wrap">
        <div class="cont">
          <div class="timing"
            :style="{
              cursor: dragingMode
            }">
            <span class="timeContent">{{transcode(preciseTime, 1)}}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapMutations } from 'vuex';
import { throttle, cloneDeep } from 'lodash';
import { EVENT_BUS_COLLECTIONS as bus } from '@/constants';
import { videodata } from '@/store/video';
import { Window as windowMutations } from '@/store/mutationTypes';
import TheProgressBar from '@/components/PlayingView/TheProgressBar.vue';
import SubtitleRenderer from './SubtitleRenderer.vue';
import SubtitleInstance from './SubtitleLoader/index';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'subtitle-editor',
  components: {
    'the-progress-bar': TheProgressBar,
    SubtitleRenderer,
    Icon,
  },
  data() {
    return {
      subtitleInstanceBridge: null, //
      dialogues: [],
      chooseIndexs: -1, // 单击字幕条选择字幕条的索引，支持ctrl多选
      hoverIndex: -1, // 目前鼠标hover的字幕条索引
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
      subDragStartOffsetLeft: 0, // 标记拖拽字幕条起始，pagex到字幕条左边的距离
      subDragElement: null, // 标记拖拽的字幕条dom元素
      subDragCurrentSub: null, // 标记拖拽的字幕条model
      subDragTimeLineMoving: false, // 拖拽字幕条出窗口, 时间轴运动标记
      subDragTimeLineMovingDirection: '', // 拖拽字幕条出窗口, 时间轴运动方向标记
      timer: null, // 拖拽字幕出边框，运动的定时器
      step: 1, // 拖拽字幕出边框，时间轴运动的步长
      hook: 0, // up hook
      animationTime: 500, // 拖拽字幕出边框，时间轴运动间隔
      lock: false, // 当时间轴一步运动的时候，需要锁住move
      triggerCount: 1, // rerender doms count
      createSubElement: null, // 添加字幕动画依赖的dom
      space: 85, // 1s pxs
      showAddInput: false, // 可以显示添加字幕的属性
      newSubHolder: null, // 配合showAddInput，存储添加字幕的数据格式以及插入位置
      history: [],
      currentIndex: -1,
      dragingMode: 'default', // 光标类型
      spaceKeyPressStartTime: 0, //
      lastPaused: false, //
    };
  },
  props: {
    subtitleInstance: SubtitleInstance,
  },
  computed: {
    ...mapGetters([
      'winWidth', 'winHeight', 'duration', 'paused', 'isCreateSubtitleMode', 'currentFirstSubtitleId', 'originSrc',
    ]),
    vh() {
      return this.winHeight / 100 > 10 ? 10 : Math.abs(this.winHeight / 100);
    },
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
          // return isInRange;
        });
      return filters.map((e, i) => { // eslint-disable-line
        const text = this.type === 'ass' ? e.fragments && e.fragments[0] && e.fragments[0].text : e.text;
        const focus = e.start <= this.preciseTime && e.end >= this.preciseTime;
        let left = (e.start - this.times[0]) * this.space;
        let width = (e.end - e.start) * this.space;
        let right = (3 * this.winWidth) - (left + width);
        let minLeft = (0 - this.times[0]) * this.space;
        let maxLeft = ((this.duration - this.times[0]) - (e.end - e.start)) * this.space;
        // 多轨道，需要比较同一轨道的左右字幕
        let leftIndex = i - 1;
        let rightIndex = i + 1;
        while (leftIndex > -1) { // 往左遍历，找到同一个轨道左边的字幕，设定minLeft
          if (e.track === filters[leftIndex].track) {
            if (filters[leftIndex].start > e.start) {
              const nextLeft = (filters[leftIndex].start - this.times[0]) * this.space;
              maxLeft = nextLeft - width;
            } else {
              const prevLeft = (filters[leftIndex].start - this.times[0]) * this.space;
              const prevWidth = (filters[leftIndex].end - filters[leftIndex].start) * this.space;
              minLeft = prevLeft + prevWidth;
              break;
            }
          }
          leftIndex -= 1;
        }
        while (rightIndex < filters.length) { // 往右遍历，找到同一轨道右边字幕，设定maxLeft
          if (e.track === filters[rightIndex].track) {
            if (filters[rightIndex].start < e.start) {
              const prevLeft = (filters[rightIndex].start - this.times[0]) * this.space;
              const prevWidth = (filters[rightIndex].end - filters[rightIndex].start) * this.space;
              minLeft = prevLeft + prevWidth;
            } else {
              const nextLeft = (filters[rightIndex].start - this.times[0]) * this.space;
              maxLeft = nextLeft - width;
            }
            break;
          }
          rightIndex += 1;
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
        let opacity = 1;
        if (this.subDragTimeLineMoving && this.subDragCurrentSub &&
          e.index === this.subDragCurrentSub.index) {
          opacity = 0;
          this.subDragCurrentSub.minLeft = minLeft;
          this.subDragCurrentSub.maxLeft = maxLeft;
          this.subDragCurrentSub.minRight = minRight;
          this.subDragCurrentSub.maxRight = maxRight;
          this.subDragCurrentSub.originStart = e.start;
          this.subDragCurrentSub.originEnd = e.end;
          this.subDragCurrentSub.originLeft = left;
          this.subDragCurrentSub.originRight = right;
          this.subDragCurrentSub.originWidth = width;
        }

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
          opacity,
        });
      });
    },
    currentSub() {
      return this.validitySubs
        .filter(e => e.start <= this.preciseTime && e.end >= this.preciseTime);
    },
  },
  watch: {
    paused(val) {
      if (!val) {
        requestAnimationFrame(this.updateWhenPlaying);
        this.triggerCount += 1;
      }
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
        this.hook = 0;
        if (val && val.parsed && !this.isCreateSubtitleMode) {
          this.dialogues = val.parsed.dialogues;
        }
        if (val && !this.isCreateSubtitleMode) {
          this.subtitleInstanceBridge = val;
        }
        if (this.createSubElement && !this.subDragTimeLineMoving) {
          this.createSubElement.parentNode &&
          this.createSubElement.parentNode.removeChild(this.createSubElement);
          this.createSubElement = null;
        }
      },
    },
    winWidth() {
      // 当resize的时候，重新render timeline
      this.resetCurrentTime();
    },
  },
  mounted() {
    this.resetCurrentTime(videodata.time);
    this.computedCanShowAddBtn(this.currentSub);
    // 初始化组件
    document.addEventListener('mousemove', this.handleDragingEditor);
    document.addEventListener('mouseup', this.handleDragEndEditor);
    document.addEventListener('mousemove', this.handleDragingSub);
    document.addEventListener('mouseup', this.handleDragEndSub);
    // 键盘事件
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
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
      this.createSubElement = document.createElement('div');
      this.createSubElement.setAttribute('style', `width: 1px;
        position: absolute;
        top: ${(6 * this.vh) + 33}px;
        height: 3vh;
        max-height: 30px;
        z-index: 1;
        background: rgba(255,255,255,0.39);
        border: 1px solid rgba(255,255,255,0.46);
        border-radius: 1px;
        left: ${(this.preciseTime - this.times[0]) * this.space}px`);
      this.$refs.subtitles && this.$refs.subtitles.appendChild(this.createSubElement);
      this.createSubElement.style.transition = 'all 0.3s ease-in-out';
      this.createSubElement.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'left') {
          this.afterBridgeAnimation(obj);
        }
      }, false);
      setImmediate(() => {
        this.createSubElement.style.left = `${(obj.add.start - this.times[0]) * this.space}px`;
        this.createSubElement.style.width = `${(obj.add.end - obj.add.start) * this.space}px`;
      });
    });
    // 拦截modified-subtitle，push到操作历史记录里面
    this.$bus.$on('modified-subtitle', ({
      sub, action, index, before,
    }) => {
      // 如果不是撤销或者重复，就记录到历史记录
      if (action) {
        this.updateHistory({
          type: action,
          index,
          before,
          after: cloneDeep(sub.parsed.dialogues[index]),
        });
      }
    });
    this.$bus.$on(bus.SUBTITLE_EDITOR_UNDO, this.undo);
    this.$bus.$on(bus.SUBTITLE_EDITOR_REDO, this.redo);
  },
  methods: {
    ...mapMutations({
      toggleProfessional: windowMutations.TOGGLE_PROFESSIONAL,
    }),
    computedCanShowAddBtn(currentSub) { // eslint-disable-line
      currentSub = currentSub.filter(e => e.track === 1);
      // 当前有显示的字幕, 或者刚刚开始
      if (currentSub.length !== 0 || this.preciseTime < 0.2) {
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
            track: 1,
          },
          insertIndex: 0,
        };
        this.showAddInput = true;
      } else {
        const last = this.validitySubs
          .slice()
          .reverse()
          .find(e => e.end < this.preciseTime && e.track === 1);
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
    afterBridgeAnimation(obj) {
      // 新增字幕，动画结束，触发modified-subtitle事件
      if (this.newSubHolder) {
        obj.sub.parsed.dialogues.splice(this.newSubHolder.insertIndex, 0, obj.add);
        this.$bus.$emit('modified-subtitle', {
          sub: obj.sub,
          action: 'add',
          index: this.newSubHolder.insertIndex,
          before: null,
        });
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
      this.dragingMode = 'grabbing';
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
        this.dragingMode = 'default';
        this.triggerCount += 1;
      }
      // 判断path里面有没有sub，没有就取消当前选中的sub
      const path = e.path || (e.composedPath && e.composedPath());
      const hasSubElement = path.find(e => e.tagName === 'DIV' && e.className.includes('sub-line-mark'));
      if (!hasSubElement) {
        this.chooseIndexs = -1;
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
      // const doubleClickTime = (Date.now() - this.timeLineClickTimestamp);
      // 单机时间轴、触发时间轴运动到点击位置
      // if (doubleClickTime > this.timeLineClickDelay) {
      const offset = (this.winWidth / 2) - e.pageX;
      const seekTime = this.preciseTime - (offset / this.space);
      if (seekTime >= 0 && seekTime <= this.duration) {
        // this.$refs.timeLine.style.transition = '';
        this.$refs.timeLine.addEventListener('transitionend', this.transitionend, false);
        this.$refs.timeLine.style.transition = 'left 0.3s ease-in-out';
        this.currentLeft += offset;
        this.preciseTime = seekTime;
      }
      // }
      // this.timeLineClickTimestamp = Date.now();
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
      this.chooseIndexs = sub.index;
    },
    doubleClickTransitionend() {
      // 时间轴运动到字幕条开始位置，动画结束，重设时间
      this.resetCurrentTime(this.preciseTime);
      this.triggerCount += 1;
      this.$bus.$emit('seek', this.preciseTime);
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.doubleClickTransitionend);
    },
    computedSubClass(i) {
      const ci = this.chooseIndexs;
      const hi = this.hoverIndex;
      let c = 'sub';
      if (i === ci && this.subDragMoving) {
        c = 'sub choose hover draging';
      } else if (i === ci && (this.subLeftDraging || this.subRightDraging)) {
        c = 'sub choose hover resize';
      } else if (i === ci && i === hi) {
        c = 'sub choose hover';
      } else if (i === ci) {
        c = 'sub choose';
      } else if (i === hi) {
        c = 'sub hover';
      }
      return c;
    },
    handleHoverIn(e, sub) {
      if (!(this.subDragMoving || this.subLeftDraging || this.subRightDraging)) {
        this.hoverIndex = sub.index;
      }
    },
    handleHoverOut() {
      if (!(this.subDragMoving || this.subLeftDraging || this.subRightDraging)) {
        this.hoverIndex = -1;
      }
    },
    handleDragStartSub(e, sub) {
      // 开始拖动字幕条，需要计算拉升还是位移
      this.subDragStartX = e.pageX;
      const path = e.path || (e.composedPath && e.composedPath());
      const subElement = path.find(e => e.tagName === 'DIV' && e.className.includes('sub-line-mark'));
      const leftTarget = path.find(e => e.tagName === 'I' && e.className.includes('drag-left'));
      const rightTarget = path.find(e => e.tagName === 'I' && e.className.includes('drag-right'));
      this.subDragElement = subElement;
      this.subDragCurrentSub = sub;
      this.chooseIndexs = sub.index;
      this.subDragStartOffsetLeft = (e.pageX - (sub.left + this.currentLeft));
      if (leftTarget) {
        this.subLeftDraging = true;
        this.dragingMode = 'col-resize';
      } else if (rightTarget) {
        this.subRightDraging = true;
        this.dragingMode = 'col-resize';
      } else {
        this.subDragMoving = true;
        this.dragingMode = 'grabbing';
      }
      if (!this.paused) {
        this.$bus.$emit('toggle-playback');
      }
      // 当拖拽字幕条时，保持hover的UI
      // const className = `sub draging${sub.index === this.chooseIndexs ? ' focus' : ''}`;
      // subElement.setAttribute('class', className);
    },
    handleDragingSub(e) {
      if (this.subRightDraging || this.subLeftDraging || this.subDragMoving) {
        // const pointerL = this.subDragCurrentSub.minLeft +
        //   (this.currentLeft + (this.subDragCurrentSub.width * 0.03));
        // const pointerR = this.subDragCurrentSub.maxLeft +
        //   (this.currentLeft + (this.subDragCurrentSub.width * 0.97));
        // if (e.pageX > pointerR || e.pageX < pointerL) return;
        // requestAnimationFrame(throttle(() => {
        //   const offset = e.pageX - this.subDragStartX;
        //   this.updateSubWhenDraging(offset, this.subDragCurrentSub, this.subDragElement);
        //   this.subDragStartX = e.pageX;
        // }, 100));
        const offset = e.pageX - this.subDragStartX;
        this.updateSubWhenDraging(offset, this.subDragCurrentSub, this.subDragElement, e.pageX);
        this.subDragStartX = e.pageX;
      }
    },
    timeLineTransitionend() {
      // 时间轴步长运动，动画结束
      if (this.lock && this.createSubElement.style.position === 'absolute') {
        this.createSubElement.style.left = this.subDragTimeLineMovingDirection === 'right' ?
          `${(this.subDragCurrentSub.maxLeft - (this.step * this.space))}px` :
          `${(this.subDragCurrentSub.minLeft + (this.step * this.space))}px`;
      }
      this.resetCurrentTime(this.preciseTime);
      this.triggerCount += 1;
      this.$bus.$emit('seek', this.preciseTime);
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.timeLineTransitionend);
      this.$refs.progressbar && this.$refs.progressbar.updatePlayProgressBar(this.preciseTime);
      this.lock = false;
      if (!this.timer) {
        // 鼠标已经up，但是动画刚执行结束，手动触发finishSubDrag
        this.finishSubDrag(this.subDragCurrentSub);
      }
    },
    updateSubWhenDraging(offset, sub, subElement, pageX) { // eslint-disable-line
      if (subElement && this.subDragMoving) {
        // sub.left += offset;
        // sub.right -= offset;
        sub.left = pageX - (this.subDragStartOffsetLeft + this.currentLeft);
        sub.right = (3 * this.winWidth) - (sub.left + sub.width);
        const bMaxL = this.winWidth - this.currentLeft;
        const maxL = bMaxL - ((this.space / 5) * 2); // 字幕拖拽，最大左定位 最右位置
        const bMaxR = (3 * this.winWidth) + this.currentLeft;
        const maxR = bMaxR - ((this.space / 5) * 2); // 字幕拖拽，最大右定位 最左位置
        sub.left = sub.left > sub.maxLeft ? sub.maxLeft : sub.left;
        sub.left = sub.left < sub.minLeft ? sub.minLeft : sub.left;
        sub.right = sub.right > sub.maxRight ? sub.maxRight : sub.right;
        sub.right = sub.right < sub.minRight ? sub.minRight : sub.right;
        if (sub.left > maxL) {
          sub.left = maxL;
          sub.right = (3 * this.winWidth) - (sub.left + sub.width);
        } else if (sub.right > maxR) {
          sub.right = maxR;
          sub.left = (3 * this.winWidth) - (sub.right + sub.width);
        }
        // 当字幕条移出窗口一半，就要触发时间轴1s刻度运动
        // 鼠标距离边框 85/5*2的距离 && 当前字幕条已经出了边框
        if ((this.subDragStartX + (offset + ((this.space / 5) * 2))) > this.winWidth &&
          sub.right <= ((2 * this.winWidth) + this.currentLeft)) {
          // 往右拖出窗口
          sub.left = sub.left > maxL ? maxL : sub.left;
          sub.right = (3 * this.winWidth) - (sub.left + sub.width);
          // 先隐藏当前字幕条DOM
          // subElement.style.opacity = '0';
          // 定时运动
          if (!this.subDragTimeLineMoving) {
            // 创建DOM副本
            const left = sub.left + this.currentLeft;
            this.createSubElement = document.createElement('div');
            this.createSubElement.setAttribute('style', `width: ${sub.width}px;
              position: fixed;
              top: ${((6 + ((sub.track - 1) * 4)) * this.vh) + 33}px;
              height: 3vh;
              max-height: 30px;
              z-index: 1;
              background: rgba(255,255,255,0.39);
              border: 1px solid rgba(255,255,255,0.46);
              border-radius: 1px;
              cursor: pointer;
              left: ${left}px`);
            // 插入拖拽的DOM镜像
            this.$refs.timeLine && this.$refs.timeLine.appendChild(this.createSubElement);
            // 开启定时运动
            this.timer = setInterval(() => {
              const distance = sub.minRight - ((3 * this.winWidth) - bMaxL);
              // 当拖拽的字幕条已经快差一步就全部显示到窗口里面的时候
              // DOM镜像就定位到时间轴上面
              // if ((distance + this.space) > 0) {
              //   this.createSubElement.style.position = 'absolute';
              //   this.createSubElement.style.left = `${sub.maxLeft}px`;
              // }
              // 当拖拽的字幕条已经全部显示到窗口里面，就结束定时运动
              // 结束运动，就把镜像删掉，当前拖拽的字幕条显示
              if (distance > 0) {
                clearInterval(this.timer);
                this.timer = null;
                if (this.createSubElement) {
                  this.createSubElement.parentNode &&
                  this.createSubElement.parentNode.removeChild(this.createSubElement);
                  this.createSubElement = null;
                }
                this.subDragTimeLineMoving = false;
                sub.left = sub.maxLeft;
                sub.right = (3 * this.winWidth) - (sub.left + sub.width);
                subElement.style.left = `${sub.left}px`;
                subElement.style.right = `${sub.right}px`;
              } else {
                // 如果字幕条往右运动一个步长还不超出这个字幕的最右定位
                // 就让这个字幕条在时间轴上面往前加一步
                // if (this.subDragCurrentSub.maxLeft > (sub.left + (this.step * this.space))) {
                //   let newStart = sub.originStart +
                //     (Math.floor(sub.left - sub.originLeft) / this.space);
                //   newStart += this.step;
                //   newStart = newStart < 0 ? 0 : newStart;
                //   let newEnd = newStart + (sub.originEnd - sub.originStart);
                //   newStart = parseFloat(newStart.toFixed(2), 10);
                //   newEnd = parseFloat(newEnd.toFixed(2), 10);
                //   this.subtitleInstance.parsed.dialogues[sub.index].start = newStart;
                //   this.subtitleInstance.parsed.dialogues[sub.index].end = newEnd;
                //   this.$bus.$emit('modified-subtitle', { sub: this.subtitleInstance });
                //   this.hook = this.step;
                // }
                // const b = ((3 * this.winWidth) - ((left - this.currentLeft) + sub.width));
                // console.log(b, sub.minRight, b < (sub.minRight + (this.step * this.space)));
                // 精准吸附，但是步长加速度就会跳了。
                if (((3 * this.winWidth) - ((left - this.currentLeft) + sub.width)) <
                  (sub.minRight + (this.step * this.space))) {
                  this.createSubElement.style.position = 'absolute';
                  this.createSubElement.style.left = `${sub.maxLeft}px`;
                } else {
                  let newStart = sub.originStart +
                    (Math.floor(sub.left - sub.originLeft) / this.space);
                  newStart += this.step;
                  newStart = newStart < 0 ? 0 : newStart;
                  let newEnd = newStart + (sub.originEnd - sub.originStart);
                  newStart = parseFloat(newStart.toFixed(2), 10);
                  newEnd = parseFloat(newEnd.toFixed(2), 10);
                  const before = cloneDeep(this.subtitleInstance.parsed.dialogues[sub.index]);
                  this.subtitleInstance.parsed.dialogues[sub.index].start = newStart;
                  this.subtitleInstance.parsed.dialogues[sub.index].end = newEnd;
                  this.$bus.$emit('modified-subtitle', {
                    sub: this.subtitleInstance,
                    action: 'replace',
                    index: sub.index,
                    before,
                  });
                  this.hook = this.step;
                }
                // 时间轴往右运动一个步长
                this.$refs.timeLine.addEventListener('transitionend', this.timeLineTransitionend, false);
                this.$refs.timeLine.style.transition = 'left 0.2s ease-in-out';
                this.currentLeft -= this.step * this.space;
                this.preciseTime += this.step;
                this.lock = true;
                // this.step += 0.3; // 步长自增
              }
            }, this.animationTime);
          }
          this.subDragTimeLineMoving = true;
          this.subDragTimeLineMovingDirection = 'right';
        } else if ((this.subDragStartX + offset) < ((this.space / 5) * 2) &&
          sub.left < (0 - this.currentLeft)) {
          // 往左拖出窗口
          sub.right = sub.right > maxR ? maxR : sub.right;
          sub.left = (3 * this.winWidth) - (sub.right + sub.width);
          // 先隐藏当前字幕条DOM
          // subElement.style.opacity = '0';
          if (!this.subDragTimeLineMoving) {
            // 创建DOM副本
            const left = sub.left + this.currentLeft;
            this.createSubElement = document.createElement('div');
            this.createSubElement.setAttribute('style', `width: ${sub.width}px;
              position: fixed;
              top: ${((6 + ((sub.track - 1) * 4)) * this.vh) + 33}px;
              height: 3vh;
              max-height: 30px;
              z-index: 1;
              background: rgba(255,255,255,0.39);
              border: 1px solid rgba(255,255,255,0.46);
              border-radius: 1px;
              cursor: pointer;
              left: ${left}px`);
            // 插入拖拽的DOM镜像
            this.$refs.timeLine && this.$refs.timeLine.appendChild(this.createSubElement);
            // 开启定时运动
            this.timer = setInterval(() => {
              const distance = sub.minLeft - ((3 * this.winWidth) - bMaxR);
              // 当拖拽的字幕条已经快差一步就全部显示到窗口里面的时候
              // DOM镜像就定位到时间轴上面
              if ((distance + (this.step * this.space)) > 0) {
                this.createSubElement.style.position = 'absolute';
                this.createSubElement.style.left = `${(this.subDragCurrentSub.minLeft)}px`;
              }
              // 当拖拽的字幕条已经全部显示到窗口里面，就结束定时运动
              // 结束运动，就把镜像删掉，当前拖拽的字幕条显示
              if (distance > 0) {
                clearInterval(this.timer);
                this.timer = null;
                if (this.createSubElement) {
                  this.createSubElement.parentNode &&
                  this.createSubElement.parentNode.removeChild(this.createSubElement);
                  this.createSubElement = null;
                }
                this.subDragTimeLineMoving = false;
                sub.left = sub.minLeft;
                sub.right = (3 * this.winWidth) - (sub.left + sub.width);
                subElement.style.opacity = '1';
                subElement.style.left = `${sub.left}px`;
                subElement.style.right = `${sub.right}px`;
              } else {
                // 如果字幕条往左运动一个步长还不超出这个字幕的最左定位
                // 就让这个字幕条在时间轴上面往前加一步
                if (this.subDragCurrentSub.maxLeft > (sub.left + (this.step * this.space))) {
                  let newStart = sub.originStart +
                    (Math.floor(sub.left - sub.originLeft) / this.space);
                  newStart -= this.step;
                  newStart = newStart < 0 ? 0 : newStart;
                  let newEnd = newStart + (sub.originEnd - sub.originStart);
                  newStart = parseFloat(newStart.toFixed(2), 10);
                  newEnd = parseFloat(newEnd.toFixed(2), 10);
                  const before = cloneDeep(this.subtitleInstance.parsed.dialogues[sub.index]);
                  this.subtitleInstance.parsed.dialogues[sub.index].start = newStart;
                  this.subtitleInstance.parsed.dialogues[sub.index].end = newEnd;
                  this.$bus.$emit('modified-subtitle', {
                    sub: this.subtitleInstance,
                    action: 'replace',
                    index: sub.index,
                    before,
                  });
                }
                // 时间轴往左运动一个步长
                this.$refs.timeLine.addEventListener('transitionend', this.timeLineTransitionend, false);
                this.$refs.timeLine.style.transition = 'left 0.2s ease-in-out';
                this.currentLeft += this.step * this.space;
                this.preciseTime -= this.step;
                this.lock = true;
                this.step += 0.3; // 步长自增
              }
            }, this.animationTime);
          }
          this.subDragTimeLineMoving = true;
          this.subDragTimeLineMovingDirection = 'left';
        } else if (!this.lock) {
          // 字幕左右移动，并且没有时间轴在运动
          clearInterval(this.timer);
          this.timer = null;
          if (this.createSubElement) {
            // 如果字幕左右移动，但是当前镜像纯在
            // 字幕就定位到镜像的位置，然后删除镜像
            let left = parseInt(this.createSubElement.style.left, 10);
            left = this.createSubElement.style.position === 'absolute' ? left : left - this.currentLeft;
            this.createSubElement.parentNode &&
            this.createSubElement.parentNode.removeChild(this.createSubElement);
            this.createSubElement = null;
            sub.left = sub.left < left ? left : sub.left;
            sub.right = (3 * this.winWidth) - (sub.left + sub.width);
          }
          subElement.style.left = `${sub.left}px`;
          subElement.style.right = `${sub.right}px`;
          this.subDragTimeLineMoving = false;
          this.subDragTimeLineMovingDirection = '';
          this.step = 1;
        }
      } else if (this.subLeftDraging && subElement) {
        sub.left = pageX - (this.subDragStartOffsetLeft + this.currentLeft);
        sub.left = sub.left < sub.minLeft ? sub.minLeft : sub.left;
        const maxL = (sub.originLeft + sub.originWidth) - (0.2 * this.space);
        sub.left = sub.left > maxL ? maxL : sub.left;
        subElement.style.left = `${sub.left}px`;
        // if (!(offset < 0 && sub.left === sub.minLeft)) {
        //   sub.left += offset;
        //   sub.left = sub.left < sub.minLeft ? sub.minLeft : sub.left;
        //   const maxL = (sub.originLeft + sub.originWidth) - (0.2 * this.space);
        //   sub.left = sub.left > maxL ? maxL : sub.left;
        //   subElement.style.left = `${sub.left}px`;
        // }
      } else if (this.subRightDraging && subElement) {
        const l = pageX - (this.subDragStartOffsetLeft + this.currentLeft);
        sub.right = (3 * this.winWidth) - (l + sub.width);
        sub.right = sub.right < sub.minRight ? sub.minRight : sub.right;
        const maxR = sub.originRight + (sub.originWidth - (0.2 * this.space));
        sub.right = sub.right > maxR ? maxR : sub.right;
        subElement.style.right = `${sub.right}px`;
        // sub.right -= offset;
        // sub.right = sub.right < sub.minRight ? sub.minRight : sub.right;
        // const maxR = sub.originRight + (sub.originWidth - (0.2 * this.space));
        // sub.right = sub.right > maxR ? maxR : sub.right;
        // subElement.style.right = `${sub.right}px`;
      }
    },
    handleDragEndSub() {
      clearInterval(this.timer);
      this.timer = null;
      if ((this.subRightDraging || this.subLeftDraging || this.subDragMoving) && !this.lock) {
        this.finishSubDrag(this.subDragCurrentSub);
      }
    },
    finishSubDrag(sub) { // eslint-disable-line
      let newStart = 0;
      let newEnd = 0;
      if (this.subDragMoving) {
        if (sub.left > sub.maxLeft) {
          sub.left = sub.maxLeft;
        }
        newStart = sub.originStart +
          (Math.floor(sub.left - sub.originLeft) / this.space) + this.hook;
        newEnd = newStart + (sub.originEnd - sub.originStart);
        newStart = newStart < 0 ? 0 : newStart;
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
      if (newStart && newEnd && (newStart !== sub.originStart || newEnd !== sub.originEnd)) {
        const before = cloneDeep(this.subtitleInstance.parsed.dialogues[sub.index]);
        this.subtitleInstance.parsed.dialogues[sub.index].start = newStart;
        this.subtitleInstance.parsed.dialogues[sub.index].end = newEnd;
        this.$bus.$emit('modified-subtitle', {
          sub: this.subtitleInstance,
          action: 'replace',
          index: sub.index,
          before,
        });
      }
      // 拖拽字幕条结束，移除hover的UI
      // const className = `sub${sub.index === this.chooseIndexs ? ' focus' : ''}`;
      // this.subDragElement.setAttribute('class', className);
      this.subDragStartX = 0;
      this.subDragStartOffsetLeft = 0;
      this.subDragStartOffsetRight = 0;
      this.subDragMoving = false;
      this.subLeftDraging = false;
      this.subRightDraging = false;
      this.dragingMode = 'default';
      this.subDragTimeLineMoving = false;
      this.subDragTimeLineMovingDirection = '';
      this.step = 1;
      this.triggerCount += 1;
      if (this.createSubElement) {
        this.createSubElement.parentNode &&
        this.createSubElement.parentNode.removeChild(this.createSubElement);
        this.createSubElement = null;
      }
    },
    handleKeyDown(e) {
      if (e && (e.keyCode === 46 || e.keyCode === 8) && this.chooseIndexs !== -1) {
        const before = this.subtitleInstance.parsed.dialogues.splice(this.chooseIndexs, 1)[0];
        this.$bus.$emit('modified-subtitle', {
          sub: this.subtitleInstance,
          action: 'del',
          index: this.chooseIndexs,
          before,
        });
        this.chooseIndexs = -1;
        this.hoverIndex = -1;
      } else if (e && e.keyCode === 32 && this.spaceKeyPressStartTime === 0) {
        this.spaceKeyPressStartTime = Date.now();
        this.lastPaused = this.paused;
        !this.lastPaused && this.$bus.$emit('toggle-playback');
      }
    },
    handleKeyUp(e) {
      const distance = Date.now() - this.spaceKeyPressStartTime;
      if (e && e.keyCode === 32 && distance < 1000 && this.lastPaused) {
        // 触发暂停/播放
        this.$bus.$emit('toggle-playback');
      }
      this.spaceKeyPressStartTime = 0;
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
    getSecond(time) {
      if (time < 0) {
        return -1;
      } else if (time > this.duration) {
        return -1;
      }
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time - (hours * 3600)) / 60);
      let seconds = time - (hours * 3600) - (minutes * 60);
      seconds = Math.round(seconds);
      seconds = seconds < 10 ? `0${seconds}` : seconds;
      return seconds;
    },
    isHighlight(time) {
      return this.getSecond(time) % 10 === 0;
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
    handleClickProfessional() {
      // 如果退出高级模式，需要恢复原来播放尺寸
      // 进入高级模式，需要设定window的信息，在本组件的watch里
      this.toggleProfessional(false);
    },
    updateHistory(step) {
      if (this.currentIndex + 1 < this.history.length) {
        this.history.splice(this.currentIndex + 1);
      }
      this.history.push(step);
      this.currentIndex += 1;
    },
    undo() {
      const pick = this.history[this.currentIndex];
      if (pick && pick.type === 'add') {
        const sub = cloneDeep(this.subtitleInstance);
        sub.parsed.dialogues.splice(pick.index);
        this.$bus.$emit('modified-subtitle', {
          sub,
        });
        this.currentIndex -= 1;
      } else if (pick && pick.type === 'del') {
        const sub = cloneDeep(this.subtitleInstance);
        const before = {
          start: pick.before.start,
          end: pick.before.end,
          tags: pick.before.tags,
          text: pick.before.text,
          track: pick.before.track,
        };
        sub.parsed.dialogues.splice(pick.index, 0, before);
        this.$bus.$emit('modified-subtitle', {
          sub,
        });
        this.currentIndex -= 1;
      } else if (pick && pick.type === 'replace') {
        const sub = cloneDeep(this.subtitleInstance);
        const before = {
          start: pick.before.start,
          end: pick.before.end,
          tags: pick.before.tags,
          text: pick.before.text,
          track: pick.before.track,
        };
        sub.parsed.dialogues.splice(pick.index, 1, before);
        this.$bus.$emit('modified-subtitle', {
          sub,
        });
        this.currentIndex -= 1;
      }
    },
    redo() {
      const pick = this.history[this.currentIndex + 1];
      if (pick && pick.type === 'add') {
        const sub = cloneDeep(this.subtitleInstance);
        const after = {
          start: pick.after.start,
          end: pick.after.end,
          tags: pick.after.tags,
          text: pick.after.text,
          track: pick.after.track,
        };
        sub.parsed.dialogues.splice(pick.index, 0, after);
        this.$bus.$emit('modified-subtitle', {
          sub,
        });
        this.currentIndex += 1;
      } else if (pick && pick.type === 'del') {
        const sub = cloneDeep(this.subtitleInstance);
        sub.parsed.dialogues.splice(pick.index, 1);
        this.$bus.$emit('modified-subtitle', {
          sub,
        });
        this.currentIndex += 1;
      } else if (pick && pick.type === 'replace') {
        const sub = cloneDeep(this.subtitleInstance);
        const after = {
          start: pick.after.start,
          end: pick.after.end,
          tags: pick.after.tags,
          text: pick.after.text,
          track: pick.after.track,
        };
        sub.parsed.dialogues.splice(pick.index, 1, after);
        this.$bus.$emit('modified-subtitle', {
          sub,
        });
        this.currentIndex += 1;
      }
    },
  },
  destroyed() {
    document.removeEventListener('mousemove', this.handleDragingEditor);
    document.removeEventListener('mouseup', this.handleDragEndEditor);
    document.removeEventListener('mousemove', this.handleDragingSub);
    document.removeEventListener('mouseup', this.handleDragEndSub);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    // this.$bus.$off('modified-subtitle');
    // this.$bus.$off('modified-subtitle-bridge');
    // this.$bus.$off('seek');
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
    z-index: 11;
    background-image: radial-gradient(50% 136%, rgba(0,0,0,0.36) 50%, rgba(0,0,0,0.48) 100%);
    // background-color: rgba(0, 0, 0, .36);
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 6vh;
      right: 0;
      bottom: 0;
      background-image: url(../../assets/subtitle-editor-dot.svg);
      // background-image: image-set( url(../../assets/dot.png) 1x, url(../../assets/dot2x.png) 2x );
      // background-image: -webkit-image-set( url(../../assets/dot.png) 1x, url(../../assets/dot2x.png) 2x );
      background-repeat: repeat-x;
      background-position: center 0;
      z-index: -1;
      opacity: 0.3;
    }
  }
  .sub-editor-head {
    // height: 25vh;
    position: relative;
    &:after {
      content: "";
      width: 0.5px;
      // height: calc(15.75vh)
      height: calc(9vh + 35px);
      max-height: 125px;
      position: absolute;
      top: 0;
      left: 50%;
      z-index: 9999;
      transform: translateX(-50%);
      background: rgba(216,216,216,0.8);
      border: 0.5px solid rgba(255,255,255,0.10);
      box-shadow: 0 0 2px 0 rgba(255,255,255,0.50);
      border-radius: 0 0 1px 1px;
      border-top-width: 0;
      // background-color: #d8d8d8;
      // box-shadow: 0 0 1px 0 rgba(255,255,255,0.50);
      // border-radius: 0 0 1px 1px;
    }
  }
  .sub-editor-time-line {
    width: 100%;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 2;
    cursor: grab;
    // cursor: pointer;
    // background-color: aquamarine;
    .scales {
      display: flex;
      align-items: center;
      width: 100%;
      height: 6vh;
      max-height: 60px;
      &::before {
        content: "";
        width: 100%;
        position: absolute;
        left: 0;
        top: 0;
        display: block;
        height: 6vh;
        max-height: 60px;
        backdrop-filter: blur(4px); 
        background: rgba(255,255,255,0.06);
        transition: background 0.2s ease-in-out;
      }
      &:hover {
        &::before {
          background: rgba(255,255,255,0.10);
        }
      }
    }
    .scale {
      height: 100%;
      display: flex;
      position: relative;
      align-items: center;
      color: #ffffff;
      opacity: 0.4;
      font-weight: 300;
      font-size: 2.2vh;
      &.highlight {
        // font-size: 14px;
        opacity: 0.7;
        font-weight: 800;
      }
      &.illegal {
        &::before, &::after, i, span {
          display: none;
        }
      }
      &::before {
        content: "";
        width: 100%;
        height: 1px;
        position: absolute;
        left: -1px;
        bottom: 0;
        border-left: 0.5px solid #ffffff;
        border-right: 0.5px solid #ffffff;
      }
      &::after {
        content: "";
        width: 20%;
        height: 1px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 0;
        border-left: 0.5px solid rgba(255,255,255,0.5);
        border-right: 0.5px solid rgba(255,255,255,0.5);
      }
      i {
        width: 60%;
        height: 1px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 0;
        border-left: 0.5px solid rgba(255,255,255,0.5);
        border-right: 0.5px solid rgba(255,255,255,0.5);
      }
      span {
        transform: translate(calc(-0.5px - 50%), 1px);
      }
    }
    .sub {
      position: absolute;
      top: 12vh;
      height: 3vh;
      max-height: 30px;
      z-index: 1;
      background: rgba(255,255,255,0.20);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 2px;
      transition: background 0.1s ease-in-out, border 0.1s ease-in-out;
      // &::before {
      //   content: "";
      //   width: 50%;
      //   height: 80%;
      //   position: absolute;
      //   left: 50%;
      //   top: 50%;
      //   transform: translate(-50%, -55%);
      //   background-image: url(../../assets/subtitle-editor-drag.svg);
      //   background-repeat: no-repeat;
      //   background-size: 100% 100%;
      //   background-position: center;
      //   opacity: 0;
      //   // transition: all 0.3s ease-in-out;
      // }
      &.focus {
        background: rgba(255,255,255,0.50);
        border-color: rgba(255,255,255,0.15);
        // &::before {
        //   opacity: 1;
        // }
      }
      &.hover {
        border-color: rgba(255,255,255,0.40);
        // &::before {
        //   // opacity: 1;
        // }
      }
      &.choose {
        // background: rgba(255,255,255,0.39);
        border-color: rgba(255,255,255,0.70);
      }
      &.resize {
        cursor: col-resize;
      }
      &.draging {
        cursor: grabbing;
        border-color: rgba(255,255,255,0.70);
        // &::before {
        //   // opacity: 1;
        // }
      }
      .drag-left {
        position: absolute;
        width: 5%;
        height: 100%;
        left: 0;
        top: 0;
        z-index: 1;
        cursor: col-resize;
        &.grabbing {
          cursor: grabbing;
        }
      }
      .drag-right {
        position: absolute;
        width: 5%;
        height: 100%;
        right: 0;
        top: 0;
        z-index: 1;
        cursor: col-resize;
        &.grabbing {
          cursor: grabbing;
        }
      }
    }
  }
  .exit-btn-wrap {
    width: 6vh; 
    height: 6vh;
    max-width: 60px;
    max-height: 60px;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(3px);
    background: rgba(255,255,255,0.1);
    transition: background 0.2s ease-in-out;
    &:hover {
      background: rgba(255,255,255,0.2);
    }
    .subtitle-editor-exit {
      width: 60%;
      height: 60%;
    }
  }
  .sub-editor-foot {
    .timing {
      &:hover {
        cursor: default;
      }
    }
  }
</style>
