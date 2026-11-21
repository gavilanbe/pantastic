// Prueba de la radio: abre el dial, gira, encuentra emisoras, comprueba bloqueos y desbloqueos. Uso: node tools/radio.mjs
import { chromium } from 'playwright'; import { spawn } from 'node:child_process'; import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), port = 5190 + Math.floor(Math.random() * 300), out = path.join(root, 'shots/radio'); fs.mkdirSync(out, { recursive: true });
const srv = spawn('node', [path.join(root, 'tools/serve.mjs'), String(port)], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 400));
const cacheDir = process.env.HOME + '/Library/Caches/ms-playwright';
const exe = fs.readdirSync(cacheDir).filter(d => d.startsWith('chromium_headless_shell-')).sort().map(d => `${cacheDir}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`).filter(f => fs.existsSync(f)).pop();
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); let bad = 0;
page.on('console', m => { if (m.type() === 'error') { bad++; console.log('[error]', m.text()); } }); page.on('pageerror', e => { bad++; console.log('[pageerror]', e.message); });
const check = (ok, what) => { console.log((ok ? '  ok  ' : ' FALLO ') + what); if (!ok) bad++; };
const shot = (n) => page.screenshot({ path: path.join(out, n + '.png') });
try {
  await page.goto(`http://127.0.0.1:${port}/`); await page.waitForFunction('window.game && window.game.ready'); await page.waitForTimeout(900);
  await page.keyboard.press('e'); await page.waitForTimeout(3200); await page.keyboard.press('e'); await page.waitForTimeout(3400); await page.keyboard.press('e'); await page.waitForTimeout(4500);
  check(await page.evaluate(() => window.game.mode) === 'play', 'en juego');
  await page.keyboard.press('r'); await page.waitForTimeout(900); await shot('01-radio-migas');
  check(await page.evaluate(() => window.game.ui.modalOpen), 'R abre la radio');
  await page.keyboard.down('d'); await page.waitForTimeout(700); await page.keyboard.up('d'); await page.waitForTimeout(900); await shot('02-entre-emisoras');
  const f1 = await page.evaluate(() => window.game.S.radio.f); check(f1 > 89.6, `el dial gira (${f1.toFixed(2)})`);
  await page.evaluate(() => { window.game.S.radio.f = 91.45; }); await page.waitForTimeout(1300); await shot('03-abuela-encontrada');
  check(await page.evaluate(() => !!window.game.S.radio.found.abuela), 'al encajar en el 91.6 se encuentra «Los discos de la abuela»');
  await page.evaluate(() => { window.game.S.radio.f = 94.1; }); await page.waitForTimeout(900); await shot('04-emisora-bloqueada');
  check(await page.evaluate(() => !window.game.S.radio.found.molino), 'Onda Molino no se sintoniza sin su logro');
  await page.evaluate(() => { window.game.S.ach.v50 = true; }); await page.waitForTimeout(1200); await shot('05-molino-desbloqueada');
  check(await page.evaluate(() => !!window.game.S.radio.found.molino), 'con el logro, Onda Molino entra y queda encontrada');
  await page.keyboard.press('1'); await page.waitForTimeout(1600); check(Math.abs(await page.evaluate(() => window.game.S.radio.f) - 89.3) < 0.05, 'la tecla 1 vuelve a Radio Migas');
  await page.keyboard.press('x'); await page.waitForTimeout(500); await shot('06-apagada'); await page.keyboard.press('x');
  await page.evaluate(() => { window.game.S.radio.f = 96.0; }); await page.waitForTimeout(400); await page.keyboard.press('e'); await page.waitForTimeout(600);
  const f2 = await page.evaluate(() => window.game.S.radio.f); check(!await page.evaluate(() => window.game.ui.modalOpen) && [89.3, 91.6, 94.2].some(x => Math.abs(x - f2) < 0.01), `al cerrar entre emisoras vuelve a una que suena (${f2})`);
} catch (e) { bad++; console.log('FALLO', e.message); }
console.log(bad ? `${bad} problema(s)` : 'todo bien'); await browser.close(); srv.kill(); process.exit(bad ? 1 : 0);
