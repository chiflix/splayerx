<template>
  <div class="sub-editor"
    :style="{
      zIndex: dragingMode !== 'default' && isDragableInProfessional ? '9999' : '11',
      cursor: dragingMode
    }">
    <div class="sub-editor-head">
      <div class="sub-editor-time-line no-drag"
        ref="timeLine"
        @mousedown.left.stop="handleDragStartEditor"
        @mousemove.left="handleDragingEditor"
        @mouseup.left.stop="handleDragEndEditor"
        :style="{
          width: `${3 * winWidth}px`,
          left: `${currentLeft}px`,
          cursor: dragingMode !== 'default' ? dragingMode : 'grab',
          height: spaceKeyPressStartTime > 0 ? '100vh' : 'auto',
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
          <div v-for="sub in validitySubs"
            :key="`${sub.width}-${sub.index}-${sub.track}-${sub.text}`"
            v-fade-in="!(!paused && sub.reference)"
            @mouseover.stop="handleHoverIn($event, sub)"
            @mouseleave.stop="handleHoverOut($event, sub)"
            @mousedown.left.stop="handleDragStartSub($event, sub)"
            @mousemove.left="handleDragingSub($event, sub)"
            @mouseup.left="handleDragEndSub($event, sub)"
            @dblclick.left.stop="handleDoubleClickSub($event, sub)"
            :class="computedSubClass(sub)+' no-drag sub-mark'+`${sub.focus && !sub.reference ? ' focus' : ''}`+`${sub.reference ? ' reference' : ''}`"
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
      <div class="exit-btn-wrap" @click.stop="handleClickProfessional" v-fade-in="!isDragableInProfessional"
        :style="{
          cursor: dragingMode !== 'default' ? dragingMode : 'pointer'
        }">
        <Icon type="subtitleEditorExit" class="subtitle-editor-exit"/>
      </div>
    </div>
    <div class="sub-editor-body" :style="{
      bottom: `${(60 / 1080) * 100}%`,
      minWidth: `${inputWitdh}px`
    }">
      <div v-if="referenceSubtitleId && paused" class="referenceText subtitle-style" v-html="`&nbsp;${getCurrentReferenceCues()}`"
      :style="{
        zoom: zoom,
      }"></div>
      <div class="renderers">
        <subtitle-renderer
          v-fade-in="!subDragTimeLineMoving"
          :key='originSrc+currentEditedSubtitleId'
          :showAddInput.sync="showAddInput"
          :showTextarea.sync="showTextarea"
          :newSubHolder="newSubHolder"
          :preciseTime="preciseTime"
          :currentSub="currentSub"
          :dragingMode="dragingMode"
          :referenceDialogues="referenceDialogues"
          :subtitleInstance="!currentEditedSubtitleId ? null : subtitleInstance"
          :tags.sync="tags"
          :firstTags="firstTags"/>
      </div>
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
import { mapGetters, mapMutations, mapActions } from 'vuex';
import { cloneDeep } from 'lodash';
import {
  EVENT_BUS_COLLECTIONS as bus,
  MODIFIED_SUBTITLE_TYPE as modifiedTypes,
} from '@/constants';
import { videodata } from '@/store/video';
import { Editor as editorMutations } from '@/store/mutationTypes';
import TheProgressBar from '@/components/PlayingView/TheProgressBar.vue';
import SubtitleRenderer from './SubtitleRenderer.vue';
import SubtitleInstance from './SubtitleLoader/index';
import { uniteSubtitleWithFragment } from './SubtitleLoader/utils';
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
      currentParseReferenceSubtitleId: null, //
      referenceDialogues: [],
      dialogues: [],
      chooseIndexs: -1, // 单击字幕条选择字幕条的索引，支持ctrl多选
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
      showTextarea: false, //
      showAddInput: false, // 可以显示添加字幕的属性
      newSubHolder: null, // 配合showAddInput，存储添加字幕的数据格式以及插入位置
      history: [],
      currentIndex: -1,
      dragingMode: 'default', // 光标类型
      spaceKeyPressStartTime: 0, //
      lastPaused: false, //
      tags: {},
      firstTags: {},
      transitionInfo: null, // 时间轴动画中，包括动画end 需要的数据
      matchSwitchReferenceBubble: null, // 当切换参考字幕的时候，记录当前是否有气泡
      protectKeyWithEnterShortKey: false, // 保护回车选择前
    };
  },
  props: {
    subtitleInstance: SubtitleInstance,
    referenceSubtitleInstance: SubtitleInstance,
  },
  computed: {
    ...mapGetters([
      'winWidth', 'winHeight', 'duration', 'paused', 'isCreateSubtitleMode', 'originSrc', 'referenceSubtitleId', 'currentEditedSubtitleId',
      'winRatio', 'computedHeight', 'computedWidth', 'messageInfo', 'isDragableInProfessional', 'chooseIndex', 'currentTime',
    ]),
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
      return Math.ceil((3 * this.winWidth) / this.space);
    },
    offset() {
      return Math.ceil((3 * this.winWidth) / (this.space * 2));
    },
    type() {
      // TODO 删除
      if (this.subtitleInstance && this.subtitleInstance.metaInfo) {
        return this.subtitleInstance.metaInfo.format;
      }
      return '';
    },
    times() {
      return [...Array(this.scales).keys()]
        .map(e => (this.editorCurrentTime * 1) + ((e * 1) - this.offset));
    },
    filterSubs() {
      // filterSubs 是当前编辑字幕和参考字幕的组合，过滤掉位置不是alignment2且有定位的字幕
      // selfIndex 仅仅参考字幕才有
      // index 字幕的id
      const referenceFilters = this.referenceDialogues
        .map((e, i) => Object.assign({ reference: true }, e, { selfIndex: i }));
      const currentDialogues = this.dialogues;
      // TODO 降低时间复杂度
      return currentDialogues
        .concat(referenceFilters)
        .map((e, i) => (uniteSubtitleWithFragment({ ...e, index: i })))
        .sort((p, n) => (p.start - n.start))
        .filter((e) => {
          const tags = e.fragments && e.fragments[0] && e.fragments[0].tags;
          return tags && !(tags.pos || tags.alignment !== 2);
        });
    },
    validitySubs() {
      // 在filterSubs 基础上，筛选出在时间轴中的字幕
      // 每个字幕添加了必要的属性用来处理边缘等等计算的逻辑
      const filters = this.filterSubs.filter(e => e.end > (this.preciseTime - this.offset) &&
        e.start < (this.preciseTime + this.offset));
      // console.log(filters);
      return filters.map((e, i) => { // eslint-disable-line
        // 这里可以直接取fragments，因为在filterSubs里面，已经过滤掉没有fragments的数据了
        const text = e.fragments[0].text;
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
        .filter(e => e.start <= this.preciseTime && e.end > this.preciseTime);
    },
    zoom() {
      // update video scale that width is larger than height
      const updatePCVideoScaleByFactors = (index) => {
        const firstFactors = [21, 29, 37, 45];
        const secondFactors = [24, 26, 28, 30];
        return `${(((firstFactors[index] / 900) * this.computedSize) + (secondFactors[index] / 5)) / 9}`;
      };
      // update video scale that height is larger than width
      const updateMobileVideoScaleByFactors = (index) => {
        const firstFactors = [21, 29, 37, 45];
        const secondFactors = [12, -92, -196, -300];
        return `${(((firstFactors[index] / 760) * this.computedSize) + (secondFactors[index] / 76)) / 9}`;
      };
      // update video scale when width or height is larger than 1080
      const updateVideoScaleByFactors = (val) => {
        const factors = [30, 40, 50, 60];
        return `${((val / 1080) * factors[0]) / 9}`;
      };
      if (this.computedSize >= 1080) {
        return updateVideoScaleByFactors(this.computedSize);
      } else if (this.winRatio >= 1) {
        return updatePCVideoScaleByFactors(0);
      }
      return updateMobileVideoScaleByFactors(0);
    },
  },
  watch: {
    paused(val) {
      if (!val) {
        requestAnimationFrame(this.updateWhenPlaying);
        this.triggerCount += 1;
        this.updateChooseIndex(-2);
      } else {
        this.resetCurrentTime();
        const canChooseSubs = this.currentSub.filter(e => e.track === 1);
        if (canChooseSubs.length > 0) {
          this.updateChooseIndex(canChooseSubs[0].index);
        }
      }
    },
    currentTime(v) {
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
      if (!this.protectKeyWithEnterShortKey) {
        this.updateChooseIndex(-2);
      }
    },
    currentSub(val) {
      this.computedCanShowAddBtn(val);
      this.enableMenuEnter(val.length > 0 || this.showAddInput);
      const canChooseSubs = val.filter(e => e.track === 1);
      if (!this.protectKeyWithEnterShortKey && canChooseSubs.length > 0 &&
        this.paused && this.chooseIndex === -2) {
        this.updateChooseIndex(canChooseSubs[0].index);
      }
    },
    showAddInput(val) {
      // 当前没有字幕条也不能新增字幕的时候就禁用菜单的进入编辑
      this.enableMenuEnter(val || this.currentSub.length > 0);
    },
    triggerCount() {
      this.computedCanShowAddBtn(this.currentSub);
    },
    winWidth() {
      // 当resize的时候，重新render timeline
      this.resetCurrentTime();
    },
    subtitleInstance: {
      immediate: true,
      deep: true,
      handler(val) { // eslint-disable-line
        this.hook = 0;
        if (val && val.parsed && this.currentEditedSubtitleId) {
          this.dialogues = val.parsed.dialogues;
        }
        if (val && val.referenceSubtitleId !== this.referenceSubtitleId &&
          this.currentEditedSubtitleId) {
          const referenceSubtitleId = val.referenceSubtitleId;
          // 跳出vue watcher 队列
          setImmediate(() => {
            this.swicthReferenceSubtitle(referenceSubtitleId);
          });
        }
        // hooks for clear doms
        if (this.createSubElement && !this.subDragTimeLineMoving) {
          this.createSubElement.parentNode &&
          this.createSubElement.parentNode.removeChild(this.createSubElement);
          this.createSubElement = null;
        }
      },
    },
    referenceSubtitleInstance: {
      immediate: true,
      deep: true,
      handler(val) { // eslint-disable-line
        if (val && this.currentParseReferenceSubtitleId !== val.id) {
          // TODO加载时不可以新增字幕
          this.referenceDialogues = [];
          this.currentParseReferenceSubtitleId = val.id;
          const isCross = (l, r) => {
            const nl = l.start < r.start && l.end <= r.start;
            const rl = r.start < l.start && r.end <= l.start;
            return !(nl || rl);
          };
          if (!val.parsed) {
            // 开始加载，触发气泡
            const t = this.$t('notificationMessage.subtitle.referenceLoading.content');
            if (!this.matchSwitchReferenceBubble) {
              this.addMessages({
                type: 'state',
                content: t,
                dismissAfter: 200000,
              });
              this.matchSwitchReferenceBubble = this.messageInfo.find(e => e && e.content === t);
            }
            val.once('data', () => {
              setTimeout(() => {
                val.parse();
              }, Math.random() * 3000);
            });
            val.on('parse', (parsed) => {
              if (this.dialogues && parsed.dialogues) {
                this.referenceDialogues =
                  parsed.dialogues.filter(e => !this.dialogues.some(c => isCross(c, e)));
              }
              // 加载完成，
              if (val.id === this.referenceSubtitleId && this.matchSwitchReferenceBubble) {
                this.removeMessages(this.matchSwitchReferenceBubble.id);
                this.currentParseReferenceSubtitleId = null;
              }
            });
            val.load();
          } else if (this.dialogues && val.parsed.dialogues) {
            this.referenceDialogues =
              val.parsed.dialogues.filter(e => !this.dialogues.some(c => isCross(c, e)));
            // 加载完成可以新增字幕
            this.showAddInput = true;
          }
        } else if (!val) {
          this.currentParseReferenceSubtitleId = null;
          this.referenceDialogues = [];
          if (this.referenceSubtitleId != null) {
            this.addMessages({
              type: 'state',
              content: this.$t('notificationMessage.subtitle.referenceIdNotExist.content'),
              dismissAfter: 2000,
            });
            this.swicthReferenceSubtitle(null);
            this.subtitleInstance.referenceSubtitleId = null;
          }
        }
        if (this.subtitleInstance && this.currentEditedSubtitleId) {
          this.subtitleInstance.referenceSubtitleId = this.referenceSubtitleId;
        }
      },
    },
    history(v) {
      this.updateEditHistoryLen(v.length);
    },
    currentIndex(v) {
      this.updateCurrentEditHistoryIndex(v);
    },
    filterSubs(v) {
      const preciseTime = this.preciseTime;
      const prevs = v.filter(e => e.start < preciseTime && e.track === 1);
      this.enableMenuPrev(prevs.length > 0);
      const next = v.filter(e => e.start > preciseTime && e.track === 1);
      this.enableMenuNext(next.length > 0);
    },
    preciseTime(v) {
      const prevs = this.filterSubs.filter(e => e.start < v && e.track === 1);
      this.enableMenuPrev(prevs.length > 0);
      const next = this.filterSubs.filter(e => e.start > v && e.track === 1);
      this.enableMenuNext(next.length > 0);
    },
  },
  methods: {
    ...mapMutations({
      toggleSpaceDown: editorMutations.TOGGLE_SPACE_DOWN_IN_PROFESSIONAL,
      toggleDragable: editorMutations.TOGGLE_DRAGABLE_IN_PROFESSIONAL,
      toggleProfessional: editorMutations.TOGGLE_PROFESSIONAL,
      updateEditHistoryLen: editorMutations.UPDATE_EDIT_HISTORY_LEN,
      updateCurrentEditHistoryIndex: editorMutations.UPDATE_CURRENT_EDIT_HISTORY_INDEX,
      swicthReferenceSubtitle: editorMutations.SWITCH_REFERENCE_SUBTITLE,
      updateCurrentEditedSubtitle: editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE,
      enableMenuEnter: editorMutations.UPDATE_CURRENT_EDIT_MENU_ENTER_ENABLE,
      enableMenuPrev: editorMutations.UPDATE_CURRENT_EDIT_MENU_PREV_ENABLE,
      enableMenuNext: editorMutations.UPDATE_CURRENT_EDIT_MENU_NEXT_ENABLE,
      updateChooseIndex: editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX,
    }),
    ...mapActions({
      addMessages: 'addMessages',
      removeMessages: 'removeMessages',
    }),
    computedCanShowAddBtn(currentSub) { // eslint-disable-line
      currentSub = currentSub.filter(e => e.track === 1);
      // 当前有显示的字幕, 或者刚刚开始
      if (currentSub.length !== 0 || this.preciseTime < 0.2) {
        this.showAddInput = false;
        this.newSubHolder = null;
        return;
      }
      const last = this.filterSubs
        .slice()
        .reverse()
        .find(e => e.end < this.preciseTime && e.track === 1);
      if (last && (this.preciseTime - last.end) > 0.2) {
        // 当前时间段有字幕、且可以显示按钮
        let lastIndex = -1;
        const dialogues = this.dialogues;
        const len = dialogues.length;
        for (let i = len - 1; i > -1; i -= 1) {
          if (dialogues[i].end < this.preciseTime && dialogues[i].track === 1) {
            lastIndex = i;
            break;
          }
        }
        this.showAddInput = true;
        this.newSubHolder = {
          distance: this.preciseTime - last.end,
          preciseTime: this.preciseTime,
          last,
          insertIndex: lastIndex + 1,
        };
      } else if (last) {
        // 有字幕，但是不能显示按钮
        this.showAddInput = false;
        this.newSubHolder = null;
      } else {
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
      }
    },
    getCurrentReferenceCues() {
      const instance = this.referenceSubtitleInstance;
      if (instance && instance.parsed && instance.parsed.dialogues) {
        const filter = instance.parsed.dialogues.filter((e) => {
          const isInRange = e.start <= this.preciseTime && e.end > this.preciseTime;
          if (!isInRange) return false;
          const sub = uniteSubtitleWithFragment(e);
          const tags = sub.fragments && sub.fragments[0] && sub.fragments[0].tags;
          return tags && !(tags.pos || tags.alignment !== 2);
        });
        return filter.map((e) => {
          if (e.fragments) {
            return e.fragments.map(c => c.text).join('');
          }
          return e.text;
        }).join('<br>');
      }
      return '<br>';
    },
    validityTime(time) {
      return time >= 0 && time <= this.duration ? '' : ' illegal';
    },
    createMirrorSubtitle(obj) {
      this.createSubElement = document.createElement('div');
      const currentLeft = (obj.add.end - this.times[0]) * this.space;
      const targetLeft = (obj.add.start - this.times[0]) * this.space;
      const currentRight = (3 * this.winWidth) - currentLeft;
      this.createSubElement.setAttribute('style', `
        position: absolute;
        top: ${(6 * this.vh) + 33}px;
        height: 3vh;
        max-height: 30px;
        z-index: 1;
        background: rgba(255,255,255,0.24);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 1px;
        left: ${currentLeft}px;
        right: ${currentRight}px`);
      this.$refs.subtitles && this.$refs.subtitles.appendChild(this.createSubElement);
      this.createSubElement.style.transition = 'all 0.3s ease-in-out';
      this.createSubElement.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'left') {
          this.afterMirrorSubtitleAnimation(obj);
        }
      }, false);
      setImmediate(() => {
        this.createSubElement.style.left = `${targetLeft}px`;
      });
    },
    afterMirrorSubtitleAnimation(obj) {
      // 新增字幕，动画结束，触发modified-subtitle事件
      if (this.newSubHolder) {
        obj.sub.parsed.dialogues.splice(this.newSubHolder.insertIndex, 0, obj.add);
        this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
          sub: obj.sub,
          type: modifiedTypes.ADD,
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
        currentTime = b ? b.currentTime : videodata.time;
      }
      currentTime = parseFloat(currentTime.toFixed(2), 10);
      this.editorCurrentTime = parseInt(currentTime, 10);
      this.preciseTime = currentTime;
      this.currentLeft = ((this.editorCurrentTime - currentTime) * this.space) -
      ((this.offset * this.space) - (this.winWidth / 2));
    },
    updateWhenPlaying() { // eslint-disable-line
      if (!this.paused) {
        // 播放中，时间轴同步运动，当时间轴中位时间和当前播放时间相差一屏宽度时，重新设置时间轴中位时间
        const b = document.getElementsByTagName('video')[0];
        const currentTime = b.currentTime;
        if (Math.abs(currentTime - this.editorCurrentTime) * this.space >= this.winWidth) {
          this.editorCurrentTime = parseInt(currentTime, 10);
        }
        this.currentLeft = ((this.editorCurrentTime - currentTime) * this.space) -
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
        this.toggleDragable(true);
        let offset = e.pageX - this.dragStartX;
        const seekTime = this.dragStartTime - (offset / this.space);
        if (seekTime <= 0) {
          offset = this.dragStartTime * this.space;
        }
        if (seekTime >= this.duration) {
          offset = (this.dragStartTime - this.duration) * this.space;
        }
        requestAnimationFrame(() => {
          this.updateWhenMoving(offset);
        });
      }
    },
    handleDragEndEditor(e) {
      // 判断path里面有没有sub，没有就取消当前选中的sub
      const path = e.path || (e.composedPath && e.composedPath());
      const hasSubElement = path.find(e => e.tagName === 'DIV' && e.className.includes('sub-mark'));
      if (!hasSubElement) {
        this.updateChooseIndex(-2);
        // this.triggerCount += 1;
      }
      this.toggleDragable(false);
      // 拖动时间轴结束，重设时间、位置信息
      if (this.timeLineDraging) {
        if (e.pageX !== this.dragStartX) {
          this.resetCurrentTime();
          this.triggerCount += 1;
        } else if (!this.timeLineClickLock) {
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
    },
    updateWhenMoving(offset) {
      // 时间轴偏移计算
      let preciseTime = this.dragStartTime - (offset / this.space);
      preciseTime = preciseTime > 0 ? preciseTime : 0;
      preciseTime = preciseTime < this.duration ? preciseTime : this.duration;
      this.currentLeft = this.dragStartLeft + offset;
      this.preciseTime = preciseTime;
      this.$bus.$emit('seek', this.preciseTime);
      videodata.time = this.preciseTime;
    },
    handleMouseUpOnTimeLine(e) {
      // const nowTamp = Date.now();
      // const doubleClickTime = (Date.now() - this.timeLineClickTimestamp);
      // this.timeLineClickTimestamp = nowTamp;
      // // 单机时间轴、触发时间轴运动到点击位置
      // if (doubleClickTime > this.timeLineClickDelay) {
      const offset = (this.winWidth / 2) - e.pageX;
      const seekTime = this.preciseTime - (offset / this.space);
      if (seekTime >= 0 && seekTime <= this.duration && !this.transitionInfo) {
        // this.$refs.timeLine.style.transition = '';
        this.$refs.timeLine.addEventListener('transitionend', this.transitionend, false);
        this.$refs.timeLine.style.transition = 'left 100ms ease-in-out';
        const left = this.currentLeft + offset;
        this.$refs.timeLine.style.left = `${left}px`;
        this.transitionInfo = {
          currentLeft: left,
          preciseTime: seekTime,
        };
      }
      // }
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
    handleDoubleClickSub(e, sub) {
      // 双击字幕条，触发时间轴运动到字幕条开始位置
      const offset = (this.preciseTime - sub.start) * this.space;
      if (Math.abs(offset) < 0.5 || this.showTextarea) {
        // 偏移太小就不触发运动
        if (this.protectKeyWithEnterShortKey) {
          this.showTextarea = true;
          setImmediate(() => {
            this.protectKeyWithEnterShortKey = false;
          });
        }
      } else {
        // this.$refs.timeLine.style.transition = '';
        this.$refs.timeLine.addEventListener('transitionend', this.doubleClickTransitionend, false);
        this.$refs.timeLine.style.transition = 'left 0.1s ease-in-out';
        this.currentLeft += offset;
        this.preciseTime = sub.start;
        if (!this.protectKeyWithEnterShortKey) {
          this.updateChooseIndex(sub.index);
        }
      }
    },
    doubleClickTransitionend() {
      // 时间轴运动到字幕条开始位置，动画结束，重设时间
      // if (this.transitionInfo) {
      //   // this.currentLeft = this.transitionInfo.currentLeft;
      //   this.preciseTime = this.transitionInfo.preciseTime;
      //   this.chooseIndexs = this.transitionInfo.chooseIndexs;
      // }
      // this.$bus.$emit('seek', this.preciseTime);
      this.resetCurrentTime(this.preciseTime);
      this.triggerCount += 1;
      // console.log(this.preciseTime);
      this.$bus.$emit('seek', this.preciseTime);
      videodata.time = this.preciseTime;
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.doubleClickTransitionend);
      // this.transitionInfo = null;
      // this.showTextarea = true;
      // setImmediate(() => {
      //   this.showTextarea = false;
      // });
      if (this.protectKeyWithEnterShortKey) {
        this.showTextarea = true;
        setImmediate(() => {
          this.protectKeyWithEnterShortKey = false;
        });
      }
    },
    computedSubClass(sub) { // eslint-disable-line
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
    handleHoverIn(e, sub) {
      if (!(this.subDragMoving || this.subLeftDraging || this.subRightDraging) && this.paused) {
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
      const subElement = path.find(e => e.tagName === 'DIV' && e.className.includes('sub-mark'));
      const leftTarget = path.find(e => e.tagName === 'I' && e.className.includes('drag-left'));
      const rightTarget = path.find(e => e.tagName === 'I' && e.className.includes('drag-right'));
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
      if (!this.paused) {
        this.$bus.$emit('toggle-playback');
      }
      // 当拖拽字幕条时，保持hover的UI
      // const className = `sub draging${sub.index === this.chooseIndexs ? ' focus' : ''}`;
      // subElement.setAttribute('class', className);
    },
    handleDragingSub(e) {
      if (this.subRightDraging || this.subLeftDraging || this.subDragMoving) {
        this.toggleDragable(true);
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
      videodata.time = this.preciseTime;
      this.$refs.timeLine.style.transition = '';
      this.$refs.timeLine.removeEventListener('transitionend', this.timeLineTransitionend);
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
                  // let newStart = sub.originStart +
                  //   (Math.floor(sub.left - sub.originLeft) / this.space);
                  // newStart += this.step;
                  // newStart = newStart < 0 ? 0 : newStart;
                  // let newEnd = newStart + (sub.originEnd - sub.originStart);
                  // newStart = parseFloat(newStart.toFixed(2), 10);
                  // newEnd = parseFloat(newEnd.toFixed(2), 10);
                  // const before = cloneDeep(this.subtitleInstance.parsed.dialogues[sub.index]);
                  // this.subtitleInstance.parsed.dialogues[sub.index].start = newStart;
                  // this.subtitleInstance.parsed.dialogues[sub.index].end = newEnd;
                  // this.$bus.$emit('modified-subtitle', {
                  //   sub: this.subtitleInstance,
                  //   action: 'replace',
                  //   index: sub.index,
                  //   before,
                  // });
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
                // if (this.subDragCurrentSub.maxLeft > (sub.left + (this.step * this.space))) {
                //   let newStart = sub.originStart +
                //     (Math.floor(sub.left - sub.originLeft) / this.space);
                //   newStart -= this.step;
                //   newStart = newStart < 0 ? 0 : newStart;
                //   let newEnd = newStart + (sub.originEnd - sub.originStart);
                //   newStart = parseFloat(newStart.toFixed(2), 10);
                //   newEnd = parseFloat(newEnd.toFixed(2), 10);
                //   const before = cloneDeep(this.subtitleInstance.parsed.dialogues[sub.index]);
                //   this.subtitleInstance.parsed.dialogues[sub.index].start = newStart;
                //   this.subtitleInstance.parsed.dialogues[sub.index].end = newEnd;
                //   this.$bus.$emit('modified-subtitle', {
                //     sub: this.subtitleInstance,
                //     action: 'replace',
                //     index: sub.index,
                //     before,
                //   });
                // }
                if ((left - this.currentLeft) < (sub.minLeft + (this.step * this.space))) {
                  this.createSubElement.style.position = 'absolute';
                  this.createSubElement.style.left = `${sub.minLeft}px`;
                } else {
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
      const originStart = parseFloat(sub.originStart.toFixed(2), 10);
      const originEnd = parseFloat(sub.originEnd.toFixed(2), 10);
      if (this.subDragMoving) {
        if (sub.left > sub.maxLeft) {
          sub.left = sub.maxLeft;
        }
        let hook = this.hook - this.step;
        hook = hook > 0 ? hook : 0;
        newStart = originStart + (Math.floor(sub.left - sub.originLeft) / this.space) + hook;
        newEnd = newStart + (originEnd - originStart);
        newStart = newStart < 0 ? 0 : newStart;
        newStart = parseFloat(newStart.toFixed(2), 10);
        newEnd = parseFloat(newEnd.toFixed(2), 10);
      } else if (this.subLeftDraging) {
        newStart = originStart + ((sub.left - sub.originLeft) / this.space);
        newEnd = originEnd;
        newStart = parseFloat(newStart.toFixed(2), 10);
      } else if (this.subRightDraging) {
        newStart = originStart;
        newEnd = originEnd - ((sub.right - sub.originRight) / this.space);
        newEnd = parseFloat(newEnd.toFixed(2), 10);
      }
      if (newStart && newEnd && (newStart !== originStart || newEnd !== originEnd)) {
        if (!sub.reference) {
          const before = cloneDeep(this.subtitleInstance.parsed.dialogues[sub.index]);
          const subtitleInstance = cloneDeep(this.subtitleInstance);
          if (subtitleInstance.type !== 'modified' && !subtitleInstance.reference) {
            const reference = cloneDeep(this.subtitleInstance);
            delete reference.data;
            subtitleInstance.reference = reference;
          }
          subtitleInstance.parsed.dialogues[sub.index].start = newStart;
          subtitleInstance.parsed.dialogues[sub.index].end = newEnd;
          // TODO
          this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
            sub: subtitleInstance,
            type: modifiedTypes.REPLACE,
            index: sub.index,
            before,
          });
        } else {
          const match = this.filterSubs.find(e => e.index === sub.index);
          const add = cloneDeep(uniteSubtitleWithFragment(match));
          delete add.reference;
          delete add.selfIndex;
          add.start = newStart;
          add.end = newEnd;
          let subtitleInstance = null;
          let index = 0;
          if (!this.subtitleInstance || !this.currentEditedSubtitleId) {
            subtitleInstance = {
              parsed: {
                dialogues: [],
              },
              metaInfo: {
                language: 'zh-CN',
                name: '',
                format: 'online',
              },
              type: 'online',
              reference: null,
            };
          } else {
            subtitleInstance = this.subtitleInstance.type !== 'modified' ? cloneDeep(this.subtitleInstance) : this.subtitleInstance;
          }
          index = subtitleInstance.parsed.dialogues.length;
          subtitleInstance.parsed.dialogues.splice(index, 0, add);
          this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
            sub: subtitleInstance,
            type: modifiedTypes.ADD_FROM_REFERENCE,
            index,
            selfIndex: sub.selfIndex,
            before: null,
          });
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
        this.createSubElement.parentNode &&
        this.createSubElement.parentNode.removeChild(this.createSubElement);
        this.createSubElement = null;
      }
      this.toggleDragable(false);
    },
    handleKeyDown(e) { // eslint-disable-line
      if (e && (e.keyCode === 46 || e.keyCode === 8) && this.chooseIndex !== -2) {
        const subtitleInstance = cloneDeep(this.subtitleInstance);
        // 判断删除的是不是参考
        if (subtitleInstance && subtitleInstance.parsed && subtitleInstance.parsed.dialogues &&
          subtitleInstance.parsed.dialogues.length > this.chooseIndex) {
          const before = subtitleInstance.parsed.dialogues.splice(this.chooseIndex, 1)[0];
          this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
            sub: subtitleInstance,
            type: modifiedTypes.DELETE,
            index: this.chooseIndex,
            before,
          });
        } else if (subtitleInstance && subtitleInstance.parsed &&
          subtitleInstance.parsed.dialogues) {
          const selfIndex = this.chooseIndex - subtitleInstance.parsed.dialogues.length;
          this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
            sub: subtitleInstance,
            type: modifiedTypes.DELETE_FROM_REFERENCE,
            index: this.chooseIndex,
            before: null,
            selfIndex,
          });
        } else {
          this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
            sub: subtitleInstance,
            type: modifiedTypes.DELETE_FROM_REFERENCE,
            index: this.chooseIndex,
            before: null,
            selfIndex: this.chooseIndex,
          });
        }
        this.updateChooseIndex(-2);
        this.hoverIndex = -2;
      } else if (e && e.keyCode === 32 && this.spaceKeyPressStartTime === 0) {
        this.toggleSpaceDown(true);
        this.spaceKeyPressStartTime = Date.now();
        this.lastPaused = this.paused;
        !this.lastPaused && this.$bus.$emit('toggle-playback');
      }
    },
    handleKeyUp(e) {
      const distance = Date.now() - this.spaceKeyPressStartTime;
      if (e && e.keyCode === 32 && distance < 500 && this.lastPaused) {
        // 触发暂停/播放
        this.$bus.$emit('toggle-playback');
      }
      this.spaceKeyPressStartTime = 0;
      this.toggleSpaceDown(false);
    },
    transcode(time, num) { // eslint-disable-line
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
        return num ? `00:${seconds}` : seconds;
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
    handleClickProfessional() {
      // 如果退出高级模式，需要恢复原来播放尺寸
      // 进入高级模式，需要设定window的信息，在本组件的watch里
      // this.toggleProfessional(false);
      this.$bus.$emit(bus.SUBTITLE_EDITOR_EXIT);
    },
    intercept({
      sub, type, index, before, selfIndex,
    }) {
      // 如果不是撤销或者重复，就记录到历史记录
      if (type) {
        const job = {
          type,
          index,
          before,
          after: sub && sub.parsed ? cloneDeep(sub.parsed.dialogues[index]) : null,
        };
        if (type === modifiedTypes.ADD_FROM_REFERENCE) {
          job.referenceBefore = this.referenceDialogues.splice(selfIndex, 1)[0];
          job.selfIndex = selfIndex;
          this.$nextTick(() => {
            this.updateChooseIndex(index);
          });
        } else if (type === modifiedTypes.DELETE_FROM_REFERENCE) {
          job.referenceBefore = this.referenceDialogues.splice(selfIndex, 1)[0];
          job.selfIndex = selfIndex;
        }
        this.updateHistory(job);
      }
      this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
        sub,
      });
    },
    updateHistory(step) {
      if (this.currentIndex + 1 < this.history.length) {
        this.history.splice(this.currentIndex + 1);
      }
      this.history.push(step);
      this.currentIndex += 1;
    },
    undo() { // eslint-disable-line
      const pick = this.history[this.currentIndex];
      if (pick && pick.type === modifiedTypes.ADD) {
        const sub = cloneDeep(this.subtitleInstance);
        sub.parsed.dialogues.splice(pick.index);
        this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
          sub,
        });
        this.currentIndex -= 1;
      } else if (pick && pick.type === modifiedTypes.DELETE) {
        const sub = cloneDeep(this.subtitleInstance);
        const mirror = uniteSubtitleWithFragment(pick.before);
        const before = {
          start: mirror.start,
          end: mirror.end,
          fragments: mirror.fragments,
          track: mirror.track,
        };
        sub.parsed.dialogues.splice(pick.index, 0, before);
        this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
          sub,
        });
        this.currentIndex -= 1;
      } else if (pick && pick.type === modifiedTypes.REPLACE) {
        const sub = cloneDeep(this.subtitleInstance);
        const mirror = uniteSubtitleWithFragment(pick.before);
        const before = {
          start: mirror.start,
          end: mirror.end,
          fragments: mirror.fragments,
          track: mirror.track,
        };
        sub.parsed.dialogues.splice(pick.index, 1, before);
        this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
          sub,
        });
        this.currentIndex -= 1;
      } else if (pick && pick.type === modifiedTypes.ADD_FROM_REFERENCE) {
        const sub = cloneDeep(this.subtitleInstance);
        sub.parsed.dialogues.splice(pick.index);
        this.referenceDialogues.splice(pick.selfIndex, 0, pick.referenceBefore);
        this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
          sub,
        });
        this.currentIndex -= 1;
      } else if (pick && pick.type === modifiedTypes.DELETE_FROM_REFERENCE) {
        this.referenceDialogues.splice(pick.selfIndex, 0, pick.referenceBefore);
        this.currentIndex -= 1;
      }
    },
    redo() { // eslint-disable-line
      const pick = this.history[this.currentIndex + 1];
      if (pick && pick.type === modifiedTypes.ADD) {
        const sub = cloneDeep(this.subtitleInstance);
        const mirror = uniteSubtitleWithFragment(pick.after);
        const after = {
          start: mirror.start,
          end: mirror.end,
          fragments: mirror.fragments,
          track: mirror.track,
        };
        sub.parsed.dialogues.splice(pick.index, 0, after);
        this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
          sub,
        });
        this.currentIndex += 1;
      } else if (pick && pick.type === modifiedTypes.DELETE) {
        const sub = cloneDeep(this.subtitleInstance);
        sub.parsed.dialogues.splice(pick.index, 1);
        this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
          sub,
        });
        this.currentIndex += 1;
      } else if (pick && pick.type === modifiedTypes.REPLACE) {
        const sub = cloneDeep(this.subtitleInstance);
        const mirror = uniteSubtitleWithFragment(pick.after);
        const after = {
          start: mirror.start,
          end: mirror.end,
          fragments: mirror.fragments,
          track: mirror.track,
        };
        sub.parsed.dialogues.splice(pick.index, 1, after);
        this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
          sub,
        });
        this.currentIndex += 1;
      } else if (pick && pick.type === modifiedTypes.ADD_FROM_REFERENCE) {
        const sub = cloneDeep(this.subtitleInstance);
        const mirror = uniteSubtitleWithFragment(pick.after);
        const after = {
          start: mirror.start,
          end: mirror.end,
          fragments: mirror.fragments,
          track: mirror.track,
        };
        sub.parsed.dialogues.splice(pick.index, 0, after);
        this.referenceDialogues.splice(pick.selfIndex, 1);
        this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
          sub,
        });
        this.currentIndex += 1;
      } else if (pick && pick.type === modifiedTypes.DELETE_FROM_REFERENCE) {
        this.referenceDialogues.splice(pick.selfIndex, 1);
        this.currentIndex += 1;
      }
    },
  },
  mounted() {
    this.resetCurrentTime();
    this.computedCanShowAddBtn(this.currentSub);
    // 初始化组件
    document.addEventListener('mousemove', this.handleDragingEditor);
    document.addEventListener('mouseup', this.handleDragEndEditor);
    document.addEventListener('mousemove', this.handleDragingSub);
    document.addEventListener('mouseup', this.handleDragEndSub);
    // 键盘事件
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    // 添加字幕条，需要先播放动画，在往字幕对象新增一条字幕
    this.$bus.$on(bus.CREATE_MIRROR_SUBTITLE, this.createMirrorSubtitle);
    // 拦截modified-subtitle，push到操作历史记录里面
    this.$bus.$on(bus.WILL_MODIFIED_SUBTITLE, this.intercept);
    //
    this.$bus.$on(bus.SUBTITLE_EDITOR_UNDO, this.undo);
    this.$bus.$on(bus.SUBTITLE_EDITOR_REDO, this.redo);
    //
    this.$bus.$on(bus.SUBTITLE_EDITOR_EXIT, () => {
      if (this.currentEditedSubtitleId) {
        this.addMessages({
          type: 'state',
          content: this.$t('notificationMessage.subtitle.exitProfessionalMode.content'),
          dismissAfter: 2000,
        });
      }
      this.toggleProfessional(false);
    });
    this.$bus.$on(bus.SUBTITLE_EDITOR_SELECT_PREV_SUBTITLE, () => {
      if (!this.paused) {
        this.$bus.$emit('toggle-playback');
      }
      const prevs = this.filterSubs
        .filter(e => e.start < this.preciseTime && e.track === 1);
      if (prevs && prevs[prevs.length - 1]) {
        this.handleDoubleClickSub(null, prevs[prevs.length - 1]);
      }
    });
    this.$bus.$on(bus.SUBTITLE_EDITOR_SELECT_NEXT_SUBTITLE, () => {
      if (!this.paused) {
        this.$bus.$emit('toggle-playback');
      }
      const prevs = this.filterSubs
        .filter(e => e.start > this.preciseTime && e.track === 1);
      if (prevs && prevs[0]) {
        this.handleDoubleClickSub(null, prevs[0]);
      }
    });
    this.$bus.$on(bus.SUBTITLE_EDITOR_FOCUS_BY_ENTER, () => {
      const show = () => {
        const currentChooseSub = this.validitySubs
          .find(e => e.index === this.chooseIndex);
        const currentSub = this.currentSub.find(e => e.track === 1);
        if (currentChooseSub) {
          this.protectKeyWithEnterShortKey = true;
          this.handleDoubleClickSub(null, currentChooseSub);
        } else if (currentSub) {
          this.updateChooseIndex(currentSub.index);
          this.protectKeyWithEnterShortKey = true;
          this.handleDoubleClickSub(null, currentSub);
        } else if (this.showAddInput) {
          this.updateChooseIndex(-1);
          this.showTextarea = true;
        }
      };
      if (!this.showTextarea) {
        if (!this.paused) {
          this.$bus.$emit('toggle-playback');
          // this.$nextTick(show);
          setImmediate(show);
        } else {
          show();
        }
      }
    });
  },
  destroyed() {
    document.removeEventListener('mousemove', this.handleDragingEditor);
    document.removeEventListener('mouseup', this.handleDragEndEditor);
    document.removeEventListener('mousemove', this.handleDragingSub);
    document.removeEventListener('mouseup', this.handleDragEndSub);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.$bus.$off(bus.SUBTITLE_EDITOR_EXIT);
    this.$bus.$off(bus.SUBTITLE_EDITOR_UNDO);
    this.$bus.$off(bus.SUBTITLE_EDITOR_REDO);
    this.$bus.$off(bus.WILL_MODIFIED_SUBTITLE);
    this.$bus.$off(bus.CREATE_MIRROR_SUBTITLE);
    this.$bus.$off(bus.SUBTITLE_EDITOR_SELECT_PREV_SUBTITLE);
    this.$bus.$off(bus.SUBTITLE_EDITOR_SELECT_NEXT_SUBTITLE);
    this.$bus.$off(bus.SUBTITLE_EDITOR_FOCUS_BY_ENTER);
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
      background: rgba(255,255,255,0.24);
      backdrop-filter: blur(10px);
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
      &.reference {
        // background: rgba(255,255,255,0.05);
        // background-color: aqua;
        border-color: rgba(151,151,151,0.10);
        background-color: transparent;
        background-image: url(../../assets/subtitle-editor-stripe.svg);
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
  .sub-editor-body {
    position: absolute;
    left: 50%;
    bottom: 2.88184%;
    transform-origin: bottom left;
    z-index: 5;
    transform: translate(-50%, 0);
    .referenceText {
      background: rgba(0,0,0,0.30);
      // border-radius: 3px 3px 0 0;
      text-align: center;
      margin-bottom: 5px;
      white-space: pre;
    }
    .renderers {
      min-height: 80px;
      display: flex;
      flex-direction: column-reverse;
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
    transition: visibility 0s 300ms, opacity 300ms ease-out;
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 200ms ease-in;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }
</style>
