const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// YouTube Session Cookies array
const rawCookies = [
  {
    "domain": ".youtube.com",
    "expirationDate": 1806928781.763488,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-BUCKET",
    "path": "/",
    "sameSite": "lax",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "COsF"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948520.699445,
    "hostOnly": false,
    "httpOnly": true,
    "name": "HSID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "A9yXP7PU1YnuDraUJ"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948520.699688,
    "hostOnly": false,
    "httpOnly": true,
    "name": "SSID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "AMjdvGP6isQpemYCL"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948520.699926,
    "hostOnly": false,
    "httpOnly": false,
    "name": "APISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "yR4qvWsndQB3OZmS/AwCWpAVW_IEl8YDwG"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948520.700169,
    "hostOnly": false,
    "httpOnly": false,
    "name": "SAPISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "6LCM1PYqCy7q_ePY/AidYxWoUFeg5ntlrs"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948520.700409,
    "hostOnly": false,
    "httpOnly": false,
    "name": "__Secure-1PAPISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "6LCM1PYqCy7q_ePY/AidYxWoUFeg5ntlrs"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948520.700648,
    "hostOnly": false,
    "httpOnly": false,
    "name": "__Secure-3PAPISID",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "6LCM1PYqCy7q_ePY/AidYxWoUFeg5ntlrs"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948520.70089,
    "hostOnly": false,
    "httpOnly": false,
    "name": "SID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "g.a000DQmZ9CarshpUqPgZbLAK1pnM6_l7KldXpcUl4trglYrq5u60Uh4tHCiU5obqI7BsMVu-TgACgYKAdcSARcSFQHGX2MiZ6ffjqE2Kc-MTMdjyo62tBoVAUF8yKqqQsVbzmF9LlYBUFB8wGaS0076"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948520.70115,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-1PSID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "g.a000DQmZ9CarshpUqPgZbLAK1pnM6_l7KldXpcUl4trglYrq5u60XKuo22figh-dGXazPD9F_wACgYKAeQSARcSFQHGX2MihhvHKyPN70i8GqZyODCr_RoVAUF8yKqSJGWbeRDDsrXRsm6M8tQN0076"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948520.70142,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-3PSID",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "g.a000DQmZ9CarshpUqPgZbLAK1pnM6_l7KldXpcUl4trglYrq5u60hs-6QKepcVE7Db1VuJDyZAACgYKAYoSARcSFQHGX2MiF5svqz4b3txDRrvIrgCyxhoVAUF8yKrLQxe9LZXdxo1diIO08lwF0076"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825948521.858288,
    "hostOnly": false,
    "httpOnly": true,
    "name": "LOGIN_INFO",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "AFmmF2swRAIgOnCYmOfLpmBTpdEj-QoApU8KAsOmyfBKWw-wgn5wnygCIBUd19dCVGTGTYeFfmLmCI61-UsyS6VFrelX61B2l0j4:QUQ3MjNmeTJJSG52X1RpSW5rdWlRVGYtTG9lNkRKbEx6SXhUUkUyTjUzU0dCcHpGdXpsaExXSjcwRjV4cVBvSHcwUUJTR28yS1hXaGVhNHB5U3FGZzBxU1NaUjBSc3htV3plQ0Z3bDlZVTQ3NU4tbkRtNHliaGlRMWM3d0h2bkdRdTE0MUpQUjo0eE5OYmlDRTg2YXl0VU5kV240dWJXUXl3"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1825989202.226176,
    "hostOnly": false,
    "httpOnly": false,
    "name": "PREF",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "tz=Asia.Calcutta&f4=4000000"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1822964198.769305,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-1PSIDTS",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "sidts-CjUBkldj_9-gU6hKxeKKLwjcI54o7kZz3vw2YHfum3m1v-UT6N3UVZuiyNnVHMaO2sxVCGivhxAA"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1822964198.769763,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-3PSIDTS",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "sidts-CjUBkldj_9-gU6hKxeKKLwjcI54o7kZz3vw2YHfum3m1v-UT6N3UVZuiyNnVHMaO2sxVCGivhxAA"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1822965204.527091,
    "hostOnly": false,
    "httpOnly": false,
    "name": "SIDCC",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "AKEyXzWoPJK2vKyp8pdhAH3em18XoEX4E1LzApc0XKlLhKtO9w7eDoOpKH_JcJ3ysf6k-ISmYPw"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1822965204.527401,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-1PSIDCC",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "AKEyXzX4soYS8_OtfE13iwlT4Va4K9FA-iWPcauwfOdbYEAXIg2LkvMnteaqKdxApgPBbqQF5A"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1822965204.52767,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-3PSIDCC",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "AKEyXzUTZ2gVbpeiiSOM9uhzOCkFuZlDO56z8_LcFzPwKqM4Ueygo-bivsjE92K-jstNdZDrrQ"
  }
];

// Initialize Agent with client spoofing
const agent = ytdl.createAgent(rawCookies, {
  client: 'ANDROID'
});

app.get('/', (req, res) => {
  res.send('Server active!');
});

app.get('/stream', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Missing YouTube video URL' });
    }

    const info = await ytdl.getInfo(videoUrl, { agent });
    const format = ytdl.chooseFormat(info.formats, { 
      filter: 'audioandvideo', 
      quality: 'highestvideo' 
    }) || ytdl.chooseFormat(info.formats, { filter: 'audioonly' });

    if (!format || !format.url) {
      return res.status(500).json({ error: 'Stream URL missing' });
    }

    res.json({ streamUrl: format.url, title: info.videoDetails.title });
  } catch (error) {
    console.error('Extraction error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stream', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
