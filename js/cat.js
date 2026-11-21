// Maskottchen „Pirouette“ – eine Katze mit Ballett-Krönchen
export function catSVG(mood = 'happy', size = 96) {
  const eyes = {
    happy: '<path d="M38 52 q5 -6 10 0" /><path d="M62 52 q5 -6 10 0" />',
    neutral: '<ellipse cx="43" cy="52" rx="4" ry="5.5" fill="#3b2f4a" stroke="none"/><ellipse cx="67" cy="52" rx="4" ry="5.5" fill="#3b2f4a" stroke="none"/><circle cx="44.5" cy="50" r="1.4" fill="#fff" stroke="none"/><circle cx="68.5" cy="50" r="1.4" fill="#fff" stroke="none"/>',
    think: '<ellipse cx="43" cy="50" rx="4" ry="5" fill="#3b2f4a" stroke="none"/><ellipse cx="67" cy="50" rx="4" ry="5" fill="#3b2f4a" stroke="none"/><circle cx="44.5" cy="48" r="1.3" fill="#fff" stroke="none"/><circle cx="68.5" cy="48" r="1.3" fill="#fff" stroke="none"/>',
    sad: '<path d="M38 50 q5 5 10 2" /><path d="M62 52 q5 3 10 -2" />',
    star: '<path d="M43 45 l2 5 5 .5 -4 3.5 1.5 5 -4.5 -3 -4.5 3 1.5 -5 -4 -3.5 5 -.5z" fill="#fbbf24" stroke="#d97706" stroke-width="1"/><path d="M67 45 l2 5 5 .5 -4 3.5 1.5 5 -4.5 -3 -4.5 3 1.5 -5 -4 -3.5 5 -.5z" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>',
  }[mood] || '';
  const mouth = mood === 'sad' ? '<path d="M50 68 q5 -3 10 0" />' : '<path d="M49 64 q3 4 6 0 q3 4 6 0" />';
  return `<svg class="cat cat-${mood}" width="${size}" height="${size}" viewBox="0 0 110 110" aria-hidden="true">
    <g stroke="#3b2f4a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M22 40 L26 12 L46 28 Z" fill="#f6d8c4"/><path d="M88 40 L84 12 L64 28 Z" fill="#f6d8c4"/>
      <path d="M28 34 L29 20 L39 28 Z" fill="#f9a8d4" stroke="none"/><path d="M82 34 L81 20 L71 28 Z" fill="#f9a8d4" stroke="none"/>
      <ellipse cx="55" cy="58" rx="36" ry="32" fill="#f6d8c4"/>
      <path d="M40 24 l6 -9 5 7 4 -10 4 10 5 -7 6 9" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
      <circle cx="55" cy="13" r="2.4" fill="#f472b6" stroke="none"/>
      ${eyes}
      <path d="M52 60 h6 l-3 3.5 z" fill="#f472b6" stroke="#f472b6" stroke-width="1.5"/>
      ${mouth}
      <path d="M22 60 h14 M22 67 l14 -3 M88 60 h-14 M88 67 l-14 -3" stroke-width="1.8" opacity=".7"/>
      <ellipse cx="34" cy="67" rx="6" ry="3.5" fill="#fbcfe8" stroke="none" opacity=".8"/><ellipse cx="76" cy="67" rx="6" ry="3.5" fill="#fbcfe8" stroke="none" opacity=".8"/>
    </g></svg>`;
}
