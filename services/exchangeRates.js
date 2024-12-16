// services/exchangeRates.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const currencyMap = {
  USD: 'dollar',
  EUR: 'euro',
  RUB: 'ruble'
};

module.exports.fetchExchangeRates = async function() {
  const currencies = ['USD', 'EUR', 'RUB'];
  const targetCurrency = 'RSD';

  const currencyURLs = {
    USD: `https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=${targetCurrency}`,
    EUR: `https://www.xe.com/currencyconverter/convert/?Amount=1&From=EUR&To=${targetCurrency}`,
    RUB: `https://www.xe.com/currencyconverter/convert/?Amount=1&From=RUB&To=${targetCurrency}`
  };

  let browser;
  const newRates = {};

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36');
    await page.setDefaultNavigationTimeout(60000);

    for (const fromCurrency of currencies) {
      const url = currencyURLs[fromCurrency];
      try {
        console.log(`Загрузка страницы для ${fromCurrency}: ${url}`);
        const response = await page.goto(url, { waitUntil: 'networkidle2' });

        if (!response || response.status() !== 200) {
          console.error(`Ошибка при загрузке страницы для ${fromCurrency}: статус ${response ? response.status() : 'нет ответа'}`);
          continue;
        }

        const selector = 'p.sc-63d8b7e3-1.bMdPIi span.faded-digits';
        const isSelectorPresent = await page.$(selector);

        if (!isSelectorPresent) {
          console.warn(`Селектор "${selector}" не найден для ${fromCurrency}.`);
          continue;
        }

        const rateText = await page.$eval(selector, el => el.textContent);
        const rateNumber = parseFloat(rateText.split(' ')[0].replace(',', '.'));

        if (isNaN(rateNumber)) {
          console.warn(`Не удалось распарсить курс для ${fromCurrency}: "${rateText}"`);
          continue;
        }

        const roundedRate = Math.round(rateNumber * 100) / 100;
        const currencyKey = currencyMap[fromCurrency];

        if (!currencyKey) {
          console.warn(`Неизвестная валюта: ${fromCurrency}`);
          continue;
        }

        newRates[currencyKey] = { value: roundedRate };
        console.log(`Курс ${fromCurrency} обновлён: ${roundedRate} RSD`);

      } catch (error) {
        console.error(`Ошибка при получении курса ${fromCurrency}:`, error.message);
      }
    }

    await page.close();
    return newRates;

  } catch (error) {
    console.error('Ошибка при использовании Puppeteer:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
