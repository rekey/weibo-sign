# weibo-sign

```bash
npm i -S weibo-sign
```

## 匿名
```javascript
const weiboSign = require('weibo-sign');
(async()=>{
  const request = await weiboSign.anonymous.getRequest();
  request({
      uri: 'https://weibo.com/2812335943/HvdpWvizw'
    }, (err, resp, body) => {
      console.log(body);
    });
})();
```
## 登录
```javascript
const weiboSign = require('weibo-sign');
(async()=>{
  const request = await weiboSign.sign.getRequest('username', 'password');
  request({
      uri: 'https://weibo.com/2812335943/HvdpWvizw'
    }, (err, resp, body) => {
      console.log(body);
    });
})();
```