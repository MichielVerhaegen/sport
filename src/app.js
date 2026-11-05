import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { GOOGLE_CLIENT_ID, REDIRECT_URI, REPO } from './config.js';

const BUILD = Number(__BUILD__) || 0;
import { WORKOUTS, MINIMUM, WEEK, MICRO, MICRO_WINDOWS, KIND_WORDS, DIET, SLOTS, RECIPES, MIXES, HOWTO } from './content.js';

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
    bundle: '', stackAfter: '', stackDo: '', homeDefault: false,
  },
  weeks: {}, checkins: {}, sessions: {}, micro: {}, rehearsed: {}, homeManual: {},
  weights: [], ifthen: [], calendar: null,
  google: null, update: null, homeWorkout: {}, pics: [], exDone: {},
  diet: { start: '', bowl: 'large' },
  mealPlan: {}, mealLog: {}, dietTips: {}, shop: {},
});

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return DEFAULTS();
    const s = JSON.parse(raw); const d = DEFAULTS();
    return { ...d, ...s, profile: { ...d.profile, ...s.profile }, settings: { ...d.settings, ...s.settings }, diet: { ...d.diet, ...s.diet } };
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

function weightAt(date) {
  const ws = sortedWeights(); if (!ws.length) return S.profile.start;
  const before = ws.filter((w) => w.date <= date);
  return (before.length ? before[before.length - 1] : ws[0]).kg;
}
// Every photo: from weigh-ins and from separate uploads, oldest first.
function allPhotos() {
  const list = S.weights.filter((w) => w.photoId).map((w) => ({ id: w.photoId, date: w.date, kg: w.kg, src: 'weight' }));
  S.pics.forEach((p) => list.push({ id: p.id, date: p.date, kg: weightAt(p.date), src: 'pic' }));
  return list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
}
function photoMilestones() {
  const all = allPhotos(); if (!all.length) return null;
  const first = all[0]; const current = all[all.length - 1];
  const lowest = all.reduce((m, p) => (p.kg <= m.kg ? p : m), all[0]);
  return { all, first, lowest, current };
}

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
function trainsAtHome(k) { return S.homeWorkout[k] !== undefined ? S.homeWorkout[k] : !!S.settings.homeDefault; }
function workoutFor(date) {
  const plan = WEEK[date.getDay()];
  const key = plan.kind === 'session' ? plan.workout : plan.kind === 'flex' && S.rehearsed[ymd(addDays(date, -1))] ? 'monShort' : null;
  if (!key) return null;
  const base = WORKOUTS[key]; const k = ymd(date);
  if (base.home && trainsAtHome(k)) return { key, ...base, ...base.home, home: true };
  return { key, ...base, home: false, hasHome: !!base.home };
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

/* ---------------- food: diet, meal plan, shopping list ---------------- */
const recipeById = (id) => RECIPES.find((r) => r.id === id);
const OWN = { id: 'own', title: 'Own bowl', kcal: 0, protein: 0, own: true };
const mixById = (id) => MIXES.find((m) => m.id === id);
const mixItems = (m) => [...m.protein, ...m.volume, m.fat, ...m.flavor];
const mealOf = (id) => {
  if (id === 'own') return OWN;
  if (id && id.startsWith('mix:')) { const m = mixById(id.slice(4)); return m ? { ...m, id, own: true, mix: true } : null; }
  return recipeById(id);
};
function dietDay() { return S.diet.start ? Math.round((today() - parseYmd(S.diet.start)) / 864e5) + 1 : 0; }
function plannedMeals(date) {
  const day = S.mealPlan[ymd(date)] || {};
  return SLOTS.map(([slot, label]) => ({ slot, label, meal: day[slot] ? mealOf(day[slot]) : null }));
}
function dayTotals(date) {
  return plannedMeals(date).reduce((t, m) => (m.meal && !m.meal.own ? { kcal: t.kcal + m.meal.kcal, protein: t.protein + m.meal.protein } : t), { kcal: 0, protein: 0 });
}
const weekPlanCount = (monday) => { let n = 0; for (let i = 0; i < 7; i++) n += plannedMeals(addDays(monday, i)).filter((m) => m.meal).length; return n; };
function autofillWeek(monday) {
  const use = {};
  for (let i = 0; i < 7; i++) plannedMeals(addDays(monday, i)).forEach((m) => { if (m.meal && !m.meal.own) use[m.meal.id] = (use[m.meal.id] || 0) + 1; });
  for (let i = 0; i < 7; i++) {
    const k = ymd(addDays(monday, i)); const day = (S.mealPlan[k] = S.mealPlan[k] || {});
    for (const [slot] of SLOTS) {
      if (day[slot]) continue;
      const prev = i > 0 ? (S.mealPlan[ymd(addDays(monday, i - 1))] || {})[slot] : null;
      const pick = RECIPES.filter((r) => r.slots.includes(slot))
        .sort((a, b) => (use[a.id] || 0) - (use[b.id] || 0) || (a.id === prev) - (b.id === prev))[0];
      if (pick) { day[slot] = pick.id; use[pick.id] = (use[pick.id] || 0) + 1; }
    }
  }
}
const PLURAL = { bag: 'bags', serving: 'servings', packet: 'packets', cup: 'cups' };
function fmtQty(q, u) {
  const n = Math.round(q * 10) / 10;
  if (u === 'pc') return String(n);
  return `${n} ${n > 1 && PLURAL[u] ? PLURAL[u] : u}`;
}
const fmtIng = ([n, q, u, note]) => (q == null ? `${n}, ${note}` : `${fmtQty(q, u)} ${n}${note ? ` (${note})` : ''}`);
function shoppingList(monday) {
  const from = ymd(today()); const items = {}; let meals = 0;
  const add = (key, it) => { if (!items[key]) items[key] = { key, q: 0, meals: 0, ...it }; return items[key]; };
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i); if (ymd(date) < from) continue;
    plannedMeals(date).forEach(({ meal }) => {
      if (!meal || (meal.own && !meal.mix)) return;
      meals++;
      if (meal.mix) { mixItems(meal).forEach((n) => { add(`mix|${n}`, { n, kind: 'mix' }).meals++; }); return; }
      meal.ingredients.forEach(([n, q, u, note]) => {
        if (q == null) { add(`taste|${n}`, { n, kind: 'taste', note }).meals++; return; }
        const it = add(`${n}|${u}`, { n, u, kind: 'qty' }); it.q += q; it.meals++;
      });
    });
  }
  const order = { qty: 0, taste: 1, mix: 2 };
  return { items: Object.values(items).sort((a, b) => order[a.kind] - order[b.kind] || a.n.localeCompare(b.n)), meals };
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
      if (!weekPlanCount(addDays(mondayOf(date), 7))) push(atTime(date, '17:30'), 'Plan your meals', 'Next week has no meals planned. Auto-fill it in one tap and get the shopping list.');
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

/* ---------------- Google sign-in and calendar ---------------- */
const TAG = '#lane-app';
const SCOPES = 'openid email https://www.googleapis.com/auth/calendar.events';
const OAUTH = 'lane-oauth';
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomString = (n) => b64url(crypto.getRandomValues(new Uint8Array(n)));
const signedIn = () => !!(S.google && S.google.refresh);
const legacyBridge = () => !!(S.settings.bridgeUrl && S.settings.bridgeKey);
const calendarReady = () => signedIn() || legacyBridge();

async function googleSignIn() {
  if (!isNative) { toast('Sign-in works in the installed app.'); return; }
  if (!GOOGLE_CLIENT_ID) { toast('Google sign-in is not set up yet. See the README.'); return; }
  const verifier = randomString(48); const state = randomString(16);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  localStorage.setItem(OAUTH, JSON.stringify({ verifier, state }));
  const q = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: 'code', scope: SCOPES,
    code_challenge: challenge, code_challenge_method: 'S256', state, access_type: 'offline', prompt: 'consent',
  });
  await Browser.open({ url: `https://accounts.google.com/o/oauth2/v2/auth?${q}` });
}

async function tokenRequest(params) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, ...params }),
  });
  const data = await res.json();
  if (!res.ok) { const e = new Error(data.error_description || data.error || 'Google sign-in failed'); e.code = data.error; throw e; }
  return data;
}

async function handleRedirect(url) {
  if (!url || !url.startsWith(REDIRECT_URI)) return;
  try { await Browser.close(); } catch {}
  const q = new URL(url.replace(REDIRECT_URI, 'https://x/cb')).searchParams;
  let saved; try { saved = JSON.parse(localStorage.getItem(OAUTH)); } catch {}
  localStorage.removeItem(OAUTH);
  if (q.get('error')) { toast(q.get('error') === 'access_denied' ? 'Sign-in cancelled.' : `Google said: ${q.get('error')}`); return; }
  if (!saved || saved.state !== q.get('state') || !q.get('code')) { toast('Sign-in could not be verified. Try again.'); return; }
  try {
    const t = await tokenRequest({ grant_type: 'authorization_code', code: q.get('code'), code_verifier: saved.verifier, redirect_uri: REDIRECT_URI });
    let email = '';
    try { email = JSON.parse(atob(t.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email || ''; } catch {}
    S.google = { access: t.access_token, expires: Date.now() + t.expires_in * 1000, refresh: t.refresh_token || (S.google && S.google.refresh) || '', email };
    if (!S.google.refresh) throw new Error('Google did not allow ongoing access. Try signing in again.');
    save(); toast(`Signed in${email ? ` as ${email}` : ''}`); render(); refreshCalendar(true);
  } catch (e) { toast(e.message); }
}

function googleSignOut() {
  const t = S.google && (S.google.refresh || S.google.access);
  if (t) fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: t }) }).catch(() => {});
  S.google = null; S.calendar = null; save(); render(); toast('Signed out');
}

async function accessToken() {
  if (!signedIn()) throw new Error('Sign in with Google in Settings first.');
  if (S.google.expires > Date.now() + 60000) return S.google.access;
  try {
    const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: S.google.refresh });
    S.google.access = t.access_token; S.google.expires = Date.now() + t.expires_in * 1000; save();
    return S.google.access;
  } catch (e) {
    if (e.code === 'invalid_grant') { S.google = null; save(); render(); throw new Error('Google sign-in expired. Please sign in again.'); }
    throw e;
  }
}

async function gcal(path, opts = {}) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/${path}`, {
    ...opts, headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Google Calendar answered with an error.');
  return data;
}

async function googleWeek(days) {
  const start = today(); const end = addDays(start, days);
  const map = {}; const order = [];
  for (let i = 0; i < days; i++) { const k = ymd(addDays(start, i)); map[k] = { date: k, location: null, ooo: false, busy: [] }; order.push(k); }
  const datesOf = (ev) => {
    if (ev.start.date) { const out = []; for (let d = parseYmd(ev.start.date); d < parseYmd(ev.end.date); d = addDays(d, 1)) out.push(ymd(d)); return out; }
    return [ymd(new Date(ev.start.dateTime))];
  };
  let pageToken;
  do {
    const q = new URLSearchParams({ timeMin: start.toISOString(), timeMax: end.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250' });
    ['default', 'workingLocation', 'outOfOffice', 'focusTime'].forEach((t) => q.append('eventTypes', t));
    if (pageToken) q.set('pageToken', pageToken);
    const r = await gcal(`events?${q}`);
    (r.items || []).forEach((ev) => {
      if (!ev.start || ev.status === 'cancelled') return;
      if (ev.eventType === 'workingLocation') {
        const t = ev.workingLocationProperties && ev.workingLocationProperties.type;
        const loc = t === 'homeOffice' ? 'home' : t === 'officeLocation' ? 'office' : 'other';
        datesOf(ev).forEach((k) => { if (map[k]) map[k].location = loc; });
        return;
      }
      if (ev.transparency === 'transparent') return;
      if ((ev.attendees || []).some((a) => a.self && a.responseStatus === 'declined')) return;
      if (ev.start.date) { if (ev.eventType === 'outOfOffice') datesOf(ev).forEach((k) => { if (map[k]) map[k].ooo = true; }); return; }
      const k = ymd(new Date(ev.start.dateTime));
      if (map[k]) map[k].busy.push({ s: ev.start.dateTime, e: ev.end.dateTime, lane: String(ev.description || '').includes(TAG) });
    });
    pageToken = r.nextPageToken;
  } while (pageToken);
  return { ok: true, days: order.map((k) => map[k]) };
}

async function googleAdd({ title, start, end, desc }) {
  const q = new URLSearchParams({ timeMin: start.toISOString(), timeMax: end.toISOString(), singleEvents: 'true', maxResults: '50' });
  const existing = await gcal(`events?${q}`);
  if ((existing.items || []).some((ev) => ev.summary === title && ev.start.dateTime && new Date(ev.start.dateTime).getTime() === start.getTime())) return { skipped: true };
  await gcal('events', { method: 'POST', body: JSON.stringify({ summary: title, description: `${desc || ''}\n\n${TAG}`, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } }) });
  return { created: true };
}

// Legacy: Google Apps Script bridge, kept for anyone who already set it up.
async function bridge(params) {
  const { bridgeUrl, bridgeKey } = S.settings;
  if (!bridgeUrl || !bridgeKey) throw new Error('Calendar is not connected yet. Sign in with Google in Settings.');
  const q = new URLSearchParams({ ...params, key: bridgeKey });
  const res = await fetch(`${bridgeUrl}?${q}`, { redirect: 'follow' });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'The calendar link answered with an error.');
  return data;
}
const calendarWeek = (days) => (signedIn() ? googleWeek(days) : bridge({ action: 'week', days }));
const calendarAdd = (it) => (signedIn() ? googleAdd(it)
  : bridge({ action: 'add', title: it.title, start: it.start.toISOString(), end: it.end.toISOString(), desc: it.desc }));

async function refreshCalendar(silent) {
  try {
    const data = await calendarWeek(10);
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
      try { const r = await calendarAdd(it); r.skipped ? skipped++ : created++; } catch { failed++; }
    }
  }
  toast(`${created} added${skipped ? `, ${skipped} already there` : ''}${failed ? `, ${failed} failed` : ''}`);
  refreshCalendar(true);
}

/* ---------------- backup ---------------- */
async function exportBackup() {
  const pics = {};
  for (const w of S.weights) if (w.photoId) { const p = await photos.get(w.photoId); if (p) pics[w.photoId] = p; }
  for (const x of S.pics) { const p = await photos.get(x.id); if (p) pics[x.id] = p; }
  const json = JSON.stringify({ app: 'lane', version: 1, state: { ...S, google: null }, photos: pics });
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
    S = { ...DEFAULTS(), ...data.state, google: S.google }; save(); render(); toast('Backup restored');
  } catch { toast('That file is not a Lane backup.'); }
}

/* ---------------- updates (GitHub releases) ---------------- */
async function checkForUpdate(manual) {
  if (!manual && S.update && Date.now() - S.update.checkedAt < 6 * 3600e3) return;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(res.status === 404 ? 'No builds published yet.' : `GitHub answered ${res.status}.`);
    const r = await res.json();
    const build = Number(String(r.tag_name || '').replace(/^build-/, '')) || 0;
    const asset = (r.assets || []).find((a) => a.name.endsWith('.apk'));
    S.update = { checkedAt: Date.now(), build, url: (asset && asset.browser_download_url) || r.html_url, notes: (r.body || '').slice(0, 200) };
    save(); render();
    if (manual) toast(build > BUILD ? `Build ${build} is available` : 'You have the latest build');
  } catch (e) { if (manual) toast(e.message); }
}
const updateAvailable = () => isNative && S.update && S.update.build > BUILD;
async function openUpdate() {
  const url = S.update && S.update.url; if (!url) return;
  if (isNative) await Browser.open({ url }); else window.open(url, '_blank');
}

/* ---------------- UI helpers ---------------- */
let tab = 'today'; let openDay = null; let showMissForm = false; let planOffset = 0; let overlayOpacity = 0.5;
const pending = { weigh: null, pic: null }; // photos chosen but not saved yet (data URLs)

// Native: Android's own camera/gallery prompt via the Camera plugin. Web: file input.
async function pickPhoto(slot) {
  if (!isNative) { document.getElementById(slot === 'weigh' ? 'photo' : 'pic').click(); return; }
  try {
    const r = await Camera.getPhoto({ resultType: CameraResultType.DataUrl, source: CameraSource.Prompt, quality: 80, width: 1000, height: 1000, correctOrientation: true, promptLabelHeader: 'Photo', promptLabelPhoto: 'Choose from gallery', promptLabelPicture: 'Take a photo' });
    if (r && r.dataUrl) { pending[slot] = r.dataUrl; render(); }
  } catch (e) { if (!/cancel/i.test(String(e && e.message))) toast('Could not get the photo. Check that Lane may use the camera in Android settings.'); }
}
const photoPicker = (slot, label) => `<div class="pick">
  <button class="btn ghost" data-action="pick" data-slot="${slot}">${pending[slot] ? 'Change photo' : label}</button>
  ${pending[slot] ? `<img class="thumb" src="${pending[slot]}" alt="Chosen photo"><button class="link" data-action="unpick" data-slot="${slot}">Remove</button>` : ''}
  <input id="${slot === 'weigh' ? 'photo' : 'pic'}" type="file" accept="image/*" hidden></div>`;
const app = document.getElementById('app');
function toast(msg) {
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
function howTo(name) {
  const n = name.toLowerCase();
  const hit = HOWTO.find(([keys]) => keys.some((k) => n.includes(k)));
  return hit ? hit.slice(1) : null;
}
function setsOf(dose) {
  const m = /^(\d+)(?:[–-](\d+))?\s*(?:rounds\s*)?[×x]/i.exec(dose);
  return m ? clamp(Number(m[2] || m[1]), 1, 10) : 1;
}
const exState = (k, w) => (S.exDone[k] && S.exDone[k][w]) || {};
function exProgress(k, w, exercises) {
  const st = exState(k, w); let done = 0;
  exercises.forEach(([, d], i) => { const n = setsOf(d); const arr = st[i] || []; if (arr.filter(Boolean).length >= n) done++; });
  return { done, total: exercises.length };
}
// ctx = { k: date key, w: workout key } makes the list checkable.
const exList = (ex, ctx) => `<ul class="ex">${ex.map(([n, d], i) => {
  const how = howTo(n);
  const body = how ? `<details class="how"><summary><span>${esc(n)}</span><span class="dose">${esc(d)}</span></summary>
    <p><b>Setup.</b> ${esc(how[0])}</p><p><b>Do it.</b> ${esc(how[1])}</p><p class="sub">${esc(how[2])}</p></details>`
    : `<div class="exname"><span>${esc(n)}</span><span class="dose">${esc(d)}</span></div>`;
  if (!ctx) return `<li>${body}</li>`;
  const n2 = setsOf(d); const arr = exState(ctx.k, ctx.w)[i] || []; const all = arr.filter(Boolean).length >= n2;
  const boxes = Array.from({ length: n2 }, (_, si) => `<input type="checkbox" data-action="set" data-k="${ctx.k}" data-w="${ctx.w}" data-i="${i}" data-s="${si}" ${arr[si] ? 'checked' : ''} aria-label="${esc(n)}, set ${si + 1} of ${n2}">`).join('');
  return `<li class="${all ? 'ex-done' : ''}"><div class="exrow"><span class="sets" title="${n2 === 1 ? 'Done' : `${n2} sets`}">${boxes}</span>${body}</div></li>`;
}).join('')}</ul>`;

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
  if (updateAvailable()) {
    h += `<div class="banner"><span>Lane build ${S.update.build} is ready${S.update.notes ? `: ${esc(S.update.notes.split('\n')[0])}` : ''}.</span><button class="btn small" data-action="update">Download</button></div>`;
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
    if (w.home || w.hasHome) h += `<label class="toggle"><input type="checkbox" data-action="homeWorkout" ${w.home ? 'checked' : ''}> Training at home today (no equipment)</label>`;
    if (S.settings.bundle) h += `<p class="sub">Only while training: ${esc(S.settings.bundle)}</p>`;
    const pr = exProgress(k, w.key, w.exercises);
    if (!done && pr.done) h += `<p class="sub">${pr.done} of ${pr.total} exercises ticked off.</p>`;
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

  // meals
  const dd = dietDay(); const tips = S.dietTips[k] || {}; const log = S.mealLog[k] || {};
  h += `<section><h2>Today's meals</h2>`;
  h += `<p class="sub">${dd >= 1 && dd <= DIET.days ? `Day ${dd} of ${DIET.days} of the filling diet. ` : ''}One bowl per meal, filled to the top. No snacking.</p><ul class="micro">`;
  plannedMeals(d).forEach(({ slot, label, meal }) => {
    if (!meal) { h += `<li class="sub meal-empty">${label}: not planned</li>`; return; }
    h += `<li><label><input type="checkbox" data-action="meal" data-slot="${slot}" ${log[slot] ? 'checked' : ''}><span><b>${label}</b> ${esc(meal.title)}${meal.own ? '' : `, ${meal.kcal} kcal, ${meal.protein} g protein`}${meal.mix ? `<br><span class="sub">${esc(mixItems(meal).join(', '))}</span>` : ''}</span></label></li>`;
  });
  h += `</ul><details><summary>Extra strategies</summary>
    <label class="toggle"><input type="checkbox" data-action="tip" data-tip="soda" ${tips.soda ? 'checked' : ''}> Zero-calorie fizzy drink with each meal</label>
    <label class="toggle"><input type="checkbox" data-action="tip" data-tip="broth" ${tips.broth ? 'checked' : ''}> Broth with one meal</label>
    <label class="toggle"><input type="checkbox" data-action="tip" data-tip="utensil" ${tips.utensil ? 'checked' : ''}> Small utensil (chopsticks or teaspoon)</label></details>
    <button class="link" data-action="goFood">Plan meals and shopping list</button></section>`;

  // home day
  const home = isHome(k); const slots = microSlots(d);
  h += `<section><h2>Home day moves</h2>`;
  if (home && slots.length) {
    h += `<p class="sub">Three short no-equipment moves, fitted between your meetings.</p><ul class="micro">${slots.map((m) => {
      const done = S.micro[k] && S.micro[k][m.i];
      const how = howTo(m.ex[0]);
      return `<li><label><input type="checkbox" data-action="micro" data-i="${m.i}" ${done ? 'checked' : ''}><span><b>${fmtTime(m.start)}</b> ${esc(m.ex[0])}, ${esc(m.ex[1])}</span></label>${how ? `<details class="how micro-how"><summary>How?</summary><p><b>Setup.</b> ${esc(how[0])}</p><p><b>Do it.</b> ${esc(how[1])}</p><p class="sub">${esc(how[2])}</p></details>` : ''}</li>`;
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
  h += `<details><summary>Minimum version (15 min)</summary>${exList(MINIMUM.exercises, { k, w: 'minimum' })}<p class="sub">${MINIMUM.note}</p></details></section>`;
  return h;
}

function viewTrain() {
  const mon = mondayOf(today()); const ws = weekStatus(mon); const connected = calendarReady();
  let h = `<header><h1>This week</h1><p class="sub">${ws.mode === 'training' ? `Training week: ${ws.sessions} of 2 sessions done` : ws.mode === 'food' ? `Food week: ${ws.yes} of 5 good days` : 'Pick your week on the Today tab'}</p></header>`;
  h += `<ol class="week">`;
  for (let i = 0; i < 7; i++) {
    const date = addDays(mon, i); const k = ymd(date); const plan = WEEK[date.getDay()]; const w = workoutFor(date);
    const slot = w && sessionSlot(date); const done = S.sessions[k] && S.sessions[k].done; const isToday = k === ymd(today());
    const title = w ? w.title : plan.title;
    h += `<li class="${isToday ? 'is-today' : ''} ${done ? 'is-done' : ''}"><details ${openDay === k ? 'open' : ''}>
      <summary><span class="day">${DAYS[date.getDay()].slice(0, 3)} ${date.getDate()}</span><span class="what">${esc(title)}</span><span class="when">${done ? 'Done' : slot ? fmtTime(slot.start) : ''}</span></summary>
      ${w ? `<p class="sub">${esc(w.style)}, about ${w.mins} min</p>${w.home || w.hasHome ? `<label class="toggle"><input type="checkbox" data-action="homeWorkout" data-key="${k}" ${w.home ? 'checked' : ''}> At home, no equipment</label>` : ''}<p class="sub">Tick each set as you go. ${(() => { const pr = exProgress(k, w.key, w.exercises); return pr.done ? `${pr.done} of ${pr.total} exercises done.` : ''; })()}</p>${exList(w.exercises, { k, w: w.key })}${w.note ? `<p class="sub">${esc(w.note)}</p>` : ''}` : `<p>${esc(plan.text)}</p>`}
      ${isHome(k) ? `<p class="sub">Home day: ${microSlots(date).length} move breaks planned.</p>` : ''}
    </details></li>`;
  }
  h += `</ol>`;
  h += `<section><h2>Google Calendar</h2>`;
  if (connected) {
    h += `<p class="sub">${S.calendar ? `Last synced ${new Date(S.calendar.fetchedAt).toLocaleString()}.` : 'Not synced yet.'} Sessions are placed in free time around your meetings.</p>
      <div class="row"><button class="btn" data-action="addCal">Add next 7 days to calendar</button><button class="btn ghost" data-action="refreshCal">Sync now</button></div>`;
  } else h += `<p class="sub">Sign in with Google in Settings so sessions fit around your meetings and home days are detected.</p>`;
  h += `</section><section><h2>Ground rules</h2><ul class="plain">
    <li>Stop 1–2 reps before failure. Consistency beats heroics.</li>
    <li>Knee pain above 3 out of 10: stop that exercise for today.</li>
    <li>Neck training only with a trainer showing you the form.</li>
    <li>Aim to lose at most about 1 kg a week so it's fat, not muscle.</li></ul></section>`;
  return h;
}

function viewFood() {
  const d = today(); const day = dietDay(); const mon = addDays(mondayOf(d), planOffset * 7);
  const bowl = DIET.bowls[S.diet.bowl] || DIET.bowls.large;
  let h = `<header><h1>Food</h1><p class="sub">The 30-day filling diet: lose fat without going hungry.</p></header>`;

  // diet status
  h += `<div class="lane">`;
  if (!day) {
    h += `<p><b>Ready when you are.</b> Three meals a day, each from one big bowl, filled to the top with approved foods.</p>
      <button class="btn" data-action="startDiet">Start day 1 today</button>`;
  } else if (day <= DIET.days) {
    h += `<div class="lane-head"><span class="pct">${day}<small>/${DIET.days}</small></span><span class="lane-cap">days of the filling diet<br><b>${bowl.label}</b></span></div>
      <div class="rope"><div class="rope-done" style="width:${Math.round((day / DIET.days) * 100)}%"></div><div class="swimmer" style="left:${Math.round((day / DIET.days) * 100)}%"></div></div>`;
  } else {
    h += `<p class="ok">30 days done.</p><p class="sub">Weigh in, then keep going with the same bowl, or restart.</p>
      <button class="btn ghost" data-action="startDiet">Restart from today</button>`;
  }
  h += `</div>`;
  h += `<p class="sub care">${esc(DIET.careNote)}</p>`;

  // planner
  const totalPlanned = weekPlanCount(mon);
  h += `<section><h2>Meal plan</h2>
    <div class="seg" role="group" aria-label="Week">
      <button data-action="planWeek" data-off="0" aria-pressed="${planOffset === 0}">This week</button>
      <button data-action="planWeek" data-off="1" aria-pressed="${planOffset === 1}">Next week</button></div>
    <ol class="plan">`;
  for (let i = 0; i < 7; i++) {
    const date = addDays(mon, i); const k = ymd(date); const t = dayTotals(date); const plan = S.mealPlan[k] || {};
    h += `<li class="${k === ymd(d) ? 'is-today' : ''}"><div class="plan-head"><b>${DAYS[date.getDay()].slice(0, 3)} ${date.getDate()}</b>${t.kcal ? `<span class="sub">${t.kcal} kcal, ${t.protein} g protein</span>` : ''}</div>`;
    SLOTS.forEach(([slot, label]) => {
      h += `<label class="slot"><span>${label}</span><select data-action="plan" data-date="${k}" data-slot="${slot}" aria-label="${label} on ${DAYS[date.getDay()]} ${date.getDate()}">
        <option value="">Not planned</option>
        ${RECIPES.map((r) => `<option value="${r.id}" ${plan[slot] === r.id ? 'selected' : ''}>${esc(r.title)}</option>`).join('')}
        <optgroup label="Bowl mixes">${MIXES.filter((m) => m.slots.includes(slot)).map((m) => `<option value="mix:${m.id}" ${plan[slot] === `mix:${m.id}` ? 'selected' : ''}>${esc(m.title)}</option>`).join('')}</optgroup>
        <option value="own" ${plan[slot] === 'own' ? 'selected' : ''}>Own bowl (approved foods)</option></select></label>`;
    });
    h += `</li>`;
  }
  h += `</ol><div class="row"><button class="btn" data-action="autofill">Auto-fill empty meals</button>${totalPlanned ? '<button class="btn ghost" data-action="clearWeek">Clear week</button>' : ''}</div></section>`;

  // shopping list pointer
  const shopCount = shoppingList(mon).items.length;
  h += `<section><h2>Shopping list</h2><p class="sub">${shopCount ? `${shopCount} items for the planned meals${planOffset === 0 ? ' from today' : ''}.` : 'Plan some meals and the list builds itself.'}</p>
    <button class="btn ghost" data-action="goShop">Open the shopping list</button></section>`;

  // bowl mixes
  h += `<section><h2>Bowl mixes</h2><p class="sub">Ingredients that work together, built only from the approved list: protein, a big volume base, one fat pick, and flavour. Pick them in the meal plan above.</p>`;
  MIXES.forEach((m) => {
    h += `<details><summary>${esc(m.title)}<span class="sub"> ${m.slots.join(' / ')}</span></summary>
      <dl class="mix"><dt>Protein</dt><dd>${esc(m.protein.join(', '))}</dd><dt>Volume</dt><dd>${esc(m.volume.join(', '))}</dd>
      <dt>Fat (pick 1)</dt><dd>${esc(m.fat)}</dd><dt>Flavour</dt><dd>${esc(m.flavor.join(', '))}</dd></dl>
      <p class="sub">${esc(m.tip)}</p></details>`;
  });
  h += `</section>`;

  // recipes
  h += `<section><h2>Recipes</h2><p class="sub">Each makes one bowl.</p>`;
  RECIPES.forEach((r) => {
    h += `<details><summary>${esc(r.title)}<span class="sub"> ${r.kcal} kcal, ${r.protein} g protein</span></summary>
      <p class="sub">${r.kcal} kcal · ${r.protein} g protein · ${r.carbs} g carbs · ${r.fat} g fat</p>
      <ul class="plain">${r.ingredients.map((i) => `<li>${esc(fmtIng(i))}</li>`).join('')}</ul>
      <ol class="steps">${r.steps.map(([a, b]) => `<li><b>${esc(a)}.</b> ${esc(b)}</li>`).join('')}</ol></details>`;
  });
  h += `</section>`;

  // guide
  h += `<section><h2>Diet guide</h2>
    <details><summary>The three rules</summary><ol class="steps">${DIET.rules.map(([a, b]) => `<li><b>${esc(a)}.</b> ${esc(b)}</li>`).join('')}</ol>
      <p class="sub">Your bowl: ${esc(bowl.label)}, ${esc(bowl.detail)}. Change it in Settings.</p></details>
    <details><summary>Approved foods</summary>${DIET.foods.map((c) => `<h3>${esc(c.name)} <span class="sub">${esc(c.amount)}</span></h3>
      ${c.groups.map(([label, items]) => `<p>${label ? `<b>${esc(label)}:</b> ` : ''}${items.map(esc).join(', ')}.</p>`).join('')}`).join('')}</details>
    <details><summary>Extra strategies</summary><ol class="steps">${DIET.strategies.map(([a, b]) => `<li><b>${esc(a)}.</b> ${esc(b)}</li>`).join('')}</ol></details>
    <details><summary>FAQ</summary>${DIET.faq.map(([q, a]) => `<p><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}</details>
    <p class="sub">Based on the 30-Day Filling Diet by Built With Science. For personal use.</p></section>`;
  return h;
}

function viewShop() {
  const d = today(); const mon = addDays(mondayOf(d), planOffset * 7); const wk = ymd(mon);
  const shop = shoppingList(mon); const checked = S.shop[wk] || {};
  const got = shop.items.filter((it) => checked[it.key]).length;
  let h = `<header><h1>Shopping</h1><p class="sub">${shop.items.length ? `${got} of ${shop.items.length} items, for ${shop.meals} planned meal${shop.meals === 1 ? '' : 's'}${planOffset === 0 ? ' from today' : ''}.` : 'Everything you need for the planned meals.'}</p></header>`;
  h += `<div class="seg" role="group" aria-label="Week">
      <button data-action="planWeek" data-off="0" aria-pressed="${planOffset === 0}">This week</button>
      <button data-action="planWeek" data-off="1" aria-pressed="${planOffset === 1}">Next week</button></div>`;
  if (!shop.items.length) {
    h += `<section><p class="sub">No meals planned for this week yet.</p><button class="btn" data-action="goFood">Plan meals</button></section>`;
    return h;
  }
  const groups = [['qty', 'Ingredients', 'Amounts added up over the week.'], ['taste', 'To taste', 'Check you have these at home.'], ['mix', 'For your bowl mixes', 'Amounts are up to you, within the diet rules.']];
  groups.forEach(([kind, title, sub]) => {
    const list = shop.items.filter((it) => it.kind === kind); if (!list.length) return;
    h += `<section><h2>${title}</h2><p class="sub">${sub}</p><ul class="micro shop">${list.map((it) => `<li><label><input type="checkbox" data-action="shop" data-week="${wk}" data-key="${esc(it.key)}" ${checked[it.key] ? 'checked' : ''}><span class="${checked[it.key] ? 'got' : ''}"><span class="it">${esc(it.n)}${it.kind === 'qty' ? ` <b>${fmtQty(it.q, it.u)}</b>` : it.note ? `, ${esc(it.note)}` : ''}</span><small>${it.meals} meal${it.meals === 1 ? '' : 's'}</small></span></label></li>`).join('')}</ul></section>`;
  });
  h += `<section><div class="row"><button class="btn ghost" data-action="shopReset" data-week="${wk}">Uncheck everything</button><button class="btn ghost" data-action="goFood">Change the plan</button></div></section>`;
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
    <label>Photo (optional)</label>${photoPicker('weigh', 'Take or choose a photo')}
    <button class="btn" data-action="weigh">Save weigh-in</button></div></section>`;
  h += `<section><h2>Numbers</h2><dl class="stats">
    <div><dt>Start</dt><dd>${st.start}</dd></div><div><dt>Now</dt><dd>${st.current}</dd></div><div><dt>Lost</dt><dd>${st.lost}</dd></div>
    <div><dt>To go</dt><dd>${st.toGo}</dd></div><div><dt>BMI</dt><dd>${st.bmi.toFixed(1)}</dd></div><div><dt>Streak</dt><dd>${st.streak}</dd></div></dl>
    ${st.rateWarn ? `<p class="warn">You're losing more than about 1 kg a week. Keep protein high and mention it to your bariatric team, so it's fat coming off and not muscle.</p>` : ''}
    ${chart(ws, st)}</section>`;
  const pm = photoMilestones();
  h += `<section><h2>How far you've come</h2>`;
  h += `<div class="weigh"><label>Add a photo (any day)</label>${photoPicker('pic', 'Take or choose a photo')}
    <label>Taken on<input id="picDate" type="date" value="${ymd(today())}" max="${ymd(today())}"></label>
    <button class="btn ghost" data-action="addPic">Save photo</button></div>`;
  if (pm) {
    const card = (p, label) => `<figure><img data-photo="${p.id}" alt="${label} photo, ${shortDate(p.date)}"><figcaption><b>${label}</b><br>${shortDate(p.date)}, ${p.kg} kg</figcaption></figure>`;
    const same = (x, y) => x.id === y.id;
    h += `<div class="compare three">${card(pm.first, 'First')}${same(pm.lowest, pm.first) || same(pm.lowest, pm.current) ? '' : card(pm.lowest, 'Lowest')}${same(pm.current, pm.first) ? '' : card(pm.current, 'Now')}</div>`;
    if (!same(pm.first, pm.current)) {
      h += `<p class="sub">Overlay: slide to fade between your first photo and now. Take photos in the same spot and pose for the best effect.</p>
        <div class="overlay"><img data-photo="${pm.first.id}" alt="First photo"><img id="overlayTop" data-photo="${pm.current.id}" alt="Current photo" style="opacity:${overlayOpacity}"></div>
        <div class="fader"><span>${shortDate(pm.first.date)}</span><input id="fade" type="range" min="0" max="100" value="${Math.round(overlayOpacity * 100)}" aria-label="Fade between first and current photo"><span>${shortDate(pm.current.date)}</span></div>`;
    } else h += `<p class="sub">Add a second photo later and you can fade between then and now.</p>`;
    h += `<details><summary>All photos (${pm.all.length})</summary><ul class="log">${pm.all.slice().reverse().map((p) => `<li><span>${shortDate(p.date)}</span><span>${p.kg} kg${p.src === 'weight' ? ', weigh-in' : ''}</span>${p.src === 'pic' ? `<button class="link" data-action="delPic" data-id="${p.id}">Delete</button>` : '<span class="sub">with weigh-in</span>'}</li>`).join('')}</ul></details>`;
  } else h += `<p class="sub">Add a photo now and then. On a day you doubt yourself, this is where you'll see the difference.</p>`;
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
  <section><h2>Training</h2><div class="form">
    <label class="toggle"><input type="checkbox" data-bind="settings.homeDefault" ${s.homeDefault ? 'checked' : ''}> I usually train at home (no equipment). You can switch per day on the Today tab.</label></div></section>
  <section><h2>Habit tricks</h2><div class="form">
    ${field('settings.bundle', 'Reward you only allow while training (temptation bundle)', 'text', 'placeholder="my favourite podcast"')}
    ${field('settings.stackAfter', 'Habit stack: after…', 'text', 'placeholder="my morning coffee"')}
    ${field('settings.stackDo', '…I do', 'text', 'placeholder="10 push-ups"')}</div></section>
  <section><h2>Google Calendar</h2>
    ${signedIn()
      ? `<p>Signed in${S.google.email ? ` as <b>${esc(S.google.email)}</b>` : ''}.</p><p class="sub">Lane reads your meetings and working location, and adds sessions to your calendar.</p>
         <div class="row"><button class="btn ghost" data-action="refreshCal">Sync now</button><button class="btn ghost" data-action="googleOut">Sign out</button></div>`
      : `<p class="sub">Sign in once with your Google account so sessions fit around your meetings and home days are detected.</p>
         <button class="btn" data-action="googleIn">Sign in with Google</button>`}
    ${calendarReady() ? `<label class="toggle"><input type="checkbox" data-bind="settings.addMicro" ${s.addMicro ? 'checked' : ''}> Also add home-day move breaks to my calendar</label>` : ''}
    <details><summary>Advanced: Apps Script link</summary><p class="sub">Only if you set up the old Apps Script bridge. Sign-in above is simpler.</p><div class="form">
      ${field('settings.bridgeUrl', 'Web app link', 'url', 'placeholder="https://script.google.com/macros/s/…/exec"')}
      ${field('settings.bridgeKey', 'Key', 'text', 'autocomplete="off"')}</div></details></section>
  <section><h2>Filling diet</h2><div class="form">
    <label>Bowl size<select data-bind="diet.bowl">${Object.entries(DIET.bowls).map(([id, b]) => `<option value="${id}" ${S.diet.bowl === id ? 'selected' : ''}>${esc(b.label)}</option>`).join('')}</select></label>
    ${field('diet.start', 'Day 1 of the 30 days (empty = not started)', 'date')}</div></section>
  <section><h2>Backup</h2><p class="sub">Your data lives only on this phone. Export a backup now and then.</p>
    <div class="row"><button class="btn ghost" data-action="export">Export backup</button><label class="btn ghost file-btn">Restore backup<input id="import" type="file" accept="application/json,.json"></label></div>
    <button class="link danger" data-action="reset">Erase all data</button></section>
  <section><h2>App updates</h2><p class="sub">You have build ${BUILD || 'dev'}.${S.update ? ` Latest published: build ${S.update.build}, checked ${new Date(S.update.checkedAt).toLocaleString()}.` : ''} Lane checks a few times a day and tells you on the Today tab.</p>
    <div class="row">${updateAvailable() ? `<button class="btn" data-action="update">Download build ${S.update.build}</button>` : ''}<button class="btn ghost" data-action="checkUpdate">Check for updates</button></div></section>`;
}

function render() {
  const views = { today: viewToday, train: viewTrain, food: viewFood, shop: viewShop, progress: viewProgress, settings: viewSettings };
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
  else if (a === 'goFood') { tab = 'food'; render(); window.scrollTo(0, 0); return; }
  else if (a === 'goShop') { tab = 'shop'; render(); window.scrollTo(0, 0); return; }
  else if (a === 'startDiet') { S.diet.start = k; toast('Day 1. One bowl, filled to the top.'); }
  else if (a === 'planWeek') { planOffset = +el.dataset.off; render(); return; }
  else if (a === 'autofill') { autofillWeek(addDays(mondayOf(today()), planOffset * 7)); toast('Meals filled in'); }
  else if (a === 'clearWeek') {
    if (!confirm('Clear all meals this week?')) return;
    for (let i = 0; i < 7; i++) delete S.mealPlan[ymd(addDays(addDays(mondayOf(today()), planOffset * 7), i))];
  }
  else if (a === 'shopReset') { delete S.shop[el.dataset.week]; }
  else if (a === 'perm') { askPermission(); return; }
  else if (a === 'weigh') {
    const kg = parseFloat(document.getElementById('kg').value);
    if (!(kg > 40 && kg < 250)) { toast('Enter your weight in kg'); return; }
    const file = document.getElementById('photo').files[0]; let photoId;
    if (pending.weigh || file) {
      try { photoId = `p-${k}-${Date.now()}`; await photos.set(photoId, pending.weigh || await compressImage(file)); pending.weigh = null; }
      catch { toast('Photo could not be saved'); photoId = undefined; }
    }
    const old = S.weights.find((w) => w.date === k);
    if (old && old.photoId && photoId) photos.del(old.photoId);
    S.weights = S.weights.filter((w) => w.date !== k);
    S.weights.push({ date: k, kg, photoId: photoId || (old && old.photoId) });
    toast('Weigh-in saved');
  }
  else if (a === 'pick') { pickPhoto(el.dataset.slot); return; }
  else if (a === 'unpick') { pending[el.dataset.slot] = null; render(); return; }
  else if (a === 'addPic') {
    const file = document.getElementById('pic').files[0]; const date = document.getElementById('picDate').value || k;
    if (!pending.pic && !file) { toast('Take or choose a photo first'); return; }
    try { const id = `x-${date}-${Date.now()}`; await photos.set(id, pending.pic || await compressImage(file)); pending.pic = null; S.pics.push({ id, date }); toast('Photo saved'); }
    catch { toast('Photo could not be saved'); return; }
  }
  else if (a === 'delPic') {
    if (!confirm('Delete this photo?')) return;
    photos.del(el.dataset.id); S.pics = S.pics.filter((p) => p.id !== el.dataset.id);
  }
  else if (a === 'delWeight') {
    if (!confirm('Delete this weigh-in?')) return;
    const w = S.weights.find((x) => x.date === el.dataset.date); if (w && w.photoId) photos.del(w.photoId);
    S.weights = S.weights.filter((x) => x.date !== el.dataset.date);
  }
  else if (a === 'update') { openUpdate(); return; }
  else if (a === 'checkUpdate') { toast('Checking…'); checkForUpdate(true); return; }
  else if (a === 'googleIn') { googleSignIn().catch((e) => toast(e.message)); return; }
  else if (a === 'googleOut') { if (!confirm('Sign out of Google?')) return; googleSignOut(); return; }
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

app.addEventListener('input', (e) => {
  if (e.target.id === 'fade') { overlayOpacity = e.target.value / 100; const t = document.getElementById('overlayTop'); if (t) t.style.opacity = overlayOpacity; }
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
  if (a === 'plan') {
    const day = (S.mealPlan[el.dataset.date] = S.mealPlan[el.dataset.date] || {});
    if (el.value) day[el.dataset.slot] = el.value; else delete day[el.dataset.slot];
    save(); render(); return;
  }
  if (a === 'meal') { S.mealLog[k] = S.mealLog[k] || {}; S.mealLog[k][el.dataset.slot] = el.checked; save(); return; }
  if (a === 'tip') { S.dietTips[k] = S.dietTips[k] || {}; S.dietTips[k][el.dataset.tip] = el.checked; save(); return; }
  if (a === 'shop') { S.shop[el.dataset.week] = S.shop[el.dataset.week] || {}; S.shop[el.dataset.week][el.dataset.key] = el.checked; save(); render(); return; }
  if (a === 'micro') { S.micro[k] = S.micro[k] || [false, false, false]; S.micro[k][+el.dataset.i] = el.checked; save(); return; }
  if (a === 'set') {
    const { k: dk, w, i, s: si } = el.dataset;
    S.exDone[dk] = S.exDone[dk] || {}; const ws = (S.exDone[dk][w] = S.exDone[dk][w] || {}); const arr = (ws[i] = ws[i] || []);
    arr[+si] = el.checked; if (tab === 'train') openDay = dk;
    const list = w === 'minimum' ? MINIMUM.exercises : (workoutFor(parseYmd(dk)) || {}).exercises;
    if (list && dk === k && el.checked && !(S.sessions[k] && S.sessions[k].done)) {
      const pr = exProgress(dk, w, list);
      if (pr.done === pr.total) { S.sessions[k] = { done: true, kind: w === 'minimum' ? 'minimum' : 'full' }; toast(w === 'minimum' ? 'Minimum done. Counted.' : 'Whole session done. Counted.'); }
    }
    save(); render(); return;
  }
  if (a === 'homeWorkout') { S.homeWorkout[el.dataset.key || k] = el.checked; if (el.dataset.key) openDay = el.dataset.key; save(); render(); return; }
  if (a === 'homeToggle') { S.homeManual[k] = el.checked; save(); render(); return; }
  if (a === 'rehearsed') { S.rehearsed[el.dataset.key] = el.checked; save(); render(); return; }
  if ((el.id === 'photo' || el.id === 'pic') && el.files[0]) {
    try { pending[el.id === 'photo' ? 'weigh' : 'pic'] = await compressImage(el.files[0]); render(); } catch { toast('Image could not be read'); }
    return;
  }
  if (el.id === 'import' && el.files[0]) importBackup(el.files[0]);
});

/* ---------------- start ---------------- */
async function start() {
  if (isNative) {
    try { await LocalNotifications.createChannel({ id: 'lane', name: 'Lane reminders', importance: 4, vibration: true }); } catch {}
  }
  await checkPermission();
  if (!localStorage.getItem(STORE)) save();
  render(); reschedule(); checkForUpdate(false);
  if (isNative) {
    CapApp.addListener('appUrlOpen', (e) => handleRedirect(e.url));
    try { const l = await CapApp.getLaunchUrl(); if (l) handleRedirect(l.url); } catch {}
  }
  if (calendarReady() && (!S.calendar || Date.now() - S.calendar.fetchedAt > 2 * 3600e3)) refreshCalendar(true);
}
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible') return;
  await checkPermission(); render(); reschedule(); checkForUpdate(false);
  if (calendarReady() && S.calendar && Date.now() - S.calendar.fetchedAt > 2 * 3600e3) refreshCalendar(true);
});
start();
