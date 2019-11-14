import Fetcher from '@/../shared/Fetcher';


export class ApiError extends Error {
  /** HTTP status */
  public status: number;

  /** Message from server */
  public message: string;
}

/**
 * @description http intercept method
 * @author tanghaixiang
 * @param {Response} response
 * @returns Response
 */
function intercept(response: Response) {
  const headers = response.headers;
  const authorization = headers.get('authorization');
  if (headers && authorization) {
    const token = authorization.replace('Bearer', '').trim();
    let displayName = '';
    try {
      displayName = JSON.parse(new Buffer(token.split('.')[1], 'base64').toString()).displayName; // eslint-disable-line
    } catch (error) {
      // tmpty
    }
    // @ts-ignore
    window.remote && window.remote.app.emit('refresh-token', {
      token,
      displayName,
    });
  }
  return response;
}

const fetcher = new Fetcher({
  timeout: 1000 * 10,
  responseInterceptors: [intercept],
});

const longFetcher = new Fetcher({
  timeout: 20 * 1000,
  responseInterceptors: [intercept],
});

export function setToken(t: string) {
  fetcher.setHeader('Authorization', `Bearer ${t}`);
  longFetcher.setHeader('Authorization', `Bearer ${t}`);
}

// @ts-ignore
const endpoint = window.remote && window.remote.app.getSignInEndPoint();
// @ts-ignore
const crossThread = (window.remote && window.remote.app.crossThreadCache) || ((key, func) => func);

/**
 * @description get IP && geo data from server
 * @author tanghaixiang
 * @returns Promise
 */
export const getGeoIP = crossThread(['ip', 'countryCode'], () => new Promise((resolve, reject) => {
  fetcher.get(`${endpoint}/api/geoip`).then((response: Response) => {
    if (response.ok) {
      response.json().then((data: { ip: string, countryCode: string }) => resolve(data));
    } else {
      reject(new Error());
    }
  }).catch((error) => {
    reject(error);
  });
}));

/**
 * @description get sms code with no-captcha validation
 * @author tanghaixiang
 * @param {string} phone
 * @param {string} [afs]
 * @param {{
 *   session: string,
 *   sig: string,
 *   token: string,
 *   scene: string,
 *   appKey: string, // eslint-disable-line
 *   remoteIp: string, // eslint-disable-line
 * }} [sms]
 * @returns Promise
 */
export function getSMSCode(phone: string, afs?: string, sms?: {
  session: string,
  sig: string,
  token: string,
  scene: string,
  appKey: string, // eslint-disable-line
  remoteIp: string, // eslint-disable-line
}) {
  return new Promise((resolve, reject) => {
    const data = {
      phone,
    };
    if (afs) {
      Object.assign(data, { afs });
    } else if (sms) {
      Object.assign(data, sms);
    }
    fetcher.post(`${endpoint}/api/auth/sms`, data)
      .then((response: Response) => {
        if (response.status === 200) {
          resolve(true);
        } else if (response.status === 400) {
          resolve(false);
        } else {
          reject(new Error());
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * @description sign api
 * @author tanghaixiang
 * @param {string} type sign type
 * @param {string} phone
 * @param {string} code sms code
 * @returns Promise
 */
export function signIn(type: string, phone: string, code: string) {
  return new Promise((resolve, reject) => {
    fetcher.post(`${endpoint}/api/auth/login`, {
      phone,
      type,
      code,
    })
      .then((response: Response) => {
        if (response.ok) {
          // @ts-ignore
          window.remote && window.remote.app.emit('sign-in');
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function getProductList() {
  const res = await fetcher.post(`${endpoint}/graphql`, {
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
          giftUnit
          giftValue
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
  const res = await longFetcher.post(`${endpoint}/api/applepay/verify`, payment);
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
  const res = await longFetcher.post(`${endpoint}/api/order`, payment);
  if (res.ok) {
    const data = await res.json();
    return data.data;
  }
  const error = new ApiError();
  error.status = res.status;
  throw error;
}
