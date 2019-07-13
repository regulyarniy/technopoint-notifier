const { bot, database } = require(`./initialize`);

const BotUser = database.Object.extend(`BotUser`);
const Product = database.Object.extend(`Product`);

bot.start(ctx =>
    ctx.reply(
        `Привет! Пришли мне ссылку вида https://technopoint.ru/product/xxx/yyy на товар и
         я начну присылать тебе уведомления об изменении цены на него`
    )
);

bot.hears(/^https:\/\/technopoint.ru\/product\//, async ({ from, message, reply }) => {
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
    const userData = await botUser.save();
    reply(JSON.stringify(userData));
});

bot.launch();
