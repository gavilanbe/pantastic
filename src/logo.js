// El logo de Pantastic!: placa roja, letras gordas con relieve, espigas y cinta. Se usa en el título, el tique y el rótulo.
let cv = null;
const FONT = 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", sans-serif';

function ear(g, x, y, s, flip) {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.rotate(-0.5);
  g.strokeStyle = '#8a4a1e'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 150); g.quadraticCurveTo(6, 40, 0, -70); g.stroke();
  for (let i = 0; i < 6; i++) for (const d of [-1, 1]) {
    g.save(); g.translate(d * 20, 70 - i * 30); g.rotate(d * 0.55);
    g.beginPath(); g.ellipse(0, 0, 15, 30, 0, 0, 7); g.fillStyle = '#f6c552'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#8a4a1e'; g.stroke();
    g.beginPath(); g.ellipse(-4, -8, 4, 10, 0, 0, 7); g.fillStyle = '#ffe9a0'; g.fill(); g.restore();
  }
  g.beginPath(); g.ellipse(0, -98, 15, 30, 0, 0, 7); g.fillStyle = '#f6c552'; g.fill(); g.lineWidth = 7; g.stroke();
  g.restore();
}
export function logoCanvas() {
  if (cv) return cv;
  const W = 1600, H = 720; cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.lineJoin = 'round';
  // placa
  g.save(); g.translate(W / 2, 330); g.rotate(-0.035);
  const plate = (inset, fill, stroke, lw, dash) => { g.beginPath(); g.roundRect(-640 + inset, -210 + inset, 1280 - inset * 2, 420 - inset * 2, 130 - inset * 0.6); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]); } };
  g.translate(0, 26); plate(0, '#7a2f22'); g.translate(0, -26);
  plate(0, '#e2664f', '#7a2f22', 16); plate(22, null, '#fff0cf', 7, [26, 18]);
  const sh = g.createLinearGradient(0, -210, 0, 210); sh.addColorStop(0, 'rgba(255,255,255,.22)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(90,20,10,.22)'); plate(0, sh);
  g.restore();
  ear(g, 150, 330, 1.25, false); ear(g, W - 150, 330, 1.25, true);
  // letras
  const word = 'Pantastic', size = 290; g.font = `900 ${size}px ${FONT}`; g.textBaseline = 'alphabetic';
  const ws = [...word].map(c => g.measureText(c).width - 10); const total = ws.reduce((a, b) => a + b, 0) + 130; let x = W / 2 - total / 2;
  const draw = (c, cx, y, rot, fill, sz = size) => {
    g.save(); g.translate(cx, y); g.rotate(rot); g.font = `900 ${sz}px ${FONT}`; g.textAlign = 'center';
    g.lineWidth = 46; g.strokeStyle = '#5a2416'; g.strokeText(c, 0, 26); g.strokeText(c, 0, 0);
    g.fillStyle = '#8a4a1e'; for (let d = 26; d > 0; d -= 3) g.fillText(c, 0, d);
    const gr = g.createLinearGradient(0, -sz * 0.75, 0, 10); gr.addColorStop(0, fill[0]); gr.addColorStop(1, fill[1]); g.fillStyle = gr; g.fillText(c, 0, 0);
    g.save(); g.globalCompositeOperation = 'source-atop'; g.restore();
    g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,.55)'; g.strokeText(c, -3, -4); g.fillStyle = gr; g.fillText(c, 0, 0);
    g.restore();
  };
  [...word].forEach((c, i) => {
    const cx = x + ws[i] / 2, t = (cx - W / 2) / 600, y = 410 - 36 * (1 - t * t) + (i % 2 ? 6 : -4);
    draw(c, cx, y, t * 0.06 + (i % 2 ? 0.035 : -0.03), i < 3 ? ['#fffdf0', '#ffe9b8'] : ['#ffe27a', '#f7b53b']); x += ws[i];
  });
  draw('!', x + 62, 404, 0.2, ['#ffffff', '#ffd9c9'], 360);
  // destellos junto a la exclamación
  g.fillStyle = '#fff6c4'; g.strokeStyle = '#5a2416'; g.lineWidth = 6;
  for (const [sx, sy, sr] of [[x + 150, 150, 34], [x + 190, 236, 18]]) { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? sr * 0.35 : sr; g.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } g.closePath(); g.stroke(); g.fill(); }
  // cinta
  g.save(); g.translate(W / 2, 592); g.rotate(0.012);
  g.fillStyle = '#c9a06a'; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 400, -26); g.lineTo(d * 520, -14); g.lineTo(d * 484, 26); g.lineTo(d * 520, 66); g.lineTo(d * 400, 54); g.fill(); g.strokeStyle = '#5a2416'; g.lineWidth = 9; g.stroke(); }
  g.beginPath(); g.roundRect(-440, -48, 880, 98, 22); g.fillStyle = '#fff3d6'; g.fill(); g.strokeStyle = '#5a2416'; g.lineWidth = 11; g.stroke();
  g.font = `900 46px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#7a3b22'; g.fillText('EL OBRADOR DE PAN · HORNO DE LEÑA', 0, 18, 820);
  g.restore();
  return cv;
}
let url = null;
export function logoURL() { return url ||= logoCanvas().toDataURL('image/png'); }
