# Leaders First Career Strategy

Client preview for the Leaders First career strategy landing page and Career Navigator quiz.

## Shared frontend architecture

- `index.html` contains the page markup.
- `assets/site.css` contains the shared responsive styles.
- `assets/analytics.js` initializes Yandex Metrika, Meta Pixel, and persistent UTM attribution.
- `assets/forms.js` contains the shared guide and consultation form flows, including HubSpot and Calendly integration.

Keep the analytics script before the form script. The forms read UTM attribution and use the shared analytics helpers when users open or submit a form.
