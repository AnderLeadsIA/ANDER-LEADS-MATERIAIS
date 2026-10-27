const filters = [...document.querySelectorAll('[data-filter]')];
const search = document.querySelector('#search');
const cards = [...document.querySelectorAll('.card')];
let category = 'Todos';
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function update() {
  const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
  let count = 0;
  for (const card of cards) {
    const matches = (category === 'Todos' || card.dataset.category === category) && terms.every(term => normalize(card.dataset.search).includes(term));
    card.hidden = !matches;
    if (matches) count++;
  }
  document.querySelector('#result-count').textContent = `${count} ${count === 1 ? 'material encontrado' : 'materiais encontrados'}`;
  document.querySelector('#empty').hidden = count !== 0;
  for (const button of filters) {
    const active = button.dataset.filter === category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}
filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; update(); }));
search?.addEventListener('input', update);
document.querySelector('#clear-search')?.addEventListener('click', () => { category = 'Todos'; search.value = ''; update(); search.focus(); });
