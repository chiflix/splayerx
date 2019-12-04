import { remote } from 'electron';
import { log } from '@/libs/Log';
import { apiOfAccountService } from '@/helpers/featureSwitch';
import Fetcher from '@/../shared/Fetcher';
import { crossThreadCache, getEnvironmentName } from '../../shared/utils';

export class ApiError extends Error {
  /** HTTP status */
  public status: number;

  /** Message from server */
  public message: string;
}

const fetcher = new Fetcher();
const longFetcher = new Fetcher({
  timeout: 20 * 1000,
});

const environmentName = getEnvironmentName();
fetcher.setHeader('Environment-Name', environmentName);
longFetcher.setHeader('Environment-Name', environmentName);

async function getEndpoint() {
  const api = await apiOfAccountService();
  log.debug('AccountService', api);
  return `${api}/api`;
}

export function setToken(t: string) {
  fetcher.setHeader('Authorization', `Bearer ${t}`);
  longFetcher.setHeader('Authorization', `Bearer ${t}`);
}

fetcher.useResponseInterceptor((res) => {
  const authorization = res.headers.get('Authorization');
  if (authorization) {
    const token = authorization.replace('Bearer', '').trim();
    let displayName = '';
    try {
      displayName = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).displayName; // eslint-disable-line
      log.debug('apis/account/token', JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()));
      setTimeout(() => {
        remote.app.emit('refresh-token', {
          token,
          displayName,
        });
      }, 0);
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

export const getGeoIP = crossThreadCache(['ip', 'countryCode'], async () => {
  const endpoint = await getEndpoint();
  return new Promise((resolve, reject) => {
    fetcher.get(`${endpoint}/geoip`).then((response: Response) => {
      if (response.ok) {
        response.json().then((data: { ip: string, countryCode: string }) => resolve(data));
      } else {
        reject(new Error());
      }
    }).catch((error) => {
      reject(error);
    });
  });
});

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

export async function getUserInfo() {
  const api = await apiOfAccountService();
  const res = await fetcher.post(`${api}/graphql`, {
    query: `query {
      me {
        id,
        phone,
        displayName,
        createdAt,
        isVip,
        orders(status: Valid, limit: 3) {
          id,
          createdAt,
          paidAt,
          product {
            id,
            duration {
              unit,
              value
            }
          }
        },
        vipExpiredAt,
      }
    }`,
  });
  if (res.ok) {
    const data = await res.json();
    return data.data;
  }
  const error = new ApiError();
  error.status = res.status;
  throw error;
}

export async function getProductList() {
  const api = await apiOfAccountService();
  const res = await fetcher.post(`${api}/graphql`, {
    query: `query {
      products {
        appleProductID,
        currentPrice {
          CNY
          USD
        },
        originalPrice {
          CNY
          USD
        },
        name,
        id,
        duration {
          unit
          value
        },
        discount,
        productIntro,
      }
    }`,
  });
  if (res.ok) {
    const data = (await res.json()).data;
    return data.products;
  }
  const error = new ApiError();
  error.status = res.status;
  throw error;
}

export async function applePay(payment: {
  currency: string, productID: string, transactionID: string, receipt: string
}) {
  const endpoint = await getEndpoint();
  const res = await longFetcher.post(`${endpoint}/applepay/verify`, payment);
  if (res.ok) {
    const data = await res.json();
    return data.data;
  }
  const error = new ApiError();
  error.status = res.status;
  throw error;
}

export async function createOrder(payment: {
  channel: string,
  currency: string,
  productID: string
}) {
  const endpoint = await getEndpoint();
  const res = await longFetcher.post(`${endpoint}/order`, payment);
  if (res.ok) {
    const data = await res.json();
    return data.data;
  }
  const error = new ApiError();
  error.status = res.status;
  throw error;
}

export async function polling(orderID: string) {
  const endpoint = await getEndpoint();
  const res = await longFetcher.post(`${endpoint}/order/polling`, {
    orderID,
  });
  if (res.ok) {
    const data = await res.json();
    return data.data;
  }
  const error = new ApiError();
  error.status = res.status;
  throw error;
}
