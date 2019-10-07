import { remote } from 'electron';
import { log } from '@/libs/Log';
import { apiOfAccountService } from '@/helpers/featureSwitch';
import Fetcher from '@/../shared/Fetcher';

export class ApiError extends Error {
  /** HTTP status */
  public status: number;

  /** Message from server */
  public message: string;
}

const fetcher = new Fetcher({ timeout: 1000 * 10 });

async function getEndpoint() {
  const api = await apiOfAccountService();
  log.debug('AccountService', api);
  return `${api}/api`;
}

export function setToken(t: string) {
  fetcher.setHeader('Authorization', `Bearer ${t}`);
}

fetcher.useResponseInterceptor((res) => {
  const authorization = res.headers.get('Authorization');
  if (authorization) {
    const token = authorization.replace('Bearer', '').trim();
    let displayName = '';
    try {
      displayName = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).display_name; // eslint-disable-line
      log.debug('apis/account/token', token);
      remote.app.emit('sign-in', {
        token,
        displayName,
      });
    } catch (error) {
      log.error('apis/account/token', token);
    }
  }
  return res;
});

export async function checkToken() {
  const endpoint = await getEndpoint();
  const res = await fetcher.get(`${endpoint}/auth/check`);
  log.debug('api/account/checkToken', res);
  return res.ok;
}

export async function getSMSCode(phone: string) {
  const endpoint = await getEndpoint();
  const res = await fetcher.post(`${endpoint}/auth/sms`, { phone });
  log.debug('api/account/sms', res);
  return res.ok;
}

export async function signIn(type: string, phone: string, code: string) {
  const endpoint = await getEndpoint();
  const res = await fetcher.post(`${endpoint}/auth/login`, { phone, type, code });
  if (res.ok) {
    const data = await res.json();
    log.debug('api/account/login', data);
    return data;
  }
  const error = new ApiError();
  error.status = res.status;
  // Server message is not localized yet
  // try {
  //   const data = await res.json();
  //   error.message = data.message;
  // } catch (ex) {
  //   error.message = '';
  // }
  throw error;
}

export function signOut() {
  remote.app.emit('sign-out');
}
