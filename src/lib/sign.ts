declare namespace NSina {
  export class RSAKey {
    constructor()

    setPublic(pubkey: string, offset: string): void

    encrypt(str: string): string
  }
}

const sinaSSOEncoder = require('./sinaSSO');

import util = require('./util');
import anonymous = require('./anonymous');

function base64(str: string) {
  return Buffer.from(str).toString('base64');
}

async function preLogin(loginRequest: util.IRequestAPI, su: string): Promise<util.IPreLogin> {
  return new Promise((resolve, reject) => {
    loginRequest({
      uri: 'https://login.sina.com.cn/sso/prelogin.php',
      qs: {
        entry: 'weibo',
        callback: 'preLoginCallBack',
        su,
        rsakt: 'mod',
        checkpin: '1',
        client: 'ssologin.js(v1.4.19)',
        _: Date.now()
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
      resolve(util.parseResp(body, 'preLoginCallBack'));
    });
  });
}

function getPrelt() {
  return 100 + Math.floor(900 * Math.random());
}

async function setCookie(loginRequest: util.IRequestAPI, uri: string) {
  return new Promise((resolve) => {
    loginRequest({uri}, () => {
      resolve();
    });
  });
}

async function login(loginRequest: util.IRequestAPI, {rsakv, nonce, servertime}:
  util.IPreLogin, su: string, sp: string): Promise<util.ILogin> {
  return new Promise((resolve, reject) => {
    loginRequest({
      uri: 'https://login.sina.com.cn/sso/login.php',
      method: 'post',
      form: {
        su,
        sp,
        nonce,
        rsakv,
        servertime,
        entry: 'weibo',
        gateway: 1,
        from: '',
        savestate: 30,
        useticket: 0,
        pagerefer: '',
        vsnf: 1,
        service: 'sso',
        pwencode: 'rsa2',
        sr: '1920*1080',
        encoding: 'UTF-8',
        cdult: 3,
        domain: 'sina.com.cn',
        prelt: getPrelt(),
        returntype: 'TEXT'
      },
      json: true
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

export async function getRequest(username: string, password: string): Promise<util.IRequestAPI> {
  const su = base64(encodeURIComponent(username));
  const loginRequest = await anonymous.getRequest();
  const preLoginData: util.IPreLogin = await preLogin(loginRequest, su);
  const rsaKey: NSina.RSAKey = new sinaSSOEncoder.RSAKey();
  rsaKey.setPublic(preLoginData.pubkey, '10001');
  const sp = rsaKey.encrypt([preLoginData.servertime, preLoginData.nonce].join("\t") + "\n" + password);
  const loginData = await login(loginRequest, preLoginData, su, sp);
  const ps = loginData.crossDomainUrlList.map((uri) => {
    return setCookie(loginRequest, uri);
  });
  await Promise.all(ps);
  return loginRequest;
}
