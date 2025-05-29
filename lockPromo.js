/* lockPromo.js
   помечает «заблокированные» рецепты
   и отправляет пользователей по промо-ссылке
*/
(() => {
    const ENABLE_LOCK = true;
    const REDIRECT = 'https://redirect.appmetrica.yandex.com/serve/29332028361031991';
    if (!ENABLE_LOCK) return;
  
    const openRecipeFn = window.openRecipe;   // запоминаем оригиналлл
  
    /* true, если последние две цифры UID кратны 3 */
    const mustLock = uid => {
      const digits = uid.replace(/\D/g,'');
      const n = +digits.slice(-2 || undefined);
      return !Number.isNaN(n) && n % 4 === 0;
    };
  
    function applyLock() {
      document.querySelectorAll('#grid .card').forEach(card => {
        const uid = card.dataset.uid || '';
        if (mustLock(uid)) {
          card.classList.add('locked');
          card.onclick = () => window.open(REDIRECT, '_blank');
        } else {
          card.classList.remove('locked');
          card.onclick = () => openRecipeFn(uid);
        }
      });
    }
  
    /* первый вызов */
    document.addEventListener('DOMContentLoaded', () => setTimeout(applyLock, 0));
  
    /* перехватываем renderGrid для автоприменения после фильтров */
    if (typeof window.renderGrid === 'function') {
      const orig = window.renderGrid;
      window.renderGrid = function () {
        orig.apply(this, arguments);
        applyLock();
      };
    }
  })();
  