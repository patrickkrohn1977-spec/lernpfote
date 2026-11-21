import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:8765/index.html');
for (const s of [180, 192, 512]) {
  await p.setViewportSize({ width: s, height: s });
  await p.setContent(`<html><body style="margin:0"><div id="i" style="width:${s}px;height:${s}px;background:linear-gradient(135deg,#fbcfe8,#ddd6fe);display:grid;place-items:center"></div>
  <script type="module">import {catSVG} from 'http://localhost:8765/js/cat.js'; document.getElementById('i').innerHTML=catSVG('happy',${Math.round(s*0.82)}).replace('class="cat cat-happy"','');</script></body></html>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `/home/user/lernapp/icons/icon-${s}.png` });
}
await b.close();
