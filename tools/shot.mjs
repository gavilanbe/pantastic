// Captura sin ventana. Uso:
//   node tools/shot.mjs salida.png ["código JS a evaluar antes"] [--q=consulta] [--w=1280 --h=720] [--wait=ms]
// La página expone window.game (ver src/main.js): game.step(seg), game.tp(x,z), etc.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const i = a.indexOf('='); return i < 0 ? [a.slice(2), '1'] : [a.slice(2, i), a.slice(i + 1)]; }));
const pos = args.filter(a => !a.startsWith('--'));
const out = pos[0] || 'shots/shot.png';
const code = pos[1] || '';
const port = 5190 + Math.floor(Math.random() * 300);

const srv = spawn('node', [path.join(root, 'tools/serve.mjs'), String(port)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 400));
const fs = await import('node:fs');
const cacheDir = process.env.HOME + '/Library/Caches/ms-playwright';
const exe = fs.readdirSync(cacheDir).filter(d => d.startsWith('chromium_headless_shell-')).sort().map(d => `${cacheDir}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`).filter(f => fs.existsSync(f)).pop();
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: Number(flags.w || 1280), height: Number(flags.h || 720) }, deviceScaleFactor: 1 });
const errs = [];
page.on('console', m => { if (m.type() === 'error' || flags.log) console.log('[' + m.type() + ']', m.text()); });
page.on('response', r => { if (r.status() >= 400) console.log('[' + r.status() + ']', r.url()); });
page.on('pageerror', e => { errs.push(e); console.log('[pageerror]', e.message, e.stack?.split('\n').slice(0, 4).join('\n')); });
try {
  await page.goto(`http://127.0.0.1:${port}/${flags.page || ''}?${flags.notest ? '' : 'test=1&'}${flags.q || ''}`);
  await page.waitForFunction('window.game && window.game.ready', null, { timeout: 20000 });
  if (code) { const r = await page.evaluate(`(async()=>{ ${code} })()`); if (r !== undefined) console.log('→', JSON.stringify(r)); }
  await page.waitForTimeout(Number(flags.wait || 250));
  await page.screenshot({ path: path.resolve(root, out) });
  console.log('ok', out);
} catch (e) { console.log('FALLO', e.message); }
await browser.close();
srv.kill();
process.exit(errs.length ? 1 : 0);
