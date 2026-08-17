(() => {
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
let geoPromise = null;
const loadGeo = () => geoPromise || (geoPromise = fetch(GEO_URL).then(r => r.json()));
const waitFor = (test) => new Promise(res => { const t = () => test() ? res() : setTimeout(t, 60); t(); });
const USA = [-96, 38.5], COL = [-73.2, 4.3];
const TINTA = '42,42,53', LAV = '150,138,190', SAL = '111,146,124';
const easeInOut = (t) => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;

class Globe3D extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.style.display = 'block'; this.style.width = '100%'; this.style.height = '100%';
    this.style.position = this.style.position || 'relative'; this.style.overflow = 'hidden';
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    this.appendChild(this.canvas);
    this.rot = [48, -4];         // [lambda, phi] current rotation
    this.userRot = null;           // when dragging
    this.vel = 0;
    this.cycleStart = performance.now();
    this.drag = null;
    this.canvas.style.cursor = 'grab';
    this.canvas.addEventListener('pointerdown', (e) => {
      this.drag = { x: e.clientX, y: e.clientY, rot: [...this.rot] };
      this.userHold = true; this.canvas.setPointerCapture(e.pointerId);
      this.canvas.style.cursor = 'grabbing';
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const k = 0.35;
      this.rot = [this.drag.rot[0] + (e.clientX - this.drag.x) * k,
                  Math.max(-60, Math.min(60, this.drag.rot[1] - (e.clientY - this.drag.y) * k))];
    });
    const end = () => { this.drag = null; this.userHold = false; this.holdUntil = performance.now() + 2500; this.canvas.style.cursor = 'grab'; };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
    // grain
    const g = document.createElement('canvas'); g.width = g.height = 128;
    const gc = g.getContext('2d'), im = gc.createImageData(128, 128);
    for (let i = 0; i < im.data.length; i += 4) { const v = 118 + Math.random() * 60 | 0; im.data[i] = im.data[i+1] = im.data[i+2] = v; im.data[i+3] = 12; }
    gc.putImageData(im, 0, 0); this.grain = g;
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this);
    this.start();
  }
  disconnectedCallback() { cancelAnimationFrame(this.raf); this.ro && this.ro.disconnect(); }
  async start() {
    await waitFor(() => window.d3 && window.topojson);
    const topo = await loadGeo();
    this.countries = topojson.feature(topo, topo.objects.countries).features;
    this.grat = d3.geoGraticule10();
    this.interp = d3.geoInterpolate(USA, COL);
    this.resize();
    const loop = (now) => { this.draw(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  resize() {
    const r = this.getBoundingClientRect();
    this.w = Math.max(10, r.width); this.h = Math.max(10, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1); this.dpr = dpr;
    this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
    this.R = Math.min(this.w, this.h) * .56;
    this.cx = this.w / 2; this.cy = this.h * .62;
  }
  plane(ctx, x, y, ang, scale, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); ctx.scale(scale * 1.6, scale * 1.6);
    ctx.globalAlpha = alpha;
    const p = new Path2D('M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z');
    ctx.translate(-12, -12);
    ctx.shadowColor = 'rgba(255,255,255,1)'; ctx.shadowBlur = 9;
    ctx.fillStyle = '#2A2A35'; ctx.fill(p);
    ctx.shadowBlur = 0;
    ctx.restore(); ctx.globalAlpha = 1;
  }
  draw(now) {
    if (!this.countries) return;
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);

    // flight cycle
    const CYCLE = 14000, FLY = 11000;
    const ct = (now - this.cycleStart) % CYCLE;
    if (now - this.cycleStart >= CYCLE) this.cycleStart = now - ct;
    const prog = easeInOut(Math.min(1, ct / FLY));
    const arrived = ct > FLY;
    const planeLL = this.interp(prog);

    // camera stays on the USA–Colombia framing unless the user drags
    if (!this.drag && !(this.holdUntil && now < this.holdUntil)) {
      const target = [48, -4];
      this.rot[0] += (target[0] - this.rot[0]) * .04;
      this.rot[1] += (target[1] - this.rot[1]) * .04;
    }
    const proj = d3.geoOrthographic().translate([this.cx, this.cy]).scale(this.R).rotate([this.rot[0], this.rot[1]]).clipAngle(90);
    const path = d3.geoPath(proj, ctx);

    // back atmosphere halo
    let halo = ctx.createRadialGradient(this.cx, this.cy, this.R * .8, this.cx, this.cy, this.R * 1.35);
    halo.addColorStop(0, 'rgba(' + LAV + ',0)');
    halo.addColorStop(.55, 'rgba(' + LAV + ',.20)');
    halo.addColorStop(.78, 'rgba(214,160,134,.14)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(this.cx, this.cy, this.R * 1.35, 0, 7); ctx.fill();

    // ocean sphere with 3D shading (light top-left)
    const oc = ctx.createRadialGradient(this.cx - this.R * .38, this.cy - this.R * .45, this.R * .1, this.cx, this.cy, this.R);
    oc.addColorStop(0, 'rgba(255,255,255,.95)');
    oc.addColorStop(.45, 'rgba(236,232,240,.9)');
    oc.addColorStop(.8, 'rgba(210,205,222,.92)');
    oc.addColorStop(1, 'rgba(178,172,198,.95)');
    ctx.beginPath(); ctx.arc(this.cx, this.cy, this.R, 0, 7);
    ctx.fillStyle = oc; ctx.fill();

    // graticule
    ctx.save();
    ctx.beginPath(); ctx.arc(this.cx, this.cy, this.R, 0, 7); ctx.clip();
    ctx.beginPath(); path(this.grat);
    ctx.strokeStyle = 'rgba(' + TINTA + ',.07)'; ctx.lineWidth = .8; ctx.stroke();

    // countries
    for (const f of this.countries) {
      const hi = f.id === '840' ? 1 : f.id === '170' ? 2 : 0;
      ctx.beginPath(); path(f);
      if (hi === 1) {
        ctx.fillStyle = 'rgba(' + LAV + ',.8)';
        ctx.shadowColor = 'rgba(' + LAV + ',1)'; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(' + TINTA + ',.5)'; ctx.lineWidth = 1; ctx.stroke();
      } else if (hi === 2) {
        const pulse = arrived ? 1 - Math.min(1, (ct - FLY) / 1400) : 0;
        ctx.fillStyle = 'rgba(' + SAL + ',.8)';
        ctx.shadowColor = 'rgba(' + SAL + ',1)'; ctx.shadowBlur = 16 + pulse * 24; ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(' + TINTA + ',.5)'; ctx.lineWidth = 1; ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.fill();
        ctx.strokeStyle = 'rgba(' + TINTA + ',.12)'; ctx.lineWidth = .6; ctx.stroke();
      }
    }

    // route: flown part solid, ahead dashed
    const flown = { type: 'LineString', coordinates: d3.range(0, prog + .0001, .02).map(t => this.interp(Math.min(t, prog))) };
    const ahead = { type: 'LineString', coordinates: d3.range(prog, 1.0001, .02).map(t => this.interp(Math.min(t, 1))) };
    ctx.beginPath(); path(ahead);
    ctx.setLineDash([0.5, 7]); ctx.lineDashOffset = -now / 60; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(' + TINTA + ',.55)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
    if (prog > .01) {
      ctx.beginPath(); path(flown);
      ctx.strokeStyle = 'rgba(' + TINTA + ',.65)'; ctx.lineWidth = 1.8; ctx.stroke();
      // white contrail glow
      ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(Math.max(0, prog - .12), prog + .0001, .01).map(t => this.interp(t)) });
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.stroke();
    }

    // endpoints
    const drawPt = (ll, pulse) => {
      const p = proj(ll); if (!p) return;
      const visible = d3.geoDistance(ll, [-this.rot[0], -this.rot[1]]) < Math.PI / 2;
      if (!visible) return;
      ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 7); ctx.fillStyle = 'rgba(' + TINTA + ',.85)'; ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], 6.5, 0, 7); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.4; ctx.stroke();
      for (let k = 0; k < 2; k++) {
        const ph = ((now / 1600) + k * .5) % 1;
        ctx.beginPath(); ctx.arc(p[0], p[1], 8 + ph * (pulse ? 24 : 14), 0, 7);
        ctx.strokeStyle = 'rgba(' + TINTA + ',' + ((pulse ? .5 : .28) * (1 - ph)) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
      }
    };
    drawPt(USA, ct < 1500);
    drawPt(COL, arrived);

    // plane
    if (!arrived) {
      const p = proj(planeLL);
      const p2 = proj(this.interp(Math.min(1, prog + .01)));
      if (p && p2) {
        const ang = Math.atan2(p2[1] - p[1], p2[0] - p[0]);
        const alt = Math.sin(prog * Math.PI);
        const scale = (.8 + alt * .7) * (this.R / 420 + .55);
        ctx.save(); ctx.globalAlpha = .12 - alt * .05; ctx.filter = 'blur(' + (2 + alt * 3) + 'px)';
        this.plane(ctx, p[0], p[1] + 4 + alt * 18, ang, scale * (.94 - alt * .18), 1);
        ctx.filter = 'none'; ctx.restore(); ctx.globalAlpha = 1;
        this.plane(ctx, p[0], p[1] - alt * 6, ang, scale, .96);
      }
    }
    ctx.restore(); // unclip

    // terminator shade (right-bottom dark limb)
    const sh = ctx.createRadialGradient(this.cx - this.R * .4, this.cy - this.R * .45, this.R * .2, this.cx, this.cy, this.R);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.82, 'rgba(' + TINTA + ',.02)'); sh.addColorStop(1, 'rgba(' + TINTA + ',.16)');
    ctx.beginPath(); ctx.arc(this.cx, this.cy, this.R, 0, 7); ctx.fillStyle = sh; ctx.fill();
    // specular sheen
    const sp = ctx.createRadialGradient(this.cx - this.R * .45, this.cy - this.R * .55, 0, this.cx - this.R * .45, this.cy - this.R * .55, this.R * .7);
    sp.addColorStop(0, 'rgba(255,255,255,.32)'); sp.addColorStop(.4, 'rgba(255,255,255,.08)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(this.cx, this.cy, this.R, 0, 7); ctx.fillStyle = sp; ctx.fill();
    // rim light
    ctx.beginPath(); ctx.arc(this.cx, this.cy, this.R, 0, 7);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2; ctx.stroke();

    // grain
    ctx.globalAlpha = .5;
    ctx.fillStyle = ctx.createPattern(this.grain, 'repeat');
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalAlpha = 1;
    // caption
    ctx.font = '10.5px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(' + TINTA + ',.45)';
    ctx.fillText('EE. UU. → COLOMBIA · ENVÍOS A TODO EL PAÍS · ARRASTRA PARA GIRAR', 18, this.h - 16);
  }
}
customElements.define('globe-3d', Globe3D);
})();
