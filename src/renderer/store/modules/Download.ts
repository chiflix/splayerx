/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer } from 'electron';
import { Download as m } from '@/store/mutationTypes';
import { Download as a } from '@/store/actionTypes';
import asyncStorage from '@/helpers/asyncStorage';

type downloadState = {
  resolution: number | string,
  path: string,
  date: number,
};
const state = {
  resolution: 480,
  path: '',
  date: 0,
};

const getters = {
  resolution: (state: downloadState) => state.resolution,
  savedPath: (state: downloadState) => state.path,
  date: (state: downloadState) => state.date,
};

const mutations = {
  [m.RESOLUTION_UPDATE](state: downloadState, payload: number | string) {
    state.resolution = payload;
  },
  [m.PATH_UPDATE](state: downloadState, payload: string) {
    state.path = payload;
  },
  [m.DATE_UPDATE](state: downloadState, payload: number) {
    state.date = payload;
    ipcRenderer.send('update-download-date', payload);
  },
};

const actions = {
  [a.UPDATE_RESOLUTION]({ commit }: any, delta: number | string) {
    commit(m.RESOLUTION_UPDATE, delta);
    return asyncStorage.set('download', state);
  },
  [a.UPDATE_PATH]({ commit }: any, delta: string) {
    commit(m.PATH_UPDATE, delta);
    return asyncStorage.set('download', state);
  },
  [a.UPDATE_DATE]({ commit }: any, delta: number) {
    commit(m.DATE_UPDATE, delta);
    return asyncStorage.set('download', state);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
