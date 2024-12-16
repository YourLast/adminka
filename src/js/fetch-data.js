let currentData = {};

// Функция слияния новых данных с текущими
function mergeData(newData, oldData) {
  return {
    statistics: {
      ...oldData.statistics,
      ...newData.statistics,
      // Если newData.statistics.taskList отсутствует, оставляем старую
      taskList: newData.statistics && newData.statistics.taskList ? 
                  newData.statistics.taskList : 
                  oldData.statistics ? oldData.statistics.taskList : [],
      ordersDetail: newData.statistics && newData.statistics.ordersDetail ?
                     newData.statistics.ordersDetail :
                     oldData.statistics ? oldData.statistics.ordersDetail : []
      // Аналогично для других полей
    },
    exchangeRates: newData.exchangeRates || oldData.exchangeRates,
    // И так далее для всех полей
  };
}

async function fetchDataAndUpdate() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);

    const newData = await response.json();

    // Сливаем новые данные со старыми
    currentData = mergeData(newData, currentData);

    // Теперь у нас есть currentData со всеми старыми и новыми данными
    // Просто вызываем функции обновления, используя currentData:
    if (currentData.exchangeRates) updateExchangeRates(currentData.exchangeRates);
    if (currentData.statistics) {
      updateStatistics(currentData.statistics);
      updateTaskList({ taskList: currentData.statistics.taskList });
      updateLatestActions(currentData.statistics.lastActions || []);
      updateNews(currentData.statistics.news || []);
      updateChartData(currentData.statistics.chartData || []);
    }

  } catch (error) {
    console.error('Ошибка при обновлении данных:', error);
    // Если ошибка, можно ничего не делать или оставить старые данные как есть
  }
}

// Начальная загрузка
fetchDataAndUpdate();
setInterval(fetchDataAndUpdate, 1000000);
