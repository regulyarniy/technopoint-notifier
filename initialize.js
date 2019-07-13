const Telegraf = require(`telegraf`);
const SocksAgent = require(`socks5-https-client/lib/Agent`);
const SentryLogger = require(`@sentry/node`);
const firebaseAdmin = require(`firebase-admin`);
// eslint-disable-next-line node/no-unpublished-require
const serviceAccount = require(`./firebase-keys.json`);

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});

const database = firebaseAdmin.firestore();

SentryLogger.init({ dsn: process.env.TECHNOPOINT_SENTRY_DSN });

const agent = process.env.TECHNOPOINT_USE_PROXY // used only for dev
    ? new SocksAgent({
          socksHost: `45.13.30.140`, // https://hidemyna.me/ru/proxy-list/?type=5#list
          socksPort: 60079,
      })
    : null;

const bot = new Telegraf(process.env.TECHNOPOINT_BOT_TOKEN, { telegram: { agent } });

module.exports = {
    bot,
    database,
    SentryLogger,
};
