/*
 * Demo mode (?demo): banner plus a guided tour for first-time visitors.
 * The tour spotlights one part of the page at a time and drives the game through
 * window.Trainer / window.Learn, so the terminal types its own answers.
 */
(function () {
  'use strict';

  const APP = window.APP;
  if (!APP.demo) return;

  const T = window.Trainer;
  const L = window.Learn;
  const TOURED_KEY = 'demo:toured';

  const STEPS = [
    {
      title: 'Welcome to the demo',
      body: 'This is a browser game for learning Windows, Linux, and macOS command-line tools by typing them. The tour takes about a minute and the terminal types for you. Sample progress is preloaded, and nothing here touches real saved progress.',
      action: () => { T.switchView('practice'); T.switchMode('windows'); },
    },
    {
      target: '.modes',
      title: 'Three operating systems',
      body: 'Each OS has its own question pool, progress, prompt, and window style, so you always know which shell you are in.',
    },
    {
      target: '.question-card',
      title: 'Real troubleshooting scenarios',
      body: 'Questions are workplace scenarios or direct recall. Answers are typed into the terminal, not picked from a list.',
      action: () => T.showQuestion('w-nslookup-1'),
    },
    {
      target: '#terminal',
      title: 'Realistic errors',
      body: 'A wrong answer prints the same kind of error a real shell would show. Here, ipconfig rejects an invalid switch.',
      action: () => T.typeAnswer('ipconfig /dns'),
    },
    {
      target: '#hint-panel',
      title: 'Hints that teach',
      body: 'A hint gives a nudge and four candidate commands. The player still has to type the right one, so the hint teaches rather than gives the answer away.',
      action: () => T.openHint(),
    },
    {
      target: '#terminal',
      title: 'Output and explanation',
      body: 'A correct answer prints realistic output and explains why it fits. The right command earns points; the full command with its arguments earns a bonus.',
      action: () => T.typeAnswer(T.question().answers[0]),
    },
    {
      target: '.progress',
      title: 'Weak-spot tracking',
      body: 'Commands you miss come back more often until you get them right three times unaided. This panel shows how strong each command is.',
    },
    {
      target: '#terminal',
      title: 'Each shell has its own rules',
      body: 'Windows ignores case, but Linux and macOS do not. Typing LS instead of ls is flagged as a capitalization mistake, which is a real thing to learn.',
      action: async () => { T.showQuestion('l-ls-3'); await T.typeAnswer('LS -a'); },
    },
    {
      target: '.lesson-grid',
      title: 'Learn mode: guided lessons',
      body: 'Each command has a three-step lesson: learn what it does, copy-type an example, then answer a scenario on your own.',
      action: () => { T.switchView('learn'); L.setTab('guided'); },
    },
    {
      target: '.game-grid',
      title: 'Flash cards and mini games',
      body: 'Spaced-repetition flash cards plus four mini games: Match-up, Speed Round, Output Detective, and Permission Puzzle.',
      action: () => L.setTab('games'),
    },
    {
      title: 'Your turn',
      body: 'Try a few questions. Stuck? The Show me button types the answer for you. You can replay this tour from the banner at the top.',
      action: () => { T.switchMode('windows'); T.switchView('practice'); T.next(); },
      done: 'Start playing',
    },
  ];

  // ---------- Banner ----------
  // Same page without ?demo. Uses the full path so it also works when opened from disk,
  // where "./" would show the folder instead of index.html.
  document.getElementById('demo-exit').href = window.location.pathname;
  document.getElementById('demo-replay').addEventListener('click', () => start());
  document.getElementById('demo-reset').addEventListener('click', () => {
    APP.resetDemo();
    window.location.reload();
  });

  // ---------- Tour UI ----------
  let layer = null;
  let index = 0;
  let busy = false;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function build() {
    layer = el('div', 'tour-layer');
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'tour-title');
    const spot = el('div', 'tour-spot');
    const pop = el('div', 'tour-pop');
    const count = el('span', 'tour-count');
    const title = el('h2', 'tour-title');
    title.id = 'tour-title';
    const body = el('p', 'tour-body');
    const skip = el('button', 'btn btn-quiet', 'Skip tour');
    const next = el('button', 'btn btn-primary tour-next', 'Next ▸');
    const row = el('div', 'tour-row');
    row.append(skip, next);
    pop.append(count, title, body, row);
    layer.append(spot, pop);
    document.body.append(layer);

    skip.addEventListener('click', finish);
    next.addEventListener('click', () => (index === STEPS.length - 1 ? finish() : show(index + 1)));
    layer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'Tab') { // keep focus inside the dialog
        e.preventDefault();
        (document.activeElement === next ? skip : next).focus();
      }
    });
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
  }

  function part(sel) { return layer.querySelector(sel); }

  async function show(i) {
    if (busy) return;
    busy = true;
    index = i;
    const step = STEPS[i];
    const next = part('.tour-next');
    next.disabled = true;
    layer.classList.add('working');
    part('.tour-count').textContent = `${i + 1} / ${STEPS.length}`;
    part('.tour-title').textContent = step.title;
    part('.tour-body').textContent = step.body;
    next.textContent = step.done || 'Next ▸';
    place();
    try {
      if (step.action) await step.action();
    } catch (e) { /* a failed step should never trap the visitor in the tour */ }
    const target = step.target && document.querySelector(step.target);
    // On phones the card docks at the bottom, so bring the target to the top of the screen.
    if (target) target.scrollIntoView({ block: window.innerWidth < 640 ? 'start' : 'center', behavior: 'smooth' });
    setTimeout(() => {
      place();
      layer.classList.remove('working');
      next.disabled = false;
      next.focus({ preventScroll: true });
      busy = false;
    }, target ? 350 : 0);
  }

  // Position the spotlight around the target and the card next to it.
  function place() {
    if (!layer) return;
    const step = STEPS[index];
    const spot = part('.tour-spot');
    const pop = part('.tour-pop');
    const target = step.target && document.querySelector(step.target);
    const r = target && !target.hidden ? target.getBoundingClientRect() : null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const narrow = vw < 640;

    if (!r || r.width === 0) {
      spot.style.cssText = `top:${vh / 2}px;left:${vw / 2}px;width:0;height:0;`;
      pop.classList.add('center');
      pop.style.cssText = '';
      return;
    }
    pop.classList.remove('center');
    const pad = 8;
    spot.style.cssText = `top:${r.top - pad}px;left:${r.left - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;`;

    if (narrow) { pop.style.cssText = ''; pop.classList.add('docked'); return; }
    pop.classList.remove('docked');
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const gap = 16;
    const MIN_SIDE = 280;
    const roomRight = vw - (r.right + pad) - gap - 12;
    const roomLeft = r.left - pad - gap - 12;
    let top = r.bottom + pad + gap;                 // below the target,
    let left = r.left + r.width / 2 - pw / 2;
    let width = '';
    if (top + ph > vh - 12) top = r.top - pad - gap - ph; // else above it,
    if (top < 12) {
      if (roomRight >= MIN_SIDE || roomLeft >= MIN_SIDE) {
        // else beside it (a tall target such as the terminal), narrowing the card to fit,
        const right = roomRight >= MIN_SIDE;
        const w = Math.min(pw, right ? roomRight : roomLeft);
        width = `width:${w}px;`;
        left = right ? r.right + pad + gap : r.left - pad - gap - w;
        top = Math.max(r.top, 12);
      } else {
        // else inside its bottom-right corner, where terminal output hasn't reached yet.
        top = Math.min(vh, r.bottom) - ph - 20;
        left = r.right - pw - 20;
      }
    }
    top = Math.max(12, Math.min(vh - ph - 12, top));
    if (!width) left = Math.max(12, Math.min(vw - pw - 12, left));
    pop.style.cssText = `top:${top}px;left:${left}px;${width}`;
  }

  function start() {
    if (!layer) build();
    layer.hidden = false;
    document.body.classList.add('touring');
    show(0);
  }

  function finish() {
    if (busy && index !== STEPS.length - 1) {
      // Let a running step's typing finish before closing.
      setTimeout(finish, 100);
      return;
    }
    try { window.sessionStorage.setItem(TOURED_KEY, '1'); } catch (e) { /* ignore */ }
    if (index !== STEPS.length - 1) STEPS[STEPS.length - 1].action();
    layer.hidden = true;
    document.body.classList.remove('touring');
    T.focus();
  }

  window.DemoTour = { start, finish, get step() { return index; }, get open() { return !!layer && !layer.hidden; }, get busy() { return busy; } };

  // First visit in this tab: start the tour automatically.
  let toured = false;
  try { toured = window.sessionStorage.getItem(TOURED_KEY) === '1'; } catch (e) { /* ignore */ }
  if (!toured) setTimeout(start, 300);
})();
