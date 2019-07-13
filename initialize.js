const { Parse, Telegram } = require(`./constants`);
const database = require(`parse/node`);
const Telegraf = require(`telegraf`);
const SocksAgent = require(`socks5-https-client/lib/Agent`);

database.initialize(Parse.APP_ID, Parse.JAVASCRIPT_KEY);

database.serverURL = Parse.SERVER_URL;

const agent = process.env.TECHNOPOINT_USE_PROXY // used only for dev
    ? new SocksAgent({
          socksHost: `111.223.75.178`, // https://hidemyna.me/ru/proxy-list/?type=5#list
          socksPort: 8888,
      })
    : null;

const bot = new Telegraf(Telegram.BOT_TOKEN, { telegram: { agent } });

module.exports = {
    bot,
    database,
};
