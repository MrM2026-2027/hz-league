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
GW.forEach(g => g.matches.forEach(m => M.push({gw: g.gameweek, d: m.date || g.date, gd: g.date, h: m.home, a: m.away, sc: m.score, ff: !!m.forfeit, ph: m.photo || '', cap: m.caption || '', k: g.gameweek + '-' + m.home + '-' + m.away})));
const res = m => m.sc ? [m.sc[0], m.sc[1], m.ff ? 'ff' : ''] : null;
// player row: [name, apps, goals, assists, cleanSheets, goals+assists, team]
const PLAYERS = {}, ALL = [];
for (const [t, list] of Object.entries(D.players || {})) {
  PLAYERS[t] = list.map(p => { const r = [p.name, p.apps ?? null, p.goals || 0, p.assists || 0, p.cleanSheets || 0]; r[5] = r[2] + r[3]; r[6] = t; ALL.push(r); return r; });
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
  Object.keys(T).forEach(id => S[id] = {id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0, f: []});
  M.forEach(m => {
    const r = res(m); if (!r) return;
    const [x, y] = r, H = S[m.h], A = S[m.a];
    H.p++; A.p++; H.gf += x; H.ga += y; A.gf += y; A.ga += x; if (!y) H.cs++; if (!x) A.cs++;
    if (x > y) { H.w++; A.l++; H.f.push('W'); A.f.push('L'); }
    else if (x < y) { A.w++; H.l++; A.f.push('W'); H.f.push('L'); }
    else { H.d++; A.d++; H.f.push('D'); A.f.push('D'); }
  });
  const a = Object.values(S);
  a.forEach(s => { s.gd = s.gf - s.ga; s.pts = s.w * 3 + s.d; s.ppg = s.p ? s.pts / s.p : 0; s.fp = s.f.slice(-5).reduce((t, x) => t + (x == 'W' ? 3 : x == 'D' ? 1 : 0), 0); });
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
  const who = k => { const n = PL.filter(p => p[k] == (k == 2 ? top : ga)[k]); return n.length == 1 ? n[0][0] : n.length <= 3 ? n.map(p => p[0]).join(', ') : n.length + ' players tied'; };
  const tiles = [[top[2], 'Top scorer', who(2)], [ga[5], 'Goal involvements', who(5)], [sum(PL, 2), 'Goals', PL.filter(p => p[2]).length + ' scorers'], [sum(PL, 3), 'Assists', PL.filter(p => p[3]).length + ' players']];
  return `<div class="blk"><h4>${esc(T[id].n)} squad</h4>
  <div class="pl-top">${tiles.map(([v, l, x]) => `<div><b>${v}</b><span>${l}</span><small>${esc(x)}</small></div>`).join('')}</div>
  <table id="pl"><thead><tr>${H.map(([h, k], i) => i ? `<th><button data-s="${k}" aria-pressed="${k == psort}">${h}</button></th>` : `<th style="text-align:left">${h}</th>`).join('')}</tr></thead>
  <tbody>${pord(psort, PL).map(p => `<tr class="${p === top && top[2] && PL.filter(q => q[2] == top[2]).length == 1 ? 'gold' : ''}"><td class="n">${esc(p[0])}</td><td>${p[1] ?? '–'}</td><td>${p[2] || '–'}</td><td>${p[3] || '–'}</td><td>${p[5] || '–'}</td><td>${p[4] || '–'}</td></tr>`).join('')}</tbody></table>
  <div class="key">${D.playerNotes && D.playerNotes[id] ? esc(D.playerNotes[id]) : PL.length + ' players used.'} Tap a heading to sort. G goals, A assists, CS clean sheets.</div></div>`;
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
  <ol class="aw-list">${R.map(([r, p], i) => `<li${i >= 10 ? ' class="more" hidden' : ''}><span class="rk">${r}</span><button class="aw-row" data-t="${p[6]}">${crest(p[6], 26)}<span><b>${esc(p[0])}</b><small>${T[p[6]].n}${p[1] == null ? '' : ` · ${p[1]} app${p[1] == 1 ? '' : 's'}`}</small></span></button><span class="v">${p[k]}</span></li>`).join('')}</ol>${R.length > 10 ? `<button class="aw-all" data-all>Show all ${R.length}</button>` : ''}</article>`;
}
const WALL = '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><g fill="#c4553d" stroke="#5b2016" stroke-width="2"><rect x="4" y="10" width="26" height="12" rx="1.5"/><rect x="34" y="10" width="26" height="12" rx="1.5"/><rect x="4" y="26" width="12" height="12" rx="1.5"/><rect x="20" y="26" width="26" height="12" rx="1.5"/><rect x="50" y="26" width="10" height="12" rx="1.5"/><rect x="4" y="42" width="26" height="12" rx="1.5"/><rect x="34" y="42" width="26" height="12" rx="1.5"/></g></svg>';
const FIRE = '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><path d="M32 4c4 10 16 16 16 32a16 16 0 0 1-32 0c0-8 4-12 7-16 0 6 3 9 6 10-2-10 1-18 3-26z" fill="#ff7a1a" stroke="#7a2a00" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 30c3 5 8 8 8 15a8 8 0 0 1-16 0c0-5 3-7 5-10 0 3 2 5 3 5z" fill="#f5c518"/></svg>';
function teamAward(title, icon, k, asc, unit, sub, cls) {
  const st = table().filter(s => s.p > 0);
  st.sort((a, b) => asc ? a[k] - b[k] || b.p - a.p || T[a.id].n.localeCompare(T[b.id].n) : b[k] - a[k] || a.p - b.p || T[a.id].n.localeCompare(T[b.id].n));
  let r = 0, prev = null; const R = st.map((s, i) => { if (s[k] !== prev) { r = i + 1; prev = s[k]; } return [r, s]; });
  const lead = R.filter(x => x[0] == 1).map(x => x[1]);
  const per = s => (s[k] / s.p).toFixed(1).replace('.0', '');
  const top = lead.length
    ? `<div class="aw-lead">${lead.map(s => `<button class="aw-p" data-t="${s.id}">${crest(s.id, 34)}<span><b>${T[s.id].n}</b><small>${s.p} game${s.p == 1 ? '' : 's'} played</small></span></button>`).join('')}</div>
       <div class="aw-num"><b>${lead[0][k]}</b><span>${unit}${lead[0][k] == 1 ? '' : 's'}</span><em>${lead.length > 1 ? 'Joint leaders' : 'Leader'}</em></div>`
    : '<p class="sub">No games played yet.</p>';
  return `<article class="aw ${cls}"><header>${icon}<div><h3>${title}</h3><small>${sub}</small></div></header><div class="aw-top">${top}</div>
  <ol class="aw-list">${R.map(([r, s]) => `<li><span class="rk">${r}</span><button class="aw-row" data-t="${s.id}">${crest(s.id, 26)}<span><b>${T[s.id].n}</b><small>${s.p} game${s.p == 1 ? '' : 's'} · ${per(s)} per game</small></span></button><span class="v">${s[k]}</span></li>`).join('')}</ol></article>`;
}
function awards() {
  const have = Object.keys(PLAYERS).map(t => T[t].n);
  const missing = Object.keys(T).filter(t => !PLAYERS[t]).length;
  $('aw-note').textContent = missing ? `Player stats so far from: ${have.join(', ') || 'no clubs yet'}. Other clubs will be added as they send them in.` : 'Player stats from all clubs.';
  $('awards').innerHTML = award('Golden Boot', BOOT, 2, 'goal', 'gb') + award('Playmaker Award', PASS, 3, 'assist', 'pm');
  $('team-awards').innerHTML = teamAward('Firepower', FIRE, 'gf', false, 'goal', 'Most goals scored by a team', 'fp') + teamAward('Brick Wall', WALL, 'ga', true, 'goal', 'Fewest goals conceded by a team', 'bw');
}

// ---------- table views ----------
// [key, chip label, lower is better, column it lives in (or extra)]
const MET = [
  ['pts', 'Points', false, 'Pts'], ['w', 'Most wins', false, 'W'], ['gf', 'Most goals', false, 'GF'],
  ['ga', 'Fewest conceded', true, 'GA'], ['gd', 'Goal difference', false, 'GD'], ['ppg', 'Points per game', false, null],
  ['cs', 'Clean sheets', false, null], ['l', 'Fewest defeats', true, 'L'], ['fp', 'Form (last 5)', false, 'Form']];
let tm = 'pts';
function drawTable(st) {
  const [k, lab, asc, col] = MET.find(x => x[0] == tm);
  const L = tm == 'pts' ? st : st.slice().sort((p, q) => (asc ? p[k] - q[k] : q[k] - p[k]) || p.pos - q.pos);
  let r = 0, prev = null; const rk = L.map((s, i) => { if (tm == 'pts') return s.pos; if (s[k] !== prev) { r = i + 1; prev = s[k]; } return r; });
  const extra = col ? null : (tm == 'ppg' ? 'PPG' : 'CS');
  const fmt = s => tm == 'ppg' ? s.ppg.toFixed(2) : s[k];
  const cols = [['P', s => s.p], ['W', s => s.w], ['D', s => s.d], ['L', s => s.l], ['GF', s => s.gf, 'hx'], ['GA', s => s.ga, 'hx'], ['GD', s => sg(s.gd)], ['Pts', s => s.pts, 'pts'], ['Form', s => form(s.f)]];
  if (extra) cols.splice(0, 0, [extra, fmt, 'pts']);
  const on = h => h == (col || extra);
  const cl = c => [on(c[0]) ? 'hl' : (c[2] || '')].filter(Boolean).join(' ');
  document.querySelector('#tbl thead').innerHTML = `<tr><th>${tm == 'pts' ? 'Pos' : 'Rank'}</th><th>Club</th>${cols.map(c => `<th class="${cl(c)}">${c[0]}</th>`).join('')}</tr>`;
  document.querySelector('#tbl tbody').innerHTML = L.map((s, i) => `<tr data-t="${s.id}" class="${rk[i] == 1 && (tm != 'pts' || s.pts) ? 'top' : ''}"><td><span class="pos">${rk[i]}</span></td><td class="tm"><button data-t="${s.id}">${crest(s.id, 30)}<span class="full">${T[s.id].n}</span><span class="sh">${T[s.id].s}</span></button></td>${cols.map(c => `<td class="${cl(c)}">${c[1](s)}</td>`).join('')}</tr>`).join('');
  $('tkey').textContent = tm == 'pts' ? 'League order: points, then goal difference, then goals scored.' : `Ranked by ${lab.toLowerCase()}${extra == 'PPG' ? ' (points ÷ games played)' : extra == 'CS' ? ' (games without conceding)' : tm == 'fp' ? ' (points from the last 5 games)' : ''}. Level teams share a rank and are listed in league order.`;
  $('tsort').innerHTML = MET.map(x => `<button data-tm="${x[0]}" aria-pressed="${x[0] == tm}">${x[1]}</button>`).join('');
}

// ---------- home ----------
function render() {
  const st = table(), played = M.filter(res).length;
  $('tsub').textContent = `${played} of ${M.length} games played. Tap a club for its full record.`;
  drawTable(st);
  const L = st[0], up = M.filter(m => !res(m) && days(m.d) >= 0), nd = up.length ? up.reduce((x, m) => m.d < x ? m.d : x, up[0].d) : null;
  let b = `<div class="row"><div><div class="lab">Top of the table</div><div class="lcd big">${T[L.id].n}</div></div><div style="text-align:right"><div class="lab">Points</div><div class="lcd big">${L.pts}</div></div></div>`;
  if (nd) {
    const ms = up.filter(m => m.d == nd), d = days(nd), gws = [...new Set(ms.map(m => m.gw))], g = GW.find(x => x.gameweek == gws[0]);
    const full = gws.length == 1 && ms.length == g.matches.length;
    b += `<div class="nx"><div class="row"><span class="lab">Next up · Gameweek ${gws.join(' & ')} · ${fd(nd)}</span><span class="lcd" style="font-size:22px">${d == 0 ? 'TODAY' : d == 1 ? '1 day' : d + ' days'}</span></div>${ms.map(m => `<button data-t="${m.h}"><span class="h">${T[m.h].n} ${crest(m.h, 28)}</span><span class="vs">v</span><span class="a">${crest(m.a, 28)} ${T[m.a].n}</span></button>`).join('')}${full && g.bye ? `<div class="lab">Bye: ${T[g.bye].n}</div>` : ''}</div>`;
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
  const mid = r ? (m.ph ? `<button class="sc" data-m="${m.k}" aria-label="Open match photo">${r[0]} – ${r[1]}</button>` : `<div class="sc">${r[0]} – ${r[1]}</div>`) : '<div class="sc p">v</div>';
  let x = '';
  if (r && r[2] == 'ff') x = '<div class="note">★ Awarded by forfeit</div>';
  if (!r && past) x = '<div class="note">Played – result to follow</div>';
  if (m.d != m.gd) x += `<div class="note">${r || past ? 'Played' : 'Rearranged to'} ${fd(m.d, {weekday: 'long', day: 'numeric', month: 'long'})}</div>`;
  if (m.ph) x += `<button class="mph" data-m="${m.k}"><img src="${m.ph}" alt="" loading="lazy"><span>Match photo</span></button>`;
  return `<div class="m${m.ph ? ' has-ph' : ''}"><button class="t h" data-t="${m.h}">${T[m.h].n} ${crest(m.h, 28)}</button>${mid}<button class="t" data-t="${m.a}">${crest(m.a, 28)} ${T[m.a].n}</button>${x}</div>`;
}
function renderGw() {
  const g = GW[cur], ms = M.filter(m => m.gw == g.gameweek), n = ms.filter(res).length, d = days(g.date);
  const fut = ms.filter(m => !res(m) && days(m.d) >= 0).map(m => days(m.d)).sort((p, q) => p - q);
  const tag = n == ms.length ? '<span class="tag ft">Full time</span>' : fut.length && n ? `<span class="tag">${n} of ${ms.length} played · next ${fut[0] == 0 ? 'today' : 'in ' + fut[0] + ' day' + (fut[0] == 1 ? '' : 's')}</span>` : d < 0 ? '<span class="tag aw">Results to follow</span>' : `<span class="tag">${d == 0 ? 'Today' : 'In ' + d + ' day' + (d == 1 ? '' : 's')}</span>`;
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
    if (m.ph) return `<button class="li li-ph" data-m="${m.k}"><span class="ha" title="${home ? 'Home' : 'Away'}">${home ? 'H' : 'A'}</span><div>${home ? 'v' : '@'} <b>${T[o].n}</b><small>GW${m.gw} · ${fd(m.d)} · Match photo</small></div><div>${right}</div><img src="${m.ph}" alt="" loading="lazy"></button>`;
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

// ---------- match photo viewer ----------
function match(k) {
  const m = M.find(x => x.k == k); if (!m || !m.ph) return;
  const r = res(m);
  $('mpanel').innerHTML = `<button class="x" data-mclose aria-label="Close">×</button>
  <div class="mh"><span class="h">${T[m.h].n} ${crest(m.h, 34)}</span><span class="sc">${r ? r[0] + ' – ' + r[1] : 'v'}</span><span class="a">${crest(m.a, 34)} ${T[m.a].n}</span></div>
  <img class="mimg" src="${m.ph}" alt="${esc(m.cap || T[m.h].n + ' v ' + T[m.a].n)}">
  <p class="mcap">${m.cap ? esc(m.cap) + ' · ' : ''}Gameweek ${m.gw} · ${fd(m.d, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</p>`;
  $('mview').classList.add('on'); document.body.style.overflow = 'hidden'; $('mpanel').querySelector('.x').focus();
}
function mclose() { $('mview').classList.remove('on'); if (!open) document.body.style.overflow = ''; }

// ---------- views & events ----------
function view() {
  const v = ['table', 'fixtures', 'awards'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'table';
  document.querySelectorAll('.view').forEach(x => x.hidden = x.dataset.view != v);
  document.querySelectorAll('.tabs a').forEach(a => a.setAttribute('aria-current', a.dataset.v == v ? 'page' : 'false'));
}
$('crests').innerHTML = Object.keys(T).map(id => `<button data-t="${id}">${crest(id, 44)}<span class="cn">${T[id].n}</span><span class="cs">${T[id].s}</span></button>`).join('');
document.addEventListener('click', e => {
  if (e.target.closest('[data-mclose]')) { mclose(); return; }
  const mk = e.target.closest('[data-m]');
  if (mk) { match(mk.dataset.m); return; }
  if (e.target.closest('[data-close]')) { close(); return; }
  const ps = e.target.closest('[data-s]');
  if (ps) { psort = +ps.dataset.s; const p = $('panel'), sc = p.scrollTop; club(open); p.scrollTop = sc; return; }
  const al = e.target.closest('[data-all]');
  if (al) { const w = al.closest('.aw'), on = al.textContent.startsWith('Show all'); w.querySelectorAll('li.more').forEach(li => li.hidden = !on); al.textContent = on ? 'Show top 10' : 'Show all ' + w.querySelectorAll('.aw-list li').length; return; }
  const tb = e.target.closest('[data-tm]');
  if (tb) { tm = tb.dataset.tm; drawTable(table()); return; }
  const g = e.target.closest('[data-g]');
  if (g) { cur = +g.dataset.g; renderGws(); renderGw(); return; }
  const t = e.target.closest('[data-t]');
  if (t && !e.target.closest('.panel')) club(t.dataset.t);
});
document.addEventListener('keydown', e => { if (e.key != 'Escape') return; if ($('mview').classList.contains('on')) mclose(); else if (open) close(); });
addEventListener('hashchange', view);
view(); render(); awards();
})();
