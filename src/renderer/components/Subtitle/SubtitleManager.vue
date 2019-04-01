<template>
  <div>
    <subtitle-renderer
      ref="subtitleRenderer"
      v-if="!isProfessional"
      :key="currentSubtitle && currentSubtitle.id"
      :playlistShow="playlistShow"
      :subtitleInstance="currentSubtitle"/>
    <subtitle-editor
      v-if="isProfessional"
      :subtitleInstance="currentSubtitle"/>
  </div>
</template>
<script>
import { mapGetters, mapActions, mapMutations, mapState } from 'vuex';
import romanize from 'romanize';
import { sep, join, basename } from 'path';
import { flatten, isEqual, sortBy, differenceWith, isFunction, partial, pick, values, keyBy, mergeWith, castArray, intersectionBy } from 'lodash';
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
import { Subtitle as subtitleMutations } from '@/store/mutationTypes';
import { EVENT_BUS_COLLECTIONS as bus } from '@/constants';
// import SubtitleRenderer from './SubtitleRenderer.vue';
import SubtitleEditor from './SubtitleEditor.vue';
import SubtitleRenderer from './SubtitleRenderer.vue';
import SubtitleLoader from './SubtitleLoader';
import { localLanguageLoader } from './SubtitleLoader/utils';

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
      isInitial: false,
    };
  },
  computed: {
    ...mapGetters([
      'originSrc', // use to find proper subtitles and clear subtitle upon change
      'mediaHash', // use to provide subtitle with videoIdentity
      'subtitleList', 'currentSubtitleId', // use to get current subtitle info and auto selection subtitles
      'computedWidth', 'computedHeight', // to determine the subtitle renderer's container size
      'duration', // do not load subtitle renderer when video(duration) is not available(todo: global variable to tell if video is totally available)
      'getVideoSrcById', 'allSubtitleList', // serve allSubtitleListWatcher
      'subtitleDelay', // subtitle's delay
      'isProfessional', // 字幕编辑高级模式属性
      'storedWindowInfo', 'winRatio', 'defaultDir',
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
    }),
    currentSubtitle() {
      return this.subtitleInstances[this.currentSubtitleId];
    },
  },
  watch: {
    originSrc(newVal) {
      if (newVal) {
        this.resetSubtitles();
        this.selectionComplete = false;
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
    },
    currentSubtitleId(newVal) {
      if (this.selectionComplete || newVal) updateSelectedSubtitleId(this.originSrc, newVal);
    },
    isProfessional(val) {
      // 如果当前修改的是自制字幕，再离开字幕编辑高级模式，这个时候触发保存到本地的操作
      const isModifiedExit = this.currentSubtitle && this.currentSubtitle.type === 'modified';
      if (!val && isModifiedExit) {
        const subString = JSON.stringify({
          parsed: this.currentSubtitle.parsed,
          metaInfo: this.currentSubtitle.metaInfo,
        });
        writeSubtitleByPath(this.currentSubtitle.src, subString);
      }
      // 处理最小尺寸设置
      let minSize = [];
      if (!val && this.storedWindowInfo && this.storedWindowInfo.minimumSize) {
        minSize = this.storedWindowInfo.minimumSize;
      } else {
        // 进入编辑模式，设定phase2为最小的尺寸
        minSize = this.winRatio > 1 ? [480 * this.winRatio, 480] : [480, 480 / this.winRatio];
        minSize = minSize.map(Math.round);
      }
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', minSize);
      // this.windowMinimumSize(minSize);
    },
  },
  methods: {
    ...mapActions({
      resetSubtitles: subtitleActions.RESET_SUBTITLES,
      resetOnlineSubtitles: subtitleActions.RESET_ONLINE_SUBTITLES,
      changeCurrentSubtitle: subtitleActions.CHANGE_CURRENT_SUBTITLE,
      offCurrentSubtitle: subtitleActions.OFF_SUBTITLES,
      addSubtitleWhenLoading: subtitleActions.ADD_SUBTITLE_WHEN_LOADING,
      addSubtitleWhenReady: subtitleActions.ADD_SUBTITLE_WHEN_READY,
      addSubtitleWhenLoaded: subtitleActions.ADD_SUBTITLE_WHEN_LOADED,
      addSubtitleWhenFailed: subtitleActions.ADD_SUBTITLE_WHEN_FAILED,
      updateMetaInfo: subtitleActions.UPDATE_METAINFO,
      updateNoSubtitle: subtitleActions.UPDATE_NO_SUBTITLE,
    }),
    ...mapMutations({
      resetSubtitlesByMutation: subtitleMutations.RESET_SUBTITLES,
      windowMinimumSize: 'windowMinimumSize', // 需要设置到常量里面
    }),
    async refreshSubtitles(types, videoSrc) {
      const supportedTypes = ['local', 'embedded', 'online', 'modified'];
      const {
        getLocalSubtitlesList,
        getModifiedSubtitlesList,
        getOnlineSubtitlesList,
        getEmbeddedSubtitlesList,
        normalizeSubtitleList,
        addSubtitle,
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
        this.checkCurrentSubtitleList();
      }

      return Promise.all(subtitleRequests)
        .then(subtitleLists => Promise.all(subtitleLists.map(normalizeSubtitleList)))
        .then(normalizedLists => flatten(normalizedLists))
        .then(allSubtitles => Promise.all(allSubtitles.map(sub => addSubtitle(sub, videoSrc))))
        .then(async () => {
          this.$bus.$emit('refresh-finished');
          if (this.isInitial) {
            const id = await retrieveSelectedSubtitleId(videoSrc);
            if (id) {
              this.changeCurrentSubtitle(id);
              this.selectionComplete = true;
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
      return values(mergeWith(
        keyBy(storedSubs.map(({ src, id }) => ({ src, type: 'local', options: { id } })), 'src'),
        keyBy(newLocalSubs, 'src'),
      ));
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
      return result;
    },
    async getOnlineSubtitlesList(videoSrc, isFetching, storedSubIds, languages) {
      if (!isFetching) {
        const retrieveSub = id => retrieveSubtitle(id)
          .then(({ src, data, language }) => ({
            src,
            type: 'online',
            options: { language, data, id },
          }))
          .catch(() => []);
        const storedSubs = await Promise.all(storedSubIds.map(retrieveSub)).then(flatten);
        if (storedSubs.length) {
          return storedSubs;
        }
      }
      const hints = this.generateHints(videoSrc);
      const fetchSubs = lang => fetchOnlineList(videoSrc, lang, hints).catch(() => []);
      const newSubs = await Promise.all(languages.map(fetchSubs)).then(flatten);
      deleteSubtitles(storedSubIds);
      return newSubs;
    },
    async getEmbeddedSubtitlesList(videoSrc, storedSubs) {
      const newEmbeddedSubs = await retrieveEmbeddedList(
        videoSrc,
        SubtitleLoader.supportedCodecs,
      ).catch(() => []).then(castArray);
      return values(mergeWith(
        keyBy(storedSubs.map(({ src, id }) => ({ src, type: 'embedded', options: { id } })), 'src'),
        keyBy(newEmbeddedSubs, 'src'),
      ));
    },
    async addSubtitle({ src, type, options }, videoSrc) {
      if (options.id) {
        const existedInList = !!this.subtitleList.find(({ id }) => id === options.id);
        const existedInInstances = !!this.subtitleInstances[options.id];
        if (existedInList && existedInInstances) return 'success';
      }
      const subtitleInstance = new SubtitleLoader(src, type, { ...options });
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
    normalizeSubtitleList(subtitleList) {
      if (!subtitleList || !Object.keys(subtitleList).length) return [];
      const processedSubtitleList = [];
      if (subtitleList instanceof Array) {
        processedSubtitleList
          .push(...subtitleList
            .filter(subtitle => !!subtitle.src && !!subtitle.type)
            .map(subtitle => ({ ...subtitle, options: subtitle.options || {} })));
      } else if (typeof subtitleList === 'object') {
        const { src, type, options } = subtitleList;
        if (src && type) processedSubtitleList.push({ src, type, options: options || {} });
      } else if (typeof subtitleList === 'string') {
        processedSubtitleList.push({ src: subtitleList, type: 'local', options: {} });
      }
      if (processedSubtitleList.length) {
        this.updateNoSubtitle(false);
      } else {
        this.updateNoSubtitle(true);
      }
      return processedSubtitleList;
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
      const { id, type } = subtitleInstance;
      this.$set(this.subtitleInstances, id, subtitleInstance);
      this.addSubtitleWhenLoading({ id, type, videoSrc });
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
    failedCallback({ id }) {
      this.$delete(this.subtitleInstances, id);
      this.addSubtitleWhenFailed({ id });
    },
    checkCurrentSubtitleList() {
      const {
        selectionComplete,
        subtitleList,
        preferredLanguages,
      } = this;
      const validSubtitleList = subtitleList.filter(({ name }) => !!name);
      if (!selectionComplete) {
        const hasPrimaryLanguage = validSubtitleList
          .find(({ language }) => language === preferredLanguages[0]);
        if (hasPrimaryLanguage) {
          this.changeCurrentSubtitle(hasPrimaryLanguage.id);
          this.selectionComplete = true;
        } else {
          const hasSecondaryLanguage = validSubtitleList
            .find(({ language }) => language === preferredLanguages[1]);
          if (hasSecondaryLanguage) {
            this.changeCurrentSubtitle(hasSecondaryLanguage.id);
            this.selectionComplete = true;
          } else {
            this.changeCurrentSubtitle('');
          }
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
      const { currentSubtitleId } = this;
      const currentVideoSegments = this.$refs.subtitleRenderer.videoSegments;
      // generate valid subtitle list members
      this.subtitleList.forEach((subtitleInfo) => {
        const {
          id, type, name, rank,
        } = subtitleInfo;
        if (id !== currentSubtitleId) {
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
          if (result.id === this.currentSubtitleId && this.$refs.subtitleRenderer) {
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
    modifiedSubtitle({ sub }) {
      // 这里统一处理新增或者修改自制
      // 如果type 不是 modified 就是创建新的自制字幕
      // 如果是modified就修改原来的文件，更新instance
      if (sub.type === 'modified') {
        // 先更新当前内存字幕信息
        const s = {};
        s[sub.id] = sub;
        this.subtitleInstances = Object.assign({}, this.subtitleInstances, s);
        if (!this.isProfessional) {
          // 如果不是高级模式，出现修改字幕就立即同步文件
          const subString = JSON.stringify({
            parsed: sub.parsed,
            metaInfo: sub.metaInfo,
          });
          writeSubtitleByPath(sub.src, subString);
        }
      } else {
        // 如果不是自制的字幕出现修改，就是先创建新的自制字幕
        // 再加载刚刚创建的字幕
        const subString = JSON.stringify({
          parsed: sub.parsed,
          metaInfo: sub.metaInfo,
        });
        // 创建新的自制字幕
        addSubtitleByMediaHash(this.mediaHash, subString, { type: 'modified' }).then((result) => {
          // 创建成功后往当前字幕列表添加新创建的自制字幕
          this.$bus.$emit('add-subtitles', [{
            src: result.path,
            type: 'modified',
            options: {
              storage: {
                parsed: sub.parsed,
                metaInfo: {
                  ...sub.metaInfo,
                  name: result.name,
                },
              },
            },
          }]);
        });
      }
    },
    async deleteSubtitleFile({ sub }) {
      // 删除字幕文件(自制字幕)
      await deleteFileByPath(this.subtitleInstances[sub.id].src);
    },
    exportSubtitle() {
      if (this.currentSubtitle.type === 'modified') {
        const { remote } = this.$electron;
        const { app, dialog } = remote;
        const browserWindow = remote.BrowserWindow;
        const focusWindow = browserWindow.getFocusedWindow();
        let defaultPath = this.defaultDir;
        if (!this.defaultDir) {
          defaultPath = process.platform === 'darwin' ? app.getPath('home') : app.getPath('desktop');
          this.$store.dispatch('UPDATE_DEFAULT_DIR', defaultPath);
        }
        const fileName = `${basename(`${this.currentSubtitle.metaInfo.name}`, '.vtt')}.vtt`;
        defaultPath = join(defaultPath, fileName);
        dialog.showSaveDialog(focusWindow, {
          defaultPath,
        }, async (filePath) => {
          if (filePath) {
            const str = dialogueToString(this.currentSubtitle.parsed.dialogues);
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
      Promise.all(this.normalizeSubtitleList(subs)
        .map(sub => this.addSubtitle(sub, this.originSrc)))
        .then((subtitleInstances) => {
          this.changeCurrentSubtitle(subtitleInstances[subtitleInstances.length - 1].id);
          this.selectionComplete = true;
        });
    });
    this.$bus.$on('refresh-subtitles', ({ types, isInitial }) => {
      this.refreshSubtitles(types, this.originSrc, isInitial);
      this.isInitial = isInitial;
    });
    this.$bus.$on('change-subtitle', this.changeCurrentSubtitle);
    this.$bus.$on('off-subtitle', this.offCurrentSubtitle);
    this.$bus.$on('upload-current-subtitle', () => {
      this.addLog('info', {
        message: 'Upload current subtitle .',
        code: 'SUBTITLE_UPLOAD',
      });
      const qualifiedSubtitle = {
        id: this.currentSubtitleId,
        duration: this.$store.state.Subtitle.durations[this.currentSubtitleId],
      };
      if (qualifiedSubtitle) {
        const parameter = this.makeSubtitleUploadParameter(qualifiedSubtitle);
        transcriptQueue.add(parameter, true)
          .then((res) => {
            if (res) {
              this.addLog('success', {
                message: 'Upload successfully !',
                code: 'UPLOAD_SUCCESS',
              });
            } else {
              this.addLog('error', {
                message: 'Upload failed !',
                errcode: 'UPLOAD_FAILED',
              });
            }
            console.log(`Uploading subtitle No.${this.currentSubtitleId} ${res ? 'succeeded' : 'failed'}!`);
          });
      }
    });
    // 接受字幕的修改，包括自制字幕和原始字幕，处理逻辑统一在this.modifiedSubtitle
    this.$bus.$on('modified-subtitle', this.modifiedSubtitle);
    // 当删除某个字幕的文件
    this.$bus.$on('delete-subtitle-file', this.deleteSubtitleFile);
    // 导出自制字幕
    this.$bus.$on(bus.EXPORT_MODIFIED_SUBTITLE, this.exportSubtitle);
    // when set immediate on watcher, it may run before the created hook
    this.resetSubtitles();
    this.$bus.$emit('subtitle-refresh-from-src-change');
    this.updateNoSubtitle(true);
  },
};
</script>
<style lang="scss" scoped>
</style>
