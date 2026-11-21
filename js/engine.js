// Lern-Engine: Fortschritt, Lücken-Erkennung, adaptive Aufgabenauswahl, Belohnungen.
import { SUBJECTS, PRESET_TESTS } from './subjects/index.js';
import { ERROR_TAGS } from './check.js';

const KEY = 'lernpfote_v1';
const ROUND = 8;

export const RANKS = [
  { xp: 0, name: 'Ballettmaus', icon: '🐭' },
  { xp: 150, name: 'Elevin', icon: '🩰' },
  { xp: 500, name: 'Corps de ballet', icon: '💃' },
  { xp: 1100, name: 'Coryphée', icon: '🌸' },
  { xp: 2000, name: 'Solistin', icon: '⭐' },
  { xp: 3500, name: 'Erste Solistin', icon: '🌟' },
  { xp: 5500, name: 'Primaballerina', icon: '👑' },
  { xp: 8500, name: 'Primaballerina assoluta', icon: '💎' },
];

export const BADGES = {
  first: { name: 'Erster Auftritt', icon: '🎀', desc: 'Erste Runde geschafft' },
  perfect: { name: 'Perfekte Pirouette', icon: '🩰', desc: 'Eine Runde ohne Fehler' },
  combo5: { name: 'Katzensprung', icon: '🐈', desc: '5 richtig hintereinander' },
  combo10: { name: 'Grand Jeté', icon: '🦢', desc: '10 richtig hintereinander' },
  streak3: { name: 'Dranbleiberin', icon: '🔥', desc: '3 Tage hintereinander geübt' },
  streak7: { name: 'Wochen-Star', icon: '🏆', desc: '7 Tage hintereinander geübt' },
  master: { name: 'Meisterpfote', icon: '🐾', desc: 'Eine Fertigkeit gemeistert (über 85 %)' },
  steps: { name: 'Schritt für Schritt', icon: '🪜', desc: '5 Schritt-Aufgaben komplett richtig' },
  noHint: { name: 'Ganz allein', icon: '😼', desc: 'Runde mit 7+ richtig ohne Tipp' },
  review: { name: 'Zweite Chance', icon: '🔁', desc: '10 alte Fehler ausgebügelt' },
  xp1000: { name: 'Tausend Pfoten', icon: '✨', desc: '1000 XP gesammelt' },
};

const MESSAGES = {
  correct: ['Perfekte Pirouette! 🩰', 'Miau-tastisch! 🐱', 'Wie eine Primaballerina! 👑', 'Pfoten hoch – richtig! 🐾', 'Elegant gelöst! ✨', 'Schnurr-genau richtig! 😺', 'Bravo! Applaus! 👏', 'Sauber getanzt – äh, gerechnet! 💃'],
  almost: ['Fast perfekt! Nur noch ein kleiner Schritt. 🐾', 'Beinahe! Schau dir den Hinweis an. 😺'],
  wrong: ['Kein Problem – genau so lernt man! 🐱', 'Auch Ballerinas üben jede Bewegung hundertmal. 🩰', 'Fehler sind Trainingsschritte. Schau dir den Lösungsweg an! 🐾', 'Gleich nochmal – du schaffst das! 💪'],
};
export const msg = k => MESSAGES[k][Math.floor(Math.random() * MESSAGES[k].length)];

// ---------- Zustand ----------
const fresh = () => ({
  v: 1, profile: null, xp: 0, days: {}, skills: {}, errors: {}, wrongLog: [], review: [],
  tests: [], records: { bestCombo: 0, bestPct: 0, sessions: [] }, badges: {}, counters: { stepsPerfect: 0, reviewFixed: 0 },
  settings: { sound: true },
});

export let S = fresh();
export function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) S = { ...fresh(), ...JSON.parse(raw) }; } catch {}
  applyPresets();
  return S;
}

// Tests, die über ein App-Update vorgegeben werden (z. B. von den Eltern genannt).
// Jeder wird nur einmal übernommen – löscht Amelie ihn, kommt er nicht wieder.
function applyPresets() {
  S.presetsSeen ||= [];
  for (const t of PRESET_TESTS) {
    if (S.presetsSeen.includes(t.id)) continue;
    S.presetsSeen.push(t.id);
    if (daysUntil(t.date) < 0) continue;
    if (S.tests.some(x => x.subject === t.subject && x.date === t.date)) continue;
    S.tests.push({ ...t, topics: [...t.topics] });
  }
  save();
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
export function resetAll() { S = fresh(); save(); }

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = () => (S.days[dayKey()] ||= { xp: 0, answered: 0, correct: 0, rounds: 0 });

// ---------- Fächer-Helfer ----------
export function findSkill(skillId) {
  for (const sub of Object.values(SUBJECTS)) for (const t of sub.topics) for (const s of t.skills) if (s.id === skillId) return { subject: sub, topic: t, skill: s };
  return null;
}
export const allSkills = subjectId => SUBJECTS[subjectId].topics.flatMap(t => t.skills.map(s => ({ topic: t, skill: s })));

export function stat(id) { return S.skills[id] || { m: 0, n: 0, c: 0, recent: [], last: 0, tags: {} }; }
export function isGap(id) {
  const s = stat(id);
  if (s.n < 3) return false;
  const r = s.recent.slice(-4);
  return s.m < 45 || r.filter(x => x === 0).length >= 2;
}
export const masteryLabel = m => (m >= 85 ? 'gemeistert' : m >= 65 ? 'sicher' : m >= 40 ? 'wird besser' : 'üben!');
export function topicMastery(topic) {
  const ss = topic.skills.map(s => stat(s.id));
  const tried = ss.filter(s => s.n > 0);
  return { m: Math.round(ss.reduce((a, s) => a + s.m, 0) / ss.length), tried: tried.length, total: ss.length };
}

function chooseDiff(id) {
  const s = stat(id);
  let d = s.m < 35 ? 1 : s.m < 70 ? 2 : 3;
  const r = s.recent.slice(-2);
  if (r.length === 2 && r[0] === 0 && r[1] === 0) d = Math.max(1, d - 1);
  return d;
}

// ---------- Runde zusammenstellen ----------
export function buildSession({ mode = 'train', subjectId = 'mathe', topicId, skillId, testId } = {}) {
  let pool = allSkills(subjectId);
  if (mode === 'topic') pool = pool.filter(p => p.topic.id === topicId);
  if (mode === 'skill') pool = pool.filter(p => p.skill.id === skillId);
  const test = mode === 'test' ? S.tests.find(t => t.id === testId) : null;
  if (test && test.topics?.length) pool = pool.filter(p => test.topics.includes(p.topic.id));
  const items = [];

  if (mode === 'review' || mode === 'train' || mode === 'test') {
    const due = S.review.filter(r => findSkill(r.skillId) && (mode === 'review' || Date.now() - r.addedAt > 6 * 3600e3) && (!test || !test.topics?.length || test.topics.includes(r.topicId)));
    const take = mode === 'review' ? ROUND : 2;
    for (const r of due.slice(0, take)) items.push({ skillId: r.skillId, topicId: r.topicId, diff: r.q.diff, q: r.q, reviewId: r.id });
    if (mode === 'review') return items;
  }

  const counts = {};
  const now = Date.now();
  while (items.length < ROUND && pool.length) {
    const weights = pool.map(({ skill, topic }) => {
      const s = stat(skill.id);
      let w = 1 + (100 - s.m) / 25;
      if (topic.current && mode === 'train') w *= 2.5;
      if (s.n === 0) w += 1.5;
      if (isGap(skill.id)) w *= 2.2;
      if (now - s.last < 3 * 60e3) w *= 0.5;
      const c = counts[skill.id] || 0;
      if (mode !== 'skill' && c >= (pool.length <= 3 ? 4 : 2)) w = 0;
      return w;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) break;
    let r = Math.random() * total, i = 0;
    while (r > weights[i]) { r -= weights[i]; i++; }
    const { skill, topic } = pool[Math.min(i, pool.length - 1)];
    counts[skill.id] = (counts[skill.id] || 0) + 1;
    const diff = chooseDiff(skill.id);
    items.push({ skillId: skill.id, topicId: topic.id, diff, q: { ...skill.gen(diff), diff } });
  }
  return items;
}

export function newSimilar(item) {
  const f = findSkill(item.skillId);
  const diff = Math.max(1, (item.diff || 1));
  return { skillId: item.skillId, topicId: item.topicId, diff, q: { ...f.skill.gen(diff), diff }, secondChance: true };
}

// ---------- Ergebnis erfassen ----------
// result: { status: 'correct'|'almost'|'wrong', score: 0..1, tags: [], usedHint, given, stepsPerfect }
export function record(item, result, combo) {
  const s = (S.skills[item.skillId] ||= { m: 0, n: 0, c: 0, recent: [], last: 0, tags: {} });
  const d = item.diff || 1;
  const sc = result.score ?? (result.status === 'correct' ? 1 : result.status === 'almost' ? 0.5 : 0);
  s.n++; s.last = Date.now();
  // Am Anfang große Schritte (schnelle Einschätzung), später stabiler.
  // Leichte Aufgaben allein bringen höchstens 80 %, für 100 % braucht es Testniveau.
  const rate = Math.max(0.15 + 0.05 * d, 1 / (s.n + 1));
  if (sc >= 0.99) {
    s.c++;
    const target = [0, 80, 92, 100][d];
    if (s.m < target) s.m += (target - s.m) * rate * (result.usedHint ? 0.5 : 1);
    s.recent.push(1);
  } else if (sc >= 0.5) {
    if (s.m < 60) s.m += (60 - s.m) * rate * 0.3;
    s.recent.push(0.5);
  } else {
    s.m -= s.m * rate * 0.8;
    s.recent.push(0);
  }
  s.m = Math.max(0, Math.min(100, Math.round(s.m * 10) / 10));
  s.recent = s.recent.slice(-10);

  for (const tag of result.tags || []) {
    if (!tag) continue;
    S.errors[tag] = (S.errors[tag] || 0) + 1;
    s.tags[tag] = (s.tags[tag] || 0) + 1;
  }

  // XP
  let xp = 0;
  if (sc >= 0.99) xp = 10 * d + (result.usedHint ? 0 : 5) + (combo > 0 && combo % 3 === 0 ? 5 : 0);
  else if (sc >= 0.5) xp = 4 + Math.round(6 * sc);
  else xp = 1;
  if (item.secondChance && sc >= 0.99) xp += 3;
  S.xp += xp;
  const dd = day(); dd.xp += xp; dd.answered++; if (sc >= 0.99) dd.correct++;

  // Fehler merken / Wiederholung
  if (sc < 0.99) {
    S.wrongLog.unshift({ ts: Date.now(), skillId: item.skillId, text: plain(item.q), given: result.given, correct: plainTxt(item.q.answerText || ''), tags: result.tags || [] });
    S.wrongLog = S.wrongLog.slice(0, 40);
    if (!item.reviewId) {
      S.review.push({ id: Math.random().toString(36).slice(2), skillId: item.skillId, topicId: item.topicId, q: item.q, addedAt: Date.now() });
      S.review = S.review.slice(-40);
    }
  } else if (item.reviewId) {
    S.review = S.review.filter(r => r.id !== item.reviewId);
    S.counters.reviewFixed++;
  }
  if (result.stepsPerfect) S.counters.stepsPerfect++;
  if (combo > S.records.bestCombo) S.records.bestCombo = combo;
  save();
  return xp;
}

export function finishSession(sum) {
  const pct = sum.total ? Math.round((sum.correct / sum.total) * 100) : 0;
  const prevBest = S.records.bestPct;
  const prev = S.records.sessions.slice();
  const avg = prev.length ? Math.round(prev.reduce((a, s) => a + s.pct, 0) / prev.length) : null;
  S.records.sessions.push({ ts: Date.now(), pct, xp: sum.xp, total: sum.total, mode: sum.mode });
  S.records.sessions = S.records.sessions.slice(-60);
  if (pct > S.records.bestPct) S.records.bestPct = pct;
  day().rounds++;
  const newBadges = checkBadges(sum, pct);
  save();
  return { pct, prevBest, avg, newBadges, newRecordPct: prev.length > 0 && pct > prevBest };
}

function checkBadges(sum, pct) {
  const got = [];
  const give = id => { if (!S.badges[id]) { S.badges[id] = Date.now(); got.push(id); } };
  give('first');
  if (sum.total >= 6 && pct === 100) give('perfect');
  if (S.records.bestCombo >= 5) give('combo5');
  if (S.records.bestCombo >= 10) give('combo10');
  const st = streak();
  if (st >= 3) give('streak3');
  if (st >= 7) give('streak7');
  if (Object.values(S.skills).some(s => s.m >= 85)) give('master');
  if (S.counters.stepsPerfect >= 5) give('steps');
  if (sum.correct >= 7 && !sum.hints) give('noHint');
  if (S.counters.reviewFixed >= 10) give('review');
  if (S.xp >= 1000) give('xp1000');
  return got;
}

// ---------- Fortschritt ----------
export function rankInfo(xp = S.xp) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const cur = RANKS[i], next = RANKS[i + 1];
  return { cur, next, pct: next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100 };
}
export function streak() {
  let n = 0; const d = new Date();
  if (!S.days[dayKey(d)]?.answered) d.setDate(d.getDate() - 1);
  while (S.days[dayKey(d)]?.answered) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function rangeStats(fromDaysAgo, toDaysAgo) {
  const r = { xp: 0, answered: 0, correct: 0, rounds: 0, activeDays: 0 };
  for (let i = fromDaysAgo; i >= toDaysAgo; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const x = S.days[dayKey(d)];
    if (x) { r.xp += x.xp; r.answered += x.answered; r.correct += x.correct; r.rounds += x.rounds; if (x.answered) r.activeDays++; }
  }
  return r;
}
export const todayStats = () => S.days[dayKey()] || { xp: 0, answered: 0, correct: 0, rounds: 0 };

// ---------- Tests ----------
export function daysUntil(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(y, m - 1, d), n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.round((t - n) / 864e5);
}
export function upcomingTests() {
  return S.tests.filter(t => daysUntil(t.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
}
export function pastUngradedTest() { return S.tests.find(t => daysUntil(t.date) < 0 && !t.grade && !t.skipGrade); }
export function testSkills(test) {
  return allSkills(test.subject).filter(p => !test.topics?.length || test.topics.includes(p.topic.id));
}
export function readiness(test) {
  const sk = testSkills(test);
  return Math.round(sk.reduce((a, p) => a + stat(p.skill.id).m, 0) / Math.max(1, sk.length));
}
export function testPlan(test) {
  const days = Math.max(1, daysUntil(test.date));
  const sk = testSkills(test);
  const need = sk.reduce((a, p) => a + Math.max(0, 80 - stat(p.skill.id).m), 0);
  const tasks = Math.ceil(need / 6);
  const rounds = Math.min(4, Math.max(1, Math.ceil(tasks / ROUND / days)));
  const weak = sk.map(p => ({ ...p, s: stat(p.skill.id) })).sort((a, b) => a.s.m - b.s.m).slice(0, 3);
  return { rounds, weak, ready: readiness(test) };
}

// ---------- Bericht ----------
const plainTxt = s => String(s).replace(/\\f\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)').replace(/<br>/g, ' | ').replace(/<[^>]+>/g, '');
const plain = q => plainTxt(`${q.text} ${q.math || ''}${q.graph ? ` [Graph: m=${q.graph.mn}/${q.graph.md}, n=${q.graph.n}]` : ''}`).trim();
const fmtDate = s => { const [y, m, d] = s.split('-'); return `${d}.${m}.${y}`; };
export { fmtDate };

export function reportText() {
  const name = S.profile?.name || 'Lernpfote';
  const L = [];
  const r = rankInfo();
  const w = rangeStats(6, 0);
  L.push(`📊 Lernpfote – Lernstand von ${name} (${fmtDate(dayKey())})`);
  L.push(`Rang: ${r.cur.name} · ${S.xp} XP · Serie: ${streak()} Tage`);
  L.push(`Letzte 7 Tage: ${w.activeDays} Lerntage, ${w.rounds} Runden, ${w.answered} Aufgaben, ${w.answered ? Math.round((w.correct / w.answered) * 100) : 0} % richtig`);
  for (const t of upcomingTests()) L.push(`Nächster Test: ${SUBJECTS[t.subject].short} am ${fmtDate(t.date)} (in ${daysUntil(t.date)} Tagen) – Bereitschaft ${readiness(t)} %${t.note ? ' – ' + t.note : ''}`);
  for (const t of S.tests.filter(t => t.grade)) L.push(`Test ${fmtDate(t.date)}: Note ${t.grade}`);
  for (const sub of Object.values(SUBJECTS)) {
    L.push('', sub.name.toUpperCase());
    for (const t of sub.topics) {
      const tm = topicMastery(t);
      L.push(`${tm.m >= 65 ? '✅' : tm.m >= 40 ? '🟡' : tm.tried ? '🔴' : '⚪'} ${t.name}: ${tm.m} %`);
      for (const s of t.skills) {
        const st = stat(s.id);
        if (!st.n) { L.push(`   · ${s.name}: noch nicht geübt`); continue; }
        const tags = Object.entries(st.tags || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${ERROR_TAGS[k] || k} ${v}×`).join(', ');
        L.push(`   ${isGap(s.id) ? '⚠️ LÜCKE' : '·'} ${s.name}: ${Math.round(st.m)} % (${st.c}/${st.n} richtig)${tags ? ' – Fehler: ' + tags : ''}`);
      }
    }
  }
  const errs = Object.entries(S.errors).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (errs.length) L.push('', 'Häufigste Fehlerarten: ' + errs.map(([k, v]) => `${ERROR_TAGS[k] || k} (${v}×)`).join(', '));
  if (S.wrongLog.length) {
    L.push('', 'Zuletzt falsch beantwortet:');
    for (const e of S.wrongLog.slice(0, 8)) L.push(`- ${e.text} → Eingabe: „${Array.isArray(e.given) ? e.given.join(' / ') : e.given}“, richtig: ${e.correct}`);
  }
  return L.join('\n');
}

// ---------- Sicherung ----------
export function exportBackup() { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
export function importBackup(code) {
  const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!data || data.v !== 1) throw new Error('Ungültiger Code');
  S = { ...fresh(), ...data }; save();
}
