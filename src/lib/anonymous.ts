import request = require('request');

import { IRequestAPI, IGenVisitor, IResponseBody, parseResp, ua, chromePlugins } from './util';

function genVisitor(anonymousRequest: IRequestAPI): Promise<string> {
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

function genVisitorPost(anonymousRequest: IRequestAPI): Promise<string> {
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

function getCookies(anonymousRequest: IRequestAPI, data: IGenVisitor): Promise<string> {
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

export async function getRequest(): Promise<IRequestAPI> {
  const anonymousRequest = request.defaults({
    headers: {
      DNT: 1,
      'Upgrade-Insecure-Requests': 1,
      'User-Agent': ua
    },
    forever: true,
    jar: true,
    gzip: true,
    agentOptions: {
      secureProtocol: 'TLSv1_method'
    }
  });
  await genVisitor(anonymousRequest);
  const genVisitorResp = await genVisitorPost(anonymousRequest);
  const genVisitorBody: IResponseBody<IGenVisitor> = parseResp(genVisitorResp, 'gen_callback');
  await getCookies(anonymousRequest, genVisitorBody.data);
  // const cookieResp = await getCookies(anonymousRequest, genVisitorBody.data);
  // const cookieBody: IResponseBody<IVisitor> = parseResp(cookieResp, 'cross_domain');
  return anonymousRequest;
}
