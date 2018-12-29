import Vue from 'vue';
import pick from 'lodash/pick';
import partialRight from 'lodash/partialRight';
import osLocale from 'os-locale';
import { Subtitle as subtitleMutations } from '../mutationTypes';
import { Subtitle as subtitleActions } from '../actionTypes';

function getFormattedSystemLocale() {
  const locale = osLocale.sync();
  return locale.slice(0, locale.indexOf('_'));
}

function generateRankOptions(type, subtitle, subtitleList) {
  const systemLocale = getFormattedSystemLocale();
  switch (type.toLowerCase()) {
    default:
    case 'custom': {
      return { existed: subtitleList.length };
    }
    case 'local': {
      const { language } = subtitle;
      return ({
        matchSystemLocale: language === systemLocale,
        existedLanguage: subtitleList
          .filter(({ language: existedLanguage }) => existedLanguage === language).length,
        existed: subtitleList.length,
      });
    }
    case 'embedded': {
      const { isDefault, streamIndex } = subtitle;
      return ({
        matchDefault: isDefault,
        streamIndex,
        existed: subtitleList,
      });
    }
    case 'online': {
      const { language, ranking } = subtitle;
      return ({
        matchSystemLocale: language === systemLocale,
        existedLanguage: subtitleList
          .filter(({ language: existedLanguage }) => existedLanguage === language).length,
        ranking,
        existed: subtitleList.length,
      });
    }
  }
}

function rankCalculation(type, options) {
  let result;
  const baseRank = {
    custom: 1e16,
    local: 1e12,
    embedded: 1e8,
    online: 1e4,
  };
  const rankEnums = {
    MATCH_SYSTEM_LOCALE: 1e3,
    MATCH_DEFAULT: 1e3,
    EXISTED_LANGUAGE: -1e2,
    STREAM_INDEX: -1e2,
    RANKING: 1e1,
    EXISTED: -1e0,
  };
  switch (type.toLowerCase()) {
    case 'custom': {
      const { existed } = options;
      result = baseRank.custom + (existed * rankEnums.EXISTED);
      break;
    }
    case 'local': {
      const { matchSystemLocale, existedLanguage, existed } = options;
      result = baseRank.local +
        (matchSystemLocale * rankEnums.MATCH_SYSTEM_LOCALE) +
        (existedLanguage * rankEnums.EXISTED_LANGUAGE) +
        (existed * rankEnums.EXISTED);
      break;
    }
    case 'embedded': {
      const { matchDefault, streamIndex, existed } = options;
      result = baseRank.embedded +
        (matchDefault * rankEnums.MATCH_DEFAULT) +
        (streamIndex * rankEnums.STREAM_INDEX) +
        (existed * rankEnums.EXISTED);
      break;
    }
    case 'online': {
      const {
        matchSystemLocale, existedLanguage, ranking, existed,
      } = options;
      result = baseRank.online +
        (matchSystemLocale * rankEnums.MATCH_SYSTEM_LOCALE) +
        (existedLanguage * rankEnums.EXISTED_LANGUAGE) +
        (ranking * rankEnums.RANKING) +
        (existed * rankEnums.EXISTED);
      break;
    }
    default:
      break;
  }

  console.log(result);

  return result;
}

const state = {
  loadingStates: {},
  durations: {},
  names: {},
  languages: {},
  formats: {},
  types: {},
  ranks: {},
  currentSubtitleId: '',
  chosenStyle: '',
  chosenSize: 1,
  subtitleDelay: 0,
  scaleNum: 1,
};

const getters = {
  currentSubtitleId: state => state.currentSubtitleId,
  subtitleIds: ({ loadingStates }) => Object.keys(loadingStates),
  subtitleList: ({
    loadingStates, names, languages, formats,
  }) =>
    Object.keys(loadingStates).map(id => ({
      id,
      name: names[id],
      language: languages[id],
      format: formats[id],
    })),
  premiumSubtitles: ({ durations }, getters) => Object.keys(durations)
    .filter(id => durations[id] >= 0.6 * getters.duration)
    .map(id => ({ id, played: durations[id] })),
  subtitleDelay: state => state.subtitleDelay,
  chosenStyle: state => state.chosenStyle,
  chosenSize: state => state.chosenSize,
  scaleNum: state => state.scaleNum,
};

const mutations = {
  [subtitleMutations.RESET_SUBTITLES](state, resetFields) {
    if (!resetFields) {
      Vue.set(state, 'loadingStates', {});
      Vue.set(state, 'durations', {});
      Vue.set(state, 'names', {});
      Vue.set(state, 'languages', {});
      Vue.set(state, 'formats', {});
    } else {
      const supportedFields = ['loadingStates', 'durations', 'names', 'languages', 'formats', 'types'];
      const changingFields = Object.keys(resetFields)
        .filter(field => supportedFields.includes(field));
      changingFields.forEach((field) => {
        Vue.set(state, field, resetFields[field]);
      });
    }
  },
  [subtitleMutations.LOADING_STATES_UPDATE]({ loadingStates }, { id, state }) {
    Vue.set(loadingStates, id, state);
  },
  [subtitleMutations.DURATIONS_UPDATE]({ durations }, { id, duration }) {
    Vue.set(durations, id, duration);
  },
  [subtitleMutations.NAMES_UPDATE]({ names }, { id, name }) {
    Vue.set(names, id, name);
  },
  [subtitleMutations.LANGUAGES_UPDATE]({ languages }, { id, language }) {
    Vue.set(languages, id, language);
  },
  [subtitleMutations.FORMATS_UPDATE]({ formats }, { id, format }) {
    Vue.set(formats, id, format);
  },
  [subtitleMutations.TYPES_UPDATE]({ types }, { id, type }) {
    Vue.set(types, id, type);
  },
  [subtitleMutations.RANKS_UPDATE]({ ranks }, { id, rank }) {
    Vue.set(ranks, id, rank);
  },
  [subtitleMutations.CURRENT_SUBTITLE_ID_UPDATE](state, subtitleId) {
    state.currentSubtitleId = subtitleId;
  },
  UpdateDelay(state, payload) {
    if (payload === 0) {
      state.subtitleDelay = 0;
    } else {
      state.subtitleDelay += payload;
    }
  },
  UpdateScale(state, payload) {
    state.scaleNum = payload;
  },
  UpdateChosenStyle(state, payload) {
    state.chosenStyle = payload;
  },
  UpdateChosenSize(state, payload) {
    state.chosenSize = payload;
  },
};

const actions = {
  [subtitleActions.ADD_SUBTITLE_WHEN_LOADING]({ commit }, { id, type }) {
    commit(subtitleMutations.LOADING_STATES_UPDATE, { id, state: 'loading' });
    commit(subtitleMutations.TYPES_UPDATE, { id, type });
  },
  [subtitleActions.ADD_SUBTITLE_WHEN_READY]({ commit, getters }, {
    id, name, language, format, type, streamIndex, ranking, isDefault,
  }) {
    commit(subtitleMutations.LOADING_STATES_UPDATE, { id, state: 'ready' });
    commit(subtitleMutations.NAMES_UPDATE, { id, name });
    commit(subtitleMutations.LANGUAGES_UPDATE, { id, language });
    commit(subtitleMutations.FORMATS_UPDATE, { id, format });
    const options = generateRankOptions(type, {
      language, streamIndex, ranking, isDefault,
    }, getters.subtitleList);
    commit(subtitleMutations.RANKS_UPDATE, { id, rank: rankCalculation(type, options) });
  },
  [subtitleActions.ADD_SUBTITLE_WHEN_LOADED]({ commit }, { id }) {
    commit(subtitleMutations.LOADING_STATES_UPDATE, { id, state: 'loaded' });
  },
  [subtitleActions.ADD_SUBTITLE_WHEN_FAILED]({ commit }, { id }) {
    commit(subtitleMutations.LOADING_STATES_UPDATE, { id, state: 'failed' });
  },
  [subtitleActions.CHANGE_CURRENT_SUBTITLE]({ commit, getters }, id) {
    if (getters.subtitleIds.includes(id)) commit(subtitleMutations.CURRENT_SUBTITLE_ID_UPDATE, id);
  },
  [subtitleActions.OFF_SUBTITLES]({ commit }) {
    commit(subtitleMutations.CURRENT_SUBTITLE_ID_UPDATE, '');
  },
  [subtitleActions.RESET_SUBTITLES]({ commit }) {
    commit(subtitleMutations.CURRENT_SUBTITLE_ID_UPDATE, '');
    commit(subtitleMutations.RESET_SUBTITLES);
  },
  [subtitleActions.RESET_ONLINE_SUBTITLES]({ commit, state }) {
    const {
      loadingStates, durations, names, languages, formats, types,
    } = state;
    const notOnlineIds = Object.keys(types).filter(id => types[id] !== 'online');
    const takeSupportedFields = partialRight(pick, notOnlineIds);
    commit(subtitleMutations.RESET_SUBTITLES, {
      loadingStates: takeSupportedFields(loadingStates),
      durations: takeSupportedFields(durations),
      names: takeSupportedFields(names),
      languages: takeSupportedFields(languages),
      formats: takeSupportedFields(formats),
      types: takeSupportedFields(types),
    });
  },
  updateSubDelay({ commit }, delta) {
    commit('UpdateDelay', delta);
  },
  updateScale({ commit }, delta) {
    commit('UpdateScale', delta);
  },
  updateChosenStyle({ commit }, delta) {
    commit('UpdateChosenStyle', delta);
  },
  updateChosenSize({ commit }, delta) {
    commit('UpdateChosenSize', delta);
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
