// Aktueller Stoff (Hefter 19.11.2026): Laplace-Wahrscheinlichkeit, Prozent runden, Baumdiagramme.
import { R, pick, fr, fD, dc, Q } from './helpers.js';

const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function laplaceSituation() {
  const t = R(1, 6);
  if (t === 1) {
    const N = pick([20, 30, 40, 50, 100]);
    const k = R(3, 9);
    const evs = [
      ['eine Schnapszahl (11, 22, 33, …)', n => n > 10 && n < 100 && n % 11 === 0],
      [`ein Vielfaches von ${k}`, n => n % k === 0],
      ['eine Quadratzahl', n => Number.isInteger(Math.sqrt(n))],
      ...(N <= 50 ? [['eine Primzahl', isPrime]] : []),
    ];
    const [name, f] = pick(evs);
    const fav = range(1, N).filter(f);
    return { text: `Ein Glücksrad hat ${N} gleich große Felder mit den Zahlen 1 bis ${N}. Wie groß ist die Wahrscheinlichkeit, dass die Zahl ${name} ist?`, fav: fav.length, total: N, list: fav };
  }
  if (t === 2) {
    const k = R(2, 4);
    const [name, f] = pick([['eine gerade Zahl', n => n % 2 === 0], [`eine Zahl größer als ${k}`, n => n > k], ['eine Primzahl', isPrime], [`höchstens eine ${k}`, n => n <= k]]);
    const fav = range(1, 6).filter(f);
    return { text: `Du würfelst mit einem normalen Würfel. Wie groß ist die Wahrscheinlichkeit für ${name}?`, fav: fav.length, total: 6, list: fav };
  }
  if (t === 3) {
    const k = R(5, 20);
    const [name, n] = pick([['Rot', 18], ['die Null', 1], [`das ${pick(['erste', 'zweite', 'dritte'])} Dutzend`, 12], ['eine gerade Zahl (die 0 zählt nicht)', 18], [`eine Zahl von 1 bis ${k}`, k]]);
    return { text: `Beim Roulette gibt es 37 Felder (0 bis 36), davon 18 rot, 18 schwarz und die grüne Null. Wie groß ist die Wahrscheinlichkeit für ${name}?`, fav: n, total: 37 };
  }
  if (t === 4) {
    const r = R(2, 8), l = R(2, 8), w = R(2, 8), n = r + l + w;
    const [name, f] = pick([['rosa', r], ['lila', l], ['NICHT weiß', r + l]]);
    return { text: `Im Katzenkorb liegen ${r} rosa, ${l} lila und ${w} weiße Wollknäuel. Die Katze schnappt sich blind eines. Wie groß ist die Wahrscheinlichkeit, dass es ${name} ist?`, fav: f, total: n };
  }
  if (t === 5) {
    const [name, n] = pick([['eine Herz-Karte', 8], ['ein Ass', 4], ['eine rote Karte', 16], ['eine Dame oder ein König', 8], ['eine Bildkarte (Bube, Dame, König)', 12]]);
    return { text: `Aus einem Skatspiel (32 Karten: 4 Farben mit je 7, 8, 9, 10, Bube, Dame, König, Ass) wird eine Karte gezogen. Wie groß ist die Wahrscheinlichkeit für ${name}?`, fav: n, total: 32 };
  }
  const n = R(8, 16), k = R(2, n - 2);
  return { text: `Ein Glücksrad hat ${n} gleich große Felder. Auf ${k} Feldern ist eine Katze abgebildet. Wie groß ist die Wahrscheinlichkeit, auf einer Katze zu landen?`, fav: k, total: n };
}

export const laplace = {
  id: 'laplace', name: 'Laplace-Wahrscheinlichkeit',
  gen(d) {
    if (d === 3 && Math.random() < 0.6) {
      const N = pick([20, 30, 40, 50]);
      let a, b; do { a = R(2, 6); b = R(3, 9); } while (a >= b || b % a === 0);
      const A = range(1, N).filter(n => n % a === 0), B = range(1, N).filter(n => n % b === 0);
      const both = A.filter(n => n % b === 0), fav = A.length + B.length - both.length;
      if (!both.length) return this.gen(d);
      const [rn, rd] = fr(fav, N);
      return Q({
        text: `Aus den Zahlen 1 bis ${N} wird eine zufällig gezogen. Wie groß ist die Wahrscheinlichkeit, dass sie durch ${a} ODER durch ${b} teilbar ist? (gekürzter Bruch)`, math: '',
        answer: { type: 'num', value: fav / N, reduced: true, prob: true, tag: 'rechnen', traps: [{ value: (A.length + B.length) / N, hint: `Zahlen wie ${both[0]} sind durch beide teilbar – die darfst du nur EINMAL zählen!`, tag: 'rechnen' }] },
        answerText: fD(rn, rd), hint: 'Schreibe alle günstigen Zahlen auf, aber jede nur einmal.',
        solution: [`Durch ${a}: ${A.length} Zahlen, durch ${b}: ${B.length} Zahlen`, `Doppelt gezählt (durch beide): ${both.join(', ')}`, `günstig: ${A.length} + ${B.length} − ${both.length} = ${fav}`, `P = \\f{${fav}}{${N}} = ${fD(rn, rd)}`],
      });
    }
    const s = laplaceSituation();
    if (s.fav === 0 || s.fav === s.total) return this.gen(d);
    const p = s.fav / s.total, [rn, rd] = fr(s.fav, s.total);
    const sol = [`günstige Ergebnisse: ${s.fav}${s.list && s.list.length <= 12 ? ' (' + s.list.join(', ') + ')' : ''}`, `mögliche Ergebnisse: ${s.total}`, `P = \\f{${s.fav}}{${s.total}}${rd !== s.total ? ' = ' + fD(rn, rd) : ''}`];
    if (d === 1) {
      return Q({
        text: s.text + ' (als gekürzter Bruch)', math: '',
        answer: { type: 'num', value: p, reduced: true, prob: true, tag: 'rechnen', traps: [{ value: (s.total - s.fav) / s.total, hint: 'Das ist die Gegenwahrscheinlichkeit – du hast die ungünstigen Ergebnisse gezählt.', tag: 'lesen' }] },
        answerText: fD(rn, rd), hint: 'P = Anzahl günstige Ergebnisse : Anzahl mögliche Ergebnisse',
        solution: sol,
      });
    }
    const pct = Math.round(p * 1000) / 10, trunc = Math.floor(p * 1000) / 10;
    const traps = [{ value: p, hint: 'Das ist die Wahrscheinlichkeit als Dezimalzahl – für Prozent noch mal 100 rechnen.', tag: 'prozent' }];
    if (trunc !== pct) traps.unshift({ value: trunc, hint: `Richtig runden! Die nächste Ziffer ist 5 oder größer → aufrunden: ${dc(p * 100).slice(0, 6)}… % ≈ ${dc(pct)} %`, tag: 'runden' });
    return Q({
      text: s.text + ' Gib das Ergebnis in Prozent an (auf eine Nachkommastelle gerundet).', math: '',
      answer: { type: 'num', value: pct, tol: 0.051, tag: 'runden', traps }, answerText: `${dc(pct)} %`,
      hint: 'Erst den Bruch aufstellen, dann Zähler : Nenner · 100 – und auf die 1. Nachkommastelle runden.',
      solution: [...sol, `${s.fav} : ${s.total} = ${dc(p).slice(0, 8)}… → ${dc(pct)} %`],
    });
  },
};

// -------------------------------------------------------------------
const pf = (n, d) => { const [a, b] = fr(n, d); return b === 1 ? String(a) : `${a}/${b}`; };

export const baumdiagramm = {
  id: 'baumdiagramm', name: 'Baumdiagramme (Pfad- & Summenregel)',
  gen(d) {
    if (d === 1) {
      const t = R(1, 4);
      const S = [
        () => ({ text: 'Eine Münze wird zweimal geworfen. Wie groß ist die Wahrscheinlichkeit für zweimal Kopf?', n: 1, dd: 4, wrong: 1, sol: ['Pfad K → K', 'P = \\f{1}{2} · \\f{1}{2} = \\f{1}{4}'], tree: { a: 'K', b: 'Z', p: [1, 2], q: [[1, 2], [1, 2]] } }),
        () => ({ text: 'Eine Münze wird zweimal geworfen. Wie groß ist die Wahrscheinlichkeit für genau einmal Kopf?', n: 1, dd: 2, wrong: 1 / 4, single: true, sol: ['Zwei Pfade: K → Z und Z → K', 'P = \\f{1}{4} + \\f{1}{4} = \\f{1}{2}'], tree: { a: 'K', b: 'Z', p: [1, 2], q: [[1, 2], [1, 2]] } }),
        () => ({ text: 'Du wirfst erst eine Münze, dann einen Würfel. Wie groß ist die Wahrscheinlichkeit für „Kopf“ und eine 6?', n: 1, dd: 12, wrong: 1 / 2 + 1 / 6, sol: ['Pfadregel: Wahrscheinlichkeiten entlang des Pfades multiplizieren', 'P = \\f{1}{2} · \\f{1}{6} = \\f{1}{12}'] }),
        () => ({ text: 'Du würfelst zweimal. Wie groß ist die Wahrscheinlichkeit für zwei Sechsen?', n: 1, dd: 36, wrong: 2 / 6, sol: ['P = \\f{1}{6} · \\f{1}{6} = \\f{1}{36}'] }),
      ][t - 1]();
      const traps = [{ value: S.wrong, hint: S.single ? 'Es gibt ZWEI passende Pfade – addiere ihre Wahrscheinlichkeiten (Summenregel).' : 'Entlang eines Pfades wird MULTIPLIZIERT, nicht addiert (Pfadregel).', tag: 'pfadregel' }];
      return Q({
        text: S.text + ' (als Bruch)', math: '', tree: S.tree,
        answer: { type: 'num', value: S.n / S.dd, reduced: true, prob: true, tag: 'pfadregel', traps },
        answerText: fD(S.n, S.dd), hint: 'Pfadregel: entlang eines Pfades multiplizieren. Summenregel: mehrere Pfade addieren.',
        solution: S.sol,
      });
    }
    const r = R(2, 6), b = R(2, 6), n = r + b, back = d === 2;
    const ev = pick(['rr', 'eins', 'mind', 'gleich']);
    const n2 = back ? n : n - 1;
    const rr = back ? r * r : r * (r - 1), bb = back ? b * b : b * (b - 1), rb = r * b, den = n * n2;
    const num = { rr, eins: 2 * rb, mind: den - bb, gleich: rr + bb }[ev];
    const name = { rr: 'zweimal rosa', eins: 'genau ein rosa und ein lila Haarband', mind: 'mindestens ein rosa Haarband', gleich: 'zwei Haarbänder der gleichen Farbe' }[ev];
    const traps = [];
    if (ev === 'rr') traps.push({ value: (2 * r) / n, hint: 'Entlang eines Pfades wird MULTIPLIZIERT, nicht addiert (Pfadregel).', tag: 'pfadregel' });
    if (ev === 'eins') traps.push({ value: rb / den, hint: 'Zwei Pfade führen zum Ziel (rosa → lila und lila → rosa) – addiere beide (Summenregel).', tag: 'pfadregel' });
    if (ev === 'mind') traps.push({ value: rr / den, hint: '„Mindestens ein rosa“ heißt: alle Pfade außer lila → lila. Tipp: 1 − P(lila, lila).', tag: 'pfadregel' });
    if (!back) {
      const wb = { rr: r * r, eins: 2 * rb, mind: n * n - b * b, gleich: r * r + b * b }[ev];
      traps.push({ value: wb / (n * n), hint: `Ohne Zurücklegen: Beim zweiten Ziehen ist ein Haarband weniger in der Dose – der Nenner ist ${n - 1}, und von der gezogenen Farbe ist eins weniger da.`, tag: 'pfadregel' });
    }
    const p = (x, y) => `\\f{${x}}{${y}}`;
    const sol = {
      rr: [`P(rosa, rosa) = ${p(r, n)} · ${p(back ? r : r - 1, n2)} = ${p(rr, den)}`],
      eins: [`P(rosa, lila) + P(lila, rosa) = ${p(r, n)} · ${p(b, n2)} + ${p(b, n)} · ${p(r, n2)} = ${p(2 * rb, den)}`],
      mind: [`1 − P(lila, lila) = 1 − ${p(b, n)} · ${p(back ? b : b - 1, n2)} = 1 − ${p(bb, den)} = ${p(den - bb, den)}`],
      gleich: [`P(rosa, rosa) + P(lila, lila) = ${p(rr, den)} + ${p(bb, den)} = ${p(rr + bb, den)}`],
    }[ev];
    const tree = back ? { a: 'rosa', b: 'lila', p: [r, n], q: [[r, n], [r, n]] } : null;
    return Q({
      text: `In einer Dose liegen ${r} rosa und ${b} lila Haarbänder für den Ballett-Dutt. Du ziehst blind zwei Haarbänder ${back ? 'MIT Zurücklegen (das erste kommt zurück in die Dose)' : 'OHNE Zurücklegen (nacheinander)'}. Wie groß ist die Wahrscheinlichkeit für ${name}? (gekürzter Bruch)`,
      math: '', tree,
      answer: { type: 'num', value: num / den, reduced: true, prob: true, tag: 'pfadregel', traps },
      answerText: fD(num, den),
      hint: back ? 'Zeichne das Baumdiagramm. Pfadregel: multiplizieren. Summenregel: Pfade addieren.' : 'Zeichne das Baumdiagramm im Notizblock. Beim zweiten Zug: eine Kugel weniger!',
      solution: [...sol, `= ${fD(num, den)}`],
    });
  },
};
export { pf };
