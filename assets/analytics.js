(function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=111597180', 'ym');

    ym(111597180, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});

    window.leadersFirstMetrika = {
      goal: function (goalName, parameters) {
        if (typeof window.ym === 'function') {
          window.ym(111597180, 'reachGoal', goalName, parameters || {});
        }
      }
    };

function initLeadersFirstMetaPixel() {
  !function(f,b,e,v,n,t,s) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    b.head.appendChild(t);
  }(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  fbq('init', '1072423188457511');
  fbq('track', 'PageView');
}

window.leadersFirstMeta = {
  track: function (eventName, parameters) {
    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, parameters || {});
    }
  },
  trackCustom: function (eventName, parameters) {
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, parameters || {});
    }
  }
};

window.setTimeout(initLeadersFirstMetaPixel, 1500);

(function () {
  var names = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var storageKey = 'leaders_first_utm_v1';
  var maxAgeMs = 90 * 24 * 60 * 60 * 1000;

  function readStored() {
    try {
      var value = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
      if (!value || typeof value !== 'object') return {};
      if (!value.saved_at || Date.now() - Number(value.saved_at) > maxAgeMs) {
        window.localStorage.removeItem(storageKey);
        return {};
      }
      return value;
    } catch (error) {
      return {};
    }
  }

  function capture() {
    var stored = readStored();
    var params = new URLSearchParams(window.location.search);
    var hasCurrentUtm = false;

    names.forEach(function (name) {
      var value = (params.get(name) || '').trim();
      if (value) {
        stored[name] = value;
        hasCurrentUtm = true;
      }
    });

    if (hasCurrentUtm) {
      stored.saved_at = Date.now();
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(stored));
      } catch (error) {}
    }

    return stored;
  }

  var attribution = capture();
  window.leadersFirstAttribution = {
    get: function (name) {
      var current = (new URLSearchParams(window.location.search).get(name) || '').trim();
      return current || attribution[name] || '';
    }
  };
})();
