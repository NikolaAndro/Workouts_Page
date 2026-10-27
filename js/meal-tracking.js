(() => {
  const checkboxes = [...document.querySelectorAll('.meal-eaten-checkbox')];
  if (!checkboxes.length) return;
  const key = 'meal-tracking:' + window.location.pathname;
  const today = () => {
    const date = new Date();
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
  };
  let day = today();
  let eaten = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && saved.day === day && Array.isArray(saved.eaten)) eaten = saved.eaten;
  } catch (_) { /* Tracking still works when storage is unavailable. */ }
  const render = () => checkboxes.forEach(input => { input.checked = eaten.includes(input.value); });
  const resetForNewDay = () => {
    if (today() === day) return;
    day = today();
    eaten = [];
    render();
  };
  render();
  checkboxes.forEach(input => input.addEventListener('change', () => {
    const checked = input.checked;
    resetForNewDay();
    eaten = eaten.filter(id => id !== input.value);
    if (checked) eaten.push(input.value);
    render();
    try { localStorage.setItem(key, JSON.stringify({ day, eaten })); } catch (_) {}
  }));
  window.addEventListener('focus', resetForNewDay);
  document.addEventListener('visibilitychange', resetForNewDay);
  setInterval(resetForNewDay, 60000);
})();
