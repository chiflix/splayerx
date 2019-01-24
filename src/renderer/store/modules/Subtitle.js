import Vue from 'vue';
import pick from 'lodash/pick';
import partialRight from 'lodash/partialRight';
import camelCase from 'lodash/camelCase';
import { codeIndex } from '@/helpers/language';
import { Subtitle as subtitleMutations } from '../mutationTypes';
import { Subtitle as subtitleActions } from '../actionTypes';

function metaInfoToWeight(type, value, subtitleList, primaryLanguage) {
  const result = { existed: subtitleList.filter(({ rank }) => !!rank).length };
  switch (type) {
    case 'language': {
      result.matchPrimaryLanguage = primaryLanguage === value ? 1 : 0;
      result.existedLanguage = subtitleList
        .filter(({ language: existedLanguage }) => existedLanguage === value).length;
      result.languageRanking = codeIndex(value);
      break;
    }
    case 'isDefault':
      result.matchDefault = value ? 1 : 0;
      break;
    case 'streamIndex':
      result.streamIndex = value || 0;
      break;
    case 'ranking':
      result.ranking = value || 0;
      break;
    default:
      break;
  }

  return result;
}

function rankCalculation(type, options, lastRank) {
  const baseRanks = {
    custom: 1e16,
    local: 1e12,
    embedded: 1e8,
    online: 1e4,
  };
  const rankTypes = [
    {
      name: 'MATCH_PRIMARY_LANGUAGE',
      value: 1e4,
      types: ['local', 'online'],
    },
    {
      name: 'MATCH_DEFAULT',
      value: 1e3,
      types: ['embedded'],
    },
    {
      name: 'LANGUAGE_RANKING',
      value: -1e3,
      types: ['local', 'online'],
    },
    {
      name: 'EXISTED_LANGUAGE',
      value: -1e2,
      types: ['local', 'online'],
    },
    {
      name: 'STREAM_INDEX',
      value: -1e2,
      types: ['embedded'],
    },
    {
      name: 'RANKING',
      value: 1e1,
      types: ['online'],
    },
    {
      name: 'EXISTED',
      value: -1e0,
      types: ['custom', 'local', 'embedded', 'online'],
    },
  ];
  const baseRank = lastRank || baseRanks[type] || 0;
  return rankTypes
    .filter(({ name, types }) => options[camelCase(name)] && types.includes(type))
    .reduce((prev, { name, value }) => prev + (value * options[camelCase(name)]), baseRank);
}

function metaInfoUpdate(
  subtitleType, subtitleList, primaryLanguage,
  infoType, infoValue,
  lastRank,
) {
  const weightOptions = metaInfoToWeight(infoType, infoValue, subtitleList, primaryLanguage);
  if (lastRank) Reflect.deleteProperty(weightOptions, 'existed');
  return rankCalculation(subtitleType, weightOptions, lastRank);
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
  calculatedNoSub: true,
};

const getters = {
  currentSubtitleId: state => state.currentSubtitleId,
  subtitleIds: ({ loadingStates }) => Object.keys(loadingStates),
  subtitleList: ({
    loadingStates, names, languages, formats, ranks, types,
  }) =>
    Object.keys(loadingStates).map(id => ({
      id,
      name: names[id],
      language: languages[id],
      format: formats[id],
      rank: ranks[id],
      loading: loadingStates[id],
      type: types[id],
    })).sort((a, b) => b.rank - a.rank),
  premiumSubtitles: ({ durations }, getters) => Object.keys(durations)
    .filter(id => durations[id] >= 0.6 * getters.duration)
    .map(id => ({ id, played: durations[id] })),
  subtitleDelay: state => state.subtitleDelay,
  chosenStyle: state => state.chosenStyle,
  chosenSize: state => state.chosenSize,
  scaleNum: state => state.scaleNum,
  calculatedNoSub: state => state.calculatedNoSub,
  getLanguageFromId: ({ languages }) => id => languages[id],
  isExistedSubtitle: ({ loadingStates }) => id => !!Object.keys(loadingStates)
    .filter((id, index, array) => array[id] !== 'failed').includes(id),
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
  IfNoSubtitle(state, payload) {
    state.calculatedNoSub = payload;
  },
};

const actions = {
  [subtitleActions.ADD_SUBTITLE_WHEN_LOADING]({ commit }, { id, type }) {
    commit(subtitleMutations.LOADING_STATES_UPDATE, { id, state: 'loading' });
    commit(subtitleMutations.TYPES_UPDATE, { id, type });
  },
  [subtitleActions.ADD_SUBTITLE_WHEN_READY]({ commit }, {
    id, format,
  }) {
    commit(subtitleMutations.LOADING_STATES_UPDATE, { id, state: 'ready' });
    commit(subtitleMutations.FORMATS_UPDATE, { id, format });
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
  [subtitleActions.UPDATE_METAINFO]({ commit, state, getters }, { id, type, value }) {
    if (state[`${type}s`]) commit(`${type.toUpperCase()}S_UPDATE`, { id, [type]: value });
    const { types, ranks } = state;
    const { primaryLanguage } = getters;
    const rank = metaInfoUpdate(
      types[id], getters.subtitleList, primaryLanguage,
      type, value,
      ranks[id],
    );
    commit(subtitleMutations.RANKS_UPDATE, { id, rank });
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
  ifNoSubtitle({ commit }, delta) {
    commit('IfNoSubtitle', delta);
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
