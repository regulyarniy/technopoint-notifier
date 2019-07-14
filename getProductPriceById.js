const rp = require(`request-promise`);
const cheerio = require(`cheerio`);

module.exports = async id => {
    try {
        const requestOptions = {
            url: `https://technopoint.ru/product/${id}/`,
            headers: {
                // eslint-disable-next-line max-len
                'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36`,
            },
        };

        const html = await rp(requestOptions);
        const $ = cheerio.load(html);
        return $(`.current-price-value`).data(`price-value`);
    } catch (err) {
        return -1;
    }
};
