// Aktueller Stoff (Hefter, Nov. 2026): Binomische Formeln mit Dezimalzahlen, Brüchen,
// zwei Variablen und Minuszeichen, Pascal'sches Dreieck, Faktorisieren, Gleichungen.
import { R, RNZ, pick, gcd, fr, abs, sn, op, polyA, polyD, linD, fD, rnd, supD, dc, Q } from './helpers.js';

const VARS = [['x', 'y'], ['a', 'b'], ['r', 's'], ['u', 'v']];
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };

// Brüche als Koeffizienten: terms = [[zähler, nenner, 'x^2'], ...]
function fpolyA(terms) {
  const t = terms.filter(x => x[0] !== 0).map(([n, d, v]) => `(${n}/${d})${v ? '*' + v : ''}`).join('+');
  return t || '0';
}
function fpolyD(terms) {
  let s = '';
  for (const [n0, d0, v] of terms) {
    if (n0 === 0) continue;
    const [n, d] = fr(n0, d0), a = abs(n);
    const c = d === 1 ? (v && a === 1 ? '' : String(a)) : `\\f{${a}}{${d}}`;
    const part = c + supD(v);
    s += s === '' ? (n < 0 ? '−' : '') + part : (n < 0 ? ' − ' : ' + ') + part;
  }
  return s || '0';
}
// Koeffizient + Variable für die Anzeige: 1 -> "x", -1 -> "−x", 3 -> "3x", 0,5 -> "0,5x"
const cv = (c, v) => (c === 1 ? v : c === -1 ? '−' + v : (c < 0 ? '−' : '') + dc(abs(c)) + v);
const fcv = ([n, d], v) => (d === 1 ? cv(n, v) : `${n < 0 ? '−' : ''}\\f{${abs(n)}}{${d}}${v}`);
// (erstes ± zweites) als Anzeige
const pairD = (first, B, second) => `${first}${B < 0 ? ' − ' : ' + '}${second}`;

const sqHint = c => `${dc(c)}² = ${dc(c)} · ${dc(c)} = ${dc(c * c)} – beim Quadrieren einer Dezimalzahl verdoppelt sich die Anzahl der Nachkommastellen!`;
const MID = { hint: 'Das Mittelglied 2ab fehlt! (a ± b)² = a² ± 2ab + b²', tag: 'binom' };

// -------------------------------------------------------------------
export const binomDezimal = {
  id: 'binom_dezimal', name: 'Binome mit Dezimalzahlen & Brüchen',
  gen(d) {
    let math, res, traps = [], formel = '(a ± b)² = a² ± 2ab + b²';
    if (d === 1) {
      const c = pick([0.5, 0.8, 1.5, 2.5, 0.3, 1.2, 0.4]), s = pick([1, -1]), t = R(1, 3);
      if (t === 3) {
        math = `(x + ${dc(c)})(x − ${dc(c)})`; res = [[1, 'x^2'], [-rnd(c * c), '']]; formel = '(a + b)(a − b) = a² − b²';
        traps.push({ expr: polyA([[1, 'x^2'], [-rnd(2 * c), '']]), hint: sqHint(c), tag: 'quadrieren' });
      } else {
        math = t === 2 ? `(${dc(c)}${s < 0 ? ' − ' : ' + '}x)²` : `(x${s < 0 ? ' − ' : ' + '}${dc(c)})²`;
        res = [[1, 'x^2'], [rnd(2 * c * s), 'x'], [rnd(c * c), '']];
        traps.push({ expr: polyA([[1, 'x^2'], [rnd(2 * c * s), 'x'], [rnd(2 * c), '']]), hint: sqHint(c), tag: 'quadrieren' });
        traps.push({ expr: polyA([[1, 'x^2'], [rnd(c * c), '']]), ...MID });
      }
      return Q({
        text: 'Wende die binomische Formel an.', math,
        answer: { type: 'term', value: polyA(res), form: 'expanded', traps, tag: 'binom' },
        answerText: polyD(res), hint: formel,
        solution: [formel, `Ergebnis: ${polyD(res)}`],
      });
    }
    if (d === 2) {
      const k = pick([0.5, 0.2, 0.3, 1.5, 0.4, 1.2]), s = pick([1, -1]);
      const withY = Math.random() < 0.4, c = withY ? R(1, 3) : R(1, 6);
      const v2 = withY ? 'y' : '';
      if (Math.random() < 0.25) {
        const e = pick([0.1, 0.2, 0.3, 0.5]);
        math = `(x − ${dc(e)}y)(x + ${dc(e)}y)`; res = [[1, 'x^2'], [-rnd(e * e), 'y^2']]; formel = '(a + b)(a − b) = a² − b²';
        traps.push({ expr: polyA([[1, 'x^2'], [-rnd(2 * e), 'y^2']]), hint: sqHint(e), tag: 'quadrieren' });
      } else {
        const sq2 = withY ? 'y^2' : '';
        math = `(${dc(k)}x${s < 0 ? ' − ' : ' + '}${withY ? cv(c, 'y') : c})²`;
        res = [[rnd(k * k), 'x^2'], [rnd(2 * k * c * s), 'x' + v2], [c * c, sq2]];
        traps.push({ expr: polyA([[rnd(2 * k), 'x^2'], [rnd(2 * k * c * s), 'x' + v2], [c * c, sq2]]), hint: sqHint(k), tag: 'quadrieren' });
        traps.push({ expr: polyA([[k, 'x^2'], [rnd(2 * k * c * s), 'x' + v2], [c * c, sq2]]), hint: `Auch die Zahl vor x wird quadriert: (${dc(k)}x)² = ${dc(k * k)}x²`, tag: 'quadrieren' });
        traps.push({ expr: polyA([[rnd(k * k), 'x^2'], [c * c, sq2]]), ...MID });
      }
      return Q({
        text: 'Wende die binomische Formel an. (Dezimalzahlen mit Komma eingeben)', math,
        answer: { type: 'term', value: polyA(res), form: 'expanded', traps, tag: 'quadrieren' },
        answerText: polyD(res), hint: formel + ' – rechne Dezimalzahlen im Kopf langsam: 0,3 · 0,3 = 0,09',
        solution: [formel, `Ergebnis: ${polyD(res)}`],
      });
    }
    // Brüche
    const F = [[1, 2], [1, 3], [2, 3], [3, 4], [4, 5], [2, 5], [1, 4]];
    const [p, q] = pick(F);
    const third = Math.random() < 0.3;
    const second = pick(['y', 'y', '']);
    const [r, t] = second === '' ? pick([[3, 10], [1, 2], [2, 3], [3, 4]]) : pick([[1, 1], ...F]);
    const s = pick([1, -1]);
    const sq2 = second ? second + '^2' : '';
    const fx = fcv([p, q], 'x'), fy = second ? fcv([r, t], second) : `\\f{${r}}{${t}}`;
    let terms, trapTerms;
    if (third) {
      math = `(${fx} + ${fy})(${fx} − ${fy})`;
      terms = [[p * p, q * q, 'x^2'], [-r * r, t * t, sq2]];
      trapTerms = [[p * p, q, 'x^2'], [-r * r, t, sq2]];
      formel = '(a + b)(a − b) = a² − b²';
      traps.push({ expr: fpolyA([[p * p, q * q, 'x^2'], [r * r, t * t, sq2]]), hint: '3. binomische Formel: hinten steht ein MINUS: a² − b²', tag: 'binom' });
    } else {
      math = `(${pairD(fx, s, fy)})²`;
      terms = [[p * p, q * q, 'x^2'], [2 * p * r * s, q * t, 'x' + second], [r * r, t * t, sq2]];
      trapTerms = [[p * p, q, 'x^2'], [2 * p * r * s, q * t, 'x' + second], [r * r, t, sq2]];
      traps.push({ expr: fpolyA([[p * p, q * q, 'x^2'], [r * r, t * t, sq2]]), ...MID });
    }
    traps.push({ expr: fpolyA(trapTerms), hint: `Bei Brüchen Zähler UND Nenner quadrieren: (\\f{${p}}{${q}})² = \\f{${p * p}}{${q * q}}`, tag: 'quadrieren' });
    return Q({
      text: 'Wende die binomische Formel an. Brüche mit / eingeben, z. B. 1/4x².', math,
      answer: { type: 'term', value: fpolyA(terms), form: 'expanded', traps, tag: 'quadrieren' },
      answerText: fpolyD(terms), hint: formel + ' – Brüche: Zähler · Zähler, Nenner · Nenner.',
      solution: [formel, third ? `a = ${fx}, b = ${fy}` : `2ab = 2 · ${fx} · ${fy}`, `Ergebnis: ${fpolyD(terms)}`],
    });
  },
};

// -------------------------------------------------------------------
export const binomVorzeichen = {
  id: 'binom_vorzeichen', name: 'Binome mit zwei Variablen & Minuszeichen',
  gen(d) {
    const [u, v] = pick(VARS);
    let A, B, third = false;
    if (d === 1) { A = 1; B = RNZ(-5, 5); }
    else if (d === 2) { const t = R(1, 3); if (t === 1) { A = -1; B = -R(1, 5); } else if (t === 2) { A = -1; B = R(1, 5); } else { A = R(2, 5); B = RNZ(-6, 6); } }
    else { third = Math.random() < 0.4; A = third ? pick([-1, 2, 3, 4, 5]) : -R(2, 5); B = third ? R(1, 6) : -R(1, 5); }
    const first = cv(A, u), sec = abs(B) === 1 ? v : abs(B) + v;
    let math, res, traps = [], formel;
    if (third) {
      math = `(${first} + ${sec})(${first} − ${sec})`;
      res = [[A * A, u + '^2'], [-B * B, v + '^2']];
      formel = '(a + b)(a − b) = a² − b²';
      traps.push({ expr: polyA([[A * A, u + '^2'], [B * B, v + '^2']]), hint: '3. binomische Formel: a² MINUS b²', tag: 'binom' });
      if (A < 0) traps.push({ expr: polyA([[-A * A, u + '^2'], [-B * B, v + '^2']]), hint: `(${first})² ist positiv – Minus mal Minus ergibt Plus!`, tag: 'vorzeichen' });
    } else {
      math = `(${pairD(first, B, sec)})²`;
      res = [[A * A, u + '^2'], [2 * A * B, u + v], [B * B, v + '^2']];
      formel = A < 0 ? `Tipp: (${pairD(first, B, sec)})² = (${pairD(cv(-A, u), -B, sec)})² – quadriert verschwindet das Minus.` : '(a ± b)² = a² ± 2ab + b²';
      if (A < 0) traps.push({ expr: polyA([[-A * A, u + '^2'], [2 * A * B, u + v], [B * B, v + '^2']]), hint: `(${first})² ist positiv! Minus mal Minus ergibt Plus – das Ergebnis beginnt mit +${A * A === 1 ? '' : A * A}${u}².`, tag: 'vorzeichen' });
      traps.push({ expr: polyA([[A * A, u + '^2'], [-2 * A * B, u + v], [B * B, v + '^2']]), hint: `Vorzeichen des Mittelglieds: 2 · (${first}) · (${B < 0 ? '−' : ''}${sec}) = ${polyD([[2 * A * B, u + v]])}`, tag: 'vorzeichen' });
      traps.push({ expr: polyA([[A * A, u + '^2'], [B * B, v + '^2']]), ...MID });
    }
    return Q({
      text: 'Multipliziere aus (binomische Formel).', math,
      answer: { type: 'term', value: polyA(res), form: 'expanded', traps, tag: 'binom' },
      answerText: polyD(res), hint: formel,
      solution: [formel, `Ergebnis: ${polyD(res)}`],
    });
  },
};

// -------------------------------------------------------------------
function expandBinom(A, B, n, u, v) {
  const terms = [];
  for (let i = 0; i <= n; i++) {
    const coef = C(n, i) * A ** (n - i) * B ** i;
    const pu = n - i === 0 ? '' : n - i === 1 ? u : `${u}^${n - i}`;
    const pv = !v || i === 0 ? '' : i === 1 ? v : `${v}^${i}`;
    terms.push([coef, pu + pv]);
  }
  return terms;
}
const rowStr = n => Array.from({ length: n + 1 }, (_, i) => C(n, i)).join('  ');

export const pascal = {
  id: 'pascal', name: 'Pascal’sches Dreieck & höhere Potenzen',
  gen(d) {
    if (d === 1 && Math.random() < 0.6) {
      const n = R(4, 8), k = R(1, n - 1);
      const mono = supD(`${n - k === 1 ? 'a' : 'a^' + (n - k)}${k === 1 ? 'b' : 'b^' + k}`);
      return Q({
        text: `Welche Zahl steht in (a + b)${supD('^' + n)} vor ${mono}?`, math: `(a + b)${supD('^' + n)} = … + ☐ · ${mono} + …`,
        answer: { type: 'num', value: C(n, k), tag: 'pascal' }, answerText: String(C(n, k)),
        hint: 'Schreibe das Pascal’sche Dreieck auf: Jede Zahl ist die Summe der beiden Zahlen darüber.',
        solution: [`Zeile ${n}: ${rowStr(n)}`, `Die ${k + 1}. Zahl ist ${C(n, k)}.`],
      });
    }
    let A = 1, B, n, u, v, cst = false;
    if (d === 1) { [u, v] = pick(VARS); B = 1; n = pick([3, 4]); }
    else if (d === 2) {
      if (Math.random() < 0.6) { u = 'x'; v = ''; cst = true; B = RNZ(-3, 3); n = pick([3, 4]); }
      else { [u, v] = pick(VARS); B = pick([-1, -1, 1]); n = pick([4, 5]); }
    } else {
      if (Math.random() < 0.5) { u = pick(['x', 'a']); v = ''; cst = true; A = R(2, 4); B = RNZ(-3, 3); n = 3; }
      else { [u, v] = pick(VARS); A = 1; B = -R(2, 3); n = 4; }
    }
    const res = expandBinom(A, B, n, u, v);
    const traps = [];
    if (B < 0) traps.push({ expr: polyA(expandBinom(A, -B, n, u, v)), hint: 'Bei einer Differenz wechseln die Vorzeichen ab: +, −, +, − …', tag: 'vorzeichen' });
    if (abs(A) > 1 || abs(B) > 1) {
      const noPow = []; for (let i = 0; i <= n; i++) { const t = res[i]; noPow.push([C(n, i) * (i < n ? A : 1) * (i > 0 ? B : 1), t[1]]); }
      traps.push({ expr: polyA(noPow), hint: `Auch die Zahlen werden potenziert, z. B. ${abs(B) > 1 ? abs(B) : A}³ = ${(abs(B) > 1 ? abs(B) : A) ** 3}.`, tag: 'pascal' });
    }
    const first = cv(A, u), sec = cst ? String(abs(B)) : abs(B) === 1 ? v : abs(B) + v;
    return Q({
      text: 'Multipliziere mit Hilfe des Pascal’schen Dreiecks aus. Hochzahlen mit ^ oder ² ³ eingeben, z. B. x^4.',
      math: `(${pairD(first, B, sec)})${supD('^' + n)}`,
      answer: { type: 'term', value: polyA(res), form: 'expanded', traps, tag: 'pascal' },
      answerText: polyD(res),
      hint: `Zeile ${n} im Pascal’schen Dreieck: ${rowStr(n)}`,
      solution: [`Zeile ${n}: ${rowStr(n)}`, `Hochzahl vom ersten Glied fällt (${n} … 0), vom zweiten steigt (0 … ${n}).`, `Ergebnis: ${polyD(res)}`],
    });
  },
};

// -------------------------------------------------------------------
export const binomFaktor = {
  id: 'binom_faktor', name: 'Binomische Formeln rückwärts',
  gen(d) {
    let math, ans, disp, traps = [], f;
    if (d === 1) {
      const w = pick(['x', 'a', 'b']), a = R(1, 10), s = pick([1, -1]);
      const terms = [[1, w + '^2'], [2 * a * s, w], [a * a, '']];
      math = polyD(Math.random() < 0.5 ? terms : terms.slice().reverse());
      ans = `(${w}${s < 0 ? '-' : '+'}${a})^2`; disp = `(${w}${s < 0 ? ' − ' : ' + '}${a})²`;
      f = s > 0 ? '1. binomische Formel: a² + 2ab + b² = (a + b)²' : '2. binomische Formel: a² − 2ab + b² = (a − b)²';
    } else if (d === 2) {
      const t = R(1, 3);
      if (t === 1) {
        const [u, v] = pick(VARS), k = R(2, 9);
        math = polyD([[1, u + '^2'], [-k * k, v + '^2']]); ans = `(${u}+${k}${v})(${u}-${k}${v})`; disp = `(${u} + ${k}${v})(${u} − ${k}${v})`;
        traps.push({ expr: `(${u}-${k}${v})^2`, hint: 'Kein Mittelglied und ein Minus dazwischen → 3. binomische Formel: a² − b² = (a + b)(a − b)', tag: 'binom' });
        f = '3. binomische Formel: a² − b² = (a + b)(a − b)';
      } else if (t === 2) {
        const w = pick(['a', 'x']), k = R(2, 6);
        math = `1 − ${k * k}${w}²`; ans = `(1+${k}${w})(1-${k}${w})`; disp = `(1 + ${k}${w})(1 − ${k}${w})`;
        f = '3. binomische Formel: a² − b² = (a + b)(a − b), hier a = 1';
      } else {
        let k, m; do { k = R(2, 7); m = R(1, 9); } while (gcd(k, m) !== 1);
        const s = pick([1, -1]);
        math = polyD([[k * k, 'x^2'], [2 * k * m * s, 'x'], [m * m, '']]); ans = `(${k}x${s < 0 ? '-' : '+'}${m})^2`; disp = `(${k}x${s < 0 ? ' − ' : ' + '}${m})²`;
        f = `a² = ${k * k}x² → a = ${k}x;  b² = ${m * m} → b = ${m}`;
      }
    } else {
      const t = R(1, 3);
      if (t === 1) {
        const [p, q] = pick([[1, 5], [1, 2], [2, 3], [1, 3], [3, 4]]), [r, tt] = pick([[3, 10], [1, 2], [2, 5], [1, 4]]), s = pick([1, -1]);
        math = fpolyD([[p * p, q * q, 'x^2'], [2 * p * r * s, q * tt, 'x'], [r * r, tt * tt, '']]);
        ans = `((${p}/${q})*x${s < 0 ? '-' : '+'}(${r}/${tt}))^2`; disp = `(${fcv([p, q], 'x')}${s < 0 ? ' − ' : ' + '}\\f{${r}}{${tt}})²`;
        f = 'Ziehe aus dem ersten und letzten Glied die Wurzel (Zähler und Nenner einzeln).';
      } else if (t === 2) {
        const [u, v] = pick(VARS), k = R(6, 12);
        math = polyD([[1, u + '^2'], [-k * k, v + '^2']]); ans = `(${u}+${k}${v})(${u}-${k}${v})`; disp = `(${u} + ${k}${v})(${u} − ${k}${v})`;
        f = `${k * k}${v}² = (${k}${v})² → 3. binomische Formel`;
        traps.push({ expr: `(${u}-${k}${v})^2`, hint: 'a² − b² hat kein Mittelglied → (a + b)(a − b)', tag: 'binom' });
      } else {
        const k = pick([0.2, 0.3, 0.5]), s = pick([1, -1]);
        math = polyD([[rnd(k * k), 'x^2'], [rnd(2 * k * s), 'xy'], [1, 'y^2']]);
        ans = `(${k}x${s < 0 ? '-' : '+'}y)^2`; disp = `(${dc(k)}x${s < 0 ? ' − ' : ' + '}y)²`;
        f = `${dc(k * k)} = ${dc(k)}² → a = ${dc(k)}x`;
      }
    }
    return Q({
      text: 'Schreibe als Produkt (binomische Formel rückwärts).', math,
      answer: { type: 'term', value: ans, form: 'factored', traps, tag: 'binom' },
      answerText: disp, hint: f,
      solution: [f, `${math} = ${disp}`],
    });
  },
};

// -------------------------------------------------------------------
export const binomGleichung = {
  id: 'binom_gleichung', name: 'Gleichungen mit binomischen Formeln',
  gen(d) {
    if (d === 1 || (d === 2 && Math.random() < 0.3)) {
      let k, m; do { k = R(d === 1 ? 1 : 2, 8); m = RNZ(-9, 9); } while (gcd(k, abs(m)) !== 1);
      const terms = [[k * k, 'x^2'], [2 * k * m, 'x'], [m * m, '']];
      const moved = d === 2;
      const math = moved ? `${polyD([terms[0]])} = ${polyD([[-2 * k * m, 'x'], [-m * m, '']])}` : `${polyD(terms)} = 0`;
      return Q({
        text: 'Löse die Gleichung. Tipp: Erkennst du eine binomische Formel?', math,
        answer: { type: 'num', value: -m / k, reduced: true, tag: 'binom' }, answerText: `x = ${fD(-m, k)}`,
        hint: moved ? 'Bringe erst alles auf eine Seite (= 0) und schreibe dann als (…)² = 0.' : `${polyD(terms)} = (${cv(k, 'x')}${m < 0 ? ' − ' : ' + '}${abs(m)})²`,
        solution: [...(moved ? [`${polyD(terms)} = 0`] : []), `(${cv(k, 'x')}${m < 0 ? ' − ' : ' + '}${abs(m)})² = 0`, `${cv(k, 'x')}${m < 0 ? ' − ' : ' + '}${abs(m)} = 0`, `x = ${fD(-m, k)},  L = {${fD(-m, k)}}`],
      });
    }
    if (d === 2) {
      if (Math.random() < 0.5) {
        const k = pick([1, 1, 2, 3]), m = R(2, 12);
        const math = pick([`${m * m} − ${cv(k * k, 'x')}² = 0`, `${cv(k * k, 'x')}² − ${m * m} = 0`]);
        return Q({
          text: 'Löse die Gleichung. Gib beide Lösungen an.', math,
          answer: { type: 'pair', fields: [{ label: 'x₁', value: -m / k }, { label: 'x₂', value: m / k }], alts: [[m / k, -m / k]], tag: 'binom' },
          answerText: `x₁ = ${fD(-m, k)}, x₂ = ${fD(m, k)}`,
          hint: '3. binomische Formel: (a + b)(a − b) = 0. Ein Produkt ist 0, wenn ein Faktor 0 ist.',
          solution: [`(${m} + ${cv(k, 'x')})(${m} − ${cv(k, 'x')}) = 0`, `x₁ = ${fD(-m, k)},  x₂ = ${fD(m, k)}`, `L = {${fD(-m, k)}; ${fD(m, k)}}`],
        });
      }
      // (x+p)² − m = (x+r)(x−r)  → x² fällt weg
      const p = RNZ(-5, 5), r = R(1, 5), x0 = RNZ(-6, 6) / pick([1, 1, 2]);
      const m = 2 * p * x0 + p * p + r * r;
      if (!Number.isInteger(m) || m === 0) return this.gen(d);
      const [xn, xd] = fr(Math.round(x0 * 2), 2);
      return Q({
        text: 'Löse die Gleichung.', math: `(x${op(p)})²${op(-m)} = (x + ${r})(x − ${r})`,
        answer: { type: 'num', value: x0, reduced: true, tag: 'binom' }, answerText: `x = ${fD(xn, xd)}`,
        hint: 'Links 1. oder 2. binomische Formel, rechts die 3. – dann fällt x² weg!',
        solution: [`${polyD([[1, 'x^2'], [2 * p, 'x'], [p * p - m, '']])} = x² − ${r * r}   | − x²`, `${polyD([[2 * p, 'x'], [p * p - m, '']])} = ${-r * r}`, `${sn(2 * p)}x = ${sn(-r * r - p * p + m)}`, `x = ${fD(xn, xd)}`],
      });
    }
    // Stufe 3: Minus vor der Klammer! (x+p)² − (x+q)² = cx + e
    let p, q, c; do { p = RNZ(-8, 8); q = RNZ(-8, 8); c = R(-4, 4); } while (p === q || 2 * (p - q) - c === 0 || p === -q);
    const x0 = RNZ(-8, 8), e = 2 * (p - q) * x0 + p * p - q * q - c * x0;
    const lhs = [[2 * (p - q), 'x'], [p * p - q * q, '']];
    const rhs = c === 0 ? sn(e) : linD(c, e);
    const val = (x0 + p) ** 2 - (x0 + q) ** 2;
    const minusHint = `Das Minus vor der Klammer gilt für ALLE Glieder: −(x${op(q)})² = −x²${op(-2 * q).replace(/(\d+)$/, '$1x')}${op(-q * q)}`;
    return Q({
      text: 'Löse Schritt für Schritt – Achtung beim Minus vor der Klammer!',
      math: `(x${op(p)})² − (x${op(q)})² = ${rhs}`,
      answer: { type: 'steps' }, answerText: `x = ${sn(x0)}`,
      steps: [
        {
          text: '① Löse beide Klammern auf und fasse die linke Seite zusammen (x² fällt weg).',
          answer: { type: 'term', value: polyA(lhs), form: 'simplified', tag: 'klammer', traps: [
            { expr: polyA([[2 * p + 2 * q, 'x'], [p * p - q * q, '']]), hint: minusHint, tag: 'klammer' },
            { expr: polyA([[2 * p + 2 * q, 'x'], [p * p + q * q, '']]), hint: minusHint, tag: 'klammer' },
          ] },
          answerText: polyD(lhs),
        },
        { text: '② Löse die Gleichung. x = ?', answer: { type: 'num', value: x0, tag: 'umformung' }, answerText: `x = ${sn(x0)}` },
        { text: `③ Probe: Setze x = ${sn(x0)} in die LINKE Seite der ursprünglichen Gleichung ein.`, answer: { type: 'num', value: val, tag: 'rechnen' }, answerText: sn(val) },
      ],
      hint: 'Schreibe −(…)² erst als −( x² … ) mit Klammer hin und löse die Klammer danach auf.',
      solution: [`x²${op(2 * p).replace(/(\d+)$/, '$1x')}${op(p * p)} − (x²${op(2 * q).replace(/(\d+)$/, '$1x')}${op(q * q)}) = ${rhs}`, `${polyD(lhs)} = ${rhs}`, `x = ${sn(x0)}`, `Probe: links ${sn(val)}, rechts ${sn(c * x0 + e)} ✓`],
    });
  },
};
