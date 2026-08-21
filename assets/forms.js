window.leadersFirstPage = {
  landingVariant: window.leadersFirstLandingVariant || document.documentElement.getAttribute('data-landing-variant') || 'main',
  defaultService: document.documentElement.getAttribute('data-default-service') || ''
};

(function () {
  var HUBSPOT_PORTAL_ID = '148956933';
  var HUBSPOT_FORM_ID = 'a49159d0-8ceb-4f0a-a73a-b64b8f273d07';
  var isRussian = document.documentElement.lang === 'ru';
  var modal = document.getElementById('guide-form');
  if (!modal) return;
  var form = modal.querySelector('.guide-form');
  var formStep = modal.querySelector('[data-guide-step="form"]');
  var successStep = modal.querySelector('[data-guide-step="success"]');
  var successTitle = modal.querySelector('[data-guide-success-title]');
  var successCopy = modal.querySelector('[data-guide-success-copy]');
  var emailFields = modal.querySelector('[data-guide-email-fields]');
  var nameInput = modal.querySelector('[name="name"]');
  var emailInput = modal.querySelector('[name="email"]');
  var consentInput = modal.querySelector('[name="newsletter_consent"]');
  var emailButton = modal.querySelector('[data-guide-email-submit]');
  var telegramButton = modal.querySelector('[data-guide-telegram-submit]');
  var emailButtonLabel = emailButton.innerHTML;
  var errorMessage = document.createElement('p');
  errorMessage.className = 'form-status form-status--error';
  errorMessage.setAttribute('role', 'alert');
  errorMessage.hidden = true;
  form.insertBefore(errorMessage, emailButton);
  var lastFocus = null;
  var guideSubmitTracked = false;
  var isSubmitting = false;

  function setField(name, value) {
    var field = form.querySelector('[name="' + name + '"]');
    if (field) field.value = value || '';
  }

  function selectedChannel() {
    var selected = form.querySelector('[name="delivery_channel"]:checked');
    return selected ? selected.value : '';
  }

  function updateChannel() {
    var channel = selectedChannel();
    var emailSelected = channel === 'email';
    emailFields.hidden = !emailSelected;
    emailButton.hidden = !emailSelected;
    telegramButton.hidden = channel !== 'telegram';
    nameInput.required = emailSelected;
    emailInput.required = emailSelected;
    consentInput.required = emailSelected;
  }

  function setLoading(loading) {
    isSubmitting = loading;
    emailButton.disabled = loading;
    emailButton.innerHTML = loading ? (isRussian ? 'Отправляем гид…' : 'Sending your guide…') : emailButtonLabel;
  }

  function getCookie(name) {
    return document.cookie.split('; ').reduce(function (value, item) {
      var parts = item.split('=');
      return parts.shift() === name ? decodeURIComponent(parts.join('=')) : value;
    }, '');
  }

  function firstName(fullName) {
    return String(fullName || '').trim().split(/\s+/)[0] || '';
  }

  function saveGuideLead(payload) {
    var fields = [
      { name: 'email', value: payload.email },
      { name: 'firstname', value: firstName(payload.name) },
      { name: 'lf_full_name', value: payload.name },
      { name: 'lf_lead_intent', value: 'free_guide' },
      { name: 'lf_lead_source', value: payload.lead_source || 'free_guide_block' },
      { name: 'lf_lead_cta', value: payload.lead_cta || 'Get the Career Guide' },
      { name: 'lf_delivery_channel', value: 'email' },
      { name: 'landing_variant', value: payload.landing_variant || window.leadersFirstPage.landingVariant },
      { name: 'lf_utm_source', value: payload.utm_source || '' },
      { name: 'lf_utm_medium', value: payload.utm_medium || '' },
      { name: 'lf_utm_campaign', value: payload.utm_campaign || '' }
    ];
    var context = { pageUri: payload.page_url, pageName: document.title };
    var hutk = getCookie('hubspotutk');
    if (hutk) context.hutk = hutk;
    return fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + HUBSPOT_PORTAL_ID + '/' + HUBSPOT_FORM_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submittedAt: Date.now(),
        fields: fields,
        context: context,
        legalConsentOptions: {
          consent: {
            consentToProcess: true,
            text: isRussian ? 'Я согласен(-на) на обработку моих данных Leaders First, чтобы получить гид.' : 'I agree to allow Leaders First to store and process my personal data and send the requested guide.',
            communications: [{
              value: true,
              subscriptionTypeId: 3194690085,
              text: isRussian ? 'Я согласен(-на) получить гид и письма от Leaders First. Отписаться можно в любой момент.' : 'I agree to receive the guide and Leaders First career emails. I can unsubscribe at any time.'
            }]
          }
        }
      })
    }).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (body) {
          throw new Error('HubSpot guide submission failed (' + response.status + '): ' + body);
        });
      }
      return response.text().then(function (body) { return body ? JSON.parse(body) : {}; });
    });
  }

  function captureContext(trigger) {
    setField('form_name', 'career_direction_guide');
    setField('lead_intent', 'free_guide');
    setField('lead_source', trigger && trigger.dataset.leadSource || 'free_guide_block');
    setField('lead_cta', trigger && trigger.dataset.leadCta || (isRussian ? 'Получить гид' : 'Get the Career Guide'));
    setField('requested_asset', 'career_direction_guide');
    setField('automation_action', 'send_career_direction_guide');
    setField('landing_variant', window.leadersFirstPage.landingVariant);
    setField('page_url', window.location.href);
    setField('page_referrer', document.referrer);
    setField('guide_opened_at', new Date().toISOString());
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (name) {
      var value = window.leadersFirstAttribution ? window.leadersFirstAttribution.get(name) : '';
      setField(name, value);
    });
  }

  function openGuide(event) {
    if (event) event.preventDefault();
    lastFocus = document.activeElement;
    form.reset();
    guideSubmitTracked = false;
    errorMessage.hidden = true;
    setLoading(false);
    captureContext(event && event.currentTarget);
    if (window.leadersFirstMeta) {
      window.leadersFirstMeta.trackCustom('GuideClick', {
        content_name: 'Career Direction Guide',
        content_category: 'guide',
        lead_source: form.querySelector('[name="lead_source"]').value || 'free_guide_block'
      });
    }
    if (window.leadersFirstMetrika) {
      window.leadersFirstMetrika.goal('guide_open', {
        lead_source: form.querySelector('[name="lead_source"]').value || 'free_guide_block'
      });
    }
    formStep.hidden = false;
    successStep.hidden = true;
    updateChannel();
    modal.hidden = false;
    document.body.classList.add('guide-open');
    modal.querySelector('.quiz-modal__close').focus();
  }

  function closeGuide() {
    modal.hidden = true;
    document.body.classList.remove('guide-open');
    if (lastFocus && lastFocus.focus && document.body.contains(lastFocus)) lastFocus.focus();
  }

  document.querySelectorAll('.js-open-guide').forEach(function (button) {
    button.addEventListener('click', openGuide);
  });
  modal.querySelectorAll('[data-close-guide]').forEach(function (button) {
    button.addEventListener('click', closeGuide);
  });
  form.addEventListener('change', function (event) {
    if (event.target.name === 'delivery_channel') updateChannel();
  });
  telegramButton.addEventListener('click', function (event) {
    event.preventDefault();
    if (window.leadersFirstMetrika) {
      window.leadersFirstMetrika.goal('guide_telegram', {
        delivery_channel: 'telegram',
        lead_source: form.querySelector('[name="lead_source"]').value || 'free_guide_block'
      });
    }
    window.location.assign('https://t.me/leaders_first_bot?start=career_direction_guide');
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var channel = selectedChannel();
    if (channel !== 'email' || !form.reportValidity() || isSubmitting) return;
    setField('submitted_at', new Date().toISOString());
    var payload = {};
    new FormData(form).forEach(function (value, key) { payload[key] = value; });
    window.__leadersFirstLastGuideLead = payload;
    errorMessage.hidden = true;
    setLoading(true);
    saveGuideLead(payload).then(function () {
      window.dispatchEvent(new CustomEvent('leadersfirst:guide-lead-submit', { detail: payload }));
      if (!guideSubmitTracked) {
        guideSubmitTracked = true;
        if (window.leadersFirstMeta) {
          window.leadersFirstMeta.track('Lead', {
            content_name: 'Career Direction Guide',
            content_category: 'guide',
            delivery_channel: channel,
            lead_source: payload.lead_source || 'free_guide_block'
          });
          window.leadersFirstMeta.trackCustom('GuideRequestSubmitted', {
            content_name: 'Career Direction Guide',
            content_category: 'guide',
            delivery_channel: channel,
            lead_source: payload.lead_source || 'free_guide_block'
          });
        }
        if (window.leadersFirstMetrika) {
          window.leadersFirstMetrika.goal('guide_submit', {
            delivery_channel: channel,
            lead_source: payload.lead_source || 'free_guide_block',
            utm_source: payload.utm_source || '',
            utm_medium: payload.utm_medium || '',
            utm_campaign: payload.utm_campaign || '',
            utm_content: payload.utm_content || '',
            utm_term: payload.utm_term || ''
          });
        }
      }
      formStep.hidden = true;
      successStep.hidden = false;
      successTitle.textContent = isRussian ? 'Гид уже отправлен' : 'Your guide is on its way';
      successCopy.textContent = isRussian ? 'Проверьте почту — он скоро придёт.' : 'Check your inbox for the Career Direction Guide and the next Leaders First newsletter.';
      successStep.querySelector('button').focus();
    }).catch(function (error) {
      console.error('Leaders First guide request could not be saved:', error);
      errorMessage.textContent = isRussian ? 'Не получилось отправить гид. Попробуйте ещё раз.' : 'We could not send your guide. Please try again.';
      errorMessage.hidden = false;
    }).finally(function () {
      setLoading(false);
    });
  });
  document.addEventListener('keydown', function (event) {
    if (modal.hidden) return;
    if (event.key === 'Escape') closeGuide();
  });
})();

(function () {
  var HUBSPOT_PORTAL_ID = '148956933';
  var HUBSPOT_FORM_ID = '5ad8883e-f289-4719-b8bd-97cc378ea0d1';
  var isRussian = document.documentElement.lang === 'ru';
  var bookingUrls = {
    career_clarity_direction: { '50': 'https://calendly.com/leaders-first/50', '90': 'https://calendly.com/leaders-first/deep-career-session-90min' },
    linkedin_recruiter_visibility: { '50': 'https://calendly.com/leaders-first/power-linkedin-session-50min', '90': 'https://calendly.com/leaders-first/deep-linkedin-session-90min' }
  };
  var serviceTitles = isRussian ? {
    career_clarity_direction: 'Сессия «Куда двигаться в карьере»',
    linkedin_recruiter_visibility: 'Сессия «LinkedIn, который замечают рекрутеры»'
  } : {
    career_clarity_direction: 'Career Clarity & Direction Session',
    linkedin_recruiter_visibility: 'LinkedIn Recruiter Visibility Session'
  };
  var defaultServiceId = window.leadersFirstPage.defaultService;
  var modal = document.getElementById('booking-form');
  if (!modal) return;
  var form = modal.querySelector('.booking-form');
  var hideDeepSession = document.documentElement.getAttribute('data-hide-deep-session') === 'true';
  if (hideDeepSession) {
    var deepSessionOption = form.querySelector('[name="session_duration"][value="90"]');
    if (deepSessionOption) {
      deepSessionOption.disabled = true;
      var deepSessionLabel = deepSessionOption.closest('label');
      if (deepSessionLabel) deepSessionLabel.hidden = true;
    }
  }
  var legacyNameInput = form.querySelector('[name="name"]');
  if (legacyNameInput) {
    var legacyNameLabel = legacyNameInput.closest('label');
    legacyNameLabel.insertAdjacentHTML('beforebegin', isRussian ? '<label><span>Имя</span><input autocomplete="section-booking given-name" required placeholder="Ваше имя" name="firstname"></label><label><span>Фамилия</span><input autocomplete="section-booking family-name" required placeholder="Ваша фамилия" name="lastname"></label>' : '<label><span>First name</span><input autocomplete="section-booking given-name" required placeholder="Your first name" name="firstname"></label><label><span>Last name</span><input autocomplete="section-booking family-name" required placeholder="Your last name" name="lastname"></label>');
    legacyNameLabel.remove();
  }
  form.setAttribute('autocomplete', 'on');
  form.querySelector('[name="phone"]').setAttribute('autocomplete', 'section-booking tel');
  form.querySelector('[name="email"]').setAttribute('autocomplete', 'section-booking email');
  var formStep = modal.querySelector('[data-booking-step="form"]');
  var pendingStep = modal.querySelector('[data-booking-step="pending"]');
  var title = modal.querySelector('[data-booking-title]');
  var summary = modal.querySelector('[data-booking-summary]');
  var submitButton = form.querySelector('[type="submit"]');
  var submitLabel = submitButton.innerHTML;
  var lastFocus = null;
  var selected = { id: '', title: '', duration: '', paymentUrl: '', source: '', cta: '' };
  var bookingLeadTracked = false;
  var bookingScheduledTracked = false;
  var calendlyStep = document.createElement('section');
  calendlyStep.className = 'booking-step booking-calendly';
  calendlyStep.hidden = true;
  calendlyStep.setAttribute('data-booking-step', 'calendly');
  calendlyStep.innerHTML = isRussian ? '<p class="eyebrow">Контакты сохранены</p><h2>Выберите дату и время</h2><p class="booking-form__error" data-booking-error="true" role="alert" hidden></p><div id="calendly-inline-widget" style="width:100%;min-width:320px;height:830px"></div>' : '<p class="eyebrow">Your details have been saved</p><h2>Now choose a date and time</h2><p class="booking-form__error" data-booking-error="true" role="alert" hidden></p><div id="calendly-inline-widget" style="width:100%;min-width:320px;height:830px"></div>';
  pendingStep.parentNode.insertBefore(calendlyStep, pendingStep);
  var calendlyContainer = calendlyStep.querySelector('#calendly-inline-widget');
  var errorMessage = calendlyStep.querySelector('[data-booking-error]');

  function setField(name, value) {
    var field = form.querySelector('[name="' + name + '"]');
    if (field) field.value = value || '';
  }
  function getCookie(name) {
    return document.cookie.split('; ').reduce(function (value, item) {
      var parts = item.split('=');
      return parts.shift() === name ? decodeURIComponent(parts.join('=')) : value;
    }, '');
  }
  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.innerHTML = loading ? (isRussian ? 'Сохраняем…' : 'Saving your details…') : submitLabel;
  }
  function fillTracking() {
    setField('form_name', 'session_booking');
    setField('lead_intent', 'consultation_booking');
    setField('lead_source', selected.source);
    setField('lead_cta', selected.cta);
    setField('requested_service', selected.id);
    setField('payment_url', selected.paymentUrl);
    setField('landing_variant', window.leadersFirstPage.landingVariant);
    setField('page_url', window.location.href);
    setField('page_referrer', document.referrer);
    setField('booking_opened_at', new Date().toISOString());
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (name) {
      var value = window.leadersFirstAttribution ? window.leadersFirstAttribution.get(name) : '';
      setField(name, value);
    });
  }
  function hubSpotFields(payload) {
    return Object.keys(payload).filter(function (name) { return name !== 'privacy_consent'; }).map(function (name) {
      return { name: name, value: String(payload[name]) };
    });
  }
  function saveLead(payload) {
    var context = { pageUri: payload.page_url, pageName: document.title };
    var hutk = getCookie('hubspotutk');
    if (hutk) context.hutk = hutk;
    return fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + HUBSPOT_PORTAL_ID + '/' + HUBSPOT_FORM_ID, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submittedAt: Date.now(), fields: hubSpotFields(payload),
        context: context
      })
    }).then(function (response) {
      if (!response.ok) return response.text().then(function (body) { throw new Error('HubSpot submission failed (' + response.status + '): ' + body); });
      return response.json();
    });
  }
  function ensureCalendly() {
    if (window.Calendly && window.Calendly.initInlineWidget) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-calendly-widget]');
      if (existing) { var waitForWidget = function () { if (window.Calendly && window.Calendly.initInlineWidget) resolve(); else setTimeout(waitForWidget, 50); }; existing.addEventListener('error', reject, { once: true }); waitForWidget(); return; }
      var script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true; script.dataset.calendlyWidget = 'true';
      script.onload = resolve; script.onerror = function () { reject(new Error('Calendly widget failed to load.')); };
      document.body.appendChild(script);
    });
  }
  function showCalendly(payload) {
    if (!selected.paymentUrl) return Promise.reject(new Error('No Calendly Event URL for the selected session.'));
    calendlyContainer.replaceChildren();
    errorMessage.hidden = true;
    formStep.hidden = true;
    pendingStep.hidden = true;
    calendlyStep.hidden = false;
    return ensureCalendly().then(function () {
      calendlyContainer.replaceChildren();
      window.Calendly.initInlineWidget({
        url: selected.paymentUrl,
        parentElement: calendlyContainer,
        prefill: { firstName: payload.firstname, lastName: payload.lastname, email: payload.email },
        utm: {
          utmSource: payload.utm_source, utmMedium: payload.utm_medium, utmCampaign: payload.utm_campaign,
          utmContent: payload.utm_content, utmTerm: payload.utm_term
        }
      });
      if (window.leadersFirstMeta) window.leadersFirstMeta.track('InitiateCheckout', { content_name: selected.title, requested_service: selected.id, session_duration: selected.duration });
      if (window.leadersFirstMetrika) window.leadersFirstMetrika.goal('calendly_open', { requested_service: selected.id, session_duration: selected.duration, lead_source: selected.source });
      window.dispatchEvent(new CustomEvent('leadersfirst:calendly-opened', { detail: payload }));
      setTimeout(function () { calendlyStep.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
    });
  }
  function openBooking(event) {
    if (event) event.preventDefault();
    var trigger = event && event.currentTarget;
    lastFocus = trigger || document.activeElement;
    var serviceId = trigger && (trigger.dataset.sessionId || trigger.dataset.requestedService) || defaultServiceId || 'consultation_general';
    selected = { id: serviceId, title: trigger && trigger.dataset.sessionTitle || serviceTitles[serviceId] || (isRussian ? 'Индивидуальная карьерная сессия' : '1:1 Career Strategy Session'), duration: '', paymentUrl: '', source: trigger && trigger.dataset.leadSource || 'session_card', cta: trigger && trigger.dataset.leadCta || (trigger && trigger.textContent || (isRussian ? 'Выбрать сессию' : 'Book this session')).trim() };
    form.reset(); calendlyContainer.replaceChildren(); errorMessage.hidden = true; calendlyStep.hidden = true; pendingStep.hidden = true; formStep.hidden = false;
    submitButton.disabled = true; submitButton.innerHTML = submitLabel; bookingLeadTracked = false; bookingScheduledTracked = false; fillTracking();
    if (window.leadersFirstMeta) window.leadersFirstMeta.trackCustom('ConsultationClick', { content_category: 'consultation', requested_service: selected.id, lead_source: selected.source, cta_text: selected.cta });
    if (window.leadersFirstMetrika) window.leadersFirstMetrika.goal('consultation_open', { requested_service: selected.id, lead_source: selected.source, cta_text: selected.cta });
    title.textContent = isRussian ? 'Записаться: ' + selected.title.replace(/^Сессия «|»$/g, '') : 'Book ' + selected.title.replace(/ Session$/, ''); summary.textContent = selected.title;
    modal.hidden = false; document.body.classList.add('booking-open');
    setTimeout(function () { form.querySelector('[name="firstname"]').focus(); }, 30);
  }
  form.querySelectorAll('[name="session_duration"]').forEach(function (option) {
    option.addEventListener('change', function () {
      selected.duration = option.value; selected.paymentUrl = bookingUrls[selected.id] && bookingUrls[selected.id][selected.duration] || ''; setField('payment_url', selected.paymentUrl); submitButton.disabled = false;
      if (window.leadersFirstMeta) window.leadersFirstMeta.trackCustom('ConsultationOptionSelected', { content_category: 'consultation', requested_service: selected.id, session_duration: selected.duration, lead_source: selected.source });
      if (window.leadersFirstMetrika) window.leadersFirstMetrika.goal('consultation_option', { requested_service: selected.id, session_duration: selected.duration, lead_source: selected.source });
    });
  });
  function closeBooking() { modal.hidden = true; document.body.classList.remove('booking-open'); if (lastFocus && lastFocus.focus && document.body.contains(lastFocus)) lastFocus.focus(); }
  document.querySelectorAll('.js-open-booking').forEach(function (button) { button.addEventListener('click', openBooking); });
  modal.querySelectorAll('[data-close-booking]').forEach(function (button) { button.addEventListener('click', closeBooking); });
  form.addEventListener('submit', function (event) {
    event.preventDefault(); if (!form.reportValidity()) return;
    var duration = form.querySelector('[name="session_duration"]:checked'); selected.duration = duration ? duration.value : ''; selected.paymentUrl = bookingUrls[selected.id] && bookingUrls[selected.id][selected.duration] || '';
    setField('payment_url', selected.paymentUrl); setField('submitted_at', new Date().toISOString());
    var payload = {}; new FormData(form).forEach(function (value, key) { payload[key] = value; }); window.__leadersFirstLastBooking = payload;
    setLoading(true);
    saveLead(payload).then(function () {
      window.dispatchEvent(new CustomEvent('leadersfirst:booking-submit', { detail: payload }));
      if (!bookingLeadTracked) {
        bookingLeadTracked = true;
        if (window.leadersFirstMeta) window.leadersFirstMeta.track('Lead', { content_name: 'Consultation application', content_category: 'consultation', requested_service: selected.id, session_duration: selected.duration, lead_source: selected.source });
        if (window.leadersFirstMetrika) window.leadersFirstMetrika.goal('consultation_submit', { requested_service: selected.id, session_duration: selected.duration, lead_source: selected.source, utm_source: payload.utm_source || '', utm_medium: payload.utm_medium || '', utm_campaign: payload.utm_campaign || '', utm_content: payload.utm_content || '', utm_term: payload.utm_term || '' });
      }
      return showCalendly(payload);
    }).catch(function (error) {
      console.error('Leaders First booking could not continue:', error);
      formStep.hidden = false; calendlyStep.hidden = true; form.appendChild(errorMessage); errorMessage.textContent = isRussian ? 'Не получилось продолжить запись. Попробуйте ещё раз.' : 'We could not continue with your booking. Please try again.'; errorMessage.hidden = false;
    }).finally(function () { setLoading(false); });
  });
  window.addEventListener('message', function (event) {
    if (event.origin !== 'https://calendly.com' || !event.data || event.data.event !== 'calendly.event_scheduled' || bookingScheduledTracked) return;
    bookingScheduledTracked = true;
    if (window.leadersFirstMeta) window.leadersFirstMeta.track('Schedule', { content_name: selected.title, requested_service: selected.id, session_duration: selected.duration });
    if (window.leadersFirstMetrika) window.leadersFirstMetrika.goal('booking_scheduled', { requested_service: selected.id, session_duration: selected.duration, lead_source: selected.source });
    window.dispatchEvent(new CustomEvent('leadersfirst:calendly-scheduled', { detail: event.data.payload || {} }));
  });
  document.addEventListener('keydown', function (event) { if (!modal.hidden && event.key === 'Escape') closeBooking(); });
})();

(function () {
  var menu = document.querySelector('[data-mobile-menu]');
  if (!menu) return;
  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { menu.removeAttribute('open'); });
  });
  document.addEventListener('click', function (event) {
    if (menu.open && !menu.contains(event.target)) menu.removeAttribute('open');
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && menu.open) {
      menu.removeAttribute('open');
      menu.querySelector('summary').focus();
    }
  });
})();

(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-session-details]'));
  if (!cards.length) return;
  cards.forEach(function (details) {
    details.addEventListener('toggle', function () {
      if (!details.open) return;
      cards.forEach(function (item) {
        if (item !== details) item.open = false;
      });
    });
  });
})();
