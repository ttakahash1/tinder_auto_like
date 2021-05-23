## How to use

### install package.

It's necessary to be installed `node version 12.4.0〜` and `npm version 6.5.0〜` in you PC.

Install node modules using the following command.

```
npm install
```

### use this app on your local env.

```
node index.js
```

`https://localhost:5555`

### create env file.

Create environment file `.env.production.local` by reference to `.env`.

EMAIL: Your email address for your Facebook account.
PASSWORD: Your password for your Facebook account.
FB_ID: Your Facebook ID.
FB_LOGIN_URL: Facebook login URL that it's used by tinder authenticate.
TINDER_URL=https://api.gotinder.com

### Set Conditions

you can set conditions by editing 'utils.js'

- ANTI_KEYWORDS: This tool push nope when biographies include these keywords.
- MIN_AGE
- MAX_AGE
- DISTANCE
- GENDER 0: male, 1: female.
