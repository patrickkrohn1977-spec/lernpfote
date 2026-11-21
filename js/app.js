import * as E from './engine.js';
import { SUBJECTS, COMING } from './subjects/index.js';
import { checkAnswer, ERROR_TAGS } from './check.js';
import { parse, toHTML } from './mathparse.js';
import { catSVG } from './cat.js';
import { renderPhotos } from './photos.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = () => $('#app');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const M = s => String(s ?? '').replace(/\\f\{([^}]*)\}\{([^}]*)\}/g, '<span class="fr"><span>$1</span><span>$2</span></span>');
const barColor = m => (m >= 65 ? 'var(--good)' : m >= 40 ? 'var(--mid)' : 'var(--low)');

let ui = { screen: 'home' };
let quiz = null;

// ---------------- Ton ----------------
let actx;
function tone(kind) {
  if (!E.S.settings.sound) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = { correct: [660, 880, 1320], almost: [600, 700], wrong: [330, 262], fanfare: [523, 659, 784, 1047] }[kind];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t = actx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.3);
    });
  } catch {}
}

function confetti(n = 18) {
  const box = document.createElement('div'); box.className = 'confetti';
  const items = ['🐾', '✨', '🩰', '⭐', '💖', '🐱'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = items[i % items.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 0.4 + 's';
    s.style.fontSize = 16 + Math.random() * 18 + 'px';
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2200);
}

function toast(text) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}

// ---------------- Navigation ----------------
function go(screen, extra = {}) { ui = { screen, ...extra }; render(); window.scrollTo(0, 0); }

const NAV = [['home', '🏠', 'Start'], ['topics', '📚', 'Themen'], ['stand', '📊', 'Stand'], ['more', '⚙️', 'Mehr']];
const nav = () => `<nav class="tabbar">${NAV.map(([id, ic, l]) => `<button data-go="${id}" class="${ui.screen === id || (id === 'topics' && ui.screen === 'topic') ? 'on' : ''}"><span>${ic}</span>${l}</button>`).join('')}</nav>`;

function render() {
  const s = E.S;
  if (!s.profile) return renderSetup();
  const scr = { home: renderHome, topics: renderTopics, topic: renderTopic, quiz: renderQuiz, summary: renderSummary, stand: renderStand, more: renderMore, test: renderTestForm, photos: () => renderPhotos({ app, esc, go, toast, nav, SUBJECTS, E }) }[ui.screen] || renderHome;
  scr();
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}

// ---------------- Start ----------------
function renderSetup() {
  app().innerHTML = `<main class="setup">
    ${catSVG('happy', 140)}
    <h1>Hallo! Ich bin Pirouette.</h1>
    <p>Ich helfe dir beim Lernen – mit kurzen Runden, Tipps und ganz viel Applaus. 🩰</p>
    <label class="field"><span>Wie heißt du?</span><input id="name" autocomplete="off" placeholder="Dein Vorname" maxlength="20"></label>
    <button class="btn primary big" id="start">Los geht's! 🐾</button>
  </main>`;
  const go_ = () => { const n = $('#name').value.trim(); if (!n) return $('#name').focus(); E.S.profile = { name: n, created: Date.now() }; E.save(); go('home'); };
  $('#start').onclick = go_;
  $('#name').onkeydown = e => { if (e.key === 'Enter') go_(); };
}

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : 'Guten Abend';
}

function currentCard() {
  const cur = SUBJECTS.mathe.topics.filter(t => t.current);
  if (!cur.length) return '';
  return `<section class="card"><div class="eyebrow">⭐ Aktueller Stoff aus deinem Hefter</div>${cur.map(t => { const tm = E.topicMastery(t); return `<button class="skill-row" data-topicq="${t.id}"><span>${t.icon} ${esc(t.name)}</span><span class="pill" style="background:${tm.tried ? barColor(tm.m) : 'var(--accent2)'}">${tm.tried ? tm.m + ' %' : 'neu'}</span></button>`; }).join('')}</section>`;
}

function renderHome() {
  const s = E.S, r = E.rankInfo(), st = E.streak(), today = E.todayStats();
  const tests = E.upcomingTests();
  const past = E.pastUngradedTest();
  const w = E.rangeStats(6, 0), lw = E.rangeStats(13, 7);
  const gaps = E.allSkills('mathe').filter(p => E.isGap(p.skill.id));
  const testCards = tests.map(t => {
    const d = E.daysUntil(t.date), plan = E.testPlan(t);
    const topics = (t.topics?.length ? t.topics : SUBJECTS[t.subject].topics.map(x => x.id)).map(id => SUBJECTS[t.subject].topics.find(x => x.id === id)?.name).filter(Boolean);
    return `<section class="card test">
      <div class="row between"><div><div class="eyebrow">${SUBJECTS[t.subject].icon} ${SUBJECTS[t.subject].short}-Test</div>
      <div class="count">${d === 0 ? 'Heute!' : d === 1 ? 'Morgen!' : `noch <b>${d}</b> Tage`}</div><div class="muted small">${E.fmtDate(t.date)}${t.note ? ' · ' + esc(t.note) : ''}</div></div>
      <div class="ring" style="--p:${plan.ready}"><span>${plan.ready}%</span><small>bereit</small></div></div>
      <div class="small muted">Themen: ${topics.map(esc).join(', ')}</div>
      ${plan.weak.length ? `<div class="plan">Heute dran: <b>${plan.rounds} ${plan.rounds === 1 ? 'Runde' : 'Runden'}</b> · Fokus: ${plan.weak.map(p => esc(p.skill.name)).join(', ')}</div>` : ''}
      <button class="btn primary" data-test="${t.id}">Testtraining starten 🎯</button>
    </section>`;
  }).join('');

  app().innerHTML = `<main>
    <header class="hello">
      <div>${catSVG(today.answered ? 'happy' : 'neutral', 78)}</div>
      <div><h1>${greeting()}, ${esc(s.profile.name)}!</h1>
      <div class="muted">${st ? `🔥 ${st} ${st === 1 ? 'Tag' : 'Tage'} in Folge` : 'Starte heute deine Serie! 🔥'}</div></div>
    </header>

    <section class="card rank">
      <div class="row between"><div><span class="rank-ic">${r.cur.icon}</span> <b>${r.cur.name}</b></div><div class="muted small">${s.xp} XP</div></div>
      <div class="bar"><i style="width:${r.pct}%"></i></div>
      <div class="small muted">${r.next ? `Noch ${r.next.xp - s.xp} XP bis <b>${r.next.name}</b> ${r.next.icon}` : 'Höchster Rang erreicht! 💎'}</div>
    </section>

    ${past ? `<section class="card notice"><b>Wie lief der Test am ${E.fmtDate(past.date)}?</b><div class="grades">${[1, 2, 3, 4, 5, 6].map(g => `<button class="btn chip" data-grade="${g}">${g}</button>`).join('')}</div><button class="link small" data-gradeskip>Noch keine Note</button></section>` : ''}

    ${testCards || `<section class="card test empty"><b>📅 Wann ist der nächste Mathetest?</b><p class="small muted">Trag ihn ein – dann weiß ich, wie viele Tage wir noch haben, und plane dein Training.</p><button class="btn" data-go="test">Test eintragen</button></section>`}

    ${currentCard()}
    <button class="btn primary big" id="train">Training starten ▶︎<small>8 Aufgaben · passt sich dir an</small></button>
    ${s.review.length ? `<button class="btn soft" id="review">🔁 Fehler wiederholen <span class="badge">${s.review.length}</span></button>` : ''}

    <section class="card">
      <div class="eyebrow">Du gegen dich selbst</div>
      <div class="vs">
        <div><b>${w.xp}</b><small>XP diese Woche</small></div>
        <div class="vs-mid">${w.xp >= lw.xp && w.xp > 0 ? '⬆️' : '🎯'}</div>
        <div><b>${lw.xp}</b><small>XP letzte Woche</small></div>
      </div>
      <div class="small muted center">${w.xp > lw.xp ? 'Du bist schon besser als letzte Woche! 🎉' : lw.xp ? `Noch ${lw.xp - w.xp + 1} XP, dann hast du die letzte Woche geschlagen.` : 'Sammle XP und schlage nächste Woche deinen Rekord.'} · Rekord-Serie: ${s.records.bestCombo} in Folge</div>
    </section>

    ${gaps.length ? `<section class="card"><div class="eyebrow">Hier trainieren wir gezielt</div>${gaps.slice(0, 3).map(p => `<button class="skill-row" data-skill="${p.skill.id}"><span>⚠️ ${esc(p.skill.name)}</span><span class="pill" style="background:${barColor(E.stat(p.skill.id).m)}">${Math.round(E.stat(p.skill.id).m)}%</span></button>`).join('')}</section>` : ''}

    <button class="btn soft" id="newstuff" data-go="photos" style="width:100%">📷 Neuer Stoff? Fotos an deine Eltern schicken</button>

    <section class="subjects">
      ${Object.values(SUBJECTS).map(sub => `<button class="subject" data-go="topics" style="--c:${sub.color}"><span>${sub.icon}</span>${sub.name}</button>`).join('')}
      ${COMING.map(c => `<div class="subject soon"><span>${c.icon}</span>${c.name}<small>bald</small></div>`).join('')}
    </section>
  </main>${nav()}`;

  $('#train').onclick = () => startQuiz({ mode: 'train' });
  if ($('#review')) $('#review').onclick = () => startQuiz({ mode: 'review' });
  $$('[data-test]').forEach(b => b.onclick = () => startQuiz({ mode: 'test', testId: b.dataset.test }));
  $$('[data-skill]').forEach(b => b.onclick = () => startQuiz({ mode: 'skill', skillId: b.dataset.skill }));
  $$('[data-topicq]').forEach(b => b.onclick = () => go('topic', { topicId: b.dataset.topicq }));
  $$('[data-grade]').forEach(b => b.onclick = () => { past.grade = +b.dataset.grade; E.save(); toast(past.grade <= 2 ? 'Wow, super! 🎉🐱' : 'Danke! Weiter geht’s – wir schaffen das. 💪'); render(); });
  if ($('[data-gradeskip]')) $('[data-gradeskip]').onclick = () => { past.skipGrade = true; E.save(); render(); };
}

// ---------------- Themen ----------------
function renderTopics() {
  const sub = SUBJECTS.mathe;
  app().innerHTML = `<main><h1>${sub.icon} ${sub.name}</h1><p class="muted">Wähle ein Thema. Die Balken zeigen, wie sicher du schon bist.</p>
    ${sub.topics.map(t => { const tm = E.topicMastery(t); return `<button class="card topic" data-topic="${t.id}">
      <span class="t-ic">${t.icon}</span><span class="t-main"><b>${esc(t.name)}</b>${t.current ? ' <span class="tag">⭐ aktuell</span>' : ''}<span class="bar"><i style="width:${tm.m}%;background:${barColor(tm.m)}"></i></span>
      <small class="muted">${tm.tried ? `${tm.m} % · ${tm.tried}/${tm.total} Fertigkeiten geübt` : 'noch nicht geübt'}</small></span><span class="chev">›</span></button>`; }).join('')}
  </main>${nav()}`;
  $$('[data-topic]').forEach(b => b.onclick = () => go('topic', { topicId: b.dataset.topic }));
}

function renderTopic() {
  const t = SUBJECTS.mathe.topics.find(x => x.id === ui.topicId);
  app().innerHTML = `<main><button class="link" data-go="topics">‹ Themen</button><h1>${t.icon} ${esc(t.name)}</h1>
    <button class="btn primary big" id="all">Ganzes Thema üben ▶︎</button>
    ${t.skills.map(s => { const st = E.stat(s.id); return `<button class="card skill" data-skill="${s.id}">
      <span class="t-main"><b>${E.isGap(s.id) ? '⚠️ ' : st.m >= 85 ? '🐾 ' : ''}${esc(s.name)}</b><span class="bar"><i style="width:${st.m}%;background:${barColor(st.m)}"></i></span>
      <small class="muted">${st.n ? `${Math.round(st.m)} % · ${E.masteryLabel(st.m)} · ${st.c}/${st.n} richtig` : 'noch nicht geübt'}</small></span><span class="chev">▶︎</span></button>`; }).join('')}
  </main>${nav()}`;
  $('#all').onclick = () => startQuiz({ mode: 'topic', topicId: t.id });
  $$('[data-skill]').forEach(b => b.onclick = () => startQuiz({ mode: 'skill', skillId: b.dataset.skill }));
}

// ---------------- Quiz ----------------
function startQuiz(opts) {
  const items = E.buildSession(opts);
  if (!items.length) return toast('Keine Aufgaben gefunden.');
  quiz = { opts, items, i: 0, combo: 0, xp: 0, correct: 0, total: 0, hints: 0, extra: 0, startXP: E.S.xp, startRank: E.rankInfo().cur.name };
  initItem();
  go('quiz');
}

function initItem() {
  quiz.phase = 'answer'; quiz.usedHint = false; quiz.stepIdx = 0; quiz.stepResults = []; quiz.feedback = null; quiz.pad = quiz.pad || false;
}

function graphSVG({ mn, md, n }) {
  const W = 12, sc = 22, size = W * sc + 20, o = size / 2;
  const X = x => o + x * sc, Y = y => o - y * sc;
  let g = '';
  for (let i = -6; i <= 6; i++) {
    g += `<line x1="${X(i)}" y1="${Y(-6)}" x2="${X(i)}" y2="${Y(6)}" class="grid"/><line x1="${X(-6)}" y1="${Y(i)}" x2="${X(6)}" y2="${Y(i)}" class="grid"/>`;
    if (i && i % 2 === 0) g += `<text x="${X(i)}" y="${Y(0) + 14}" class="lab">${i < 0 ? '−' + -i : i}</text><text x="${X(0) - 8}" y="${Y(i) + 4}" class="lab" text-anchor="end">${i < 0 ? '−' + -i : i}</text>`;
  }
  const m = mn / md, f = x => m * x + n;
  const x1 = -6.5, x2 = 6.5;
  const pts = [];
  for (let x = -6; x <= 6; x++) { const y = f(x); if (Number.isInteger(Math.round(y * 1e9) / 1e9) && Math.abs(y) <= 6) pts.push([x, y]); }
  return `<svg class="graph" viewBox="0 0 ${size} ${size}" role="img" aria-label="Graph einer Geraden">
    <defs><clipPath id="clip"><rect x="${X(-6)}" y="${Y(6)}" width="${12 * sc}" height="${12 * sc}"/></clipPath></defs>
    ${g}<line x1="${X(-6.3)}" y1="${Y(0)}" x2="${X(6.3)}" y2="${Y(0)}" class="axis"/><line x1="${X(0)}" y1="${Y(-6.3)}" x2="${X(0)}" y2="${Y(6.3)}" class="axis"/>
    <text x="${X(6.2)}" y="${Y(0) - 6}" class="lab">x</text><text x="${X(0) + 6}" y="${Y(6.1)}" class="lab">y</text>
    <line x1="${X(x1)}" y1="${Y(f(x1))}" x2="${X(x2)}" y2="${Y(f(x2))}" class="fn" clip-path="url(#clip)"/>
    ${pts.map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="3.2" class="pt"/>`).join('')}
  </svg>`;
}

function treeSVG(t) {
  const f = ([n, d]) => { const g = (a, b) => (b ? g(b, a % b) : a); const k = g(n, d); return `${n / k}/${d / k}`; };
  const c = ([n, d]) => [d - n, d];
  const L = (x1, y1, x2, y2, lab, up) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="axis"/><text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + (up ? -7 : 15)}" class="tlab">${lab}</text>`;
  const N = (x, y, txt) => `<circle cx="${x}" cy="${y}" r="17" class="node"/><text x="${x}" y="${y + 4}" class="tnode">${txt}</text>`;
  const a = t.a, b = t.b;
  return `<svg class="graph tree" viewBox="0 0 330 220" role="img" aria-label="Baumdiagramm">
    ${L(20, 110, 128, 55, f(t.p), true)}${L(20, 110, 128, 165, f(c(t.p)), false)}
    ${L(147, 55, 283, 25, f(t.q[0]), true)}${L(147, 55, 283, 85, f(c(t.q[0])), false)}
    ${L(147, 165, 283, 135, f(t.q[1]), true)}${L(147, 165, 283, 195, f(c(t.q[1])), false)}
    ${N(130, 55, a)}${N(130, 165, b)}${N(300, 25, a)}${N(300, 85, b)}${N(300, 135, a)}${N(300, 195, b)}
  </svg>`;
}

function currentSpec() {
  const q = quiz.items[quiz.i].q;
  return q.answer.type === 'steps' ? q.steps[quiz.stepIdx] : { answer: q.answer, text: null };
}

function inputHTML(spec) {
  const a = spec.answer;
  const isTerm = a.type === 'term';
  const vs = isTerm ? [...new Set(String(a.value).replace(/[^a-z]/g, ''))].sort() : [];
  const keys = isTerm ? [...vs, '²', '³', '^', '(', ')', '+', '−', '/', ','] : ['/', '−', ',', '+', '(', ')', ...(a.prob || a.tol ? ['%'] : [])];
  const kb = `<div class="keys">${keys.map(k => `<button type="button" class="key" data-key="${k}">${k}</button>`).join('')}<button type="button" class="key" data-key="⌫">⌫</button></div>`;
  if (a.type === 'pair') {
    return `<div class="pair">${a.fields.map((f, i) => `<label><span>${esc(f.label)} =</span><input class="ans" data-i="${i}" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></label>`).join('')}</div>${kb}`;
  }
  return `<div class="ans-wrap"><input class="ans" data-i="0" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="${isTerm ? 'z. B. 3x² − 2x + 1' : 'z. B. 3/4 oder −2,5'}"></div>
    <div class="preview" id="preview"></div>${kb}`;
}

function renderQuiz() {
  const item = quiz.items[quiz.i], q = item.q;
  const f = E.findSkill(item.skillId);
  const n = quiz.items.length;
  const isSteps = q.answer.type === 'steps';
  const fb = quiz.feedback;
  const stepsDone = isSteps ? q.steps.slice(0, quiz.stepIdx).map((s, i) => {
    const r = quiz.stepResults[i];
    return `<div class="step done ${r.status}"><div class="small">${esc(s.text)}</div><div>${r.status === 'correct' ? '✅' : r.status === 'almost' ? '🟡' : '❌'} ${M(esc(r.givenText))}${r.status !== 'correct' ? ` <span class="muted">→ richtig: <b>${M(s.answerText)}</b></span>` : ''}</div></div>`;
  }).join('') : '';
  const cur = currentSpec();

  app().innerHTML = `<main class="quiz">
    <div class="qtop">
      <button class="link" id="quit">✕</button>
      <div class="dots">${quiz.items.map((_, i) => `<i class="${i < quiz.i ? 'done' : i === quiz.i ? 'now' : ''}"></i>`).join('')}</div>
      <div class="combo ${quiz.combo >= 3 ? 'hot' : ''}">${quiz.combo >= 2 ? `🔥${quiz.combo}` : `${quiz.i + 1}/${n}`}</div>
    </div>
    <div class="meta"><span>${f.topic.icon} ${esc(f.skill.name)}</span><span class="stars">${'★'.repeat(q.diff || 1)}${'☆'.repeat(3 - (q.diff || 1))}</span>${item.reviewId ? '<span class="tag">🔁 Wiederholung</span>' : ''}${item.secondChance ? '<span class="tag">✨ Zweite Chance</span>' : ''}</div>
    <section class="card qcard" id="qcard">
      <p class="qtext">${esc(q.text)}</p>
      ${q.math ? `<div class="math">${M(q.math)}</div>` : ''}
      ${q.graph ? graphSVG(q.graph) : ''}
      ${q.tree ? treeSVG(q.tree) : ''}
      ${stepsDone}
      ${quiz.phase === 'answer' ? `
        ${isSteps ? `<div class="step now"><div class="small"><b>${esc(cur.text)}</b></div></div>` : ''}
        ${inputHTML(cur)}
        <div class="hintbox" id="hintbox" ${quiz.usedHint ? '' : 'hidden'}>💡 ${M(esc(q.hint))}</div>
        <div class="row gap">
          <button class="btn soft" id="hint" ${quiz.usedHint ? 'disabled' : ''}>💡 Tipp</button>
          <button class="btn soft" id="padbtn">✏️ Notizblock</button>
          <button class="btn primary grow" id="check">Prüfen</button>
        </div>` : ''}
    </section>
    <section class="card pad" id="padcard" ${quiz.pad ? '' : 'hidden'}>
      <div class="row between"><b class="small">✏️ Notizblock – rechne hier Schritt für Schritt</b><span><button class="key" id="pen">✏️</button><button class="key" id="eraser">🧽</button><button class="key" id="clear">🗑️</button></span></div>
      <canvas id="canvas"></canvas>
    </section>
    ${fb ? feedbackHTML(fb, q) : ''}
  </main>`;

  $('#quit').onclick = () => { if (confirm('Runde abbrechen? Bisherige Antworten bleiben gespeichert.')) { quiz = null; go('home'); } };
  if (quiz.phase === 'answer') bindAnswer(cur);
  setupPad();
  if (fb) {
    $('#next').onclick = nextItem;
    if (fb.status === 'correct') confetti();
    $('#fb').scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}

function bindAnswer(cur) {
  const inputs = $$('.ans');
  let last = inputs[0];
  const isTerm = cur.answer.type === 'term';
  const upd = () => {
    const p = $('#preview'); if (!p) return;
    const v = inputs[0].value.trim();
    if (!v || !/[a-z\/^²(√]/i.test(v)) { p.innerHTML = ''; return; }
    try { p.innerHTML = `<span class="muted small">So lese ich das:</span> <span class="math sm">${toHTML(parse(v.replace(/^[a-z](\([a-z0-9]*\))?\s*=/i, '')))}</span>`; } catch (e) { p.innerHTML = `<span class="small warn">${esc(e.message)}</span>`; }
  };
  inputs.forEach(inp => {
    inp.onfocus = () => (last = inp);
    inp.oninput = upd;
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const i = +inp.dataset.i; if (inputs[i + 1] && !inputs[i + 1].value) inputs[i + 1].focus(); else submit(); } };
  });
  $$('.key[data-key]').forEach(k => {
    k.onpointerdown = e => e.preventDefault();
    k.onclick = () => {
      const inp = last, key = k.dataset.key;
      const s = inp.selectionStart ?? inp.value.length, e2 = inp.selectionEnd ?? s;
      if (key === '⌫') { const a = s === e2 ? Math.max(0, s - 1) : s; inp.value = inp.value.slice(0, a) + inp.value.slice(e2); inp.setSelectionRange(a, a); }
      else { const ins = key; inp.value = inp.value.slice(0, s) + ins + inp.value.slice(e2); inp.setSelectionRange(s + ins.length, s + ins.length); }
      inp.dispatchEvent(new Event('input'));
    };
  });
  $('#check').onclick = submit;
  $('#hint').onclick = () => { quiz.usedHint = true; quiz.hints++; $('#hintbox').hidden = false; $('#hint').disabled = true; };
  $('#padbtn').onclick = () => { quiz.pad = !quiz.pad; $('#padcard').hidden = !quiz.pad; if (quiz.pad) setupPad(true); };
  if (window.matchMedia('(pointer:fine)').matches || window.innerWidth > 700) setTimeout(() => inputs[0]?.focus(), 50);
  void isTerm;
}

function submit() {
  const item = quiz.items[quiz.i], q = item.q;
  const cur = currentSpec();
  const inputs = $$('.ans');
  const vals = inputs.map(i => i.value.trim());
  if (vals.some(v => !v)) { toast('Bitte erst eine Antwort eingeben 🐾'); return; }
  const given = cur.answer.type === 'pair' ? vals : vals[0];
  const r = checkAnswer(cur.answer, given);
  if (r.status === 'invalid') { toast(r.msg || 'Das kann ich nicht lesen.'); $('#qcard').classList.add('shake'); setTimeout(() => $('#qcard')?.classList.remove('shake'), 400); return; }
  const givenText = cur.answer.type === 'pair' ? cur.answer.fields.map((f, i) => `${f.label} = ${vals[i]}`).join(', ') : vals[0];

  if (q.answer.type === 'steps') {
    quiz.stepResults.push({ ...r, givenText, given });
    if (r.status !== 'correct') tone('wrong'); else tone('correct');
    if (r.msg && r.status !== 'correct') toast(r.msg);
    quiz.stepIdx++;
    if (quiz.stepIdx < q.steps.length) { render(); return; }
    const sc = quiz.stepResults.reduce((a, s) => a + (s.status === 'correct' ? 1 : s.status === 'almost' ? 0.5 : 0), 0) / q.steps.length;
    const status = sc >= 0.99 ? 'correct' : sc >= 0.5 ? 'almost' : 'wrong';
    const firstBad = quiz.stepResults.find(s => s.status !== 'correct');
    finishItem({ status, score: sc, msg: firstBad?.msg, tags: quiz.stepResults.map(s => s.tag).filter(Boolean), given: quiz.stepResults.map(s => s.givenText), stepsPerfect: sc >= 0.99 });
    return;
  }
  finishItem({ ...r, tags: r.tag ? [r.tag] : [], given: givenText });
}

function finishItem(r) {
  const item = quiz.items[quiz.i];
  if (r.status === 'correct') quiz.combo++; else quiz.combo = 0;
  const xp = E.record(item, { ...r, usedHint: quiz.usedHint }, quiz.combo);
  quiz.xp += xp; quiz.total++;
  if (r.status === 'correct') quiz.correct++;
  if (r.status === 'wrong' && !item.secondChance && !item.reviewId && quiz.extra < 3) {
    quiz.items.push(E.newSimilar(item)); quiz.extra++;
  }
  quiz.phase = 'feedback';
  quiz.feedback = { ...r, xp, combo: quiz.combo, text: E.msg(r.status) };
  tone(r.status === 'correct' ? 'correct' : r.status === 'almost' ? 'almost' : 'wrong');
  render();
}

function feedbackHTML(fb, q) {
  const head = { correct: '🎉 Richtig!', almost: '🟡 Fast!', wrong: '💭 Noch nicht ganz' }[fb.status];
  const showSol = fb.status !== 'correct';
  return `<section class="card fb ${fb.status}" id="fb">
    <div class="row"><div>${catSVG(fb.status === 'correct' ? (fb.combo >= 5 ? 'star' : 'happy') : fb.status === 'almost' ? 'think' : 'sad', 64)}</div>
    <div class="grow"><div class="fb-head">${head} <span class="xp">+${fb.xp} XP</span></div><div>${esc(fb.text)}</div>
    ${fb.combo >= 3 && fb.status === 'correct' ? `<div class="small"><b>🔥 ${fb.combo} richtig in Folge!</b></div>` : ''}</div></div>
    ${fb.msg ? `<div class="diag">🔎 ${esc(fb.msg)}</div>` : ''}
    ${fb.status !== 'correct' && fb.tags?.length ? `<div class="small muted">Fehlerart: ${[...new Set(fb.tags)].map(t => ERROR_TAGS[t] || t).join(', ')}</div>` : ''}
    ${fb.status !== 'correct' && !Array.isArray(fb.given) ? `<div class="small">Deine Antwort: <b>${esc(fb.given)}</b></div>` : ''}
    <div class="answer">Lösung: <b>${M(q.answerText)}</b></div>
    <details ${showSol ? 'open' : ''}><summary>Lösungsweg ansehen</summary><ol class="sol">${q.solution.map(l => `<li>${M(esc(l).replace(/&lt;br&gt;/g, '<br>'))}</li>`).join('')}</ol></details>
    ${fb.status === 'wrong' && !quiz.items[quiz.i].secondChance && !quiz.items[quiz.i].reviewId ? '<div class="small muted">✨ Am Ende der Runde bekommst du eine ähnliche Aufgabe als zweite Chance.</div>' : ''}
    <button class="btn primary big" id="next">${quiz.i + 1 < quiz.items.length ? 'Weiter ›' : 'Runde beenden 🏁'}</button>
  </section>`;
}

function nextItem() {
  quiz.i++;
  if (quiz.i >= quiz.items.length) return endQuiz();
  initItem(); render(); window.scrollTo(0, 0);
}

function endQuiz() {
  const res = E.finishSession({ total: quiz.total, correct: quiz.correct, xp: quiz.xp, hints: quiz.hints, mode: quiz.opts.mode });
  quiz.result = res;
  tone('fanfare');
  if (res.pct >= 75) confetti(30);
  go('summary');
}

// ---------------- Notizblock ----------------
function setupPad(force) {
  const c = $('#canvas'); if (!c || (!quiz.pad && !force)) return;
  const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
  c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (quiz.padImg) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, w, h); img.src = quiz.padImg; }
  let drawing = false, erase = false, lx = 0, ly = 0;
  const pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  c.onpointerdown = e => { drawing = true; [lx, ly] = pos(e); c.setPointerCapture(e.pointerId); };
  c.onpointermove = e => {
    if (!drawing) return;
    const [x, y] = pos(e);
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--ink');
    ctx.lineWidth = erase ? 22 : 1.5 + (e.pressure && e.pointerType === 'pen' ? e.pressure * 3 : 1.5);
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke(); [lx, ly] = [x, y];
  };
  c.onpointerup = c.onpointercancel = () => { drawing = false; try { quiz.padImg = c.toDataURL(); } catch {} };
  $('#pen').onclick = () => { erase = false; };
  $('#eraser').onclick = () => { erase = true; };
  $('#clear').onclick = () => { ctx.clearRect(0, 0, w, h); quiz.padImg = null; };
}

// ---------------- Zusammenfassung ----------------
function renderSummary() {
  const r = quiz.result, rank = E.rankInfo();
  const rankUp = rank.cur.name !== quiz.startRank;
  const cmp = r.avg === null ? 'Deine erste Runde – das ist ab jetzt dein Maßstab!' : r.pct > r.avg ? `Besser als dein Durchschnitt (${r.avg} %)! 📈` : r.pct === r.avg ? `Genau dein Durchschnitt (${r.avg} %).` : `Dein Durchschnitt liegt bei ${r.avg} % – nächstes Mal knackst du ihn!`;
  app().innerHTML = `<main class="summary">
    ${catSVG(r.pct >= 75 ? 'star' : r.pct >= 50 ? 'happy' : 'neutral', 120)}
    <h1>${r.pct === 100 ? 'Perfekte Vorstellung!' : r.pct >= 75 ? 'Toll getanzt!' : r.pct >= 50 ? 'Gute Runde!' : 'Weiter üben lohnt sich!'}</h1>
    <div class="big-ring" style="--p:${r.pct}"><span>${quiz.correct}/${quiz.total}</span><small>${r.pct} %</small></div>
    <div class="stats3"><div><b>+${quiz.xp}</b><small>XP</small></div><div><b>${E.S.records.bestCombo}</b><small>Rekord-Serie</small></div><div><b>${E.streak()}</b><small>Tage in Folge</small></div></div>
    ${r.newRecordPct ? '<div class="card notice center">🏆 <b>Neuer persönlicher Rekord!</b></div>' : ''}
    <p class="center">${cmp}</p>
    ${rankUp ? `<div class="card notice center">🎊 Neuer Rang: <b>${rank.cur.icon} ${rank.cur.name}</b></div>` : ''}
    ${r.newBadges.length ? `<div class="card"><div class="eyebrow">Neue Abzeichen</div>${r.newBadges.map(b => `<div class="badge-row"><span>${E.BADGES[b].icon}</span><div><b>${E.BADGES[b].name}</b><div class="small muted">${E.BADGES[b].desc}</div></div></div>`).join('')}</div>` : ''}
    <button class="btn primary big" id="again">Noch eine Runde ▶︎</button>
    <button class="btn soft" data-go="home">Zur Startseite</button>
  </main>`;
  $('#again').onclick = () => startQuiz(quiz.opts.mode === 'review' && !E.S.review.length ? { mode: 'train' } : quiz.opts);
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}

// ---------------- Lernstand ----------------
function renderStand() {
  const s = E.S, r = E.rankInfo(), w = E.rangeStats(6, 0), lw = E.rangeStats(13, 7);
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return { d, x: s.days[E.dayKey(d)] }; });
  const maxA = Math.max(8, ...days.map(d => d.x?.answered || 0));
  const errs = Object.entries(s.errors).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxE = Math.max(1, ...errs.map(e => e[1]));
  app().innerHTML = `<main><h1>📊 Lernstand</h1>
    <section class="card"><div class="stats3">
      <div><b>${r.cur.icon}</b><small>${r.cur.name}</small></div>
      <div><b>${w.answered ? Math.round((w.correct / w.answered) * 100) : '–'}${w.answered ? ' %' : ''}</b><small>richtig (7 Tage)</small></div>
      <div><b>${w.answered}</b><small>Aufgaben (7 Tage)</small></div></div>
      <div class="small muted center">Vorwoche: ${lw.answered} Aufgaben, ${lw.answered ? Math.round((lw.correct / lw.answered) * 100) + ' %' : '–'} richtig</div>
      <div class="days">${days.map(({ d, x }) => `<div title="${d.toLocaleDateString('de-DE')}"><i style="height:${((x?.answered || 0) / maxA) * 100}%"></i><small>${'SMDMDFS'[d.getDay()]}</small></div>`).join('')}</div>
    </section>
    ${E.upcomingTests().map(t => `<section class="card"><div class="row between"><b>🎯 ${SUBJECTS[t.subject].short}-Test am ${E.fmtDate(t.date)}</b><span class="pill" style="background:${barColor(E.readiness(t))}">${E.readiness(t)} % bereit</span></div><div class="small muted">noch ${E.daysUntil(t.date)} Tage</div></section>`).join('')}
    ${Object.values(SUBJECTS).map(sub => sub.topics.map(t => { const tm = E.topicMastery(t); return `<section class="card"><details><summary class="row between"><span>${t.icon} <b>${esc(t.name)}</b></span><span class="pill" style="background:${tm.tried ? barColor(tm.m) : 'var(--line)'}">${tm.tried ? tm.m + ' %' : '–'}</span></summary>
      ${t.skills.map(sk => { const st = E.stat(sk.id); const tags = Object.entries(st.tags || {}).sort((a, b) => b[1] - a[1]).slice(0, 2); return `<div class="sk"><div class="row between small"><span>${E.isGap(sk.id) ? '⚠️ ' : ''}${esc(sk.name)}</span><span>${st.n ? Math.round(st.m) + ' %' : '–'}</span></div><div class="bar thin"><i style="width:${st.m}%;background:${barColor(st.m)}"></i></div>${st.n ? `<div class="tiny muted">${st.c}/${st.n} richtig${tags.length ? ' · Fehler: ' + tags.map(([k, v]) => `${ERROR_TAGS[k] || k} ${v}×`).join(', ') : ''}</div>` : ''}</div>`; }).join('')}
    </details></section>`; }).join('')).join('')}
    <section class="card"><div class="eyebrow">Häufigste Fehlerarten</div>${errs.length ? errs.map(([k, v]) => `<div class="err"><span>${ERROR_TAGS[k] || k}</span><span class="bar thin"><i style="width:${(v / maxE) * 100}%;background:var(--accent)"></i></span><b>${v}</b></div>`).join('') : '<p class="small muted">Noch keine Fehler erfasst.</p>'}</section>
    <section class="card"><div class="eyebrow">Abzeichen (${Object.keys(s.badges).length}/${Object.keys(E.BADGES).length})</div><div class="badges">${Object.entries(E.BADGES).map(([id, b]) => `<div class="${s.badges[id] ? '' : 'locked'}" title="${esc(b.desc)}"><span>${b.icon}</span><small>${b.name}</small></div>`).join('')}</div></section>
    <section class="card"><div class="eyebrow">Für Eltern</div><p class="small muted">Schicke den Bericht per WhatsApp/iMessage weiter. Den Text kannst du auch Claude geben – dann werden neue Aufgaben genau auf die Lücken zugeschnitten.</p>
      <button class="btn primary" id="share">📤 Bericht teilen</button> <button class="btn soft" id="show">Bericht anzeigen</button>
      <textarea id="rep" readonly hidden></textarea></section>
  </main>${nav()}`;
  $('#share').onclick = async () => {
    const text = E.reportText();
    try { if (navigator.share) { await navigator.share({ title: 'Lernstand', text }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('Bericht kopiert 📋'); } catch { $('#rep').hidden = false; $('#rep').value = text; }
  };
  $('#show').onclick = () => { const t = $('#rep'); t.hidden = !t.hidden; t.value = E.reportText(); };
}

// ---------------- Tests & Einstellungen ----------------
function renderTestForm() {
  const sub = SUBJECTS.mathe;
  const t = ui.edit ? E.S.tests.find(x => x.id === ui.edit) : null;
  const min = E.dayKey();
  app().innerHTML = `<main><button class="link" data-go="${ui.back || 'home'}">‹ Zurück</button><h1>📅 ${t ? 'Test bearbeiten' : 'Test eintragen'}</h1>
    <section class="card">
      <label class="field"><span>Fach</span><select id="subj">${Object.values(SUBJECTS).map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></label>
      <label class="field"><span>Datum</span><input type="date" id="date" min="${min}" value="${t?.date || ''}"></label>
      <div class="field"><span>Welche Themen kommen dran?</span>${sub.topics.map(tp => `<label class="check"><input type="checkbox" value="${tp.id}" ${(t ? t.topics.includes(tp.id) : tp.current) ? 'checked' : ''}> ${tp.icon} ${esc(tp.name)}${tp.current ? ' ⭐' : ''}</label>`).join('')}<small class="muted">⭐ = aktueller Stoff aus dem Hefter (schon angekreuzt) · Nichts angekreuzt = alle Themen</small></div>
      <label class="field"><span>Notiz (optional)</span><input id="note" maxlength="60" placeholder="z. B. Klassenarbeit Nr. 2" value="${esc(t?.note || '')}"></label>
      <button class="btn primary big" id="save">Speichern</button>
      ${t ? '<button class="btn danger" id="del">Test löschen</button>' : ''}
    </section></main>`;
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  $('#save').onclick = () => {
    const date = $('#date').value;
    if (!date) return toast('Bitte ein Datum wählen 📅');
    const topics = $$('.check input:checked').map(i => i.value);
    const data = { subject: $('#subj').value, date, topics, note: $('#note').value.trim() };
    if (t) Object.assign(t, data); else E.S.tests.push({ id: Math.random().toString(36).slice(2), ...data });
    E.save(); toast(`Eingetragen! Noch ${E.daysUntil(date)} Tage – wir schaffen das 💪`); go(ui.back || 'home');
  };
  if ($('#del')) $('#del').onclick = () => { if (confirm('Test wirklich löschen?')) { E.S.tests = E.S.tests.filter(x => x.id !== t.id); E.save(); go(ui.back || 'home'); } };
}

function renderMore() {
  const s = E.S;
  app().innerHTML = `<main><h1>⚙️ Mehr</h1>
    <section class="card"><div class="eyebrow">Neuer Stoff</div><p class="small muted">Fotos von Hefter oder Arbeitsblättern aufnehmen und an die Eltern schicken – daraus werden neue Aufgaben.</p><button class="btn" data-go="photos">📷 Fotos schicken</button></section>
    <section class="card"><div class="eyebrow">Tests</div>
      ${s.tests.length ? s.tests.slice().sort((a, b) => b.date.localeCompare(a.date)).map(t => `<button class="skill-row" data-edit="${t.id}"><span>${SUBJECTS[t.subject].icon} ${E.fmtDate(t.date)}${t.note ? ' · ' + esc(t.note) : ''}</span><span class="muted small">${t.grade ? 'Note ' + t.grade : E.daysUntil(t.date) >= 0 ? 'in ' + E.daysUntil(t.date) + ' T.' : 'vorbei'} ›</span></button>`).join('') : '<p class="small muted">Noch kein Test eingetragen.</p>'}
      <button class="btn" id="addtest">+ Test eintragen</button></section>
    <section class="card"><div class="eyebrow">Einstellungen</div>
      <label class="field"><span>Name</span><input id="name" value="${esc(s.profile.name)}" maxlength="20"></label>
      <label class="check"><input type="checkbox" id="sound" ${s.settings.sound ? 'checked' : ''}> 🔔 Töne an</label></section>
    <section class="card"><div class="eyebrow">Sicherung</div>
      <p class="small muted">Der Fortschritt wird nur auf diesem Gerät gespeichert. Mit einem Sicherungscode kannst du ihn auf ein anderes Gerät (z. B. iPad) übertragen.</p>
      <button class="btn soft" id="exp">Sicherungscode erzeugen</button> <button class="btn soft" id="imp">Code einspielen</button>
      <textarea id="code" hidden placeholder="Sicherungscode hier einfügen"></textarea><button class="btn" id="impgo" hidden>Einspielen</button></section>
    <section class="card"><div class="eyebrow">Als App auf den Home-Bildschirm</div>
      <ol class="small"><li>Diese Seite in <b>Safari</b> öffnen</li><li>Unten (iPhone) bzw. oben (iPad) auf <b>Teilen</b> ⬆️ tippen</li><li><b>„Zum Home-Bildschirm“</b> wählen</li></ol>
      <p class="small muted">Tipp fürs iPad: Mit dem Apple Pencil kannst du direkt ins Antwortfeld schreiben (Scribble) und im ✏️ Notizblock rechnen.</p></section>
    <section class="card"><button class="btn danger" id="reset">Alles zurücksetzen</button></section>
    <p class="tiny muted center">Lernpfote · Version 1.2</p>
  </main>${nav()}`;
  $('#addtest').onclick = () => go('test', { back: 'more' });
  $$('[data-edit]').forEach(b => b.onclick = () => go('test', { edit: b.dataset.edit, back: 'more' }));
  $('#name').onchange = e => { const v = e.target.value.trim(); if (v) { s.profile.name = v; E.save(); toast('Gespeichert'); } };
  $('#sound').onchange = e => { s.settings.sound = e.target.checked; E.save(); };
  $('#exp').onclick = async () => { const c = E.exportBackup(); const t = $('#code'); t.hidden = false; t.value = c; try { await navigator.clipboard.writeText(c); toast('Code kopiert 📋'); } catch {} };
  $('#imp').onclick = () => { $('#code').hidden = false; $('#code').value = ''; $('#impgo').hidden = false; };
  $('#impgo').onclick = () => { try { E.importBackup($('#code').value); toast('Eingespielt ✅'); go('home'); } catch { toast('Der Code ist ungültig.'); } };
  $('#reset').onclick = () => { if (confirm('Wirklich ALLES löschen (Fortschritt, XP, Tests)?') && confirm('Ganz sicher?')) { E.resetAll(); go('home'); } };
}

// ---------------- Start ----------------
E.load();
render();

