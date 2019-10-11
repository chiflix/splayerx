/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserInfo as m } from '@/store/mutationTypes';
import { UserInfo as a } from '@/store/actionTypes';

type UserInfoState = {
  token: string,
  id: string,
  signInCallback: Function,
};

const state = {
  token: '',
  id: '',
  signInCallback: () => { },
};

const getters = {
  token(state: UserInfoState) {
    return state.token;
  },
  id(state: UserInfoState) {
    return state.id;
  },
  signInCallback(state: UserInfoState) {
    return state.signInCallback;
  },
};


const mutations = {
  [m.UPDATE_USER_ID](state: UserInfoState, id: string) {
    state.id = id;
  },
  [m.UPDATE_USER_TOKEN](state: UserInfoState, token: string) {
    state.token = token;
  },
  [m.UPDATE_SIGN_IN_CALLBACK](state: UserInfoState, callback: Function) {
    state.signInCallback = callback;
  },
};

const actions = {
  [a.UPDATE_USER_INFO]({
    commit,
  }: any, userInfo?: {
    token: string,
    id: string
  }) {
    let id = '';
    let token = '';
    if (userInfo) {
      id = userInfo.id;
      token = userInfo.token;
    }
    commit(m.UPDATE_USER_ID, id);
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
