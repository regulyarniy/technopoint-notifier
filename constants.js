const Parse = {
    APP_ID: process.env.TECHNOPOINT_PARSE_APP_ID,
    SERVER_URL: process.env.TECHNOPOINT_PARSE_SERVER_URL,
    JAVASCRIPT_KEY: process.env.TECHNOPOINT_PARSE_JAVASCRIPT_KEY,
    MASTER_KEY: process.env.TECHNOPOINT_PARSE_MASTER_KEY,
};

const Telegram = {
    BOT_TOKEN: process.env.TECHNOPOINT_BOT_TOKEN,
};

const Sentry = {
    DSN: process.env.TECHNOPOINT_SENTRY_DSN,
};

module.exports = {
    Parse,
    Telegram,
    Sentry,
};
