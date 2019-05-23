const rsa = require('node-bignumber');

import anonymous = require('./anonymous');
import {ILogin, IPreLogin, IRequestAPI, RSAKey, parseResp} from './util';

function base64(str: string) {
  return Buffer.from(str).toString('base64');
}

function rsaEncrypt({pubkey, servertime, nonce}: IPreLogin, password: string) {
  const rsaKey: RSAKey = new rsa.Key();
  rsaKey.setPublic(pubkey, '10001');
  const encryptStr = [servertime, nonce].join("\t") + "\n" + password;
  return rsaKey.encrypt(encryptStr);
}

async function preLogin(loginRequest: IRequestAPI, su: string): Promise<IPreLogin> {
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
      resolve(parseResp(body, 'preLoginCallBack'));
    });
  });
}

function getPrelt() {
  return 100 + Math.floor(900 * Math.random());
}

async function setCookie(loginRequest: IRequestAPI, uri: string) {
  return new Promise((resolve) => {
    loginRequest({uri}, () => {
      resolve();
    });
  });
}

async function login(
  loginRequest: IRequestAPI,
  {rsakv, nonce, servertime}: IPreLogin,
  su: string, sp: string
): Promise<ILogin> {
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

export async function getRequest(username: string, password: string): Promise<IRequestAPI> {
  const su = base64(encodeURIComponent(username));
  const loginRequest = await anonymous.getRequest();
  const preLoginData: IPreLogin = await preLogin(loginRequest, su);
  const sp = rsaEncrypt(preLoginData, password);
  const loginData = await login(loginRequest, preLoginData, su, sp);
  console.log(loginData);
  const ps = loginData.crossDomainUrlList.map((uri) => {
    return setCookie(loginRequest, uri);
  });
  await Promise.all(ps);
  return loginRequest;
}
