// Prueba de las libretas (partidas) sin ventana: siembra partidas, recorre el título, entra, pausa, rebobina.
// Uso: node tools/saves.mjs [carpeta de capturas]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, process.argv[2] || 'shots/saves'); fs.mkdirSync(out, { recursive: true });
const port = 5190 + Math.floor(Math.random() * 300);
const srv = spawn('node', [path.join(root, 'tools/serve.mjs'), String(port)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 400));
const cacheDir = process.env.HOME + '/Library/Caches/ms-playwright';
const exe = fs.readdirSync(cacheDir).filter(d => d.startsWith('chromium_headless_shell-')).sort().map(d => `${cacheDir}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`).filter(f => fs.existsSync(f)).pop();
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, acceptDownloads: true });
const page = await ctx.newPage(); let bad = 0;
page.on('console', m => { if (m.type() === 'error') { bad++; console.log('[error]', m.text()); } });
page.on('pageerror', e => { bad++; console.log('[pageerror]', e.message, e.stack?.split('\n').slice(0, 4).join('\n')); });
const url = `http://127.0.0.1:${port}/`;
const ready = () => page.waitForFunction('window.game && window.game.ready', null, { timeout: 20000 });
const shot = async (n) => { await page.screenshot({ path: path.join(out, n + '.png') }); console.log('captura', n); };
const check = (ok, what) => { console.log((ok ? '  ok  ' : ' FALLO ') + what); if (!ok) bad++; };
const ls = (k) => page.evaluate((k) => localStorage.getItem(k), k);

// 1. título sin partidas
await page.goto(url); await ready(); await page.waitForTimeout(1500); await shot('01-titulo-vacio');

// 2. partida antigua de una sola ranura: debe pasar a la primera libreta
await page.goto(url + '?test=1&rich&day=9'); await ready();
const rich = await page.evaluate(() => JSON.stringify(window.game.S));
await page.goto(url + '?test=1'); await ready();
const early = await page.evaluate(() => { const S = window.game.S; S.day = 3; S.money = 64; S.rep = 40; S.tut = 7; S.played = 1260; S.last = Date.now() - 3 * 3600e3; return JSON.stringify(S); });
await page.evaluate(([rich, early]) => { localStorage.clear(); localStorage.setItem('pantastic-v1', early); const r = JSON.parse(rich); r.name = 'Obrador de la plaza'; r.played = 9000; r.last = Date.now() - 26 * 3600e3; localStorage.setItem('pantastic-s1', JSON.stringify({ v: 1, S: r, hist: [] })); }, [rich, early]);
await page.goto(url); await ready(); await page.waitForTimeout(1500);
check(!(await ls('pantastic-v1')) && !!(await ls('pantastic-s0')), 'la partida antigua pasa a la libreta 1');
await shot('02-titulo-dos-partidas');

// 3. entrar en la libreta 1, jugar un poco y pausar
await page.keyboard.press('e'); await page.waitForTimeout(2500);
check(await page.evaluate(() => window.game.mode) === 'play', 'se entra en la partida');
check(await page.evaluate(() => window.game.S.day) === 3, 'es el día 3 de la partida migrada');
await page.waitForTimeout(9000); await shot('03-dia3-encargo');
await page.keyboard.press('e'); await page.keyboard.press('e'); await page.keyboard.press('e'); await page.keyboard.press('e'); await page.keyboard.press('e'); await page.keyboard.press('e'); await page.waitForTimeout(600);
await page.keyboard.press('Escape'); await page.waitForTimeout(700); await shot('04-pausa');
check((await page.evaluate(() => (JSON.parse(localStorage.getItem('pantastic-s0')).hist || []).map(h => h.day).join())) === '3', 'se guardó la mañana del día 3');
check(((await ls('pantastic-shot0')) || '').startsWith('data:image/jpeg'), 'la libreta tiene foto');
// gastar dinero y repetir el día
await page.evaluate(() => { window.game.S.money = 1; });
await page.click('#p-save'); await page.waitForTimeout(300);
check(await page.evaluate(() => JSON.parse(localStorage.getItem('pantastic-s0')).S.money) === 1, 'guardar ahora escribe la partida');
await page.click('#p-redo'); await page.waitForTimeout(200); await shot('05-pausa-seguro'); await page.click('#p-redo');
await page.waitForTimeout(1200); await ready(); await page.waitForTimeout(1800);
check(await page.evaluate(() => window.game.S.money) === 64 && await page.evaluate(() => window.game.mode) === 'play', 'repetir el día devuelve la mañana (64 monedas) y entra directa');
// reloj rápido
const t0 = await page.evaluate(() => window.game.R.time); await page.keyboard.down('f'); await page.waitForTimeout(2000); await shot('06-reloj-rapido'); await page.keyboard.up('f');
const t1 = await page.evaluate(() => window.game.R.time); check(t1 - t0 > 9, `mantener F acelera el reloj (${(t1 - t0).toFixed(1)} min en 2 s)`);

// 4. volver al título: abrir libreta, copiar, renombrar, tirar y deshacer
await page.keyboard.press('Escape'); await page.waitForTimeout(500); await page.click('#p-title'); await page.waitForTimeout(800); await ready(); await page.waitForTimeout(1500);
await shot('07-titulo-con-foto');
await page.keyboard.press('q'); await page.waitForTimeout(800); await shot('08-libreta-abierta');
await page.click('.lib.open .cp'); await page.waitForTimeout(600);
check(!!(await ls('pantastic-s2')), 'copiar ocupa la tercera libreta'); await shot('09-copiada');
await page.click('.lib[data-i="2"] .label'); await page.keyboard.press('Meta+a'); await page.keyboard.type('Pruebas de Judit'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
check(await page.evaluate(() => JSON.parse(localStorage.getItem('pantastic-s2')).S.name) === 'Pruebas de Judit', 'renombrar la libreta');
const [dl] = await Promise.all([page.waitForEvent('download'), (async () => { await page.keyboard.press('q'); await page.waitForTimeout(500); await page.click('.lib.open .ex'); })()]);
const file = path.join(out, dl.suggestedFilename()); await dl.saveAs(file); check(/^pantastic-pruebas-de-judit-dia3\.pan$/.test(dl.suggestedFilename()), 'exportar descarga ' + dl.suggestedFilename());
const box = await page.locator('.lib.open .del').boundingBox(); await page.mouse.move(box.x + 40, box.y + 8); await page.mouse.down(); await page.waitForTimeout(1400); await page.mouse.up(); await page.waitForTimeout(700);
check(!(await ls('pantastic-s2')), 'mantener «Tirarla» la tira'); await shot('10-tirada-deshacer');
await page.click('.tbin .btn'); await page.waitForTimeout(400); check(!!(await ls('pantastic-s2')), 'deshacer la recupera');
// tirar otra vez e importar el archivo
await page.evaluate(() => { localStorage.removeItem('pantastic-s2'); localStorage.removeItem('pantastic-shot2'); }); await page.reload(); await ready(); await page.waitForTimeout(1200);
await page.setInputFiles('#t-file', file); await page.waitForTimeout(600);
check(await page.evaluate(() => JSON.parse(localStorage.getItem('pantastic-s2') || '{}').S?.name) === 'Pruebas de Judit', 'traer la libreta desde el archivo'); await shot('11-importada');

// 5. libreta nueva
await page.evaluate(() => { localStorage.removeItem('pantastic-s2'); }); await page.reload(); await ready(); await page.waitForTimeout(1200);
await page.keyboard.press('d'); await page.keyboard.press('d'); await page.waitForTimeout(300); await shot('12-nueva-elegida'); await page.keyboard.press('e'); await page.waitForTimeout(2500); await shot('13-nueva-carta');

console.log(bad ? `\n${bad} problema(s)` : '\ntodo bien');
await browser.close(); srv.kill(); process.exit(bad ? 1 : 0);
