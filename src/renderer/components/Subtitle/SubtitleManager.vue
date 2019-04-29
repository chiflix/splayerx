<template>
  <div>
    <transition name="fade">
      <div
        v-if="!isProfessional">
        <subtitle-renderer
          ref="subtitleRenderer"
          v-if="currentFirstSubtitleId && duration"
          :subtitle-instance="subtitleInstances[this.currentFirstSubtitleId]"
          :key='originSrc+currentFirstSubtitleId'
          :isFirstSub="true"
          :linesNum="linesNum"
          :firstLinesNum.sync="firstLinesNum"
          :firstTags.sync="firstTags"
          :tags="tags"
          :playlistShow="playlistShow"/>
        <subtitle-renderer
          ref="subtitleRenderer"
          v-if="currentSecondSubtitleId && duration && enabledSecondarySub"
          :subtitle-instance="subtitleInstances[this.currentSecondSubtitleId]"
          :key='originSrc+currentSecondSubtitleId'
          :isFirstSub="false"
          :firstLinesNum="firstLinesNum"
          :linesNum.sync="linesNum"
          :tags.sync="tags"
          :firstTags="firstTags"
          :playlistShow="playlistShow"/>
      </div>
    </transition>
    <transition name="fade" mode="out-in" appear>
      <subtitle-editor
        v-if="isProfessional"
        :playlistShow="playlistShow"
        :referenceSubtitleInstance="referenceSubtitleInstance"
        :subtitleInstance="subtitleInstances[this.currentEditedSubtitleId]"/>
    </transition>
  </div>
</template>
<script>
import { mapGetters, mapActions, mapMutations, mapState } from 'vuex';
import romanize from 'romanize';
import { sep, join, basename, extname } from 'path';
import { flatten, isEqual, sortBy, differenceWith, isFunction, partial, pick, values, keyBy, merge, castArray, intersectionBy, cloneDeep } from 'lodash';
import { existsSync } from 'fs';
import { codeToLanguageName } from '@/helpers/language';
import {
  searchForLocalList, searchFromTempList, fetchOnlineList, retrieveEmbeddedList,
  storeLanguagePreference,
  updateSubtitle,
  updateSubtitleList,
  retrieveLanguagePreference,
  retrieveSubtitleList,
  deleteSubtitles,
  retrieveSubtitle,
  updateSelectedSubtitleId,
  retrieveSelectedSubtitleId,
  dialogueToString,
} from '@/helpers/subtitle';
import transcriptQueue from '@/helpers/subtitle/push';
import { deleteFileByPath, getSubtitleContentByPath, addSubtitleByMediaHash, writeSubtitleByPath } from '@/helpers/cacheFileStorage';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import { Editor as editorMutations, Subtitle as subtitleMutations } from '@/store/mutationTypes';
import { EVENT_BUS_COLLECTIONS as bus } from '@/constants';
// import SubtitleRenderer from './SubtitleRenderer.vue';
import SubtitleEditor from './SubtitleEditor.vue';
import SubtitleRenderer from './SubtitleRenderer.vue';
import SubtitleLoader from './SubtitleLoader';
import { localLanguageLoader, uniteSubtitleWithFragment } from './SubtitleLoader/utils';
import { LOCAL_SUBTITLE_REMOVED, REQUEST_TIMEOUT, SUBTITLE_UPLOAD, UPLOAD_SUCCESS, UPLOAD_FAILED } from '../../../shared/notificationcodes';

export default {
  name: 'subtitle-manager',
  components: {
    SubtitleEditor,
    SubtitleRenderer,
  },
  props: {
    playlistShow: { // 从videoController传到render,当播放列表显示时，不可以进入编辑模式
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      subtitleInstances: {},
      selectionComplete: false,
      selectionSecondaryComplete: false,
      isInitial: false,
      linesNum: 0,
      firstLinesNum: 0,
      tags: {},
      firstTags: {},
      lastFirstSubtitleId: '',
      lastSecondSubtitleId: '',
      watchLoadSubtitleFromLocal: null, // 当在高级编辑模式下，如果添加本地字幕作为参考，需要选择这个字幕
      deleteModifiedSubtitleTimer: null, // 删除自制字幕的定时任务
      deleteModifiedSubtitleInstance: null,
    };
  },
  computed: {
    ...mapGetters([
      'originSrc', // use to find proper subtitles and clear subtitle upon change
      'mediaHash', // use to provide subtitle with videoIdentity
      'subtitleList', 'currentFirstSubtitleId', 'currentSecondSubtitleId', // use to get current subtitle info and auto selection subtitles
      'computedWidth', 'computedHeight', // to determine the subtitle renderer's container size
      'duration', // do not load subtitle renderer when video(duration) is not available(todo: global variable to tell if video is totally available)
      'getVideoSrcById', 'allSubtitleList', // serve allSubtitleListWatcher
      'subtitleDelay', // subtitle's delay
      'isProfessional', // 字幕编辑高级模式属性
      'storedBeforeProfessionalInfo', 'winRatio', 'defaultDir', 'isCreateSubtitleMode',
      'isFirstSubtitle', 'referenceSubtitleId', 'currentEditedSubtitleId',
      'enabledSecondarySub', 'winWidth', 'winHeight',
    ]),
    ...mapState({
      preferredLanguages: ({ Preference }) => (
        [Preference.primaryLanguage, Preference.secondaryLanguage].filter(language => !!language)
      ),
      qualifiedSubtitles: ({ Subtitle, Video }) => {
        const { loadingStates, types, durations } = Subtitle;
        const { duration } = Video;
        return Object.keys(loadingStates)
          .filter(id => loadingStates[id] === 'loaded' && durations[id] >= duration * 0.6)
          .map(id => ({ id, type: types[id], duration: durations[id] }));
      },
      referenceSubtitleInstance() {
        if (this.referenceSubtitleId) {
          return this.subtitleInstances[this.referenceSubtitleId];
        }
        return null;
      },
    }),
  },
  watch: {
    originSrc(newVal) {
      if (newVal) {
        this.lastFirstSubtitleId = '';
        this.lastSecondSubtitleId = '';
        this.resetSubtitles();
        Object.keys(this.subtitleInstances)
          .filter(({ videoSrc }) => newVal !== videoSrc)
          .forEach(id => delete this.subtitleInstances[id]);
        this.selectionComplete = false;
        this.selectionSecondaryComplete = false;
        const hasOnlineSubtitles =
          !!this.$store.state.Subtitle.videoSubtitleMap[this.originSrc]
            .map((id) => {
              const { type, language } = this.subtitleInstances[id];
              return { type, language };
            })
            .filter(({ type }) => type === 'online')
            .length;
        this.$bus.$emit('subtitle-refresh-from-src-change', hasOnlineSubtitles);
        this.updateNoSubtitle(true);
      }
    },
    qualifiedSubtitles(newVal, oldVal) {
      const newQualified = differenceWith(newVal, oldVal, isEqual);
      if (newQualified.length) {
        const subtitles = newQualified.map(this.makeSubtitleUploadParameter);
        transcriptQueue.addAll(subtitles);
      }
    },
    allSubtitleList(newVal, oldVal) {
      this.allSubtitleListWatcher(newVal, oldVal);
      const targetSrc = this.watchLoadSubtitleFromLocal;
      if (targetSrc && this.isProfessional) {
        const load = newVal.find((e) => {
          const si = this.subtitleInstances[e.id];
          return si && si.src === targetSrc;
        });
        if (load) {
          this.swicthReferenceSubtitle(load.id);
        }
      }
    },
    currentFirstSubtitleId(newVal, oldVal) {
      if (this.selectionComplete || newVal) {
        this.lastFirstSubtitleId = oldVal;
        updateSelectedSubtitleId(this.originSrc, {
          firstId: newVal, secondaryId: this.currentSecondSubtitleId,
        });
      }
      // 当在isProfessional状态下，创建了新的字幕，需要更新当前编辑的字幕
      if (this.isProfessional && newVal &&
        this.allSubtitleList.find(e => e.id === newVal && e.type === 'modified')) {
        this.updateCurrentEditedSubtitle(newVal);
      }
    },
    currentSecondSubtitleId(newVal, oldVal) {
      if (this.selectionSecondaryComplete || newVal) {
        this.lastSecondSubtitleId = oldVal;
        updateSelectedSubtitleId(this.originSrc, {
          firstId: this.currentFirstSubtitleId, secondaryId: newVal,
        });
      }
      if (!newVal) {
        this.linesNum = 0;
      }
    },
    isProfessional(val) { // eslint-disable-line
      // 如果当前修改的是自制字幕，再离开字幕编辑高级模式，这个时候触发保存到本地的操作
      const currentSubtitle = this.subtitleInstances[this.currentFirstSubtitleId];
      const isModifiedExit = currentSubtitle && currentSubtitle.type === 'modified';
      if (!val && isModifiedExit) {
        const subString = JSON.stringify({
          parsed: currentSubtitle.parsed,
          metaInfo: currentSubtitle.metaInfo,
          referenceSubtitleId: this.referenceSubtitleId,
        });
        writeSubtitleByPath(currentSubtitle.src, subString);
      }
      // 处理最小尺寸设置
      let minSize = [];
      const store = this.storedBeforeProfessionalInfo;
      const winRatio = this.winRatio;
      if (!val && store && store.minimumSize) {
        minSize = store.minimumSize;
      } else if (!val) {
        this.toggleEditable(false);
        this.updateAutoFocus(false);
      } else if (val) {
        // 进入编辑模式，设定phase2为最小的尺寸
        minSize = winRatio > 1 ? [480 * winRatio, 480] : [480, 480 / winRatio];
        minSize = minSize.map(Math.round);
        if ((winRatio > 1 && this.winHeight < 480) ||
          (winRatio <= 1 && this.winWidth < 480)) {
          this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', minSize);
        }
      }
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', minSize);
      this.$bus.$emit(bus.SUBTITLE_DELETE_IMMEDIATELY);
      // this.windowMinimumSize(minSize);
      // 处理phase2以下的尺寸，进入高级模式，拉大窗口
    },
  },
  methods: {
    ...mapActions({
      resetSubtitles: subtitleActions.RESET_SUBTITLES,
      resetOnlineSubtitles: subtitleActions.RESET_ONLINE_SUBTITLES,
      changeCurrentFirstSubtitle: subtitleActions.CHANGE_CURRENT_FIRST_SUBTITLE,
      changeCurrentSecondSubtitle: subtitleActions.CHANGE_CURRENT_SECOND_SUBTITLE,
      offCurrentSubtitle: subtitleActions.OFF_SUBTITLES,
      addSubtitleWhenLoading: subtitleActions.ADD_SUBTITLE_WHEN_LOADING,
      addSubtitleWhenReady: subtitleActions.ADD_SUBTITLE_WHEN_READY,
      addSubtitleWhenLoaded: subtitleActions.ADD_SUBTITLE_WHEN_LOADED,
      addSubtitleWhenFailed: subtitleActions.ADD_SUBTITLE_WHEN_FAILED,
      updateMetaInfo: subtitleActions.UPDATE_METAINFO,
      updateNoSubtitle: subtitleActions.UPDATE_NO_SUBTITLE,
      removeLocalSub: subtitleActions.REMOVE_LOCAL_SUBTITLE,
      addMessages: 'addMessages',
    }),
    ...mapMutations({
      toggleEditable: editorMutations.TOGGLE_EDITABLE,
      swicthReferenceSubtitle: editorMutations.SWITCH_REFERENCE_SUBTITLE,
      resetSubtitlesByMutation: subtitleMutations.RESET_SUBTITLES,
      updateCurrentEditedSubtitle: editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE,
      updateAutoFocus: editorMutations.UPDATE_AUTO_FOCUS,
      windowMinimumSize: 'windowMinimumSize', // 需要设置到常量里面
    }),
    async refreshSubtitles(types, videoSrc) {
      const supportedTypes = ['local', 'embedded', 'online', 'modified'];
      const {
        getLocalSubtitlesList,
        getModifiedSubtitlesList,
        getOnlineSubtitlesList,
        getEmbeddedSubtitlesList,
        resetOnlineSubtitles,
        preferredLanguages,
      } = this;
      const requestedTypes = types
        .map(type => type.toLowerCase())
        .filter(type => supportedTypes.includes(type));
      if (!requestedTypes.length) throw new Error('No valid subtitle type provided.');
      const subtitleRequests = [];

      const storedLanguagePreference = await retrieveLanguagePreference(videoSrc);
      const storedSubtitles = await retrieveSubtitleList(videoSrc);
      if (requestedTypes.includes('modified')) {
        // 自制字幕加载请求
        const storedModifiedSubtitles = storedSubtitles.filter(({ type }) => type === 'modified');
        subtitleRequests.push(getModifiedSubtitlesList(videoSrc, storedModifiedSubtitles));
      }
      if (requestedTypes.includes('local')) {
        const storedLocalSubtitles = storedSubtitles.filter(({ type }) => type === 'local');
        subtitleRequests.push(getLocalSubtitlesList(videoSrc, storedLocalSubtitles));
      }
      if (requestedTypes.includes('embedded')) {
        const storedEmbeddedSubtitles = storedSubtitles
          .filter(({ type }) => type === 'embedded');
        subtitleRequests.push(getEmbeddedSubtitlesList(videoSrc, storedEmbeddedSubtitles));
      }
      if (requestedTypes.includes('online')) {
        const storedOnlineSubtitleIds = storedSubtitles
          .filter(({ type }) => type === 'online')
          .map(({ id }) => id);
        const clearOnline = !isEqual(
          sortBy(storedLanguagePreference),
          sortBy(preferredLanguages),
        ) || !storedOnlineSubtitleIds.length;
        resetOnlineSubtitles();
        const isFetching = !this.isInitial || clearOnline;
        subtitleRequests.push(getOnlineSubtitlesList(
          videoSrc,
          isFetching,
          storedOnlineSubtitleIds,
          preferredLanguages,
        ));
      }

      if (!this.isInitial) {
        this.selectionComplete = false;
        this.selectionSecondaryComplete = false;
        this.checkCurrentSubtitleList();
      }

      return Promise.all(subtitleRequests)
        .then(async () => {
          this.$bus.$emit('refresh-finished');
          if (this.isInitial) {
            const Ids = await retrieveSelectedSubtitleId(videoSrc);
            const switchLanguage = storedLanguagePreference[0] === preferredLanguages[1] &&
              storedLanguagePreference[1] === preferredLanguages[0];
            const selectedSubtitles = storedSubtitles
              .filter(({ id }) => [Ids.firstId, Ids.secondaryId].includes(id));
            const shiftFirstId = selectedSubtitles
              .find(({ language }) => language === preferredLanguages[0])?.id;
            const shiftSecondaryId = selectedSubtitles
              .find(({ language }) => language === preferredLanguages[1])?.id;
            const firstId = switchLanguage ? shiftFirstId : Ids.firstId;
            const secondaryId = switchLanguage ? shiftSecondaryId : Ids.secondaryId;
            if (firstId) {
              this.changeCurrentFirstSubtitle(firstId);
              this.selectionComplete = true;
            }
            if (secondaryId) {
              this.changeCurrentSecondSubtitle(secondaryId);
              this.selectionSecondaryComplete = true;
            }
            this.isInitial = false;
          }
          this.checkCurrentSubtitleList();
          return storeLanguagePreference(videoSrc, preferredLanguages);
        });
    },
    async getLocalSubtitlesList(videoSrc, storedSubs) {
      const newLocalSubs = await searchForLocalList(videoSrc, SubtitleLoader.supportedFormats)
        .catch(() => []);
      return values(merge(
        keyBy(storedSubs.map(({ src, id }) => ({ src, type: 'local', options: { id } })), 'src'),
        keyBy(newLocalSubs, 'src'),
      ))
        .map(this.normalizeSubtitle)
        .map(sub => this.addSubtitle(sub, videoSrc));
    },
    async getModifiedSubtitlesList(videoSrc, storedSubs) {
      // 加载自制字幕,
      // 先根据视频，查找缓存目录自制字幕列表
      const cacheSubs = await searchFromTempList(videoSrc)
        .catch(() => []);
      const cacheModifiedSubs = cacheSubs.filter(e => e.type === 'modified');
      // 和indexDB中modified字幕列表对比取交集元素
      const list = intersectionBy(storedSubs.map(({ src, id }) => ({ src, type: 'modified', options: { id } })), cacheModifiedSubs, 'src');
      if (list.length === 0) return [];
      const result = await getSubtitleContentByPath(list);
      return result.map(this.normalizeSubtitle)
        .map(sub => this.addSubtitle(sub, videoSrc));
    },
    async getOnlineSubtitlesList(videoSrc, isFetching, storedSubIds, languages) {
      if (!isFetching) {
        const retrieveSub = id => retrieveSubtitle(id)
          .then(({ src, data, language }) => ({
            src,
            type: 'online',
            options: { language, data, id },
          }))
          .then(sub => this.addSubtitle(this.normalizeSubtitle(sub), videoSrc))
          .catch(err => (err instanceof Error ? new Error(err) : err));
        const storedSubs = await Promise.all(storedSubIds.map(retrieveSub))
          .then(subtitleResults => subtitleResults.filter((result) => {
            if (result instanceof Error) {
              this.addLog('error', {
                message: 'Request Timeout .',
                errcode: REQUEST_TIMEOUT,
              });
              this.$addBubble(REQUEST_TIMEOUT);
              return [];
            }
            return result;
          }))
          .then(flatten);
        if (storedSubs.length) return storedSubs;
      }
      const hints = this.generateHints(videoSrc);
      const fetchSubs = lang => fetchOnlineList(videoSrc, lang, hints)
        .then((results) => {
          this.$bus.$emit('online-subtitle-found');
          return Promise.all(results
            .map(this.normalizeSubtitle)
            .map(sub => this.addSubtitle(sub, videoSrc)));
        }).catch(() => []);
      const newSubs = await Promise.all(languages.map(fetchSubs)).then(flatten);
      //
      storedSubIds.forEach(e => delete this.subtitleInstances[e]);
      await deleteSubtitles(storedSubIds, videoSrc);
      return newSubs;
    },
    async getEmbeddedSubtitlesList(videoSrc, storedSubs) {
      const newEmbeddedSubs = await retrieveEmbeddedList(
        videoSrc,
        SubtitleLoader.supportedCodecs,
      ).catch(() => []).then(castArray);
      return values(merge(
        keyBy(storedSubs.map(({ src, id }) => ({ src, type: 'embedded', options: { id } })), 'src'),
        keyBy(newEmbeddedSubs, 'src'),
      )).map(this.normalizeSubtitle)
        .map(sub => this.addSubtitle(sub, videoSrc));
    },
    async addSubtitle({ src, type, options }, videoSrc) {
      const sameSrcSubtitle = Object.values(this.subtitleInstances)
        .find(sub => sub.src === src);
      if (sameSrcSubtitle instanceof SubtitleLoader) {
        const { id } = sameSrcSubtitle;
        // different id indicates that this sub is new and need to delete the old
        if (id !== options.id) this.failedCallback(sameSrcSubtitle);
        // same id from options indicates that this sub is already loaded
        else {
          if (existsSync(src) || type !== 'local') return sameSrcSubtitle;
          return this.failedCallback(sameSrcSubtitle, {
            error: { message: `Local subtitle ${src} removed!` },
            bubble: LOCAL_SUBTITLE_REMOVED,
          });
        }
      }
      const subtitleInstance = new SubtitleLoader(src, type, { ...options, videoSrc });
      try {
        return this.setupListeners(subtitleInstance, {
          metaChange: this.metaChangeCallback,
          loading: partial(this.loadingCallback, videoSrc),
          ready: this.readyCallback,
          loaded: this.addSubtitleWhenLoaded,
          failed: this.failedCallback,
        });
      } catch (err) {
        this.failedCallback(subtitleInstance);
      }
      return 'failed'; // slient errors temporarily
    },
    normalizeSubtitle(subtitle) {
      if (typeof subtitle === 'object') {
        const { src, type, options } = subtitle;
        if (src && type) return { src, type, options: options || {} };
      } else if (typeof subtitle === 'string') {
        return { src: subtitle, type: 'local', options: {} };
      }
      return null;
    },
    metaInfoUpdate(id, field, value) {
      this.updateMetaInfo({ id, type: field, value });
    },
    findSubtitleByWith(rank, withParameter, byParameter, subtitleList, expected) {
      const listSortedByParameter = sortBy(
        subtitleList,
        sub => rank.lastIndexOf(sub[withParameter]),
      );
      return listSortedByParameter.find(sub => sub[byParameter] === expected);
    },
    findSubtitleByLanguageWithTypeRank(subtitleList, language) {
      return this.findSubtitleByWith(
        ['local', 'embedded', 'online'],
        'type', 'language',
        subtitleList,
        language,
      );
    },
    async computeSubtitleName(type, id, options, subtitleList) {
      if (type === 'local') return '';
      subtitleList = sortBy([...subtitleList], ['id']);
      const computedIndex = subtitleList
        .filter((subtitle) => {
          if (type === 'online' && subtitle.language && options.language) {
            return subtitle.type === type && subtitle.language === options.language;
          }
          return subtitle.type === type;
        })
        .findIndex(subtitle => id === subtitle.id)
        + 1;
      switch (type) {
        default:
          return '';
        case 'embedded': {
          let { language } = options;
          const { src, format } = options;
          if (!language && !src) {
            throw (new TypeError('Expected at least language or src for calculate embedded subtitle\'s name.'));
          } else if (!language) {
            language = await localLanguageLoader(src, format);
          }
          return `${romanize(computedIndex)} - ${codeToLanguageName(language)}`;
        }
        case 'online': {
          const { language } = options;
          if (!language) {
            throw (new TypeError('Expected language from option for online subtitle'));
          }
          return `${codeToLanguageName(language)} ${romanize(computedIndex)}`;
        }
      }
    },
    setupListeners(subtitleInstance, listeners) {
      return new Promise((resolve, reject) => {
        if (subtitleInstance instanceof SubtitleLoader) {
          const {
            loading, ready, loaded, failed,
            metaChange,
          } = listeners;
          if (isFunction(loading)) {
            subtitleInstance.once('loading', () => {
              loading(subtitleInstance);
              resolve(subtitleInstance);
              subtitleInstance.meta();

              if (isFunction(metaChange)) subtitleInstance.on('meta-change', partial(metaChange, subtitleInstance));
              if (isFunction(ready)) subtitleInstance.once('ready', partial(ready, subtitleInstance));
              if (isFunction(failed)) subtitleInstance.once('failed', partial(failed, subtitleInstance));
              if (isFunction(loaded)) subtitleInstance.once('parse', partial(loaded, subtitleInstance));
            });
          } else reject(new TypeError(`${loading} is not a function!`));
        } else reject(new TypeError(`Expected a SubtitleLoader instance, but ${subtitleInstance} provided.`));
      });
    },
    metaChangeCallback({ id }, { field, value }) {
      this.metaInfoUpdate(id, field, value);
    },
    loadingCallback(videoSrc, subtitleInstance) {
      const { id, type, src } = subtitleInstance;
      this.$set(this.subtitleInstances, id, subtitleInstance);
      this.addSubtitleWhenLoading({ id, type, videoSrc });
      if (type === 'local' && !existsSync(src)) {
        this.failedCallback(subtitleInstance, {
          error: { message: `Local subtitle ${src} removed!` },
          bubble: LOCAL_SUBTITLE_REMOVED,
        });
      }
    },
    async readyCallback(subtitleInstance, metaInfo) {
      const { type, id, src } = subtitleInstance;
      const { format, language, name } = metaInfo;
      metaInfo.name = await this.computeSubtitleName(
        type,
        id,
        { format, language, src },
        this.subtitleList,
      ) || name;
      this.addSubtitleWhenReady({ id, format });
      updateSubtitle(id, { language });
      this.checkCurrentSubtitleList();
    },
    async loadedCallback(subtitleInstance) {
      const {
        id, type, metaInfo, data,
      } = subtitleInstance;
      this.addSubtitleWhenLoaded({ id });
      const result = { language: metaInfo.language };
      if (type === 'online') result.data = data;
      return updateSubtitle(id, result);
    },
    failedCallback({ id, videoSrc }, { error, bubble } = {}) {
      if (bubble) this.addLog('error', { errcode: bubble, message: error.message });
      if (this.currentFirstSubtitleId === id) {
        this.changeCurrentFirstSubtitle(this.lastFirstSubtitleId);
      }
      if (this.currentSecondSubtitleId === id) {
        this.changeCurrentSecondSubtitle(this.lastSecondSubtitleId);
      }
      this.$delete(this.subtitleInstances, id);
      deleteSubtitles([id], videoSrc);
      this.addSubtitleWhenFailed({ id });
    },
    checkCurrentSubtitleList() {
      const {
        selectionComplete,
        selectionSecondaryComplete,
        subtitleList,
        preferredLanguages,
      } = this;
      const validSubtitleList = subtitleList.filter(({ name }) => !!name);
      if (!selectionComplete || !selectionSecondaryComplete) {
        const hasPrimaryLanguage = validSubtitleList
          .find(({ language }) => language === preferredLanguages[0]);
        const hasSecondaryLanguage = validSubtitleList
          .find(({ language }) => language === preferredLanguages[1]);
        if (hasPrimaryLanguage) {
          this.changeCurrentFirstSubtitle(hasPrimaryLanguage.id);
          this.selectionComplete = true;
          if (hasSecondaryLanguage) {
            this.changeCurrentSecondSubtitle(hasSecondaryLanguage.id);
            this.selectionSecondaryComplete = true;
          }
        } else if (hasSecondaryLanguage) {
          if (selectionComplete) {
            this.changeCurrentSecondSubtitle(hasSecondaryLanguage.id);
            this.selectionSecondaryComplete = true;
          } else {
            this.changeCurrentFirstSubtitle(hasSecondaryLanguage.id);
            this.changeCurrentSecondSubtitle('');
            this.selectionComplete = true;
            this.selectionSecondaryComplete = true;
          }
        } else {
          this.changeCurrentFirstSubtitle('');
          this.changeCurrentSecondSubtitle('');
        }
      }
    },
    /**
     * generate a valid subtitle from the given id
     * valid subtitle is from both this.subtitleList and this.subtitleInstances
     * @param {string} id - the valid subtitle id
     * @returns an object with src, id, type, format, language and data(maybe)
     */
    async generateValidSubtitle(id) {
      const subtitleInstance = this.subtitleInstances[id];
      const subtitleInfo = this.subtitleList.find(({ id: subtitleId }) => id === subtitleId);
      if (!subtitleInstance || !subtitleInfo) throw new Error(`No subtitle instance ${id}!`);
      const { type, src, data } = subtitleInstance;
      const { language, format } = subtitleInfo;
      return ({
        id,
        src,
        type,
        format,
        data: type === 'online' ? data : undefined, // only store online subtitle's data
        language,
      });
    },
    /**
     * generate a valid subtitle list of info for the given videoSrc
     * valid subtitle info is from this.subtitleList and this.$refs.subtitleRenderer
     * @param {string} videoSrc - valid videoSrc
     * @returns a list of subtitle info(with id, type, name, rank and videoSegments(maybe))
     */
    async generateValidSubtitleList(videoSrc) {
      const finalList = [];
      const { currentFirstSubtitleId } = this;
      const currentVideoSegments = this.$refs.subtitleRenderer.videoSegments;
      // generate valid subtitle list members
      this.subtitleList.forEach((subtitleInfo) => {
        const {
          id, type, name, rank,
        } = subtitleInfo;
        if (id !== currentFirstSubtitleId) {
          finalList.push({
            id, type, name, rank,
          });
        } else {
          finalList.push({
            id,
            type,
            name,
            rank,
            videoSegments: currentVideoSegments,
          });
        }
      });

      return {
        videoSrc,
        subtitles: finalList,
      };
    },
    async allSubtitleListWatcher(newVal, oldVal) {
      const pickValidProperties = val => pick(val, 'id', 'type', 'language', 'rank');
      const extractReadySubtitles = subtitles => subtitles
        .filter(({ loading }) => loading === 'ready' || loading === 'loaded')
        .map((subtitleInfo) => {
          const result = pickValidProperties(subtitleInfo);
          if (result.id === this.currentFirstSubtitleId && this.$refs.subtitleRenderer) {
            result.videoSegments = this.$refs.subtitleRenderer.videoSegments;
          }
          if (this.subtitleInstances[result.id] && this.subtitleInstances[result.id].src) {
            result.src = this.subtitleInstances[result.id].src;
          }
          return result;
        });
      const newSubtitles = differenceWith(
        extractReadySubtitles(newVal),
        extractReadySubtitles(oldVal),
        isEqual,
      );
      const subtitleMap = newSubtitles
        .reduce((finalMap, currentSubtitleInfo) => {
          const { id } = currentSubtitleInfo;
          const videoSrc = this.getVideoSrcById(id);
          const subtitles = finalMap[videoSrc];
          if (subtitles) {
            finalMap[videoSrc] = [...subtitles, currentSubtitleInfo];
          } else {
            finalMap[videoSrc] = [currentSubtitleInfo];
          }
          return finalMap;
        }, {});
      const updateSubtitleListPromises = Object.keys(subtitleMap)
        .map(videoSrc => updateSubtitleList(videoSrc, subtitleMap[videoSrc]));
      return Promise.all(updateSubtitleListPromises);
    },
    makeSubtitleUploadParameter({ id, duration: playedTime }) {
      const result = {
        playedTime,
        mediaIdentity: this.mediaHash,
        totalTime: this.duration,
        delay: this.subtitleDelay,
        src: id,
        hints: this.generateHints(this.originSrc),
      };
      const instance = this.subtitleInstances[id];
      if (instance) {
        const {
          src, type, data, metaInfo,
        } = instance;
        const {
          language: languageCode,
          format,
        } = metaInfo;
        if (languageCode) result.languageCode = languageCode;
        switch (type) {
          default:
            break;
          case 'online':
            result.format = 'online';
            result.transcriptIdentity = src;
            break;
          case 'embedded':
          case 'local':
            result.format = format;
            if (data) result.payload = Buffer.from(data);
            break;
        }
      }
      return result;
    },
    generateHints(videoSrc) {
      let result;
      videoSrc.split(sep).reverse().some((dirOrFileName, index) => {
        if (index === 0) {
          result = dirOrFileName;
          return false;
        } else if (index <= 2) {
          result = `${dirOrFileName}${sep}${result}`;
          return false;
        }
        result = `${sep}${result}`;
        return true;
      });
      return result;
    },
    /**
     * 快速修改一个非自制字幕，会创建新的自制字幕，执行写文件，加载字幕的动作
     * 快速修改一个自制字幕，会覆盖原先的自制字幕内容。
     * 在高级模式下，修改自制字幕，不会触发读写操作，仅修改内存数据
     */
    modifiedSubtitle({ sub, isSecondSub }) {
      // 这里统一处理新增或者修改自制
      // 如果type 不是 modified 就是创建新的自制字幕
      // 如果是modified就修改原来的文件，更新instance
      if (sub && sub.type === 'modified') {
        // 先更新当前内存字幕信息
        const s = {};
        s[sub.id] = sub;
        this.subtitleInstances = Object.assign({}, this.subtitleInstances, s);
        if (!this.isProfessional) {
          // 如果不是高级模式，出现修改字幕就立即同步文件
          const subString = JSON.stringify({
            parsed: sub.parsed,
            metaInfo: sub.metaInfo,
            referenceSubtitleId: sub.referenceSubtitleId,
            // reference: sub.reference,
          });
          writeSubtitleByPath(sub.src, subString);
        }
      } else if (sub) {
        // 如果不是自制的字幕出现修改，就是先创建新的自制字幕
        // 再加载刚刚创建的字幕
        sub.metaInfo.format = 'ass'; // 所有自制字幕都以ass数据格式保存
        sub.parsed.dialogues.map(e => uniteSubtitleWithFragment(e));
        const subString = JSON.stringify({
          parsed: sub.parsed,
          metaInfo: sub.metaInfo,
          referenceSubtitleId: this.isProfessional ? this.referenceSubtitleId : null,
          // reference: sub.reference,
        });
        // 创建新的自制字幕
        addSubtitleByMediaHash(this.mediaHash, subString, { type: 'modified' }).then((result) => {
          // 如果是快捷修改
          if (!this.isProfessional) {
            const whichSub = isSecondSub ? 'second-subtitle' : 'first-subtitle';
            this.$ga.event('app', 'quick-modified', whichSub);
          }
          // 创建成功后往当前字幕列表添加新创建的自制字幕
          this.$bus.$emit('add-subtitles', [{
            src: result.path,
            type: 'modified',
            options: {
              storage: {
                isFastCreateFromSecondSub: isSecondSub,
                parsed: sub.parsed,
                metaInfo: {
                  ...sub.metaInfo,
                  name: result.name,
                },
                referenceSubtitleId: this.isProfessional ? this.referenceSubtitleId : null,
              },
            },
          }]);
        });
      }
    },
    /**
     * 保存正在操作字幕的内存数据到文件
     */
    async saveSubtitle() {
      // 主动触发保存操作
      const currentSubtitle = this.subtitleInstances[this.currentFirstSubtitleId];
      const isModifiedExit = currentSubtitle && currentSubtitle.type === 'modified';
      if (isModifiedExit) {
        const subString = JSON.stringify({
          parsed: currentSubtitle.parsed,
          metaInfo: currentSubtitle.metaInfo,
          referenceSubtitleId: this.isProfessional ? this.referenceSubtitleId :
            currentSubtitle.referenceSubtitleId,
          // reference: currentSubtitle.reference,
        });
        try {
          await writeSubtitleByPath(currentSubtitle.src, subString);
          this.addMessages({
            type: 'state',
            content: this.$t('notificationMessage.subtitle.saveSuccess.content'),
            dismissAfter: 2000,
          });
        } catch (err) {
          console.log(err);
        }
      }
    },
    /**
     * 字幕面板触发删除自制字幕
     * 定时5s后触发真删除（删infoDB、file）
     */
    deleteSubtitle({ sub }) {
      // 删除字幕文件(自制字幕)
      // 拿到字幕的src发到气泡确认删除
      const id = sub.id;
      const path = this.subtitleInstances[id].src;
      this.deleteModifiedSubtitleInstance = cloneDeep(this.subtitleInstances[id]);
      this.$bus.$emit(bus.SUBTITLE_DELETE_CONFIRM, path);
      // 开启定时删除，如果气泡确认不删除，就取消定时
      this.deleteModifiedSubtitleTimer = setTimeout(async () => {
        deleteSubtitles([id], this.originSrc).then(async (result) => {
          this.addLog('info', `Subtitle delete { successId:${result.success}, failureId:${result.failure} }`);
          await deleteFileByPath(path);
          this.$bus.$emit(bus.SUBTITLE_DELETE_DONE);
          this.deleteModifiedSubtitleInstance = null;
        });
      }, 5000);
    },
    /**
     *导出当前字幕vtt
     */
    exportSubtitle() {
      const currentSubtitle = this.subtitleInstances[this.currentFirstSubtitleId];
      if (currentSubtitle && currentSubtitle.type === 'modified') {
        const { remote } = this.$electron;
        const { app, dialog } = remote;
        const browserWindow = remote.BrowserWindow;
        const focusWindow = browserWindow.getFocusedWindow();
        let defaultPath = this.defaultDir;
        if (!this.defaultDir) {
          defaultPath = process.platform === 'darwin' ? app.getPath('home') : app.getPath('desktop');
          this.$store.dispatch('UPDATE_DEFAULT_DIR', defaultPath);
        }
        const originSrc = this.originSrc;
        const videoName = `${basename(originSrc, extname(originSrc))}`;
        const name = `${this.$t('subtitle.modified')} ${romanize(currentSubtitle.metaInfo.name)}-${videoName}`;
        const fileName = `${basename(name, '.vtt')}.vtt`;
        defaultPath = join(defaultPath, fileName);
        dialog.showSaveDialog(focusWindow, {
          defaultPath,
        }, async (filePath) => {
          if (filePath) {
            const str = dialogueToString(currentSubtitle.parsed.dialogues);
            try {
              writeSubtitleByPath(filePath, str);
            } catch (err) {
              console.log(err);
            }
          }
        });
      }
    },
  },
  created() {
    this.$bus.$on('add-subtitles', (subs) => {
      Promise.all(subs
        .map(this.normalizeSubtitle)
        .filter(sub => !!sub)
        .map(sub => this.addSubtitle(sub, this.originSrc)))
        .then((subtitleInstances) => {
          const sub = subtitleInstances[subtitleInstances.length - 1];
          // 如果是在高级编辑模式下，当前有修改的字幕id，这个时候添加字幕都不会被选中
          if (sub.isFastCreateFromSecondSub) {
            this.changeCurrentSecondSubtitle(sub.id);
            this.selectionComplete = true;
            this.selectionSecondaryComplete = true;
          } else if (!(this.isProfessional && this.currentEditedSubtitleId)) {
            this.changeCurrentFirstSubtitle(sub.id);
            // 如果是在第二字幕面板创建了一个新字幕，这时，第一字幕选中新字幕，第二字幕选中无
            if (!this.isFirstSubtitle) {
              this.changeCurrentSecondSubtitle('');
            }
            this.selectionComplete = true;
            this.selectionSecondaryComplete = true;
          }
        });
    });
    this.$bus.$on('refresh-subtitles', ({ types, isInitial }) => {
      this.refreshSubtitles(types, this.originSrc, isInitial);
      this.isInitial = isInitial;
    });
    this.$bus.$on('change-subtitle', (id) => {
      if (this.isFirstSubtitle) {
        this.changeCurrentFirstSubtitle(id);
      } else {
        this.changeCurrentSecondSubtitle(id);
      }
    });
    this.$bus.$on('off-subtitle', this.offCurrentSubtitle);
    this.$bus.$on('upload-current-subtitle', () => {
      this.addLog('info', {
        message: 'Upload current subtitle .',
        code: SUBTITLE_UPLOAD,
      });
      this.$addBubble(SUBTITLE_UPLOAD);
      const qualifiedSubtitles = [];
      if (this.currentFirstSubtitleId) {
        qualifiedSubtitles.push({
          id: this.currentFirstSubtitleId,
          duration: this.$store.state.Subtitle.durations[this.currentFirstSubtitleId],
        });
      }
      if (this.currentSecondSubtitleId && this.enabledSecondarySub) {
        qualifiedSubtitles.push({
          id: this.currentSecondSubtitleId,
          duration: this.$store.state.Subtitle.durations[this.currentSecondSubtitleId],
        });
      }
      if (qualifiedSubtitles.length) {
        const parameters = qualifiedSubtitles.map(this.makeSubtitleUploadParameter);
        transcriptQueue.addAllManual(parameters)
          .then((res) => {
            if (res.failure.length) {
              this.addLog('error', {
                message: 'Upload failed !',
                errcode: UPLOAD_FAILED,
              });
              this.$addBubble(UPLOAD_FAILED);
              res.failure.forEach((i) => {
                console.log(`Uploading subtitle No.${i.src} failed!`);
              });
            } else {
              this.addLog('info', {
                message: 'Upload successfully !',
                code: UPLOAD_SUCCESS,
              });
              this.$addBubble(UPLOAD_SUCCESS);
            }
            if (res.success.length) {
              res.success.forEach((i) => {
                console.log(`Uploading subtitle No.${i.src} succeeded!`);
              });
            }
          });
      }
    });
    // 接受字幕的修改，包括自制字幕和原始字幕，处理逻辑统一在this.modifiedSubtitle
    this.$bus.$on(bus.DID_MODIFIED_SUBTITLE, this.modifiedSubtitle);
    // 当删除某个字幕的文件
    this.$bus.$on(bus.SUBTITLE_DELETE, this.deleteSubtitle);
    // 收到取消删除事件
    this.$bus.$on(bus.SUBTITLE_DELETE_CANCEL, () => {
      clearTimeout(this.deleteModifiedSubtitleTimer);
      this.deleteModifiedSubtitleTimer = null;
      // 取消删除的时候，需要重新加载
      // TODO假删除不去infoDB删
      if (this.deleteModifiedSubtitleInstance) {
        const sub = this.deleteModifiedSubtitleInstance;
        this.$bus.$emit('add-subtitles', [{
          src: sub.src,
          type: 'modified',
          options: {
            storage: {
              isFastCreateFromSecondSub: sub.isFastCreateFromSecondSub,
              parsed: sub.parsed,
              metaInfo: {
                ...sub.metaInfo,
              },
              referenceSubtitleId: sub.referenceSubtitleId,
            },
          },
        }]);
      }
    });
    // 立即删除
    this.$bus.$on(bus.SUBTITLE_DELETE_IMMEDIATELY, () => {
      clearTimeout(this.deleteModifiedSubtitleTimer);
      this.deleteModifiedSubtitleTimer = null;
      if (this.deleteModifiedSubtitleInstance) {
        const id = this.deleteModifiedSubtitleInstance.id;
        const path = this.deleteModifiedSubtitleInstance.src;
        deleteSubtitles([id], this.originSrc).then(async (result) => {
          this.addLog('info', `Subtitle delete { successId:${result.success}, failureId:${result.failure} }`);
          await deleteFileByPath(path);
          this.$bus.$emit(bus.SUBTITLE_DELETE_DONE);
          this.deleteModifiedSubtitleInstance = null;
        });
      }
    });
    // 导出自制字幕
    this.$bus.$on(bus.EXPORT_MODIFIED_SUBTITLE, this.exportSubtitle);
    // 保存字幕
    this.$bus.$on(bus.SUBTITLE_EDITOR_SAVE, this.saveSubtitle);
    // 加载本地字幕为参考字幕
    this.$bus.$on(bus.SUBTITLE_EDITOR_LOAD_LOCAL, (src) => {
      this.watchLoadSubtitleFromLocal = src;
    });
    // when set immediate on watcher, it may run before the created hook
    this.resetSubtitles();
    this.$bus.$emit('subtitle-refresh-from-src-change');
    this.updateNoSubtitle(true);
  },
};
</script>
<style lang="scss" scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 200ms ease-in;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }
</style>
