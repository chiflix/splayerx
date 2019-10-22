/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserInfo as m } from '@/store/mutationTypes';
import { UserInfo as a } from '@/store/actionTypes';

type UserInfoState = {
  token: string,
  id: string,
  phone: string,
  displayName: string,
  createdAt: string,
  signInCallback: Function,
};

const state = {
  token: '',
  id: '',
  phone: '',
  displayName: '',
  createdAt: '',
  signInCallback: () => { },
};

const getters = {
  token(state: UserInfoState) {
    return state.token;
  },
  id(state: UserInfoState) {
    return state.id;
  },
  userInfo(state: UserInfoState) {
    return {
      id: state.id,
      phone: state.phone,
      displayName: state.displayName,
      createdAt: state.createdAt,
    };
  },
  signInCallback(state: UserInfoState) {
    return state.signInCallback;
  },
};

const mutations = {
  [m.UPDATE_USER_TOKEN](state: UserInfoState, token: string) {
    state.token = token;
  },
  [m.UPDATE_USER_INFO](state: UserInfoState, userInfo?: {
    id?: string,
    phone?: string,
    displayName?: string,
    createdAt?: string,
  }) {
    if (userInfo) {
      state.id = userInfo.id ? userInfo.id : '';
      state.phone = userInfo.phone ? userInfo.phone : '';
      state.displayName = userInfo.displayName ? userInfo.displayName : '';
      state.createdAt = userInfo.createdAt ? userInfo.createdAt : '';
    } else {
      state.id = '';
      state.phone = '';
      state.createdAt = '';
      state.displayName = '';
    }
  },
  [m.UPDATE_SIGN_IN_CALLBACK](state: UserInfoState, callback: Function) {
    state.signInCallback = callback;
  },
};

const actions = {
  [a.UPDATE_USER_INFO]({
    commit,
  }: any, userInfo?: {
    id: string,
    phone: string,
    displayName: string,
    createdAt: string,
  }) {
    commit(m.UPDATE_USER_INFO, userInfo);
  },
  [a.UPDATE_USER_TOKEN]({
    commit,
  }: any, token: string) {
    commit(m.UPDATE_USER_TOKEN, token);
  },
  [a.UPDATE_SIGN_IN_CALLBACK]({
    commit,
  }: any, callback: Function) {
    commit(m.UPDATE_SIGN_IN_CALLBACK, callback);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
