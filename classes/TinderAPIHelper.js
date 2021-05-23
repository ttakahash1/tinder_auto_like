const request = require('request');
const puppeteer = require('puppeteer');
const env = require('dotenv').config({ path: './.env.production.local' });

class TinderAPIHelper {
  constructor() {
    this.fb_token = null;
    this.x_auth_token = null;
    this.likes_remaining = 0;
    this.recommends = [];
    this.matches = [];
  }

  // setter
  setFBToken(fbToken) {
    this.fb_token = fbToken;
  }
  setXAuthToken(token) {
    this.x_auth_token = token;
  }
  setLikesRemaining(remaining) {
    this.likes_remaining = remaining;
  }
  setRecommends(recommends) {
    this.recommends = recommends;
  }
  setMatches(ids) {
    this.matches = ids;
  }

  // getter
  getToken() {
    return this.x_auth_token;
  }
  getLikesRemaining() {
    return this.likes_remaining;
  }
  getFBToken() {
    return this.fb_token;
  }
  getRecommends() {
    return this.recommends;
  }
  getMatches() {
    return this.matches;
  }
  getHeader() {
    return {
      'X-Auth-Token': this.x_auth_token,
      'Content-type': 'application/json',
      'platform': 'ios',
      'User-agent': 'User-Agent: Tinder/3.0.4 (iPhone; iOS 7.1; Scale/2.00)'
    }
  }

  async doFBLogin() {
    try {
      const CONFIRM_ELE = 'button[name="__CONFIRM__"]';
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(process.env.FB_LOGIN_URL);
      await page.click('#email');
      await page.keyboard.type(process.env.EMAIL);
      await page.click('#pass')
      await page.keyboard.type(process.env.PASSWORD);

      await Promise.all([
        page.waitForNavigation(),
        page.click('#loginbutton')
      ]);
      await page.waitForSelector(CONFIRM_ELE);
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().endsWith('/dialog/oauth/confirm/')),
        page.click(CONFIRM_ELE),
      ]);
      const resultPage = await response.text();
      let resultWithNotags = resultPage.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
      const params = resultWithNotags.split('&');
      for (let i = 0, len = params.length; i < len; i++) {
        let param = params[i].split('=');
        if (param[0] === 'access_token') {
          this.setFBToken(param[1]);
          break;
        }
      }
      browser.close();
      return 'succeeded';
    } catch(e) {
      console.log(e);
      return 'failed';
    }
  }

  async doTinderLogin() {
    try {
      const url = `${process.env.TINDER_URL}/v2/auth/login/facebook`;
      const method = 'POST';
      const data = JSON.stringify({token: this.fb_token});
      const headers = Object.freeze({
        'Content-type': 'application/json'
      });
      const res = await this.requestHandler(url, method, headers, data);
      if (
        typeof res.data.api_token !== 'undefined' &&
        res.data.api_token !== null
      ) {
        this.setXAuthToken(res.data.api_token);
      }
      return 'succeeded';
    } catch (e) {
      console.log(e);
      await this.doLogin();
      return 'failed';
    }
  }

  async doLogin() {
    const fbLoginStatus = await this.doFBLogin();
    if (fbLoginStatus === 'failed') {
      return {
        isSucceeded: false,
        type: 'facebook'
      };
    }
    const tdLoginStatus = await this.doTinderLogin();
    if (tdLoginStatus === 'failed') {
      return {
        isSucceeded: false,
        type: 'tinder'
      };
    }
    return {
      isSucceeded: true,
      type: 'none'
    }
  };

  async fetchMyLikesRemaining() {
    try {
      const uri = `${process.env.TINDER_URL}/v2/profile?locale=ja&include=likes`;
      const method = 'GET';
      const res = await this.requestHandler(uri, method, this.getHeader());
      this.setLikesRemaining(res.data.likes.likes_remaining);
      return 'succeeded';
    } catch (e) {
      console.log(e);

      return 'failed';
    }
  }

  async fetchRecommends() {
    try {
      const uri = `${process.env.TINDER_URL}/v2/recs/core?locale=ja`;
      const method = 'GET';
      const res = await this.requestHandler(uri, method, this.getHeader());
      this.setRecommends(res.data.results);
      return 'succeeded';
    } catch(e) {
      // console.log(e);
      return 'failed';
    }
  }

  async doSwiping(action, id) {
    try {
      const uri = `${process.env.TINDER_URL}/${action}/${id}`;
      const method = 'POST';
      const results = await this.requestHandler(uri, method, this.getHeader());
      if (action === 'like') {
        this.setLikesRemaining(results.likes_remaining);
        let ids = this.getMatches().slice();
        if (results.match) {
          ids.push(id);
        }
        this.getMatches(ids);
      }
      return 'succeeded';
    } catch(e) {
      console.log(e);
      return 'failed';
    }
  }

  async requestHandler(uri, method, headers, data = null) {
    return new Promise((resolve, reject) => {
      request({
        uri: uri,
        method: method,
        headers: headers,
        body: data
      }, (err, res, body) => {
        if (err) {
          reject({err: 'api fetch error'})
          return;
        }
        const json = JSON.parse(body || "null");
        if (json === '' || json === null || typeof json === 'undefined') {
          reject({err: '値を受け取れていない'});
          return;
        }
        const status = (typeof json.meta === 'undefined') ? json.status: json.meta.status;
        if (status === 400) {
          reject({err: json.error.code});
          return;
        }
        resolve(json);
      });
    });
  }
}

module.exports = TinderAPIHelper;
