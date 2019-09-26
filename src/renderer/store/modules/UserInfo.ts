/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserInfo as m } from '@/store/mutationTypes';
import { UserInfo as a } from '@/store/actionTypes';

type UserInfoState = {
  token: string,
  id: string,
};

const state = {
  token: '',
  id: '',
};

const getters = {
  token(state: UserInfoState) {
    return state.token;
  },
  id(state: UserInfoState) {
    return state.id;
  },
};


const mutations = {
  [m.UPDATE_USER_ID](state: UserInfoState, id: string) {
    state.id = id;
  },
  [m.UPDATE_USER_TOKEN](state: UserInfoState, token: string) {
    state.token = token;
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
};

export default {
  state,
  getters,
  mutations,
  actions,
};
