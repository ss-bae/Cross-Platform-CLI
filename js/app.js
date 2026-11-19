/*
 * App-wide setup, loaded before game.js and learn.js:
 *   - demo mode (?demo in the URL)
 *   - where progress is saved
 *   - sample progress for demo visitors
 *   - service worker registration (offline support when served over http/https)
 *
 * Demo progress lives in sessionStorage under "demo:" keys, so it never touches a
 * player's real progress and disappears when the tab closes.
 */
(function () {
  'use strict';

  const demo = new URLSearchParams(window.location.search).has('demo');
  const KEYS = { game: 'cli-practice-game-v1', learn: 'cli-practice-learn-v1' };

  function pickStorage() {
    try {
      const s = demo ? window.sessionStorage : window.localStorage;
      s.getItem(KEYS.game); // throws when storage is blocked
      return s;
    } catch (e) {
      return null;
    }
  }

  const storage = pickStorage();
  const prefix = demo ? 'demo:' : '';

  const APP = {
    demo,
    KEYS,
    // Read saved JSON. legacyKey is an older key to fall back to (real progress only).
    read(key, legacyKey) {
      if (!storage) return null;
      try {
        const raw = storage.getItem(prefix + key) || (!demo && legacyKey ? storage.getItem(legacyKey) : null);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    write(key, value, legacyKey) {
      if (!storage) return;
      try {
        storage.setItem(prefix + key, JSON.stringify(value));
        if (!demo && legacyKey) storage.removeItem(legacyKey);
      } catch (e) { /* storage full or blocked */ }
    },
    // Start the demo over from the sample progress.
    resetDemo() {
      if (!demo || !storage) return;
      for (const k of Object.values(KEYS)) storage.removeItem(prefix + k);
      storage.removeItem('demo:toured');
    },
  };
  window.APP = APP;
  if (demo) document.documentElement.dataset.demo = '';

  // ---------- Sample progress for demo visitors ----------
  // Built from the question bank so it always matches real commands and ids.
  function seedPractice() {
    const bank = window.QUESTION_BANK;
    const profile = {
      windows: { score: 1240, streak: 3, best: 8, weak: ['pathping', 'robocopy'], learning: ['netstat', 'gpresult', 'chkdsk'], strong: 9 },
      linux: { score: 860, streak: 0, best: 6, weak: ['chmod', 'dig'], learning: ['find', 'grep'], strong: 8 },
      macos: { score: 420, streak: 2, best: 4, weak: ['du'], learning: ['top'], strong: 4 },
    };
    const state = { mode: 'windows', view: 'practice', os: {} };
    for (const [os, p] of Object.entries(profile)) {
      const commands = Object.keys(bank.info[os]);
      const cmds = {};
      const strong = commands.filter((c) => !p.weak.includes(c) && !p.learning.includes(c)).slice(0, p.strong);
      for (const c of strong) cmds[c] = { seen: 3, clean: 3, missed: 0, hinted: 0, weak: 0 };
      for (const c of p.learning) cmds[c] = { seen: 1, clean: 1, missed: 0, hinted: 0, weak: 0 };
      for (const c of p.weak) cmds[c] = { seen: 2, clean: 0, missed: 1, hinted: 1, weak: 3 };
      const answered = Object.values(cmds).reduce((n, c) => n + c.seen, 0);
      const clean = Object.values(cmds).reduce((n, c) => n + c.clean, 0);
      const qseen = {};
      for (const q of bank.questions) if (q.os === os && cmds[q.command] && q.style === 'recall') qseen[q.id] = 1;
      state.os[os] = { score: p.score, streak: p.streak, best: p.best, answered, clean, cmds, qseen };
    }
    // Open on the DNS scenario the tour uses.
    state.os.windows.current = 'w-nslookup-1';
    state.os.windows.attempt = { id: 'w-nslookup-1', wrong: 0, hinted: false, solved: false, choices: null, points: 0, matched: null };
    state.os.windows.turn = 1;
    return state;
  }

  function seedLearn() {
    const cards = window.LEARN_DATA.cards;
    const boxes = {};
    cards.filter((c) => c.os.includes('windows')).slice(0, 18).forEach((c, i) => { boxes[c.cmd] = 1 + (i % 5); });
    return {
      tab: 'guided',
      os: {
        windows: { guided: { cd: true, dir: true, ipconfig: true, ping: true }, boxes, best: { match: 24, speed: 9, detective: 8 }, cardDir: 'cmd', cardCat: 'all' },
        linux: { guided: { ls: true, pwd: true }, boxes: {}, best: { chmod: 9 }, cardDir: 'cmd', cardCat: 'all' },
        macos: { guided: {}, boxes: {}, best: {}, cardDir: 'cmd', cardCat: 'all' },
      },
    };
  }

  if (demo && storage && !storage.getItem(prefix + KEYS.game)) {
    APP.write(KEYS.game, seedPractice());
    APP.write(KEYS.learn, seedLearn());
  }

  // ---------- Install + offline support (only over http/https) ----------
  // Browsers won't fetch a manifest or run a service worker from file://, so opening
  // index.html directly skips both instead of logging errors.
  const served = /^https?:$/.test(window.location.protocol);
  if (served) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'manifest.webmanifest';
    document.head.append(link);
  }
  if (served && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
    });
  }
})();
