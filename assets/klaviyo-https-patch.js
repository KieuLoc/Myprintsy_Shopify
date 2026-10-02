(function applyKlaviyoHttpsPatch() {
  if (window.__klaviyoHttpsPatchApplied) return;
  window.__klaviyoHttpsPatchApplied = true;

  var shouldUpgradeHttpUrls =
    window.location.protocol !== 'https:' ||
    /^(127\.|localhost)/.test(window.location.hostname);

  function debugLog(hypothesisId, message, data) {
    try {
      if (sessionStorage.getItem('cart-reminder-debug') !== '1') return;
    } catch (error) {
      return;
    }

    fetch('http://127.0.0.1:7487/ingest/655161ec-99e0-4c76-93d1-3fd0a8bd9706', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c87c67' },
      body: JSON.stringify({
        sessionId: 'c87c67',
        hypothesisId,
        location: 'klaviyo-https-patch.js',
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(function () {});
  }

  function isOnsiteSubscribeUrl(url) {
    return typeof url === 'string' && /client\/subscriptions/.test(url) && /onsite=true/.test(url);
  }

  function publishOnsiteSubscribeResult(url, ok, status) {
    if (!isOnsiteSubscribeUrl(url)) return;

    var detail = { ok: ok, status: status, at: Date.now(), url: url.slice(0, 160) };
    window.__klaviyoOnsiteSubscribeResult = detail;

    debugLog('W', 'onsite subscribe response', {
      ok: ok,
      status: status,
      hostname: window.location.hostname,
    });

    window.dispatchEvent(new CustomEvent('klaviyo-onsite-subscribe-result', { detail: detail }));
  }

  function upgradeKlaviyoUrl(url) {
    if (!shouldUpgradeHttpUrls) return url;
    if (typeof url !== 'string' || !/^http:\/\/a\.klaviyo\.com/i.test(url)) return url;

    var upgraded = url.replace(/^http:\/\//i, 'https://');

    debugLog('T', 'upgraded klaviyo url', {
      from: url.slice(0, 120),
      to: upgraded.slice(0, 120),
    });

    return upgraded;
  }

  function resolveFetchUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof Request) return input.url;
    return '';
  }

  function runFetch(input, init) {
    if (typeof input === 'string') {
      return window.__klaviyoNativeFetch(upgradeKlaviyoUrl(input), init);
    }

    if (input instanceof Request) {
      var upgraded = upgradeKlaviyoUrl(input.url);
      if (upgraded !== input.url) {
        return window.__klaviyoNativeFetch(new Request(upgraded, input), init);
      }
    }

    return window.__klaviyoNativeFetch(input, init);
  }

  window.__klaviyoNativeFetch = window.fetch.bind(window);
  window.fetch = function patchedKlaviyoFetch(input, init) {
    var requestUrl = resolveFetchUrl(input);

    return runFetch(input, init).then(function (response) {
      publishOnsiteSubscribeResult(requestUrl, response.ok, response.status);
      return response;
    });
  };

  var originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function patchedKlaviyoXhrOpen(method, url, ...rest) {
    var resolvedUrl = typeof url === 'string' ? url : String(url);
    this.__klaviyoRequestUrl = resolvedUrl;
    return originalOpen.call(this, method, upgradeKlaviyoUrl(resolvedUrl), ...rest);
  };

  var originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function patchedKlaviyoXhrSend(...args) {
    var requestUrl = this.__klaviyoRequestUrl || '';

    this.addEventListener(
      'loadend',
      function handleKlaviyoXhrLoadEnd() {
        if (!isOnsiteSubscribeUrl(requestUrl)) return;
        var ok = this.status >= 200 && this.status < 300;
        publishOnsiteSubscribeResult(requestUrl, ok, this.status);
      },
      { once: true }
    );

    return originalSend.apply(this, args);
  };

  if (shouldUpgradeHttpUrls && navigator.sendBeacon) {
    var originalBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function patchedKlaviyoBeacon(url, data) {
      return originalBeacon(upgradeKlaviyoUrl(url), data);
    };
  }
})();
