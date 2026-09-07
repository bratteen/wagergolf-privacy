const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets/js/analytics-guard.js'), 'utf8');
const WEBSITE = 'b7869a5c-549a-4cb1-a60f-94b592dbb88c';

function setup({
  href = 'https://wagergolf.se/en/game-formats/skins/',
  expectedPath = '/en/game-formats/skins/', title = 'Skins rules – Wager Golf',
  language = 'en', referrer = '', privacy = {}, windowDnt,
  website = WEBSITE, hasBody = true, hasConfig = true,
  analyticsSource = 'https://analytics.bratt.se/script.js',
} = {}) {
  const attrs = { 'data-analytics-path': expectedPath, 'data-analytics-title': title };
  const appended = [];
  const listeners = [];
  const configAttrs = { 'data-analytics-src': analyticsSource, 'data-website-id': website };
  const document = {
    title: 'Private dynamic title must never be sent',
    referrer,
    body: hasBody ? { getAttribute: name => attrs[name] ?? null } : null,
    documentElement: { getAttribute: name => name === 'lang' ? language : null },
    currentScript: hasConfig ? { getAttribute: name => configAttrs[name] ?? null } : null,
    createElement(tag) {
      assert.equal(tag, 'script');
      return { attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } };
    },
    addEventListener(type, callback, capture) { listeners.push({ type, callback, capture }); },
    head: {
      appendChild(script) {
        assert.equal(typeof context.wagerGolfBeforeSend, 'function', 'hooken måste finnas före leverantörens script');
        appended.push(script);
      },
    },
  };
  const context = {
    URL, document,
    navigator: { language: 'en-US', ...privacy },
    location: { href }, doNotTrack: windowDnt,
    fetch() { throw new Error('The guard must not send requests'); },
  };
  for (const owner of [context, document]) {
    for (const property of ['localStorage', 'sessionStorage', 'cookie']) {
      Object.defineProperty(owner, property, { get() { throw new Error('The guard must not access storage'); } });
    }
  }
  context.window = context;
  vm.runInNewContext(source, context);
  const payload = {
    website: WEBSITE, hostname: new URL(href).hostname,
    url: href, title: 'Untrusted payload title', screen: '1440x900', language: 'en-US',
  };
  return {
    payload, document, context, appended, listeners,
    send(type = 'event', value = payload) {
      const result = context.wagerGolfBeforeSend(type, value);
      return result && JSON.parse(JSON.stringify(result));
    },
  };
}

test('sidvisningen innehåller bara offentlig sökväg och statiskt sidinnehåll', () => {
  const { send, payload } = setup({ href: 'https://wagergolf.se/en/game-formats/skins/?email=a%40b.com&token=secret#private' });
  Object.assign(payload, {
    id: 'user-123', userId: 'user-123', tag: 'secret-campaign',
    data: { email: 'a@b.com', token: 'secret' }, ip: '127.0.0.1',
  });
  const before = structuredClone(payload);
  assert.deepEqual(send(), {
    website: WEBSITE, hostname: 'wagergolf.se', url: '/en/game-formats/skins/',
    title: 'Skins rules – Wager Golf', language: 'en', referrer: '',
  });
  assert.deepEqual(payload, before, 'originalpayloaden ska inte ändras');
});

test('båda godkända värdarna fungerar med exakt matchad värd och sökväg', () => {
  for (const hostname of ['wagergolf.se', 'www.wagergolf.se']) {
    const { send } = setup({ href: `https://${hostname}/en/game-formats/skins/` });
    assert.equal(send().hostname, hostname);
    assert.equal(send().url, '/en/game-formats/skins/');
  }
});

test('extern referrer reduceras till origin utan sökväg, query, fragment eller lösenord', () => {
  const { send, payload } = setup({ referrer: 'https://username:password@search.example:8443/private/invite?email=a%40b.com#token' });
  payload.referrer = 'https://payload.example/private-token';
  assert.equal(send().referrer, 'https://search.example:8443');
});

test('interna inbjudningar och ogiltiga referrers lämnar inget spår', () => {
  for (const referrer of [
    'https://wagergolf.se/i/private-token?email=a%40b.com',
    'https://www.wagergolf.se/i/private-token#invite',
    'http://wagergolf.se/i/private-token',
    '', '/i/private-token', 'about:blank', 'javascript:alert(1)', 'data:text/plain,secret',
  ]) {
    assert.equal(setup({ referrer }).send().referrer, '', referrer);
  }
});

test('de tre nedladdningshändelserna får bara en känd plats, aldrig godtyckliga data', () => {
  const places = ['nav', 'artikel', 'guide', 'guide-inline', 'startsida-hero', 'startsida-avslut', 'startsida-bottom'];
  for (const name of ['app-store-klick', 'play-store-klick', 'ladda-ner-klick']) {
    for (const plats of places) {
      const { send, payload } = setup();
      const result = send('event', { ...payload, name, data: { plats, email: 'a@b.com', id: 'private-user' } });
      assert.equal(result.name, name);
      assert.deepEqual(result.data, { plats });
    }
  }
  const { send, payload } = setup();
  const result = send('event', { ...payload, name: 'app-store-klick', data: { plats: 'secret-token', email: 'a@b.com' } });
  assert.equal(result.name, 'app-store-klick');
  assert.equal(result.data, undefined);
});

test('identifiering, prestandamätning, replay och okända event stoppas', () => {
  const { send, payload } = setup();
  for (const type of ['identify', 'performance', 'replay', 'session', 'event-extra', null]) {
    assert.equal(send(type), null, String(type));
  }
  for (const name of ['invite-open', 'user-email', 'unknown', '', null]) {
    assert.equal(send('event', { ...payload, name }), null, String(name));
  }
  assert.equal(send('event', null), null);
  assert.equal(send('event', []), null);
});

test('GPC och alla DNT-signaler stoppar både sidvisningar och klick', () => {
  const cases = [
    { privacy: { globalPrivacyControl: true } },
    { privacy: { doNotTrack: '1' } },
    { privacy: { doNotTrack: 1 } },
    { privacy: { doNotTrack: 'yes' } },
    { privacy: { msDoNotTrack: '1' } },
    { windowDnt: '1' },
  ];
  for (const options of cases) {
    const { send, payload } = setup(options);
    assert.equal(send(), null, JSON.stringify(options));
    assert.equal(send('event', { ...payload, name: 'app-store-klick', data: { plats: 'guide' } }), null);
  }
  assert.ok(setup({ privacy: { globalPrivacyControl: false, doNotTrack: '0' } }).send());
});

test('privata eller ändrade faktiska URL:er kan inte märkas om som publika events', () => {
  for (const href of [
    'https://wagergolf.se/i/private-token',
    'https://wagergolf.se/en/game-formats/other/',
    'https://preview.example/en/game-formats/skins/',
    'http://wagergolf.se/en/game-formats/skins/',
    'https://username:password@wagergolf.se/en/game-formats/skins/',
  ]) {
    const { send, payload } = setup({ href });
    payload.url = 'https://wagergolf.se/en/game-formats/skins/';
    payload.hostname = 'wagergolf.se';
    assert.equal(send(), null, href);
  }
});

test('payloaden måste matcha sidans origin, canonical-path, värd och website-id', () => {
  const { send, payload } = setup();
  for (const url of [
    'https://wagergolf.se/i/private-token',
    'https://wagergolf.se/en/game-formats/skins/private-token/',
    'https://www.wagergolf.se/en/game-formats/skins/',
    'https://evil.example/en/game-formats/skins/',
    'https://user:pass@wagergolf.se/en/game-formats/skins/',
    'javascript:alert(1)', 'data:text/html,private', '', null,
  ]) {
    assert.equal(send('event', { ...payload, url }), null, String(url));
  }
  assert.equal(send('event', { ...payload, hostname: 'evil.example' }), null);
  assert.equal(send('event', { ...payload, website: 'other-website' }), null);
});

test('sidans uttryckliga godkännande och guardens tracker-konfiguration krävs', () => {
  for (const options of [
    { hasBody: false }, { hasConfig: false }, { website: '' }, { website: 'not-a-uuid' },
    { expectedPath: '' }, { expectedPath: '//evil.example/' },
    { expectedPath: '/en/?token=private' }, { expectedPath: '/en/%70rivate/' },
    { expectedPath: '/i/private-token/', href: 'https://wagergolf.se/i/private-token/' },
    { expectedPath: '/privacy/', href: 'https://wagergolf.se/privacy/' },
    { title: '' },
  ]) {
    assert.equal(setup(options).send(), null, JSON.stringify(options));
  }
});

test('leverantörens script laddas först efter hooken med alla integritetsspärrar', () => {
  const { appended } = setup();
  assert.equal(appended.length, 1);
  assert.equal(appended[0].src, 'https://analytics.bratt.se/script.js');
  assert.equal(appended[0].defer, true);
  assert.equal(appended[0].referrerPolicy, 'no-referrer');
  assert.deepEqual(appended[0].attrs, {
    'data-website-id': WEBSITE,
    'data-before-send': 'wagerGolfBeforeSend',
    'data-auto-track': 'false',
    'data-domains': 'wagergolf.se,www.wagergolf.se',
    'data-exclude-search': 'true',
    'data-exclude-hash': 'true',
    'data-do-not-track': 'true',
    'data-performance': 'false',
    'data-fetch-credentials': 'omit',
  });
});

test('ingen tracker laddas vid privata sidor, felaktig konfiguration eller GPC/DNT', () => {
  const blocked = [
    { hasBody: false }, { hasConfig: false }, { website: '' }, { website: 'not-a-uuid' },
    { expectedPath: '' }, { title: '' },
    { href: 'https://wagergolf.se/i/private-token/' },
    { href: 'http://wagergolf.se/en/game-formats/skins/' },
    { href: 'https://preview.example/en/game-formats/skins/' },
    { href: 'https://user:pass@wagergolf.se/en/game-formats/skins/' },
    { privacy: { globalPrivacyControl: true } },
    { privacy: { doNotTrack: '1' } },
    { privacy: { msDoNotTrack: '1' } },
    { windowDnt: 'yes' },
  ];
  for (const analyticsSource of [
    '', 'https://evil.example/script.js', 'http://analytics.bratt.se/script.js',
    'https://analytics.bratt.se/script.js?token=private',
    'https://analytics.bratt.se/recorder.js',
    'https://analytics.bratt.se@evil.example/script.js',
  ]) blocked.push({ analyticsSource });
  for (const options of blocked) {
    const { appended, send } = setup(options);
    assert.equal(appended.length, 0, JSON.stringify(options));
    assert.equal(send(), null, JSON.stringify(options));
  }
});

test('ändrad URL eller ny integritetssignal efter laddning stoppar efterföljande event', () => {
  const first = setup();
  assert.equal(first.appended.length, 1);
  first.context.location.href = 'https://wagergolf.se/i/private-token/';
  assert.equal(first.send(), null);
  const second = setup();
  assert.equal(second.appended.length, 1);
  second.context.navigator.globalPrivacyControl = true;
  assert.equal(second.send(), null);
});

test('okänt DOM-språk och payloadens webbläsarspråk eller skärm skickas inte', () => {
  const { send, payload } = setup({ language: 'private-value' });
  const result = send('event', { ...payload, language: 'secret-language', screen: '1920x1080' });
  assert.equal(result.language, undefined);
  assert.equal(result.screen, undefined);
  assert.equal(setup({ language: 'pt-PT' }).send().language, 'pt-PT');
});

test('varje retur skapas på nytt även när samma payload används flera gånger', () => {
  const { context, payload } = setup();
  const first = context.wagerGolfBeforeSend('event', payload);
  first.id = 'injected-user';
  const second = context.wagerGolfBeforeSend('event', payload);
  assert.notEqual(first, second);
  assert.equal(second.id, undefined);
  assert.equal(second.screen, undefined);
});

function downloadTarget(name = 'app-store-klick', place = 'guide-inline') {
  const attributes = {
    'data-umami-event': name, 'data-umami-event-plats': place,
    'data-umami-event-email': 'private@example.test',
  };
  const link = {
    href: '/ladda-ner?l=en&p=ios&c=guides',
    getAttribute: key => attributes[key] ?? null,
    closest: selector => selector === 'a[data-umami-event]' ? link : null,
  };
  return link;
}

test('onload skickar exakt en sidvisning och installerar en capture-lyssnare', () => {
  const { context, appended, listeners } = setup();
  const calls = [];
  context.umami = { track(...args) { calls.push(args); return Promise.resolve(); } };
  appended[0].onload();
  appended[0].onload();
  assert.deepEqual(calls, [[]]);
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0].type, 'click');
  assert.equal(listeners[0].capture, true);
});

test('en nätverkspromise som aldrig avslutas fördröjer eller förändrar inte klicket', () => {
  const { context, appended, listeners } = setup();
  const calls = [];
  context.umami = { track(...args) { calls.push(args); return new Promise(() => {}); } };
  appended[0].onload();
  const link = downloadTarget();
  const nestedSpan = { closest: selector => selector === 'a[data-umami-event]' ? link : null };
  const event = {
    target: nestedSpan, defaultPrevented: false, ctrlKey: true,
    preventDefault() { assert.fail('analytics får inte stoppa länken'); },
    stopPropagation() { assert.fail('analytics får inte stoppa andra händelsehanterare'); },
    stopImmediatePropagation() { assert.fail('analytics får inte stoppa andra händelsehanterare'); },
  };
  const href = context.location.href;
  const destination = link.href;
  assert.equal(listeners[0].callback(event), undefined, 'klicklyssnaren får inte returnera en nätverkspromise');
  assert.equal(event.defaultPrevented, false);
  assert.equal(context.location.href, href);
  assert.equal(link.href, destination);
  assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1])), ['app-store-klick', { plats: 'guide-inline' }]);
});

test('de tre markerade nedladdningslänkarna spåras även från nästlade textnoder', () => {
  const { context, appended, listeners } = setup();
  const calls = [];
  context.umami = { track(...args) { calls.push(args); } };
  appended[0].onload();
  for (const name of ['app-store-klick', 'play-store-klick', 'ladda-ner-klick']) {
    const parentElement = downloadTarget(name, 'nav');
    listeners[0].callback({ target: { nodeType: 3, parentElement } });
  }
  assert.deepEqual(JSON.parse(JSON.stringify(calls.slice(1))), [
    ['app-store-klick', { plats: 'nav' }],
    ['play-store-klick', { plats: 'nav' }],
    ['ladda-ner-klick', { plats: 'nav' }],
  ]);
});

test('omarkerade, okända eller redan stoppade klick ignoreras', () => {
  const { context, appended, listeners } = setup();
  const calls = [];
  context.umami = { track(...args) { calls.push(args); } };
  appended[0].onload();
  for (const event of [
    null, {}, { target: {} }, { target: { closest: () => null } },
    { target: downloadTarget('private-event', 'nav') },
    { target: downloadTarget('app-store-klick', 'private-place') },
    { target: downloadTarget(), defaultPrevented: true },
  ]) {
    listeners[0].callback(event);
  }
  assert.deepEqual(calls, [[]]);
});

test('saknad tracker, nätverksfel och senare GPC hindrar aldrig sidans klick', async () => {
  const missing = setup();
  assert.doesNotThrow(() => missing.appended[0].onload());
  assert.equal(missing.listeners.length, 0);

  const throwing = setup();
  throwing.context.umami = { track() { throw new Error('network unavailable'); } };
  assert.doesNotThrow(() => throwing.appended[0].onload());
  assert.doesNotThrow(() => throwing.listeners[0].callback({ target: downloadTarget() }));
  delete throwing.context.umami;
  assert.doesNotThrow(() => throwing.listeners[0].callback({ target: downloadTarget() }));

  const rejected = setup();
  rejected.context.umami = { track() { return Promise.reject(new Error('network unavailable')); } };
  rejected.appended[0].onload();
  rejected.listeners[0].callback({ target: downloadTarget() });
  await new Promise(resolve => setImmediate(resolve));

  const privatePage = setup();
  let count = 0;
  privatePage.context.umami = { track() { count++; } };
  privatePage.appended[0].onload();
  privatePage.context.navigator.globalPrivacyControl = true;
  privatePage.listeners[0].callback({ target: downloadTarget() });
  assert.equal(count, 1);
});
