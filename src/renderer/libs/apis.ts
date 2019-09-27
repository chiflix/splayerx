import axios, { AxiosError, AxiosResponse } from 'axios';
import { remote } from 'electron';
import { log } from '@/libs/Log';

const instance = axios.create();

instance.defaults.timeout = 1000 * 10;

const endpoint = process.env.ACCOUNT_API as string;

log.debug('sss', endpoint);

export function setToken(t: string) {
  instance.defaults.headers.common['Authorization'] = `Bearer ${t}`;
}

function intercept(response: AxiosResponse) {
  const headers = response.headers;
  if (headers && headers.authorization) {
    const token = headers.authorization.replace('Bearer', '').trim();
    let displayName = '';
    try {
      displayName = JSON.parse(new Buffer(token.split('.')[1], 'base64').toString()).display_name; // eslint-disable-line
    } catch (error) {
      // tmpty
    }
    log.debug('token', token);
    remote.app.emit('sign-in', {
      token,
      displayName,
    });
  }
}

instance.interceptors.response.use((response: AxiosResponse) => {
  intercept(response);
  return response;
}, (error: AxiosError) => Promise.reject(error));

export function checkToken() {
  return new Promise((resolve, reject) => {
    instance.get(`${endpoint}/auth/check`)
      .then((response: AxiosResponse) => {
        log.debug('checkToken', response);
        resolve(true);
      })
      .catch((error: AxiosError) => {
        reject(error);
      });
  });
}

export function getSMSCode(phone: string) {
  log.debug('sms', `${endpoint}/auth/sms`);
  return new Promise((resolve, reject) => {
    instance.post(`${endpoint}/auth/sms`, {
      phone,
    })
      .then((response: AxiosResponse) => {
        log.debug('sms', response);
        resolve(true);
      })
      .catch((error: AxiosError) => {
        log.debug('sms', error);
        reject(error);
      });
  });
}

export function signIn(type: string, phone: string, code?: string) {
  return new Promise((resolve, reject) => {
    instance.post(`${endpoint}/auth/login`, {
      phone,
      type,
      code,
    })
      .then((response: AxiosResponse) => {
        resolve(response.data);
      })
      .catch((error: AxiosError) => {
        if (error && error.response && error.response.status === 400) {
          error.code = '400';
          reject(error);
        } else {
          reject(error);
        }
      });
  });
}

export function signOut() {
  remote.app.emit('sign-out');
}
