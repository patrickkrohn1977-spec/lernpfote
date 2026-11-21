// „Neuer Stoff“: Fotos vom Hefter/Arbeitsblatt aufnehmen und an die Eltern schicken.
// Die Fotos werden nicht ins Internet hochgeladen – sie gehen über das Teilen-Menü
// (WhatsApp, iMessage, Mail) direkt an die Eltern, die sie Claude geben.

const MAX = 1600; // längste Bildseite in Pixel (gut lesbar, aber kleine Dateien)
let photos = [];  // { file, url }

async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const s = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
    return blob || file;
  } catch { return file; }
}

export function renderPhotos({ app, esc, go, toast, nav, SUBJECTS, E }) {
  const name = E.S.profile?.name || '';
  const today = E.dayKey();
  app().innerHTML = `<main>
    <h1>📷 Neuer Stoff</h1>
    <p class="muted">Fotografiere Hefteinträge, Buchseiten oder Arbeitsblätter vom neuen Thema. Die Fotos gehen an deine Eltern – daraus entstehen dann neue Aufgaben für dich. 🐾</p>
    <section class="card">
      <label class="field"><span>Fach</span><select id="psubj">${Object.values(SUBJECTS).map(s => `<option>${s.name}</option>`).join('')}<option>Deutsch</option><option>Englisch</option><option>Biologie</option><option>anderes Fach</option></select></label>
      <label class="field"><span>Thema (falls du es weißt)</span><input id="ptopic" maxlength="60" placeholder="z. B. Quadratische Gleichungen"></label>
      <label class="field"><span>Nächster Test in diesem Fach (optional)</span><input type="date" id="pdate" min="${today}"></label>
      <label class="btn soft big" for="pfile">📸 Fotos aufnehmen oder auswählen<small>mehrere auf einmal möglich</small></label>
      <input type="file" id="pfile" accept="image/*" multiple hidden>
      <div class="thumbs" id="thumbs"></div>
      <div class="small muted" id="pcount"></div>
      <button class="btn primary big" id="psend" disabled>📤 An meine Eltern schicken</button>
      <p class="tiny muted">Tipp: Seite gerade und hell fotografieren, ganze Seite im Bild, nicht verwackeln. Namen/Noten am besten nicht mitfotografieren.</p>
    </section>
  </main>${nav()}`;

  const thumbs = () => {
    document.getElementById('thumbs').innerHTML = photos.map((p, i) => `<div class="thumb"><img src="${p.url}" alt="Foto ${i + 1}"><button data-del="${i}" aria-label="Foto entfernen">✕</button></div>`).join('');
    document.getElementById('pcount').textContent = photos.length ? `${photos.length} Foto${photos.length > 1 ? 's' : ''} bereit` : '';
    document.getElementById('psend').disabled = !photos.length;
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { URL.revokeObjectURL(photos[+b.dataset.del].url); photos.splice(+b.dataset.del, 1); thumbs(); });
  };
  thumbs();

  document.getElementById('pfile').onchange = async e => {
    const files = [...e.target.files];
    e.target.value = '';
    toast('Fotos werden vorbereitet …');
    for (const f of files) {
      const blob = await shrink(f);
      const n = photos.length + 1;
      const file = new File([blob], `stoff-${today}-${n}.jpg`, { type: 'image/jpeg' });
      photos.push({ file, url: URL.createObjectURL(file) });
    }
    thumbs();
  };

  document.getElementById('psend').onclick = async () => {
    const subj = document.getElementById('psubj').value;
    const topic = document.getElementById('ptopic').value.trim();
    const date = document.getElementById('pdate').value;
    const text = [
      `📷 Neuer Lernstoff${name ? ' von ' + name : ''} für die Lernpfote-App`,
      `Fach: ${subj}`,
      topic ? `Thema: ${topic}` : '',
      date ? `Nächster Test: ${date.split('-').reverse().join('.')}` : '',
      `${photos.length} Foto(s)`,
    ].filter(Boolean).join('\n');
    const files = photos.map(p => p.file);
    try {
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, text, title: 'Neuer Lernstoff' });
        finish(subj, date);
        return;
      }
    } catch (err) { if (err.name === 'AbortError') return; }
    // Fallback (z. B. am Computer): Fotos herunterladen
    for (const p of photos) { const a = document.createElement('a'); a.href = p.url; a.download = p.file.name; a.click(); }
    try { await navigator.clipboard.writeText(text); } catch {}
    toast('Fotos wurden gespeichert – schicke sie deinen Eltern. 📎');
    finish(subj, date);
  };

  function finish(subj, date) {
    // Test gleich mit eintragen (nur für Fächer, die es in der App schon gibt)
    const sub = Object.values(SUBJECTS).find(s => s.name === subj);
    if (sub && date && !E.S.tests.some(t => t.subject === sub.id && t.date === date)) {
      E.S.tests.push({ id: Math.random().toString(36).slice(2), subject: sub.id, date, topics: [], note: document.getElementById('ptopic').value.trim() });
      E.save();
    }
    photos.forEach(p => URL.revokeObjectURL(p.url));
    photos = [];
    toast('Super, danke! 🐱 Bald gibt es neue Aufgaben.');
    go('home');
  }
}
