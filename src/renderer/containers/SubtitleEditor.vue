<template>
  <div>
    <transition name="fade">
      <div
        v-if="isProfessional"
        @mouseup.stop="handleEditorMouseUp"
        :style="{
          cursor: dragingMode
        }"
        class="sub-editor"
      >
        <div class="sub-editor-head">
          <div
            ref="timeLine"
            @mousedown.left.stop="handleDragStartTimeLine"
            @mousemove.left="handleDragingTimeLine"
            @mouseup.left.stop="handleDragEndTimeLine"
            :style="{
              width: `${3 * winWidth}px`,
              left: `${currentLeft}px`,
              cursor: dragingMode !== 'default' ? dragingMode : 'grab',
            }"
            class="sub-editor-time-line no-drag"
          >
            <div
              :class="'scales'+`${timeLineHover ? ' hover' : ''}`"
              :style="{
                width: `${scales * space}px`
              }"
              @mouseenter.stop="handleTimeLineHoverIn"
              @mouseleave.stop="handleTimeLineHoverOut"
            >
              <div
                v-for="(time) in times"
                :key="time"
                :class="'scale' + validityTime(time) + `${isHighlight(time) ? ' highlight' : ''}`"
                :style="{
                  width: `${space}px`,
                  fontSize: winHeight > 1000 ? '22px': '2.1vh',
                }"
              >
                <i />
                <span>{{ isHighlight(time) ? transcode(time) : getSecond(time) }}</span>
              </div>
            </div>
            <div
              ref="subtitles"
              class="subtitles"
            >
              <div
                v-for="sub in validitySubs"
                :key="`${sub.width}-${sub.index}-${sub.track}-${sub.text}`"
                v-show="!(!paused && sub.reference)"
                @mouseover.stop="handleHoverIn($event, sub)"
                @mouseleave.stop="handleHoverOut($event, sub)"
                @mousedown.left.stop="handleDragStartSub($event, sub)"
                @mousemove.left="handleDragingSub($event, sub)"
                @mouseup.left="handleDragEndSub($event, sub)"
                @dblclick.left.stop="handleDoubleClickSub($event, sub)"
                :class="computedSubClass(sub)+' no-drag sub-mark'
                  +`${sub.focus && !sub.reference ? ' focus' : ''}`
                  +`${sub.reference ? ' reference' : ''}`"
                :style="{
                  left: `${sub.left}px`,
                  right: `${sub.right}px`,
                  top: `${((6 + (sub.track - 1) * 4) * vh) + 33}px`,
                  display: sub.opacity === 0 ? 'none' : 'block',
                  cursor: dragingMode !== 'default' ? dragingMode : 'grab'
                }"
              >
                <i
                  :style="{
                    cursor: dragingMode !== 'default' ? dragingMode : 'col-resize'
                  }"
                  class="drag-left no-drag"
                />
                <i
                  :style="{
                    cursor: dragingMode !== 'default' ? dragingMode : 'col-resize'
                  }"
                  class="drag-right no-drag"
                />
              </div>
            </div>
          </div>
          <div
            :class="'exit-btn-wrap'+`${exitBtnHover ? ' hover' : ''}`
              +`${isSpaceDownInProfessional ? ' mask' : ''}`"
            v-fade-in="!(isDragableInProfessional)"
            @mouseenter.stop="handleExitBtnHoverIn"
            @mouseleave.stop="handleExitBtnHoverOut"
            @click.stop="handleClickProfessional"
            :style="{
              cursor: dragingMode !== 'default' ? dragingMode : 'pointer'
            }"
          >
            <Icon
              type="subtitleEditorExit"
              class="subtitle-editor-exit"
            />
          </div>
        </div>
        <div class="sub-editor-body">
          <subtitle-renderer
            :key="originSrc"
            :currentCues="currentProfessionalCues"
            :subPlayRes="[]"
            :scaleNum="scaleNum"
            :subToTop="false"
            :currentFirstSubtitleId="primarySubtitleId"
            :currentSecondarySubtitleId="secondarySubtitleId"
            :winHeight="winHeight"
            :chosenStyle="chosenStyle"
            :chosenSize="chosenSize"
            :paused="paused"
            :professional="isProfessional"
            :disableQuickEdit="disableQuickEdit"
            :enabledSecondarySub="enabledSecondarySub"
            :referenceHTML="referenceHTML"
            @update:textarea-change="handleTextAreaChange"
          />
        </div>
        <div class="sub-editor-foot">
          <div class="times-wrap">
            <div class="cont">
              <div
                :style="{
                  cursor: dragingMode
                }"
                class="timing"
              >
                <span class="timeContent">{{ transcode(preciseTime, 1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div
        v-if="isProfessional"
        :class="'drag-mask no-drag'+`${spaceKeyPressStartTime > 0 ? ' active' : ''}`"
        @mousedown.left.stop="handleDragStartEditor"
        @mousemove.left="handleDragingEditor"
        @mouseup.left.stop="handleDragEndEditor"
        :style="{
          cursor: dragingMode !== 'default' ? dragingMode : 'grab',
        }"
      />
    </transition>
    <transition name="fade">
      <div
        v-if="!isProfessional"
      >
        <subtitle-renderer
          :key="originSrc"
          :currentCues="concatCurrentCues"
          :subPlayRes="subPlayRes"
          :scaleNum="scaleNum"
          :subToTop="subToTop"
          :currentFirstSubtitleId="primarySubtitleId"
          :currentSecondarySubtitleId="secondarySubtitleId"
          :winHeight="winHeight"
          :chosenStyle="chosenStyle"
          :chosenSize="chosenSize"
          :paused="paused"
          :professional="isProfessional"
          :disableQuickEdit="disableQuickEdit"
          :enabledSecondarySub="enabledSecondarySub"
          @update:textarea-change="handleTextAreaChange"
        />
      </div>
    </transition>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { mapGetters, mapMutations, mapActions } from 'vuex';
import { cloneDeep } from 'lodash';
import {
  EVENT_BUS_COLLECTIONS as bus,
  MODIFIED_SUBTITLE_TYPE,
} from '@/constants';
import { videodata } from '@/store/video';
import {
  SubtitleManager as smActions,
  Editor as seActions,
} from '@/store/actionTypes';
import { Editor as editorMutations, Input as inputMutations } from '@/store/mutationTypes';
import {
  Cue, EditCue, ModifiedSubtitle,
} from '@/interfaces/ISubtitle';
import SubtitleRenderer from '@/components/Subtitle/SubtitleRenderer.vue';
import Icon from '@/components/BaseIconContainer.vue';
import { log } from '../libs/Log';

export default Vue.extend({
  name: 'SubtitleEditor',
  components: {
    SubtitleRenderer,
    Icon,
  },
  data() {
    return {
      currentCues: [
        {
          cues: [],
          subPlayResX: 720,
          subPlayResY: 405,
        },
        {
          cues: [],
          subPlayResX: 720,
          subPlayResY: 405,
        },
      ], // 正常显示
      screens: 3, // 刻度的长度，几倍窗口长度
      hoverIndex: -1, // 目前鼠标hover的字幕条索引
      currentLeft: 0, // 时间轴左偏移 --|-.-|--
      editorCurrentTime: 0, // 当前时间轴中分时间刻度，时间轴的中心时间不一定是播放的时间
      preciseTime: 0, // 当前视频的播放时间
      timeLineDraging: false, // 标记是否是拖拽时间轴
      dragStartX: 0, // 标记拖拽时间轴起始位置
      dragStartLeft: 0, // 标记开始拖拽当前时间轴left
      dragStartTime: 0, // 标记开始拖拽时间轴当前播放时间
      timeLineClickLock: false, // 点击时间轴刻度反应的延迟时间内，锁住点击事件
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
      dragingMode: 'default', // 光标类型
      spaceKeyPressStartTime: 0, //
      lastPaused: false, //
      tags: {},
      firstTags: {},
      transitionInfo: null, // 时间轴动画中，包括动画end 需要的数据
      matchSwitchReferenceBubble: null, // 当切换参考字幕的时候，记录当前是否有气泡
      protectKeyWithEnterShortKey: false, // 保护回车选择前
      timeLineHover: false,
      exitBtnHover: false,
    };
  },
  computed: {
    ...mapGetters([
      'winWidth', 'winHeight', 'duration', 'paused', 'isCreateSubtitleMode', 'originSrc', 'referenceSubtitle', 'currentEditedSubtitle',
      'winRatio', 'computedHeight', 'computedWidth',
      'messageInfo', 'isDragableInProfessional', 'chooseIndex', 'currentTime', 'isSpaceDownInProfessional',
      'isEditable', 'autoFocus', 'isProfessional', 'professionalDialogues', 'referenceDialogues', 'storedBeforeProfessionalInfo', 'referenceOriginDialogues',
      'scaleNum', 'subToTop', 'primarySubtitleId', 'secondarySubtitleId', 'chosenStyle', 'chosenSize', 'enabledSecondarySub',
      'disableQuickEdit',
    ]),
    concatCurrentCues() {
      if (this.currentCues.length === 2) {
        const left = this.currentCues[0].cues
          .map((e: Cue, i: number) => Object.assign(e, { index: i }));
        left.sort((p: Cue, n: Cue) => (p.start - n.start));
        const right = this.currentCues[1].cues
          .map((e: Cue, i: number) => Object.assign(e, { index: i }));
        right.sort((p: Cue, n: Cue) => (p.start - n.start));
        return [left, right];
      }
      return [];
    },
    subPlayRes() {
      if (this.currentCues.length === 2) {
        return [
          { x: this.currentCues[0].subPlayResX, y: this.currentCues[0].subPlayResY },
          { x: this.currentCues[1].subPlayResX, y: this.currentCues[1].subPlayResY },
        ];
      }
      return [];
    },
    computedSize() {
      // zoom依赖的计算属性
      return this.winRatio >= 1 ? this.computedHeight : this.computedWidth;
    },
    vh() {
      // vh单位px化
      return this.winHeight / 100 > 10 ? 10 : Math.abs(this.winHeight / 100);
    },
    inputWitdh() { // eslint-disable-line
      const winRatio = this.winRatio;
      const width = this.winWidth;
      const height = this.winHeight;
      let computed = width;
      if ((winRatio >= 1 && height > 1080) || (winRatio < 1 && width > 1080)) {
        computed = width - (2 * 305);
      } else if ((winRatio >= 1 && height > 481) || (winRatio < 1 && width > 481)) {
        computed = width - (2 * 197);
      } else if ((winRatio >= 1 && height > 289) || (winRatio < 1 && width > 289)) {
        computed = width - (2 * 140);
      }
      return computed;
    },
    scales() {
      return Math.ceil((this.screens * this.winWidth) / this.space);
    },
    offset() {
      return Math.ceil((this.screens * this.winWidth) / (this.space * 2));
    },
    times() {
      return [...Array(this.scales).keys()]
        .map(e => (this.editorCurrentTime * 1) + ((e * 1) - this.offset));
    },
    filterSubs() {
      // filterSubs 是当前编辑字幕和参考字幕的组合，过滤掉位置不是alignment2且有定位的字幕
      const referenceFilters = cloneDeep(this.referenceDialogues)
        .map((
          e: Cue, i: number,
        ) => Object.assign({ reference: true }, e, { selfIndex: i }));
      const currentDialogues = cloneDeep(this.professionalDialogues)
        .map((e: Cue, i: number) => Object.assign(e, { selfIndex: i }));
      return currentDialogues
        .concat(referenceFilters)
        .map((
          e: Cue, i: number,
        ) => ({ ...e, index: i }))
        .sort((p: Cue, n: Cue) => (p.start - n.start))
        .filter((e: Cue) => e.tags && !(e.tags.pos || e.tags.alignment !== 2));
    },
    validitySubs() {
      // 在filterSubs 基础上，筛选出在时间轴中的字幕
      // 每个字幕添加了必要的属性用来处理边缘等等计算的逻辑
      const filters = this.filterSubs.filter((
        e: Cue,
      ) => e.end > (this.preciseTime - this.offset) && e.start < (this.preciseTime + this.offset));
      // console.log(filters);
      return filters.map((e: Cue, i: number) => { // eslint-disable-line
        // 这里可以直接取fragments，因为在filterSubs里面，已经过滤掉没有fragments的数据了
        const text = e.text;
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
        left = parseFloat(left.toFixed(2));
        right = parseFloat(right.toFixed(2));
        width = parseFloat(width.toFixed(2));
        minLeft = parseFloat(minLeft.toFixed(2));
        maxLeft = parseFloat(maxLeft.toFixed(2));
        minRight = parseFloat(minRight.toFixed(2));
        maxRight = parseFloat(maxRight.toFixed(2));
        let opacity = 1;
        if (this.subDragTimeLineMoving && this.subDragCurrentSub
          && e.index === this.subDragCurrentSub.index) {
          opacity = 0;
          this.subDragCurrentSub.minLeft = minLeft; // eslint-disable-line
          this.subDragCurrentSub.maxLeft = maxLeft; // eslint-disable-line
          this.subDragCurrentSub.minRight = minRight; // eslint-disable-line
          this.subDragCurrentSub.maxRight = maxRight; // eslint-disable-line
          this.subDragCurrentSub.originStart = e.start; // eslint-disable-line
          this.subDragCurrentSub.originEnd = e.end; // eslint-disable-line
          this.subDragCurrentSub.originLeft = left; // eslint-disable-line
          this.subDragCurrentSub.originRight = right; // eslint-disable-line
          this.subDragCurrentSub.originWidth = width; // eslint-disable-line
        }

        return Object.assign({
          triggerCount: this.triggerCount,
        }, e, {
          originStart: e.start, // 记录原始起始时间
          originEnd: e.end, // 记录原始结束时间
          minLeft, // 记录字幕left 最小值
          maxLeft, // 记录字幕left 最大值
          minRight, // 记录字幕right 最大值
          maxRight, // 记录字幕right 最大值
          left,
          right,
          width,
          originLeft: left,
          originRight: right,
          originWidth: width,
          text,
          focus, // 是否是当前播放的字幕
          opacity, // 当字幕拖出边框，需要fixed -> absolute创建镜像是，当前字幕隐藏
        });
      });
    },
    currentSub() {
      // 当前指针下字幕
      return this.validitySubs
        .filter((
          e: Cue,
        ) => e.start <= this.preciseTime && e.end > this.preciseTime);
    },
    currentProfessionalCues() {
      const currentSubs = cloneDeep(this.currentSub);
      const canChooseSubs = currentSubs.filter((e: Cue) => e.track === 1);
      if (canChooseSubs.length > 0) {
        return [currentSubs, []];
      }
      if (this.preciseTime < 0.2) {
        return [currentSubs, []];
      }
      const last = this.filterSubs
        .slice()
        .reverse()
        .find((e: Cue) => e.end < this.preciseTime && e.track === 1);
      const hook = {
        start: this.preciseTime,
        end: 0,
        distance: this.preciseTime - 0,
        tags: {
          alignment: 2,
          pos: null,
        },
        text: '',
        index: -1,
        track: 1,
      };
      if (last && (this.preciseTime - last.end) > 0.2) {
        hook.distance = this.preciseTime - last.end;
        return [currentSubs.concat([hook]), []];
      }
      if (last) {
        return [currentSubs, []];
      }
      return [currentSubs.concat([hook]), []];
    },
    showAddInput() {
      const cues = this.currentProfessionalCues[0];
      if (cues.length > 0 && cues[cues.length - 1].index === -1) {
        return true;
      }
      const canChooseSubs = cues.filter((e: Cue) => e.track === 1);
      return canChooseSubs.length < 1;
    },
    referenceHTML() {
      if (this.isProfessional) {
        const filter = this.referenceOriginDialogues
          .filter((c: Cue) => c.start <= this.preciseTime && c.end > this.preciseTime
            && (c.tags && !(c.tags.pos || c.tags.alignment !== 2)));
        return filter.length === 0 ? '' : filter.map((c: Cue) => c.text).join('<br>');
      }
      return '';
    },
  },
  watch: {
    async primarySubtitleId() {
      this.currentCues = await this.getCues(videodata.time);
    },
    async secondarySubtitleId() {
      this.currentCues = await this.getCues(videodata.time);
    },
    paused(val: boolean) {
      requestAnimationFrame(this.updateWhenPlaying);
      if (!val) {
        this.triggerCount += 1;
        this.updateChooseIndex(-2);
        this.updateAutoFocus(false);
      } else {
        this.resetCurrentTime();
        setImmediate(() => {
          // 处理暂停播放，0.2s跳的问题
          const b = document.getElementsByTagName('video')[0];
          const currentTime = b.currentTime;
          b.currentTime = currentTime + 0.007;
        });
        const canChooseSubs = this.currentSub.filter((
          e: Cue,
        ) => e.track === 1);
        if (canChooseSubs.length > 0) {
          setImmediate(() => {
            this.updateChooseIndex(canChooseSubs[0].index);
          });
        }
      }
    },
    currentTime(v: number) {
      if (!this.timeLineDraging) {
        if (v < 0) {
          v = 0;
        } else if (v > this.duration) {
          v = this.duration;
        }
        this.resetCurrentTime(v);
      }
    },
    currentLeft() {
      if (!(this.protectKeyWithEnterShortKey || this.isEditable)) {
        this.updateChooseIndex(-2);
      }
    },
    currentSub(val) {
      const canChooseSubs = val.filter((e: Cue) => e.track === 1);
      this.enableMenuEnter(canChooseSubs.length > 0 || this.showAddInput);
      if (!this.protectKeyWithEnterShortKey && canChooseSubs.length > 0
        && this.paused && this.chooseIndex < 0) {
        this.updateChooseIndex(canChooseSubs[0].index);
      }
    },
    showAddInput(val) {
      // 当前没有字幕条也不能新增字幕的时候就禁用菜单的进入编辑
      const canChooseSubs = this.currentSub.filter((e: Cue) => e.track === 1);
      this.enableMenuEnter(val || canChooseSubs.length > 0);
    },
    winWidth() {
      // 当resize的时候，重新render timeline
      this.resetCurrentTime();
    },
    isProfessional(isProfessional: boolean) {
      // 处理最小尺寸设置
      let minSize = [];
      const store = this.storedBeforeProfessionalInfo;
      const winRatio = this.winRatio;
      if (!isProfessional && store && store.minimumSize) {
        minSize = store.minimumSize;
      } else if (!isProfessional) {
        this.toggleEditable(false);
        this.updateAutoFocus(false);
      } else if (isProfessional) {
        // 进入编辑模式，设定phase2为最小的尺寸
        minSize = winRatio > 1 ? [480 * winRatio, 480] : [480, 480 / winRatio];
        minSize = minSize.map(Math.round);
        if ((winRatio > 1 && this.winHeight < 480)
          || (winRatio <= 1 && this.winWidth < 480)) {
          this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', minSize);
        }
      }
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', minSize);
      // this.windowMinimumSize(minSize);
      // 处理phase2以下的尺寸，进入高级模式，拉大窗口
    },
    professionalDialogues() {
      this.clearDom();
    },
    filterSubs(v) {
      const preciseTime = this.preciseTime;
      const prevs = v.filter((e: Cue) => e.start < preciseTime && e.track === 1);
      this.enableMenuPrev(prevs.length > 0);
      const next = v.filter((e: Cue) => e.start > preciseTime && e.track === 1);
      this.enableMenuNext(next.length > 0);
    },
    preciseTime(v) {
      const prevs = this.filterSubs.filter((e: Cue) => e.start < v && e.track === 1);
      this.enableMenuPrev(prevs.length > 0);
      const next = this.filterSubs.filter((e: Cue) => e.start > v && e.track === 1);
      this.enableMenuNext(next.length > 0);
    },
  },
  mounted() {
    this.resetCurrentTime();
    // 初始化组件
    document.addEventListener('mousemove', this.handleDragingEditor);
    document.addEventListener('mouseup', this.handleDragEndEditor);
    document.addEventListener('mousemove', this.handleDragingTimeLine);
    document.addEventListener('mouseup', this.handleDragEndTimeLine);
    // sub
    document.addEventListener('mousemove', this.handleDragingSub);
    document.addEventListener('mouseup', this.handleDragEndSub);
    // 键盘事件
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    // 快捷键J，上一个字幕
    this.$bus.$on(bus.SUBTITLE_EDITOR_SELECT_PREV_SUBTITLE, () => {
      const prevs = this.filterSubs.filter((e: Cue) => e.start < this.preciseTime && e.track === 1);
      if (prevs && prevs[prevs.length - 1] && !this.paused) {
        // 在播放状态下，J 先pause 再seek到前面,
        const seekTime = prevs[prevs.length - 1].start;
        this.$bus.$emit('toggle-playback');
        this.$bus.$emit('seek', seekTime);
      } else if (prevs && prevs[prevs.length - 1]) {
        // 暂停状态下，J position到前面
        this.handleDoubleClickSub(null, prevs[prevs.length - 1]);
      }
    });
    // 快捷键K，下一个字幕
    this.$bus.$on(bus.SUBTITLE_EDITOR_SELECT_NEXT_SUBTITLE, () => {
      const prevs = this.filterSubs.filter((e: Cue) => e.start > this.preciseTime && e.track === 1);
      if (prevs && prevs[0] && !this.paused) {
        const seekTime = prevs[0].start;
        this.$bus.$emit('toggle-playback');
        this.$bus.$emit('seek', seekTime);
      } else if (prevs && prevs[0]) {
        this.handleDoubleClickSub(null, prevs[0]);
      }
    });
    // 快捷键Enter，快速输入
    this.$bus.$on(bus.SUBTITLE_EDITOR_FOCUS_BY_ENTER, () => {
      if (this.isSpaceDownInProfessional || this.isDragableInProfessional) return;
      const show = () => {
        const currentChooseSub = this.validitySubs
          .find((e: Cue) => e.index === this.chooseIndex);
        const currentSub = this.currentSub.find((e: Cue) => e.track === 1);
        if (currentChooseSub && !currentSub) {
          this.protectKeyWithEnterShortKey = true;
          this.handleDoubleClickSub(null, currentChooseSub);
        } else if (currentChooseSub && currentSub && currentSub.index !== currentChooseSub.index) {
          this.protectKeyWithEnterShortKey = true;
          this.handleDoubleClickSub(null, currentChooseSub);
        } else if (currentSub) {
          this.updateChooseIndex(currentSub.index);
          this.updateAutoFocus(true);
          // this.handleDoubleClickSub(null, currentSub);
        } else if (this.showAddInput) {
          log.debug('SUBTITLE_EDITOR_FOCUS_BY_ENTER', 1);
          this.updateChooseIndex(-1);
          this.updateAutoFocus(true);
        }
      };
      if (!this.autoFocus) {
        if (!this.paused) {
          this.$bus.$emit('toggle-playback');
          // this.$nextTick(show);
          // setImmediate(show);
          setTimeout(show, 100);
        } else {
          show();
        }
      }
    });
  },
  beforeDestroy() {
    const matchSwitchReferenceBubble = this.matchSwitchReferenceBubble;
    if (matchSwitchReferenceBubble && matchSwitchReferenceBubble.id) {
      this.removeMessages(this.matchSwitchReferenceBubble.id);
    }
  },
  destroyed() {
    document.removeEventListener('mousemove', this.handleDragingEditor);
    document.removeEventListener('mouseup', this.handleDragEndEditor);
    document.removeEventListener('mousemove', this.handleDragingTimeLine);
    document.removeEventListener('mouseup', this.handleDragEndTimeLine);
    // sub
    document.removeEventListener('mousemove', this.handleDragingSub);
    document.removeEventListener('mouseup', this.handleDragEndSub);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.$bus.$off(bus.SUBTITLE_EDITOR_SELECT_PREV_SUBTITLE);
    this.$bus.$off(bus.SUBTITLE_EDITOR_SELECT_NEXT_SUBTITLE);
    this.$bus.$off(bus.SUBTITLE_EDITOR_FOCUS_BY_ENTER);
  },
  methods: {
    ...mapMutations({
      toggleSpaceDown: editorMutations.TOGGLE_SPACE_DOWN_IN_PROFESSIONAL,
      toggleDragable: editorMutations.TOGGLE_DRAGABLE_IN_PROFESSIONAL,
      swicthReferenceSubtitle: editorMutations.SWITCH_REFERENCE_SUBTITLE,
      updateCurrentEditedSubtitle: editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE,
      enableMenuEnter: editorMutations.UPDATE_CURRENT_EDIT_MENU_ENTER_ENABLE,
      enableMenuPrev: editorMutations.UPDATE_CURRENT_EDIT_MENU_PREV_ENABLE,
      enableMenuNext: editorMutations.UPDATE_CURRENT_EDIT_MENU_NEXT_ENABLE,
      updateChooseIndex: editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX,
      updateAutoFocus: editorMutations.UPDATE_AUTO_FOCUS,
      updateMouseUp: inputMutations.MOUSEUP_COMPONENT_NAME_UPDATE,
    }),
    ...mapActions({
      addMessages: 'addMessages',
      removeMessages: 'removeMessages',
      getCues: smActions.getCues,
      updatePlayTime: smActions.updatePlayedTime,
      toggleProfessional: seActions.TOGGLE_PROFESSIONAL,
      convertSubtitle: seActions.SUBTITLE_CONVERT_TO_MODIFIED,
      modifiedSubtitle: seActions.SUBTITLE_MODIFIED,
      closeProfessional: seActions.TOGGLE_PROFESSIONAL,
    }),
    async loopCues() {
      if (!(this.isEditable || this.isProfessional)) {
        const cues = await this.getCues(videodata.time);
        this.updatePlayTime({ start: this.time, end: videodata.time });
        this.currentCues = cloneDeep(cues);
      }
    },
    clearDom() {
      // hooks for clear doms
      if (this.createSubElement && !this.subDragTimeLineMoving) {
        this.createSubElement.parentNode
        && this.createSubElement.parentNode.removeChild(this.createSubElement);
        this.createSubElement = null;
      }
    },
    zoom(i: number) {
      // update video scale that width is larger than height
      const updatePCVideoScaleByFactors = (index: number) => {
        const firstFactors = [13, 21, 29, 37, 45];
        const secondFactors = [22, 24, 26, 28, 30];
        return `${(((firstFactors[index] / 900) * this.computedSize) + (secondFactors[index] / 5)) / 9}`;
      };
      // update video scale that height is larger than width
      const updateMobileVideoScaleByFactors = (index: number) => {
        const firstFactors = [13, 21, 29, 37, 45];
        const secondFactors = [116, 12, -92, -196, -300];
        return `${(((firstFactors[index] / 760) * this.computedSize) + (secondFactors[index] / 76)) / 9}`;
      };
      // update video scale when width or height is larger than 1080
      const updateVideoScaleByFactors = (val: number) => {
        const factors = [20, 30, 40, 50, 60];
        return `${((val / 1080) * factors[i]) / 9}`;
      };
      if (this.computedSize >= 1080) {
        return updateVideoScaleByFactors(this.computedSize);
      } if (this.winRatio >= 1) {
        return updatePCVideoScaleByFactors(i);
      }
      return updateMobileVideoScaleByFactors(i);
    },
    getCurrentReferenceCues() {
      // 获取参考字幕的内容
      const instance = this.referenceSubtitleInstance;
      if (instance && instance.parsed && instance.parsed.dialogues) {
        const filter = instance.parsed.dialogues.filter((e: Cue) => {
          const isInRange = e.start <= this.preciseTime && e.end > this.preciseTime;
          if (!isInRange) return false;
          return e.tags && !(e.tags.pos || e.tags.alignment !== 2);
        });
        return filter.map((e: Cue) => e.text).join('<br>');
      }
      return '<br>';
    },
    validityTime(time: number) {
      return time >= 0 && time <= this.duration ? '' : ' illegal';
    },
    createMirrorSubtitle(modified: ModifiedSubtitle) {
      this.createSubElement = document.createElement('div');
      const currentLeft = (modified.cue.end - this.times[0]) * this.space;
      const targetLeft = (modified.cue.start - this.times[0]) * this.space;
      const currentRight = (3 * this.winWidth) - currentLeft;
      this.createSubElement.setAttribute('style', `
        position: absolute;
        top: ${(6 * this.vh) + 33}px;
        height: 3vh;
        max-height: 30px;
        z-index: 1;
        background: rgba(255,255,255,0.24);
        // backdrop-filter: blur(10px);
        border: 2px solid rgba(255,255,255,0.15);
        border-radius: 2px;
        box-sizing: border-box;
        left: ${currentLeft}px;
        right: ${currentRight}px`);
      this.$refs.subtitles && this.$refs.subtitles.appendChild(this.createSubElement);
      this.createSubElement.style.transition = 'all 0.3s ease-in-out';
      this.createSubElement.addEventListener('transitionend', (e: TransitionEvent) => {
        if (e.propertyName === 'left') {
          this.afterMirrorSubtitleAnimation(modified);
        }
      }, false);
      setImmediate(() => {
        this.createSubElement.style.left = `${targetLeft}px`;
      });
    },
    afterMirrorSubtitleAnimation(modified: ModifiedSubtitle) {
      // 新增字幕，动画结束，触发modified-subtitle事件
      this.modifiedSubtitle(modified);
    },
    resetCurrentTime(currentTime: number) {
      // 同步时间轴中位时间和当前播放时间
      if (typeof currentTime === 'undefined') {
        const b = document.getElementsByTagName('video')[0];
        currentTime = b ? b.currentTime : videodata.time;
      }
      currentTime = parseFloat(currentTime.toFixed(4));
      this.editorCurrentTime = Math.trunc(currentTime);
      this.preciseTime = currentTime;
      this.currentLeft = ((this.editorCurrentTime - currentTime) * this.space)
      - ((this.offset * this.space) - (this.winWidth / 2));
    },
    updateWhenPlaying() { // eslint-disable-line
      if (!this.paused) {
        // 播放中，时间轴同步运动，当时间轴中位时间和当前播放时间相差一屏宽度时，重新设置时间轴中位时间
        const b = document.getElementsByTagName('video')[0];
        let currentTime = b.currentTime;
        currentTime = parseFloat(currentTime.toFixed(4));
        if (Math.abs(currentTime - this.editorCurrentTime) * this.space >= this.winWidth) {
          this.editorCurrentTime = Math.trunc(currentTime);
        }
        this.currentLeft = ((this.editorCurrentTime - currentTime) * this.space)
        - ((this.offset * this.space) - (this.winWidth / 2));
        this.preciseTime = currentTime;
        requestAnimationFrame(this.updateWhenPlaying);
      }
    },
    handleTimeLineHoverIn() {
      if (!this.isSpaceDownInProfessional) {
        this.timeLineHover = true;
      }
    },
    handleTimeLineHoverOut() {
      this.timeLineHover = false;
    },
    handleExitBtnHoverIn() {
      if (!this.isSpaceDownInProfessional) {
        this.exitBtnHover = true;
      }
    },
    handleExitBtnHoverOut() {
      this.exitBtnHover = false;
    },
    handleEditorMouseUp(e: MouseEvent) {
      this.updateMouseUp('the-video-controller');
      this.handleDragEndTimeLine(e);
    },
    handleDragStartTimeLine(e: MouseEvent) {
      if (!this.paused) {
        this.$bus.$emit('toggle-playback');
      } else {
        this.dragStartX = e.pageX;
        this.dragStartLeft = this.currentLeft;
        this.dragStartTime = this.preciseTime;
        this.timeLineDraging = true;
        this.dragingMode = 'grabbing';
      }
    },
    handleDragingTimeLine(e: MouseEvent) {
      if (this.timeLineDraging) {
        // 正在拖动时间轴， 处理越界
        this.toggleDragable(true);
        let offset = e.pageX - this.dragStartX;
        const seekTime = this.dragStartTime - (offset / this.space);
        if (seekTime <= 0) {
          offset = this.dragStartTime * this.space;
        }
        if (seekTime >= this.duration) {
          offset = (this.dragStartTime - this.duration) * this.space;
        }
        this.updateWhenMoving(offset);
      }
    },
    handleDragEndTimeLine(e: MouseEvent) {
      this.toggleDragable(false);
      // 拖动时间轴结束，重设时间、位置信息
      if (this.timeLineDraging) {
        if (e.pageX !== this.dragStartX) {
          this.resetCurrentTime();
          this.triggerCount += 1;
        } else if (!this.timeLineClickLock && !this.isSpaceDownInProfessional) {
          this.handleMouseUpOnTimeLine(e);
          this.timeLineClickLock = true;
          setTimeout(() => {
            this.timeLineClickLock = false;
          }, this.timeLineClickDelay);
        }
        this.dragStartX = 0;
        this.timeLineDraging = false;
        this.dragingMode = 'default';
        // this.triggerCount += 1;
      }
      this.handleDragEndSub();
    },
    handleDragStartEditor(e: MouseEvent) {
      // 开始拖动时间轴，记录拖动位置、时间、暂停播放
      if (this.isSpaceDownInProfessional) {
        if (!this.paused) {
          this.$bus.$emit('toggle-playback');
        } else {
          this.dragStartX = e.pageX;
          this.dragStartLeft = this.currentLeft;
          this.dragStartTime = this.preciseTime;
          this.timeLineDraging = true;
          this.dragingMode = 'grabbing';
        }
      }
    },
    handleDragingEditor(e: MouseEvent) {
      if (this.timeLineDraging && this.isSpaceDownInProfessional && this.dragStartX > 0) {
        // 正在拖动时间轴， 处理越界
        this.toggleDragable(true);
        let offset = e.pageX - this.dragStartX;
        const seekTime = this.dragStartTime - (offset / this.space);
        if (seekTime <= 0) {
          offset = this.dragStartTime * this.space;
        }
        if (seekTime >= this.duration) {
          offset = (this.dragStartTime - this.duration) * this.space;
        }
        this.updateWhenMoving(offset);
      }
    },
    handleDragEndEditor(e: MouseEvent) {
      // 判断path里面有没有sub，没有就取消当前选中的sub
      // @ts-ignore
      const path = e.path || (e.composedPath && e.composedPath());
      const hasSubElement = path.find((e: HTMLElement) => e.tagName === 'DIV' && e.className.includes('sub-mark'));
      if (!hasSubElement && !this.isEditable) {
        this.updateChooseIndex(-2);
        // this.triggerCount += 1;
      }
      this.toggleDragable(false);
      // 拖动时间轴结束，重设时间、位置信息
      if (this.timeLineDraging) {
        if (e.pageX !== this.dragStartX) {
          this.resetCurrentTime();
          this.triggerCount += 1;
        }
        this.dragStartX = 0;
        this.timeLineDraging = false;
        this.dragingMode = 'default';
        // this.triggerCount += 1;
      }
      this.handleDragEndSub();
    },
    updateWhenMoving(offset: number) {
      // 时间轴偏移计算
      const currentLeft = this.dragStartLeft + offset;
      if (currentLeft > -10 || (currentLeft - 10) < -(2 * this.winWidth)) {
        // 超过边界，重新计算
        this.resetCurrentTime();
        this.dragStartLeft = this.currentLeft;
        this.dragStartTime = this.preciseTime;
        this.dragStartX += offset;
      } else {
        this.currentLeft = currentLeft;
        let preciseTime = this.dragStartTime - (offset / this.space);
        preciseTime = preciseTime > 0 ? preciseTime : 0;
        preciseTime = preciseTime < this.duration ? preciseTime : this.duration;
        this.preciseTime = preciseTime;
        this.$bus.$emit('seek', this.preciseTime);
        videodata.time = this.preciseTime;
      }
    },
    handleMouseUpOnTimeLine(e: MouseEvent) {
      const offset = (this.winWidth / 2) - e.pageX;
      const seekTime = this.preciseTime - (offset / this.space);
      if (seekTime >= 0 && seekTime <= this.duration && !this.transitionInfo) {
        this.$refs.timeLine.addEventListener('transitionend', this.transitionend, false);
        this.$refs.timeLine.style.transition = 'left 100ms ease-in-out';
        const left = this.currentLeft + offset;
        this.$refs.timeLine.style.left = `${left}px`;
        this.transitionInfo = {
          currentLeft: left,
          preciseTime: parseFloat(seekTime.toFixed(4)),
        };
      }
    },
    transitionend() {
      // 时间轴运动到点击位置，动画结束，重设时间
      if (this.transitionInfo) {
        this.currentLeft = this.transitionInfo.currentLeft;
        this.preciseTime = this.transitionInfo.preciseTime;
      }
      this.resetCurrentTime(this.preciseTime);
      // this.triggerCount += 1;
      this.$bus.$emit('seek', this.preciseTime);
      videodata.time = this.preciseTime;
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.transitionend);
      // this.timeLineClickTimestamp = 0;
      this.transitionInfo = null;
    },
    handleDoubleClickSub(e: MouseEvent, sub: Cue) {
      if (this.isSpaceDownInProfessional) return;
      if (!this.paused) {
        this.$bus.$emit('toggle-playback');
      } else {
        // 双击字幕条，触发时间轴运动到字幕条开始位置
        const offset = (this.preciseTime - sub.start) * this.space;
        if (Math.abs(offset) < 0.5 || this.autoFocus) {
          // 偏移太小就不触发运动
          if (this.protectKeyWithEnterShortKey) {
            this.updateAutoFocus(true);
            setImmediate(() => {
              this.protectKeyWithEnterShortKey = false;
            });
          }
        } else {
          this.$refs.timeLine.addEventListener('transitionend', this.doubleClickTransitionend, false);
          this.$refs.timeLine.style.transition = 'left 0.1s ease-in-out';
          this.currentLeft += offset;
          this.preciseTime = parseFloat(sub.start.toFixed(4));
          if (!this.protectKeyWithEnterShortKey) {
            this.updateChooseIndex(sub.index);
          }
        }
      }
    },
    doubleClickTransitionend() {
      // 时间轴运动到字幕条开始位置，动画结束，重设时间
      this.resetCurrentTime(this.preciseTime);
      this.triggerCount += 1;
      this.$bus.$emit('seek', this.preciseTime);
      videodata.time = this.preciseTime;
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.doubleClickTransitionend);
      if (this.protectKeyWithEnterShortKey) {
        this.updateAutoFocus(true);
        setImmediate(() => {
          // 输入组件autoFocus watcher 失效， 手动发射事件
          this.$bus.$emit(bus.SUBTITLE_EDITOR_AUTO_FOCUS);
          this.protectKeyWithEnterShortKey = false;
        });
      }
    },
    computedSubClass(sub: Cue) { // eslint-disable-line
      const ci = this.chooseIndex;
      const hi = this.hoverIndex;
      const index = sub.index;
      // const reference = sub.reference;
      let c = 'sub';
      if (index === ci && this.subDragMoving) {
        c = 'sub choose hover draging';
      } else if (index === ci && (this.subLeftDraging || this.subRightDraging)) {
        c = 'sub choose hover resize';
      } else if (index === ci && index === hi) {
        c = 'sub choose hover';
      } else if (index === ci) {
        c = 'sub choose';
      } else if (index === hi) {
        c = 'sub hover';
      }
      return c;
    },
    handleHoverIn(e: MouseEvent, sub: Cue) {
      if (this.isSpaceDownInProfessional) return;
      if (!(this.subDragMoving || this.subLeftDraging || this.subRightDraging) && this.paused) {
        this.hoverIndex = sub.index;
      }
    },
    handleHoverOut() {
      if (!(this.subDragMoving || this.subLeftDraging || this.subRightDraging)) {
        this.hoverIndex = -2;
      }
    },
    handleDragStartSub(e: MouseEvent, sub: {
      index: number,
      left: number,
    }) {
      if (this.isSpaceDownInProfessional) return;
      if (!this.paused) {
        this.$bus.$emit('toggle-playback');
      } else {
        // 开始拖动字幕条，需要计算拉升还是位移
        this.subDragStartX = e.pageX;
        // @ts-ignore
        const path = e.path || (e.composedPath && e.composedPath());
        const subElement = path.find((e: HTMLElement) => e.tagName === 'DIV' && e.className.includes('sub-mark'));
        const leftTarget = path.find((e: HTMLElement) => e.tagName === 'I' && e.className.includes('drag-left'));
        const rightTarget = path.find((e: HTMLElement) => e.tagName === 'I' && e.className.includes('drag-right'));
        this.subDragElement = subElement;
        this.subDragCurrentSub = sub;
        this.updateChooseIndex(sub.index);
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
      }
    },
    handleDragingSub(e: MouseEvent) {
      if (this.subRightDraging || this.subLeftDraging || this.subDragMoving) {
        this.toggleDragable(true);
        const offset = e.pageX - this.subDragStartX;
        this.updateSubWhenDraging(offset, this.subDragCurrentSub, this.subDragElement, e.pageX);
        this.subDragStartX = e.pageX;
      }
    },
    timeLineTransitionend() {
      // 时间轴步长运动，动画结束
      if (this.lock && this.createSubElement.style.position === 'absolute') {
        this.createSubElement.style.left = this.subDragTimeLineMovingDirection === 'right'
          ? `${(this.subDragCurrentSub.maxLeft - (this.step * this.space))}px`
          : `${(this.subDragCurrentSub.minLeft + (this.step * this.space))}px`;
      }
      this.resetCurrentTime(this.preciseTime);
      this.triggerCount += 1;
      this.$bus.$emit('seek', this.preciseTime);
      videodata.time = this.preciseTime;
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.timeLineTransitionend);
      this.lock = false;
      if (!this.timer) {
        // 鼠标已经up，但是动画刚执行结束，手动触发finishSubDrag
        this.finishSubDrag(this.subDragCurrentSub);
      }
    },
    updateSubWhenDraging(offset: number, sub: EditCue, subElement: HTMLElement, pageX: number) { // eslint-disable-line
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
        if ((this.subDragStartX + (offset + ((this.space / 5) * 2))) > this.winWidth
          && sub.right <= ((2 * this.winWidth) + this.currentLeft)) {
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
            this.createSubElement
              .setAttribute('class', `drag-sub${sub.reference ? ' reference' : ''}`);
            this.createSubElement.setAttribute('style', `width: ${sub.width}px;
              top: ${((6 + ((sub.track - 1) * 4)) * this.vh) + 33}px;
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
                  this.createSubElement.parentNode
                  && this.createSubElement.parentNode.removeChild(this.createSubElement);
                  this.createSubElement = null;
                }
                this.subDragTimeLineMoving = false;
                sub.left = sub.maxLeft;
                sub.right = (3 * this.winWidth) - (sub.left + sub.width);
                subElement.style.left = `${sub.left}px`;
                subElement.style.right = `${sub.right}px`;
              } else {
                if (((3 * this.winWidth) - ((left - this.currentLeft) + sub.width))
                  < (sub.minRight + (this.step * this.space))) {
                  // 当字幕贴到右边的字幕是，定住
                  this.createSubElement.style.position = 'absolute';
                  this.createSubElement.style.left = `${sub.maxLeft}px`;
                } else {
                  // 如果字幕条往右运动一个步长还不超出这个字幕的最右定位
                  // 就让这个字幕条在时间轴上面往前加一步
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
        } else if ((this.subDragStartX + offset) < ((this.space / 5) * 2)
          && sub.left < (0 - this.currentLeft)) {
          // 往左拖出窗口
          sub.right = sub.right > maxR ? maxR : sub.right;
          sub.left = (3 * this.winWidth) - (sub.right + sub.width);
          // 先隐藏当前字幕条DOM
          // subElement.style.opacity = '0';
          if (!this.subDragTimeLineMoving) {
            // 创建DOM副本
            const left = sub.left + this.currentLeft;
            this.createSubElement = document.createElement('div');
            this.createSubElement
              .setAttribute('class', `drag-sub${sub.reference ? ' reference' : ''}`);
            this.createSubElement.setAttribute('style', `width: ${sub.width}px;
              top: ${((6 + ((sub.track - 1) * 4)) * this.vh) + 33}px;
              left: ${left}px`);
            // 插入拖拽的DOM镜像
            this.$refs.timeLine && this.$refs.timeLine.appendChild(this.createSubElement);
            // 开启定时运动
            this.timer = setInterval(() => {
              const distance = sub.minLeft - ((3 * this.winWidth) - bMaxR);
              // 当拖拽的字幕条已经快差一步就全部显示到窗口里面的时候
              // DOM镜像就定位到时间轴上面
              // if ((distance + (this.step * this.space)) > 0) {
              //   this.createSubElement.style.position = 'absolute';
              //   this.createSubElement.style.left = `${(this.subDragCurrentSub.minLeft)}px`;
              // }
              // 当拖拽的字幕条已经全部显示到窗口里面，就结束定时运动
              // 结束运动，就把镜像删掉，当前拖拽的字幕条显示
              if (distance > 0) {
                clearInterval(this.timer);
                this.timer = null;
                if (this.createSubElement) {
                  this.createSubElement.parentNode
                  && this.createSubElement.parentNode.removeChild(this.createSubElement);
                  this.createSubElement = null;
                }
                this.subDragTimeLineMoving = false;
                sub.left = sub.minLeft;
                sub.right = (3 * this.winWidth) - (sub.left + sub.width);
                subElement.style.opacity = '1';
                subElement.style.left = `${sub.left}px`;
                subElement.style.right = `${sub.right}px`;
              } else {
                if ((left - this.currentLeft) < (sub.minLeft + (this.step * this.space))) {
                  // 当字幕贴到左边的字幕是，定住
                  this.createSubElement.style.position = 'absolute';
                  this.createSubElement.style.left = `${sub.minLeft}px`;
                } else {
                  // 如果字幕条往左运动一个步长还不超出这个字幕的最左定位
                  // 就让这个字幕条在时间轴上面往前加一步
                  this.hook = this.step;
                }
                // 时间轴往左运动一个步长
                this.$refs.timeLine.addEventListener('transitionend', this.timeLineTransitionend, false);
                this.$refs.timeLine.style.transition = 'left 0.2s ease-in-out';
                this.currentLeft += this.step * this.space;
                this.preciseTime -= this.step;
                this.lock = true;
                // this.step += 0.3; // 步长自增
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
            this.createSubElement.parentNode
            && this.createSubElement.parentNode.removeChild(this.createSubElement);
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
      } else if (this.subRightDraging && subElement) {
        const l = pageX - (this.subDragStartOffsetLeft + this.currentLeft);
        sub.right = (3 * this.winWidth) - (l + sub.width);
        sub.right = sub.right < sub.minRight ? sub.minRight : sub.right;
        const maxR = sub.originRight + (sub.originWidth - (0.2 * this.space));
        sub.right = sub.right > maxR ? maxR : sub.right;
        subElement.style.right = `${sub.right}px`;
      }
    },
    handleDragEndSub() {
      clearInterval(this.timer);
      this.timer = null;
      if ((this.subRightDraging || this.subLeftDraging || this.subDragMoving) && !this.lock) {
        this.finishSubDrag(this.subDragCurrentSub);
      }
      this.hoverIndex = -2;
    },
    finishSubDrag(sub: EditCue) { // eslint-disable-line
      let newStart = 0;
      let newEnd = 0;
      const originStart = parseFloat(sub.originStart.toFixed(2));
      const originEnd = parseFloat(sub.originEnd.toFixed(2));
      if (this.subDragMoving) {
        if (sub.left > sub.maxLeft) {
          sub.left = sub.maxLeft;
        }
        let hook = this.hook - this.step;
        hook = hook > 0 ? hook : 0;
        newStart = originStart + (Math.floor(sub.left - sub.originLeft) / this.space) + hook;
        newEnd = newStart + (originEnd - originStart);
        newStart = newStart < 0 ? 0 : newStart;
        newStart = parseFloat(newStart.toFixed(2));
        newEnd = parseFloat(newEnd.toFixed(2));
      } else if (this.subLeftDraging) {
        newStart = originStart + ((sub.left - sub.originLeft) / this.space);
        newEnd = originEnd;
        newStart = parseFloat(newStart.toFixed(2));
      } else if (this.subRightDraging) {
        newStart = originStart;
        newEnd = originEnd - ((sub.right - sub.originRight) / this.space);
        newEnd = parseFloat(newEnd.toFixed(2));
      }
      if (newStart && newEnd && (newStart !== originStart || newEnd !== originEnd)) {
        if (!sub.reference) {
          const modified = {
            type: MODIFIED_SUBTITLE_TYPE.REPLACE,
            index: sub.index,
            cue: { ...cloneDeep(sub), start: newStart, end: newEnd },
          };
          this.modifiedSubtitle(modified);
        } else {
          const modified = {
            type: MODIFIED_SUBTITLE_TYPE.ADD_FROM_REFERENCE,
            index: sub.index,
            cue: { ...cloneDeep(sub), start: newStart, end: newEnd },
          };
          this.modifiedSubtitle(modified);
        }
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
      // this.triggerCount += 1;
      if (this.createSubElement) {
        this.createSubElement.parentNode
        && this.createSubElement.parentNode.removeChild(this.createSubElement);
        this.createSubElement = null;
      }
      this.toggleDragable(false);
      // this.updateChooseIndex(sub.index);
    },
    handleKeyDown(e: KeyboardEvent) {
      if (e && (e.keyCode === 46 || e.keyCode === 8) && this.chooseIndex !== -2) {
        const cue = this.filterSubs.find((e: Cue) => e.index === this.chooseIndex);
        if (cue && cue.reference) {
          const modified = {
            type: MODIFIED_SUBTITLE_TYPE.DELETE_FROM_REFERENCE,
            index: cue.selfIndex,
            cue,
          };
          this.modifiedSubtitle(modified);
        } else if (cue) {
          const modified = {
            type: MODIFIED_SUBTITLE_TYPE.DELETE,
            index: cue.selfIndex,
            cue,
          };
          this.modifiedSubtitle(modified);
        }
        this.updateChooseIndex(-2);
        this.hoverIndex = -2;
      } else if (e && e.keyCode === 32 && this.spaceKeyPressStartTime === 0) {
        this.toggleSpaceDown(true);
        this.spaceKeyPressStartTime = Date.now();
        this.lastPaused = this.paused;
        !this.lastPaused && this.$bus.$emit('toggle-playback');
        e.preventDefault();
      }
    },
    handleKeyUp(e: KeyboardEvent) {
      const distance = Date.now() - this.spaceKeyPressStartTime;
      if (e && e.keyCode === 32 && distance < 500 && this.lastPaused) {
        // 触发暂停/播放
        this.$bus.$emit('toggle-playback');
      }
      this.spaceKeyPressStartTime = 0;
      this.toggleSpaceDown(false);
    },
    transcode(time: number, num: number) {
      if (time < 0) {
        return '';
      } if (time > this.duration) {
        return '';
      }
      const secNum = time;
      let hours: string | number = Math.floor(secNum / 3600);
      let minutes: string | number = Math.floor((secNum - (hours * 3600)) / 60);
      let seconds: string | number = secNum - (hours * 3600) - (minutes * 60);
      seconds = num ? seconds.toFixed(num) : Math.round(seconds);
      hours = hours < 10 ? `0${hours}` : hours;
      minutes = minutes < 10 ? `0${minutes}` : minutes;
      seconds = seconds < 10 ? `0${seconds}` : seconds;
      if (minutes === '00' && hours === '00') {
        return num ? `00:${seconds}` : seconds;
      } if (hours === '00') {
        return `${minutes}:${seconds}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    },
    getSecond(time: number) {
      if (time < 0) {
        return -1;
      } if (time > this.duration) {
        return -1;
      }
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time - (hours * 3600)) / 60);
      let seconds: string | number = time - (hours * 3600) - (minutes * 60);
      seconds = Math.round(seconds);
      seconds = seconds < 10 ? `0${seconds}` : seconds;
      return seconds;
    },
    isHighlight(time: number) {
      return this.getSecond(time) % 10 === 0;
    },
    handleClickProfessional() {
      // 如果退出高级模式，需要恢复原来播放尺寸
      // 进入高级模式，需要设定window的信息，在本组件的watch里
      // this.toggleProfessional(false);
      if (!this.isSpaceDownInProfessional && !this.isDragableInProfessional) {
        this.closeProfessional(false);
      }
    },
    handleTextAreaChange(result: {
      cue: EditCue,
      text: string,
      isFirstSub: boolean,
    }) {
      if (!this.isProfessional) {
        // 快速编辑
        this.convertSubtitle(result);
      } else if (result.cue.reference) {
        const type = !result.text
          ? MODIFIED_SUBTITLE_TYPE.DELETE_FROM_REFERENCE
          : MODIFIED_SUBTITLE_TYPE.ADD_FROM_REFERENCE;
        const modified = {
          type,
          index: result.cue.index,
          cue: { ...result.cue, text: result.text },
        };
        this.modifiedSubtitle(modified);
      } else if (result.cue.index === -1) {
        const type = MODIFIED_SUBTITLE_TYPE.ADD;
        const end = parseFloat(this.preciseTime.toFixed(2)) + 0.01;
        const start = result.cue.distance && result.cue.distance > 0.5
          ? parseFloat((end - 0.5).toFixed(2)) : parseFloat((end - 0.2).toFixed(2));
        const modified = {
          type,
          index: result.cue.selfIndex,
          cue: {
            ...result.cue, text: result.text, start, end,
          },
        };
        this.createMirrorSubtitle(modified);
      } else {
        const type = !result.text
          ? MODIFIED_SUBTITLE_TYPE.DELETE
          : MODIFIED_SUBTITLE_TYPE.REPLACE;
        const modified = {
          type,
          index: result.cue.selfIndex,
          cue: { ...result.cue, text: result.text },
        };
        this.modifiedSubtitle(modified);
      }
    },
  },
});
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
      width: 100%;
      height: 94vh;
      min-height: calc(100vh - 60px);
      position: absolute;
      left: 0;
      bottom: 0;
      background-image: url(../assets/subtitle-editor-dot.svg);
      // background-image: image-set(
      //  url(../../assets/dot.png) 1x,
      //  url(../../assets/dot2x.png) 2x);
      // background-image: -webkit-image-set(
      //  url(../../assets/dot.png) 1x,
      //  url(../../assets/dot2x.png) 2x);
      background-repeat: repeat-x;
      background-position: center 0;
      z-index: -1;
      opacity: 0.3;
    }
  }
  .drag-mask {
    width: 100%;
    height: 0;
    position: absolute;
    left: 0;
    bottom: 0;
    &.active {
      // height: 100vh;
      height: 94vh;
      min-height: calc(100vh - 60px);
      z-index: 22;
    }
  }
  .sub-editor-head {
    // height: 25vh;
    position: relative;
    z-index: 2;
    &:after {
      content: "";
      width: 1px;
      // height: calc(15.75vh)
      height: calc(9vh + 35px);
      max-height: 125px;
      position: absolute;
      top: 0;
      left: 50%;
      z-index: 9;
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
        // backdrop-filter: blur(4px);
        // background: rgba(255,255,255,0.06);
        background-color: rgba(0,0,0,0.48);
        transition: background 0.2s ease-in-out;
      }
      &.hover {
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
      background: rgba(255,255,255,0.24);
      // backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.15);
      border-radius: 2px;
      box-sizing: border-box;
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
      color: #fff;
      &.reference {
        // background: rgba(255,255,255,0.05);
        // background-color: aqua;
        border-color: rgba(151,151,151,0.10);
        background-color: transparent;
        background-image: url(../assets/subtitle-editor-stripe.svg);
        // backdrop-filter: blur(10px);
        background-repeat: repeat;
        // background-size: contain;
        // border-color: transparent;
      }
      &.focus {
        // background: rgba(255,255,255,0.70);
        // border-color: rgba(255,255,255,0.15);
        // &::before {
        //   opacity: 1;
        // }
      }
      &.hover {
        border-color: rgba(255,255,255,0.60);
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
        max-width: 5px;
        height: 100%;
        left: -2px;
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
        max-width: 5px;
        right: -2px;
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
    z-index: 12;
    display: flex;
    align-items: center;
    justify-content: center;
    // backdrop-filter: blur(3px);
    background: rgba(255,255,255,0.1);
    transition: background 0.2s ease-in-out;
    &.hover {
      background: rgba(255,255,255,0.2);
    }
    &.mask {
      &:after {
        content: "";
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        display: block;
        z-index: 2;
        cursor: grab;
      }
    }
    .subtitle-editor-exit {
      width: 60%;
      height: 60%;
    }
  }
  .sub-editor-body {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    bottom: 0;
    .referenceText {
      // background: rgba(0,0,0,0.30);
      // border-radius: 3px 3px 0 0;
      text-align: center;
      margin-bottom: 5px;
      white-space: pre;
      font-size: 11px;
      color: #ffffff;
      font-style: italic;
    }
    .renderers {
      display: flex;
      flex-direction: column-reverse;
      position: relative;
    }
  }
  .sub-editor-foot {
    .timing {
      &:hover {
        cursor: default;
      }
    }
  }
  .fade-in {
    visibility: visible;
    opacity: 1;
    transition: opacity 100ms ease-in;
  }
  .fade-out {
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s 100ms, opacity 100ms ease-out;
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 200ms ease-in;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }
</style>
<style lang="scss">
.drag-sub {
  position: fixed;
  height: 3vh;
  max-height: 30px;
  z-index: 1;
  background: rgba(255,255,255,0.39);
  // backdrop-filter: blur(10px);
  border: 2px solid rgba(255,255,255,0.60);
  border-radius: 2px;
  cursor: pointer;
  box-sizing: border-box;
  &.reference {
    background-color: transparent;
    background-image: url(../assets/subtitle-editor-stripe.svg);
    background-repeat: repeat;
  }
}
.fade-in {
  visibility: visible;
  opacity: 1;
  transition: opacity 100ms ease-in;
}
.fade-out {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 300ms, opacity 300ms ease-out;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 200ms ease-in;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
