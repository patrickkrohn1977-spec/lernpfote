// Kleiner Mathe-Parser: liest Schülereingaben wie "3/4", "-2,5", "2x^2-3x+1", "3(x+2)"
// und kann Terme auf Gleichwertigkeit prüfen.

export function normalize(s) {
  return String(s ?? '')
    .trim()
    .replace(/[−–—]/g, '-')
    .replace(/[·×∙⋅*]/g, '*')
    .replace(/[:÷]/g, '/')
    .replace(/,/g, '.')
    .replace(/\s+/g, '')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/⁵/g, '^5').replace(/⁶/g, '^6').replace(/⁷/g, '^7')
    .replace(/\[/g, '(').replace(/\]/g, ')')
    .toLowerCase();
}

function tokenize(s) {
  const t = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const str = s.slice(i, j);
      if ((str.match(/\./g) || []).length > 1 || str === '.') throw new Error('Diese Zahl kann ich nicht lesen: ' + str);
      t.push({ k: 'n', v: parseFloat(str) });
      i = j; continue;
    }
    if (/[a-z]/.test(ch)) { t.push({ k: 'v', v: ch }); i++; continue; }
    if ('+-*/^()'.includes(ch)) { t.push({ k: ch }); i++; continue; }
    if (ch === '√') { t.push({ k: '√' }); i++; continue; }
    throw new Error('Unbekanntes Zeichen: ' + ch);
  }
  return t;
}

export function parse(str) {
  const toks = tokenize(normalize(str));
  if (!toks.length) throw new Error('Leere Eingabe');
  let p = 0;
  const peek = () => toks[p];
  const eat = k => { if (toks[p] && toks[p].k === k) { p++; return true; } return false; };
  const startsPrimary = tk => tk && (tk.k === 'n' || tk.k === 'v' || tk.k === '(' || tk.k === '√');

  function expr() {
    let n = term();
    while (peek() && (peek().k === '+' || peek().k === '-')) {
      const op = toks[p++].k;
      n = { t: op, a: n, b: term() };
    }
    return n;
  }
  function term() {
    let n = unary();
    for (;;) {
      const tk = peek();
      if (tk && (tk.k === '*' || tk.k === '/')) { p++; n = { t: tk.k, a: n, b: unary() }; }
      else if (startsPrimary(tk)) { n = { t: '*', a: n, b: power(), imp: true }; }
      else break;
    }
    return n;
  }
  function unary() {
    if (eat('-')) return { t: 'neg', a: unary() };
    if (eat('+')) return unary();
    return power();
  }
  function power() {
    const b = primary();
    if (eat('^')) return { t: '^', a: b, b: unary() };
    return b;
  }
  function primary() {
    const tk = toks[p++];
    if (!tk) throw new Error('Da fehlt noch etwas');
    if (tk.k === 'n') return { t: 'n', v: tk.v };
    if (tk.k === 'v') return { t: 'v', v: tk.v };
    if (tk.k === '(') {
      const e = expr();
      if (!eat(')')) throw new Error('Eine Klammer wird nicht geschlossen');
      return { t: '()', a: e };
    }
    if (tk.k === '√') return { t: 'sqrt', a: primary() };
    throw new Error('Unerwartetes Zeichen');
  }
  const r = expr();
  if (p < toks.length) throw new Error(toks[p].k === ')' ? 'Eine Klammer zu viel' : 'Unerwartetes Zeichen');
  return r;
}

export function evaluate(n, env = {}) {
  switch (n.t) {
    case 'n': return n.v;
    case 'v': if (!(n.v in env)) throw new Error('Variable ' + n.v); return env[n.v];
    case '+': return evaluate(n.a, env) + evaluate(n.b, env);
    case '-': return evaluate(n.a, env) - evaluate(n.b, env);
    case '*': return evaluate(n.a, env) * evaluate(n.b, env);
    case '/': return evaluate(n.a, env) / evaluate(n.b, env);
    case '^': return Math.pow(evaluate(n.a, env), evaluate(n.b, env));
    case 'neg': return -evaluate(n.a, env);
    case '()': return evaluate(n.a, env);
    case 'sqrt': return Math.sqrt(evaluate(n.a, env));
  }
  throw new Error('?');
}

export function vars(n, set = new Set()) {
  if (!n) return set;
  if (n.t === 'v') set.add(n.v);
  if (n.a) vars(n.a, set);
  if (n.b) vars(n.b, set);
  return set;
}

const toAst = x => (typeof x === 'string' ? parse(x) : x);

export function equivalent(x, y) {
  const A = toAst(x), B = toAst(y);
  const vs = [...new Set([...vars(A), ...vars(B)])];
  let ok = 0;
  for (let i = 0; i < 14 && ok < 6; i++) {
    const env = {};
    vs.forEach((v, j) => { env[v] = -3.7 + ((i * 7 + j * 3) % 11) * 0.83 + i * 0.013; });
    let va, vb;
    try { va = evaluate(A, env); vb = evaluate(B, env); } catch { return false; }
    if (!isFinite(va) || !isFinite(vb)) continue;
    if (Math.abs(va - vb) > 1e-7 * Math.max(1, Math.abs(va), Math.abs(vb))) return false;
    ok++;
  }
  return ok >= 3;
}

export function countSummands(n) {
  if (n.t === '+' || n.t === '-') return countSummands(n.a) + countSummands(n.b);
  return 1;
}

// Klammern, in denen eine Variable steht (Klammern um reine Zahlen wie (1/9) zählen nicht)
export function hasParens(n) {
  if (!n) return false;
  if (n.t === '()') return vars(n.a).size > 0 || hasParens(n.a);
  return hasParens(n.a) || hasParens(n.b);
}

// Faktoren eines Produkts (ohne Vorzeichen)
export function factors(n) {
  if (n.t === 'neg') return factors(n.a);
  if (n.t === '*') return [...factors(n.a), ...factors(n.b)];
  return [n];
}

export function isProductWithBracket(n) {
  if (n.t === 'neg') return isProductWithBracket(n.a);
  if (n.t === '^' && n.a.t === '()') return true;
  if (n.t !== '*') return false;
  return factors(n).some(f => f.t === '()' || (f.t === '^' && f.a.t === '()'));
}

// Koeffizienten a,b,c eines Polynoms höchstens 2. Grades in einer Variablen (sonst null)
export function quadCoeffs(n, v = 'x') {
  const vs = vars(n);
  if (vs.size > 1 || (vs.size === 1 && !vs.has(v))) return null;
  try {
    const f = x => evaluate(n, { [v]: x });
    const c = f(0), a = (f(1) + f(-1) - 2 * c) / 2, b = (f(1) - f(-1)) / 2;
    if (Math.abs(4 * a + 2 * b + c - f(2)) > 1e-9 || Math.abs(9 * a - 3 * b + c - f(-3)) > 1e-9) return null;
    return [a, b, c];
  } catch { return null; }
}

// ---------- Anzeige ----------
export function fmtNum(v) {
  const r = Math.round(v * 1e6) / 1e6;
  return String(r).replace('.', ',');
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function toHTML(n) {
  switch (n.t) {
    case 'n': return fmtNum(n.v);
    case 'v': return `<i>${esc(n.v)}</i>`;
    case '+': return `${toHTML(n.a)} + ${toHTML(n.b)}`;
    case '-': return `${toHTML(n.a)} − ${toHTML(n.b)}`;
    case '*': {
      const tight = n.imp && !(n.a.t === 'n' && n.b.t === 'n');
      return tight ? `${toHTML(n.a)}${toHTML(n.b)}` : `${toHTML(n.a)} · ${toHTML(n.b)}`;
    }
    case '/': {
      const un = x => (x.t === '()' ? x.a : x);
      return `<span class="fr"><span>${toHTML(un(n.a))}</span><span>${toHTML(un(n.b))}</span></span>`;
    }
    case '^': return `${toHTML(n.a)}<sup>${toHTML(n.b)}</sup>`;
    case 'neg': return `−${toHTML(n.a)}`;
    case '()': return `(${toHTML(n.a)})`;
    case 'sqrt': return `√${toHTML(n.a)}`;
  }
  return '';
}
