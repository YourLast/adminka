document.addEventListener('DOMContentLoaded', () => {
    const menuLinks = document.querySelectorAll('.header__menu-link'); // Находим все ссылки в меню
    const currentPage = window.location.pathname.split('/').pop(); // Получаем имя текущего файла страницы
  
    // Сопоставляем заголовки меню с именами файлов
    const pages = {
      'product-management.html': 'Product management',
      'reports-analysis.html': 'Reports and analysis',
      'sales-orders.html': 'Sales and orders',
      'content-banners.html': 'Content and banners'
    };
  
    // Проверяем каждую ссылку и добавляем класс активной
    menuLinks.forEach(link => {
      const linkText = link.textContent.trim(); // Получаем текст ссылки
      if (pages[currentPage] === linkText) {
        link.classList.add('activite-header'); // Добавляем класс активной ссылке
      } else {
        link.classList.remove('activite-header'); // Удаляем класс у неактивных ссылок
      }
    });
  });