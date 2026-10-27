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
  const format = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  const update = () => {
    const days = input.valueAsNumber;
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      error.textContent = 'Enter a whole number from 1 to 365 days.';
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    const restDays = Math.floor(days / 5);
    const trainingDays = days - restDays;
    const label = days + (days === 1 ? ' day' : ' days');
    heading.textContent = 'Amount for ' + label;
    caption.textContent = 'Groceries for ' + label;
    summary.textContent = label + ' · ' + trainingDays + ' training ' + (trainingDays === 1 ? 'day' : 'days') + ' · ' + restDays + ' rest ' + (restDays === 1 ? 'day' : 'days') + '. Optional frittatas and salmon are excluded; see meal substitutions above.';
    rows.forEach(row => {
      const quantity = quantities[row.dataset.foodId];
      const cell = row.querySelector('.grocery-amount');
      cell.dataset.label = label;
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
  };
  form.noValidate = true;
  form.addEventListener('submit', event => { event.preventDefault(); update(); });
  input.addEventListener('input', update);
  update();
})();
