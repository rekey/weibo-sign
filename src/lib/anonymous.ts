import request = require('request');
import {RequestAPI, Request, CoreOptions, RequiredUriUrl} from 'request';

interface IResponseBody<T> {
  retcode: number,
  msg: string,
  data: T
}

interface IGenVisitor {
  tid: string
  new_tid: Boolean
  confidence: number
}

interface IVisitor {
  sub: string
  subp: string
}

const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36';
const chromePlugins = 'Portable Document Format::internal-pdf-viewer::Chrome PDF Plugin' +
  '|::mhjfbmdgcfjbbpaeojofohoefgiehjai::Chrome PDF Viewer|::internal-nacl-plugin::Native Client';

function genVisitor(anonymousRequest: RequestAPI<Request, CoreOptions, RequiredUriUrl>): Promise<string> {
  return new Promise((resolve, reject) => {
    anonymousRequest({
      uri: 'https://passport.weibo.com/visitor/genvisitor',
      qs: {
        entry: 'miniblog',
        a: 'enter',
        url: 'https://weibo.com/',
        domain: '.weibo.com',
        ua: 'php-sso_sdk_client-0.6.28',
        _rand: Date.now() / 1000
      }
    }, (err, resp, body) => {
      if (err) {
        reject(err);
        return;
      }
      if (resp.statusCode !== 200) {
        reject(resp.statusCode);
        return;
      }
      resolve(body);
    });
  });
}

function genVisitorPost(anonymousRequest: RequestAPI<Request, CoreOptions, RequiredUriUrl>): Promise<string> {
  return new Promise((resolve, reject) => {
    anonymousRequest({
      uri: 'https://passport.weibo.com/visitor/genvisitor',
      method: 'post',
      form: {
        cb: 'gen_callback',
        fp: JSON.stringify({
          "os": "2",
          "browser": "Chrome74,0,3729,157",
          "fonts": "undefined",
          "screenInfo": "1920*1080*24",
          "plugins": chromePlugins
        })
      }
    }, (err, resp, body) => {
      if (err) {
        reject(err);
        return;
      }
      if (resp.statusCode !== 200) {
        reject(resp.statusCode);
        return;
      }
      resolve(body);
    });
  });
}

function parsePostBody<T>(body: string, fn: string): T {
  const host = {
    [fn]: function (data: any) {
      return data;
    }
  };
  return new Function(`
    const window = this;
    const ${fn} = this.${fn};
    return ${body};`
  ).bind(host)();
}

function getCookies(anonymousRequest: RequestAPI<Request, CoreOptions, RequiredUriUrl>,
                    data: IGenVisitor): Promise<string> {
  return new Promise((resolve, reject) => {
    anonymousRequest({
      uri: 'https://passport.weibo.com/visitor/visitor',
      qs: {
        a: 'incarnate',
        t: data.tid,
        w: data.new_tid ? 3 : 2,
        c: data.confidence || 95,
        cb: 'cross_domain',
        from: 'weibo'
      }
    }, (err, resp, body) => {
      if (err) {
        reject(err);
        return;
      }
      if (resp.statusCode !== 200) {
        reject(resp.statusCode);
        return;
      }
      resolve(body);
    });
  });
}

export async function getAnonymousRequest(): Promise<RequestAPI<Request, CoreOptions, RequiredUriUrl>> {
  const anonymousRequest = request.defaults({
    headers: {
      DNT: 1,
      Host: 'passport.weibo.com',
      'Upgrade-Insecure-Requests': 1,
      'User-Agent': ua
    },
    forever: true,
    jar: true,
    gzip: true,
  });
  await genVisitor(anonymousRequest);
  const genVisitorResp = await genVisitorPost(anonymousRequest);
  const genVisitorBody: IResponseBody<IGenVisitor> = parsePostBody(genVisitorResp, 'gen_callback');
  await getCookies(anonymousRequest, genVisitorBody.data);
  // const cookieResp = await getCookies(anonymousRequest, genVisitorBody.data);
  // const cookieBody: IResponseBody<IVisitor> = parsePostBody(cookieResp, 'cross_domain');
  return anonymousRequest;
}
