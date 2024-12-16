// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const chokidar = require('chokidar');

// Сервисы и утилиты
const { fetchExchangeRates } = require('./services/exchangeRates');
const { processRawData } = require('./services/processData');
const { generateUniqueId } = require('./utils/generateId');

const app = express();
const PORT = process.env.PORT || 3000;

// Создание HTTP-сервера
const server = http.createServer(app);

// Инициализация Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Замените на ваш домен для повышения безопасности
    methods: ["GET", "POST"],
  }
});

// Middleware
app.use(cors());
app.use(morgan('combined')); // Более информативный формат логов
app.use(helmet());

// Настройка шаблонизатора
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Обслуживание статических файлов
app.use('/src', express.static(path.join(__dirname, 'src')));

// Хранилища для данных
let exchangeRatesCache = {
  dollar: { value: 0 },
  euro: { value: 0 },
  ruble: { value: 0 },
};

let exchangeStatisticsCache = {};

// Функция для обновления данных о курсах валют
const updateAllExchangeData = async () => {
  try {
    const rates = await fetchExchangeRates();
    if (rates) {
      exchangeRatesCache = { ...exchangeRatesCache, ...rates };
      // Отправляем обновления клиентам
      for (const [key, data] of Object.entries(rates)) {
        io.emit('exchangeRatesUpdate', { currency: key, value: data.value });
      }
    }
    // Если появятся статистические данные, подключите их обновление здесь
    // await fetchExchangeStatistics();
  } catch (error) {
    console.error('Ошибка обновления курсов валют:', error.message);
  }
};

// Инициализировать данные при старте
updateAllExchangeData();

// Обновлять каждые 2 минуты
setInterval(updateAllExchangeData, 2 * 60 * 1000);

// При подключении нового клиента по WebSocket
io.on('connection', (socket) => {
  console.log('Новый клиент подключился:', socket.id);
  // Отправка текущих данных при подключении
  socket.emit('initialData', {
    exchangeRates: exchangeRatesCache,
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключился:', socket.id);
  });
});

// Отправка обновлений из JSON
const rawDataPath = path.join(__dirname, 'src', 'data', 'json', 'raw-data.json');

const sendUpdatesFromJSON = async () => {
  try {
    const rawData = await fs.readFile(rawDataPath, 'utf-8');
    const parsedData = JSON.parse(rawData);

    const processedData = processRawData(parsedData, exchangeRatesCache, exchangeStatisticsCache, generateUniqueId);

    // Отправляем обновлённые данные клиентам
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
    console.error('Ошибка при обновлении данных из JSON:', error.message);
  }
};

// Отслеживание изменений JSON файла
const watchJSONFile = () => {
  const watcher = chokidar.watch(rawDataPath, {
    persistent: true,
    usePolling: true,
    interval: 1000,
  });

  watcher.on('change', (changedPath) => {
    console.log(`${changedPath} изменён. Обработка обновлений...`);
    sendUpdatesFromJSON();
  });

  watcher.on('error', (error) => {
    console.error('Ошибка при отслеживании файла:', error);
  });

  console.log(`Отслеживание изменений в файле: ${rawDataPath}`);
};

// Инициализация отслеживания
watchJSONFile();

// Эндпоинт для главной страницы
app.get('/', async (req, res) => {
  try {
    const rawDataContent = await fs.readFile(rawDataPath, 'utf-8');
    const rawData = JSON.parse(rawDataContent);

    const processedData = processRawData(rawData, exchangeRatesCache, exchangeStatisticsCache, generateUniqueId);
    console.log('Processed Data:', JSON.stringify(processedData, null, 2));

    res.render('index', { data: processedData });
  } catch (error) {
    console.error('Ошибка обработки данных для главной страницы:', error.message);
    res.status(500).send('Ошибка обработки данных');
  }
});

require('dotenv').config();

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
