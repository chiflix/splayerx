import Vue from 'vue';
import * as configcat from 'configcat-js';
import { log } from '@/libs/Log';
import { getMainVersion } from '@/libs/utils';

const configCatApiKey = process.env.NODE_ENV === 'development'
  ? 'WizXCIVndyJUn4cCRD3qvQ/8uwWLI_KhUmuOrOaDDsaxQ'
  : 'WizXCIVndyJUn4cCRD3qvQ/M9CQx_MXgEeuIc8uO4Aowg';

const client = configcat.createClientWithLazyLoad(configCatApiKey, {
  cacheTimeToLiveSeconds: 600,
});

function getUserId() {
  try {
    return Vue.axios.defaults.headers.common['X-Application-Token'] || '';
  } catch (ex) {
    return '';
  }
}

function getApplicationDisplayLanguage() {
  try {
    return Vue.axios.defaults.headers.common['X-Application-Display-Language'] || '';
  } catch (ex) {
    return '';
  }
}

function getUserObject() {
  return {
    identifier: getUserId(),
    custom: {
      version: getMainVersion(),
      displayLanguage: getApplicationDisplayLanguage(),
    },
  };
}

export async function getConfig<T>(configKey: string, defaultValue?: T): Promise<T> {
  log.debug('configKey', getUserObject());
  return new Promise((resolve) => {
    setTimeout(() => resolve(defaultValue), 10000);
    client.getValue(configKey, defaultValue, (value: T) => {
      resolve(value);
    }, getUserObject());
  });
}

export async function getJsonConfig(configKey: string, defaultValue: Json): Promise<Json> {
  const configString = await getConfig<string>(configKey);
  if (!configString) return defaultValue;
  try {
    return JSON.parse(configString);
  } catch (ex) {
    log.error('featureSwitch getJsonConfig', ex);
    return defaultValue;
  }
}

export async function forceRefresh() {
  return new Promise((resolve) => {
    client.forceRefresh(() => resolve());
  });
}

export const isAIEnabled = async () => getConfig('isAIEnabled', false);

export const isAudioCenterChannelEnabled = async () => getConfig('isAudioCenterChannelEnabled', false);

export const isAccountEnabled = async () => getConfig('isAccountEnabled', false);

export const apiOfAccountService = async () => getConfig('apiForAccountService', process.env.ACCOUNT_API);
