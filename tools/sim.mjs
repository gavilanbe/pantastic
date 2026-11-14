// Simulación de economía: un jugador aplicado juega N días y se anota la curva.
//   node tools/sim.mjs [días=20]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), DAYS = Number(process.argv[2] || 20), port = 5600 + Math.floor(Math.random() * 200);
const srv = spawn('node', [path.join(root, 'tools/serve.mjs'), String(port)], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 400));
const cacheDir = process.env.HOME + '/Library/Caches/ms-playwright';
const exe = fs.readdirSync(cacheDir).filter(d => d.startsWith('chromium_headless_shell-')).sort().map(d => `${cacheDir}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`).filter(f => fs.existsSync(f)).pop();
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/?test=1`); await page.waitForFunction('window.game && window.game.ready');
const out = await page.evaluate(async (DAYS) => {
  const g = game, sm = g.sim, rows = [], sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const key = (c) => { window.dispatchEvent(new KeyboardEvent('keydown', { key: c })); window.dispatchEvent(new KeyboardEvent('keyup', { key: c })); };
  g.S.tut = 7;
  for (let d = 0; d < DAYS; d++) {
    const bought = [];
    // compras de la mañana: mejoras baratas primero, dejando caja para ingredientes
    const shop = () => { for (let k = 0; k < 30; k++) { const opts = [...sm.tracks.map(id => ['track', id]), ...sm.staffs.map(id => ['staff', id]), ...sm.works.map(id => ['work', id])].map(([kind, id]) => [kind, id, sm.cost(kind, id)]).filter(o => isFinite(o[2])).sort((a, b) => a[2] - b[2]); const o = opts[0]; if (!o || sm.info().money - o[2] < 70) break; if (!sm[o[0]](o[1])) break; bought.push(o[1]); } };
    shop();
    const best = () => { const I = sm.info(); return I.recipes.filter(r => r !== 'rosca').map(r => ({ r, profit: sm.price(r) * I.n - Object.entries(sm.breads[r].ing).reduce((a, [k, n]) => a + sm.ingPrice(k) * n, 0) })).sort((a, b) => b.profit - a.profit); };
    const ensure = (r) => { for (const [k, n] of Object.entries(sm.breads[r].ing)) { const have = sm.info().ing[k] || 0; if (have < n && !sm.buy(k, n - have)) return false; } return true; };
    let wait = 0, mk = 0, guard = 0;
    while (g.mode !== 'summary' && guard++ < 1200) {
      g.step(1); if (g.ui.modalOpen) { g.ui.closeModal(); continue; } let q = 0; while (g.ui.dialogOpen && q++ < 30) { key('e'); g.step(0.15); }
      if (g.mode !== 'play') continue; if (g.R.fire < 0.4) sm.fire(); if (wait-- > 0) continue;
      const R = g.R, I = sm.info(), c = R.carry, stock = Object.values(I.shelf).reduce((a, b) => a + b, 0), slots = g.S.up.horno2 ? 2 : 1;
      const act = (x, z) => { g.tp(x, z); g.step(0.15); key('e'); g.step(0.5); wait = 2; };
      if (c?.stage === 'baked') { act(-1, -3); continue; }
      const ov = R.oven.findIndex(b => b && b.t >= 15.5); if (ov >= 0 && !c) { act(4.35, -3.3); continue; }
      if (c?.stage === 'proofed') { if (R.oven.filter((b, i) => !b && i < slots).length) act(4.35, -3.3); else if (R.cart.some(x => !x)) act(4.95, -0.45); continue; }
      if (c?.stage === 'dough') { if (R.ferm.some(x => !x)) act(2.5, -4.2); continue; }
      const cu = R.slots.find(x => x && x.st === 'wait'); if (cu && stock > 0) { g.tp(-1, cu.ch.z); g.step(0.15); key('e'); g.step(0.4); wait = 1; continue; }
      if (!c && R.ferm.some(b => b && b.t >= b.need) && R.oven.filter((b, i) => !b && i < slots).length) { act(2.5, -4.2); continue; }
      if (!c && R.cart.some(x => x && x.stage === 'proofed') && R.oven.filter((b, i) => !b && i < slots).length) { act(4.95, -0.45); continue; }
      const pipeline = R.ferm.filter(x => x).length + R.oven.filter(x => x).length;
      if (!c && I.time < 17.6 * 60 && stock + pipeline * I.n < 5 + I.lvl * 3 + R.cust.length && R.ferm.some(x => !x)) { const b = best(); const want = b[mk++ % Math.min(3, b.length)].r; if (ensure(want) && sm.dough(want)) wait = 11; continue; }
      if (I.time > 12 * 60 && !R.cust.length && !pipeline && stock === 0 && I.time > 18.8 * 60) g.endDay();
    }
    const T = { ...g.R.today }, d0 = g.S.day; for (let q3 = 0; q3 < 80 && g.S.day === d0; q3++) { await sleep(120); if (g.ui.dialogOpen) key('e'); else { const bt = document.querySelector('.receipt .btn'); if (bt) bt.click(); else if (g.ui.modalOpen) g.ui.closeModal(); } g.step(0.2); } await sleep(1000); g.step(0.5);
    const I = sm.info(); rows.push({ dia: d + 1, vend: T.sold, ingreso: T.income + T.tips + (T.orders || 0) + (T.reparto || 0), gasto: T.spent, sinpan: T.lost, caja: I.money, nivel: I.lvl + 1, piezas: I.n, jornal: I.wages, compras: bought.join(','), dreal: g.S.day, modo: g.mode + (g.ui.modalOpen ? '+modal:' + (document.querySelector('.sheet')?.className || '') : '') + (g.ui.dialogOpen ? '+dlg' : '') + ' t' + Math.round(g.R.time / 60) });
    let q2 = 0; while ((g.ui.modalOpen || g.mode !== 'play') && q2++ < 60) { if (g.ui.modalOpen && !document.querySelector('.receipt')) g.ui.closeModal(); g.step(0.3); await sleep(60); }
  }
  return rows;
}, DAYS);
console.table(out);
await browser.close(); srv.kill();
