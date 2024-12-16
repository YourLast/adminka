document.addEventListener('DOMContentLoaded', async () => {
  // Массив стилей для динамической загрузки
  const styles = [
    '/src/css/main.css',
    '/src/css/fonts/font.css',
    '/src/css/components/header.css',
    '/src/css/components/footer.css',
    '/src/css/components/main-content.css'
  ];

  // Динамическое добавление стилей в head
  styles.forEach(href => {
    if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });

  // Функция для загрузки HTML и вставки в DOM
  const loadHTML = async (url, insertLocation) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}: ${response.statusText}`);

      const html = await response.text();
      const container = document.createElement('div');
      container.innerHTML = html;

      if (insertLocation === 'header') {
        document.body.insertBefore(container, document.body.firstChild);
      } else if (insertLocation === 'footer') {
        document.body.appendChild(container);
      }
    } catch (error) {
      console.error(`Error loading ${url}:`, error);
    }
  };

  // Загрузка хедера и футера
  await loadHTML('/src/views/header/header.html', 'header');
  await loadHTML('/src/views/footer/footer.html', 'footer');

  // Динамическая загрузка JS-файлов
  const loadScripts = async () => {
    const scripts = [
      '/src/js/enabling-search.js',
      '/src/js/footer-lang-stetings.js'
    ];

    try {
      for (const src of scripts) {
        if (!document.querySelector(`script[src="${src}"]`)) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
              console.log(`${src} загружен успешно`);
              resolve();
            };
            script.onerror = () => {
              console.error(`Ошибка загрузки ${src}`);
              reject(new Error(`Не удалось загрузить ${src}`));
            };
            document.head.appendChild(script);
          });
        }
      }
      console.log('Все скрипты загружены успешно');
    } catch (error) {
      console.error('Ошибка при загрузке скриптов:', error);
    }
  };

  await loadScripts();

  // Добавление класса активного меню на основе текущего пути
  const setActiveMenu = () => {
    const currentPage = window.location.pathname.split('/').pop(); // Имя текущего файла
    const menuLinks = document.querySelectorAll('.header__menu-link');

    // Объект для сопоставления страниц и их текстов
    const pages = {
      'product-management.html': 'Product management',
      'reports-analysis.html': 'Reports and analysis',
      'sales-orders.html': 'Sales and orders',
      'content-banners.html': 'Content and banners'
    };

    // Добавление класса active-header
    menuLinks.forEach(link => {
      if (link.textContent.trim() === pages[currentPage]) {
        link.classList.add('activite-header');
      } else {
        link.classList.remove('activite-header');
      }
    });
  };

  setActiveMenu(); // Устанавливаем активный пункт меню
});