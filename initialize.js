const { Parse, Telegram, Sentry } = require(`./constants`);
const database = require(`parse/node`);
const Telegraf = require(`telegraf`);
const SocksAgent = require(`socks5-https-client/lib/Agent`);
const SentryLogger = require(`@sentry/node`);

SentryLogger.init({ dsn: Sentry.DSN });

database.initialize(Parse.APP_ID, Parse.JAVASCRIPT_KEY);

database.serverURL = Parse.SERVER_URL;

const agent = process.env.TECHNOPOINT_USE_PROXY // used only for dev
    ? new SocksAgent({
          socksHost: `45.13.30.140`, // https://hidemyna.me/ru/proxy-list/?type=5#list
          socksPort: 60079,
      })
    : null;

const bot = new Telegraf(Telegram.BOT_TOKEN, { telegram: { agent } });

module.exports = {
    bot,
    database,
    SentryLogger,
};
