import { mathe } from '../js/subjects/mathe.js';
import { checkAnswer } from '../js/check.js';
let fails = 0, n = 0;
const bad = s => /undefined|NaN|Infinity|\[object/.test(s);
function inputFor(spec) {
  if (spec.type === 'num') return String(spec.value);
  if (spec.type === 'term') return spec.value;
  if (spec.type === 'pair') return spec.fields.map(f => String(f.value));
}
for (const t of mathe.topics) for (const sk of t.skills) for (const d of [1, 2, 3]) for (let i = 0; i < 400; i++) {
  n++;
  let q;
  try { q = sk.gen(d); } catch (e) { fails++; console.log('GENERR', sk.id, d, e.message); break; }
  const txt = JSON.stringify([q.text, q.math, q.solution, q.hint, q.answerText, q.steps]);
  if (bad(txt)) { fails++; console.log('BADTXT', sk.id, d, txt.slice(0, 300)); break; }
  const specs = q.answer.type === 'steps' ? q.steps.map(s => s.answer) : [q.answer];
  for (const sp of specs) {
    const r = checkAnswer(sp, inputFor(sp));
    if (r.status !== 'correct') { fails++; console.log('SELFFAIL', sk.id, d, JSON.stringify(sp), r); break; }
  }
}
// spot checks
const c = (spec, inp) => checkAnswer(spec, inp);
const log = (l, r) => console.log(l.padEnd(34), r.status, r.msg || '', r.tag || '');
log('3/4 vs 6/8 reduced', c({ type: 'num', value: 0.75, reduced: true }, '6/8'));
log('x=0,75', c({ type: 'num', value: 0.75 }, 'x = 0,75'));
log('sign', c({ type: 'num', value: 5 }, '-5'));
log('term ok', c({ type: 'term', value: '4x^2-12x+9', form: 'expanded' }, '4x²−12x+9'));
log('term unexpanded', c({ type: 'term', value: '4x^2-12x+9', form: 'expanded' }, '(2x-3)^2'));
log('factored ok', c({ type: 'term', value: '2x(2x-3)', form: 'factored' }, '2x(2x-3)'));
log('factored partial', c({ type: 'term', value: '2x(2x-3)', form: 'factored' }, '2(2x²-3x)'));
log('factored partial2', c({ type: 'term', value: '2x(2x-3)', form: 'factored' }, 'x(4x-6)'));
log('linear y=', c({ type: 'term', value: '(2/3)*x+(1)', form: 'linear' }, 'y=2/3x+1'));
log('pair swap', c({ type: 'pair', fields: [{ label: 'x', value: 2 }, { label: 'y', value: 5 }] }, ['5', '2']));
log('garbage', c({ type: 'num', value: 2 }, '2++'));
console.log(`${n} Aufgaben geprüft, Fehler: ${fails}`);
process.exit(fails ? 1 : 0);
