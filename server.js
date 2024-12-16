// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const chokidar = require('chokidar'); // Для надёжного отслеживания файлов

// Puppeteer-extra и Stealth Plugin
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Создание HTTP-сервера
const server = http.createServer(app);

// Инициализация Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Измените на ваш домен для безопасности
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());

// Настройка EJS как движка шаблонов
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Обслуживание статических файлов по префиксу /src/
app.use('/src', express.static(path.join(__dirname, 'src')));

// Функция для генерации уникальных ID
const generateUniqueId = (base, index) => `${base}-${index + 1}`;

// Маппинг валют
const currencyMap = {
  USD: 'dollar',
  EUR: 'euro',
  RUB: 'ruble'
  // Добавьте другие валюты по мере необходимости
};

// Хранилище для курсов валют
let exchangeRatesCache = {
  dollar: { value: 0 },
  euro: { value: 0 },
  ruble: { value: 0 },
  // Добавьте другие валюты по мере необходимости
};

// Хранилище для статистических данных (если понадобится в будущем)
let exchangeStatisticsCache = {
  // Пример структуры
  // USD: { ... },
  // EUR: { ... },
  // RUB: { ... },
};

// Функция для получения курсов валют с использованием Puppeteer
const fetchExchangeRates = async () => {
  const currencies = ['USD', 'EUR', 'RUB']; // Используем ваши URL
  const targetCurrency = 'RSD'; // Сербские динары

  // Соответствующие URL для каждой валюты
  const currencyURLs = {
    USD: `https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=${targetCurrency}`,
    EUR: `https://www.xe.com/currencyconverter/convert/?Amount=1&From=EUR&To=${targetCurrency}`,
    RUB: `https://www.xe.com/currencyconverter/convert/?Amount=1&From=RUB&To=${targetCurrency}`
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null,
    });

    const page = await browser.newPage();

    // Установка реалистичного User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/85.0.4183.102 Safari/537.36');

    // Установка таймаута
    await page.setDefaultNavigationTimeout(60000); // 60 секунд

    for (const fromCurrency of currencies) {
      const url = currencyURLs[fromCurrency];
      try {
        console.log(`Загрузка страницы для ${fromCurrency}: ${url}`);
        const response = await page.goto(url, { waitUntil: 'networkidle2' });

        if (!response || response.status() !== 200) {
          console.error(`Ошибка при загрузке страницы для ${fromCurrency}: статус ${response ? response.status() : 'нет ответа'}`);
          continue;
        }

        // Обновите селектор в соответствии с текущей структурой сайта
        // Проверьте текущую структуру сайта и обновите селектор при необходимости
        const selector = 'p.sc-63d8b7e3-1.bMdPIi span.faded-digits';

        // Проверяем наличие селектора
        const isSelectorPresent = await page.$(selector);
        if (!isSelectorPresent) {
          console.warn(`Селектор "${selector}" не найден на странице для ${fromCurrency}.`);
          continue;
        }

        const rateText = await page.$eval(selector, el => el.textContent);
        // Предположим, что rateText выглядит как "1.06 RSD"
        const rateNumber = parseFloat(rateText.split(' ')[0].replace(',', '.')); // Пример: "1.06"

        if (isNaN(rateNumber)) {
          console.warn(`Не удалось распарсить курс валюты ${fromCurrency}: "${rateText}"`);
          continue;
        }

        const roundedRate = Math.round(rateNumber * 100) / 100;

        const currencyKey = currencyMap[fromCurrency];
        if (!currencyKey) {
          console.warn(`Неизвестная валюта: ${fromCurrency}`);
          continue;
        }

        // Обновляем только значение курса без расчёта процентов
        exchangeRatesCache[currencyKey] = {
          value: roundedRate
        };

        console.log(`Курс валюты ${fromCurrency} обновлён: ${roundedRate} RSD`);

        // Отправка обновления клиентам
        io.emit('exchangeRatesUpdate', {
          currency: fromCurrency,
          value: roundedRate
        });

      } catch (error) {
        console.error(`Ошибка при получении курса валюты ${fromCurrency}:`, error.message);
      }
    }

    await page.close();

  } catch (error) {
    console.error('Ошибка при использовании Puppeteer:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Функция для получения статистических данных с использованием Puppeteer (отключена из-за 404)
const fetchExchangeStatistics = async () => {
  // Временно отключено, так как URL возвращает 404
  console.log('Функция fetchExchangeStatistics отключена из-за недоступности URL.');
};

// Функция для обработки и обновления всех данных
const updateAllExchangeData = async () => {
  await fetchExchangeRates();
  // await fetchExchangeStatistics(); // Отключено из-за недоступности URL
};

// Инициализация курсов валют и статистических данных при запуске сервера
updateAllExchangeData();

// Обновление курсов валют и статистических данных каждые 2 минуты (120000 миллисекунд)
setInterval(updateAllExchangeData, 2 * 60 * 1000);

// Обработка подключений Socket.IO
io.on('connection', (socket) => {
  console.log('Новый клиент подключился:', socket.id);

  // Отправка текущих данных при подключении нового клиента
  socket.emit('initialData', {
    exchangeRates: exchangeRatesCache
    // exchangeStatistics: exchangeStatisticsCache // Отключено
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключился:', socket.id);
  });
});

// Функция для отправки обновлений из JSON-файла (уточните необходимость)
const sendUpdatesFromJSON = () => {
  const rawDataPath = path.join(__dirname, 'src', 'data', 'json', 'raw-data.json');

  console.log(`Чтение данных из ${rawDataPath}...`);

  fs.readFile(rawDataPath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Ошибка чтения raw-data.json:', err);
      return;
    }
    try {
      const rawData = JSON.parse(data);

      // Проверка наличия необходимых данных
      if (!rawData.statistics) {
        throw new Error('Missing statistics data in raw-data.json');
      }

      // Проверка и добавление 'income', если его нет
      if (!rawData.statistics.income) {
        console.warn('Income data is missing in raw-data.json. Setting default values.');
        rawData.statistics.income = {
          change: {
            percent: 0,
            type: 'n/a',
          },
        };
      }

      // Обработка данных
      const processedData = {
        statistics: {
          todayRevenue: {
            value: rawData.statistics.todayRevenue.value,
            currency: rawData.statistics.todayRevenue.currency,
            id: rawData.statistics.todayRevenue.id,
            change: {
              percent: Math.round(
                ((rawData.statistics.todayRevenue.value - rawData.statistics.todayRevenue.previousValue) /
                  rawData.statistics.todayRevenue.previousValue) *
                  100
              ),
              type:
                rawData.statistics.todayRevenue.value >= rawData.statistics.todayRevenue.previousValue
                  ? 'increase'
                  : 'decrease',
            },
          },
          orders: {
            value: rawData.statistics.orders.value,
            id: rawData.statistics.orders.id,
            change: {
              percent: rawData.statistics.orders.changePercent,
              type: rawData.statistics.orders.changePercent >= 0 ? 'increase' : 'decrease',
              id: 'orders-per',
            },
          },
          productsSoldToday: {
            value: rawData.statistics.productsSoldToday.value,
            id: rawData.statistics.productsSoldToday.id,
            change: {
              percent: rawData.statistics.productsSoldToday.changePercent,
              type: rawData.statistics.productsSoldToday.changePercent >= 0 ? 'increase' : 'decrease',
              id: 'products-sold-today-per',
            },
          },
          websiteVisitorsToday: {
            value: rawData.statistics.websiteVisitorsToday.value,
            id: rawData.statistics.websiteVisitorsToday.id,
            change: {
              percent: rawData.statistics.websiteVisitorsToday.changePercent,
              type: rawData.statistics.websiteVisitorsToday.changePercent >= 0 ? 'increase' : 'decrease',
              id: 'website-visitors-today-per',
            },
          },
          ordersSummary: {
            totalAmountId: 'total-amount-orders',
            totalAmount: {
              value: 3600, // Вы можете динамически рассчитывать сумму заказов
              currency: '€',
            },
            moreOrders: '26+', // Динамически рассчитывайте, если нужно
            moreOrdersId: 'more-orders',
          },
          // Добавление раздела Income
          income: {
            change: {
              percent: rawData.statistics.income.change.percent || 0, // Используйте данные из rawData, если они есть
              type: rawData.statistics.income.change.type || 'n/a',
            },
          },
        },
        ordersList: rawData.statistics.ordersDetail.map((order, index) => ({
          image: order.image,
          name: order.name,
          description: order.description,
          id: {
            name: generateUniqueId('name-cart', index),
            description: generateUniqueId('opisal-order-cart', index),
          },
        })),
        chartData: rawData.statistics.chartData.map((data) => ({
          day: data.day,
          bar: {
            height: `${Math.min((data.amount / 600) * 100, 100)}px`, // Максимальная высота 100px
            percent: Math.round((data.amount / 600) * 100),
            id: `bar-${data.day}`,
          },
          amount: {
            value: data.amount,
            currency: '€',
            id: `amount-${data.day}`,
          },
          change: {
            type: data.change?.type || 'n/a', // Безопасный доступ к 'type'
          },
        })),
        taskList: rawData.statistics.taskList.map((task, index) => ({
          title: task.title,
          priority: task.priority,
          id: {
            title: generateUniqueId('hdding-task-list', index),
            priority: generateUniqueId('bal-for-task-list', index),
          },
          href: task.href,
        })),
        lastActions: rawData.statistics.lastActions.map((action, index) => ({
          title: action.title,
          description: action.description,
          id: {
            title: generateUniqueId('hedding-last-actions', index),
            description: generateUniqueId('opisal-last-actions', index),
          },
        })),
        news: rawData.statistics.news.map((newsItem, index) => ({
          title: newsItem.title,
          date: newsItem.date,
          id: {
            title: generateUniqueId('hediing-post-news', index),
            date: generateUniqueId('opisal-post-news', index),
          },
        })),
        // Включение курсов валют из кеша
        exchangeRates: exchangeRatesCache,
        // Включение статистических данных из кеша
        exchangeStatistics: exchangeStatisticsCache,
      };

      // Отправка обновленных данных клиентам через Socket.IO
      io.emit('jsonDataUpdate', {
        statistics: processedData.statistics,
        ordersList: processedData.ordersList,
        chartData: processedData.chartData,
        taskList: processedData.taskList,
        lastActions: processedData.lastActions,
        news: processedData.news,
      });

      console.log('Данные из raw-data.json обновлены и отправлены клиентам.');
    } catch (error) {
      console.error('Ошибка обработки raw-data.json:', error.message);
    }
  });
};

// Отслеживание изменений в raw-data.json с использованием chokidar
const watchJSONFile = () => {
  const rawDataPath = path.join(__dirname, 'src', 'data', 'json', 'raw-data.json');

  const watcher = chokidar.watch(rawDataPath, {
    persistent: true,
    usePolling: true,
    interval: 1000,
  });

  watcher.on('change', (path) => {
    console.log(`${path} изменён. Обработка обновлений...`);
    sendUpdatesFromJSON();
  });

  watcher.on('error', (error) => {
    console.error('Ошибка при отслеживании файла:', error);
  });

  console.log(`Отслеживание изменений в файле: ${rawDataPath}`);
};

// Инициализация отслеживания JSON-файла
watchJSONFile();

// Эндпоинт для главной страницы
app.get('/', (req, res) => {
  const rawDataPath = path.join(__dirname, 'src', 'data', 'json', 'raw-data.json');

  try {
    const rawDataContent = fs.readFileSync(rawDataPath, 'utf-8');
    let rawData;
    try {
      rawData = JSON.parse(rawDataContent);
    } catch (parseError) {
      console.error('Ошибка парсинга raw-data.json:', parseError.message);
      res.status(500).send('Некорректные данные в raw-data.json');
      return;
    }

    // Проверка наличия необходимых данных
    if (!rawData.statistics) {
      throw new Error('Missing statistics data in raw-data.json');
    }

    // Проверка и добавление 'income', если его нет
    if (!rawData.statistics.income) {
      console.warn('Income data is missing in raw-data.json. Setting default values.');
      rawData.statistics.income = {
        change: {
          percent: 0,
          type: 'n/a',
        },
      };
    }

    // Обработка данных
    const processedData = {
      statistics: {
        todayRevenue: {
          value: rawData.statistics.todayRevenue.value,
          currency: rawData.statistics.todayRevenue.currency,
          id: rawData.statistics.todayRevenue.id,
          change: {
            percent: Math.round(
              ((rawData.statistics.todayRevenue.value - rawData.statistics.todayRevenue.previousValue) /
                rawData.statistics.todayRevenue.previousValue) *
                100
            ),
            type:
              rawData.statistics.todayRevenue.value >= rawData.statistics.todayRevenue.previousValue
                ? 'increase'
                : 'decrease',
          },
        },
        orders: {
          value: rawData.statistics.orders.value,
          id: rawData.statistics.orders.id,
          change: {
            percent: rawData.statistics.orders.changePercent,
            type: rawData.statistics.orders.changePercent >= 0 ? 'increase' : 'decrease',
            id: 'orders-per',
          },
        },
        productsSoldToday: {
          value: rawData.statistics.productsSoldToday.value,
          id: rawData.statistics.productsSoldToday.id,
          change: {
            percent: rawData.statistics.productsSoldToday.changePercent,
            type: rawData.statistics.productsSoldToday.changePercent >= 0 ? 'increase' : 'decrease',
            id: 'products-sold-today-per',
          },
        },
        websiteVisitorsToday: {
          value: rawData.statistics.websiteVisitorsToday.value,
          id: rawData.statistics.websiteVisitorsToday.id,
          change: {
            percent: rawData.statistics.websiteVisitorsToday.changePercent,
            type: rawData.statistics.websiteVisitorsToday.changePercent >= 0 ? 'increase' : 'decrease',
            id: 'website-visitors-today-per',
          },
        },
        ordersSummary: {
          totalAmountId: 'total-amount-orders',
          totalAmount: {
            value: 3600, // Вы можете динамически рассчитывать сумму заказов
            currency: '€',
          },
          moreOrders: '26+', // Динамически рассчитывайте, если нужно
          moreOrdersId: 'more-orders',
        },
        // Добавление раздела Income
        income: {
          change: {
            percent: rawData.statistics.income.change.percent || 0, // Используйте данные из rawData, если они есть
            type: rawData.statistics.income.change.type || 'n/a',
          },
        },
      },
      ordersList: rawData.statistics.ordersDetail.map((order, index) => ({
        image: order.image,
        name: order.name,
        description: order.description,
        id: {
          name: generateUniqueId('name-cart', index),
          description: generateUniqueId('opisal-order-cart', index),
        },
      })),
      chartData: rawData.statistics.chartData.map((data) => ({
        day: data.day,
        bar: {
          height: `${Math.min((data.amount / 600) * 100, 100)}px`, // Максимальная высота 100px
          percent: Math.round((data.amount / 600) * 100),
          id: `bar-${data.day}`,
        },
        amount: {
          value: data.amount,
          currency: '€',
          id: `amount-${data.day}`,
        },
        change: {
          type: data.change?.type || 'n/a', // Безопасный доступ к 'type'
        },
      })),
      taskList: rawData.statistics.taskList.map((task, index) => ({
        title: task.title,
        priority: task.priority,
        id: {
          title: generateUniqueId('hdding-task-list', index),
          priority: generateUniqueId('bal-for-task-list', index),
        },
        href: task.href,
      })),
      lastActions: rawData.statistics.lastActions.map((action, index) => ({
        title: action.title,
        description: action.description,
        id: {
          title: generateUniqueId('hedding-last-actions', index),
          description: generateUniqueId('opisal-last-actions', index),
        },
      })),
      news: rawData.statistics.news.map((newsItem, index) => ({
        title: newsItem.title,
        date: newsItem.date,
        id: {
          title: generateUniqueId('hediing-post-news', index),
          date: generateUniqueId('opisal-post-news', index),
        },
      })),
      // Включение курсов валют из кеша
      exchangeRates: exchangeRatesCache,
      // Включение статистических данных из кеша
      exchangeStatistics: exchangeStatisticsCache,
    };

    // Логирование данных для отладки
    console.log('Processed Data:', JSON.stringify(processedData, null, 2));

    // Рендеринг шаблона с данными
    res.render('index', { data: processedData });
  } catch (error) {
    console.error('Ошибка обработки данных:', error.message);
    res.status(500).send('Ошибка обработки данных');
  }
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});