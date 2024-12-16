// services/processData.js
module.exports.processRawData = function(rawData, exchangeRatesCache, exchangeStatisticsCache, generateUniqueId) {
    if (!rawData.statistics) {
      throw new Error('Отсутствуют данные statistics в raw-data.json');
    }
  
    if (!rawData.statistics.income) {
      rawData.statistics.income = {
        change: {
          percent: 0,
          type: 'n/a',
        },
      };
    }
  
    const processedData = {
      statistics: {
        todayRevenue: {
          value: rawData.statistics.todayRevenue.value,
          currency: rawData.statistics.todayRevenue.currency,
          id: rawData.statistics.todayRevenue.id,
          change: {
            percent: Math.round(
              ((rawData.statistics.todayRevenue.value - rawData.statistics.todayRevenue.previousValue) /
                rawData.statistics.todayRevenue.previousValue) * 100
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
            value: 3600,
            currency: '€',
          },
          moreOrders: '26+',
          moreOrdersId: 'more-orders',
        },
        income: {
          change: {
            percent: rawData.statistics.income.change.percent || 0,
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
          height: `${Math.min((data.amount / 600) * 100, 100)}px`,
          percent: Math.round((data.amount / 600) * 100),
          id: `bar-${data.day}`,
        },
        amount: {
          value: data.amount,
          currency: '€',
          id: `amount-${data.day}`,
        },
        change: {
          type: data.change?.type || 'n/a',
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
      exchangeRates: exchangeRatesCache,
      exchangeStatistics: exchangeStatisticsCache,
    };
  
    return processedData;
  };
  