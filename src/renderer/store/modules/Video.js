import { Video as mutationTypes } from '../mutation-types';
import { Video as actionTypes } from '../action-types';

const state = {
  volume: 100,
  mute: false,
  rate: 1,
};

const getters = {
  volume: state => (state.mute ? 0 : state.volume / 100),
  mute: state => state.mute,
  rate: state => state.rate,
};

const mutations = {
  [mutationTypes.VOLUME_UPDATE](s, p) {
    s.volume = p;
  },
  [mutationTypes.TOGGLE_MUTE](s) {
    s.mute = !s.mute;
  },
  [mutationTypes.RATE_UPDATE](s, p) {
    s.rate = p;
  },
};

const actions = {
  [actionTypes.INCREASE_VOLUME]({ commit, state }, delta) {
    if (state.mute) commit(mutationTypes.TOGGLE_MUTE);
    const finalDelta = delta || 10;
    const finalVolume = state.volume + finalDelta;
    commit(mutationTypes.VOLUME_UPDATE, finalDelta > 100 ? 100 : finalVolume);
  },
  [actionTypes.DECREASE_VOLUME]({ commit, state }, delta) {
    if (state.mute) commit(mutationTypes.TOGGLE_MUTE);
    const finalDelta = delta || 10;
    const finalVolume = state.volume - finalDelta;
    commit(mutationTypes.VOLUME_UPDATE, finalDelta < 0 ? 0 : finalVolume);
  },
  [actionTypes.INCREASE_RATE]({ commit, state }, delta) {
    const finalDelta = delta || 0.1;
    const finalRate = state.rate + finalDelta;
    commit(mutationTypes.RATE_UPDATE, finalDelta > 100 ? 1 : finalRate);
  },
  [actionTypes.DECREASE_RATE]({ commit, state }, delta) {
    const finalDelta = delta || 0.1;
    const finalRate = state.rate - finalDelta;
    commit(mutationTypes.RATE_UPDATE, finalDelta < 0 ? 0 : finalRate);
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
