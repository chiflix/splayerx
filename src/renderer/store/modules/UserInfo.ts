/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserInfo as m } from '@/store/mutationTypes';
import { UserInfo as a } from '@/store/actionTypes';

type UserInfoState = {
  token: string,
  id: string,
  phone: string,
  displayName: string,
  createdAt: string,
  vipExpiredAt: string,
  isVip: boolean,
  signInCallback: Function,
};

const state = {
  token: '',
  id: '',
  phone: '',
  displayName: '',
  createdAt: '',
  vipExpiredAt: '',
  isVip: false,
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
      isVip: state.isVip,
      vipExpiredAt: state.vipExpiredAt,
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
    isVip?: boolean,
    vipExpiredAt?: string,
  }) {
    if (userInfo) {
      state.id = userInfo.id ? userInfo.id : state.id;
      state.phone = userInfo.phone ? userInfo.phone : state.phone;
      state.displayName = userInfo.displayName ? userInfo.displayName : state.displayName;
      state.createdAt = userInfo.createdAt ? userInfo.createdAt : state.createdAt;
      state.isVip = userInfo.isVip ? userInfo.isVip : state.isVip;
      state.vipExpiredAt = userInfo.vipExpiredAt ? userInfo.vipExpiredAt : state.vipExpiredAt;
    } else {
      state.id = '';
      state.phone = '';
      state.createdAt = '';
      state.displayName = '';
      state.vipExpiredAt = '';
      state.isVip = false;
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
