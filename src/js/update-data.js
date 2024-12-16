
    const socket = io();

    // Функция обновления курсов валют
    function updateExchangeRates(rates) {
        // rates = { dollar: {value: ...}, euro: {value: ...}, ruble: {value: ...} }
        if (rates.dollar && document.getElementById('dollar-value')) {
            document.getElementById('dollar-value').textContent = rates.dollar.value.toFixed(2);
        }
        if (rates.euro && document.getElementById('euro-value')) {
            document.getElementById('euro-value').textContent = rates.euro.value.toFixed(2);
        }
        if (rates.ruble && document.getElementById('ruble-value')) {
            document.getElementById('ruble-value').textContent = rates.ruble.value.toFixed(3);
        }
    }

    // Функция обновления статистических данных по валютам (пример)
    function updateExchangeStatistics(statistics) {
        // Если нужна какая-то логика для статистики, добавьте её тут.
        // При необходимости обновите элементы страницы.
    }

    // Обновление блоков статистики (Revenue, Orders и т.д.)
    function updateStatistics(statistics) {
        if (statistics.todayRevenue) {
            document.getElementById('today-revenue').textContent = statistics.todayRevenue.value + statistics.todayRevenue.currency;
            const revenueChange = document.getElementById('today-revenue-per');
            revenueChange.textContent = statistics.todayRevenue.change.percent + '%';
            revenueChange.className = 'dashboard-card-change ' + (statistics.todayRevenue.change.type === 'increase' ? 'positive' : 'negative');
        }

        if (statistics.orders) {
            document.getElementById('orders').textContent = statistics.orders.value;
            const ordersChange = document.getElementById('orders-per');
            ordersChange.textContent = statistics.orders.change.percent + '%';
            ordersChange.className = 'dashboard-card-change ' + (statistics.orders.change.type === 'increase' ? 'positive' : 'negative');
        }

        if (statistics.productsSoldToday) {
            document.getElementById('products-sold-today').textContent = statistics.productsSoldToday.value;
            const productsChange = document.getElementById('products-sold-today-per');
            productsChange.textContent = statistics.productsSoldToday.change.percent + '%';
            productsChange.className = 'dashboard-card-change ' + (statistics.productsSoldToday.change.type === 'increase' ? 'positive' : 'negative');
        }

        if (statistics.websiteVisitorsToday) {
            document.getElementById('website-visitors-today').textContent = statistics.websiteVisitorsToday.value;
            const visitorsChange = document.getElementById('website-visitors-today-per');
            visitorsChange.textContent = statistics.websiteVisitorsToday.change.percent + '%';
            visitorsChange.className = 'dashboard-card-change ' + (statistics.websiteVisitorsToday.change.type === 'increase' ? 'positive' : 'negative');
        }

        if (statistics.ordersSummary) {
            updateOrdersSummary(statistics.ordersSummary);
        }

        if (statistics.income) {
            const incomeChange = document.getElementById('income-change');
            incomeChange.textContent = statistics.income.change.percent + '%';
            incomeChange.className = 'dashboard-card-change ' + (statistics.income.change.type === 'increase' ? 'positive' : 'negative');
        }
    }

    function updateOrdersSummary(data) {
        document.getElementById('total-amount-orders').textContent = data.totalAmount.value + data.totalAmount.currency;
        document.getElementById('more-orders').textContent = 'More ' + data.moreOrders;
    }

    function updateTaskList(data) {
        const taskContainer = document.getElementById('contener-short-task-list');
        if (!taskContainer) return;
        taskContainer.innerHTML = '';
        data.taskList.slice(0,4).forEach(task => {
            const taskElement = document.createElement('a');
            taskElement.href = task.href;
            taskElement.className = 'mian-simple-task-list';

            const title = document.createElement('h3');
            title.id = task.id.title;
            title.textContent = task.title;

            const priority = document.createElement('span');
            priority.className = `bal-task-list ${task.priority}`;
            priority.id = task.id.priority;

            taskElement.appendChild(title);
            taskElement.appendChild(priority);

            taskContainer.appendChild(taskElement);
        });
    }

    function updateLatestActions(actions) {
        const actionsContainer = document.getElementById('last-actions-contener');
        if (!actionsContainer) return;
        actionsContainer.innerHTML = '';
        actions.forEach(action => {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'contener-last-ations-text';

            const title = document.createElement('h4');
            title.className = 'contener-last-ations-text-h';
            title.id = action.id.title;
            title.textContent = action.title;

            const description = document.createElement('p');
            description.className = 'contener-last-ations-text-p';
            description.id = action.id.description;
            description.textContent = action.description;

            actionDiv.appendChild(title);
            actionDiv.appendChild(description);
            actionsContainer.appendChild(actionDiv);
        });
    }

    function updateNews(news) {
        const newsContainer = document.querySelector('.contener-news-adminka');
        if (!newsContainer) return;
        newsContainer.innerHTML = '';
        news.forEach(newsItem => {
            const newsDiv = document.createElement('div');
            newsDiv.className = 'contenr-news-simple inter';

            const title = document.createElement('h3');
            title.id = newsItem.id.title;
            title.textContent = newsItem.title;

            const date = document.createElement('h3');
            date.id = newsItem.id.date;
            date.textContent = newsItem.date;

            newsDiv.appendChild(title);
            newsDiv.appendChild(date);
            newsContainer.appendChild(newsDiv);
        });
    }

    function updateChartData(chartData) {
    const incomeChart = document.getElementById('income-chart');
    if (!incomeChart) return; // Если контейнер не найден, прерываем функцию

    // Очистка текущего графика
    incomeChart.innerHTML = '';

    // Перебираем массив данных и создаём элементы графика заново
    chartData.forEach(dayData => {
        // Создаём контейнер для столбца
        const chartColumn = document.createElement('div');
        chartColumn.className = 'chart-column';
        chartColumn.id = `chart-day-${dayData.day}`;

        // Создаём элемент столбца бара
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.id = dayData.bar.id;
        bar.style.height = dayData.bar.height;

        // Создаём элемент для дня
        const daySpan = document.createElement('span');
        daySpan.className = `dashboard-card-change ${dayData.change.type === 'increase' ? 'positive' : 'negative'} day`;
        daySpan.id = `day-${dayData.day}`;
        daySpan.textContent = dayData.day;

        // Создаём элемент для суммы
        const amountSpan = document.createElement('span');
        amountSpan.className = 'dashboard-card-change amount';
        amountSpan.id = `amount-${dayData.day}`;
        amountSpan.textContent = `${dayData.amount.value}${dayData.amount.currency}`;

        // Добавляем элементы в столбец
        chartColumn.appendChild(bar);
        chartColumn.appendChild(daySpan);
        chartColumn.appendChild(amountSpan);

        // Добавляем столбец в контейнер графика
        incomeChart.appendChild(chartColumn);
    });
}


    // Обработка начальных данных от сервера
    socket.on('initialData', (data) => {
        if (data.exchangeRates) {
            updateExchangeRates(data.exchangeRates);
        }
        if (data.exchangeStatistics) {
            updateExchangeStatistics(data.exchangeStatistics);
        }
        if (data.statistics) {
            updateStatistics(data.statistics);
        }
        if (data.ordersList) {
            updateTaskList({ taskList: data.ordersList });
        }
        if (data.lastActions) {
            updateLatestActions(data.lastActions);
        }
        if (data.news) {
            updateNews(data.news);
        }
        if (data.chartData) {
            updateChartData(data.chartData);
        }
    });

    // Обработка обновлений данных (без перезагрузки)
    socket.on('jsonDataUpdate', (data) => {
        if (data.exchangeRates) {
            updateExchangeRates(data.exchangeRates);
        }
        if (data.exchangeStatistics) {
            updateExchangeStatistics(data.exchangeStatistics);
        }
        if (data.statistics) {
            updateStatistics(data.statistics);
        }
        if (data.ordersList) {
            updateTaskList({ taskList: data.ordersList });
        }
        if (data.lastActions) {
            updateLatestActions(data.lastActions);
        }
        if (data.news) {
            updateNews(data.news);
        }
        if (data.chartData) {
            updateChartData(data.chartData);
        }
    });
