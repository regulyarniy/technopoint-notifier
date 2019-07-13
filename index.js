const { bot, database, SentryLogger } = require(`./initialize`);

const BotUser = database.Object.extend(`BotUser`);
const Product = database.Object.extend(`Product`);

bot.start(async ({ reply }) => {
    try {
        await reply(
            // eslint-disable-next-line max-len
            `Привет! Пришли мне ссылку вида https://technopoint.ru/product/xxx/yyy на товар и я начну присылать тебе уведомления об изменении цены на него`
        );
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

bot.hears(/^https:\/\/technopoint.ru\/product\//, async ({ from, message, reply }) => {
    try {
        const productId = message.text.split(`/`)[4];
        const url = message.text.slice(0, message.entities[0].length);
        let botUser = null;
        let product = null;
        const queryBotUser = new database.Query(BotUser);
        queryBotUser.equalTo(`telegram_id`, from.id.toString());
        const userResults = await queryBotUser.find();
        if (userResults.length === 0) {
            botUser = new BotUser();
            botUser.set(`telegram_id`, from.id.toString());
            botUser.set(`is_bot`, from.is_bot);
            botUser.set(`first_name`, from.first_name);
            botUser.set(`username`, from.username);
            botUser.set(`language_code:`, from.language_code);
        } else {
            botUser = userResults[0];
        }
        const queryProduct = new database.Query(Product);
        queryProduct.equalTo(`product_id`, productId);
        const productResults = await queryProduct.find();
        if (productResults.length === 0) {
            product = new Product();
            product.set(`product_id`, productId.toString());
            product.set(`url`, url.toString());
        } else {
            product = productResults[0];
        }
        await product.save();
        botUser.relation(`products`).add(product);
        await botUser.save();
        await reply(`Товар сохранен`);
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

bot.command(`/list`, async ({ from, reply }) => {
    try {
        const queryBotUser = new database.Query(BotUser);
        queryBotUser.equalTo(`telegram_id`, from.id.toString());
        const [user] = await queryBotUser.find();
        if (!user) {
            await reply(
                `Для начала пришли ссылку на товар в виде https://technopoint.ru/product/xxx/yyy`
            );
        } else {
            const products = await user
                .relation(`products`)
                .query()
                .find();
            for (const product of products) {
                await reply(product.get(`url`));
            }
        }
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

bot.command(`/clear`, async ({ from, reply }) => {
    try {
        const queryBotUser = new database.Query(BotUser);
        queryBotUser.equalTo(`telegram_id`, from.id.toString());
        const [user] = await queryBotUser.find();
        if (!user) {
            await reply(
                `Для начала пришли ссылку на товар в виде https://technopoint.ru/product/xxx/yyy`
            );
        } else {
            const products = await user
                .relation(`products`)
                .query()
                .find();
            for (const product of products) {
                await user.relation(`products`).remove(product);
            }
            await user.save();
            await reply(`Список товаров очищен`);
        }
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

const launch = async () => {
    try {
        await bot.launch();
    } catch (err) {
        SentryLogger.captureException(err);
        console.log(`restarting in 1 minute...`);
        setTimeout(() => launch(), 60000);
    }
};

launch();
