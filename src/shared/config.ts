import Locale from './common/localize';
import { getClientUUID, getEnvironmentName, getPlatformInfo } from './utils';

const configcat = process.type === 'browser' ? require('configcat-node') : require('configcat-js');

function getMainVersion(): string {
  const version = getPlatformInfo().version;
  const match = version.match(/\d+\.\d+\.\d+/);
  return match ? match[0] : version;
}

const configCatApiKey = process.env.NODE_ENV === 'development'
  ? 'WizXCIVndyJUn4cCRD3qvQ/8uwWLI_KhUmuOrOaDDsaxQ'
  : 'WizXCIVndyJUn4cCRD3qvQ/M9CQx_MXgEeuIc8uO4Aowg';

const client = configcat.createClientWithLazyLoad(configCatApiKey, {
  baseUrl: 'https://config.splayer.top',
  cacheTimeToLiveSeconds: 600,
});

const locale = new Locale();
async function getUserObject() {
  return {
    identifier: await getClientUUID(),
    custom: {
      version: getMainVersion(),
      isBeta: getPlatformInfo().isBetaVersion.toString(),
      displayLanguage: locale.getDisplayLanguage(),
      environmentName: getEnvironmentName(),
    },
  };
}

export async function getConfig<T>(configKey: string, defaultValue?: T): Promise<T> {
  const userObject = await getUserObject();
  return new Promise((resolve) => {
    setTimeout(() => resolve(defaultValue), 10000);
    client.getValue(configKey, defaultValue, (value: T) => {
      resolve(value);
    }, userObject);
  });
}

export async function getJsonConfig(configKey: string, defaultValue: Json): Promise<Json> {
  const configString = await getConfig<string>(configKey);
  if (!configString) return defaultValue;
  try {
    return JSON.parse(configString);
  } catch (ex) {
    console.error('featureSwitch getJsonConfig', ex);
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

export const apiOfSubtitleService = async () => getConfig('apiForSubtitleService', process.env.SAGI_API);

export const apiOfAccountService = async () => getConfig('apiForAccountService', process.env.ACCOUNT_API);

export const siteOfAccountService = async () => getConfig('siteOfAccountService', process.env.ACCOUNT_SITE);

export const isTranslateLimit = async () => getConfig('isTranslateLimit', false);

export const isBrowserEnabled = async () => getConfig('isBrowserEnabled', true);

export const browserDownloadBlacklist = async () => getConfig('browserDownloadBlacklist', ['youku.com', 'bilibili.com', 'iqiyi.com', 'douyu.com', 'huya.com', 'qq.com', 'sportsqq.com', 'vipopen163.com', 'study163.com', 'imooc.com', 'icourse163.com']);
