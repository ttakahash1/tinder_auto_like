const TinderAPIHelper = require('./classes/TinderAPIHelper.js');
const utils = require('./utils');
const express = require('express');
const session = require('express-session');
const https = require('https');
const fs = require('fs');
const { resolve } = require('path');
const app = express();
const env = require('dotenv').config({ path: './.env.production.local' });
const bodyParser = require('body-parser');

app.use(require('body-parser').text());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const root = require('path').join(__dirname, 'build');
app.use(express.static(root));

const tinder = new TinderAPIHelper();

app.get('/auth', async(req, res) => {
  const auth = await tinder.doLogin();
  if (auth.isSucceeded) {
    res.status(200).send({msg: 'OK'});
    return;
  }
  if (auth.type === 'facebook') {
    res.status(500).send({msg: 'facebook'});
    return;
  } else if (auth.type === 'tinder') {
    res.status(500).send({msg: 'tinder'});
    return;
  }
});

app.get('/remaining', async(req, res) => {
  try {
    await tinder.fetchMyLikesRemaining();
    res.status(200).send({remainings: tinder.getLikesRemaining()});
  } catch(e) {
    res.status(500).send({remaining: 0});
  }
});

const ws = require('ws');
var socket = new ws.Server({port:5050});
socket.on('connection', wss => {
  console.log('websocket connection.');

  const swipeAuto = async (num = 0) => {
    const recs = tinder.getRecommends();
    if (recs.length <= 0) {
      return;
    }
    for (let i = 0, l = recs.length; i < l; i++) {
      const remaining = tinder.getLikesRemaining();
      if (remaining === 0) {
        break;
      }
      const isAppropriate = utils.isAppropriateForLike(
        recs[i].user.bio,
        recs[i].user.birth_date,
        recs[i].user.gender
      );
      let action = 'like';
      if (!isAppropriate) {
        action = 'pass';
      }
      let result = await tinder.doSwiping(action, recs[i].user._id);
      if (result === 'failed') {
        continue;
      }
      if (action === 'like') {
        num = num + 1;
      }
      wss.send(JSON.stringify({
        type: 0,
        num: num,
        matches: tinder.getMatches()
      }));
      utils.sleep(100);
    }
    if (tinder.getLikesRemaining() > 0) {
      await tinder.fetchRecommends();
      return await swipeAuto(num);
    }
    wss.send(JSON.stringify({
      type: 1
    }));
    return;
  }

  wss.on('message', async message => {
    console.log('websocket message', message);
    if (message === 'start') {
      try {
        const rem = await tinder.fetchMyLikesRemaining();
        if (rem === 'failed') {
          wss.send(JSON.stringify({
            type: 2
          }));
          wss.close();
        }
        const remainings = tinder.getLikesRemaining();
        if (remainings === 0) {
          wss.send(JSON.stringify({
            type: 2
          }));
          wss.close();
        }
        await tinder.fetchRecommends();
        await swipeAuto();
      } catch(e) {
        console.error(e);
      }
    }
  });

  wss.on('close', () => {
    console.log('websocket disconnected.');
  });

});


const options = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem')
};

const sessionConf = {
  secret: 'MYSECRET',
  name: 'appName',
  resave: false,
  saveUninitialized: false,
  cookie : {
    sameSite: 'none',
  }
}

app.use(session(sessionConf));

const server = https.createServer(options, app);
server.listen(5555, () => console.log(`Node server listening on port 5555!`));
