import { Video as mutationTypes } from '../mutation-types';
import { Video as actionTypes } from '../action-types';

const state = {
  volume: 100,
  mute: false,
  rate: 1,
};

const getters = {
  volume: state => state.volume / 100,
  mute: state => state.mute,
  rate: state => state.rate,
};

const mutations = {
  [mutationTypes.VOLUME_UPDATE](s, p) {
    s.volume = p;
  },
  [mutationTypes.MUTE_UPDATE](s, p) {
    s.mute = p;
  },
  [mutationTypes.RATE_UPDATE](s, p) {
    s.rate = p;
  },
};

const actions = {
  [actionTypes.INITIALIZE]({ commit }, config) {
    Object.keys(config).forEach((item) => {
      const mutation = `${item.toUpperCase()}_UPDATE`;
      if (mutationTypes[mutation]) commit(mutation, config[item]);
    });
  },
  [actionTypes.INCREASE_VOLUME]({ dispatch, commit, state }, delta) {
    if (state.mute) dispatch(actionTypes.TOGGLE_MUTE);
    const finalDelta = delta || 10;
    const finalVolume = state.volume + finalDelta;
    commit(mutationTypes.VOLUME_UPDATE, finalVolume > 100 ? 100 : finalVolume);
  },
  [actionTypes.DECREASE_VOLUME]({ dispatch, commit, state }, delta) {
    if (state.mute) dispatch(actionTypes.TOGGLE_MUTE);
    const finalDelta = delta || 10;
    const finalVolume = state.volume - finalDelta;
    commit(mutationTypes.VOLUME_UPDATE, finalVolume < 0 ? 0 : finalVolume);
  },
  [actionTypes.TOGGLE_MUTE]({ commit, state }) {
    commit(mutationTypes.MUTE_UPDATE, !state.mute);
  },
  [actionTypes.INCREASE_RATE]({ commit, state }, delta) {
    const finalDelta = delta || 0.1;
    const finalRate = state.rate + finalDelta;
    commit(mutationTypes.RATE_UPDATE, finalRate > 100 ? 1 : finalRate);
  },
  [actionTypes.DECREASE_RATE]({ commit, state }, delta) {
    const finalDelta = delta || 0.1;
    const finalRate = state.rate - finalDelta;
    commit(mutationTypes.RATE_UPDATE, finalRate < 0 ? 0 : finalRate);
  },
};

export const validators = {
  volume(v) {
    return typeof v === 'number'
    && !Number.isNaN(v)
    && v >= 0
    && v <= 100;
  },
  mute(v) {
    return typeof v === 'boolean';
  },
  rate(v) {
    return typeof v === 'number'
    && !Number.isNaN(v)
    && v >= 0
    && v <= 100;
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
