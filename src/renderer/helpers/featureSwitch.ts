import Vue from 'vue';
import syncStorage from '@/helpers/syncStorage';
import { crc32 } from '@/libs/utils';
import { version } from '@/../../package.json';

const [major, minor] = version.split('.');

/**
 * 'on'/'off'/number means need to check again next time
 * 'always' means always be enabled
 * number refers to a ratio, based on user id
 */
type FeatureConfig = 'on' | 'off' | 'always' | number;

function getUserId() {
  try {
    return Vue.axios.defaults.headers.common['X-Application-Token'] || '';
  } catch (ex) {
    return '';
  }
}

async function getOnlineConfig(url: string) {
  const headers = new Headers();
  headers.append('pragma', 'no-cache');
  headers.append('cache-control', 'no-cache');
  return Promise.race([
    fetch(url, { method: 'GET', headers }).then(res => res.json()),
    new Promise(resolve => setTimeout(() => resolve({}), 5000)),
  ]);
}

let cachedConfig: {[key: string]: FeatureConfig};
async function getConfig() {
  if (cachedConfig) return cachedConfig;
  let config: {[key: string]: FeatureConfig} = {};
  try {
    config = syncStorage.getSync('featureAlways') as {[key: string]: FeatureConfig} || config;
    const onlineConfig = await getOnlineConfig(`https://splayer.org/switch/v${major}.${minor}.json`);
    config = Object.assign(config, onlineConfig);
    const featureAlways = Object.keys(config)
      .filter(f => config[f] === 'always')
      .reduce((obj, f) => Object.assign(obj, { [f]: 'always' }), {});
    syncStorage.setSync('featureAlways', featureAlways);
    cachedConfig = config;
    return config;
  } catch (ex) {
    return config;
  }
}

export enum Features {
  AI,
  BrowsingView,
}

export async function isFeatureEnabled(feature: Features, defaultValue = false) {
  const featureName = Features[feature];
  try {
    if (process.env.NODE_ENV === 'development'
      && !window.localStorage.featureSwitch) return true;
    if (window.localStorage[featureName]) return true;
  } catch (ex) {
    //
  }
  const userId = getUserId();
  const config = await getConfig();
  const featureSwitch = config[featureName]; // eslint-disable-line
  if (typeof featureSwitch === 'string') {
    return featureSwitch === 'on' || featureSwitch === 'always';
  }
  if (typeof featureSwitch === 'number') {
    if (featureSwitch <= 0 || !userId) return false;
    return Math.abs(crc32(userId)) % 100 <= featureSwitch * 100;
  }
  return defaultValue;
}
