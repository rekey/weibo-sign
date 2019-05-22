import {RequestAPI, Request, CoreOptions, RequiredUriUrl} from 'request';

export interface IResponseBody<T> {
  retcode: number,
  msg: string,
  data: T
}

export interface IGenVisitor {
  tid: string
  new_tid: Boolean
  confidence: number
}

export interface IVisitor {
  sub: string
  subp: string
}

export interface IPreLogin {
  retcode: number
  servertime: number
  pcid: string
  nonce: string
  pubkey: string
  rsakv: string
  is_openlock: number
  showpin: number
  exectime: number
}

export interface ILogin {
  retcode: string
  uid: string
  nick: string
  crossDomainUrlList: string[]
}

export interface IRequestAPI extends RequestAPI<Request, CoreOptions, RequiredUriUrl> {

}

export const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36';

export const chromePlugins = 'Portable Document Format::internal-pdf-viewer::Chrome PDF Plugin' +
  '|::mhjfbmdgcfjbbpaeojofohoefgiehjai::Chrome PDF Viewer|::internal-nacl-plugin::Native Client';

export function parseResp<T>(body: string, method: string): T {
  const host = {
    [method]: function (data: any) {
      return data;
    }
  };
  const fn = new Function(`
    const window = this;
    const ${method} = this.${method};
    return ${body};`
  );
  return fn.bind(host)();
}