// Gemeinsame Hilfsfunktionen für Mathe-Aufgaben
import { parse, evaluate } from '../mathparse.js';
export { parse, evaluate };

// ---------- Hilfen ----------
export const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const RNZ = (a, b) => { let v; do v = R(a, b); while (v === 0); return v; };
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
export const fr = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; };
export const abs = Math.abs;

export const sn = v => (v < 0 ? '−' + abs(v) : String(v));            // −5
export const pn = v => (v < 0 ? `(−${abs(v)})` : String(v));           // (−5)
export const op = v => (v < 0 ? ` − ${abs(v)}` : ` + ${v}`);           //  − 5 / + 5
export const opx = (v, x = 'x') => (v < 0 ? ` − ${v === -1 ? '' : abs(v)}${x}` : ` + ${v === 1 ? '' : v}${x}`);
export const dec = v => String(Math.round(v * 100) / 100).replace('.', ',');
export const money = v => (Number.isInteger(v) ? String(v) : (Math.round(v * 100) / 100).toFixed(2).replace('.', ',')) + ' €';

export const fRaw = (n, d) => (d === 1 ? sn(n) : `${n < 0 ? '−' : ''}\\f{${abs(n)}}{${d}}`);
export const fD = (n, d) => { const [a, b] = fr(n, d); return fRaw(a, b); };
export const fA = (n, d) => { const [a, b] = fr(n, d); return b === 1 ? `${a}` : `${a}/${b}`; };

export const rnd = v => Math.round(v * 1e6) / 1e6;
const SUP = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' };
export const supD = v => v.replace(/\^(\d)/g, (_, d) => SUP[d]);
export const dc = v => String(rnd(v)).replace('.', ',');   // Dezimalzahl mit Komma
// Polynome: terms = [[koeff, 'x^2'], [koeff, 'x'], [koeff, '']]
export function polyA(terms) {
  let s = '';
  for (const [c, v] of terms) {
    if (c === 0) continue;
    const part = (v && abs(c) === 1 ? '' : String(rnd(abs(c)))) + v;
    s += s === '' ? (c < 0 ? '-' : '') + part : (c < 0 ? '-' : '+') + part;
  }
  return s || '0';
}
export function polyD(terms) {
  let s = '';
  for (const [c, v] of terms) {
    if (c === 0) continue;
    const vd = supD(v);
    const part = (v && abs(c) === 1 ? '' : String(rnd(abs(c))).replace('.', ',')) + vd;
    s += s === '' ? (c < 0 ? '−' : '') + part : (c < 0 ? ' − ' : ' + ') + part;
  }
  return s || '0';
}
export const linA = (a, b, v = 'x') => polyA([[a, v], [b, '']]);
export const linD = (a, b, v = 'x') => polyD([[a, v], [b, '']]);
// Term mit Bruch-Steigung anzeigen
export const mxnD = (mn, md, n) => {
  const [p, q] = fr(mn, md);
  let s = q === 1 ? (p === 1 ? 'x' : p === -1 ? '−x' : `${sn(p)}x`) : `${p < 0 ? '−' : ''}\\f{${abs(p)}}{${q}}x`;
  if (p === 0) s = '';
  if (n !== 0) s += s ? op(n) : sn(n);
  return s || '0';
};
export const mxnA = (mn, md, n) => { const [p, q] = fr(mn, md); return `(${p}/${q})*x+(${n})`; };

export const asciiToDisp = s => s.replace(/\*/g, ' · ').replace(/-/g, '−').replace(/\+/g, ' + ').replace(/\^2/g, '²').replace(/\^3/g, '³');
export const fill = (t, vals) => t.replace(/[A-K]/g, ch => vals[ch]);

export function Q(o) { return { diff: 1, ...o }; }
