const { bot, database, SentryLogger } = require(`./initialize`);
const getProductPriceById = require(`./getProductPriceById`);

const usersCollection = database.collection(`users`);

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
        const price = await getProductPriceById(productId);
        const user = await usersCollection.doc(from.username);
        const userSnapshot = await user.get();
        if (userSnapshot.exists) {
            const products = userSnapshot.get(`products`);
            const found = products.find(p => p.id === productId);
            if (!found) {
                products.push({ id: productId, url, price });
                await user.update({ products });
            } else if (found.price !== price) {
                const index = products.indexOf(found);
                products[index].price = price;
                user.update({ products });
            }
        } else {
            await user.set({ ...from, products: [{ id: productId, url, price }] });
        }
        await reply(`Товар сохранен. Цена: ${price} руб.`);
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

bot.command(`/list`, async ({ from, reply }) => {
    try {
        const user = await usersCollection.doc(from.username);
        const userSnapshot = await user.get();
        if (userSnapshot.exists) {
            const products = userSnapshot.get(`products`);
            for (const product of products) {
                await reply(product.url);
            }
        } else {
            await reply(
                `Для начала пришли ссылку на товар в виде https://technopoint.ru/product/xxx/yyy`
            );
        }
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

bot.command(`/clear`, async ({ from, reply }) => {
    try {
        const user = await usersCollection.doc(from.username);
        const userSnapshot = await user.get();
        if (userSnapshot.exists) {
            user.update({ products: [] });
            await reply(`Список товаров очищен`);
        } else {
            await reply(
                `Для начала пришли ссылку на товар в виде https://technopoint.ru/product/xxx/yyy`
            );
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
