const Telegraf = require(`telegraf`);
const SocksAgent = require(`socks5-https-client/lib/Agent`);
const SentryLogger = require(`@sentry/node`);
const firebaseAdmin = require(`firebase-admin`);
// eslint-disable-next-line node/no-unpublished-require
const serviceAccount = require(process.env.TECHNOPOINT_IS_FIREBASE_STAGING
    ? `./firebase-keys-staging.json`
    : `./firebase-keys.json`);

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});

const database = firebaseAdmin.firestore();

SentryLogger.init({ dsn: process.env.TECHNOPOINT_SENTRY_DSN });

const agent = process.env.TECHNOPOINT_USE_PROXY // used only for dev
    ? new SocksAgent({
          socksHost: `127.0.0.1`,
          socksPort: 9150,
      })
    : null;

const bot = new Telegraf(process.env.TECHNOPOINT_BOT_TOKEN, { telegram: { agent } });

module.exports = {
    bot,
    database,
    SentryLogger,
};
