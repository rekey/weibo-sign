import {anonymous} from "../index";

(async () => {
  const request = await anonymous.getRequest();
  request({
    uri: 'https://weibo.com/2812335943/HvdpWvizw'
  }, (err, resp, body) => {
    console.log(body);
  });
})();