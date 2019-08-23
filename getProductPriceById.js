const rp = require(`request-promise`);
const cheerio = require(`cheerio`);
// eslint-disable-next-line max-len
const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36`;

const cookiejar = rp.jar();
rp({
    // set city Khabarovsk
    url: `https://technopoint.ru/ajax/change-city/?city_guid=30b7c1ef-03fb-11dc-95ee-00151716f9f5`,
    jar: cookiejar,
    headers: { 'User-Agent': USER_AGENT },
});

module.exports = async id => {
    try {
        const requestOptions = {
            url: `https://technopoint.ru/product/${id}/`,
            jar: cookiejar,
            headers: { 'User-Agent': USER_AGENT },
        };

        const html = await rp(requestOptions);
        const $ = cheerio.load(html);
        return $(`.current-price-value`).data(`price-value`) || 0;
    } catch (err) {
        return -1;
    }
};
