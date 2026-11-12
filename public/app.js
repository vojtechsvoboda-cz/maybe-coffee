/* Maybe Coffee v1 */
(() => {
const d = document, html = d.documentElement;
const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

/* ---------- úvod: logo, linka, pak rozostřený nadpis ---------- */
$$('.split').forEach(h => {
  let i = 0;
  const wrap = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const f = d.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(p => {
        if (!p.trim()) { if (p) f.append(' '); return; }
        const s = d.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = p; f.append(s);
      });
      n.replaceWith(f);
    } else wrap(n);
  });
  wrap(h);
});
let seen = false; try { seen = sessionStorage.getItem('maybe-intro') === '1'; sessionStorage.setItem('maybe-intro', '1'); } catch (e) {}
const ready = () => { html.classList.add('ready'); $$('.hero .ri').forEach(el => el.classList.add('in')); };
if (reduce || seen) { html.classList.add('no-intro'); requestAnimationFrame(ready); } else setTimeout(ready, 1300);

/* ---------- plynulý scroll ---------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
}
const go = (hash, instant) => {
  const el = hash === '#top' ? null : $(hash), y = el ? el.getBoundingClientRect().top + scrollY - 64 : 0;
  if (lenis) lenis.scrollTo(y, { immediate: !!instant, force: true, duration: 1.4 });
  else scrollTo({ top: y, behavior: instant || reduce ? 'auto' : 'smooth' });
};

/* ---------- posuvný indikátor: přední hrana vyrazí první, zadní ji dožene ---------- */
function slide(box, target, animate = true) {
  const ind = $(':scope > .ind', box); if (!ind) return;
  if (!target) { ind.style.opacity = 0; ind._t = null; return; }
  const l = target.offsetLeft, r = box.clientWidth - (target.offsetLeft + target.offsetWidth);
  if (!ind._t || !animate || !ind.offsetParent) {
    ind.style.transition = 'none'; ind.style.left = l + 'px'; ind.style.right = r + 'px'; ind.offsetWidth; ind.style.transition = ''; ind.style.opacity = 1; ind._t = target; return;
  }
  if (ind._t !== target) { const right = target.offsetLeft > ind._t.offsetLeft; ind.classList.toggle('rt', right); ind.classList.toggle('lt', !right); }
  ind.style.opacity = 1; ind.style.left = l + 'px'; ind.style.right = r + 'px'; ind._t = target;
}

/* ---------- navigace ---------- */
const nav = $('#nav'), pillsBox = $('#pills'), pills = $$('a', pillsBox), ids = pills.map(p => p.dataset.s), prog = $('#progress');
let spyLock = 0, spyOn;
const setPill = id => { spyOn = id; pills.forEach(p => p.classList.toggle('on', p.dataset.s === id)); slide(pillsBox, pills.find(p => p.dataset.s === id) || null); };
function onScroll() {
  const y = scrollY, max = d.documentElement.scrollHeight - innerHeight;
  nav.classList.toggle('scrolled', y > 30);
  prog.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  if (spyLock) return;
  let on = null;
  if (y >= max - 4) on = ids[ids.length - 1];
  else { const line = innerHeight * .38; ids.forEach(id => { if ($('#' + id).getBoundingClientRect().top <= line) on = id; }); }
  if (on !== spyOn) setPill(on);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => slide(pillsBox, pills.find(p => p.classList.contains('on')) || null, false));

const mmenu = $('#mmenu'), burger = $('#burger'); let mOpen = false;
$$('a', mmenu).forEach((a, i) => a.style.setProperty('--i', i));
const setM = open => {
  mOpen = open; const r = burger.getBoundingClientRect();
  mmenu.style.setProperty('--mx', r.left + r.width / 2 + 'px'); mmenu.style.setProperty('--my', r.top + r.height / 2 + 'px');
  mmenu.classList.toggle('open', open); nav.classList.toggle('menu-open', open);
  mmenu.setAttribute('aria-hidden', !open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Menu');
  if (lenis) open ? lenis.stop() : lenis.start(); else html.style.overflow = open ? 'hidden' : '';
};
burger.addEventListener('click', () => setM(!mOpen));
d.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  e.preventDefault(); const h = a.getAttribute('href'), id = h.slice(1);
  if (a.dataset.cat) selectCat(a.dataset.cat);
  if (mOpen) { setM(false); go(h, true); onScroll(); return; }
  if (ids.includes(id)) { setPill(id); clearTimeout(spyLock); spyLock = setTimeout(() => { spyLock = 0; onScroll(); }, 1700); }
  go(h);
});

/* ---------- odkrývání při scrollu ---------- */
const rvs = $$('.rv');
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  rvs.forEach(el => io.observe(el));
} else rvs.forEach(el => el.classList.add('in'));

/* ---------- světlo za kurzorem ---------- */
d.addEventListener('pointermove', e => {
  const t = e.target.closest && e.target.closest('.glow'); if (!t) return;
  const r = t.getBoundingClientRect(); t.style.setProperty('--mx', e.clientX - r.left + 'px'); t.style.setProperty('--my', e.clientY - r.top + 'px');
}, { passive: true });

/* ---------- otevírací doba ---------- */
(function hours() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), t = (+p.hour % 24) * 60 + +p.minute;
  const we = x => x === 0 || x === 6, hrs = x => we(x) ? [540, 960] : [480, 1200], f = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const [o, c] = hrs(dow), open = t >= o && t < c;
  $('#openTxt').textContent = open ? 'Právě teď' : 'Teď máme zavřeno';
  $('#openBig').textContent = open ? `Otevřeno do ${f(c)}` : t < o ? `Otevíráme dnes v ${f(o)}` : `Otevíráme zítra v ${f(hrs((dow + 1) % 7)[0])}`;
  $('.open').classList.toggle('closed', !open);
  $$(`.hours tr[data-d="${we(dow) ? 'we' : 'wk'}"]`).forEach(tr => tr.classList.add('today'));
  $('#yr').textContent = new Date().getFullYear();
})();

/* ---------- menu ---------- */
let MENU = null, grp = 'jidlo', cat = 'slane';
const grpBox = $('#grp'), catBox = $('#cats'), list = $('#mlist'), peek = $('#peek'), peekImg = $('#peekImg');
const kc = n => `${n} Kč`;
function renderMenu(animate = true) {
  const g = MENU.groups.find(x => x.id === grp), c = g.cats.find(x => x.id === cat) || g.cats[0]; cat = c.id;
  $$('button', grpBox).forEach(b => b.setAttribute('aria-selected', b.dataset.g === grp));
  if (catBox._g !== grp) {
    catBox._g = grp; $$('button', catBox).forEach(b => b.remove()); $('.ind', catBox)._t = null; catBox.scrollLeft = 0;
    g.cats.forEach(x => { const b = d.createElement('button'); b.type = 'button'; b.role = 'tab'; b.dataset.c = x.id; b.textContent = x.name; catBox.append(b); });
  }
  $$('button', catBox).forEach(b => b.setAttribute('aria-selected', b.dataset.c === cat));
  slide(grpBox, $(`[data-g="${grp}"]`, grpBox), animate);
  slide(catBox, $(`[data-c="${cat}"]`, catBox), animate);
  let i = 0;
  list.className = 'mlist' + (grp === 'jidlo' ? ' food' : '');
  list.innerHTML = c.items.map(it => it.h ? `<li class="mh" style="--i:${i++}">${it.h}</li>` :
    `<li class="mi" style="--i:${i++}"${it.img ? ` data-img="${it.img}" tabindex="0"` : ''}><b>${it.n}${it.v ? `<small>${it.v}</small>` : ''}</b><span class="pr">${kc(it.p)}</span>${it.d || it.a ? `<p>${it.d || ''}${it.a ? `<i>${it.d ? '' : 'Alergeny '}${it.a}</i>` : ''}</p>` : ''}${it.img ? `<div class="ph"><div><img src="/img/${it.img}.webp" alt="${it.n}" loading="lazy"></div></div>` : ''}</li>`).join('');
  $('#mextra').textContent = c.extra || '';
}
function selectCat(id) { if (!MENU) return; const g = MENU.groups.find(x => x.cats.some(c => c.id === id)); if (!g) return; grp = g.id; cat = id; renderMenu(); }
grpBox.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b || b.dataset.g === grp) return; grp = b.dataset.g; cat = MENU.groups.find(x => x.id === grp).cats[0].id; renderMenu(); });
catBox.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b || b.dataset.c === cat) return; cat = b.dataset.c; renderMenu(); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); });
fetch('/data/menu.json').then(r => r.json()).then(m => {
  MENU = m;
  m.groups.forEach(g => { const b = d.createElement('button'); b.type = 'button'; b.role = 'tab'; b.dataset.g = g.id; b.textContent = g.name; grpBox.append(b); });
  renderMenu(false);
  (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(() => { slide(grpBox, $(`[data-g="${grp}"]`, grpBox), false); slide(catBox, $(`[data-c="${cat}"]`, catBox), false); slide(pillsBox, pills.find(p => p.classList.contains('on')) || null, false); slideType(false); });
}).catch(() => { list.innerHTML = '<li class="mi"><b>Menu se nepodařilo načíst.</b><p>Zkuste stránku obnovit nebo si otevřete tištěné menu.</p></li>'; });
/* fotka u kurzoru (desktop), rozbalení fotky (dotyk) */
let px = 0, py = 0, tx = 0, ty = 0, peekOn = false, praf = 0;
const ploop = () => { px += (tx - px) * .16; py += (ty - py) * .16; peek.style.transform = `translate3d(${px}px,${py}px,0) rotate(${(tx - px) * .035}deg)`; praf = peekOn || Math.abs(tx - px) > 1 ? requestAnimationFrame(ploop) : 0; };
addEventListener('pointermove', e => { tx = Math.min(e.clientX + 28, innerWidth - 270); ty = Math.max(84, Math.min(e.clientY - 150, innerHeight - 330)); }, { passive: true });
list.addEventListener('pointerover', e => { const li = e.target.closest('.mi[data-img]'); if (!li || e.pointerType === 'touch') return; peekImg.src = `/img/${li.dataset.img}.webp`; if (!peekOn) { px = tx; py = ty; } peek.classList.add('on'); peekOn = true; if (!praf) ploop(); });
list.addEventListener('pointerout', e => { const li = e.target.closest('.mi[data-img]'); if (!li || li.contains(e.relatedTarget)) return; peek.classList.remove('on'); peekOn = false; });
const toggleItem = li => { const was = li.classList.contains('open'); $$('.mi.open', list).forEach(x => x.classList.remove('open')); li.classList.toggle('open', !was); };
list.addEventListener('click', e => { const li = e.target.closest('.mi[data-img]'); if (li) toggleItem(li); });
list.addEventListener('keydown', e => { const li = e.target.closest('.mi[data-img]'); if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleItem(li); } });

/* ---------- tištěné menu ---------- */
const lb = $('#lb'), lbS = $('#lbS'), lbN = lbS.children.length; let lbLast = null;
const lbPage = () => Math.round(lbS.scrollLeft / lbS.clientWidth);
const lbGo = i => lbS.scrollTo({ left: Math.max(0, Math.min(lbN - 1, i)) * lbS.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
const lbOpen = () => { lbLast = d.activeElement; lb.hidden = false; lbS.scrollLeft = 0; requestAnimationFrame(() => lb.classList.add('on')); if (lenis) lenis.stop(); else html.style.overflow = 'hidden'; $('#lbClose').focus(); };
const lbClose = () => { lb.classList.remove('on'); setTimeout(() => { lb.hidden = true; }, 450); if (lenis) lenis.start(); else html.style.overflow = ''; if (lbLast) lbLast.focus(); };
$('#lbOpen').onclick = lbOpen; $('#lbClose').onclick = lbClose;
$('#lbPrev').onclick = () => lbGo(lbPage() - 1); $('#lbNext').onclick = () => lbGo(lbPage() + 1);
lbS.addEventListener('scroll', () => { $('#lbCount').textContent = `${lbPage() + 1} / ${lbN}`; }, { passive: true });
lbS.setAttribute('data-lenis-prevent', '');
d.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!lb.hidden) lbClose(); else if (mOpen) setM(false); }
  if (!lb.hidden && e.key === 'ArrowRight') lbGo(lbPage() + 1);
  if (!lb.hidden && e.key === 'ArrowLeft') lbGo(lbPage() - 1);
});

/* ---------- pás fotek: jede doprava, jde chytit a táhnout ---------- */
(function strip() {
  const box = $('#strip'), tr = $('#stripT'); if (!box) return;
  $$('figure', tr).forEach(f => { const c = f.cloneNode(true); c.setAttribute('aria-hidden', 'true'); tr.append(c); });
  let half = 0, x = 0, v = 0, drag = false, lx = 0, vis = false, lastY = scrollY, boost = 0;
  const measure = () => { half = tr.scrollWidth / 2 + parseFloat(getComputedStyle(tr).columnGap || 0) / 2; };
  const tick = () => {
    if (vis) {
      const dy = scrollY - lastY; lastY = scrollY; boost += (Math.abs(dy) * .35 - boost) * .1;
      if (!drag) { x += (reduce ? 0 : .55 + boost) + v; v *= .94; }
      if (half) { if (x > 0) x -= half; if (x < -half) x += half; }
      tr.style.transform = `translate3d(${x}px,0,0)`;
    }
    requestAnimationFrame(tick);
  };
  box.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; v = 0; box.classList.add('drag'); box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lx; lx = e.clientX; x += dx; v = dx; });
  const up = () => { drag = false; box.classList.remove('drag'); };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  new IntersectionObserver(es => { vis = es[0].isIntersecting; lastY = scrollY; }).observe(box);
  addEventListener('resize', measure); addEventListener('load', measure); measure(); x = -half; tick();
})();

/* ---------- rezervace ---------- */
const easter = y => { const a = y % 19, b = Math.floor(y / 100), c = y % 100, dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451); return new Date(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1); };
const blocked = dt => {
  if (['1.1', '1.5', '8.5', '5.7', '6.7', '28.9', '28.10', '17.11', '24.12', '25.12', '26.12', '31.12'].includes(`${dt.getDate()}.${dt.getMonth() + 1}`)) return true;
  const e = easter(dt.getFullYear()), gf = new Date(e), em = new Date(e); gf.setDate(e.getDate() - 2); em.setDate(e.getDate() + 1);
  return [gf, em].some(x => x.toDateString() === dt.toDateString());
};
const form = $('#rsForm'), typeBox = $('#rsType'), calEl = $('#cal'), msg = $('#rsMsg');
const slideType = (a = true) => slide(typeBox, $('input:checked', typeBox).parentElement, a);
(function reservation() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const min = new Date(today); min.setDate(min.getDate() + 1);
  const first = new Date(min.getFullYear(), min.getMonth(), 1);
  let view = new Date(first), sel = null, hh = 10, mm = 0, n = 2;
  const drawCal = () => {
    const y = view.getFullYear(), m = view.getMonth(), off = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    let h = `<div class="cal-h"><button type="button" data-mv="-1" aria-label="Předchozí měsíc"${view <= first ? ' disabled' : ''}>‹</button><span>${view.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}</span><button type="button" data-mv="1" aria-label="Další měsíc">›</button></div><div class="cal-g">${['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(x => `<span>${x}</span>`).join('')}${'<i></i>'.repeat(off)}`;
    for (let i = 1; i <= days; i++) { const dt = new Date(y, m, i), w = dt.getDay(), no = dt < min || w === 0 || w === 6 || blocked(dt); h += `<button type="button" data-d="${i}"${no ? ' disabled' : ''} aria-pressed="${!!sel && sel.getTime() === dt.getTime()}">${i}</button>`; }
    calEl.innerHTML = h + '</div>';
  };
  calEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.mv) view = new Date(view.getFullYear(), view.getMonth() + +b.dataset.mv, 1); else sel = new Date(view.getFullYear(), view.getMonth(), +b.dataset.d); drawCal(); });
  const drawTime = () => {
    if (hh === 19) mm = 0;
    $('#rsH').innerHTML = Array.from({ length: 12 }, (_, i) => i + 8).map(h => `<label><input type="radio" name="rh" value="${h}"${h === hh ? ' checked' : ''}><span>${h}</span></label>`).join('');
    $('#rsM').innerHTML = [0, 15, 30, 45].map(m => `<label><input type="radio" name="rm" value="${m}"${m === mm ? ' checked' : ''}${hh === 19 && m ? ' disabled' : ''}><span>:${String(m).padStart(2, '0')}</span></label>`).join('');
    $('#rsTime').textContent = `${hh}:${String(mm).padStart(2, '0')}`;
  };
  $('#rsH').addEventListener('change', e => { hh = +e.target.value; drawTime(); $(`#rsH input[value="${hh}"]`).focus(); });
  $('#rsM').addEventListener('change', e => { mm = +e.target.value; drawTime(); $(`#rsM input[value="${mm}"]`).focus(); });
  $('#rsMinus').onclick = () => { n = Math.max(1, n - 1); $('#rsN').textContent = n; };
  $('#rsPlus').onclick = () => { n = Math.min(40, n + 1); $('#rsN').textContent = n; };
  const type = () => form.rt.value;
  typeBox.addEventListener('change', () => { slideType(); form.classList.toggle('q', type() === 'dotaz'); $('#rsNoteL').textContent = type() === 'dotaz' ? 'Na co se chcete zeptat' : type() === 'akce' ? 'Řekněte nám víc o akci' : 'Poznámka'; });
  const say = (t, err) => { msg.hidden = false; msg.textContent = t; msg.classList.toggle('err', !!err); };
  form.addEventListener('submit', e => {
    e.preventDefault();
    if ($('#rs-web').value) return;
    if (type() !== 'dotaz' && !sel) return say('Vyberte prosím v kalendáři den, kdy chcete přijít.', true);
    if (!form.checkValidity()) { say('Doplňte prosím jméno, e-mail, telefon a souhlas.', true); form.reportValidity(); return; }
    const when = type() === 'dotaz' ? '' : ` na ${sel.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' })} v ${$('#rsTime').textContent} pro ${n} os.`;
    say(`Tohle je zkušební verze webu, žádost${when} se zatím nikam neodeslala. Po spuštění vám hned přijde e-mail, že jsme ji přijali a že platí až po našem potvrzení.`);
  });
  drawCal(); drawTime(); requestAnimationFrame(() => slideType(false));
})();
addEventListener('resize', () => { slideType(false); if (MENU) { slide(grpBox, $(`[data-g="${grp}"]`, grpBox), false); slide(catBox, $(`[data-c="${cat}"]`, catBox), false); } });

/* ---------- cookies ---------- */
const ck = $('#cookie'); ck.hidden = !!store.get('maybe-ck');
$$('[data-ck]', ck).forEach(b => b.onclick = () => { store.set('maybe-ck', b.dataset.ck); ck.hidden = true; });
$('#ckOpen').onclick = () => { ck.hidden = false; };

/* ---------- patička: Maybe nakreslené do matcha latte (WebGL2) ---------- */
(function liquid() {
  const box = $('#liquid'), cv = $('#gl'); if (!box || !cv) return;
  const gl = cv.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' }); if (!gl) return;
  const VS = `#version 300 es
in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform float uStir;uniform sampler2D uLogo;uniform float uLA;
out vec4 o;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
float logoAt(vec2 p){float h=.74;vec2 q=p/vec2(h*uLA,h)+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return 0.;return texture(uLogo,vec2(q.x,1.-q.y)).r;}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;float ca=uRes.x/uRes.y;
  vec2 p=(uv-.5)*vec2(ca,1.);float t=uT*.055;
  vec2 mp=(uM-.5)*vec2(ca,1.);vec2 dm=p-mp;float r2=dot(dm,dm);
  float sw=uStir*exp(-r2*9.)*1.5;float cs=cos(sw),sn=sin(sw);vec2 ps=mp+mat2(cs,-sn,sn,cs)*dm;
  vec2 w1=vec2(fbm(ps*1.5+vec2(0.,t)),fbm(ps*1.5+vec2(5.2,-t)));
  vec2 w2=vec2(fbm(ps*2.1+4.*w1+vec2(1.7,9.2)+t*.7),fbm(ps*2.1+4.*w1+vec2(8.3,2.8)-t*.6));
  float f=fbm(ps*1.7+3.4*w2);
  vec2 lp=ps+(w2-.5)*.011;
  float m=logoAt(lp);
  float foam=smoothstep(.2,.62,m);
  float h=f*.3+m*.95;
  float k=uRes.y*.075;
  vec3 n=normalize(vec3(-dFdx(h)*k,-dFdy(h)*k,1.));
  vec3 c1=vec3(.52,.66,.44),c2=vec3(.678,.757,.627),c3=vec3(.955,.94,.885);
  vec3 col=mix(c1,c2,smoothstep(.28,.56,f));
  col=mix(col,c3,smoothstep(.56,.8,f)*.8);
  col=mix(col,vec3(.985,.972,.93),foam);
  vec3 L=normalize(vec3(-.45+(uM.x-.5)*.5,.6+(uM.y-.5)*.5,.72));
  float diff=clamp(dot(n,L),0.,1.);
  float spec=pow(max(dot(reflect(-L,n),vec3(0.,0.,1.)),0.),28.);
  col*=.84+.26*diff;col+=spec*(.08+.16*foam);
  col-=smoothstep(.02,.22,m)*(1.-foam)*.07;
  float edge=smoothstep(0.,.09,uv.y)*smoothstep(0.,.09,1.-uv.y);
  col=mix(c2,col,edge);
  o=vec4(col,1.);
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return;
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), uRes = U('uRes'), uT = U('uT'), uM = U('uM'), uStir = U('uStir'), uLA = U('uLA');
  /* logo jako měkká výšková mapa */
  const LW = 1024, LH = Math.round(LW * 133.23 / 215.81), lc = d.createElement('canvas'); lc.width = LW; lc.height = LH;
  const cx = lc.getContext('2d'), path = new Path2D($('#logo path').getAttribute('d')), s = LW * .9 / 215.81;
  cx.fillStyle = '#000'; cx.fillRect(0, 0, LW, LH);
  cx.setTransform(s, 0, 0, s, LW * .05, LH * .05);
  cx.fillStyle = '#fff'; cx.strokeStyle = '#fff'; cx.lineJoin = 'round';
  cx.shadowColor = '#fff'; cx.shadowBlur = 9; cx.fill(path); cx.fill(path);
  cx.shadowBlur = 3; cx.fill(path);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lc);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1f(uLA, LW / LH);
  box.classList.add('gl');
  let W = 0, H = 0, vis = false, mx = .5, my = .5, tmx = .5, tmy = .5, stir = 0, t0 = performance.now(), on = false;
  const size = () => { const r = box.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5); W = Math.max(2, Math.round(r.width * dpr)); H = Math.max(2, Math.round(r.height * dpr)); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); gl.uniform2f(uRes, W, H); if (reduce) draw(performance.now()); };
  const draw = now => { mx += (tmx - mx) * .06; my += (tmy - my) * .06; stir *= .965; gl.uniform1f(uT, (now - t0) / 1000); gl.uniform2f(uM, mx, my); gl.uniform1f(uStir, stir); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const loop = now => { if (!on) return; draw(now); requestAnimationFrame(loop); };
  box.addEventListener('pointermove', e => { const r = box.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width, ny = 1 - (e.clientY - r.top) / r.height; stir = Math.min(1.6, stir + Math.hypot(nx - tmx, ny - tmy) * 5); tmx = nx; tmy = ny; }, { passive: true });
  new IntersectionObserver(es => { vis = es[0].isIntersecting; const was = on; on = vis && !reduce; if (on && !was) requestAnimationFrame(loop); }, { rootMargin: '200px' }).observe(box);
  addEventListener('resize', size); size(); if (!reduce) draw(performance.now());
})();

onScroll();
})();
