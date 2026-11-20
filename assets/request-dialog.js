(() => {
  const common = [
    ['full-name', 'Full Name', 'input', 'type="text" autocomplete="name" maxlength="120" required'],
    ['email', 'Email Address', 'input', 'type="email" autocomplete="email" maxlength="254" required'],
    ['phone', 'Phone Number', 'input', 'type="tel" autocomplete="tel" inputmode="tel" pattern="[+]?[0-9](?:[0-9 .\\-]*[0-9])?" minlength="7" maxlength="22" required']
  ];

  const requests = {
    room: {
      title: 'Apply for This Room Category',
      submit: 'Submit Application',
      verified: 'Demo application validated',
      fields: [
        ['age', 'Age of Applicant', 'input', 'type="number" min="0" max="125" step="1" inputmode="numeric" required'],
        ['gender', 'Gender', 'select', 'required', ['Female', 'Male', 'Non-binary', 'Another gender', 'Prefer not to say']],
        ['room-category', 'Room Category', 'input', 'type="text" readonly'],
        ['address', 'Address', 'textarea', 'autocomplete="street-address" maxlength="500" required'],
        ['additional-information', 'Additional Information / Special Requirements', 'textarea', 'maxlength="1500"']
      ]
    },
    walkthrough: {
      title: 'Schedule the Campus Walkthrough',
      submit: 'Submit Request',
      verified: 'Demo booking request validated',
      fields: [
        ['visitors', 'Number of Visitors', 'input', 'type="number" min="1" step="1" inputmode="numeric" required'],
        ['visit-date', 'Preferred Visit Date', 'input', 'type="date" required'],
        ['visit-time', 'Preferred Visit Time (IST)', 'input', 'type="time" required'],
        ['purpose', 'Purpose of Visit', 'input', 'type="text" maxlength="240" required'],
        ['notes', 'Additional Notes / Special Requirements', 'textarea', 'maxlength="1500"']
      ]
    }
  };

  const dialog = document.createElement('dialog');
  dialog.className = 'request-dialog';
  dialog.setAttribute('aria-labelledby', 'request-dialog-title');
  dialog.setAttribute('aria-describedby', 'request-dialog-note');
  dialog.innerHTML = `
    <div class="request-dialog-panel">
      <button class="request-dialog-close" type="button" data-request-close aria-label="Close form">×</button>
      <h2 id="request-dialog-title" class="font-headline-lg text-headline-lg"></h2>
      <p id="request-dialog-note">Demo form. Entries stay in this popup and are cleared when you close or submit it.</p>
      <form method="dialog">
        <div class="request-dialog-fields"></div>
        <div class="request-dialog-actions">
          <button type="button" data-request-close>Cancel</button>
          <button class="request-dialog-primary" type="submit"></button>
        </div>
      </form>
      <div class="request-dialog-result" hidden>
        <h3 tabindex="-1"></h3>
        <p>No details were sent or saved. No application or booking was created.</p>
        <div class="request-dialog-actions"><button type="button" class="request-dialog-primary" data-request-close>Done</button></div>
      </div>
    </div>`;
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  const fields = dialog.querySelector('.request-dialog-fields');
  const result = dialog.querySelector('.request-dialog-result');
  const resultTitle = result.querySelector('h3');
  let request;
  let opener;

  function renderField([name, label, tag, attributes, options]) {
    const required = attributes.split(' ').includes('required');
    const marker = required ? ' <span aria-hidden="true">*</span>' : name === 'room-category' ? '' : ' <small>(optional)</small>';
    const opening = `<${tag} name="${name}" ${attributes}>`;
    let control = opening;
    if (tag === 'textarea') control += '</textarea>';
    if (tag === 'select') {
      control += '<option value="">Select an option</option>' + options.map(option => `<option>${option}</option>`).join('') + '</select>';
    }
    return `<label class="${tag === 'textarea' ? 'request-dialog-wide' : ''}"><span>${label}${marker}</span>${control}</label>`;
  }

  function visitClock() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts();
    const { year, month, day, hour, minute } = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
  }

  function validateVisitTime() {
    const date = form.elements['visit-date'];
    if (!date) return;
    const time = form.elements['visit-time'];
    const now = visitClock();
    date.min = now.date;
    time.setCustomValidity(date.value === now.date && time.value && time.value <= now.time ? 'Choose a future visit time in India Standard Time.' : '');
  }

  for (const button of document.querySelectorAll('[data-request-kind]')) {
    button.addEventListener('click', () => {
      request = requests[button.dataset.requestKind];
      opener = button;
      dialog.querySelector('h2').textContent = request.title;
      fields.innerHTML = [...common, ...request.fields].map(renderField).join('');
      const category = form.elements['room-category'];
      if (category) category.value = document.getElementById('modal-title').textContent.trim();
      validateVisitTime();
      form.querySelector('[type="submit"]').textContent = request.submit;
      result.hidden = true;
      form.hidden = false;
      dialog.showModal();
      form.elements['full-name'].focus();
    });
  }

  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-request-close]')) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') event.stopPropagation();
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    fields.replaceChildren();
    if (opener?.isConnected) opener.focus();
  });
  window.addEventListener('popstate', () => {
    if (dialog.open) dialog.close();
  });
  form.addEventListener('input', event => {
    event.target.setCustomValidity('');
    validateVisitTime();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const field of fields.querySelectorAll('[required]')) {
      if (['text', 'tel', 'textarea'].includes(field.type)) field.value = field.value.trim();
    }
    const phone = form.elements.phone;
    if (phone.value.replace(/\D/g, '').length < 7) phone.setCustomValidity('Enter a phone number with at least seven digits.');
    validateVisitTime();
    if (!form.reportValidity()) return;
    fields.replaceChildren();
    form.hidden = true;
    resultTitle.textContent = request.verified;
    result.hidden = false;
    resultTitle.focus();
  });
})();
