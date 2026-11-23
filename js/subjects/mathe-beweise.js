// Aktueller Stoff (Hefter 15.10./03.11.2026): Arithmetische Beweise.
// Zahlen als Term darstellen, Term aufstellen, umformen und die Eigenschaft sichtbar machen.
import { R, pick, Q } from './helpers.js';

// ---------- Zahlen als Term darstellen ----------
const DARST = {
  1: [
    () => ({ q: 'eine beliebige gerade Zahl', v: '2n', d: '2n', alts: [] }),
    () => ({ q: 'eine beliebige ungerade Zahl', v: '2n+1', d: '2n + 1', alts: ['2n-1'] }),
    () => ({ q: 'den Vorgänger der Zahl n', v: 'n-1', d: 'n − 1', alts: [] }),
    () => ({ q: 'den Nachfolger der Zahl n', v: 'n+1', d: 'n + 1', alts: [] }),
    () => ({ q: 'eine beliebige Quadratzahl', v: 'n^2', d: 'n²', alts: [] }),
    () => { const k = R(3, 9); return { q: `eine beliebige durch ${k} teilbare Zahl`, v: `${k}n`, d: `${k}n`, alts: [] }; },
  ],
  2: [
    () => { const k = R(3, 9), r = R(1, k - 1); return { q: `eine Zahl, die beim Teilen durch ${k} den Rest ${r} lässt`, v: `${k}n+${r}`, d: `${k}n + ${r}`, alts: [] }; },
    () => ({ q: 'die nächste gerade Zahl nach 2n', v: '2n+2', d: '2n + 2', alts: [] }),
    () => ({ q: 'die nächste ungerade Zahl nach 2n + 1', v: '2n+3', d: '2n + 3', alts: [] }),
    () => ({ q: 'das Doppelte des Nachfolgers von n', v: '2(n+1)', d: '2(n + 1)', alts: [] }),
    () => ({ q: 'das Quadrat des Vorgängers von n', v: '(n-1)^2', d: '(n − 1)²', alts: [] }),
    () => ({ q: 'die Summe aus der Zahl n und ihrem Nachfolger', v: 'n+(n+1)', d: 'n + (n + 1) = 2n + 1', alts: [] }),
  ],
  3: [
    () => ({ q: 'die Summe von drei aufeinanderfolgenden Zahlen (die kleinste ist n)', v: 'n+(n+1)+(n+2)', d: 'n + (n + 1) + (n + 2) = 3n + 3', alts: [], trap: { expr: '3n+2', hint: 'Zähle die Zahlen nochmal zusammen: 0 + 1 + 2 = 3, also 3n + 3 – nicht 3n + 2!' } }),
    () => ({ q: 'das Produkt zweier aufeinanderfolgender ungerader Zahlen (die kleinere ist 2n + 1)', v: '(2n+1)(2n+3)', d: '(2n + 1)(2n + 3)', alts: [] }),
    () => ({ q: 'die Differenz der Quadrate von n + 1 und n', v: '(n+1)^2-n^2', d: '(n + 1)² − n² = 2n + 1', alts: [], trap: { expr: 'n^2-(n+1)', hint: 'Beide Zahlen werden quadriert: (n + 1)² − n²' } }),
    () => ({ q: 'das Quadrat einer beliebigen geraden Zahl', v: '(2n)^2', d: '(2n)² = 4n²', alts: [], trap: { expr: '2n^2', hint: 'Die ganze gerade Zahl 2n wird quadriert: (2n)² = 4n², nicht 2n².' } }),
    () => ({ q: 'die Summe von vier aufeinanderfolgenden Zahlen (die kleinste ist n)', v: '4n+6', d: 'n + (n+1) + (n+2) + (n+3) = 4n + 6', alts: [] }),
  ],
};

export const termDarstellung = {
  id: 'term_darstellung', name: 'Zahlen als Term darstellen',
  gen(d) {
    const s = pick(DARST[d])();
    return Q({
      text: `Schreibe als Term mit der Variablen n: ${s.q}.`, math: '',
      answer: { type: 'term', value: s.v, alts: s.alts, tag: 'beweis', traps: s.trap ? [{ ...s.trap, tag: 'beweis' }] : [] },
      answerText: s.d,
      hint: 'Gerade: 2n · ungerade: 2n + 1 · Nachfolger: n + 1 · Vorgänger: n − 1 · Quadratzahl: n² · Rest r beim Teilen durch k: kn + r',
      solution: [`${s.q} → ${s.d}`],
    });
  },
};

// ---------- Beweise Schritt für Schritt ----------
// form: { k, r } = "k·(…) + r" sichtbar machen; 'square' = "(…)²" sichtbar machen
const SAETZE = {
  1: [
    { s: 'Die Summe einer geraden und einer ungeraden Zahl ist ungerade.', vars: 'gerade Zahl: 2n, ungerade Zahl: 2m + 1', t: '2n+(2m+1)', e: '2n+2m+1', f: '2(n+m)+1', form: { k: 2, r: 1 }, fd: '2(n + m) + 1', why: 'Die Form 2·(…) + 1 ist immer ungerade.' },
    { s: 'Die Summe zweier ungerader Zahlen ist gerade.', vars: 'ungerade Zahlen: 2n + 1 und 2m + 1', t: '(2n+1)+(2m+1)', e: '2n+2m+2', f: '2(n+m+1)', form: { k: 2, r: 0 }, fd: '2(n + m + 1)', why: 'Die Form 2·(…) ist immer gerade.' },
    { s: 'Die Summe von drei aufeinanderfolgenden natürlichen Zahlen ist durch 3 teilbar.', vars: 'Zahlen: n, n + 1, n + 2', t: 'n+(n+1)+(n+2)', e: '3n+3', f: '3(n+1)', form: { k: 3, r: 0 }, fd: '3(n + 1)', why: 'Die Form 3·(…) ist immer durch 3 teilbar.', trap: { expr: '3n+2', hint: 'Nochmal zählen: 1 + 2 = 3 → 3n + 3, nicht 3n + 2!' } },
    { s: 'Die Differenz zweier benachbarter Quadratzahlen ist ungerade.', vars: 'Quadratzahlen: n² und (n + 1)²', t: '(n+1)^2-n^2', e: '2n+1', f: '2n+1', form: { k: 2, r: 1 }, fd: '2n + 1', why: '2n + 1 ist immer ungerade.', ttrap: { expr: 'n^2-(n+1)', hint: 'Beide Zahlen werden quadriert: (n + 1)² − n²' } },
    { s: 'Das Vierfache einer Quadratzahl ist wieder eine Quadratzahl.', vars: 'Quadratzahl: n²', t: '4n^2', e: '4n^2', f: '(2n)^2', form: 'square', fd: '(2n)²', why: '(2n)² ist das Quadrat der Zahl 2n.', ttrap: { expr: 'n(n+2)+1', hint: 'Das gehört zu einem anderen Satz! Hier geht es um das VIERFACHE einer Quadratzahl: 4 · n²' } },
  ],
  2: [
    { s: 'Das Produkt zweier ungerader Zahlen ist ungerade.', vars: 'ungerade Zahlen: 2n + 1 und 2m + 1', t: '(2n+1)(2m+1)', e: '4nm+2n+2m+1', f: '2(2nm+n+m)+1', form: { k: 2, r: 1 }, fd: '2(2nm + n + m) + 1', why: 'Die Form 2·(…) + 1 ist immer ungerade.' },
    { s: 'Das Quadrat einer ungeraden Zahl ist ungerade.', vars: 'ungerade Zahl: 2n + 1', t: '(2n+1)^2', e: '4n^2+4n+1', f: '2(2n^2+2n)+1', form: { k: 2, r: 1 }, fd: '2(2n² + 2n) + 1', why: 'Die Form 2·(…) + 1 ist immer ungerade.' },
    { s: 'Das Quadrat einer geraden Zahl ist durch 4 teilbar.', vars: 'gerade Zahl: 2n', t: '(2n)^2', e: '4n^2', f: '4n^2', form: { k: 4, r: 0 }, fd: '4 · n²', why: 'Die Form 4·(…) ist immer durch 4 teilbar.', ttrap: { expr: '2n^2', hint: 'Die ganze Zahl 2n wird quadriert: (2n)² = 4n²' } },
    { s: 'Die Summe von fünf aufeinanderfolgenden Zahlen ist durch 5 teilbar.', vars: 'Zahlen: n, n + 1, …, n + 4', t: 'n+(n+1)+(n+2)+(n+3)+(n+4)', e: '5n+10', f: '5(n+2)', form: { k: 5, r: 0 }, fd: '5(n + 2)', why: 'Die Form 5·(…) ist immer durch 5 teilbar.' },
    { s: 'Multipliziert man zwei Zahlen mit dem Abstand 2 und addiert 1, erhält man das Quadrat der Zahl dazwischen.', vars: 'Zahlen: n und n + 2 (dazwischen: n + 1)', t: 'n(n+2)+1', e: 'n^2+2n+1', f: '(n+1)^2', form: 'square', fd: '(n + 1)²', why: '(n + 1)² ist das Quadrat der Zahl dazwischen (1. binomische Formel rückwärts).' },
    { s: 'Die Summe zweier aufeinanderfolgender ungerader Zahlen ist durch 4 teilbar.', vars: 'ungerade Zahlen: 2n + 1 und 2n + 3', t: '(2n+1)+(2n+3)', e: '4n+4', f: '4(n+1)', form: { k: 4, r: 0 }, fd: '4(n + 1)', why: 'Die Form 4·(…) ist immer durch 4 teilbar.' },
    { s: 'Addiert man eine Zahl mit Rest 2 und eine Zahl mit Rest 3 beim Teilen durch 5, ist die Summe durch 5 teilbar.', vars: 'Zahlen: 5n + 2 und 5m + 3', t: '(5n+2)+(5m+3)', e: '5n+5m+5', f: '5(n+m+1)', form: { k: 5, r: 0 }, fd: '5(n + m + 1)', why: 'Die Form 5·(…) ist immer durch 5 teilbar.' },
  ],
  3: [
    { s: 'Quadriert man eine ungerade Zahl, lässt die Quadratzahl beim Teilen durch 4 den Rest 1.', vars: 'ungerade Zahl: 2n + 1', t: '(2n+1)^2', e: '4n^2+4n+1', f: '4(n^2+n)+1', form: { k: 4, r: 1 }, fd: '4(n² + n) + 1', why: 'Die Form 4·(…) + 1 lässt beim Teilen durch 4 den Rest 1.' },
    { s: 'Die Summe von vier aufeinanderfolgenden Zahlen ist NICHT durch 4 teilbar.', vars: 'Zahlen: n, n + 1, n + 2, n + 3', t: 'n+(n+1)+(n+2)+(n+3)', e: '4n+6', f: '4(n+1)+2', form: { k: 4, r: 2 }, fd: '4(n + 1) + 2', why: 'Die Form 4·(…) + 2 lässt beim Teilen durch 4 immer den Rest 2 – also nie durch 4 teilbar.' },
    { s: 'Die Differenz der Quadrate zweier aufeinanderfolgender ungerader Zahlen ist durch 8 teilbar.', vars: 'ungerade Zahlen: 2n + 1 und 2n + 3', t: '(2n+3)^2-(2n+1)^2', e: '8n+8', f: '8(n+1)', form: { k: 8, r: 0 }, fd: '8(n + 1)', why: 'Die Form 8·(…) ist immer durch 8 teilbar.', etrap: { expr: '8n+10', hint: 'Minus vor der Klammer: −(2n + 1)² = −(4n² + 4n + 1) = −4n² − 4n − 1' } },
    { s: 'Die Differenz der Quadrate zweier aufeinanderfolgender Zahlen ist gleich der Summe dieser beiden Zahlen.', vars: 'Zahlen: n und n + 1', t: '(n+1)^2-n^2', e: '2n+1', f: 'n+(n+1)', form: null, fd: 'n + (n + 1)', why: '2n + 1 = n + (n + 1) ist genau die Summe der beiden Zahlen.', ttrap: { expr: 'n^2-(n+1)', hint: 'Beide Zahlen werden quadriert: (n + 1)² − n²' } },
  ],
};

export const beweis = {
  id: 'beweis', name: 'Arithmetische Beweise Schritt für Schritt',
  gen(d) {
    const B = pick(SAETZE[d]);
    const formText = B.form === 'square' ? 'als Quadrat (…)²'
      : !B.form ? 'als Summe der beiden Zahlen'
      : B.form.r === 0 ? `als ${B.form.k} · (…)` : `als ${B.form.k} · (…) + ${B.form.r}`;
    const traps1 = B.ttrap ? [{ ...B.ttrap, tag: 'beweis' }] : [];
    const traps2 = [...(B.trap ? [{ ...B.trap, tag: 'rechnen' }] : []), ...(B.etrap ? [{ ...B.etrap, tag: 'klammer' }] : [])];
    return Q({
      text: `Beweise: ${B.s}`, math: '',
      answer: { type: 'steps' }, answerText: B.fd,
      steps: [
        { text: `① Stelle den Term auf. (${B.vars})`, answer: { type: 'term', value: B.t, tag: 'beweis', traps: traps1 }, answerText: B.t.replace(/\^2/g, '²').replace(/\*/g, '·') },
        { text: '② Vereinfache (ausmultiplizieren, zusammenfassen).', answer: { type: 'term', value: B.e, form: 'simplified', tag: 'rechnen', traps: traps2 }, answerText: B.e.replace(/\^2/g, '²') },
        { text: `③ Schreibe den Term so, dass man die Aussage sieht: ${formText}.`, answer: { type: 'term', value: B.f, form: B.form ? 'proof' : undefined, proof: B.form || undefined, tag: 'beweis' }, answerText: B.fd },
      ],
      hint: 'Erst die Zahlen als Terme schreiben, dann vereinfachen, zum Schluss ausklammern, damit man die Eigenschaft erkennt.',
      solution: [`${B.t.replace(/\^2/g, '²')} = ${B.e.replace(/\^2/g, '²')} = ${B.fd}`, B.why, 'Damit ist die Aussage für alle Zahlen bewiesen. ✓'],
    });
  },
};
