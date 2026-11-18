// Hangzhou Schools Staff Football League — site script.
// All league data lives in data/league.json. Edit that file to update the site.
(async () => {
const $ = id => document.getElementById(id);
let D;
try {
  const r = await fetch('data/league.json?v=' + Date.now(), {cache: 'no-store'});
  D = await r.json();
} catch (e) {
  $('board').innerHTML = '<div class="lab">Could not load the league data. Check your connection and refresh.</div>';
  return;
}

// ---------- data ----------
const T = {};
for (const [id, t] of Object.entries(D.teams)) T[id] = {n: t.name, s: t.short, c: t.colour, l: t.logo, p: t.badgeLetter || ''};
const GW = D.gameweeks;
const M = [];
GW.forEach(g => g.matches.forEach(m => M.push({gw: g.gameweek, d: g.date, h: m.home, a: m.away, sc: m.score, ff: !!m.forfeit})));
const res = m => m.sc ? [m.sc[0], m.sc[1], m.ff ? 'ff' : ''] : null;
// player row: [name, apps, goals, assists, cleanSheets, goals+assists, team]
const PLAYERS = {}, ALL = [];
for (const [t, list] of Object.entries(D.players || {})) {
  PLAYERS[t] = list.map(p => { const r = [p.name, p.apps || 0, p.goals || 0, p.assists || 0, p.cleanSheets || 0]; r[5] = r[2] + r[3]; r[6] = t; ALL.push(r); return r; });
}

const today = new Date(); today.setHours(0, 0, 0, 0);
const dt = s => new Date(s + 'T00:00:00');
const fd = (s, o) => dt(s).toLocaleDateString('en-GB', o || {weekday: 'short', day: 'numeric', month: 'short'});
const days = s => Math.round((dt(s) - today) / 864e5);
const crest = (id, z = 36) => { const t = T[id]; return `<span class="lg" style="--z:${z}px;--kc:${t.c}"><img src="${t.l}" alt="" width="${z}" height="${z}" loading="lazy">${t.p ? `<em>${t.p}</em>` : ''}</span>`; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
if (D.lastUpdated) $('upd').textContent = 'Last updated ' + fd(D.lastUpdated, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});

// ---------- table ----------
function table() {
  const S = {};
  Object.keys(T).forEach(id => S[id] = {id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, f: []});
  M.forEach(m => {
    const r = res(m); if (!r) return;
    const [x, y] = r, H = S[m.h], A = S[m.a];
    H.p++; A.p++; H.gf += x; H.ga += y; A.gf += y; A.ga += x;
    if (x > y) { H.w++; A.l++; H.f.push('W'); A.f.push('L'); }
    else if (x < y) { A.w++; H.l++; A.f.push('W'); H.f.push('L'); }
    else { H.d++; A.d++; H.f.push('D'); A.f.push('D'); }
  });
  const a = Object.values(S);
  a.forEach(s => { s.gd = s.gf - s.ga; s.pts = s.w * 3 + s.d; });
  a.sort((p, q) => q.pts - p.pts || q.gd - p.gd || q.gf - p.gf || T[p.id].n.localeCompare(T[q.id].n));
  a.forEach((s, i) => s.pos = i + 1);
  return a;
}
const form = f => `<span class="form">${f.slice(-5).map(x => `<i class="${x}">${x}</i>`).join('') || '<span style="color:var(--mut)">–</span>'}</span>`;
const sg = n => n > 0 ? '+' + n : n;

// ---------- players & awards ----------
let psort = 2;
const pord = (k, L) => L.slice().sort((a, b) => b[k] - a[k] || b[2] - a[2] || b[3] - a[3] || b[4] - a[4] || b[1] - a[1] || a[0].localeCompare(b[0]));
const sum = (L, k) => L.reduce((t, p) => t + p[k], 0);
function squad(id) {
  const PL = PLAYERS[id]; if (!PL || !PL.length) return '';
  const top = pord(2, PL)[0], ga = pord(5, PL)[0];
  const H = [['Player', 0], ['Apps', 1], ['G', 2], ['A', 3], ['G+A', 5], ['CS', 4]];
  const tiles = [[top[2], 'Top scorer', top[0]], [ga[5], 'Goal involvements', ga[0]], [sum(PL, 2), 'Goals', PL.filter(p => p[2]).length + ' scorers'], [sum(PL, 3), 'Assists', PL.filter(p => p[3]).length + ' players']];
  return `<div class="blk"><h4>${esc(T[id].n)} squad</h4>
  <div class="pl-top">${tiles.map(([v, l, x]) => `<div><b>${v}</b><span>${l}</span><small>${esc(x)}</small></div>`).join('')}</div>
  <table id="pl"><thead><tr>${H.map(([h, k], i) => i ? `<th><button data-s="${k}" aria-pressed="${k == psort}">${h}</button></th>` : `<th style="text-align:left">${h}</th>`).join('')}</tr></thead>
  <tbody>${pord(psort, PL).map(p => `<tr class="${p === top && top[2] ? 'gold' : ''}"><td class="n">${esc(p[0])}</td><td>${p[1]}</td><td>${p[2] || '–'}</td><td>${p[3] || '–'}</td><td>${p[5] || '–'}</td><td>${p[4] || '–'}</td></tr>`).join('')}</tbody></table>
  <div class="key">${PL.length} players used. Tap a heading to sort. G goals, A assists, CS clean sheets.</div></div>`;
}
function rank(L, k) { let r = 0, prev = null; return L.map((p, i) => { if (p[k] !== prev) { r = i + 1; prev = p[k]; } return [r, p]; }); }
const BOOT = '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><path d="M14 6h18v26l18 8c6 3 8 7 8 12v4H8V44c0-4 2-6 6-8z" fill="#f5c518" stroke="#7a5b00" stroke-width="2.5" stroke-linejoin="round"/><path d="M8 52h50v4H8z" fill="#7a5b00"/><path d="M14 18h18M14 26h18" stroke="#7a5b00" stroke-width="2.5"/><circle cx="18" cy="60" r="2.5" fill="#7a5b00"/><circle cx="30" cy="60" r="2.5" fill="#7a5b00"/><circle cx="44" cy="60" r="2.5" fill="#7a5b00"/></svg>';
const PASS = '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><circle cx="16" cy="44" r="10" fill="#fff" stroke="#15173a" stroke-width="2.5"/><path d="M16 36l5 4-2 6h-6l-2-6z" fill="#15173a"/><path d="M28 38C36 22 46 16 56 14" fill="none" stroke="#2cc1b8" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 7"/><path d="M50 8l8 6-9 4" fill="none" stroke="#2cc1b8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function award(title, icon, k, unit, cls) {
  const L = pord(k, ALL).filter(p => p[k] > 0), R = rank(L, k), lead = R.filter(r => r[0] == 1).map(r => r[1]);
  const top = lead.length
    ? `<div class="aw-lead">${lead.slice(0, 4).map(p => `<button class="aw-p" data-t="${p[6]}">${crest(p[6], 34)}<span><b>${esc(p[0])}</b><small>${T[p[6]].n}</small></span></button>`).join('')}${lead.length > 4 ? `<small class="aw-more">+ ${lead.length - 4} more</small>` : ''}</div>
       <div class="aw-num"><b>${lead[0][k]}</b><span>${unit}${lead[0][k] == 1 ? '' : 's'}</span><em>${lead.length > 1 ? 'Joint leaders' : 'Leader'}</em></div>`
    : '<p class="sub">No entries yet.</p>';
  return `<article class="aw ${cls}"><header>${icon}<div><h3>${title}</h3><small>Most ${unit}s across the league</small></div></header><div class="aw-top">${top}</div>
  <ol class="aw-list">${R.slice(0, 10).map(([r, p]) => `<li><span class="rk">${r}</span><button class="aw-row" data-t="${p[6]}">${crest(p[6], 26)}<span><b>${esc(p[0])}</b><small>${T[p[6]].n} · ${p[1]} app${p[1] == 1 ? '' : 's'}</small></span></button><span class="v">${p[k]}</span></li>`).join('')}</ol></article>`;
}
function awards() {
  const have = Object.keys(PLAYERS).map(t => T[t].n);
  const missing = Object.keys(T).filter(t => !PLAYERS[t]).length;
  $('aw-note').textContent = missing ? `Player stats so far from: ${have.join(', ') || 'no clubs yet'}. Other clubs will be added as they send them in.` : 'Player stats from all clubs.';
  $('awards').innerHTML = award('Golden Boot', BOOT, 2, 'goal', 'gb') + award('Playmaker Award', PASS, 3, 'assist', 'pm');
}

// ---------- home ----------
function render() {
  const st = table(), played = M.filter(res).length;
  $('tsub').textContent = `${played} of ${M.length} games played. Tap a club for its full record.`;
  document.querySelector('#tbl tbody').innerHTML = st.map(s => `<tr data-t="${s.id}" class="${s.pos == 1 && s.pts ? 'top' : ''}"><td><span class="pos">${s.pos}</span></td><td class="tm"><button data-t="${s.id}">${crest(s.id, 30)}<span class="full">${T[s.id].n}</span><span class="sh">${T[s.id].s}</span></button></td><td>${s.p}</td><td>${s.w}</td><td>${s.d}</td><td>${s.l}</td><td class="hx">${s.gf}</td><td class="hx">${s.ga}</td><td>${sg(s.gd)}</td><td class="pts">${s.pts}</td><td>${form(s.f)}</td></tr>`).join('');
  const nxt = GW.findIndex(g => days(g.date) >= 0), L = st[0];
  let b = `<div class="row"><div><div class="lab">Top of the table</div><div class="lcd big">${T[L.id].n}</div></div><div style="text-align:right"><div class="lab">Points</div><div class="lcd big">${L.pts}</div></div></div>`;
  if (nxt >= 0) {
    const g = GW[nxt], d = days(g.date);
    b += `<div class="nx"><div class="row"><span class="lab">Next up · Gameweek ${g.gameweek} · ${fd(g.date)}</span><span class="lcd" style="font-size:22px">${d == 0 ? 'TODAY' : d == 1 ? '1 day' : d + ' days'}</span></div>${g.matches.map(m => `<button data-t="${m.home}"><span class="h">${T[m.home].n} ${crest(m.home, 28)}</span><span class="vs">v</span><span class="a">${crest(m.away, 28)} ${T[m.away].n}</span></button>`).join('')}${g.bye ? `<div class="lab">Bye: ${T[g.bye].n}</div>` : ''}</div>`;
  } else b += `<div class="nx"><div class="lab">Season complete</div></div>`;
  $('board').innerHTML = b;
  renderGws(); renderGw();
}

// ---------- fixtures ----------
let cur = GW.length - 1;
{ const pend = M.find(m => !res(m)); if (pend) cur = GW.findIndex(g => g.gameweek == pend.gw); }
function renderGws() {
  $('gws').innerHTML = GW.map((g, i) => { const done = g.matches.every(m => m.score); return `<button class="${i == cur ? 'on' : ''} ${done ? 'done' : ''}" data-g="${i}" aria-pressed="${i == cur}">GW${g.gameweek}</button>`; }).join('');
}
function mrow(m) {
  const r = res(m), past = days(m.d) < 0;
  const mid = r ? `<div class="sc">${r[0]} – ${r[1]}</div>` : '<div class="sc p">v</div>';
  let x = '';
  if (r && r[2] == 'ff') x = '<div class="note">★ Awarded by forfeit</div>';
  if (!r && past) x = '<div class="note">Played – result to follow</div>';
  return `<div class="m"><button class="t h" data-t="${m.h}">${T[m.h].n} ${crest(m.h, 28)}</button>${mid}<button class="t" data-t="${m.a}">${crest(m.a, 28)} ${T[m.a].n}</button>${x}</div>`;
}
function renderGw() {
  const g = GW[cur], ms = M.filter(m => m.gw == g.gameweek), n = ms.filter(res).length, d = days(g.date);
  const tag = n == ms.length ? '<span class="tag ft">Full time</span>' : d < 0 ? '<span class="tag aw">Results to follow</span>' : `<span class="tag">${d == 0 ? 'Today' : 'In ' + d + ' day' + (d == 1 ? '' : 's')}</span>`;
  $('gw').innerHTML = `<div class="gwh"><h3>Gameweek ${g.gameweek}</h3><span>${fd(g.date, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})} ${tag}</span></div>${ms.map(mrow).join('')}${g.bye ? `<div class="bye">${crest(g.bye, 20)} ${T[g.bye].n} have the bye</div>` : ''}${g.note ? `<div class="brk">${esc(g.note)}</div>` : ''}`;
}

// ---------- club sheet ----------
let open = null;
function club(id) {
  open = id;
  const t = T[id], s = table().find(x => x.id == id);
  const mine = M.filter(m => m.h == id || m.a == id);
  const played = mine.filter(res), up = mine.filter(m => !res(m));
  const nx = up.find(m => days(m.d) >= 0);
  const li = m => {
    const home = m.h == id, o = home ? m.a : m.h, r = res(m); let right;
    if (r) { const f = home ? r[0] : r[1], a = home ? r[1] : r[0], c = f > a ? 'W' : f < a ? 'L' : 'D'; right = `<span class="r">${f}–${a}</span> <span class="form"><i class="${c}">${c}</i></span>`; }
    else right = days(m.d) < 0 ? '<small>Result to follow</small>' : `<small>${fd(m.d)}</small>`;
    return `<div class="li"><span class="ha" title="${home ? 'Home' : 'Away'}">${home ? 'H' : 'A'}</span><div>${home ? 'v' : '@'} <b>${T[o].n}</b><small>GW${m.gw} · ${fd(m.d)}${r && r[2] == 'ff' ? ' · forfeit' : ''}</small></div><div>${right}</div></div>`;
  };
  const byes = GW.filter(g => g.bye == id).map(g => `GW${g.gameweek} (${fd(g.date, {day: 'numeric', month: 'short'})})`);
  const opp = nx ? (nx.h == id ? nx.a : nx.h) : null;
  $('panel').innerHTML = `<div class="ph" style="--kc:${t.c}"><button class="x" data-close aria-label="Close">×</button><div class="id">${crest(id, 72)}<div><div class="kick">${s.pos}${['st', 'nd', 'rd'][s.pos - 1] || 'th'} in the league · ${s.pts} pts</div><h3>${t.n}</h3>${form(s.f)}</div></div></div>
  <div class="stats">${[['Played', s.p], ['Won', s.w], ['Drawn', s.d], ['Lost', s.l], ['Scored', s.gf], ['Conceded', s.ga], ['Goal diff', sg(s.gd)], ['Points', s.pts]].map(([l, v]) => `<div><b>${v}</b><small>${l}</small></div>`).join('')}</div>
  ${nx ? `<div class="blk"><h4>Next match</h4><div class="nextc"><div>${nx.h == id ? 'Home v' : 'Away at'} <b>${T[opp].n}</b><br><small style="color:var(--mut)">GW${nx.gw} · ${fd(nx.d, {weekday: 'long', day: 'numeric', month: 'long'})}</small></div><div style="text-align:center">${crest(opp, 40)}<div class="lcd">${days(nx.d) == 0 ? 'TODAY' : days(nx.d) + 'd'}</div></div></div></div>` : ''}
  ${squad(id)}
  <div class="blk"><h4>Results</h4>${played.length ? played.slice().reverse().map(li).join('') : '<p class="sub">No results yet.</p>'}</div>
  <div class="blk"><h4>Fixtures to come</h4>${up.length ? up.map(li).join('') : '<p class="sub">Season complete.</p>'}</div>
  <div class="blk"><h4>Bye weeks</h4><p class="sub">${byes.join(', ') || 'None'}</p></div>`;
  const sh = $('sheet');
  if (!sh.classList.contains('on')) { sh.classList.add('on'); document.body.style.overflow = 'hidden'; sh.querySelector('.x').focus(); }
}
function close() { open = null; $('sheet').classList.remove('on'); document.body.style.overflow = ''; }

// ---------- views & events ----------
function view() {
  const v = ['table', 'fixtures', 'awards'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'table';
  document.querySelectorAll('.view').forEach(x => x.hidden = x.dataset.view != v);
  document.querySelectorAll('.tabs a').forEach(a => a.setAttribute('aria-current', a.dataset.v == v ? 'page' : 'false'));
}
$('crests').innerHTML = Object.keys(T).map(id => `<button data-t="${id}">${crest(id, 44)}<span>${T[id].n}</span></button>`).join('');
document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) { close(); return; }
  const ps = e.target.closest('[data-s]');
  if (ps) { psort = +ps.dataset.s; const p = $('panel'), sc = p.scrollTop; club(open); p.scrollTop = sc; return; }
  const g = e.target.closest('[data-g]');
  if (g) { cur = +g.dataset.g; renderGws(); renderGw(); return; }
  const t = e.target.closest('[data-t]');
  if (t && !e.target.closest('.panel')) club(t.dataset.t);
});
document.addEventListener('keydown', e => { if (e.key == 'Escape' && open) close(); });
addEventListener('hashchange', view);
view(); render(); awards();
})();
