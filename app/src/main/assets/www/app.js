/* Keuanganku — semua data tersimpan di HP (localStorage WebView). */
(function () {
'use strict';

/* ---------- konstanta ---------- */
const A = window.Android || null;
const $ = s => document.querySelector(s);
const SRC = [
  {id:'mandiri', n:'Mandiri QRIS', s:'Mandiri', c:'#1d4f9a'},
  {id:'gopay', n:'GoPay QRIS', s:'GoPay', c:'#11a058'},
  {id:'transfer', n:'Transfer', s:'Transfer', c:'#7a5ad0'},
  {id:'tunai', n:'Tunai', s:'Tunai', c:'#b07d2c'},
  {id:'lain', n:'Lainnya', s:'Lainnya', c:'#8a98a8'}
];
const CAT = [
  {id:'makan', n:'Makan & minum'}, {id:'belanja', n:'Belanja harian'}, {id:'transport', n:'Transport & BBM'},
  {id:'tagihan', n:'Tagihan & pulsa'}, {id:'kesehatan', n:'Kesehatan'}, {id:'keluarga', n:'Keluarga & rumah'},
  {id:'hiburan', n:'Hiburan'}, {id:'lain', n:'Lainnya'}
];
const INC = [
  {id:'pokok', n:'Gaji pokok', s:'Pokok', c:'#0b6e6a'},
  {id:'lembur', n:'Lembur', s:'Lembur', c:'#4fb3a9'},
  {id:'sppd', n:'SPPD', s:'SPPD', c:'#e0a82e'},
  {id:'lain', n:'Pemasukan lain', s:'Lainnya', c:'#9aa8b6'}
];
const KW = {
  makan:['kopi','coffee','resto','warung','bakso','ayam','mie ','mie-','cafe','kfc','mcd','geprek','sate','padang','martabak','bakery','roti','food','gofood','kedai','janji jiwa','kenangan','chatime','pizza','burger','soto','nasi','rm ','rumah makan','depot','starbucks','solaria','hokben'],
  belanja:['indomaret','alfamart','alfamidi','superindo','hypermart','transmart','mart','toko','grosir','pasar','minimarket','shopee','tokopedia','lazada','blibli','supermarket','giant','lotte'],
  transport:['pertamina','spbu','shell','parkir','gojek','grab','gocar','goride','tol','bensin','bbm','bluebird','kai','travel','bus','tiket'],
  tagihan:['pln','pdam','telkomsel','indihome','pulsa','token','bpjs','xl','indosat','paket data','tri ','smartfren','listrik','internet','biznet','first media'],
  kesehatan:['apotek','apotik','kimia farma','klinik','rumah sakit','rs ','guardian','dokter','lab ','prodia','k24','century'],
  hiburan:['cinema','xxi','cgv','netflix','spotify','game','youtube','vidio','disney','steam'],
  keluarga:['sekolah','spp','les ','arisan','kost','kos ','sewa','laundry','pampers','susu']
};
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MON = {jan:1,feb:2,mar:3,apr:4,mei:5,may:5,jun:6,jul:7,agu:8,agt:8,aug:8,ags:8,sep:9,okt:10,oct:10,nov:11,des:12,dec:12};
const ICON = {
  left:'<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
  right:'<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
  close:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  dl:'<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M4 20h16"/></svg>',
  bolt:'<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>'
};
const KEY = 'keuanganku.v1';

/* ---------- util ---------- */
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp = n => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
const rpS = n => (n < 0 ? '−' : '') + 'Rp ' + Math.abs(Math.round(n || 0)).toLocaleString('id-ID');
const jt = n => { const a = Math.abs(n || 0); const s = a >= 1e6 ? (a / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 2}) + ' jt' : a >= 1e3 ? Math.round(a / 1e3) + ' rb' : String(Math.round(a)); return (n < 0 ? '−' : '') + s; };
const fmt = n => n ? Number(n).toLocaleString('id-ID') : '';
const num = v => +(String(v == null ? '' : v).replace(/\D/g, '')) || 0;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const sum = (a, f) => a.reduce((s, x) => s + (+(f ? f(x) : x.amt) || 0), 0);
const toLocal = ms => { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const nowLocal = () => toLocal(Date.now());
const NOW_YM = () => nowLocal().slice(0, 7);
const ymAdd = (ym, k) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
const ymLabel = ym => { const [y, m] = ym.split('-').map(Number); return BULAN[m - 1] + ' ' + y; };
const ymShort = ym => BULAN[+ym.slice(5, 7) - 1].slice(0, 3);
const srcOf = id => SRC.find(s => s.id === id) || SRC[4];
const catOf = id => CAT.find(c => c.id === id) || CAT[7];
const incOf = id => INC.find(c => c.id === id) || INC[3];
const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;

/* ---------- data ---------- */
let D = load();
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {tx: Array.isArray(o.tx) ? o.tx : [], inc: Array.isArray(o.inc) ? o.inc : [], budget: +o.budget || 0, v: 1};
  } catch (e) { return {tx: [], inc: [], budget: 0, v: 1}; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(D)); return true; }
  catch (e) { toast('Penyimpanan HP penuh — ekspor & hapus data lama'); return false; }
}

const S = {tab: 'home', ym: NOW_YM(), q: '', f: 'all', range: 6, sheet: null, edit: null, inc: null, imp: null, lastDel: null};

function guessCat(m) {
  const s = ' ' + String(m || '').toLowerCase() + ' ';
  if (!s.trim()) return '';
  const key = s.trim();
  const prev = D.tx.filter(t => String(t.m || '').toLowerCase() === key && !t.review).sort((a, b) => a.t < b.t ? 1 : -1)[0];
  if (prev) return prev.cat;
  for (const k in KW) if (KW[k].some(w => s.includes(w))) return k;
  return '';
}
function guessInc(text) {
  const s = String(text || '').toLowerCase();
  if (/lembur|overtime/.test(s)) return 'lembur';
  if (/sppd|perjalanan dinas|uang dinas|dinas luar/.test(s)) return 'sppd';
  if (/gaji|payroll|salary|upah/.test(s)) return 'pokok';
  return 'lain';
}
const isTopup = s => /top ?-?up|isi saldo|isi ulang saldo/i.test(String(s || ''));

function monthData(ym) {
  const tx = D.tx.filter(t => String(t.t).slice(0, 7) === ym);
  const inc = D.inc.filter(i => String(i.t).slice(0, 7) === ym);
  const out = sum(tx), masuk = sum(inc);
  return {tx, inc, out, masuk, sisa: masuk - out};
}
const reviewCount = () => D.tx.filter(t => t.review).length + D.inc.filter(i => i.review).length;

/* ---------- native ---------- */
function pullNative() {
  if (!A) return;
  let arr = [];
  try { arr = JSON.parse(A.takePending() || '[]'); } catch (e) { arr = []; }
  let n = 0;
  arr.forEach(p => {
    if (!p || !(+p.amt > 0) || p.kind === 'topup') return;
    const t = toLocal(+p.t || Date.now());
    if (p.kind === 'in') {
      if (D.inc.some(i => i.nid === p.id)) return;
      const type = guessInc(p.raw);
      D.inc.push({id: uid(), nid: p.id, type, amt: +p.amt, t: t.slice(0, 10), note: p.m || '', to: srcOf(p.src).s, auto: 1, review: 1, raw: p.raw || '', at: Date.now()});
    } else {
      if (D.tx.some(x => x.nid === p.id)) return;
      const m = p.m || p.app || 'Tanpa nama';
      D.tx.push({id: uid(), nid: p.id, amt: +p.amt, src: p.src || 'lain', cat: guessCat(m) || 'lain', m, t, note: '', at: Date.now(), auto: 1, review: p.sure ? 0 : 1, raw: p.raw || ''});
    }
    n++;
  });
  if (n) { save(); render(); toast(n + ' transaksi otomatis tercatat'); }
}
window.nativeResume = function () { pullNative(); if (S.sheet === 'auto') renderSheet(); };
window.nativeShared = function () { handleShared(); };
window.nativeBack = function () {
  if (S.sheet) { closeSheet(); return true; }
  if (S.tab !== 'home') { S.tab = 'home'; render(); return true; }
  return false;
};
function handleShared() {
  if (!A) return;
  const text = A.takeShared();
  if (!text) return;
  let r = null;
  try { r = JSON.parse(A.parseText('', '', text)); } catch (e) { r = null; }
  if (r && r.kind === 'in') { openInc(null, {amt: r.amt, note: r.m, type: guessInc(text)}); return; }
  openTx(null, {amt: r ? r.amt : 0, m: r ? r.m : '', src: r ? r.src : 'lain', raw: text});
}

/* ---------- render utama ---------- */
function render() {
  const v = $('#view');
  if (S.tab === 'home') v.innerHTML = vHome();
  else if (S.tab === 'hist') v.innerHTML = vHist();
  else if (S.tab === 'gaji') v.innerHTML = vGaji();
  else v.innerHTML = vLap();
  document.querySelectorAll('.tabs button').forEach(b => {
    const on = b.dataset.v === S.tab;
    b.classList.toggle('on', on);
    b.classList.toggle('g', on && S.tab === 'gaji');
    b.setAttribute('aria-current', on ? 'page' : 'false');
  });
  const fabs = $('#fabs');
  if (S.tab === 'home') fabs.innerHTML = `<button class="fab o" data-act="newTx">${ICON.plus}Catat</button>`;
  else if (S.tab === 'hist') fabs.innerHTML = `<button class="fab o" data-act="newTx" aria-label="Catat pengeluaran">${ICON.plus}</button>`;
  else if (S.tab === 'gaji') fabs.innerHTML = `<button class="fab t" data-act="newInc">${ICON.plus}Tambah pemasukan</button>`;
  else fabs.innerHTML = '';
  if (!S.sheet) statusBar();
}
function statusBar() {
  if (!A || !A.setStatusBar) return;
  try {
    if (S.sheet) A.setStatusBar('#ffffff', true);
    else if (S.tab === 'home') A.setStatusBar('#4fb3e8', true);
    else if (S.tab === 'gaji') A.setStatusBar('#0b6e6a', false);
    else A.setStatusBar('#ffffff', true);
  } catch (e) { /* abaikan */ }
}
function mnav(light) {
  const next = S.ym >= NOW_YM();
  return `<div class="mnav"><button class="ib" data-act="prevM" aria-label="Bulan sebelumnya">${ICON.left}</button><b>${ymLabel(S.ym)}</b><button class="ib" data-act="nextM" aria-label="Bulan berikutnya" ${next ? 'disabled' : ''}>${ICON.right}</button></div>`;
}

/* ---------- Beranda ---------- */
function vHome() {
  const M = monthData(S.ym);
  const used = M.masuk > 0 ? M.out / M.masuk : (M.out > 0 ? 1 : 0);
  const C = 251.33, dash = Math.min(used, 1) * C;
  const over = M.sisa < 0;
  const rv = reviewCount();
  let banner = '';
  if (A) {
    const access = safe(() => A.hasNotifAccess(), false);
    banner = access
      ? `<button class="banner" data-act="auto"><span class="dot" style="background:#7fe0a8"></span><span class="t">Catat otomatis aktif${rv ? ` · <b>${rv} perlu dicek</b>` : ''}</span>${ICON.right}</button>`
      : `<button class="banner warn" data-act="auto">${ICON.bolt}<span class="t"><b>Aktifkan catat otomatis</b> — baca notifikasi Livin' & GoPay</span>${ICON.right}</button>`;
  } else if (rv) {
    banner = `<button class="banner" data-act="auto"><span class="t"><b>${rv} perlu dicek</b></span>${ICON.right}</button>`;
  }

  const incT = INC.map(c => ({c, v: sum(M.inc.filter(i => incOf(i.type).id === c.id))}));
  const incMain = incT.filter(x => x.c.id !== 'lain' || x.v > 0);
  const bySrc = SRC.map(s => ({s, v: sum(M.tx.filter(t => srcOf(t.src).id === s.id))})).filter(x => x.v > 0 || x.s.id === 'mandiri' || x.s.id === 'gopay');
  const maxSrc = Math.max(1, ...bySrc.map(x => x.v));
  const recent = M.tx.concat(M.inc.map(i => ({...i, _in: 1, t: i.t + (i.t.length === 10 ? 'T12:00' : '')}))).sort((a, b) => a.t < b.t ? 1 : -1).slice(0, 5);

  let budget = '';
  if (D.budget > 0) {
    const p = M.out / D.budget, ob = M.out > D.budget;
    budget = `<section class="sec"><div class="sec-h"><h2>Anggaran belanja</h2><span class="muted">${rp(D.budget)}/bulan</span></div>
      <div class="meter"><div class="row between" style="font-size:14px"><span>${pct(M.out, D.budget)}% terpakai</span><b>${ob ? 'Lewat ' + rp(M.out - D.budget) : 'Sisa ' + rp(D.budget - M.out)}</b></div>
      <div class="tr"><i style="width:${Math.min(p, 1) * 100}%;background:${ob ? 'var(--orange)' : 'var(--ink)'}"></i></div></div></section>`;
  }

  return `<header class="band sky">
    <div class="row between"><h1>Keuanganku</h1>${mnav()}</div>
    <div class="hero">
      <div style="display:flex;flex-direction:column;gap:2px">
        <span style="font-size:14px;font-weight:500">${over ? 'Minus bulan ini' : 'Sisa uang bulan ini'}</span>
        <span class="big">${rpS(M.sisa)}</span>
        <span style="font-size:14px">${M.masuk > 0 ? (over ? 'Pengeluaran melebihi pemasukan' : pct(M.sisa, M.masuk) + '% dari total pemasukan') : 'Belum ada pemasukan tercatat'}</span>
      </div>
      <div class="ring" role="img" aria-label="${Math.round(used * 100)} persen pemasukan terpakai">
        <svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,.45)" stroke-width="12"/><circle cx="48" cy="48" r="40" stroke="${over ? '#ff7a1a' : '#10223a'}" stroke-width="12" stroke-dasharray="${dash} ${C}" transform="rotate(-90 48 48)"/></svg>
        <div><b>${M.masuk > 0 ? Math.round(used * 100) + '%' : '–'}</b><span>terpakai</span></div>
      </div>
    </div>
    <div class="stats">
      <button class="stat" data-act="tab" data-v="gaji"><span><i class="dot" style="background:#0b6e6a"></i>Masuk</span><b>${jt(M.masuk)}</b></button>
      <button class="stat" data-act="tab" data-v="hist"><span><i class="dot" style="background:#e8650a"></i>Keluar</span><b>${jt(M.out)}</b></button>
      <div class="stat"><span><i class="dot" style="background:#10223a"></i>Sisa</span><b>${jt(M.sisa)}</b></div>
    </div>
    ${banner}
  </header>

  <section class="sec">
    <div class="sec-h"><h2>Gaji masuk</h2><button class="link" data-act="tab" data-v="gaji">Lihat rekap</button></div>
    ${M.masuk > 0 ? `<div class="stack">${incT.filter(x => x.v).map(x => `<i style="width:${x.v / M.masuk * 100}%;background:${x.c.c}"></i>`).join('')}</div>
    <div class="trio" style="grid-template-columns:repeat(${incMain.length},minmax(0,1fr))">${incMain.map(x => `<div><span>${x.c.s} · ${pct(x.v, M.masuk)}%</span><b class="num">${rp(x.v)}</b></div>`).join('')}</div>`
    : `<div class="empty">Belum ada pemasukan bulan ini. <button class="link" data-act="newInc">Tambah gaji</button></div>`}
  </section>
  ${budget}
  <section class="sec">
    <h2>Keluar per sumber</h2>
    ${bySrc.map(x => `<div class="hbar"><span class="dot" style="background:${x.s.c}"></span><span class="lab">${x.s.n}</span><span class="tr"><i style="width:${x.v / maxSrc * 100}%;background:${x.s.c}"></i></span><b>${fmt(x.v) || '0'}</b></div>`).join('')}
  </section>
  <section class="sec" style="gap:0">
    <div class="sec-h"><h2>Terbaru</h2><button class="link" data-act="tab" data-v="hist">Semua</button></div>
    ${recent.length ? recent.map(itemHTML).join('') : `<div class="empty" style="margin-top:8px">Belum ada catatan. Ketuk <b>Catat</b> setelah bayar, atau aktifkan catat otomatis.</div>`}
  </section>
  <div style="height:70px"></div>`;
}

function itemHTML(x) {
  if (x._in) {
    const c = incOf(x.type);
    const extra = x.type === 'lembur' && x.jam ? ' · ' + x.jam + ' jam' : x.type === 'sppd' && x.tujuan ? ' · ' + x.tujuan : '';
    return `<button class="it" data-act="editInc" data-id="${esc(x.id)}"><span class="dot" style="background:${c.c}"></span><span class="m"><span>${esc(x.note || c.n)}${x.review ? '<span class="badge">cek</span>' : ''}</span><small>Pemasukan · ${c.s}${esc(extra)}</small></span><b class="in">+ ${rp(x.amt)}</b></button>`;
  }
  const s = srcOf(x.src);
  return `<button class="it" data-act="editTx" data-id="${esc(x.id)}"><span class="dot" style="background:${s.c}"></span><span class="m"><span>${esc(x.m)}${x.review ? '<span class="badge">cek</span>' : x.auto ? '<span class="badge auto">oto</span>' : ''}</span><small>${s.n} · ${catOf(x.cat).n} · ${esc(String(x.t).slice(11, 16))}${x.note ? ' · ' + esc(x.note) : ''}</small></span><b>${rp(x.amt)}</b></button>`;
}

/* ---------- Riwayat ---------- */
function vHist() {
  const q = S.q.trim().toLowerCase();
  let L;
  const incAll = D.inc.map(i => ({...i, _in: 1, t: i.t.length === 10 ? i.t + 'T12:00' : i.t}));
  if (q) {
    L = D.tx.filter(t => (t.m + ' ' + (t.note || '') + ' ' + catOf(t.cat).n + ' ' + srcOf(t.src).n).toLowerCase().includes(q))
      .concat(incAll.filter(i => ((i.note || '') + ' ' + incOf(i.type).n + ' ' + (i.tujuan || '')).toLowerCase().includes(q)));
  } else {
    L = D.tx.filter(t => String(t.t).slice(0, 7) === S.ym).concat(incAll.filter(i => i.t.slice(0, 7) === S.ym));
  }
  if (S.f === 'in') L = L.filter(x => x._in);
  else if (S.f === 'review') L = L.filter(x => x.review);
  else if (S.f !== 'all') L = L.filter(x => !x._in && srcOf(x.src).id === S.f);
  L.sort((a, b) => a.t < b.t ? 1 : -1);

  const chips = [{id: 'all', n: 'Semua'}].concat(SRC.map(s => ({id: s.id, n: s.s, c: s.c})), [{id: 'in', n: 'Pemasukan'}, {id: 'review', n: 'Perlu dicek'}]);
  let list = '';
  if (!L.length) {
    list = `<div class="empty" style="margin-top:12px">${q ? 'Tidak ada yang cocok dengan “' + esc(S.q) + '”.' : D.tx.length || D.inc.length ? 'Tidak ada catatan untuk pilihan ini.' : 'Belum ada catatan. Punya data lama? Ketuk <b>Impor data lama</b> di atas.'}</div>`;
  } else {
    const groups = {};
    L.slice(0, 600).forEach(x => { const d = x.t.slice(0, 10); (groups[d] = groups[d] || []).push(x); });
    const yNow = new Date().getFullYear();
    for (const d in groups) {
      const [y, m, dd] = d.split('-').map(Number), dt = new Date(y, m - 1, dd);
      const g = groups[d], o = sum(g.filter(x => !x._in)), i = sum(g.filter(x => x._in));
      list += `<div class="day"><span>${HARI[dt.getDay()]}, ${dd} ${BULAN[m - 1].slice(0, 3)}${y !== yNow ? ' ' + y : ''}</span><span class="num">${i ? '+ ' + rp(i) + (o ? ' · ' : '') : ''}${o ? '− ' + rp(o) : ''}</span></div>` + g.map(itemHTML).join('');
    }
    if (L.length > 600) list += `<p class="muted">Menampilkan 600 dari ${L.length}. Persempit dengan pencarian.</p>`;
  }
  return `<header class="band plain">
    <div class="row between"><h1>Riwayat</h1><button class="pill" data-act="import">${ICON.dl}Impor data lama</button></div>
    ${q ? '' : `<div class="row between">${mnav()}<span class="muted">${L.length} catatan</span></div>`}
    <label class="search">${ICON.search}<input type="search" id="q" placeholder="Cari di semua bulan" value="${esc(S.q)}" aria-label="Cari"></label>
    <div class="chips">${chips.map(c => `<button class="chip" data-act="filter" data-v="${c.id}" aria-pressed="${S.f === c.id}">${c.c ? `<i class="dot" style="background:${c.c}"></i>` : ''}${c.n}</button>`).join('')}</div>
  </header>
  <section style="padding:0 20px">${list}</section><div style="height:70px"></div>`;
}

/* ---------- Gaji ---------- */
function vGaji() {
  const M = monthData(S.ym);
  const rows = INC.map(c => {
    const l = M.inc.filter(i => incOf(i.type).id === c.id);
    let sub = l.length + ' entri';
    if (c.id === 'lembur') { const j = sum(l, i => i.jam); if (j) sub += ' · ' + j + ' jam'; }
    if (c.id === 'sppd') { const h = sum(l, i => i.hari); sub = l.length + ' perjalanan' + (h ? ' · ' + h + ' hari' : ''); }
    if (c.id === 'pokok' && l.length) sub = 'Masuk ' + +l[0].t.slice(8, 10) + ' ' + BULAN[+l[0].t.slice(5, 7) - 1].slice(0, 3) + (l.length > 1 ? ' · ' + l.length + ' entri' : '');
    return {c, l, v: sum(l), sub};
  });
  const hist = [];
  for (let k = 5; k >= 0; k--) { const ym = ymAdd(S.ym, -k); const d = monthData(ym); hist.push({ym, ...d}); }
  const entries = M.inc.slice().sort((a, b) => a.t < b.t ? 1 : -1);
  const bar = (label, v, p, color) => `<div class="meter"><div class="row between" style="font-size:14px"><span>${label}</span><b class="num">${rpS(v)} · ${p}%</b></div><div class="tr"><i style="width:${Math.max(0, Math.min(p, 100))}%;background:${color}"></i></div></div>`;

  return `<header class="band teal">
    <div class="row between"><h1>Rekap gaji</h1>${mnav()}</div>
    <div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:14px">Total pemasukan</span><span class="big">${rp(M.masuk)}</span></div>
    <div class="stack" style="background:rgba(255,255,255,.2)">${M.masuk ? rows.filter(r => r.v).map(r => `<i style="width:${r.v / M.masuk * 100}%;background:${r.c.id === 'pokok' ? '#ffffff' : r.c.id === 'lembur' ? '#9ad6cf' : r.c.id === 'sppd' ? '#f2c14e' : '#c9d3dc'}"></i>`).join('') : ''}</div>
  </header>
  <section class="sec" style="gap:8px">
    ${rows.filter(r => r.c.id !== 'lain' || r.v).map(r => `<button class="card" data-act="newInc" data-v="${r.c.id}"><span class="bar" style="background:${r.c.c}"></span><span class="m"><b>${r.c.n}</b><span class="muted">${r.sub}</span></span><span class="r"><b class="num">${rp(r.v)}</b><span class="muted">${pct(r.v, M.masuk)}%</span></span></button>`).join('')}
  </section>
  <section class="sec">
    <h2>Masuk vs keluar</h2>
    ${bar('Masuk', M.masuk, M.masuk ? 100 : 0, 'var(--teal)')}
    ${bar('Keluar', M.out, pct(M.out, M.masuk), 'var(--keluar)')}
    ${bar('Sisa', M.sisa, pct(M.sisa, M.masuk), 'var(--ink)')}
  </section>
  <section class="sec" style="gap:0">
    <h2 style="margin-bottom:4px">Pemasukan ${BULAN[+S.ym.slice(5, 7) - 1]}</h2>
    ${entries.length ? entries.map(i => itemHTML({...i, _in: 1})).join('') : `<div class="empty" style="margin-top:6px">Belum ada. Ketuk <b>Tambah pemasukan</b> untuk mencatat gaji pokok, lembur, atau SPPD.</div>`}
  </section>
  <section class="sec">
    <h2>6 bulan terakhir</h2>
    <div class="tbl"><span class="h">Bulan</span><span class="h r">Masuk</span><span class="h r">Keluar</span><span class="h r">Sisa</span>
    ${hist.map(h => `<span${h.ym === S.ym ? ' style="font-weight:600"' : ''}>${ymShort(h.ym)} ${h.ym.slice(2, 4)}</span><span class="r">${jt(h.masuk)}</span><span class="r">${jt(h.out)}</span><b class="r" style="color:${h.sisa < 0 ? 'var(--keluar)' : h.ym === S.ym ? 'var(--teal)' : 'inherit'}">${h.masuk ? pct(h.sisa, h.masuk) + '%' : '–'}</b>`).join('')}</div>
  </section>
  <div style="height:80px"></div>`;
}

/* ---------- Laporan ---------- */
function vLap() {
  const n = S.range;
  const months = [];
  for (let k = n - 1; k >= 0; k--) months.push(ymAdd(S.ym, -k));
  const data = months.map(ym => ({ym, ...monthData(ym)}));
  const mx = Math.max(1, ...data.map(d => Math.max(d.masuk, d.out)));
  const tM = sum(data, d => d.masuk), tO = sum(data, d => d.out);
  const M = data[data.length - 1];
  const byCat = CAT.map(c => ({c, l: M.tx.filter(t => catOf(t.cat).id === c.id)})).map(x => ({...x, v: sum(x.l)})).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const cm = byCat.length ? byCat[0].v : 1;
  const grid = `grid-template-columns:repeat(${n},minmax(0,1fr))`;
  const ver = A && A.version ? safe(() => A.version(), '') : '';

  return `<header class="band plain">
    <div class="row between"><h1>Laporan</h1><div class="seg"><button data-act="range" data-v="6" aria-pressed="${n === 6}">6 bln</button><button data-act="range" data-v="12" aria-pressed="${n === 12}">12 bln</button></div></div>
  </header>
  <section class="sec" style="padding-top:4px">
    <p style="margin:0">${tM > 0 ? `Rata-rata kamu menyisihkan <b>${pct(tM - tO, tM)}%</b> pemasukan per bulan (${ymShort(months[0])} ${months[0].slice(0, 4)} – ${ymShort(S.ym)} ${S.ym.slice(0, 4)}).` : 'Tambahkan pemasukan supaya persentase sisa bisa dihitung.'}</p>
    <div class="legend"><span><i style="background:var(--teal)"></i>Masuk</span><span><i style="background:#ff9a4d"></i>Keluar</span></div>
    <div class="pairs" style="${grid}" role="img" aria-label="Pemasukan dan pengeluaran per bulan">
      ${data.map(d => `<button class="p${d.ym === S.ym ? ' sel' : ''}" data-act="pickM" data-v="${d.ym}" aria-label="${ymLabel(d.ym)}"><i style="height:${d.masuk / mx * 100}%;background:var(--teal)"></i><i style="height:${d.out / mx * 100}%;background:${d.ym === S.ym ? 'var(--orange)' : '#ff9a4d'}"></i></button>`).join('')}
    </div>
    <div class="plab" style="${grid}">${data.map(d => `<span class="${d.ym === S.ym ? 'sel' : ''}">${ymShort(d.ym)}<br>${d.masuk ? pct(d.sisa, d.masuk) + '%' : '–'}</span>`).join('')}</div>
  </section>
  <section class="sec">
    <div class="sec-h"><h2>Keluar per kategori</h2><span class="muted">${ymLabel(S.ym)} · ${rp(M.out)}</span></div>
    ${byCat.length ? byCat.map(x => `<div class="hbar"><span class="lab">${x.c.n}</span><span class="tr"><i style="width:${x.v / cm * 100}%;background:var(--ink)"></i></span><b>${jt(x.v)}</b></div>`).join('') : '<div class="empty">Belum ada pengeluaran bulan ini.</div>'}
  </section>
  <section class="sec">
    <h2>Ekspor &amp; cadangan</h2>
    <div class="btnrow">
      <button class="ghost" data-act="xlsx">Ekspor Excel</button>
      <button class="ghost" data-act="pdf">Laporan PDF</button>
      <button class="ghost" data-act="backup">Cadangkan data</button>
      <button class="ghost" data-act="restore">Pulihkan cadangan</button>
    </div>
    <p class="muted" style="margin:0">Excel berisi semua pengeluaran, pemasukan, dan rekap bulanan. Cadangan (.json) dipakai untuk memindahkan data ke HP baru.</p>
  </section>
  <section class="sec">
    <h2>Anggaran belanja per bulan</h2>
    <div class="fld"><input id="budget" inputmode="numeric" class="money" placeholder="Misal 5.000.000" value="${fmt(D.budget)}" aria-label="Anggaran per bulan"></div>
  </section>
  <section class="sec">
    <button class="ghost" data-act="auto">Pengaturan catat otomatis</button>
    <p class="muted" style="margin:0">Keuanganku ${esc(ver)} · Data hanya tersimpan di HP ini. Aplikasi tidak punya akses internet. ${D.tx.length} pengeluaran, ${D.inc.length} pemasukan tersimpan.</p>
  </section>
  <div style="height:24px"></div>`;
}

/* ---------- sheet ---------- */
function openSheet(name) { S.sheet = name; renderSheet(); $('#sheet').hidden = false; $('#sheet').scrollTop = 0; document.body.style.overflow = 'hidden'; statusBar(); }
function closeSheet() { S.sheet = null; $('#sheet').hidden = true; document.body.style.overflow = ''; render(); }
function renderSheet() {
  const b = $('#sheetBody');
  if (S.sheet === 'tx') b.innerHTML = shTx();
  else if (S.sheet === 'inc') b.innerHTML = shInc();
  else if (S.sheet === 'import') b.innerHTML = shImport();
  else if (S.sheet === 'auto') b.innerHTML = shAuto();
}
const shHead = (title, extra) => `<div class="sh-h"><button class="ib flat" data-act="close" aria-label="Tutup">${ICON.close}</button><h1>${title}</h1>${extra || ''}</div>`;

/* Catat / ubah pengeluaran */
function openTx(tx, preset) {
  const last = D.tx.slice().sort((a, b) => (a.at || 0) < (b.at || 0) ? 1 : -1)[0];
  S.edit = tx ? {...tx} : {id: null, amt: (preset && preset.amt) || 0, src: (preset && preset.src && preset.src !== 'lain' ? preset.src : null) || (last ? last.src : 'mandiri'), cat: '', m: (preset && preset.m) || '', t: nowLocal(), note: '', raw: (preset && preset.raw) || ''};
  if (!tx && S.edit.m) S.edit.cat = guessCat(S.edit.m);
  openSheet('tx');
  if (!tx && !S.edit.amt) setTimeout(() => { const el = $('#fAmt'); if (el) el.focus(); }, 80);
}
function shTx() {
  const e = S.edit;
  return `${shHead(e.id ? 'Ubah pengeluaran' : 'Catat pengeluaran')}
  <form class="sh-b" id="fTx" autocomplete="off">
    ${e.review ? '<div class="note warn">Tercatat otomatis tapi belum yakin. Cek nominal, merchant, dan kategorinya, lalu simpan.</div>' : ''}
    <label class="fld"><span class="lbl">Nominal</span><span class="amtbox"><span>Rp</span><input id="fAmt" class="amt-in money" inputmode="numeric" placeholder="0" value="${fmt(e.amt)}"></span></label>
    <div><span class="lbl">Bayar pakai</span><div class="chips wrap">${SRC.map(s => `<button type="button" class="chip" data-act="pickSrc" data-v="${s.id}" aria-pressed="${e.src === s.id}"><i class="dot" style="background:${s.c}"></i>${s.n}</button>`).join('')}</div></div>
    <label class="fld"><span class="lbl">Merchant / penerima</span><input id="fM" list="mlist" value="${esc(e.m)}" placeholder="Misal Indomaret, Warung Bu Sri"></label>
    <datalist id="mlist">${[...new Set(D.tx.map(t => t.m))].slice(-300).map(m => `<option value="${esc(m)}">`).join('')}</datalist>
    <div><span class="lbl">Kategori</span><div class="chips wrap">${CAT.map(c => `<button type="button" class="chip" data-act="pickCat" data-v="${c.id}" aria-pressed="${e.cat === c.id}">${c.n}</button>`).join('')}</div></div>
    <div class="two">
      <label class="fld"><span class="lbl">Waktu</span><input id="fT" type="datetime-local" value="${esc(String(e.t).slice(0, 16))}"></label>
      <label class="fld"><span class="lbl">Catatan</span><input id="fN" value="${esc(e.note || '')}" placeholder="Opsional"></label>
    </div>
    ${e.raw ? `<div><span class="lbl">Teks notifikasi asli</span><div class="raw">${esc(e.raw)}</div></div>` : ''}
    <p class="err" id="fErr"></p>
  </form>
  <div class="sh-f">${e.id ? '<button class="sec-btn" data-act="delTx" style="color:#c2410c">Hapus</button>' : '<button class="sec-btn" data-act="close">Batal</button>'}<button class="primary" data-act="saveTx">Simpan</button></div>`;
}
function readTxForm() {
  const e = S.edit;
  e.amt = num($('#fAmt').value); e.m = $('#fM').value.trim(); e.t = $('#fT').value || nowLocal(); e.note = $('#fN').value.trim();
}
function saveTx() {
  readTxForm();
  const e = S.edit;
  if (!e.amt) { $('#fErr').textContent = 'Isi nominalnya dulu.'; $('#fAmt').focus(); return; }
  const m = e.m || 'Tanpa nama';
  const rec = {id: e.id || uid(), amt: e.amt, src: e.src || 'lain', cat: e.cat || guessCat(m) || 'lain', m, t: String(e.t).slice(0, 16), note: e.note, at: e.at || Date.now()};
  if (e.nid) rec.nid = e.nid;
  if (e.auto) rec.auto = 1;
  if (e.raw) rec.raw = e.raw;
  const i = D.tx.findIndex(x => x.id === rec.id);
  if (i >= 0) D.tx[i] = rec; else D.tx.push(rec);
  if (save()) {
    const ymNew = rec.t.slice(0, 7);
    if (ymNew <= NOW_YM()) S.ym = ymNew;
    closeSheet(); toast(e.id ? 'Perubahan tersimpan' : 'Tercatat ' + rp(rec.amt));
  }
}

/* Tambah / ubah pemasukan */
function openInc(rec, preset) {
  const p = preset || {};
  S.inc = rec ? {...rec} : {id: null, type: p.type || 'pokok', amt: p.amt || 0, t: nowLocal().slice(0, 10), to: '', note: p.note || '', jam: '', tujuan: '', hari: ''};
  openSheet('inc');
}
function shInc() {
  const e = S.inc;
  const M = monthData(String(e.t).slice(0, 7) || S.ym);
  const old = e.id ? (D.inc.find(i => i.id === e.id) || {}).amt || 0 : 0;
  const after = M.masuk - old + (num(e.amt) || 0);
  return `${shHead(e.id ? 'Ubah pemasukan' : 'Tambah pemasukan')}
  <form class="sh-b" id="fInc" autocomplete="off">
    ${e.review ? '<div class="note warn">Uang masuk ini terbaca dari notifikasi. Pilih jenisnya (Pokok, Lembur, SPPD), lalu simpan.</div>' : ''}
    <div><span class="lbl">Jenis</span><div class="chips wrap">${INC.map(c => `<button type="button" class="chip" data-act="pickInc" data-v="${c.id}" aria-pressed="${e.type === c.id}" style="${e.type === c.id ? 'background:var(--teal);border-color:var(--teal)' : ''}">${c.id === 'lain' ? 'Lainnya' : c.s}</button>`).join('')}</div></div>
    <label class="fld"><span class="lbl">Nominal</span><span class="amtbox t"><span>Rp</span><input id="iAmt" class="amt-in money" inputmode="numeric" placeholder="0" value="${fmt(e.amt)}"></span></label>
    ${e.type === 'lembur' ? `<label class="fld"><span class="lbl">Jumlah jam lembur</span><input id="iJam" inputmode="decimal" value="${esc(e.jam || '')}" placeholder="Misal 6"></label>` : ''}
    ${e.type === 'sppd' ? `<div class="two"><label class="fld"><span class="lbl">Tujuan dinas</span><input id="iTuj" value="${esc(e.tujuan || '')}" placeholder="Misal Samarinda"></label><label class="fld"><span class="lbl">Lama (hari)</span><input id="iHari" inputmode="numeric" value="${esc(e.hari || '')}"></label></div>` : ''}
    <div class="two">
      <label class="fld"><span class="lbl">Tanggal masuk</span><input id="iT" type="date" value="${esc(String(e.t).slice(0, 10))}"></label>
      <label class="fld"><span class="lbl">Masuk ke</span><input id="iTo" value="${esc(e.to || '')}" placeholder="Misal Rekening Mandiri"></label>
    </div>
    <label class="fld"><span class="lbl">Keterangan</span><input id="iNote" value="${esc(e.note || '')}" placeholder="Opsional"></label>
    ${e.raw ? `<div><span class="lbl">Teks notifikasi asli</span><div class="raw">${esc(e.raw)}</div></div>` : ''}
    <div class="note" id="iAfter">Setelah disimpan, total pemasukan ${BULAN[+String(e.t).slice(5, 7) - 1] || ''} jadi <b>${rp(after)}</b></div>
    <p class="err" id="iErr"></p>
  </form>
  <div class="sh-f">${e.id ? '<button class="sec-btn" data-act="delInc" style="color:#c2410c">Hapus</button>' : '<button class="sec-btn" data-act="close">Batal</button>'}<button class="primary t" data-act="saveInc">Simpan</button></div>`;
}
function readIncForm() {
  const e = S.inc;
  e.amt = num($('#iAmt').value); e.t = $('#iT').value || nowLocal().slice(0, 10); e.to = $('#iTo').value.trim(); e.note = $('#iNote').value.trim();
  if ($('#iJam')) e.jam = $('#iJam').value.replace(',', '.').trim();
  if ($('#iTuj')) e.tujuan = $('#iTuj').value.trim();
  if ($('#iHari')) e.hari = $('#iHari').value.trim();
}
function saveInc() {
  readIncForm();
  const e = S.inc;
  if (!e.amt) { $('#iErr').textContent = 'Isi nominalnya dulu.'; $('#iAmt').focus(); return; }
  const rec = {id: e.id || uid(), type: e.type, amt: e.amt, t: e.t, to: e.to, note: e.note, at: e.at || Date.now()};
  if (e.type === 'lembur' && e.jam) rec.jam = +e.jam || 0;
  if (e.type === 'sppd') { if (e.tujuan) rec.tujuan = e.tujuan; if (e.hari) rec.hari = +e.hari || 0; }
  if (e.nid) rec.nid = e.nid;
  if (e.auto) rec.auto = 1;
  if (e.raw) rec.raw = e.raw;
  const i = D.inc.findIndex(x => x.id === rec.id);
  if (i >= 0) D.inc[i] = rec; else D.inc.push(rec);
  if (save()) {
    if (rec.t.slice(0, 7) <= NOW_YM()) S.ym = rec.t.slice(0, 7);
    closeSheet(); toast(incOf(rec.type).n + ' ' + rp(rec.amt) + ' tersimpan');
  }
}

/* ---------- catat otomatis ---------- */
function shAuto() {
  const access = A ? safe(() => A.hasNotifAccess(), false) : false;
  let cfg = {enabled: true, pkgs: ['id.bmri.livin', 'com.gojek.gopay', 'com.gojek.app']}, det = {}, log = [];
  if (A) {
    cfg = safe(() => JSON.parse(A.getConfig()), cfg);
    det = safe(() => JSON.parse(A.detected()), {});
    log = safe(() => JSON.parse(A.readLog()), []);
  }
  const known = [
    {p: 'id.bmri.livin', n: "Livin' by Mandiri", c: '#1d4f9a', d: 'QRIS, transfer, uang masuk'},
    {p: 'com.gojek.gopay', n: 'GoPay', c: '#11a058', d: 'Aplikasi GoPay'},
    {p: 'com.gojek.app', n: 'Gojek', c: '#11a058', d: 'Pembayaran GoPay di aplikasi Gojek'}
  ];
  const others = Object.keys(det).filter(p => !known.some(k => k.p === p)).map(p => ({p, n: det[p].label || p, c: '#8a98a8', d: det[p].count + ' notifikasi bernominal'}));
  const apps = known.concat(others);
  const pk = cfg.pkgs || [];
  const rv = D.tx.filter(t => t.review).map(t => ({...t})).concat(D.inc.filter(i => i.review).map(i => ({...i, _in: 1, t: i.t + 'T12:00'}))).sort((a, b) => a.t < b.t ? 1 : -1);
  const monthAuto = D.tx.filter(t => t.auto && String(t.t).slice(0, 7) === NOW_YM()).length;

  return `${shHead('Catat otomatis')}
  <div class="sh-b">
    ${!A ? '<div class="note warn">Fitur ini hanya bekerja di aplikasi Android.</div>' :
      access ? `<div class="note blue"><b>Aktif.</b> Setiap notifikasi pembayaran dari aplikasi yang dinyalakan di bawah langsung tercatat. ${monthAuto} transaksi tercatat otomatis bulan ini.</div>`
      : `<div class="note warn"><b>Belum aktif.</b> Izinkan Keuanganku membaca notifikasi supaya pembayaran Livin' & GoPay tercatat sendiri. Teks notifikasi hanya dibaca di HP ini — aplikasi tidak punya akses internet.</div>
         <button class="primary" data-act="openNotif" style="flex:none">Buka pengaturan akses notifikasi</button>`}
    ${A ? `<div>
      <label class="switch"><span class="m"><b>Catat otomatis</b><span class="muted">Matikan sementara tanpa mencabut izin</span></span><input type="checkbox" data-act="cfgOn" ${cfg.enabled !== false ? 'checked' : ''} aria-label="Catat otomatis"></label>
      ${apps.map(a => `<label class="switch"><span class="dot" style="background:${a.c}"></span><span class="m"><b>${esc(a.n)}</b><span class="muted">${esc(a.d)}</span></span><input type="checkbox" data-act="cfgPkg" data-v="${esc(a.p)}" ${pk.includes(a.p) ? 'checked' : ''} aria-label="${esc(a.n)}"></label>`).join('')}
    </div>` : ''}
    <div>
      <div class="sec-h"><h2>Perlu dicek</h2><span class="muted">${rv.length} catatan</span></div>
      ${rv.length ? rv.slice(0, 60).map(itemHTML).join('') + (rv.length > 1 ? `<button class="ghost" data-act="okAll" style="width:100%;margin-top:10px">Tandai semua sudah benar</button>` : '') : '<div class="empty" style="margin-top:8px">Semua sudah rapi.</div>'}
    </div>
    <div class="note">Uang masuk dari notifikasi selalu masuk ke sini dulu supaya kamu bisa menandai Gaji pokok, Lembur, atau SPPD. Top up GoPay tidak dihitung sebagai pengeluaran supaya tidak dobel.</div>
    ${A ? `<details><summary>Notifikasi terakhir yang dibaca (${log.length})</summary>
      <p class="muted">Kalau ada pembayaran yang tidak terbaca dengan benar, salin teksnya di sini supaya pembacanya bisa diperbaiki.</p>
      ${log.length ? log.map(l => `<div class="raw" style="margin-top:8px"><b>${esc(l.app)}</b> · ${esc(toLocal(l.t).replace('T', ' '))}<br>${esc(l.title)}${l.title ? '<br>' : ''}${esc(l.text)}<br><span style="color:${l.ok ? '#0b6e6a' : '#c2410c'}">${l.ok ? '→ ' + (l.kind === 'in' ? 'masuk' : l.kind === 'topup' ? 'top up (dilewati)' : 'keluar') + ' ' + rp(l.amt) + (l.m ? ' · ' + esc(l.m) : '') : '→ tidak terbaca'}</span></div>`).join('') : '<p class="muted">Belum ada.</p>'}
      ${log.length ? '<button class="ghost" data-act="clearLog" style="margin-top:10px">Hapus log</button>' : ''}
    </details>
    <details><summary>Uji pembaca notifikasi</summary>
      <div class="fld" style="margin-top:8px"><textarea id="testTxt" placeholder="Tempel teks notifikasi, misal: Pembayaran QRIS Rp25.000 ke KOPI JANJI JIWA berhasil"></textarea></div>
      <button class="ghost" data-act="testParse" style="margin-top:8px">Uji</button>
      <div id="testOut" class="muted" style="margin-top:8px"></div>
    </details>` : ''}
  </div><div style="height:24px"></div>`;
}
function setCfg(mut) {
  if (!A) return;
  const cfg = safe(() => JSON.parse(A.getConfig()), {enabled: true, pkgs: []});
  mut(cfg);
  A.setConfig(JSON.stringify(cfg));
}

/* ---------- impor ---------- */
function openImport() { S.imp = {step: 'pick', files: [], rows: [], msg: '', opts: {inc: true, topup: false}}; openSheet('import'); }
function shImport() {
  const I = S.imp;
  let body = '';
  const fileList = I.files.map(f => `<div class="file"><span class="ftype ${f.kind === 'pdf' ? 'pdf' : ''}">${f.kind === 'pdf' ? 'PDF' : f.ext.toUpperCase()}</span><span style="flex:1;display:flex;flex-direction:column;overflow:hidden"><b style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</b><span class="muted">${esc(f.info || '')}</span></span></div>`).join('');
  if (I.step === 'pick' || I.step === 'busy') {
    body = `<p class="muted" style="margin:0">Pilih file Excel (.xlsx/.xls), CSV, atau PDF e-statement Mandiri / riwayat GoPay. Bisa beberapa file sekaligus, termasuk data 1–2 tahun ke belakang.</p>
      ${fileList}
      <button class="drop" data-act="pickFiles" ${I.step === 'busy' ? 'disabled' : ''}>${I.step === 'busy' ? 'Membaca file…' : '+ Pilih file'}</button>
      ${I.msg ? `<div class="note warn">${esc(I.msg)}</div>` : ''}
      <div class="note blue"><b>Belum punya file?</b> Unduh template Excel, isi data lamamu (di HP atau laptop), lalu impor di sini. Excel lama milikmu sendiri atau e-statement juga bisa — kolom tanggal, keterangan, dan nominal dikenali otomatis.</div>
      <button class="ghost" data-act="template">Unduh template Excel</button>`;
    return `${shHead('Impor data lama')}<div class="sh-b">${body}</div><div style="height:24px"></div>`;
  }
  if (I.step === 'done') {
    return `${shHead('Impor selesai')}<div class="sh-b"><div class="note"><b>${I.done.tx}</b> pengeluaran dan <b>${I.done.inc}</b> pemasukan berhasil diimpor.${I.done.skip ? ' ' + I.done.skip + ' baris dilewati karena sudah ada.' : ''}</div>
      <button class="primary" data-act="close" style="flex:none">Lihat laporan</button></div>`;
  }
  // preview
  const rows = I.rows;
  const on = rows.filter(r => r.on && !r.dup);
  const nOut = on.filter(r => r.kind === 'out').length, nIn = on.filter(r => r.kind === 'in').length;
  const nDup = rows.filter(r => r.dup).length, nTop = rows.filter(r => r.topup).length;
  const toImport = on.filter(r => r.kind === 'out' || I.opts.inc).length;
  const dates = rows.map(r => r.t).filter(Boolean).sort();
  const range = dates.length ? `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])}` : '';
  const mapUI = I.files.map((sheetFile, fi) => !(sheetFile.kind === 'sheet' && sheetFile.headers) ? '' : `<details ${I.mapOpen === fi ? 'open' : ''}><summary>Kolom ${esc(sheetFile.name)}</summary><div class="maps" style="margin-top:8px">
      ${[['date', 'Tanggal'], ['time', 'Jam'], ['desc', 'Keterangan'], ['debit', 'Keluar / Debet'], ['credit', 'Masuk / Kredit'], ['amount', 'Nominal'], ['cat', 'Kategori'], ['src', 'Sumber']].map(([k, l]) => `<label class="fld"><span class="lbl">${l}</span><select data-map="${k}" data-file="${fi}"><option value="-1">—</option>${sheetFile.headers.map((h, i) => `<option value="${i}" ${sheetFile.map[k] === i ? 'selected' : ''}>${esc(h || 'Kolom ' + (i + 1))}</option>`).join('')}</select></label>`).join('')}
    </div></details>`).join('');
  const shown = rows.slice(0, 80);
  body = `${fileList}
    <div class="sum">
      <div><span>Periode</span><b>${range || '–'}</b></div>
      <div><span>Pengeluaran</span><b>${nOut}</b></div>
      <div><span>Pemasukan</span><b>${nIn}</b></div>
      ${nDup ? `<div style="color:var(--warn)"><span>Sudah ada di aplikasi · dilewati</span><b>${nDup}</b></div>` : ''}
      ${nTop ? `<div style="color:var(--warn)"><span>Top up / isi saldo · tidak dicentang</span><b>${nTop}</b></div>` : ''}
    </div>
    <div class="two">
      <label class="fld"><span class="lbl">Sumber pengeluaran</span><select data-act="impSrc">${SRC.map(s => `<option value="${s.id}" ${I.src === s.id ? 'selected' : ''}>${s.n}</option>`).join('')}</select></label>
      <label class="switch" style="border:0;padding:20px 0 0"><span class="m"><span style="font-size:14px">Impor pemasukan</span></span><input type="checkbox" data-act="impInc" ${I.opts.inc ? 'checked' : ''} aria-label="Impor pemasukan"></label>
    </div>
    ${mapUI}
    <div>
      <div class="sec-h"><h2>Pratinjau</h2><span class="muted">${shown.length < rows.length ? shown.length + ' dari ' + rows.length + ' baris' : rows.length + ' baris'}</span></div>
      <p class="muted" style="margin:4px 0 0">Ketuk “Keluar/Masuk” untuk membalik arah transaksi.</p>
      ${shown.map((r, i) => `<div class="irow"><input type="checkbox" data-act="impOn" data-i="${i}" ${r.on && !r.dup ? 'checked' : ''} ${r.dup ? 'disabled' : ''} aria-label="Impor baris ini"><span class="m"><span>${esc(r.m || '(tanpa keterangan)')}</span><small>${r.t ? fmtDate(r.t) : 'tanggal?'}${r.dup ? ' · sudah ada' : r.topup ? ' · top up' : ''}${r.kind === 'in' ? ' · ' + incOf(r.type).s : r.cat ? ' · ' + catOf(r.cat).n : ''}</small></span><button class="kind ${r.kind === 'in' ? 'in' : ''}" data-act="impKind" data-i="${i}">${r.kind === 'in' ? 'Masuk' : 'Keluar'}</button><b class="num" style="font-size:14px">${fmt(r.amt)}</b></div>`).join('')}
    </div>
    <button class="ghost" data-act="pickFiles">+ Tambah file lain</button>`;
  return `${shHead('Impor data lama')}<div class="sh-b">${body}</div>
    <div class="sh-f"><button class="sec-btn" data-act="close">Batal</button><button class="primary" data-act="doImport" ${toImport ? '' : 'disabled'}>Impor ${toImport.toLocaleString('id-ID')} transaksi</button></div>`;
}
const fmtDate = t => { const [y, m, d] = t.slice(0, 10).split('-').map(Number); return d + ' ' + BULAN[m - 1].slice(0, 3) + ' ' + y; };

function parseDate(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date && !isNaN(v)) return toLocal(v.getTime());
  if (typeof v === 'number') {
    if (v > 20000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 86400000)); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
    if (v > 1e11) return toLocal(v);
    return '';
  }
  const s = String(v).trim().toLowerCase();
  let m, y, mo, d, hh = 12, mi = 0;
  const tm = s.match(/(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(am|pm)?\s*(wib|wita|wit)?$/);
  if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/))) { d = +m[1]; mo = +m[2]; y = +m[3]; if (mo > 12 && d <= 12) { const x = d; d = mo; mo = x; } }
  else if ((m = s.match(/^(\d{1,2})[\s\-\/.]*([a-z]{3,9})[\s\-\/.,]*(\d{2,4})?/)) && MON[m[2].slice(0, 3)]) { d = +m[1]; mo = MON[m[2].slice(0, 3)]; y = m[3] ? +m[3] : 0; }
  else if ((m = s.match(/^([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/)) && MON[m[1].slice(0, 3)]) { mo = MON[m[1].slice(0, 3)]; d = +m[2]; y = +m[3]; }
  else return '';
  if (!y) y = new Date().getFullYear();
  if (y < 100) y += 2000;
  if (tm && s.length > 8) { hh = +tm[1]; mi = +tm[2]; if (tm[3] === 'pm' && hh < 12) hh += 12; if (tm[3] === 'am' && hh === 12) hh = 0; }
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y > 1990 && y < 2100)) return '';
  return y + '-' + pad(mo) + '-' + pad(d) + 'T' + pad(Math.min(hh, 23)) + ':' + pad(Math.min(mi, 59));
}
function parseAmt(v) {
  if (v == null || v === '') return {v: 0, neg: false};
  if (typeof v === 'number') return {v: Math.abs(Math.round(v)), neg: v < 0};
  let s = String(v).trim();
  const neg = /^-|^\(.*\)$|-$|\bdb\b|\bdr\b/i.test(s);
  s = s.replace(/rp\.?|idr|\s|[()+\-]|cr|db|dr/gi, '');
  if (!/\d/.test(s)) return {v: 0, neg};
  const lastDot = s.lastIndexOf('.'), lastCom = s.lastIndexOf(',');
  let intPart = s;
  if (lastDot >= 0 && lastCom >= 0) intPart = s.slice(0, Math.max(lastDot, lastCom));
  else if (lastDot >= 0 || lastCom >= 0) { const p = Math.max(lastDot, lastCom); const tail = s.slice(p + 1); if (tail.length <= 2) intPart = s.slice(0, p); }
  const n = +intPart.replace(/\D/g, '');
  return {v: n || 0, neg};
}
function autoMap(headers) {
  const map = {date: -1, time: -1, desc: -1, debit: -1, credit: -1, amount: -1, cat: -1, src: -1, type: -1, jam: -1, tujuan: -1, hari: -1, to: -1};
  const tests = [
    ['type', /^(jenis|jenis pemasukan|tipe|type)$/],
    ['jam', /jam lembur/],
    ['tujuan', /tujuan/],
    ['hari', /lama.*hari|^hari$|lama sppd/],
    ['to', /^masuk ke$/],
    ['date', /^(tanggal|tgl|date|tanggal transaksi|transaction date|posting date|tgl\.? transaksi|waktu transaksi|waktu|tanggal & waktu)/],
    ['time', /^(jam|time|pukul)$/],
    ['debit', /(debet|debit|keluar|pengeluaran|withdraw|dana keluar|uang keluar)/],
    ['credit', /(kredit|credit|masuk|pemasukan|deposit|dana masuk|uang masuk)/],
    ['amount', /(nominal|jumlah|amount|total|harga|biaya|mutasi|nilai)/],
    ['cat', /(kategori|category)/],
    ['src', /(sumber|metode|source|via|dompet|akun|rekening)/],
    ['desc', /(keterangan|deskripsi|description|uraian|remark|merchant|nama|catatan|detail|transaksi|toko|penerima)/]
  ];
  headers.forEach((h, i) => {
    const s = String(h || '').toLowerCase().trim();
    if (!s) return;
    for (const [k, re] of tests) { if (map[k] === -1 && re.test(s)) { map[k] = i; break; } }
  });
  return map;
}
function rowsFromSheet(f, src) {
  const out = [];
  const mp = f.map;
  f.data.forEach(r => {
    const dRaw = mp.date >= 0 ? r[mp.date] : '';
    let t = parseDate(dRaw);
    if (!t) return;
    if (mp.time >= 0 && r[mp.time] != null && r[mp.time] !== '') {
      const tv = r[mp.time];
      if (typeof tv === 'number' && tv < 1) { const mins = Math.round(tv * 1440); t = t.slice(0, 11) + pad(Math.floor(mins / 60) % 24) + ':' + pad(mins % 60); }
      else if (tv instanceof Date) t = t.slice(0, 11) + pad(tv.getHours()) + ':' + pad(tv.getMinutes());
      else { const mm = String(tv).match(/(\d{1,2})[:.](\d{2})/); if (mm) t = t.slice(0, 11) + pad(+mm[1]) + ':' + mm[2]; }
    }
    const desc = mp.desc >= 0 ? String(r[mp.desc] == null ? '' : r[mp.desc]).replace(/\s+/g, ' ').trim() : '';
    let kind = 'out', amt = 0;
    const db = mp.debit >= 0 ? parseAmt(r[mp.debit]).v : 0;
    const cr = mp.credit >= 0 ? parseAmt(r[mp.credit]).v : 0;
    if (f.incSheet) {
      amt = mp.amount >= 0 ? parseAmt(r[mp.amount]).v : (cr || db);
      if (!(amt > 0)) return;
      const js = mp.type >= 0 ? String(r[mp.type] || '').toLowerCase() : '';
      const inc = INC.find(c => js && (js.includes(c.s.toLowerCase()) || js.includes(c.n.toLowerCase()))) ;
      const row = mkRow(t, amt, 'in', desc, '', src);
      row.type = inc ? inc.id : guessInc(js + ' ' + desc);
      row.extra = {jam: mp.jam >= 0 ? +r[mp.jam] || 0 : 0, tujuan: mp.tujuan >= 0 ? String(r[mp.tujuan] || '').trim() : '', hari: mp.hari >= 0 ? +r[mp.hari] || 0 : 0, to: mp.to >= 0 ? String(r[mp.to] || '').trim() : ''};
      out.push(row);
      return;
    }
    if (db > 0) { amt = db; kind = 'out'; }
    else if (cr > 0) { amt = cr; kind = 'in'; }
    else if (mp.amount >= 0) { const a = parseAmt(r[mp.amount]); amt = a.v; kind = a.neg ? 'out' : 'out'; if (!a.neg && /\b(cr|kr|kredit|masuk)\b/i.test(desc)) kind = 'in'; }
    if (!(amt > 0)) return;
    let cat = '';
    if (mp.cat >= 0) { const cs = String(r[mp.cat] || '').toLowerCase(); const c = CAT.find(c => c.n.toLowerCase() === cs || c.n.toLowerCase().startsWith(cs.slice(0, 5)) && cs.length > 3); if (c) cat = c.id; }
    let s = src;
    if (mp.src >= 0) { const ss = String(r[mp.src] || '').toLowerCase(); const m = SRC.find(x => ss.includes(x.s.toLowerCase())); if (m) s = m.id; }
    out.push(mkRow(t, amt, kind, desc, cat, s));
  });
  return out;
}
function mkRow(t, amt, kind, desc, cat, src) {
  const topup = isTopup(desc);
  const m = cleanDesc(desc);
  return {t, amt, kind, m, cat: kind === 'out' ? (cat || guessCat(m) || 'lain') : '', type: kind === 'in' ? guessInc(desc) : '', src, topup, on: !topup, dup: false};
}
function cleanDesc(s) {
  return String(s || '').replace(/\s+/g, ' ').replace(/^(trsf|transfer|pembayaran|pemb\.?|bayar|qris|purchase|debit|kredit)\s+(e-banking|ebanking|qr|qris)?\s*/i, m => m.trim().length > 12 ? m : m).slice(0, 80).trim();
}
async function parsePdf(file) {
  const lib = window.pdfjsLib;
  if (!lib) throw new Error('Pembaca PDF tidak tersedia');
  try { lib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js'; } catch (e) { /* abaikan */ }
  const buf = await file.arrayBuffer();
  const doc = await lib.getDocument({data: new Uint8Array(buf), isEvalSupported: false}).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const rows = [];
    tc.items.forEach(it => {
      if (!it.str || !it.str.trim()) return;
      const y = it.transform[5], x = it.transform[4];
      let row = rows.find(r => Math.abs(r.y - y) < 3);
      if (!row) { row = {y, parts: []}; rows.push(row); }
      row.parts.push({x, s: it.str});
    });
    rows.sort((a, b) => b.y - a.y).forEach(r => lines.push(r.parts.sort((a, b) => a.x - b.x).map(q => q.s.trim()).join('  ')));
  }
  return lines;
}
function rowsFromPdfLines(lines, src) {
  const text = lines.join('\n');
  const years = (text.match(/\b20\d{2}\b/g) || []).reduce((o, y) => (o[y] = (o[y] || 0) + 1, o), {});
  const mainYear = +(Object.keys(years).sort((a, b) => years[b] - years[a])[0] || new Date().getFullYear());
  const DATE = /^(\d{1,2}[\/\-.]\d{1,2}(?:[\/\-.]\d{2,4})?|\d{1,2}\s+(?:jan|feb|mar|apr|mei|may|jun|jul|agu|agt|aug|sep|okt|oct|nov|des|dec)[a-z]*(?:\s+\d{2,4})?|\d{4}-\d{2}-\d{2})/i;
  const AMT = /(?:^|\s)([+\-]?\(?(?:rp\.?\s?)?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?\)?(?:\s?(?:cr|db|dr|kr|d|k))?)(?=\s|$)/gi;
  const recs = [];
  let cur = null;
  lines.forEach(line => {
    const l = line.trim();
    const dm = l.match(DATE);
    if (dm) {
      let ds = dm[1];
      if (/^\d{1,2}[\/\-.]\d{1,2}$/.test(ds)) ds += '/' + mainYear;
      if (/^\d{1,2}\s+[a-z]+$/i.test(ds)) ds += ' ' + mainYear;
      const t = parseDate(ds + (l.match(/\b(\d{2}[:.]\d{2})(?::\d{2})?\b/) ? ' ' + l.match(/\b(\d{2}[:.]\d{2})(?::\d{2})?\b/)[1] : ''));
      if (t) {
        const amts = [];
        let mm; AMT.lastIndex = 0;
        const rest = l.slice(dm[0].length);
        while ((mm = AMT.exec(rest))) amts.push(mm[1]);
        if (amts.length) {
          let desc = rest;
          amts.forEach(a => { desc = desc.replace(a, ' '); });
          desc = desc.replace(/\b\d{2}[:.]\d{2}(?::\d{2})?\b/g, '').replace(/\s{2,}/g, ' ').trim();
          cur = {t, amts, desc, raw: l};
          recs.push(cur);
          return;
        }
      }
    }
    if (cur && l && !DATE.test(l) && cur.desc.length < 80 && !/saldo|halaman|page|total|periode/i.test(l)) {
      cur.desc = (cur.desc + ' ' + l.replace(AMT, ' ')).replace(/\s{2,}/g, ' ').trim();
    }
  });
  let prevSaldo = null;
  return recs.map(r => {
    const first = parseAmt(r.amts[0]);
    const saldo = r.amts.length >= 2 ? parseAmt(r.amts[r.amts.length - 1]).v : null;
    const whole = (r.raw + ' ' + r.desc).toLowerCase();
    let kind = 'out';
    if (/\b(cr|kr)\b|kredit|credit|dana masuk|transfer masuk|setoran/.test(whole) || /^\+/.test(r.amts[0])) kind = 'in';
    else if (first.neg || /\b(db|dr)\b|debet|debit/.test(whole)) kind = 'out';
    else if (saldo != null && prevSaldo != null) kind = saldo > prevSaldo ? 'in' : 'out';
    if (saldo != null) prevSaldo = saldo;
    return mkRow(r.t, first.v, kind, r.desc, '', src);
  }).filter(r => r.amt > 0);
}
async function handleImportFiles(files) {
  const I = S.imp;
  I.step = 'busy'; I.msg = ''; renderSheet();
  for (const file of files) {
    const name = file.name || 'file';
    const ext = (name.split('.').pop() || '').toLowerCase();
    const lname = name.toLowerCase();
    if (!I.src) I.src = /gopay|gojek/.test(lname) ? 'gopay' : /mandiri|livin|estatement/.test(lname) ? 'mandiri' : 'mandiri';
    try {
      if (ext === 'pdf' || file.type === 'application/pdf') {
        const lines = await parsePdf(file);
        const rows = rowsFromPdfLines(lines, I.src);
        I.files.push({name, ext: 'pdf', kind: 'pdf', info: rows.length + ' transaksi terbaca', rows});
        if (!rows.length) I.msg = 'Tidak ada transaksi terbaca dari ' + name + '. Kalau PDF-nya hasil scan/foto, teksnya tidak bisa dibaca — coba versi Excel/CSV.';
      } else {
        if (!window.XLSX) throw new Error('Pembaca Excel tidak tersedia');
        let wb;
        if (ext === 'csv' || ext === 'txt' || /csv/.test(file.type || '')) {
          const text = await file.text();
          wb = XLSX.read(text, {type: 'string', raw: true});
        } else {
          const buf = await file.arrayBuffer();
          wb = XLSX.read(new Uint8Array(buf), {type: 'array', cellDates: true});
        }
        const found = [];
        wb.SheetNames.forEach(sn => {
          if (/petunjuk|panduan|cara|rekap/i.test(sn)) return;
          const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: true, defval: ''});
          let hi = -1, score = 0;
          for (let i = 0; i < Math.min(25, aoa.length); i++) {
            const mp = autoMap(aoa[i] || []);
            const sc = (mp.date >= 0 ? 2 : 0) + (mp.amount >= 0 || mp.debit >= 0 || mp.credit >= 0 ? 2 : 0) + (mp.desc >= 0 ? 1 : 0);
            if (sc > score) { score = sc; hi = i; }
          }
          if (hi >= 0 && score >= 4) found.push({sn, aoa, hi});
        });
        if (!found.length) {
          I.files.push({name, ext, kind: 'sheet', info: 'Kolom tanggal/nominal tidak ditemukan', rows: []});
          I.msg = 'Kolom tanggal dan nominal di ' + name + ' tidak ditemukan. Pastikan ada baris judul seperti “Tanggal”, “Keterangan”, “Nominal” — atau pakai template Excel di bawah.';
        }
        let total = 0;
        found.forEach(b => {
          const headers = (b.aoa[b.hi] || []).map(h => String(h == null ? '' : h).trim());
          const map = autoMap(headers);
          const incSheet = /masuk|pemasukan|gaji|income/i.test(b.sn) || map.type >= 0;
          const f = {name: found.length > 1 ? name + ' · ' + b.sn : name, ext, kind: 'sheet', headers, map, incSheet, data: b.aoa.slice(b.hi + 1), sheet: b.sn};
          f.rows = rowsFromSheet(f, I.src);
          f.info = 'Sheet “' + b.sn + '” · ' + f.rows.length + (incSheet ? ' pemasukan' : ' transaksi');
          total += f.rows.length;
          I.files.push(f);
        });
        if (found.length && !total) I.msg = name + ' tidak berisi transaksi — hanya judul kolom. Kalau ini hasil ekspor saat aplikasi masih kosong, memang belum ada datanya.';
      }
    } catch (e) {
      I.files.push({name, ext, kind: ext === 'pdf' ? 'pdf' : 'sheet', info: 'Gagal dibaca', rows: []});
      I.msg = 'Gagal membaca ' + name + ': ' + (e && e.message ? e.message : 'format tidak dikenal');
    }
  }
  rebuildImportRows();
  I.step = I.rows.length ? 'preview' : 'pick';
  renderSheet();
}
function rebuildImportRows() {
  const I = S.imp;
  let rows = [];
  I.files.forEach((f, fi) => { (f.rows || []).forEach(r => { r.fi = fi; }); rows = rows.concat(f.rows || []); });
  const looseByFile = {};
  const keyOf = (t, amt, m) => t.slice(0, 10) + '|' + amt + '|' + String(m || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const have = new Set(D.tx.map(x => keyOf(String(x.t), x.amt, x.m)).concat(D.inc.map(x => keyOf(String(x.t), x.amt, x.note))));
  const haveLoose = new Set(D.tx.map(x => String(x.t).slice(0, 10) + '|' + x.amt).concat(D.inc.map(x => String(x.t).slice(0, 10) + '|' + x.amt)));
  const seen = new Set();
  rows.forEach(r => {
    const k = keyOf(r.t, r.amt, r.m);
    const lk = r.t.slice(0, 10) + '|' + r.amt + '|' + r.kind;
    const otherFile = looseByFile[lk] != null && looseByFile[lk] !== r.fi;
    r.dup = have.has(k) || haveLoose.has(r.t.slice(0, 10) + '|' + r.amt) || seen.has(k) || otherFile;
    seen.add(k);
    if (looseByFile[lk] == null) looseByFile[lk] = r.fi;
  });
  rows.sort((a, b) => a.t < b.t ? 1 : -1);
  I.rows = rows;
}
function doImport() {
  const I = S.imp;
  let nTx = 0, nInc = 0;
  I.rows.forEach(r => {
    if (!r.on || r.dup) return;
    if (r.kind === 'in') {
      if (!I.opts.inc) return;
      const x = r.extra || {};
      const rec = {id: uid(), type: r.type || 'lain', amt: r.amt, t: r.t.slice(0, 10), note: r.m, to: x.to || srcOf(I.src).s, imp: 1, at: Date.now()};
      if (rec.type === 'lembur' && x.jam) rec.jam = x.jam;
      if (rec.type === 'sppd') { if (x.tujuan) rec.tujuan = x.tujuan; if (x.hari) rec.hari = x.hari; }
      D.inc.push(rec);
      nInc++;
    } else {
      D.tx.push({id: uid(), amt: r.amt, src: r.src || I.src || 'lain', cat: r.cat || 'lain', m: r.m || 'Tanpa nama', t: r.t, note: '', imp: 1, at: Date.now()});
      nTx++;
    }
  });
  if (save()) { I.done = {tx: nTx, inc: nInc, skip: I.rows.filter(r => r.dup).length}; I.step = 'done'; S.tab = 'lap'; renderSheet(); render(); }
}

/* ---------- ekspor ---------- */
function exportXlsx() {
  if (!window.XLSX) { toast('Pembuat Excel tidak tersedia'); return; }
  const tx = D.tx.slice().sort((a, b) => a.t < b.t ? -1 : 1).map(t => ({Tanggal: t.t.slice(0, 10), Jam: t.t.slice(11, 16), Nominal: t.amt, Sumber: srcOf(t.src).n, Kategori: catOf(t.cat).n, Merchant: t.m, Catatan: t.note || ''}));
  const inc = D.inc.slice().sort((a, b) => a.t < b.t ? -1 : 1).map(i => ({Tanggal: i.t.slice(0, 10), Jenis: incOf(i.type).n, Nominal: i.amt, 'Masuk ke': i.to || '', Keterangan: i.note || '', 'Jam lembur': i.jam || '', 'Tujuan SPPD': i.tujuan || '', 'Lama SPPD (hari)': i.hari || ''}));
  const yms = [...new Set(D.tx.map(t => t.t.slice(0, 7)).concat(D.inc.map(i => i.t.slice(0, 7))))].sort();
  const rek = yms.map(ym => {
    const M = monthData(ym);
    const by = id => sum(M.inc.filter(i => incOf(i.type).id === id));
    return {Bulan: ymLabel(ym), 'Total masuk': M.masuk, 'Gaji pokok': by('pokok'), Lembur: by('lembur'), SPPD: by('sppd'), 'Pemasukan lain': by('lain'), 'Total keluar': M.out, Sisa: M.sisa, '% sisa': M.masuk ? +(M.sisa / M.masuk * 100).toFixed(1) : ''};
  });
  const wb = XLSX.utils.book_new();
  const sheet = (rows, headers) => XLSX.utils.json_to_sheet(rows, {header: headers});
  XLSX.utils.book_append_sheet(wb, sheet(rek, ['Bulan', 'Total masuk', 'Gaji pokok', 'Lembur', 'SPPD', 'Pemasukan lain', 'Total keluar', 'Sisa', '% sisa']), 'Rekap bulanan');
  XLSX.utils.book_append_sheet(wb, sheet(tx, ['Tanggal', 'Jam', 'Nominal', 'Sumber', 'Kategori', 'Merchant', 'Catatan']), 'Pengeluaran');
  XLSX.utils.book_append_sheet(wb, sheet(inc, ['Tanggal', 'Jenis', 'Nominal', 'Masuk ke', 'Keterangan', 'Jam lembur', 'Tujuan SPPD', 'Lama SPPD (hari)']), 'Pemasukan');
  const b64 = XLSX.write(wb, {type: 'base64', bookType: 'xlsx'});
  saveB64('Keuanganku-' + nowLocal().slice(0, 10) + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', b64);
}
function downloadTemplate() {
  if (!window.XLSX) { toast('Pembuat Excel tidak tersedia'); return; }
  const wb = XLSX.utils.book_new();
  const out = XLSX.utils.aoa_to_sheet([['Tanggal', 'Jam', 'Nominal', 'Sumber', 'Kategori', 'Merchant', 'Catatan']]);
  out['!cols'] = [{wch: 12}, {wch: 7}, {wch: 12}, {wch: 14}, {wch: 18}, {wch: 26}, {wch: 20}];
  const inc = XLSX.utils.aoa_to_sheet([['Tanggal', 'Jenis', 'Nominal', 'Keterangan', 'Jam lembur', 'Tujuan SPPD', 'Lama SPPD (hari)']]);
  inc['!cols'] = [{wch: 12}, {wch: 14}, {wch: 12}, {wch: 24}, {wch: 11}, {wch: 14}, {wch: 16}];
  const help = XLSX.utils.aoa_to_sheet([
    ['Cara mengisi template Keuanganku'],
    [''],
    ['1. Sheet "Pengeluaran": satu baris per pembayaran. Wajib: Tanggal dan Nominal. Lainnya boleh kosong.'],
    ['2. Sheet "Pemasukan": satu baris per uang masuk. Jenis diisi: Pokok, Lembur, SPPD, atau Lainnya.'],
    ['3. Tanggal ditulis seperti 21/11/2025 atau 21 Nov 2025. Nominal cukup angka, misal 25000 atau 25.000.'],
    ['4. Sumber: Mandiri, GoPay, Transfer, Tunai, atau Lainnya. Kategori: ' + CAT.map(c => c.n).join(', ') + '.'],
    ['5. Simpan, lalu di aplikasi: Riwayat → Impor data lama → Pilih file.'],
    [''],
    ['Contoh baris Pengeluaran:', '21/11/2025', '08:14', 25000, 'GoPay', 'Makan & minum', 'Kopi Kenangan'],
    ['Contoh baris Pemasukan:', '25/11/2025', 'Lembur', 450000, 'Lembur 15 Nov', 6]
  ]);
  help['!cols'] = [{wch: 30}, {wch: 12}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 16}, {wch: 16}];
  XLSX.utils.book_append_sheet(wb, out, 'Pengeluaran');
  XLSX.utils.book_append_sheet(wb, inc, 'Pemasukan');
  XLSX.utils.book_append_sheet(wb, help, 'Petunjuk');
  saveB64('Template-Keuanganku.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', XLSX.write(wb, {type: 'base64', bookType: 'xlsx'}));
}
function backup() {
  const json = JSON.stringify({app: 'keuanganku', v: 1, exported: new Date().toISOString(), tx: D.tx, inc: D.inc, budget: D.budget});
  saveB64('Keuanganku-cadangan-' + nowLocal().slice(0, 10) + '.json', 'application/json', btoa(unescape(encodeURIComponent(json))));
}
function saveB64(name, mime, b64) {
  if (A && A.saveFile) {
    const where = A.saveFile(name, mime, b64);
    toast(where ? 'Tersimpan di ' + where : 'Gagal menyimpan file');
    return;
  }
  const a = document.createElement('a');
  a.href = 'data:' + mime + ';base64,' + b64; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
async function restore(file) {
  try {
    const o = JSON.parse(await file.text());
    if (!o || !Array.isArray(o.tx) || !Array.isArray(o.inc)) throw new Error('bukan file cadangan');
    let n = 0;
    const merge = (arr, src) => src.forEach(r => { if (!r || !r.id) return; const i = arr.findIndex(x => x.id === r.id); if (i >= 0) arr[i] = r; else { arr.push(r); n++; } });
    merge(D.tx, o.tx); merge(D.inc, o.inc);
    if (o.budget && !D.budget) D.budget = +o.budget || 0;
    if (save()) { render(); toast(n + ' catatan dipulihkan'); }
  } catch (e) { toast('File cadangan tidak valid'); }
}
function printReport() {
  const M = monthData(S.ym);
  const by = id => sum(M.inc.filter(i => incOf(i.type).id === id));
  const cats = CAT.map(c => ({c, v: sum(M.tx.filter(t => catOf(t.cat).id === c.id))})).filter(x => x.v).sort((a, b) => b.v - a.v);
  const tx = M.tx.slice().sort((a, b) => a.t < b.t ? -1 : 1);
  $('#print').innerHTML = `<h1>Laporan keuangan ${ymLabel(S.ym)}</h1>
    <div class="kp"><div><span>Total masuk</span><b>${rp(M.masuk)}</b></div><div><span>Total keluar</span><b>${rp(M.out)}</b></div><div><span>Sisa</span><b>${rpS(M.sisa)}${M.masuk ? ' (' + pct(M.sisa, M.masuk) + '%)' : ''}</b></div></div>
    <h2>Pemasukan</h2><table><tr><th>Jenis</th><th class="r">Nominal</th><th class="r">%</th></tr>${INC.map(c => `<tr><td>${c.n}</td><td class="r">${rp(by(c.id))}</td><td class="r">${pct(by(c.id), M.masuk)}%</td></tr>`).join('')}</table>
    <h2>Pengeluaran per kategori</h2><table><tr><th>Kategori</th><th class="r">Nominal</th><th class="r">%</th></tr>${cats.map(x => `<tr><td>${x.c.n}</td><td class="r">${rp(x.v)}</td><td class="r">${pct(x.v, M.out)}%</td></tr>`).join('')}</table>
    <h2>Rincian pengeluaran (${tx.length})</h2><table><tr><th>Tanggal</th><th>Merchant</th><th>Sumber</th><th>Kategori</th><th class="r">Nominal</th></tr>${tx.map(t => `<tr><td>${fmtDate(t.t)} ${t.t.slice(11, 16)}</td><td>${esc(t.m)}</td><td>${srcOf(t.src).s}</td><td>${catOf(t.cat).n}</td><td class="r">${rp(t.amt)}</td></tr>`).join('')}</table>`;
  if (A && A.printPage) A.printPage('Keuanganku ' + ymLabel(S.ym));
  else window.print();
}

/* ---------- toast ---------- */
function toast(msg, undo) {
  const el = $('#toast');
  el.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button data-act="undo">Batalkan</button>' : '');
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, undo ? 6000 : 3200);
}
function safe(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }

/* ---------- event ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act, v = b.dataset.v;
  if (b.tagName === 'INPUT') return; // checkbox ditangani di change
  switch (act) {
    case 'tab': S.tab = v; S.f = S.f; render(); window.scrollTo(0, 0); break;
    case 'prevM': S.ym = ymAdd(S.ym, -1); render(); break;
    case 'nextM': if (S.ym < NOW_YM()) { S.ym = ymAdd(S.ym, 1); render(); } break;
    case 'pickM': S.ym = v; render(); break;
    case 'range': S.range = +v; render(); break;
    case 'filter': S.f = v; render(); break;
    case 'newTx': openTx(null); break;
    case 'editTx': { const t = D.tx.find(x => x.id === b.dataset.id); if (t) openTx(t); break; }
    case 'newInc': openInc(null, v ? {type: v} : null); break;
    case 'editInc': { const i = D.inc.find(x => x.id === b.dataset.id); if (i) openInc(i); break; }
    case 'close': closeSheet(); break;
    case 'pickSrc': readTxForm(); S.edit.src = v; renderSheet(); break;
    case 'pickCat': readTxForm(); S.edit.cat = v; renderSheet(); break;
    case 'saveTx': e.preventDefault(); saveTx(); break;
    case 'delTx': {
      const t = D.tx.find(x => x.id === S.edit.id);
      if (!t) break;
      D.tx = D.tx.filter(x => x.id !== t.id); S.lastDel = {kind: 'tx', rec: t};
      save(); closeSheet(); toast('Pengeluaran dihapus', true); break;
    }
    case 'pickInc': readIncForm(); S.inc.type = v; renderSheet(); break;
    case 'saveInc': e.preventDefault(); saveInc(); break;
    case 'delInc': {
      const i = D.inc.find(x => x.id === S.inc.id);
      if (!i) break;
      D.inc = D.inc.filter(x => x.id !== i.id); S.lastDel = {kind: 'inc', rec: i};
      save(); closeSheet(); toast('Pemasukan dihapus', true); break;
    }
    case 'undo': {
      const d = S.lastDel;
      if (d) { (d.kind === 'tx' ? D.tx : D.inc).push(d.rec); S.lastDel = null; save(); render(); }
      $('#toast').hidden = true; break;
    }
    case 'auto': openSheet('auto'); break;
    case 'openNotif': if (A) A.openNotifSettings(); break;
    case 'okAll': D.tx.forEach(t => { delete t.review; }); D.inc.forEach(i => { delete i.review; }); save(); renderSheet(); toast('Semua ditandai benar'); break;
    case 'clearLog': if (A) A.clearLog(); renderSheet(); break;
    case 'testParse': {
      const txt = ($('#testTxt') || {}).value || '';
      let r = null;
      if (A) r = safe(() => JSON.parse(A.parseText('', '', txt)), null);
      $('#testOut').innerHTML = r ? `${r.kind === 'in' ? 'Uang masuk' : r.kind === 'topup' ? 'Top up (dilewati)' : 'Pengeluaran'} <b>${rp(r.amt)}</b>${r.m ? ' · ' + esc(r.m) : ''} · ${srcOf(r.src).s}${r.sure ? '' : ' · akan masuk “Perlu dicek”'}` : 'Tidak terbaca sebagai transaksi.';
      break;
    }
    case 'import': openImport(); break;
    case 'pickFiles': $('#fileImport').value = ''; $('#fileImport').click(); break;
    case 'impKind': {
      const r = S.imp.rows[+b.dataset.i];
      if (r) { r.kind = r.kind === 'in' ? 'out' : 'in'; if (r.kind === 'in') r.type = guessInc(r.m); else r.cat = r.cat || guessCat(r.m) || 'lain'; renderSheet(); }
      break;
    }
    case 'doImport': doImport(); break;
    case 'xlsx': exportXlsx(); break;
    case 'template': downloadTemplate(); break;
    case 'pdf': printReport(); break;
    case 'backup': backup(); break;
    case 'restore': $('#fileRestore').value = ''; $('#fileRestore').click(); break;
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  const act = t.dataset ? t.dataset.act : '';
  if (act === 'cfgOn') setCfg(c => { c.enabled = t.checked; });
  else if (act === 'cfgPkg') setCfg(c => { const s = new Set(c.pkgs || []); if (t.checked) s.add(t.dataset.v); else s.delete(t.dataset.v); c.pkgs = [...s]; });
  else if (act === 'impOn') { const r = S.imp.rows[+t.dataset.i]; if (r) { r.on = t.checked; renderSheet(); } }
  else if (act === 'impInc') { S.imp.opts.inc = t.checked; renderSheet(); }
  else if (act === 'impSrc') { S.imp.src = t.value; S.imp.rows.forEach(r => { r.src = t.value; }); renderSheet(); }
  else if (t.dataset && t.dataset.map) {
    const fi = +t.dataset.file, f = S.imp.files[fi];
    if (f && f.headers) { f.map[t.dataset.map] = +t.value; f.rows = rowsFromSheet(f, S.imp.src); f.info = 'Sheet “' + f.sheet + '” · ' + f.rows.length + (f.incSheet ? ' pemasukan' : ' transaksi'); S.imp.mapOpen = fi; rebuildImportRows(); renderSheet(); }
  }
  else if (t.id === 'budget') { D.budget = num(t.value); save(); toast(D.budget ? 'Anggaran disimpan' : 'Anggaran dihapus'); }
  else if (t.id === 'fM' && S.edit && !S.edit.cat) {
    const g = guessCat(t.value);
    if (g) { S.edit.cat = g; document.querySelectorAll('[data-act=pickCat]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === g))); }
  }
  else if (t.id === 'fileImport') { const fs = [...t.files]; if (fs.length) handleImportFiles(fs); }
  else if (t.id === 'fileRestore') { const f = t.files[0]; if (f) restore(f); }
  else if (t.id === 'iT' && S.inc) {
    const M = monthData(String(t.value || S.inc.t).slice(0, 7));
    const old = S.inc.id ? (D.inc.find(i => i.id === S.inc.id) || {}).amt || 0 : 0;
    const el = $('#iAfter b'); if (el) el.textContent = rp(M.masuk - old + num(($('#iAmt') || {}).value));
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.classList && t.classList.contains('money')) { const d = num(t.value); t.value = d ? d.toLocaleString('id-ID') : ''; }
  if (t.id === 'q') {
    S.q = t.value;
    if (e.isComposing) return;
    clearTimeout(S.qt);
    S.qt = setTimeout(() => {
      const pos = ($('#q') || {}).selectionStart;
      render();
      const q = $('#q');
      if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (err) { /* abaikan */ } }
    }, 300);
  }
  if (t.id === 'iAmt' && S.inc) {
    const e2 = S.inc; const M = monthData(String(($('#iT') || {}).value || e2.t).slice(0, 7));
    const old = e2.id ? (D.inc.find(i => i.id === e2.id) || {}).amt || 0 : 0;
    const el = $('#iAfter b'); if (el) el.textContent = rp(M.masuk - old + num(t.value));
  }
});
document.addEventListener('submit', e => { e.preventDefault(); if (S.sheet === 'tx') saveTx(); else if (S.sheet === 'inc') saveInc(); });

/* ---------- mulai ---------- */
render();
pullNative();
handleShared();
})();
