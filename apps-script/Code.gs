/**
 * Lane calendar bridge.
 * Runs as you, reads your Google Calendar (meetings + working location)
 * and adds training sessions. The app talks to it with a private key.
 * Setup: see README.md, "Connect Google Calendar".
 */
const TAG = '#lane-app';

/** Run this once from the editor. Copy the key from the log into the app. */
function setup() {
  const key = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('KEY', key);
  Logger.log('Your Lane key: ' + key);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const key = PropertiesService.getScriptProperties().getProperty('KEY');
  if (!key || p.key !== key) return out_({ ok: false, error: 'Wrong or missing key. Check the key in Lane settings.' });
  try {
    if (p.action === 'week') return out_(week_(Math.min(Number(p.days) || 8, 21)));
    if (p.action === 'add') return out_(add_(p));
    return out_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function week_(days) {
  const tz = CalendarApp.getDefaultCalendar().getTimeZone();
  const todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const start = new Date(todayStr + 'T00:00:00' + offset_(tz));
  const end = new Date(start.getTime() + days * 86400000);

  const map = {}; const order = [];
  for (let i = 0; i < days; i++) {
    const d = Utilities.formatDate(new Date(start.getTime() + i * 86400000 + 12 * 3600000), tz, 'yyyy-MM-dd');
    map[d] = { date: d, location: null, ooo: false, busy: [] }; order.push(d);
  }

  const items = []; let pageToken;
  do {
    const r = Calendar.Events.list('primary', {
      timeMin: start.toISOString(), timeMax: end.toISOString(),
      singleEvents: true, orderBy: 'startTime', maxResults: 250, pageToken: pageToken,
      eventTypes: ['default', 'workingLocation', 'outOfOffice', 'focusTime'],
    });
    (r.items || []).forEach(function (ev) { items.push(ev); });
    pageToken = r.nextPageToken;
  } while (pageToken);

  items.forEach(function (ev) {
    if (ev.eventType === 'workingLocation') {
      const t = ev.workingLocationProperties && ev.workingLocationProperties.type;
      const loc = t === 'homeOffice' ? 'home' : t === 'officeLocation' ? 'office' : 'other';
      datesOf_(ev, tz).forEach(function (d) { if (map[d]) map[d].location = loc; });
      return;
    }
    if (ev.transparency === 'transparent') return;
    if ((ev.attendees || []).some(function (a) { return a.self && a.responseStatus === 'declined'; })) return;
    if (ev.start.date) { // all-day event
      if (ev.eventType === 'outOfOffice') datesOf_(ev, tz).forEach(function (d) { if (map[d]) map[d].ooo = true; });
      return;
    }
    const d = Utilities.formatDate(new Date(ev.start.dateTime), tz, 'yyyy-MM-dd');
    if (map[d]) map[d].busy.push({ s: ev.start.dateTime, e: ev.end.dateTime, lane: String(ev.description || '').indexOf(TAG) >= 0 });
  });

  return { ok: true, tz: tz, days: order.map(function (d) { return map[d]; }) };
}

function datesOf_(ev, tz) {
  if (ev.start.date) {
    const out = []; let d = new Date(ev.start.date + 'T12:00:00Z'); const end = new Date(ev.end.date + 'T12:00:00Z');
    while (d < end) { out.push(Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd')); d = new Date(d.getTime() + 86400000); }
    return out;
  }
  return [Utilities.formatDate(new Date(ev.start.dateTime), tz, 'yyyy-MM-dd')];
}

function offset_(tz) {
  const z = Utilities.formatDate(new Date(), tz, 'Z'); // e.g. +0100
  return z.slice(0, 3) + ':' + z.slice(3);
}

function add_(p) {
  const cal = CalendarApp.getDefaultCalendar();
  const start = new Date(p.start); const end = new Date(p.end);
  if (isNaN(start) || isNaN(end) || !p.title) return { ok: false, error: 'Missing title or times' };
  const dupe = cal.getEvents(start, end).some(function (ev) {
    return ev.getTitle() === p.title && ev.getStartTime().getTime() === start.getTime();
  });
  if (dupe) return { ok: true, skipped: true };
  cal.createEvent(p.title, start, end, { description: (p.desc || '') + '\n\n' + TAG });
  return { ok: true, created: true };
}
