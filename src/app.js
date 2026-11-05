import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { WORKOUTS, MINIMUM, WEEK, MICRO, MICRO_WINDOWS, KIND_WORDS } from './content.js';

const isNative = Capacitor.isNativePlatform();
const STORE = 'lane-state-v1';
const MIN = 60000;

/* ---------------- dates ---------------- */
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const mondayOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return addDays(x, -((x.getDay() + 6) % 7)); };
const atTime = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
const shortDate = (s) => { const d = parseYmd(s); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- state ---------------- */
const DEFAULTS = () => ({
  profile: { start: 128, goal: 115, height: 196, startDate: ymd(today()) },
  settings: {
    checkinTime: '20:30', weighTime: '09:00', sessionTime: '18:30',
    notifications: true, bridgeUrl: '', bridgeKey: '', addMicro: false,
    bundle: '', stackAfter: '', stackDo: '',
  },
  weeks: {}, checkins: {}, sessions: {}, micro: {}, rehearsed: {}, homeManual: {},
  weights: [], ifthen: [], calendar: null,
});

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return DEFAULTS();
    const s = JSON.parse(raw); const d = DEFAULTS();
    return { ...d, ...s, profile: { ...d.profile, ...s.profile }, settings: { ...d.settings, ...s.settings } };
  } catch { return DEFAULTS(); }
}
let S = load();
let saveTimer;
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { toast('Could not save. Storage is full.'); }
  clearTimeout(saveTimer); saveTimer = setTimeout(reschedule, 800);
}

/* ---------------- photos (IndexedDB) ---------------- */
const photos = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('lane-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('p');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction('p', mode); const req = fn(t.objectStore('p'));
      t.oncomplete = () => res(req ? req.result : undefined); t.onerror = () => rej(t.error);
    });
  };
  return {
    get: (k) => run('readonly', (s) => s.get(k)),
    set: (k, v) => run('readwrite', (s) => s.put(v, k)),
    del: (k) => run('readwrite', (s) => s.delete(k)),
  };
})();

function compressImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const max = 1000; const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Image could not be read')); };
    img.src = url;
  });
}

/* ---------------- derived numbers ---------------- */
const sortedWeights = () => [...S.weights].sort((a, b) => (a.date < b.date ? -1 : 1));

function stats() {
  const p = S.profile; const ws = sortedWeights();
  const current = ws.length ? ws[ws.length - 1].kg : p.start;
  const lost = Math.round((p.start - current) * 10) / 10;
  const span = p.start - p.goal;
  const pct = span > 0 ? clamp(Math.round(((p.start - current) / span) * 100), 0, 100) : 0;
  const toGo = Math.max(0, Math.round((current - p.goal) * 10) / 10);
  const bmi = current / (p.height / 100) ** 2;
  let streak = 0; let d = today();
  if (S.checkins[ymd(d)] !== true) d = addDays(d, -1);
  while (S.checkins[ymd(d)] === true) { streak++; d = addDays(d, -1); }
  let rateWarn = false;
  if (ws.length >= 3) {
    const a = ws[ws.length - 3]; const b = ws[ws.length - 1];
    const weeks = (parseYmd(b.date) - parseYmd(a.date)) / (7 * 864e5);
    if (weeks >= 1 && (a.kg - b.kg) / weeks > 1.2) rateWarn = true;
  }
  return { current, lost, pct, toGo, bmi, streak, rateWarn, goal: p.goal, start: p.start };
}

function daysSinceAnswer() {
  const keys = Object.keys(S.checkins).sort();
  const last = keys.length ? keys[keys.length - 1] : S.profile.startDate;
  return Math.max(0, Math.round((today() - parseYmd(last)) / 864e5));
}

function weekStatus(monday) {
  const key = ymd(monday); const mode = S.weeks[key] && S.weeks[key].mode;
  let sessions = 0; let yes = 0;
  for (let i = 0; i < 7; i++) {
    const k = ymd(addDays(monday, i));
    if (S.sessions[k] && S.sessions[k].done) sessions++;
    if (S.checkins[k] === true) yes++;
  }
  const ok = mode === 'training' ? sessions >= 2 : mode === 'food' ? yes >= 5 : false;
  return { mode, sessions, yes, ok };
}
const modeOf = (date) => { const w = S.weeks[ymd(mondayOf(date))]; return w ? w.mode : null; };

/* ---------------- plan & slots ---------------- */
function workoutFor(date) {
  const plan = WEEK[date.getDay()];
  if (plan.kind === 'session') return { key: plan.workout, ...WORKOUTS[plan.workout] };
  if (plan.kind === 'flex' && S.rehearsed[ymd(addDays(date, -1))]) return { key: 'monShort', ...WORKOUTS.monShort };
  return null;
}
function calDay(k) { return S.calendar && S.calendar.days ? S.calendar.days.find((x) => x.date === k) : null; }
function busyFor(k) {
  const d = calDay(k); if (!d) return [];
  return d.busy.filter((b) => !b.lane).map((b) => [new Date(b.s).getTime(), new Date(b.e).getTime()]);
}
function isHome(k) {
  if (S.homeManual[k] !== undefined) return S.homeManual[k];
  const d = calDay(k); return !!(d && d.location === 'home' && !d.ooo);
}
function findSlot(date, from, to, mins, busy, buffer = 5) {
  let t = atTime(date, from).getTime(); const end = atTime(date, to).getTime();
  while (t + mins * MIN <= end) {
    const s = t; const e = t + mins * MIN;
    if (!busy.some(([bs, be]) => s < be + buffer * MIN && e > bs - buffer * MIN)) return new Date(s);
    t += 15 * MIN;
  }
  return null;
}
function sessionSlot(date) {
  const w = workoutFor(date); if (!w) return null;
  const busy = busyFor(ymd(date)); const pref = S.settings.sessionTime;
  const windows = date.getDay() === 6
    ? [['09:30', '12:30'], ['14:00', '18:00']]
    : [[pref, '21:45'], ['17:00', pref], ['06:30', '08:15']];
  for (const [a, b] of windows) {
    if (a >= b) continue;
    const s = findSlot(date, a, b, w.mins, busy);
    if (s) return { start: s, end: new Date(s.getTime() + w.mins * MIN) };
  }
  return null;
}
function microFor(date, i) {
  const seed = date.getFullYear() * 400 + date.getMonth() * 31 + date.getDate();
  return MICRO[(seed * 3 + i * 4) % MICRO.length];
}
function microSlots(date) {
  const k = ymd(date); if (!isHome(k)) return [];
  const busy = busyFor(k);
  return MICRO_WINDOWS.map(([label, a, b], i) => ({ i, label, start: findSlot(date, a, b, 10, busy), ex: microFor(date, i) }))
    .filter((m) => m.start);
}

/* ---------------- motivation ---------------- */
function motivation(st, seed) {
  const lines = [`You're ${st.pct}% of the way to ${st.goal} kg.`, `${st.toGo} kg to go. Steady beats fast.`];
  if (st.lost > 0) lines.push(`${st.lost} kg down. That's roughly ${Math.round(st.lost * 4)} kg less load on your knee with every step.`);
  if (st.streak > 1) lines.push(`${st.streak}-day streak. Don't trade it for a bag of chips.`);
  lines.push('You show up for your castmates. Show up for yourself too.');
  lines.push('Progress, not perfection. One tap keeps the habit alive.');
  return lines[Math.abs(seed) % lines.length];
}
function checkinTitle(date, missed) {
  if (missed >= 4) return `You've gone quiet for ${missed} days`;
  if (missed >= 2) return 'Quick one: tap in';
  const m = modeOf(date);
  return m === 'training' ? 'Did you move today?' : m === 'food' ? 'Did you keep your food week today?' : 'How did today go?';
}

/* ---------------- notifications ---------------- */
let permission = 'unknown';
async function checkPermission() {
  if (!isNative) { permission = 'web'; return; }
  try { permission = (await LocalNotifications.checkPermissions()).display; } catch { permission = 'denied'; }
}
async function askPermission() {
  if (!isNative) { toast('Reminders work in the installed app.'); return; }
  try { permission = (await LocalNotifications.requestPermissions()).display; } catch { permission = 'denied'; }
  if (permission === 'granted') { toast('Reminders on'); reschedule(); } else toast('Reminders are off. You can allow them in Android settings.');
  render();
}

function buildSchedule() {
  const now = Date.now(); const st = stats(); const out = []; let id = 1;
  const push = (at, title, body) => {
    if (at && at.getTime() > now + 30000) out.push({ id: id++, title, body, schedule: { at, allowWhileIdle: true }, channelId: 'lane' });
  };
  const missed0 = daysSinceAnswer(); const thisMonday = mondayOf(today());
  for (let d = 0; d < 10; d++) {
    const date = addDays(today(), d); const k = ymd(date); const wd = date.getDay();
    const answered = k in S.checkins; const missed = missed0 + d;
    if (!answered) {
      const body = missed >= 4
        ? 'This is where the long slide usually starts. One tap, then the minimum version. That is all it takes.'
        : motivation(st, d + wd);
      push(atTime(date, S.settings.checkinTime), checkinTitle(date, missed), body);
      if (missed >= 2) push(atTime(date, '12:30'), 'Still here', `Do the 15-minute minimum today. ${motivation(st, d + 2)}`);
    }
    const w = workoutFor(date); const slot = w && sessionSlot(date);
    if (w && slot && !(S.sessions[k] && S.sessions[k].done)) {
      const bundle = S.settings.bundle ? ` Your reward: ${S.settings.bundle}, only while training.` : '';
      push(new Date(slot.start.getTime() - 60 * MIN), `${w.title} at ${fmtTime(slot.start)}`, `${w.mins} minutes.${bundle}`);
    }
    microSlots(date).forEach((m) => {
      if (!(S.micro[k] && S.micro[k][m.i])) push(m.start, `${m.label} move break`, `${m.ex[0]}: ${m.ex[1]}. Two minutes, then back to it.`);
    });
    if (wd === 0) {
      push(atTime(date, S.settings.weighTime), 'Sunday weigh-in', 'Once a week, same time. Add a photo if you like. Future-you will want it.');
      if (!S.weeks[ymd(addDays(date, 1))]) push(atTime(date, '18:00'), 'Pick your week', 'Training week or food week? One tap, and it is decided.');
    }
    if (wd === 1) {
      const prevMonday = addDays(date, -7);
      if (prevMonday <= thisMonday) {
        const prev = weekStatus(prevMonday);
        push(atTime(date, '08:00'), prev.ok ? 'New week' : 'Fresh start',
          prev.ok ? `Last week counted. ${motivation(st, 1)}` : 'Last week slipped. A Monday is a clean slate. One session or one good day restarts everything.');
      } else push(atTime(date, '08:00'), 'New week', motivation(st, 5));
    }
  }
  return out.slice(0, 60);
}

async function reschedule() {
  if (!isNative) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    if (!S.settings.notifications || permission !== 'granted') return;
    const list = buildSchedule();
    if (list.length) await LocalNotifications.schedule({ notifications: list });
  } catch (e) { console.warn('Scheduling failed', e); }
}

/* ---------------- calendar bridge (Google Apps Script) ---------------- */
async function bridge(params) {
  const { bridgeUrl, bridgeKey } = S.settings;
  if (!bridgeUrl || !bridgeKey) throw new Error('Calendar is not connected yet. Add the link and key in Settings.');
  const q = new URLSearchParams({ ...params, key: bridgeKey });
  const res = await fetch(`${bridgeUrl}?${q}`, { redirect: 'follow' });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'The calendar link answered with an error.');
  return data;
}
async function refreshCalendar(silent) {
  try {
    const data = await bridge({ action: 'week', days: 10 });
    S.calendar = { fetchedAt: Date.now(), days: data.days }; save(); render();
    if (!silent) toast('Calendar updated');
  } catch (e) { if (!silent) toast(e.message); }
}
async function addWeekToCalendar() {
  let created = 0; let skipped = 0; let failed = 0;
  toast('Adding sessions…');
  for (let d = 0; d < 7; d++) {
    const date = addDays(today(), d); const w = workoutFor(date); const slot = w && sessionSlot(date);
    const items = [];
    if (slot) items.push({ title: `Lane: ${w.title}`, start: slot.start, end: slot.end, desc: w.exercises.map((e) => `${e[0]}: ${e[1]}`).join('\n') });
    if (S.settings.addMicro) microSlots(date).forEach((m) => items.push({ title: `Lane: ${m.ex[0]}`, start: m.start, end: new Date(m.start.getTime() + 10 * MIN), desc: m.ex[1] }));
    for (const it of items) {
      try {
        const r = await bridge({ action: 'add', title: it.title, start: it.start.toISOString(), end: it.end.toISOString(), desc: it.desc });
        r.skipped ? skipped++ : created++;
      } catch { failed++; }
    }
  }
  toast(`${created} added${skipped ? `, ${skipped} already there` : ''}${failed ? `, ${failed} failed` : ''}`);
  refreshCalendar(true);
}

/* ---------------- backup ---------------- */
async function exportBackup() {
  const pics = {};
  for (const w of S.weights) if (w.photoId) { const p = await photos.get(w.photoId); if (p) pics[w.photoId] = p; }
  const json = JSON.stringify({ app: 'lane', version: 1, state: S, photos: pics });
  const name = `lane-backup-${ymd(today())}.json`;
  if (isNative) {
    const f = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: 'Lane backup', url: f.uri });
  } else {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; a.click();
  }
}
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'lane') throw new Error();
    for (const [k, v] of Object.entries(data.photos || {})) await photos.set(k, v);
    S = { ...DEFAULTS(), ...data.state }; save(); render(); toast('Backup restored');
  } catch { toast('That file is not a Lane backup.'); }
}

/* ---------------- UI helpers ---------------- */
let tab = 'today'; let openDay = null; let showMissForm = false;
const app = document.getElementById('app');
function toast(msg) {
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
const exList = (ex) => `<ul class="ex">${ex.map(([n, d]) => `<li><span>${esc(n)}</span><span class="dose">${esc(d)}</span></li>`).join('')}</ul>`;

function laneBlock(st) {
  return `<div class="lane" role="img" aria-label="${st.pct} percent of the way from ${st.start} to ${st.goal} kilos">
    <div class="lane-head"><span class="pct">${st.pct}<small>%</small></span>
      <span class="lane-cap">of the way to ${st.goal} kg<br><b>${st.current} kg</b> now${st.streak ? `, ${st.streak}-day streak` : ''}</span></div>
    <div class="rope"><div class="rope-done" style="width:${st.pct}%"></div><div class="swimmer" style="left:${st.pct}%"></div></div>
    <div class="marks"><span>${st.start}</span><span>${st.goal}</span></div>
  </div>`;
}

function pickWeekBlock(key, label) {
  return `<section><h2>${label}</h2>
    <p class="sub">Choose one. You commit to it for the whole week.</p>
    <div class="choices">
      <button class="choice" data-action="pick" data-week="${key}" data-mode="training"><b>Training week</b><span>Two sessions, plus the minimum on busy days.</span></button>
      <button class="choice" data-action="pick" data-week="${key}" data-mode="food"><b>Food week</b><span>Protein at every meal, no stress snacks in the house.</span></button>
    </div></section>`;
}

/* ---------------- views ---------------- */
function viewToday() {
  const d = today(); const k = ymd(d); const wd = d.getDay(); const st = stats();
  const thisWeek = ymd(mondayOf(d)); const nextWeek = ymd(addDays(mondayOf(d), 7));
  const mode = modeOf(d); const missed = daysSinceAnswer();
  let h = `<header><h1>${longDate(d)}</h1><p class="sub">${mode ? (mode === 'training' ? 'Training week' : 'Food week') : 'No week chosen yet'}</p></header>`;

  if (isNative && permission !== 'granted' && S.settings.notifications) {
    h += `<div class="banner"><span>Reminders keep you on track when motivation dips.</span><button class="btn small" data-action="perm">Turn on reminders</button></div>`;
  }
  h += laneBlock(st);

  if (!S.weeks[thisWeek]) h += pickWeekBlock(thisWeek, 'Pick this week');
  else if (wd === 0 && !S.weeks[nextWeek]) h += pickWeekBlock(nextWeek, 'Pick next week');

  if (wd === 1) {
    const prev = weekStatus(addDays(mondayOf(d), -7));
    if (prev.mode && !prev.ok) h += `<section class="fresh"><h2>Fresh start</h2><p>Last week slipped. That's fine. New week, clean slate: one session or one good day restarts everything.</p></section>`;
  }

  // check-in
  const ans = S.checkins[k];
  h += `<section><h2>${ans === undefined ? checkinTitle(d, missed) : 'Today'}</h2>`;
  if (ans === undefined) {
    if (missed >= 4) h += `<p class="sub">This is where the long slide usually starts. Tap in, then do the minimum. That's it.</p>`;
    h += `<div class="row"><button class="btn big" data-action="checkin" data-v="1">Done</button><button class="btn big ghost" data-action="checkin" data-v="0">Not today</button></div>`;
  } else if (ans) {
    h += `<p class="ok">Logged. ${esc(motivation(st, d.getDate()))}</p><button class="link" data-action="undo">Undo</button>`;
  } else {
    h += `<p>${esc(KIND_WORDS[d.getDate() % KIND_WORDS.length])}</p>`;
    if (showMissForm) {
      h += `<div class="ifthen"><label>If <input id="if" placeholder="work runs late tomorrow"></label>
        <label>then I will <input id="then" placeholder="do the 15-minute minimum at home"></label>
        <button class="btn small" data-action="saveIfThen">Save plan</button></div>`;
    } else h += `<button class="link" data-action="missForm">Make an if-then plan for tomorrow</button>`;
    h += ` <button class="link" data-action="undo">Undo</button>`;
  }
  h += `</section>`;

  // today's plan
  const plan = WEEK[wd]; const w = workoutFor(d);
  h += `<section><h2>Today's training</h2>`;
  if (w) {
    const slot = sessionSlot(d); const done = S.sessions[k] && S.sessions[k].done;
    h += `<p><b>${esc(w.title)}</b>, ${w.mins} min${slot ? ` at ${fmtTime(slot.start)}` : ''}. <span class="sub">${esc(w.style)}</span></p>`;
    if (S.settings.bundle) h += `<p class="sub">Only while training: ${esc(S.settings.bundle)}</p>`;
    h += done ? `<p class="ok">Done (${S.sessions[k].kind === 'minimum' ? 'minimum' : 'full session'}).</p><button class="link" data-action="sessionUndo">Undo</button>`
      : `<div class="row"><button class="btn" data-action="session" data-kind="full">Did the session</button><button class="btn ghost" data-action="session" data-kind="minimum">Did the minimum</button></div>
         <button class="link" data-action="goDay" data-day="${k}">Show the exercises</button>`;
  } else {
    h += `<p>${esc(plan.text)}</p>`;
    if (plan.kind !== 'musical') {
      const done = S.sessions[k] && S.sessions[k].done;
      h += done ? `<p class="ok">Minimum done.</p><button class="link" data-action="sessionUndo">Undo</button>`
        : `<button class="btn ghost" data-action="session" data-kind="minimum">I did the minimum anyway</button>`;
    }
  }
  if (wd === 0 || wd === 1) {
    const rk = wd === 0 ? k : ymd(addDays(d, -1)); const on = !!S.rehearsed[rk];
    h += `<label class="toggle"><input type="checkbox" data-action="rehearsed" data-key="${rk}" ${on ? 'checked' : ''}> I rehearsed ${wd === 0 ? 'today' : 'yesterday'}${wd === 0 ? ' (unlocks a short session tomorrow)' : ''}</label>`;
  }
  h += `</section>`;

  // home day
  const home = isHome(k); const slots = microSlots(d);
  h += `<section><h2>Home day moves</h2>`;
  if (home && slots.length) {
    h += `<p class="sub">Three short no-equipment moves, fitted between your meetings.</p><ul class="micro">${slots.map((m) => {
      const done = S.micro[k] && S.micro[k][m.i];
      return `<li><label><input type="checkbox" data-action="micro" data-i="${m.i}" ${done ? 'checked' : ''}><span><b>${fmtTime(m.start)}</b> ${esc(m.ex[0])}, ${esc(m.ex[1])}</span></label></li>`;
    }).join('')}</ul>`;
  } else if (home) h += `<p class="sub">Your day is fully booked. Squeeze in the minimum instead.</p>`;
  else h += `<p class="sub">${calDay(k) ? 'Your calendar says office today.' : 'Not marked as a home day.'}</p>`;
  h += `<label class="toggle"><input type="checkbox" data-action="homeToggle" ${home ? 'checked' : ''}> I'm working from home today</label></section>`;

  // habits
  const st2 = S.settings;
  h += `<section><h2>Your habits</h2>`;
  if (st2.stackAfter && st2.stackDo) h += `<p>After <b>${esc(st2.stackAfter)}</b>, I do <b>${esc(st2.stackDo)}</b>.</p>`;
  if (!st2.bundle || !st2.stackAfter) h += `<p class="sub">Set your habit stack and training reward in Settings.</p>`;
  if (S.ifthen.length) h += `<p class="sub">Your if-then plans:</p><ul class="plain">${S.ifthen.slice(-3).reverse().map((p) => `<li>If ${esc(p.if)}, then ${esc(p.then)}.</li>`).join('')}</ul>`;
  h += `<details><summary>Minimum version (15 min)</summary>${exList(MINIMUM.exercises)}<p class="sub">${MINIMUM.note}</p></details></section>`;
  return h;
}

function viewTrain() {
  const mon = mondayOf(today()); const ws = weekStatus(mon); const connected = S.settings.bridgeUrl && S.settings.bridgeKey;
  let h = `<header><h1>This week</h1><p class="sub">${ws.mode === 'training' ? `Training week: ${ws.sessions} of 2 sessions done` : ws.mode === 'food' ? `Food week: ${ws.yes} of 5 good days` : 'Pick your week on the Today tab'}</p></header>`;
  h += `<ol class="week">`;
  for (let i = 0; i < 7; i++) {
    const date = addDays(mon, i); const k = ymd(date); const plan = WEEK[date.getDay()]; const w = workoutFor(date);
    const slot = w && sessionSlot(date); const done = S.sessions[k] && S.sessions[k].done; const isToday = k === ymd(today());
    const title = w ? w.title : plan.title;
    h += `<li class="${isToday ? 'is-today' : ''} ${done ? 'is-done' : ''}"><details ${openDay === k ? 'open' : ''}>
      <summary><span class="day">${DAYS[date.getDay()].slice(0, 3)} ${date.getDate()}</span><span class="what">${esc(title)}</span><span class="when">${done ? 'Done' : slot ? fmtTime(slot.start) : ''}</span></summary>
      ${w ? `<p class="sub">${esc(w.style)}, about ${w.mins} min</p>${exList(w.exercises)}${w.note ? `<p class="sub">${esc(w.note)}</p>` : ''}` : `<p>${esc(plan.text)}</p>`}
      ${isHome(k) ? `<p class="sub">Home day: ${microSlots(date).length} move breaks planned.</p>` : ''}
    </details></li>`;
  }
  h += `</ol>`;
  h += `<section><h2>Google Calendar</h2>`;
  if (connected) {
    h += `<p class="sub">${S.calendar ? `Last synced ${new Date(S.calendar.fetchedAt).toLocaleString()}.` : 'Not synced yet.'} Sessions are placed in free time around your meetings.</p>
      <div class="row"><button class="btn" data-action="addCal">Add next 7 days to calendar</button><button class="btn ghost" data-action="refreshCal">Sync now</button></div>`;
  } else h += `<p class="sub">Connect your calendar in Settings so sessions fit around your meetings and home days are detected.</p>`;
  h += `</section><section><h2>Ground rules</h2><ul class="plain">
    <li>Stop 1–2 reps before failure. Consistency beats heroics.</li>
    <li>Knee pain above 3 out of 10: stop that exercise for today.</li>
    <li>Neck training only with a trainer showing you the form.</li>
    <li>Aim to lose at most about 1 kg a week so it's fat, not muscle.</li></ul></section>`;
  return h;
}

function chart(ws, st) {
  if (ws.length < 2) return `<p class="sub">Your graph appears after two weigh-ins.</p>`;
  const W = 340; const H = 170; const P = 26;
  const kgs = ws.map((w) => w.kg).concat([st.goal]);
  const lo = Math.floor(Math.min(...kgs) - 1); const hi = Math.ceil(Math.max(...kgs) + 1);
  const t0 = parseYmd(ws[0].date).getTime(); const t1 = Math.max(parseYmd(ws[ws.length - 1].date).getTime(), t0 + 864e5);
  const x = (s) => P + ((parseYmd(s).getTime() - t0) / (t1 - t0)) * (W - P * 2);
  const y = (kg) => P / 2 + ((hi - kg) / (hi - lo)) * (H - P * 1.5);
  const pts = ws.map((w) => `${x(w.date).toFixed(1)},${y(w.kg).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight over time">
    <line x1="${P}" x2="${W - P}" y1="${y(st.goal)}" y2="${y(st.goal)}" class="goal"/>
    <text x="${W - P}" y="${y(st.goal) - 5}" text-anchor="end" class="lbl">goal ${st.goal}</text>
    <polyline points="${pts}" class="line"/>
    ${ws.map((w) => `<circle cx="${x(w.date)}" cy="${y(w.kg)}" r="3.5" class="dot"/>`).join('')}
    <text x="${P}" y="${H - 4}" class="lbl">${shortDate(ws[0].date)}</text>
    <text x="${W - P}" y="${H - 4}" text-anchor="end" class="lbl">${shortDate(ws[ws.length - 1].date)}</text>
  </svg>`;
}

function viewProgress() {
  const st = stats(); const ws = sortedWeights(); const withPhotos = ws.filter((w) => w.photoId);
  let h = `<header><h1>Progress</h1><p class="sub">Weigh in once a week, Sunday morning.</p></header>`;
  h += laneBlock(st);
  h += `<section><h2>Weigh-in</h2><div class="weigh">
    <label>Weight (kg)<input id="kg" type="number" inputmode="decimal" step="0.1" min="40" max="250" placeholder="${st.current}"></label>
    <label class="file">Photo (optional)<input id="photo" type="file" accept="image/*" capture="environment"></label>
    <button class="btn" data-action="weigh">Save weigh-in</button></div></section>`;
  h += `<section><h2>Numbers</h2><dl class="stats">
    <div><dt>Start</dt><dd>${st.start}</dd></div><div><dt>Now</dt><dd>${st.current}</dd></div><div><dt>Lost</dt><dd>${st.lost}</dd></div>
    <div><dt>To go</dt><dd>${st.toGo}</dd></div><div><dt>BMI</dt><dd>${st.bmi.toFixed(1)}</dd></div><div><dt>Streak</dt><dd>${st.streak}</dd></div></dl>
    ${st.rateWarn ? `<p class="warn">You're losing more than about 1 kg a week. Keep protein high and mention it to your bariatric team, so it's fat coming off and not muscle.</p>` : ''}
    ${chart(ws, st)}</section>`;
  h += `<section><h2>How far you've come</h2>`;
  if (withPhotos.length >= 2) {
    const a = withPhotos[0]; const b = withPhotos[withPhotos.length - 1];
    h += `<div class="compare"><figure><img data-photo="${a.photoId}" alt="Photo from ${shortDate(a.date)}"><figcaption>${shortDate(a.date)}, ${a.kg} kg</figcaption></figure>
      <figure><img data-photo="${b.photoId}" alt="Photo from ${shortDate(b.date)}"><figcaption>${shortDate(b.date)}, ${b.kg} kg</figcaption></figure></div>`;
  } else h += `<p class="sub">Add a photo with your weigh-ins. On a day you doubt yourself, this is where you'll see the difference.</p>`;
  if (ws.length) {
    h += `<details><summary>All weigh-ins (${ws.length})</summary><ul class="log">${ws.slice().reverse().map((w) => `<li><span>${shortDate(w.date)}</span><span>${w.kg} kg${w.photoId ? ', photo' : ''}</span><button class="link" data-action="delWeight" data-date="${w.date}">Delete</button></li>`).join('')}</ul></details>`;
  }
  h += `</section>`;
  return h;
}

function viewSettings() {
  const s = S.settings; const p = S.profile;
  const field = (path, label, type = 'text', extra = '') => {
    const v = path.split('.').reduce((o, k) => o[k], S);
    return `<label>${label}<input data-bind="${path}" type="${type}" value="${esc(v)}" ${extra}></label>`;
  };
  return `<header><h1>Settings</h1></header>
  <section><h2>Your goal</h2><div class="form">
    ${field('profile.start', 'Starting weight (kg)', 'number', 'step="0.1"')}
    ${field('profile.goal', 'Target weight (kg), from your doctor', 'number', 'step="0.1"')}
    ${field('profile.height', 'Height (cm)', 'number')}</div></section>
  <section><h2>Reminders</h2><div class="form">
    <label class="toggle"><input type="checkbox" data-bind="settings.notifications" ${s.notifications ? 'checked' : ''}> Send reminders</label>
    ${field('settings.checkinTime', 'Daily check-in', 'time')}
    ${field('settings.weighTime', 'Sunday weigh-in', 'time')}
    ${field('settings.sessionTime', 'Preferred training time on weekdays', 'time')}
    <button class="btn ghost" data-action="testNotif">Send a test reminder</button></div></section>
  <section><h2>Habit tricks</h2><div class="form">
    ${field('settings.bundle', 'Reward you only allow while training (temptation bundle)', 'text', 'placeholder="my favourite podcast"')}
    ${field('settings.stackAfter', 'Habit stack: after…', 'text', 'placeholder="my morning coffee"')}
    ${field('settings.stackDo', '…I do', 'text', 'placeholder="10 push-ups"')}</div></section>
  <section><h2>Google Calendar</h2><p class="sub">Paste the web app link and key from your Apps Script setup (see the README).</p><div class="form">
    ${field('settings.bridgeUrl', 'Web app link', 'url', 'placeholder="https://script.google.com/macros/s/…/exec"')}
    ${field('settings.bridgeKey', 'Key', 'text', 'autocomplete="off"')}
    <label class="toggle"><input type="checkbox" data-bind="settings.addMicro" ${s.addMicro ? 'checked' : ''}> Also add home-day move breaks to my calendar</label>
    <button class="btn ghost" data-action="refreshCal">Test and sync</button></div></section>
  <section><h2>Backup</h2><p class="sub">Your data lives only on this phone. Export a backup now and then.</p>
    <div class="row"><button class="btn ghost" data-action="export">Export backup</button><label class="btn ghost file-btn">Restore backup<input id="import" type="file" accept="application/json,.json"></label></div>
    <button class="link danger" data-action="reset">Erase all data</button></section>`;
}

function render() {
  const views = { today: viewToday, train: viewTrain, progress: viewProgress, settings: viewSettings };
  app.innerHTML = views[tab]();
  document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
  app.querySelectorAll('img[data-photo]').forEach(async (img) => { const src = await photos.get(img.dataset.photo); if (src) img.src = src; });
}

/* ---------------- events ---------------- */
document.querySelector('.tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]'); if (!b) return;
  tab = b.dataset.tab; render(); window.scrollTo(0, 0);
});

app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]'); if (!el || el.tagName === 'INPUT') return;
  const k = ymd(today()); const a = el.dataset.action;
  if (a === 'pick') { S.weeks[el.dataset.week] = { mode: el.dataset.mode, chosenAt: Date.now() }; toast(el.dataset.mode === 'training' ? 'Training week. Two sessions.' : 'Food week. You got this.'); }
  else if (a === 'checkin') { S.checkins[k] = el.dataset.v === '1'; showMissForm = false; }
  else if (a === 'undo') { delete S.checkins[k]; }
  else if (a === 'missForm') { showMissForm = true; render(); return; }
  else if (a === 'saveIfThen') {
    const i = document.getElementById('if').value.trim(); const t = document.getElementById('then').value.trim();
    if (!i || !t) { toast('Fill in both parts'); return; }
    S.ifthen.push({ if: i, then: t, date: k }); showMissForm = false; toast('Plan saved');
  }
  else if (a === 'session') { S.sessions[k] = { done: true, kind: el.dataset.kind }; toast('Counted'); }
  else if (a === 'sessionUndo') { delete S.sessions[k]; }
  else if (a === 'goDay') { openDay = el.dataset.day; tab = 'train'; render(); return; }
  else if (a === 'perm') { askPermission(); return; }
  else if (a === 'weigh') {
    const kg = parseFloat(document.getElementById('kg').value);
    if (!(kg > 40 && kg < 250)) { toast('Enter your weight in kg'); return; }
    const file = document.getElementById('photo').files[0]; let photoId;
    if (file) { try { photoId = `p-${k}-${Date.now()}`; await photos.set(photoId, await compressImage(file)); } catch { toast('Photo could not be saved'); photoId = undefined; } }
    const old = S.weights.find((w) => w.date === k);
    if (old && old.photoId && photoId) photos.del(old.photoId);
    S.weights = S.weights.filter((w) => w.date !== k);
    S.weights.push({ date: k, kg, photoId: photoId || (old && old.photoId) });
    toast('Weigh-in saved');
  }
  else if (a === 'delWeight') {
    if (!confirm('Delete this weigh-in?')) return;
    const w = S.weights.find((x) => x.date === el.dataset.date); if (w && w.photoId) photos.del(w.photoId);
    S.weights = S.weights.filter((x) => x.date !== el.dataset.date);
  }
  else if (a === 'refreshCal') { refreshCalendar(false); return; }
  else if (a === 'addCal') { addWeekToCalendar(); return; }
  else if (a === 'testNotif') {
    if (!isNative) { toast('Reminders work in the installed app.'); return; }
    if (permission !== 'granted') { await askPermission(); if (permission !== 'granted') return; }
    await LocalNotifications.schedule({ notifications: [{ id: 9999, title: 'Lane test', body: motivation(stats(), 0), schedule: { at: new Date(Date.now() + 5000) }, channelId: 'lane' }] });
    toast('Test reminder in 5 seconds'); return;
  }
  else if (a === 'export') { exportBackup().catch(() => toast('Export failed')); return; }
  else if (a === 'reset') { if (!confirm('Erase everything in Lane? This cannot be undone.')) return; S = DEFAULTS(); }
  else return;
  save(); render();
});

app.addEventListener('change', async (e) => {
  const el = e.target; const k = ymd(today());
  if (el.dataset.bind) {
    const [grp, key] = el.dataset.bind.split('.');
    S[grp][key] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? parseFloat(el.value) || 0 : el.value.trim();
    save(); if (el.type === 'checkbox' && key === 'notifications' && el.checked && permission !== 'granted') askPermission();
    return;
  }
  const a = el.dataset.action;
  if (a === 'micro') { S.micro[k] = S.micro[k] || [false, false, false]; S.micro[k][+el.dataset.i] = el.checked; save(); return; }
  if (a === 'homeToggle') { S.homeManual[k] = el.checked; save(); render(); return; }
  if (a === 'rehearsed') { S.rehearsed[el.dataset.key] = el.checked; save(); render(); return; }
  if (el.id === 'import' && el.files[0]) importBackup(el.files[0]);
});

/* ---------------- start ---------------- */
async function start() {
  if (isNative) {
    try { await LocalNotifications.createChannel({ id: 'lane', name: 'Lane reminders', importance: 4, vibration: true }); } catch {}
  }
  await checkPermission();
  if (!localStorage.getItem(STORE)) save();
  render(); reschedule();
  if (S.settings.bridgeUrl && (!S.calendar || Date.now() - S.calendar.fetchedAt > 2 * 3600e3)) refreshCalendar(true);
}
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible') return;
  await checkPermission(); render(); reschedule();
  if (S.settings.bridgeUrl && S.calendar && Date.now() - S.calendar.fetchedAt > 2 * 3600e3) refreshCalendar(true);
});
start();
