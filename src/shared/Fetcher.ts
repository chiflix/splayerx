const fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = typeof window !== 'undefined' ? window.fetch : require('node-fetch');
// @ts-ignore
const Headers = typeof window !== 'undefined' ? window.Headers : require('node-fetch').Headers;
// @ts-ignore
const AbortController = typeof window !== 'undefined' ? window.AbortController : require('abort-controller');

type FetcherOptions = {
  timeout: number;
  headers: Headers;
  responseInterceptors: ((response: Response) => Response)[];
};

export default class Fetcher {
  private options: FetcherOptions;

  public constructor(options?: Optional<FetcherOptions>) {
    this.options = Object.assign(
      {
        timeout: 10000,
        headers: new Headers(),
        responseInterceptors: [],
      },
      options,
    );
  }

  public setHeader(name: string, value: string) {
    this.options.headers.set(name, value);
  }

  public useResponseInterceptor(interceptor: (response: Response) => Response) {
    this.options.responseInterceptors.unshift(interceptor);
  }

  public fetch(input: RequestInfo, init?: RequestInit): AbortablePromise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeout);
    init = Object.assign(
      {
        signal: controller.signal,
      },
      init,
    );
    if (init.headers) {
      const headers = new Headers(this.options.headers);
      const incomingHeaders = new Headers(init.headers);
      incomingHeaders.forEach((v: string, k: string) => {
        headers.set(k, v);
      });
      init.headers = headers;
    } else {
      init.headers = this.options.headers;
    }
    const res = new Promise((resolve, reject) => {
      fetch(input, init)
        .then(
          (response) => {
            try {
              const responseInterceptors = [
                ...this.options.responseInterceptors,
                (r: Response) => r,
              ];
              response = responseInterceptors.reduce((r, interceptor) => interceptor(r), response);
              resolve(response);
            } catch (ex) {
              reject(ex);
            }
          },
          err => reject(err),
        )
        .finally(() => clearTimeout(timeout));
    }) as AbortablePromise<Response>;
    res.abort = () => {
      controller.abort();
    };
    return res;
  }

  public get(url: string) {
    return this.fetch(url, { method: 'GET' });
  }

  public post(url: string, body: Json) {
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
  }
}
