const Telegraf = require(`telegraf`);
const { bot, database, SentryLogger } = require(`./initialize`);
const getProductPriceById = require(`./getProductPriceById`);
const dates = require(`date-fns`);

const UPDATE_INTERVAL_IN_MS = 600000;
const RESTART_ON_FAIL_INTERVAL_IN_MS = 60000;
const HOURS_BEFORE_PRODUCT_DATA_OUTDATED = 1;

const usersCollection = database.collection(`users`);

const menu = Telegraf.Extra.markdown().markup(m =>
    m.keyboard([`❓Справка❓`, `📝Показать список📝`, `❌🔴❌Очистить список❌🔴❌`]).resize()
);

bot.hears([/справка/i, /\/start/i], async ({ reply }) => {
    try {
        await reply(
            // eslint-disable-next-line max-len
            `Привет! 😀 \nПришли мне ссылку вида https://technopoint.ru/product/xxx/yyy на товар и я начну присылать тебе уведомления об изменении цены на него`,
            menu
        );
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

bot.hears(/^https:\/\/technopoint.ru\/product\//, async ({ from, message, reply, chat }) => {
    try {
        const productId = message.text.split(`/`)[4];
        const url = message.text.slice(0, message.entities[0].length);
        const price = await getProductPriceById(productId);
        if (price === -1) {
            await reply(`Для справки отправь /start\n👺Товар не найден! Возможно неверная ссылка!`);
            return;
        }
        const user = await usersCollection.doc(`${from.username}-${chat.id}`);
        const userSnapshot = await user.get();
        if (userSnapshot.exists) {
            const products = userSnapshot.get(`products`);
            const found = products.find(p => p.id === productId);
            if (!found) {
                products.push({ id: productId, url, price, timestamp: new Date() });
                await user.update({ products });
            } else if (found.price !== price) {
                const index = products.indexOf(found);
                products[index].price = price;
                products[index].timestamp = new Date();
                await user.update({ products });
            }
        } else {
            await user.set({
                ...from,
                chatId: chat.id,
                products: [{ id: productId, url, price, timestamp: new Date() }],
            });
        }
        await reply(`Для справки отправь /start\nТовар сохранен. Цена: ${price} руб.`);
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

bot.hears(/Показать/i, async ({ from, reply, chat }) => {
    try {
        const user = await usersCollection.doc(`${from.username}-${chat.id}`);
        const userSnapshot = await user.get();
        if (userSnapshot.exists) {
            const products = userSnapshot.get(`products`);
            for (const product of products) {
                await reply(`Для справки отправь /start\n${product.url}`);
            }
        } else {
            await reply(
                // eslint-disable-next-line max-len
                `Для справки отправь /start\n👺Для начала пришли ссылку на товар в виде https://technopoint.ru/product/xxx/yyy`
            );
        }
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

bot.hears(/Очистить/i, async ({ from, reply, chat }) => {
    try {
        const user = await usersCollection.doc(`${from.username}-${chat.id}`);
        const userSnapshot = await user.get();
        const products = userSnapshot.get(`products`);
        if (userSnapshot.exists) {
            await reply(products.reduce((acc, p) => `${acc}${p.url}\n`, `Удаляю список:\n`));
            user.update({ products: [] });
            await reply(`Список товаров очищен`);
        } else {
            await reply(
                // eslint-disable-next-line max-len
                `Для справки отправь /start\n👺Для начала пришли ссылку на товар в виде https://technopoint.ru/product/xxx/yyy`
            );
        }
    } catch (err) {
        SentryLogger.captureException(err);
    }
});

const updateProducts = async () => {
    try {
        const usersRefs = await usersCollection.listDocuments();
        for (const user of usersRefs) {
            const userSnapshot = await user.get();
            const userData = await userSnapshot.data();
            const products = userData.products;
            for (const product of products) {
                const productUpdateThreshold = dates.addHours(
                    product.timestamp.toDate(),
                    HOURS_BEFORE_PRODUCT_DATA_OUTDATED
                );
                const isUpdateNeeded = dates.isBefore(productUpdateThreshold, new Date());
                if (isUpdateNeeded) {
                    const newPrice = await getProductPriceById(product.id);
                    const oldPrice = product.price;
                    const found = products.find(p => p.id === product.id);
                    found.timestamp = new Date();
                    if (newPrice !== product.price) {
                        found.price = newPrice;
                        await bot.telegram.sendMessage(
                            userData.chatId,
                            // eslint-disable-next-line max-len
                            `Для справки отправь /start\n❗️❗️❗️Цена на товар изменилась.\n Старая цена: ${oldPrice} Новая цена: ${newPrice}\n Ссылка: ${product.url}`
                        );
                    }
                    await user.update({ products });
                }
            }
        }
    } catch (err) {
        SentryLogger.captureException(err);
    }
};

const launch = async () => {
    try {
        await bot.launch();
        updateProducts();
        setInterval(updateProducts, UPDATE_INTERVAL_IN_MS);
    } catch (err) {
        SentryLogger.captureException(err);
        console.log(`restarting in 1 minute...`);
        setTimeout(() => launch(), RESTART_ON_FAIL_INTERVAL_IN_MS);
    }
};

launch();
