/* ---------- 0.  Константы API ---------- */
const API = 'https://ap.demiand.ru/demiand-mobile/telegram-bot';
const URL_LIST   = API + '/get-recipes';
const URL_DETAIL = uid => API + '/get-recipe/' + uid;

/* ---------- 1.  Глобальные переменные ---------- */
let recipes = [];           // карточки
let filters = ['Все'];      // «Все» + уникальные категории
let currentFilter = 'Все';

/* ---------- 2.  DOM ---------- */
const filtersEl    = document.getElementById('filters');
const gridEl       = document.getElementById('grid');
const modalEl      = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
/* --- ✱  ОБНОВЛЁННЫЙ closeBtn  (не закрывает мини-ап) --- */
document.querySelector('.closeBtn').onclick = () =>
  document.getElementById('modal').classList.remove('open');


/* ---------- 3.  Загрузка списка ---------- */
fetch(URL_LIST)
  .then(r => r.json())
  .then(res => {
    if (res.result !== 1 || !res.data?.items) throw 'bad API list';
    recipes = res.data.items.map(it => ({
      uid:   it.uid,
      title: it.name,
      time:  `${it.cookingTime} мин`,
      photo: it.previewPhotoUrl,
      cats:  it.mainIngredients?.map(m => m.name) || ['Без категории']
    }));

    // собираем уникальные категории
    filters = ['Все', ...new Set(recipes.flatMap(r => r.cats))];

    renderFilters();
    renderGrid();
  })
  .catch(err => {
    console.error(err);
    gridEl.innerHTML = '<p style="padding:20px;color:var(--txt-sec)">Не удалось загрузить рецепты 😔</p>';
  });

/* ---------- 4.  Фильтры ---------- */
function renderFilters() {
  filtersEl.innerHTML = '';
  filters.forEach(cat => {
    const b = document.createElement('button');
    b.textContent = cat;
    if (cat === currentFilter) b.classList.add('active');
    b.onclick = () => { currentFilter = cat; updateFilterUI(); renderGrid(); };
    filtersEl.appendChild(b);
  });
}
function updateFilterUI() {
  [...filtersEl.children].forEach(b =>
    b.classList.toggle('active', b.textContent === currentFilter)
  );
}

/* ---------- 5.  Сетка карточек ---------- */
function renderGrid() {
  gridEl.innerHTML = '';
  recipes
    .filter(r => currentFilter === 'Все' || r.cats.includes(currentFilter))
    .forEach(r => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.uid = r.uid;          // ← чтобы внешний модуль знал UID
      card.innerHTML = `
        <img src="${r.photo}" alt="">
        <h4>${r.title}</h4>
        <div class="meta">
          <svg viewBox="0 0 24 24"><path d="M12 7a1 1 0 011 1v4l2.5 1.5a1 1 0 11-1 1.732L11 13V8a1 1 0 011-1z"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-18C7.589 4 4 7.589 4 12s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8z"/></svg>
          ${r.time}
        </div>`;
      card.onclick = () => openRecipe(r.uid);
      gridEl.appendChild(card);
    });
}


/* ---------- 6.  Детальный рецепт ---------- */
function openRecipe(uid){
  modalContent.innerHTML='<p style="padding:20px;color:var(--txt-sec)">Загружаем…</p>';
  modalEl.classList.add('open');
  Telegram.WebApp.expand && Telegram.WebApp.expand();

  fetch(URL_DETAIL(uid))
    .then(r=>r.json())
    .then(res=>{
      if(res.result!==1||!res.data)throw'bad detail';
      renderRecipe(res.data);
    })
    .catch(e=>{
      console.error(e);
      modalContent.innerHTML='<p style="padding:20px;color:var(--txt-sec)">Не удалось загрузить рецепт 😔</p>';
    });
}


/* --- ✱  ОБНОВЛЁННЫЙ  renderRecipe  --- */
function renderRecipe(d){
  const clock = `<svg viewBox="0 0 24 24"><path d="M12 7a1 1 0 011 1v4l2.5 1.5a1 1 0 11-1 1.732L11 13V8a1 1 0 011-1z"/><path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm0-18C7.59 4 4 7.59 4 12s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z"/></svg>`;

  /* нутри */
  const nutri = `
    <div class="tile nutri">
      <div class="nutri-item"><strong>${d.calories}</strong><span>ккал</span></div>
      <div class="nutri-item"><strong>${d.proteins}</strong><span>белки</span></div>
      <div class="nutri-item"><strong>${d.fats}</strong><span>жиры</span></div>
      <div class="nutri-item"><strong>${d.carbohydrates}</strong><span>углев.</span></div>
    </div>`;

  /* ингредиенты */
  const ing = d.ingredients?.length ? `
    <div class="tile"><h3>Ингредиенты</h3>
      <ul class="ing">
        ${d.ingredients.map(i=>`
          <li><span>${i.ingredient.name}</span><span>${i.amount} ${i.unit.name}</span></li>`).join('')}
      </ul>
    </div>` : '';

  /* шаги */
  const steps = d.steps?.map(s=>`
    <div class="step-card">
      ${s.photoUrl?`<img src="${s.photoUrl}">`:''}
      <p><b>Шаг ${s.number}.</b> ${s.text}</p>
    </div>`).join('') ?? '';

  /* советы */
  const advises = d.advises?.length ? `
    <div class="tile"><h3>Советы повара</h3>
      <ul style="list-style:disc inside;font-size:16px;line-height:1.6;color:var(--txt)">
        ${d.advises.map(a=>`<li>${a}</li>`).join('')}
      </ul>
    </div>` : '';

  /* видео */
  const video = d.videoUrl ? `
    <div class="tile" style="padding:0">
      <h3 style="padding:12px 16px 0">Видеорецепт</h3>
      <video controls src="${d.videoUrl}"></video>
    </div>` : '';

  /* категории-бейджи */
  const cats = d.mainIngredients?.map(m=>`<span class="badge">${m.name}</span>`).join('');

  /* promo button */
  const promo = `
    <div class="download-wrap">
      <a href="https://redirect.appmetrica.yandex.com/serve/29332028361031991"
         target="_blank" class="download-btn">
        111Полная версия&nbsp;рецепта в&nbsp;приложении&nbsp;↗︎
      </a>
    </div>`;

  modalContent.innerHTML = `
    <div class="hero"><img src="${d.photoUrl || d.previewPhotoUrl}" alt=""></div>

    <div class="tile title-tile">
      <h1>${d.name}</h1>
      <div class="hero-meta">${clock} ${d.cookingTime} мин</div>
    </div>

    ${nutri}
    ${cats ? `<div class="badge-row">${cats}</div>` : ''}
    ${d.text ? `<div class="tile desc">${d.text}</div>` : ''}

    ${promo}          <!-- кнопка -->

    ${ing}
    ${steps}
    ${advises}
    ${video}
  `;
}



/* --- ✱  СВЕТЛАЯ / ТЁМНАЯ ТЕМА  --- */
(function applyTheme(){
  const set = cs => {
    document.documentElement.classList.toggle('light', cs==='light');
  };
  set(Telegram.WebApp.colorScheme);              // начальная
  Telegram.WebApp.onEvent('themeChanged', () =>  // переключение “на лету”
    set(Telegram.WebApp.colorScheme)
  );
})();

/* 7: Telegram.WebApp.ready — без изменений */
Telegram.WebApp.ready && Telegram.WebApp.ready();