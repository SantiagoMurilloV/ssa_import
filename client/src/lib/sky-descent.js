(() => {
const TINTA = '42,42,53';
const lerp = (a, b, t) => a + (b - a) * t;
const mix3 = (c1, c2, t) => [lerp(c1[0],c2[0],t)|0, lerp(c1[1],c2[1],t)|0, lerp(c1[2],c2[2],t)|0];
// altitud → color de cielo: estratosfera lavanda → capa de nubes crema/durazno → suelo salvia cálido
const SKY = [
  { p: 0,   top: [150,138,190], bot: [214,180,190] },
  { p: .45, top: [214,160,134], bot: [244,236,228] },
  { p: 1,   top: [190,205,195], bot: [111,146,124] }
];
const skyAt = (p) => {
  let a = SKY[0], b = SKY[SKY.length-1];
  for (let i = 0; i < SKY.length - 1; i++) if (p >= SKY[i].p && p <= SKY[i+1].p) { a = SKY[i]; b = SKY[i+1]; break; }
  const t = (p - a.p) / Math.max(.0001, b.p - a.p);
  return { top: mix3(a.top, b.top, t), bot: mix3(a.bot, b.bot, t) };
};

class SkyDescent extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;display:block';
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    this.appendChild(this.canvas);
    const rnd = (a, b) => a + Math.random() * (b - a);
    // 3 capas de nubes con profundidad
    this.clouds = [];
    const layers = [{ n: 6, par: .12, r: [180, 320], al: [.10, .18], sp: .008 },
                    { n: 7, par: .28, r: [110, 200], al: [.16, .26], sp: .014 },
                    { n: 6, par: .5,  r: [60, 130],  al: [.22, .34], sp: .022 }];
    layers.forEach((L, li) => {
      for (let i = 0; i < L.n; i++) {
        // cada nube: 3-5 lóbulos
        const lobes = [];
        const nl = 3 + (Math.random() * 3 | 0);
        for (let k = 0; k < nl; k++) lobes.push({ dx: rnd(-.8, .8), dy: rnd(-.3, .3), f: rnd(.5, 1) });
        this.clouds.push({ u: Math.random(), vy: rnd(0, 3.2), r: rnd(L.r[0], L.r[1]), alpha: rnd(L.al[0], L.al[1]), par: L.par, speed: L.sp * rnd(.7, 1.4), squash: rnd(.34, .48), lobes, layer: li });
      }
    });
    // paquetes en descenso, 3 profundidades
    this.parcels = [];
    const PCOL = [[150,138,190],[214,160,134],[111,146,124]];
    for (let i = 0; i < 9; i++) {
      const depth = i % 3; // 0 lejos … 2 cerca
      this.parcels.push({
        u: rnd(.05, .95), vy: rnd(0, 3.2),
        s: [.5, .8, 1.2][depth] * rnd(.85, 1.15),
        par: [.16, .32, .55][depth],
        blur: [2.5, 1, 0][depth],
        alpha: [.4, .6, .85][depth],
        sway: rnd(0, Math.PI * 2), swaySp: rnd(.4, .9), drift: rnd(.1, .3),
        col: PCOL[i % 3], depth, kind: i % 2
      });
    }
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this);
    this.resize();
    const loop = (now) => { this.draw(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  disconnectedCallback() { cancelAnimationFrame(this.raf); this.ro && this.ro.disconnect(); }
  resize() {
    const r = this.getBoundingClientRect();
    this.w = Math.max(10, r.width); this.h = Math.max(10, r.height);
    const dpr = Math.min(1.5, window.devicePixelRatio || 1); this.dpr = dpr;
    this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
  }
  plane(ctx, x, y, ang, scale, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI/2); ctx.scale(scale*1.6, scale*1.6);
    ctx.globalAlpha = alpha;
    const p = new Path2D('M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z');
    ctx.translate(-12, -12);
    ctx.shadowColor = 'rgba(255,255,255,1)'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#2A2A35'; ctx.fill(p);
    ctx.shadowBlur = 0; ctx.restore(); ctx.globalAlpha = 1;
  }
  brand(ctx, x, y, s, al, onDark) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 7.5px Georgia, serif';
    const ink = onDark ? '250,247,244' : '42,42,53';
    ctx.fillStyle = 'rgba(' + ink + ',' + al + ')';
    ctx.fillText('S S A', 0, -1.5);
    ctx.font = '600 3.6px Verdana, sans-serif';
    ctx.fillStyle = 'rgba(' + (onDark ? '217,212,231' : '150,138,190') + ',' + al + ')';
    ctx.fillText('I M P O R T', 0, 4.2);
    ctx.restore();
  }
  parcel(ctx, x, y, q, fade) {
    const s = q.s, tilt = Math.sin(q.sway) * .12;
    const al = q.alpha * fade;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
    const [r, g, b] = q.col;
    // canopy
    ctx.beginPath(); ctx.arc(0, -34, 20, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (al * .8) + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(42,42,53,' + (al * .5) + ')'; ctx.lineWidth = 1; ctx.stroke();
    // gajos
    ctx.beginPath(); ctx.moveTo(-10, -37); ctx.quadraticCurveTo(-6, -50, 0, -54); ctx.moveTo(10, -37); ctx.quadraticCurveTo(6, -50, 0, -54);
    ctx.strokeStyle = 'rgba(255,255,255,' + (al * .6) + ')'; ctx.stroke();
    // cuerdas
    ctx.beginPath(); ctx.moveTo(-19, -32); ctx.lineTo(-9, -8); ctx.moveTo(19, -32); ctx.lineTo(9, -8); ctx.moveTo(-7, -34); ctx.lineTo(-3, -8); ctx.moveTo(7, -34); ctx.lineTo(3, -8);
    ctx.strokeStyle = 'rgba(42,42,53,' + (al * .45) + ')'; ctx.lineWidth = .8; ctx.stroke();
    if (q.kind === 0) {
      // caja SSA
      ctx.beginPath(); ctx.roundRect(-12, -8, 24, 19, 3);
      ctx.fillStyle = 'rgba(252,249,244,' + al + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(42,42,53,' + (al * .6) + ')'; ctx.lineWidth = 1.1; ctx.stroke();
      // cinta superior
      ctx.fillStyle = 'rgba(150,138,190,' + (al * .9) + ')';
      ctx.fillRect(-12, -8, 24, 2.6);
      this.brand(ctx, 0, 4.5, 1, al);
    } else {
      // bolsa de shopping SSA
      ctx.beginPath();
      ctx.moveTo(-10, -6); ctx.lineTo(-12, 12); ctx.quadraticCurveTo(-12, 14, -10, 14);
      ctx.lineTo(10, 14); ctx.quadraticCurveTo(12, 14, 12, 12); ctx.lineTo(10, -6); ctx.closePath();
      ctx.fillStyle = 'rgba(42,42,53,' + al + ')'; ctx.fill();
      // asas
      ctx.beginPath(); ctx.arc(-4, -6, 3.6, Math.PI, 0); ctx.arc(4, -6, 3.6, Math.PI, 0);
      ctx.strokeStyle = 'rgba(150,138,190,' + al + ')'; ctx.lineWidth = 1.2; ctx.stroke();
      this.brand(ctx, 0, 6, 1, al, true);
    }
    ctx.restore();
  }
  cloud(ctx, c, x, y, fade) {
    for (const l of c.lobes) {
      const cx = x + l.dx * c.r, cy = y + l.dy * c.r * c.squash, rr = c.r * l.f;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, 'rgba(255,255,255,' + (c.alpha * fade) + ')');
      g.addColorStop(.65, 'rgba(255,255,255,' + (c.alpha * .45 * fade) + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, c.squash); ctx.translate(-cx, -cy);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill();
      ctx.restore();
    }
  }
  draw(now) {
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    const sy = window.scrollY, vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight;
    const p = Math.max(0, Math.min(1, sy / Math.max(1, docH - vh)));
    // el hero tiene su propio globo: la atmósfera entra al salir de él
    const fade = Math.max(0, Math.min(1, (sy - vh * .3) / (vh * .5)));

    // cielo según altitud (siempre muy sutil para no pelear con el fondo hueso)
    if (fade > 0) {
      const sk = skyAt(p);
      const g = ctx.createLinearGradient(0, 0, 0, this.h);
      g.addColorStop(0, 'rgba(' + sk.top.join(',') + ',' + (.16 * fade) + ')');
      g.addColorStop(1, 'rgba(' + sk.bot.join(',') + ',' + (.22 * fade) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, this.w, this.h);
      // sol bajo: halo cálido que sube a medida que desciendes
      const sunY = this.h * (0.15 + p * .55), sunX = this.w * .82;
      const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, this.w * .3);
      sun.addColorStop(0, 'rgba(255,244,228,' + (.5 * fade) + ')');
      sun.addColorStop(1, 'rgba(255,244,228,0)');
      ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(sunX, sunY, this.w * .3, 0, 7); ctx.fill();
    }
    if (fade <= 0) return;

    // nubes: suben al hacer scroll (tú desciendes), parallax por capa
    for (const c of this.clouds) {
      c.u += c.speed / 60; if (c.u > 1.25) c.u = -.25;
      const x = c.u * this.w;
      // posición vertical en "mundo": se repite cada 3.2 alturas de viewport
      const worldY = (c.vy - p * (2.2 + c.par * 3)) % 3.2;
      const yy = (((worldY % 3.2) + 3.2) % 3.2 - .1) * this.h * .5 + this.h * .1;
      // altitud tiñe levemente las nubes profundas
      this.cloud(ctx, c, x, yy, fade * (c.layer === 0 ? .8 : 1));
    }

    // paquetes descendiendo contigo
    for (const q of this.parcels) {
      q.sway += q.swaySp / 60;
      q.vy += q.drift / 600;
      const worldY = (q.vy - p * (1.6 + q.par * 3)) % 3.4;
      const yy = (((worldY % 3.4) + 3.4) % 3.4 - .15) * this.h * .55 + this.h * .08;
      const x = q.u * this.w + Math.sin(q.sway) * 26 * q.s;
      if (yy < -80 || yy > this.h + 80) continue;
      this.parcel(ctx, x, yy, q, fade);
    }

  }
}
customElements.define('sky-descent', SkyDescent);
})();
