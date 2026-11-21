// Mathematik Klasse 8 (Gymnasium, Sachsen-Anhalt)
// Jede Fertigkeit hat einen Generator gen(stufe) -> Aufgabe. Stufe 1 = leicht, 2 = mittel, 3 = Testniveau.
import { parse, evaluate } from '../mathparse.js';

import { binomDezimal, binomVorzeichen, pascal, binomFaktor, binomGleichung } from './mathe-binome.js';
import { laplace, baumdiagramm } from './mathe-wahrscheinlichkeit.js';
import { R, RNZ, pick, shuffle, gcd, lcm, fr, abs, sn, pn, op, opx, dec, money, fRaw, fD, fA, polyA, polyD, linA, linD, mxnD, mxnA, asciiToDisp, fill, Q } from './helpers.js';


// ===================================================================
// BRÜCHE & VORZEICHEN
// ===================================================================
const bruchAdd = {
  id: 'bruch_add', name: 'Brüche addieren & subtrahieren',
  gen(d) {
    let a, b, c, e;
    if (d === 1) { b = pick([2, 3, 4, 5]); e = b * pick([2, 3]); }
    else if (d === 2) { do { b = R(2, 9); e = R(2, 9); } while (b === e || gcd(b, e) !== 1); }
    else { do { b = R(3, 12); e = R(3, 12); } while (b === e || lcm(b, e) > 60 || gcd(b, e) === Math.min(b, e)); }
    do a = d === 3 ? -R(1, 2 * b) : R(1, b - 1); while (gcd(a, b) !== 1);
    do c = d === 3 ? R(1, e + 3) : R(1, e - 1); while (gcd(c, e) !== 1);
    const plus = Math.random() < 0.5;
    const s = plus ? 1 : -1;
    const L = lcm(b, e), fa = L / b, fe = L / e;
    const num = a * fa + s * c * fe;
    const [rn, rd] = fr(num, L);
    const traps = [];
    if (b + s * e !== 0) traps.push({ value: (a + s * c) / (b + s * e), hint: 'Nenner werden nie addiert oder subtrahiert! Bringe die Brüche erst auf den Hauptnenner.', tag: 'bruch' });
    const sol = [
      `Hauptnenner: kgV(${b}, ${e}) = ${L}`,
      `${fRaw(a, b)} ${plus ? '+' : '−'} ${fRaw(c, e)} = ${fRaw(a * fa, L)} ${plus ? '+' : '−'} ${fRaw(c * fe, L)}`,
      `= ${fRaw(num, L)}` + (rd !== L ? ` = ${fRaw(rn, rd)} (gekürzt)` : ''),
    ];
    return Q({
      text: 'Berechne und kürze vollständig.',
      math: `${fRaw(a, b)} ${plus ? '+' : '−'} ${fRaw(c, e)}`,
      answer: { type: 'num', value: num / L, reduced: true, traps, tag: 'bruch' },
      answerText: fRaw(rn, rd),
      hint: `Erweitere beide Brüche auf den Nenner ${L}.`,
      solution: sol,
    });
  },
};

const bruchMul = {
  id: 'bruch_mul', name: 'Brüche multiplizieren & dividieren',
  gen(d) {
    const irr = (lo, hi) => { let n, m; do { n = R(lo, hi); m = R(2, 9); } while (gcd(n, m) !== 1 || n === m); return [n, m]; };
    let [a, b] = irr(1, 9), [c, e] = irr(1, 9);
    let div = d >= 2 && (d === 2 || Math.random() < 0.5);
    let neg = d === 3 && Math.random() < 0.7;
    if (neg) a = -a;
    const symbol = div ? ':' : '·';
    const num = div ? a * e : a * c, den = div ? b * c : b * e;
    const [rn, rd] = fr(num, den);
    const traps = [];
    if (div) traps.push({ value: (a * c) / (b * e), hint: 'Beim Teilen durch einen Bruch musst du mit dem Kehrwert malnehmen!', tag: 'bruch' });
    else traps.push({ value: (a * e) / (b * c), hint: 'Beim Malnehmen gilt: Zähler · Zähler und Nenner · Nenner (kein Kehrwert!).', tag: 'bruch' });
    const sol = div
      ? [`Mit dem Kehrwert von ${fRaw(c, e)} multiplizieren:`, `${fRaw(a, b)} · ${fRaw(e, c)} = ${fRaw(num, den)}`, ...(rd !== den || rn !== num ? [`= ${fRaw(rn, rd)}`] : [])]
      : [`Zähler · Zähler, Nenner · Nenner:`, `${fRaw(a, b)} · ${fRaw(c, e)} = ${fRaw(num, den)}`, ...(rd !== den || rn !== num ? [`= ${fRaw(rn, rd)}`] : [])];
    return Q({
      text: 'Berechne und kürze vollständig.',
      math: `${neg ? `(${fRaw(a, b)})` : fRaw(a, b)} ${symbol} ${fRaw(c, e)}`,
      answer: { type: 'num', value: num / den, reduced: true, traps, tag: 'bruch' },
      answerText: fRaw(rn, rd),
      hint: div ? 'Durch einen Bruch teilen = mit dem Kehrwert malnehmen.' : 'Tipp: Vor dem Ausrechnen über Kreuz kürzen spart Arbeit.',
      solution: sol,
    });
  },
};

const vorzeichen = {
  id: 'vorzeichen', name: 'Rechnen mit negativen Zahlen',
  gen(d) {
    const T = {
      1: [{ t: '(-A)*B+C' }, { t: 'A-B*(-C)' }, { t: '(-A)+(-B)*C' }, { t: '-A*B-(-C)' }, { t: 'A-(-B)-C' }],
      2: [{ t: '(-A)*(-B)-C*(-D)' }, { t: 'A*(-B)+(-C)*(-D)' }, { t: '-(A-B)*C+D' }, { t: '(-A)*B-(-C)*D' }],
      3: [
        { t: '-A^2+(-B)^2-C*(-D)', trap: 'A^2+B^2-C*(-D)', hint: '−A² bedeutet −(A·A) und ist negativ. Nur (−A)² wird positiv.' },
        { t: '(-A)^3+B^2', trap: 'A^3+B^2', hint: 'Ungerade Hochzahl: (−A)³ bleibt negativ!' },
        { t: '-(A-B)^2+C*(-D)', trap: '(A-B)^2+C*(-D)', hint: 'Das Minus vor der Klammer bleibt nach dem Quadrieren stehen.' },
        { t: '(-A)^2-B*(-C)-D', trap: '-A^2-B*(-C)-D', hint: '(−A)² ist positiv – Minus mal Minus ergibt Plus.' },
      ],
    }[d];
    const tpl = pick(T);
    const vals = { A: R(2, d === 3 ? 5 : 9), B: R(2, d === 3 ? 5 : 9), C: R(2, 9), D: R(2, 9) };
    if (tpl.t.includes('(A-B)')) while (vals.A === vals.B) vals.B = R(2, 9);
    const ascii = fill(tpl.t, vals);
    const value = evaluate(parse(ascii));
    const traps = tpl.trap ? [{ value: evaluate(parse(fill(tpl.trap, vals))), hint: tpl.hint, tag: 'vorzeichen' }] : [];
    return Q({
      text: 'Berechne. Achte genau auf die Vorzeichen!',
      math: asciiToDisp(ascii),
      answer: { type: 'num', value, traps, tag: 'vorzeichen' },
      answerText: sn(value),
      hint: 'Punkt vor Strich! Minus mal Minus = Plus, Minus mal Plus = Minus. Potenzen zuerst.',
      solution: ['Erst Potenzen und Klammern, dann Punkt- vor Strichrechnung.', `${asciiToDisp(ascii)} = ${sn(value)}`],
    });
  },
};

// ===================================================================
// TERME
// ===================================================================
const zusammenfassen = {
  id: 'zusammenfassen', name: 'Terme zusammenfassen',
  gen(d) {
    let terms, res, hint, sol;
    if (d === 1) {
      let a, c; do { a = RNZ(-9, 9); c = RNZ(-9, 9); } while (a + c === 0);
      const b = RNZ(-12, 12), e = RNZ(-12, 12);
      terms = shuffle([[a, 'x'], [b, ''], [c, 'x'], [e, '']]);
      res = [[a + c, 'x'], [b + e, '']];
      sol = [`x-Glieder: ${sn(a)}x ${op(c).trim()}x = ${sn(a + c)}x`, `Zahlen: ${sn(b)} ${op(e).trim()} = ${sn(b + e)}`];
    } else if (d === 2) {
      let p, s; do { p = RNZ(-6, 6); s = RNZ(-6, 6); } while (p + s === 0);
      const q = RNZ(-9, 9), t = RNZ(-9, 9), r = RNZ(-12, 12);
      terms = shuffle([[p, 'x^2'], [q, 'x'], [r, ''], [s, 'x^2'], [t, 'x']]);
      res = [[p + s, 'x^2'], [q + t, 'x'], [r, '']];
      sol = [`x²-Glieder: ${sn(p + s)}x²`, `x-Glieder: ${sn(q + t)}x`, `Zahl: ${sn(r)}`];
    } else {
      const p = RNZ(-8, 8), q = RNZ(-8, 8), r = RNZ(-5, 5), s = RNZ(-8, 8), t = RNZ(-8, 8), u = RNZ(-5, 5);
      terms = shuffle([[p, 'a'], [q, 'b'], [r, 'ab'], [s, 'a'], [t, 'b'], [u, 'ab']]);
      res = [[p + s, 'a'], [q + t, 'b'], [r + u, 'ab']];
      sol = [`a-Glieder: ${sn(p + s)}a`, `b-Glieder: ${sn(q + t)}b`, `ab-Glieder: ${sn(r + u)}ab`];
    }
    hint = 'Sortiere gleichartige Glieder. Das Vorzeichen VOR einem Glied gehört immer dazu!';
    return Q({
      text: 'Fasse so weit wie möglich zusammen.',
      math: polyD(terms),
      answer: { type: 'term', value: polyA(res), form: 'simplified', tag: 'vorzeichen' },
      answerText: polyD(res),
      hint, solution: [...sol, `Ergebnis: ${polyD(res)}`],
    });
  },
};

const klammer = {
  id: 'klammer', name: 'Klammern auflösen (auch Minus vor der Klammer)',
  gen(d) {
    if (d === 1) {
      const k = RNZ(-6, 6) || 2, a = R(1, 6), b = RNZ(-9, 9);
      const kk = abs(k) === 1 ? (k < 0 ? -3 : 3) : k;
      const res = [[kk * a, 'x'], [kk * b, '']];
      return Q({
        text: 'Löse die Klammer auf.',
        math: `${sn(kk)}(${linD(a, b)})`,
        answer: { type: 'term', value: polyA(res), form: 'simplified', tag: 'klammer', traps: [
          { expr: polyA([[kk * a, 'x'], [b, '']]), hint: `Jedes Glied in der Klammer muss mit ${sn(kk)} multipliziert werden!`, tag: 'klammer' },
          { expr: polyA([[kk * a, 'x'], [-kk * b, '']]), hint: 'Vorzeichen prüfen: Minus mal Minus ergibt Plus, Minus mal Plus ergibt Minus.', tag: 'vorzeichen' },
        ] },
        answerText: polyD(res),
        hint: `Rechne ${sn(kk)} · ${a === 1 ? '' : a}x und ${sn(kk)} · ${pn(b)}.`,
        solution: [`${sn(kk)} · ${a === 1 ? '' : a}x = ${sn(kk * a)}x`, `${sn(kk)} · ${pn(b)} = ${sn(kk * b)}`, `Ergebnis: ${polyD(res)}`],
      });
    }
    if (d === 2) {
      const c = R(2, 15), a = R(2, 9), b = R(1, 9), s = pick([1, -1]);
      let e; do e = RNZ(-9, 9); while (e - a === 0);
      const res = [[e - a, 'x'], [c - s * b, '']];
      const trap = [[e - a, 'x'], [c + s * b, '']];
      return Q({
        text: 'Löse die Klammer auf und fasse zusammen.',
        math: `${c} − (${a}x${op(s * b)})${opx(e)}`,
        answer: { type: 'term', value: polyA(res), form: 'simplified', tag: 'klammer', traps: [
          { expr: polyA(trap), hint: 'Ein Minus vor der Klammer dreht ALLE Vorzeichen in der Klammer um – auch das zweite!', tag: 'klammer' },
        ] },
        answerText: polyD(res),
        hint: 'Minus vor der Klammer: Klammer weg und jedes Vorzeichen darin umdrehen.',
        solution: [`= ${c} − ${a}x${op(-s * b)}${opx(e)}`, `Ergebnis: ${polyD(res)}`],
      });
    }
    const k = R(2, 5), m = R(2, 5), a = R(1, 5), c = R(1, 5);
    const b = RNZ(-9, 9), e = RNZ(-9, 9);
    const xa = k * a - m * c;
    const res = [[xa, 'x'], [k * b - m * e, '']];
    return Q({
      text: 'Löse die Klammern auf und fasse zusammen.',
      math: `${k}(${linD(a, b)}) − ${m}(${linD(c, e)})`,
      answer: { type: 'term', value: polyA(res), form: 'simplified', tag: 'klammer', traps: [
        { expr: polyA([[xa, 'x'], [k * b + m * e, '']]), hint: `Das −${m} muss auch mit dem zweiten Glied der Klammer multipliziert werden: −${m} · ${pn(e)} = ${sn(-m * e)}`, tag: 'klammer' },
      ] },
      answerText: polyD(res),
      hint: `Achtung: Bei der zweiten Klammer rechnest du mit −${m}!`,
      solution: [`= ${polyD([[k * a, 'x'], [k * b, ''], [-m * c, 'x'], [-m * e, '']])}`, `Ergebnis: ${polyD(res)}`],
    });
  },
};

const ausmultiplizieren = {
  id: 'ausmultiplizieren', name: 'Klammer mal Klammer',
  gen(d) {
    const a = d === 1 ? 1 : R(2, d === 2 ? 4 : 5), c = d === 3 ? R(2, 5) : 1;
    const b = RNZ(-9, 9), e = RNZ(-9, 9);
    const res = [[a * c, 'x^2'], [a * e + b * c, 'x'], [b * e, '']];
    const lA = linD(a, b), lB = linD(c, e);
    return Q({
      text: 'Multipliziere aus und fasse zusammen.',
      math: `(${lA})(${lB})`,
      answer: { type: 'term', value: polyA(res), form: 'expanded', tag: 'klammer', traps: [
        { expr: polyA([[a * c, 'x^2'], [b * e, '']]), hint: 'Jedes Glied der ersten Klammer mit jedem der zweiten multiplizieren – die gemischten Glieder fehlen!', tag: 'klammer' },
      ] },
      answerText: polyD(res),
      hint: 'Jedes mit jedem: 4 Produkte bilden, dann zusammenfassen.',
      solution: [
        `= ${polyD([[a * c, 'x^2'], [a * e, 'x'], [b * c, 'x'], [b * e, '']])}`,
        `Ergebnis: ${polyD(res)}`,
      ],
    });
  },
};

const binomisch = {
  id: 'binomisch', name: 'Binomische Formeln',
  gen(d) {
    const b = d === 1 ? 1 : d === 2 ? pick([1, 1, 2, 3]) : R(2, 5);
    const a = d === 3 ? R(2, 9) : R(1, d === 1 ? 9 : 6);
    const type = d === 1 ? pick([1, 2]) : pick([1, 2, 3]);
    const bx = b === 1 ? 'x' : `${b}x`;
    let math, res, traps = [], formel;
    if (type === 1) {
      math = `(${bx} + ${a})²`; res = [[b * b, 'x^2'], [2 * a * b, 'x'], [a * a, '']]; formel = '1. binomische Formel: (a + b)² = a² + 2ab + b²';
      traps.push({ expr: polyA([[b * b, 'x^2'], [a * a, '']]), hint: 'Das Mittelglied 2ab fehlt! (a + b)² = a² + 2ab + b²', tag: 'binom' });
      if (b > 1) traps.push({ expr: polyA([[b, 'x^2'], [2 * a * b, 'x'], [a * a, '']]), hint: `Auch die Zahl vor x wird quadriert: (${b}x)² = ${b * b}x²`, tag: 'binom' });
    } else if (type === 2) {
      math = `(${bx} − ${a})²`; res = [[b * b, 'x^2'], [-2 * a * b, 'x'], [a * a, '']]; formel = '2. binomische Formel: (a − b)² = a² − 2ab + b²';
      traps.push({ expr: polyA([[b * b, 'x^2'], [-a * a, '']]), hint: 'Das Mittelglied fehlt, und b² ist immer positiv! (a − b)² = a² − 2ab + b²', tag: 'binom' });
      traps.push({ expr: polyA([[b * b, 'x^2'], [-2 * a * b, 'x'], [-a * a, '']]), hint: 'Das letzte Glied b² ist positiv – es ist ja (−b)·(−b).', tag: 'binom' });
      traps.push({ expr: polyA([[b * b, 'x^2'], [a * a, '']]), hint: 'Das Mittelglied −2ab fehlt!', tag: 'binom' });
      if (b > 1) traps.push({ expr: polyA([[b, 'x^2'], [-2 * a * b, 'x'], [a * a, '']]), hint: `Auch die Zahl vor x wird quadriert: (${b}x)² = ${b * b}x²`, tag: 'binom' });
    } else {
      math = `(${bx} + ${a})(${bx} − ${a})`; res = [[b * b, 'x^2'], [-a * a, '']]; formel = '3. binomische Formel: (a + b)(a − b) = a² − b²';
      traps.push({ expr: polyA([[b * b, 'x^2'], [a * a, '']]), hint: '3. binomische Formel: (a + b)(a − b) = a² − b² – hinten steht ein Minus!', tag: 'binom' });
    }
    return Q({
      text: 'Wende die binomische Formel an.',
      math,
      answer: { type: 'term', value: polyA(res), form: 'expanded', traps, tag: 'binom' },
      answerText: polyD(res),
      hint: formel,
      solution: [formel, `a = ${bx}, b = ${a}`, `Ergebnis: ${polyD(res)}`],
    });
  },
};

const faktorisieren = {
  id: 'faktorisieren', name: 'Ausklammern & Faktorisieren',
  gen(d) {
    if (d === 1) {
      let a, b; do { a = R(1, 6); b = RNZ(-9, 9); } while (gcd(a, b) !== 1);
      const k = R(2, 7);
      return Q({
        text: 'Klammere den größten gemeinsamen Faktor aus.',
        math: linD(k * a, k * b),
        answer: { type: 'term', value: `${k}(${linA(a, b)})`, form: 'factored', tag: 'rechnen' },
        answerText: `${k}(${linD(a, b)})`,
        hint: `Welche Zahl teilt ${k * a} und ${abs(k * b)}?`,
        solution: [`Gemeinsamer Faktor: ${k}`, `${linD(k * a, k * b)} = ${k}(${linD(a, b)})`],
      });
    }
    if (d === 2) {
      let a, b; do { a = R(1, 5); b = RNZ(-7, 7); } while (gcd(a, b) !== 1);
      const k = R(1, 5), kx = k === 1 ? 'x' : `${k}x`;
      const poly = polyD([[k * a, 'x^2'], [k * b, 'x']]);
      return Q({
        text: 'Klammere so viel wie möglich aus (Zahl und x).',
        math: poly,
        answer: { type: 'term', value: `${k}x(${linA(a, b)})`, form: 'factored', tag: 'rechnen' },
        answerText: `${kx}(${linD(a, b)})`,
        hint: 'Beide Glieder enthalten x – das kannst du auch ausklammern.',
        solution: [`Gemeinsamer Faktor: ${kx}`, `${poly} = ${kx}(${linD(a, b)})`],
      });
    }
    const a = R(1, 9), type = pick([1, 2, 3]);
    const cases = {
      1: { math: polyD([[1, 'x^2'], [2 * a, 'x'], [a * a, '']]), ans: `(x+${a})^2`, disp: `(x + ${a})²`, f: '1. binomische Formel rückwärts' },
      2: { math: polyD([[1, 'x^2'], [-2 * a, 'x'], [a * a, '']]), ans: `(x-${a})^2`, disp: `(x − ${a})²`, f: '2. binomische Formel rückwärts' },
      3: { math: polyD([[1, 'x^2'], [-a * a, '']]), ans: `(x+${a})(x-${a})`, disp: `(x + ${a})(x − ${a})`, f: '3. binomische Formel rückwärts' },
    }[type];
    return Q({
      text: 'Schreibe als Produkt (binomische Formel rückwärts).',
      math: cases.math,
      answer: { type: 'term', value: cases.ans, form: 'factored', tag: 'binom' },
      answerText: cases.disp,
      hint: 'Suche a² und b². Passt das Mittelglied 2ab? Oder ist es eine Differenz a² − b²?',
      solution: [cases.f, `${cases.math} = ${cases.disp}`],
    });
  },
};

// ===================================================================
// GLEICHUNGEN
// ===================================================================
const gleichungEinfach = {
  id: 'gleichung_einfach', name: 'Lineare Gleichungen lösen',
  gen(d) {
    if (d === 1) {
      const x = RNZ(-9, 9), a = R(2, 9) * pick([1, 1, -1]), b = RNZ(-15, 15), c = a * x + b;
      return Q({
        text: 'Löse die Gleichung.',
        math: `${linD(a, b)} = ${sn(c)}`,
        answer: { type: 'num', value: x, reduced: true, tag: 'umformung', traps: [{ value: (c + b) / a, hint: `Auf beiden Seiten ${b > 0 ? '−' + b : '+' + abs(b)} rechnen – das Vorzeichen dreht sich beim „Rüberbringen“ um!`, tag: 'umformung' }] },
        answerText: `x = ${sn(x)}`,
        hint: `Bringe zuerst die ${abs(b)} auf die andere Seite.`,
        solution: [`${linD(a, b)} = ${sn(c)}   | ${b > 0 ? '− ' + b : '+ ' + abs(b)}`, `${sn(a)}x = ${sn(c - b)}   | : ${pn(a)}`, `x = ${sn(x)}`],
      });
    }
    let a, c; do { a = RNZ(-9, 9); c = RNZ(-9, 9); } while (a === c);
    const b = RNZ(-15, 15);
    let xn, xd;
    if (d === 2) { xn = RNZ(-8, 8); xd = 1; }
    else { xd = abs(a - c) === 1 ? 1 : abs(a - c); do xn = RNZ(-20, 20); while (xd > 1 && gcd(xn, xd) !== 1); if (xd === 1) xn = RNZ(-8, 8); }
    const e = ((a - c) * xn) / xd + b;
    if (!Number.isInteger(e)) return this.gen(d);
    const x = xn / xd;
    return Q({
      text: d === 3 ? 'Löse die Gleichung. (Das Ergebnis kann ein Bruch sein.)' : 'Löse die Gleichung.',
      math: `${linD(a, b)} = ${linD(c, e)}`,
      answer: { type: 'num', value: x, reduced: true, tag: 'umformung', traps: [{ value: (e + b) / (a - c), hint: 'Beim Umformen das Vorzeichen beachten: Was auf einer Seite addiert wird, wird auf der anderen subtrahiert.', tag: 'umformung' }] },
      answerText: `x = ${fD(xn, xd)}`,
      hint: 'Bringe alle x-Glieder nach links und alle Zahlen nach rechts.',
      solution: [
        `${linD(a, b)} = ${linD(c, e)}   | ${c > 0 ? '− ' + (c === 1 ? '' : c) + 'x' : '+ ' + (c === -1 ? '' : abs(c)) + 'x'}`,
        `${linD(a - c, b)} = ${sn(e)}   | ${b > 0 ? '− ' + b : '+ ' + abs(b)}`,
        `${sn(a - c)}x = ${sn(e - b)}   | : ${pn(a - c)}`,
        `x = ${fD(xn, xd)}`,
      ],
    });
  },
};

const gleichungSchritte = {
  id: 'gleichung_schritte', name: 'Gleichungen Schritt für Schritt (mit Klammern)',
  gen(d) {
    const k = d === 3 ? RNZ(-5, 5) : R(2, 5), kk = abs(k) === 1 ? 2 * Math.sign(k) : k;
    const p = RNZ(-8, 8), q = d === 1 ? 0 : RNZ(-9, 9);
    let r; do r = RNZ(-6, 6); while (r === kk);
    const x0 = RNZ(-7, 7);
    const s = kk * (x0 + p) + q - r * x0;
    const lhsExpanded = [[kk, 'x'], [kk * p + q, '']];
    const A = kk - r, B = s - kk * p - q;
    const steps = [
      {
        text: '① Löse die Klammer auf. Wie lautet die linke Seite?',
        answer: { type: 'term', value: polyA(lhsExpanded), form: 'noParens', tag: 'klammer', traps: [
          { expr: polyA([[kk, 'x'], [p + q, '']]), hint: `Auch ${sn(p)} muss mit ${sn(kk)} multipliziert werden!`, tag: 'klammer' },
        ] },
        answerText: polyD(lhsExpanded),
      },
      {
        text: '② Bringe alle x nach links und alle Zahlen nach rechts. Ergänze: ☐ · x = ☐',
        answer: { type: 'pair', fields: [{ label: 'Zahl vor x', value: A }, { label: 'rechte Seite', value: B }], alts: [[-A, -B]], tag: 'umformung' },
        answerText: `${sn(A)}x = ${sn(B)}`,
      },
      {
        text: '③ Teile durch die Zahl vor x. x = ?',
        answer: { type: 'num', value: x0, tag: 'umformung' },
        answerText: `x = ${sn(x0)}`,
      },
    ];
    if (d >= 2) steps.push({
      text: `④ Probe: Setze x = ${sn(x0)} in die linke Seite ein. Was kommt heraus?`,
      answer: { type: 'num', value: kk * (x0 + p) + q, tag: 'rechnen' },
      answerText: sn(kk * (x0 + p) + q),
    });
    return Q({
      text: 'Löse Schritt für Schritt – keinen Schritt überspringen!',
      math: `${sn(kk)}(x${op(p)})${q ? op(q) : ''} = ${linD(r, s)}`,
      answer: { type: 'steps' },
      answerText: `x = ${sn(x0)}`,
      steps,
      hint: 'Erst Klammer auflösen, dann sortieren, dann teilen.',
      solution: [
        `${polyD(lhsExpanded)} = ${linD(r, s)}`,
        `${sn(A)}x = ${sn(B)}`,
        `x = ${sn(x0)}`,
        `Probe: links ${sn(kk * (x0 + p) + q)}, rechts ${sn(r * x0 + s)} ✓`,
      ],
    });
  },
};

const textgleichung = {
  id: 'textgleichung', name: 'Textaufgaben mit Gleichungen',
  gen(d) {
    const T = [];
    if (d <= 2) {
      T.push(() => {
        const x = R(2, 10), dd = R(1, 5), S = 2 * x + dd;
        return { text: `Die Katze Mia ist ein paar Jahre alt. Ihr Bruder Felix ist ${dd} Jahre älter als sie. Zusammen sind die beiden ${S} Jahre alt. Wie alt ist Mia?`, value: x, unit: 'Jahre',
          sol: [`x = Alter von Mia, Felix: x + ${dd}`, `x + x + ${dd} = ${S}`, `2x = ${S - dd}`, `x = ${x}`], hint: 'Setze Mias Alter = x. Wie alt ist dann Felix?' };
      });
      T.push(() => {
        const k = R(2, 4), x = R(3, 12), S = (k + 1) * x;
        return { text: `Im Tierheim leben ${['doppelt', 'dreimal', 'viermal'][k - 2]} so viele Katzen wie Hunde. Insgesamt sind es ${S} Tiere. Wie viele Hunde leben dort?`, value: x, unit: 'Hunde',
          sol: [`x = Anzahl Hunde, Katzen: ${k}x`, `x + ${k}x = ${S}`, `${k + 1}x = ${S}`, `x = ${x}`], hint: 'Setze die Anzahl der Hunde = x.' };
      });
    }
    if (d >= 2) {
      T.push(() => {
        const G = pick([10, 15, 20, 25, 30]), P = R(6, 12), x = R(4, 12), S = G + P * x;
        return { text: `Ein Ballettkurs kostet einmalig ${G} € Anmeldegebühr und ${P} € pro Stunde. Insgesamt wurden ${S} € bezahlt. Wie viele Stunden wurden gebucht?`, value: x, unit: 'Stunden',
          sol: [`${G} + ${P}x = ${S}`, `${P}x = ${S - G}`, `x = ${x}`], hint: 'Gesamtpreis = Grundgebühr + Preis pro Stunde · Anzahl Stunden' };
      });
      T.push(() => {
        const x = R(3, 10), dd = R(2, 6), U = 2 * (2 * x + dd);
        return { text: `Eine rechteckige Tanzfläche ist ${dd} m länger als breit. Ihr Umfang beträgt ${U} m. Wie breit ist die Tanzfläche (in m)?`, value: x, unit: 'm',
          sol: [`Breite x, Länge x + ${dd}`, `2·(x + x + ${dd}) = ${U}`, `4x + ${2 * dd} = ${U}`, `x = ${x}`], hint: 'Umfang = 2 · (Länge + Breite)' };
      });
    }
    if (d === 3) {
      T.push(() => {
        const a = R(1, 3), c = R(2, 4), x = R(4, 9), dd = R(3, 8), S = a * (x + dd) + c * x;
        return { text: `Bei einer Ballettaufführung kostet ein Erwachsenenticket ${dd} € mehr als ein Kinderticket. ${a === 1 ? 'Ein Erwachsener' : a + ' Erwachsene'} und ${c} Kinder zahlen zusammen ${S} €. Was kostet ein Kinderticket?`, value: x, unit: '€',
          sol: [`x = Kinderticket, Erwachsene: x + ${dd}`, `${a}(x + ${dd}) + ${c}x = ${S}`, `${a + c}x + ${a * dd} = ${S}`, `x = ${x}`], hint: 'Setze den Preis für ein Kinderticket = x.' };
      });
      T.push(() => {
        const x = R(5, 30), S = 3 * x + 3;
        return { text: `Die Summe von drei aufeinanderfolgenden ganzen Zahlen ist ${S}. Wie heißt die kleinste Zahl?`, value: x, unit: '',
          sol: [`x + (x + 1) + (x + 2) = ${S}`, `3x + 3 = ${S}`, `x = ${x}`], hint: 'Die Zahlen heißen x, x + 1 und x + 2.' };
      });
    }
    const t = pick(T)();
    return Q({
      text: t.text, math: '',
      answer: { type: 'num', value: t.value, tag: 'umformung' },
      answerText: `${t.value}${t.unit ? ' ' + t.unit : ''}`,
      hint: t.hint, solution: t.sol,
    });
  },
};

const bruchgleichung = {
  id: 'bruchgleichung', name: 'Gleichungen mit Brüchen',
  gen(d) {
    if (d === 1) {
      const a = R(2, 6), x = a * RNZ(-6, 6), b = RNZ(-9, 9), c = x / a + b;
      return Q({
        text: 'Löse die Gleichung.', math: `\\f{x}{${a}}${op(b)} = ${sn(c)}`,
        answer: { type: 'num', value: x, tag: 'umformung' }, answerText: `x = ${sn(x)}`,
        hint: `Erst ${b > 0 ? '−' : '+'}${abs(b)}, dann mit ${a} malnehmen.`,
        solution: [`\\f{x}{${a}} = ${sn(c - b)}   | · ${a}`, `x = ${sn(x)}`],
      });
    }
    if (d === 2) {
      let a, b; do { a = R(2, 6); b = R(2, 6); } while (a === b);
      const L = lcm(a, b), x = L * RNZ(-4, 4), c = x / a - x / b;
      return Q({
        text: 'Löse die Gleichung.', math: `\\f{x}{${a}} − \\f{x}{${b}} = ${sn(c)}`,
        answer: { type: 'num', value: x, tag: 'bruch' }, answerText: `x = ${sn(x)}`,
        hint: `Multipliziere die ganze Gleichung mit dem Hauptnenner ${L}.`,
        solution: [`| · ${L}`, `${L / a}x − ${L / b}x = ${sn(c * L)}`, `${sn(L / a - L / b)}x = ${sn(c * L)}`, `x = ${sn(x)}`],
      });
    }
    let a, b; do { a = R(2, 5); b = R(2, 5); } while (a === b);
    const t = RNZ(-4, 5), x0 = RNZ(-8, 8), p = a * t - x0, q = x0 - b * t;
    if (p === 0 || q === 0) return this.gen(d);
    return Q({
      text: 'Löse die Gleichung.', math: `\\f{x${op(p)}}{${a}} = \\f{x${op(-q)}}{${b}}`,
      answer: { type: 'num', value: x0, tag: 'bruch' }, answerText: `x = ${sn(x0)}`,
      hint: `Multipliziere beide Seiten mit ${a * b} (über Kreuz). Klammern nicht vergessen!`,
      solution: [`${b}(x${op(p)}) = ${a}(x${op(-q)})`, `${linD(b, b * p)} = ${linD(a, -a * q)}`, `${polyD([[b - a, 'x']])} = ${sn(-a * q - b * p)}`, `x = ${sn(x0)}`],
    });
  },
};

// ===================================================================
// LINEARE FUNKTIONEN
// ===================================================================
const fracSlopes = { 2: [[1, 2], [-1, 2], [3, 2], [-3, 2], [2, 3], [-2, 3], [1, 3], [-1, 3]], 3: [[3, 4], [-3, 4], [5, 2], [-5, 2], [-4, 3], [4, 3], [1, 4], [-2, 5]] };

const steigung = {
  id: 'steigung', name: 'Steigung aus zwei Punkten',
  gen(d) {
    let mn, md;
    if (d === 1) { mn = RNZ(-4, 4); md = 1; } else { [mn, md] = pick(fracSlopes[d]); }
    const dx = md * R(1, 2) * (d === 3 && Math.random() < 0.5 ? -1 : 1);
    const dy = (mn * dx) / md;
    const x1 = R(-5, 5), y1 = R(-5, 5), x2 = x1 + dx, y2 = y1 + dy;
    const traps = dy !== 0 ? [{ value: dx / dy, hint: 'Steigung = Δy : Δx („hoch durch rüber“) – nicht umgekehrt!', tag: 'steigung' }] : [];
    return Q({
      text: 'Berechne die Steigung m der Geraden durch die Punkte',
      math: `P(${sn(x1)} | ${sn(y1)}) und Q(${sn(x2)} | ${sn(y2)})`,
      answer: { type: 'num', value: mn / md, reduced: true, traps, tag: 'steigung' },
      answerText: `m = ${fD(mn, md)}`,
      hint: 'm = (y₂ − y₁) : (x₂ − x₁)',
      solution: [`m = \\f{${sn(y2)} − ${pn(y1)}}{${sn(x2)} − ${pn(x1)}} = \\f{${dy}}{${dx}}`.replace(/\{-/g, '{−'), `m = ${fD(mn, md)}`],
    });
  },
};

const graphAblesen = {
  id: 'graph_ablesen', name: 'Steigung & y-Achsenabschnitt ablesen',
  gen(d) {
    let mn, md;
    if (d === 1) { mn = pick([1, 2, 3, -1, -2, -3]); md = 1; } else { [mn, md] = pick(fracSlopes[d]); }
    const n = R(-4, 4);
    return Q({
      text: 'Lies am Graphen die Steigung m und den y-Achsenabschnitt n ab (y = mx + n).',
      math: '',
      graph: { mn, md, n },
      answer: { type: 'pair', fields: [{ label: 'm', value: mn / md }, { label: 'n', value: n }], tag: 'steigung', traps: [
        { values: [-mn / md, null], hint: 'Achte auf die Richtung: Fällt die Gerade (von links nach rechts), ist m negativ.', tag: 'steigung' },
        ...(mn !== 0 && md !== mn ? [{ values: [md / mn, null], hint: 'Steigungsdreieck: m = hoch : rüber, nicht rüber : hoch.', tag: 'steigung' }] : []),
      ] },
      answerText: `m = ${fD(mn, md)}, n = ${sn(n)}`,
      hint: 'n: Wo schneidet die Gerade die y-Achse? m: Gehe vom Schnittpunkt nach rechts und zähle, wie weit es hoch oder runter geht.',
      solution: [`Schnitt mit der y-Achse bei ${sn(n)} → n = ${sn(n)}`, `${md} nach rechts, ${abs(mn)} ${mn > 0 ? 'nach oben' : 'nach unten'} → m = ${fD(mn, md)}`],
    });
  },
};

const funktionswert = {
  id: 'funktionswert', name: 'Funktionswerte & Nullstellen',
  gen(d) {
    if (d === 1) {
      const m = RNZ(-5, 5), n = RNZ(-9, 9), k = RNZ(-6, 6), v = m * k + n;
      return Q({
        text: `Gegeben ist f(x) = ${linD(m, n)}. Berechne f(${sn(k)}).`, math: `f(${sn(k)}) = ?`,
        answer: { type: 'num', value: v, tag: 'rechnen' }, answerText: `f(${sn(k)}) = ${sn(v)}`,
        hint: `Setze ${sn(k)} für x ein – mit Klammer!`, solution: [`f(${sn(k)}) = ${sn(m)} · ${pn(k)}${op(n)}`, `= ${sn(v)}`],
      });
    }
    if (d === 2) {
      const m = RNZ(-5, 5), n = RNZ(-10, 10);
      return Q({
        text: `Berechne die Nullstelle von f(x) = ${linD(m, n)}.`, math: `${linD(m, n)} = 0`,
        answer: { type: 'num', value: -n / m, reduced: true, tag: 'umformung' }, answerText: `x = ${fD(-n, m)}`,
        hint: 'Nullstelle: Setze f(x) = 0 und löse nach x auf.', solution: [`${linD(m, n)} = 0`, `${sn(m)}x = ${sn(-n)}`, `x = ${fD(-n, m)}`],
      });
    }
    const [mn, md] = pick(fracSlopes[2]), n = RNZ(-6, 6), x = md * RNZ(-4, 4), c = (mn * x) / md + n;
    return Q({
      text: `Für welches x gilt f(x) = ${sn(c)}?`, math: `f(x) = ${mxnD(mn, md, n)}`,
      answer: { type: 'num', value: x, tag: 'umformung' }, answerText: `x = ${sn(x)}`,
      hint: `Setze ${mxnD(mn, md, n)} = ${sn(c)} und löse nach x auf.`,
      solution: [`${mxnD(mn, md, n)} = ${sn(c)}`, `${mxnD(mn, md, 0)} = ${sn(c - n)}`, `x = ${sn(x)}`],
    });
  },
};

const geradengleichung = {
  id: 'geradengleichung', name: 'Geradengleichung aufstellen',
  gen(d) {
    let mn, md, x1, y1, n, text, math, sol;
    if (d === 1) {
      mn = RNZ(-4, 4); md = 1; x1 = RNZ(-4, 4); y1 = R(-6, 6); n = y1 - mn * x1;
      text = 'Die Gerade hat die Steigung m und geht durch den Punkt P. Gib die Gleichung y = mx + n an.';
      math = `m = ${sn(mn)},  P(${sn(x1)} | ${sn(y1)})`;
      sol = [`Punkt einsetzen: ${sn(y1)} = ${sn(mn)} · ${pn(x1)} + n`, `n = ${sn(n)}`, `y = ${mxnD(mn, 1, n)}`];
    } else {
      if (d === 2) { mn = RNZ(-3, 3); md = 1; } else { [mn, md] = pick(fracSlopes[2]); }
      x1 = md * RNZ(-2, 2); y1 = R(-5, 5); n = y1 - (mn * x1) / md;
      const dx = md * R(1, 2), x2 = x1 + dx, y2 = y1 + (mn * dx) / md;
      text = 'Die Gerade geht durch die Punkte P und Q. Gib die Gleichung y = mx + n an.';
      math = `P(${sn(x1)} | ${sn(y1)}),  Q(${sn(x2)} | ${sn(y2)})`;
      sol = [`m = \\f{${y2 - y1}}{${dx}} = ${fD(mn, md)}`, `P einsetzen: ${sn(y1)} = ${fD(mn, md)} · ${pn(x1)} + n → n = ${sn(n)}`, `y = ${mxnD(mn, md, n)}`];
    }
    return Q({
      text, math,
      answer: { type: 'term', value: mxnA(mn, md, n), form: 'linear', tag: 'steigung', traps: [
        { expr: mxnA(mn, md, y1), hint: 'n ist nicht einfach die y-Koordinate des Punktes – setze den Punkt ein und rechne n aus!', tag: 'steigung' },
      ] },
      answerText: `y = ${mxnD(mn, md, n)}`,
      hint: d === 1 ? 'Setze die Koordinaten von P und m in y = mx + n ein und löse nach n auf.' : 'Erst m mit den zwei Punkten ausrechnen, dann einen Punkt einsetzen und n bestimmen.',
      solution: sol,
    });
  },
};

const funktionAnwendung = {
  id: 'funktion_anwendung', name: 'Lineare Funktionen im Alltag',
  gen(d) {
    const n = pick([5, 8, 10, 12, 15, 20]), m = R(4, 12);
    if (d === 1) {
      const k = R(3, 14), v = n + m * k;
      return Q({
        text: `Eine Katzensitterin verlangt ${n} € Anfahrt und ${m} € pro Tag. Was kostet es für ${k} Tage?`, math: '',
        answer: { type: 'num', value: v, tag: 'rechnen' }, answerText: `${v} €`,
        hint: 'Kosten = Anfahrt + Preis pro Tag · Anzahl Tage', solution: [`${n} + ${m} · ${k} = ${v}`, `Es kostet ${v} €.`],
      });
    }
    if (d === 2) {
      return Q({
        text: `Eine Ballettschule verlangt ${n} € Aufnahmegebühr und ${m} € pro Monat. Gib die Funktion für die Kosten y nach x Monaten an.`, math: 'y = ?',
        answer: { type: 'term', value: linA(m, n), form: 'linear', tag: 'steigung', traps: [{ expr: linA(n, m), hint: 'Was passiert jeden Monat (Steigung m), was nur einmal (n)?', tag: 'vertauscht' }] },
        answerText: `y = ${linD(m, n)}`,
        hint: 'Der feste Betrag ist n, der Betrag pro Monat ist m.', solution: [`m = ${m} (pro Monat), n = ${n} (einmalig)`, `y = ${linD(m, n)}`],
      });
    }
    const k = R(4, 15), B = n + m * k;
    return Q({
      text: `Ein Katzenhotel kostet ${n} € Grundgebühr und ${m} € pro Nacht. Du hast ${B} €. Wie viele Nächte kann deine Katze bleiben?`, math: '',
      answer: { type: 'num', value: k, tag: 'umformung' }, answerText: `${k} Nächte`,
      hint: `Stelle die Gleichung ${n} + ${m}x = ${B} auf.`, solution: [`${n} + ${m}x = ${B}`, `${m}x = ${B - n}`, `x = ${k}`],
    });
  },
};

// ===================================================================
// LINEARE GLEICHUNGSSYSTEME
// ===================================================================
const lgs = {
  id: 'lgs', name: 'Gleichungssysteme lösen',
  gen(d) {
    const x = RNZ(-6, 6), y = R(-6, 6);
    let I, II, sol, hint;
    if (d === 1) {
      let a, c; do { a = RNZ(-4, 4); c = RNZ(-4, 4); } while (a === c);
      const b = y - a * x, e = y - c * x;
      I = `y = ${linD(a, b)}`; II = `y = ${linD(c, e)}`;
      hint = 'Gleichsetzungsverfahren: Setze die rechten Seiten gleich.';
      sol = [`${linD(a, b)} = ${linD(c, e)}`, `x = ${sn(x)}`, `In I einsetzen: y = ${sn(y)}`];
    } else if (d === 2) {
      const a = RNZ(-4, 4), b = y - a * x, c = RNZ(-5, 5), e = RNZ(-4, 4), f = c * x + e * y;
      I = `y = ${linD(a, b)}`; II = `${polyD([[c, 'x'], [e, 'y']])} = ${sn(f)}`;
      if (c + e * a === 0) return this.gen(d);
      hint = 'Einsetzungsverfahren: Setze I für y in II ein. Klammer nicht vergessen!';
      sol = [`${sn(c)}x ${e < 0 ? '−' : '+'} ${abs(e)}·(${linD(a, b)}) = ${sn(f)}`, `x = ${sn(x)}`, `y = ${sn(y)}`];
    } else {
      let a1, b1, a2, b2; do { a1 = RNZ(-6, 6); b1 = RNZ(-6, 6); a2 = RNZ(-6, 6); b2 = RNZ(-6, 6); } while (a1 * b2 - a2 * b1 === 0 || abs(a1) === abs(a2));
      const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      I = `${polyD([[a1, 'x'], [b1, 'y']])} = ${sn(c1)}`; II = `${polyD([[a2, 'x'], [b2, 'y']])} = ${sn(c2)}`;
      hint = 'Additionsverfahren: Multipliziere eine (oder beide) Gleichungen so, dass sich beim Addieren x oder y aufhebt.';
      sol = ['Gleichungen so multiplizieren, dass y wegfällt, dann addieren.', `x = ${sn(x)}`, `Einsetzen: y = ${sn(y)}`];
    }
    return Q({
      text: 'Löse das Gleichungssystem.',
      math: `I: ${I}<br>II: ${II}`,
      answer: { type: 'pair', fields: [{ label: 'x', value: x }, { label: 'y', value: y }], tag: 'umformung' },
      answerText: `x = ${sn(x)}, y = ${sn(y)}`,
      hint, solution: [...sol, `Probe in beiden Gleichungen ✓`],
    });
  },
};

const lgsText = {
  id: 'lgs_text', name: 'Textaufgaben mit zwei Unbekannten',
  gen(d) {
    const T = [
      () => {
        const x = R(2, 12), y = R(2, 12);
        return { text: `Auf einem Bauernhof leben Katzen und Hühner. Zusammen haben sie ${x + y} Köpfe und ${4 * x + 2 * y} Beine. Wie viele Katzen und wie viele Hühner sind es?`,
          f: ['Katzen', 'Hühner'], v: [x, y], sol: [`I: x + y = ${x + y}`, `II: 4x + 2y = ${4 * x + 2 * y}`, `x = ${x} Katzen, y = ${y} Hühner`] };
      },
      () => {
        const A = pick([8, 9, 10, 12]), K = pick([4, 5, 6]), x = R(2, 15), y = R(2, 15);
        return { text: `Für eine Ballettaufführung wurden ${x + y} Tickets verkauft: Erwachsene zahlen ${A} €, Kinder ${K} €. Insgesamt wurden ${A * x + K * y} € eingenommen. Wie viele Erwachsenen- und wie viele Kindertickets waren es?`,
          f: ['Erwachsene', 'Kinder'], v: [x, y], sol: [`I: x + y = ${x + y}`, `II: ${A}x + ${K}y = ${A * x + K * y}`, `x = ${x}, y = ${y}`] };
      },
      () => {
        const s = R(15, 40), t = R(10, 30), a = 2, b = 1, c = 1, e = 3;
        return { text: `2 Paar Ballettschuhe und 1 Trikot kosten ${a * s + b * t} €. 1 Paar Ballettschuhe und 3 Trikots kosten ${c * s + e * t} €. Was kostet ein Paar Schuhe, was ein Trikot?`,
          f: ['Schuhe (€)', 'Trikot (€)'], v: [s, t], sol: [`I: 2s + t = ${a * s + b * t}`, `II: s + 3t = ${c * s + e * t}`, `s = ${s} €, t = ${t} €`] };
      },
    ];
    const t = pick(d === 1 ? T.slice(0, 1) : T)();
    return Q({
      text: t.text, math: '',
      answer: { type: 'pair', fields: [{ label: t.f[0], value: t.v[0] }, { label: t.f[1], value: t.v[1] }], tag: 'umformung' },
      answerText: `${t.f[0]}: ${t.v[0]}, ${t.f[1]}: ${t.v[1]}`,
      hint: 'Lege zwei Variablen fest und stelle zwei Gleichungen auf (I und II).',
      solution: t.sol,
    });
  },
};

// ===================================================================
// PROZENTRECHNUNG (Wiederholung)
// ===================================================================
const prozent = {
  id: 'prozent', name: 'Prozentwert, Prozentsatz, Grundwert',
  gen(d) {
    const p = pick([5, 10, 15, 20, 25, 30, 40, 60, 75]);
    if (d === 1) {
      const G = pick([20, 40, 60, 80, 120, 200, 240]), W = (G * p) / 100;
      return Q({ text: `In einer Ballettschule tanzen ${G} Kinder. ${p} % davon sind in der Spitzenschuh-Gruppe. Wie viele Kinder sind das?`, math: '',
        answer: { type: 'num', value: W, tol: 0.01, tag: 'prozent' }, answerText: dec(W),
        hint: 'Prozentwert W = G · p : 100', solution: [`W = ${G} · ${p} : 100`, `W = ${dec(W)}`] });
    }
    if (d === 2) {
      const G = pick([20, 25, 40, 50, 80, 200]), W = (G * p) / 100;
      if (!Number.isInteger(W)) return this.gen(d);
      return Q({ text: `Von ${G} Katzen im Tierheim sind ${W} schwarz. Wie viel Prozent sind das?`, math: '',
        answer: { type: 'num', value: p, tol: 0.01, tag: 'prozent', traps: [{ value: W / G, hint: 'Fast! Du hast den Anteil als Dezimalzahl – mal 100 ergibt die Prozent.', tag: 'prozent' }] }, answerText: `${p} %`,
        hint: 'Prozentsatz p = W : G · 100', solution: [`p = ${W} : ${G} · 100`, `p = ${p} %`] });
    }
    const W = pick([6, 9, 12, 15, 18, 24, 30]), G = (W * 100) / p;
    if (!Number.isInteger(G)) return this.gen(d);
    return Q({ text: `${W} Katzen im Tierheim sind ${p} % aller Tiere. Wie viele Tiere leben insgesamt im Tierheim?`, math: '',
      answer: { type: 'num', value: G, tol: 0.01, tag: 'prozent', traps: [{ value: (W * p) / 100, hint: 'Gesucht ist der Grundwert (das Ganze): G = W : p · 100.', tag: 'prozent' }] }, answerText: dec(G),
      hint: 'Grundwert G = W : p · 100', solution: [`G = ${W} : ${p} · 100`, `G = ${dec(G)}`] });
  },
};

const prozentAenderung = {
  id: 'prozent_aenderung', name: 'Rabatt & Preiserhöhung',
  gen(d) {
    const p = pick([10, 15, 20, 25, 30, 40]);
    if (d === 1) {
      const P = pick([24, 36, 48, 60, 80, 120]), N = P * (1 - p / 100);
      return Q({ text: `Neue Ballettschuhe kosten ${P} €. Im Sale gibt es ${p} % Rabatt. Wie viel kosten sie jetzt?`, math: '',
        answer: { type: 'num', value: N, tol: 0.01, tag: 'prozent', traps: [{ value: (P * p) / 100, hint: 'Das ist nur der Rabatt – ziehe ihn noch vom Preis ab!', tag: 'prozent' }] }, answerText: money(N),
        hint: `Neuer Preis = ${P} € · ${dec(1 - p / 100)}`, solution: [`${100 - p} % von ${P} €`, `${P} · ${dec(1 - p / 100)} = ${money(N)}`] });
    }
    if (d === 2) {
      const P = pick([20, 40, 50, 80]), N = P * (1 + p / 100);
      return Q({ text: `Ein Kratzbaum kostete ${P} €. Der Preis wurde um ${p} % erhöht. Was kostet er jetzt?`, math: '',
        answer: { type: 'num', value: N, tol: 0.01, tag: 'prozent', traps: [{ value: (P * p) / 100, hint: 'Das ist nur die Erhöhung – addiere sie noch zum alten Preis!', tag: 'prozent' }] }, answerText: money(N),
        hint: `Neuer Preis = ${P} € · ${dec(1 + p / 100)}`, solution: [`${100 + p} % von ${P} €`, `${P} · ${dec(1 + p / 100)} = ${money(N)}`] });
    }
    const P = pick([40, 60, 80, 100, 120, 150]), N = P * (1 - p / 100);
    return Q({ text: `Nach ${p} % Rabatt kostet ein Ballett-Trikot ${money(N)}. Wie teuer war es vorher?`, math: '',
      answer: { type: 'num', value: P, tol: 0.01, tag: 'prozent', traps: [{ value: N * (1 + p / 100), hint: `Vorsicht: Die ${p} % beziehen sich auf den ALTEN Preis. Rechne ${dec(N)} : ${dec(1 - p / 100)}.`, tag: 'prozent' }] }, answerText: money(P),
      hint: `${money(N)} sind ${100 - p} % des alten Preises.`, solution: [`${money(N)} = ${100 - p} % des alten Preises`, `alter Preis = ${dec(N)} : ${dec(1 - p / 100)} = ${money(P)}`] });
  },
};

// ===================================================================
export const mathe = {
  id: 'mathe', name: 'Mathematik', short: 'Mathe', icon: '📐', color: '#8b5cf6',
  topics: [
    { id: 'binome', name: 'Binomische Formeln & Pascal', icon: '🎀', current: true, skills: [binomisch, binomDezimal, binomVorzeichen, pascal, binomFaktor, binomGleichung] },
    { id: 'wahrscheinlichkeit', name: 'Wahrscheinlichkeit', icon: '🎲', current: true, skills: [laplace, baumdiagramm] },
    { id: 'terme', name: 'Terme & Klammern', icon: '🧩', skills: [zusammenfassen, klammer, ausmultiplizieren, faktorisieren] },
    { id: 'gleichungen', name: 'Lineare Gleichungen', icon: '⚖️', skills: [gleichungEinfach, gleichungSchritte, bruchgleichung, textgleichung] },
    { id: 'funktionen', name: 'Lineare Funktionen', icon: '📈', skills: [steigung, graphAblesen, funktionswert, geradengleichung, funktionAnwendung] },
    { id: 'lgs', name: 'Gleichungssysteme', icon: '🔗', skills: [lgs, lgsText] },
    { id: 'brueche', name: 'Brüche & Vorzeichen (Wdh.)', icon: '🍰', skills: [bruchAdd, bruchMul, vorzeichen] },
    { id: 'prozent', name: 'Prozentrechnung (Wdh.)', icon: '🏷️', skills: [prozent, prozentAenderung] },
  ],
};
