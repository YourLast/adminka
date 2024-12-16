// enabling-search.js

const headerRight = document.querySelector('.header__right');

document.addEventListener('click', (event) => {
  const searchContainer = document.querySelector('.header__search-container');
  const searchInput = document.querySelector('.header__search-input');

  // Проверяем, кликнули ли по кнопке поиска
  if (event.target.closest('.header__icon-btn--search')) {
    event.stopPropagation(); // Останавливаем всплытие события
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
      searchInput.focus(); // Фокус на поле ввода
    }
  } else if (!searchContainer.contains(event.target)) {
    // Если кликнули вне контейнера поиска, закрываем его
    searchContainer.classList.remove('active');
  }
});

// Закрываем поиск при нажатии Esc
document.addEventListener('keydown', (event) => {
  const searchContainer = document.querySelector('.header__search-container');
  if (event.key === 'Escape') {
    searchContainer.classList.remove('active');
  }
});