/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserInfo as m } from '@/store/mutationTypes';
import { UserInfo as a } from '@/store/actionTypes';

function toDateString(d: string): string {
  const date = new Date(d).toISOString();
  return date.split('T')[0];
}
export enum PayStatus {
  Default = 'default',
  PremiumPaying = 'premium-paying',
  PremiumPaySuccess = 'premium-pay-success',
  PremiumPayFail = 'premium-pay-fail'
}

type UserInfoState = {
  token: string,
  id: string,
  phone: string,
  displayName: string,
  createdAt: string,
  vipExpiredAt: string,
  isVip: boolean,
  points: number,
  signInCallback: Function,
  showForbiddenModal: boolean,
  premiumList: [],
  pointsList: [],
  orders: [],
  which: string,
  payStatus: string,
  countryCode: string,
};

const state = {
  token: '',
  id: '',
  phone: '',
  displayName: '',
  createdAt: '',
  vipExpiredAt: '',
  isVip: false,
  points: 0,
  premiumList: [],
  pointsList: [],
  orders: [],
  signInCallback: () => { },
  showForbiddenModal: false,
  which: '',
  payStatus: PayStatus.Default,
  countryCode: '',
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
      points: state.points,
      vipExpiredAt: state.vipExpiredAt,
    };
  },
  signInCallback(state: UserInfoState) {
    return state.signInCallback;
  },
  showForbiddenModal(state: UserInfoState) {
    return state.showForbiddenModal;
  },
  premiumList(state: UserInfoState) {
    return state.premiumList;
  },
  pointsList(state: UserInfoState) {
    return state.pointsList;
  },
  orders(state: UserInfoState) {
    return state.orders;
  },
  which(state: UserInfoState) {
    return state.which;
  },
  payStatus(state: UserInfoState) {
    return state.payStatus;
  },
  webCountryCode(state: UserInfoState) {
    return state.countryCode;
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
    points?: number,
    vipExpiredAt?: string,
    orders?: [],
  }) {
    if (userInfo) {
      state.id = userInfo.id ? userInfo.id : state.id;
      state.phone = userInfo.phone ? userInfo.phone : state.phone;
      state.displayName = userInfo.displayName ? userInfo.displayName : state.displayName;
      state.createdAt = userInfo.createdAt
        ? toDateString(userInfo.createdAt) : state.createdAt;
      state.isVip = userInfo.isVip ? userInfo.isVip : state.isVip;
      state.points = userInfo.points ? userInfo.points : state.points;
      state.vipExpiredAt = userInfo.vipExpiredAt
        ? toDateString(userInfo.vipExpiredAt) : state.vipExpiredAt;
      state.orders = userInfo.orders ? userInfo.orders : state.orders;
    } else {
      state.id = '';
      state.phone = '';
      state.createdAt = '';
      state.displayName = '';
      state.vipExpiredAt = '';
      state.isVip = false;
      state.points = 0;
      state.orders = [];
    }
  },
  [m.UPDATE_SIGN_IN_CALLBACK](state: UserInfoState, callback: Function) {
    state.signInCallback = callback;
  },
  [m.SHOW_FORBIDDEN_MODAL](state: UserInfoState, which: string) {
    state.showForbiddenModal = true;
    state.which = which;
  },
  [m.HIDE_FORBIDDEN_MODAL](state: UserInfoState) {
    state.showForbiddenModal = false;
  },
  [m.UPDATE_PREMIUM](state: UserInfoState, list: []) {
    state.premiumList = list;
  },
  [m.UPDATE_POINTS_LIST](state: UserInfoState, list: []) {
    state.pointsList = list;
  },
  [m.UPDATE_PAY_STATUS](state: UserInfoState, status: PayStatus) {
    state.payStatus = status;
  },
  [m.UPDATE_COUNTRY_CODE](state: UserInfoState, code: string) {
    state.countryCode = code;
  },
};

const actions = {
  async [a.UPDATE_USER_INFO]({
    commit,
  }: any, userInfo?: {
    id: string,
    phone: string,
    displayName: string,
    createdAt: string,
    vipExpiredAt: string,
    orders: [],
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
  [a.SHOW_FORBIDDEN_MODAL]({
    commit,
  }: any, which: string) {
    commit(m.SHOW_FORBIDDEN_MODAL, which);
  },
  [a.HIDE_FORBIDDEN_MODAL]({
    commit,
  }: any) {
    commit(m.HIDE_FORBIDDEN_MODAL);
  },
  [a.UPDATE_PREMIUM]({
    commit,
  }: any, list: []) {
    commit(m.UPDATE_PREMIUM, list);
  },
  [a.UPDATE_POINTS_LIST]({
    commit,
  }: any, list: []) {
    commit(m.UPDATE_POINTS_LIST, list);
  },
  [a.UPDATE_PAY_STATUS]({
    commit,
  }: any, status: PayStatus) {
    commit(m.UPDATE_PAY_STATUS, status);
  },
  [a.UPDATE_COUNTRY_CODE]({
    commit,
  }: any, code: string) {
    commit(m.UPDATE_COUNTRY_CODE, code);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
