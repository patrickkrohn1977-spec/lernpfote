// Prüft Antworten und erkennt typische Fehler.
import { parse, evaluate, vars, equivalent, countSummands, hasParens, isProductWithBracket, factors, quadCoeffs, normalize } from './mathparse.js';

export const ERROR_TAGS = {
  vorzeichen: 'Vorzeichen',
  klammer: 'Klammern auflösen',
  bruch: 'Bruchrechnung',
  kuerzen: 'Nicht vollständig gekürzt',
  binom: 'Binomische Formeln',
  umformung: 'Gleichungen umformen',
  steigung: 'Steigung',
  prozent: 'Prozentrechnung',
  vertauscht: 'Werte vertauscht',
  vereinfachen: 'Nicht fertig vereinfacht',
  quadrieren: 'Quadrieren (Dezimalzahlen/Brüche)',
  pascal: 'Pascal’sches Dreieck',
  runden: 'Runden',
  pfadregel: 'Pfad-/Summenregel',
  lesen: 'Aufgabe genau lesen',
  rechnen: 'Rechenfehler',
};

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const near = (a, b, tol) => Math.abs(a - b) <= (tol ?? 1e-9 * Math.max(1, Math.abs(b)));

function stripPrefix(s) {
  let t = normalize(s);
  t = t.replace(/^l=\{(.*)\}$/, '$1');
  t = t.replace(/^[a-z](\([a-z0-9.\-]*\))?=/, '');
  return t;
}

function readNumber(input) {
  let t = stripPrefix(input);
  t = t.replace(/(€|euro|%|prozent|cm|m²|m|kg|g|min|stunden|stück|tage|jahre|tiere)$/, '');
  if (!t) throw new Error('Bitte gib eine Zahl ein.');
  const ast = parse(t);
  if (vars(ast).size) throw new Error('Hier ist nur eine Zahl gefragt (ohne Buchstaben).');
  const v = evaluate(ast);
  if (!isFinite(v)) throw new Error('Das ergibt keine gültige Zahl.');
  return { v, t };
}

function checkNum(spec, input) {
  let r;
  try { r = readNumber(input); } catch (e) { return { status: 'invalid', msg: e.message }; }
  let { v, t } = r;
  let tol = spec.tol;
  if (spec.prob && /%|prozent/i.test(String(input))) { v = v / 100; tol = Math.max(tol || 0, 0.0006); }
  if (near(v, spec.value, tol)) {
    if (spec.reduced) {
      const m = t.match(/^-?\(?(-?\d+)\)?\/\(?(-?\d+)\)?$/);
      if (m && gcd(+m[1], +m[2]) > 1) return { status: 'almost', msg: 'Der Wert stimmt – aber kürze den Bruch noch vollständig!', tag: 'kuerzen' };
    }
    return { status: 'correct' };
  }
  for (const tr of spec.traps || []) {
    if (tr.value !== undefined && near(v, tr.value, tol)) return { status: 'wrong', msg: tr.hint, tag: tr.tag };
  }
  if (spec.value !== 0 && near(v, -spec.value, tol)) return { status: 'wrong', msg: 'Fast! Nur das Vorzeichen stimmt nicht. Prüfe Plus und Minus.', tag: 'vorzeichen' };
  if (tol && Math.abs(v - spec.value) < Math.max(tol * 30, Math.abs(spec.value) * 0.01)) return { status: 'wrong', msg: 'Ganz knapp daneben – hast du richtig gerundet?', tag: 'rechnen' };
  return { status: 'wrong', tag: spec.tag || 'rechnen' };
}

function checkTerm(spec, input) {
  let ast;
  const t = stripPrefix(input);
  try { ast = parse(t); } catch (e) { return { status: 'invalid', msg: e.message }; }
  if (normalize(input).includes('=') && !/^[a-z](\([a-z]\))?=/.test(normalize(input))) return { status: 'invalid', msg: 'Bitte nur den Term eingeben (ohne Gleichheitszeichen).' };
  const target = parse(spec.value);
  if (!equivalent(ast, target)) {
    for (const tr of spec.traps || []) {
      if (tr.expr && equivalent(ast, parse(tr.expr))) return { status: 'wrong', msg: tr.hint, tag: tr.tag };
    }
    try { if (equivalent(ast, { t: 'neg', a: target })) return { status: 'wrong', msg: 'Alle Vorzeichen sind genau verkehrt herum. Prüfe das Minus!', tag: 'vorzeichen' }; } catch {}
    return { status: 'wrong', tag: spec.tag || 'rechnen' };
  }
  const form = spec.form;
  if (form === 'simplified' || form === 'expanded') {
    if (hasParens(ast)) return { status: 'almost', msg: 'Gleichwertig – aber löse die Klammern noch auf!', tag: 'vereinfachen' };
    if (countSummands(ast) > countSummands(target)) return { status: 'almost', msg: 'Gleichwertig – aber du kannst noch weiter zusammenfassen.', tag: 'vereinfachen' };
  }
  if (form === 'noParens' && hasParens(ast)) return { status: 'almost', msg: 'Gleichwertig – aber die Klammer sollte aufgelöst sein.', tag: 'vereinfachen' };
  if (form === 'linear') {
    if (/\([^)]*[a-z]/.test(normalize(t)) || countSummands(ast) > 2) return { status: 'almost', msg: 'Stimmt – aber schreibe es in der Form y = mx + n.', tag: 'vereinfachen' };
  }
  if (form === 'factored') {
    if (!isProductWithBracket(ast)) return { status: 'almost', msg: 'Gleichwertig – aber gesucht ist ein Produkt mit Klammer (ausklammern!).', tag: 'vereinfachen' };
    for (const f of factors(ast)) {
      const inner = f.t === '()' ? f.a : (f.t === '^' && f.a.t === '()') ? f.a.a : null;
      if (!inner) continue;
      const q = quadCoeffs(inner);
      if (!q) continue;
      const ints = q.filter(c => Math.abs(c) > 1e-9);
      if (ints.length >= 2 && Math.abs(q[2]) < 1e-9) return { status: 'almost', msg: 'Gut! Aber in der Klammer steckt noch ein x – das kannst du auch ausklammern.', tag: 'vereinfachen' };
      if (ints.length >= 2 && ints.every(c => Number.isInteger(Math.round(c * 1e9) / 1e9))) {
        const g = ints.reduce((a, c) => gcd(a, Math.round(c)), 0);
        if (g > 1) return { status: 'almost', msg: `Gut! Aber in der Klammer kannst du noch ${g} ausklammern.`, tag: 'vereinfachen' };
      }
    }
  }
  return { status: 'correct' };
}

function checkPair(spec, inputs) {
  const vals = [];
  for (let i = 0; i < spec.fields.length; i++) {
    try { vals.push(readNumber(inputs[i]).v); }
    catch (e) { return { status: 'invalid', msg: `${spec.fields[i].label}: ${e.message}` }; }
  }
  const sets = [spec.fields.map(f => f.value), ...(spec.alts || [])];
  if (sets.some(set => set.every((x, i) => near(vals[i], x, spec.tol)))) return { status: 'correct' };
  const exp = spec.fields.map(f => f.value);
  if (exp.length === 2 && near(vals[0], exp[1], spec.tol) && near(vals[1], exp[0], spec.tol) && exp[0] !== exp[1])
    return { status: 'wrong', msg: 'Die Zahlen stimmen, aber du hast sie vertauscht!', tag: 'vertauscht' };
  for (const tr of spec.traps || []) {
    if (tr.values && tr.values.every((x, i) => x === null || near(vals[i], x, spec.tol))) return { status: 'wrong', msg: tr.hint, tag: tr.tag };
  }
  const wrongIdx = exp.map((x, i) => (near(vals[i], x, spec.tol) ? -1 : i)).filter(i => i >= 0);
  const signOnly = wrongIdx.every(i => exp[i] !== 0 && near(vals[i], -exp[i], spec.tol));
  const names = wrongIdx.map(i => spec.fields[i].label).join(' und ');
  if (signOnly) return { status: 'wrong', msg: `Bei ${names} stimmt das Vorzeichen nicht.`, tag: 'vorzeichen' };
  if (wrongIdx.length < exp.length) return { status: 'wrong', msg: `${names} stimmt noch nicht – der Rest ist richtig.`, tag: spec.tag || 'rechnen' };
  return { status: 'wrong', tag: spec.tag || 'rechnen' };
}

export function checkAnswer(spec, input) {
  if (spec.type === 'num') return checkNum(spec, input);
  if (spec.type === 'term') return checkTerm(spec, input);
  if (spec.type === 'pair') return checkPair(spec, input);
  if (spec.type === 'mc') return input === spec.value ? { status: 'correct' } : { status: 'wrong', tag: spec.tag || 'rechnen' };
  return { status: 'invalid', msg: 'Unbekannter Aufgabentyp' };
}
