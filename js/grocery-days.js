(() => {
  const source = document.getElementById('grocery-quantity-data');
  if (!source) return;
  const quantities = JSON.parse(source.textContent);
  const form = document.querySelector('.grocery-days-form');
  const input = document.getElementById('grocery-days');
  const error = document.getElementById('grocery-days-error');
  const summary = document.querySelector('.grocery-days-summary');
  const heading = document.querySelector('.grocery-total-heading');
  const caption = document.querySelector('.grocery-table caption');
  const rows = [...document.querySelectorAll('.grocery-row')];
  // Keep refrigerated and frozen sections near the end of the shopping route.
  const sectionOrder = ['Produce', 'Pantry', 'Supplements', 'Beverages', 'Bakery', 'Meat & Seafood', 'Dairy & Eggs', 'Frozen'];
  const table = document.querySelector('.grocery-table');
  const originalBody = table.querySelector('tbody');
  const grouped = new Map();
  rows.forEach(row => {
    const name = row.querySelector('.grocery-section')?.textContent.trim() || 'Other';
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name).push(row);
  });
  const rank = name => sectionOrder.includes(name) ? sectionOrder.indexOf(name) : sectionOrder.length;
  const groups = [...grouped.entries()].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b)).map(([name, items]) => {
    const body = document.createElement('tbody');
    body.className = 'grocery-section-group';
    body.setAttribute('role', 'rowgroup');
    const header = document.createElement('tr');
    header.className = 'grocery-section-heading';
    header.setAttribute('role', 'row');
    const title = document.createElement('th');
    title.colSpan = table.querySelectorAll('thead th').length;
    title.scope = 'rowgroup';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'grocery-section-toggle';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-controls', items.map(row => {
      row.id = 'grocery-row-' + row.dataset.foodId;
      return row.id;
    }).join(' '));
    const icon = document.createElement('span');
    icon.className = 'grocery-section-chevron';
    icon.setAttribute('aria-hidden', 'true');
    toggle.append(icon, document.createTextNode(name));
    toggle.addEventListener('click', () => {
      const collapsed = body.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });
    title.append(toggle);
    header.append(title);
    body.append(header, ...items);
    table.append(body);
    return { body, items };
  });
  originalBody.remove();
  const alternativeButton = document.getElementById('toggle-alternatives');
  const restButton = document.getElementById('toggle-rest-meals');
  let hideAlternatives = false;
  let hideRest = false;
  const meals = [...document.querySelectorAll('.mealplan_ingredients')];
  const format = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  const update = () => {
    meals.forEach(meal => {
      meal.hidden = (hideAlternatives && meal.dataset.alternative === 'true') ||
        (hideRest && meal.dataset.restOnly === 'true');
    });
    const days = input.valueAsNumber;
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      error.textContent = 'Enter a whole number from 1 to 365 days.';
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    const scheduledRestDays = Math.floor(days / 5);
    const trainingDays = days - scheduledRestDays;
    const restDays = hideRest ? 0 : scheduledRestDays;
    const label = days + (days === 1 ? ' day' : ' days');
    heading.textContent = 'Amount for ' + label + (hideRest ? ' (training only)' : '');
    caption.textContent = 'Groceries for ' + label + (hideRest ? ', excluding rest days' : '');
    summary.textContent = label + ' · ' + trainingDays + ' training ' + (trainingDays === 1 ? 'day' : 'days') + ' · ' + restDays + ' rest ' + (restDays === 1 ? 'day' : 'days') + '. ' + (hideRest ? 'Rest-day meals and quantities excluded. ' : '') + (hideAlternatives ? 'Alternatives hidden; totals use egg breakfasts and turkey dinners.' : 'Totals use egg breakfasts and turkey dinners. Optional swaps are listed separately, not added to totals.');
    rows.forEach(row => {
      const quantity = quantities[row.dataset.foodId];
      const cell = row.querySelector('.grocery-amount');
      cell.dataset.label = label;
      if (quantity && quantity.alternative) {
        row.hidden = hideAlternatives;
        cell.textContent = quantity.optional_amount;
        return;
      }
      if (!quantity || quantity.training === null || quantity.rest === null) {
        row.hidden = false;
        cell.textContent = 'As needed (amount not specified)';
        return;
      }
      const total = quantity.training * trainingDays + quantity.rest * restDays;
      row.hidden = total === 0;
      const unit = total === 1 && quantity.singular_unit ? quantity.singular_unit : quantity.unit;
      cell.textContent = format.format(total) + ' ' + unit;
    });
    groups.forEach(({ body, items }) => { body.hidden = items.every(row => row.hidden); });
  };
  alternativeButton.addEventListener('click', () => {
    hideAlternatives = !hideAlternatives;
    alternativeButton.setAttribute('aria-pressed', String(hideAlternatives));
    alternativeButton.querySelector('.meal-filter-label').textContent = hideAlternatives ? 'Show alternative meals' : 'Hide alternative meals';
    alternativeButton.querySelector('.meal-filter-icon').textContent = hideAlternatives ? '+' : '×';
    update();
  });
  restButton.addEventListener('click', () => {
    hideRest = !hideRest;
    restButton.setAttribute('aria-pressed', String(hideRest));
    restButton.querySelector('.meal-filter-label').textContent = hideRest ? 'Show rest-day meals' : 'Hide rest-day meals';
    restButton.querySelector('.meal-filter-icon').textContent = hideRest ? '+' : '×';
    update();
  });
  form.noValidate = true;
  form.addEventListener('submit', event => { event.preventDefault(); update(); });
  input.addEventListener('input', update);
  update();
})();
