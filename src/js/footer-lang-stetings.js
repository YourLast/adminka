const langBtn = document.getElementById('langBtn');
const langList = document.getElementById('langList');

langBtn.addEventListener('click', () => {
  const isExpanded = langBtn.getAttribute('aria-expanded') === 'true';
  langBtn.setAttribute('aria-expanded', !isExpanded);
  langList.classList.toggle('active', !isExpanded);
});

langList.addEventListener('click', (e) => {
  if (e.target.classList.contains('footer__lang-option')) {
    const selectedLang = e.target.getAttribute('data-lang');
    langBtn.querySelector('.footer__lang-text').firstChild.nodeValue = selectedLang.toUpperCase();
    langBtn.setAttribute('aria-expanded', false);
    langList.classList.remove('active');
  }
});