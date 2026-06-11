/* ════════════════════════════
   MOODTRACKER — app.js
════════════════════════════ */

const MOODS = [
  { key: 'awful',   label: 'Awful',   color: '#d94040', mouth: 'M14 30 Q22 23 30 30' },
  { key: 'sad',     label: 'Sad',     color: '#e07b30', mouth: 'M15 28 Q22 24 29 28' },
  { key: 'neutral', label: 'Neutral', color: '#d4b800', mouth: 'M15 27 L29 27'        },
  { key: 'good',    label: 'Good',    color: '#4caf6e', mouth: 'M15 25 Q22 31 29 25'  },
  { key: 'great',   label: 'Great',   color: '#2a9d5c', mouth: 'M13 24 Q22 33 31 24'  },
];

let selectedMood = null;
const userName = 'Name';

/* ── SVG ── */
function moodSVG(m, size = 44) {
  return `<svg viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" stroke="${m.color}" stroke-width="2.2"/>
    <circle cx="${size*0.36}" cy="${size*0.39}" r="2" fill="${m.color}"/>
    <circle cx="${size*0.64}" cy="${size*0.39}" r="2" fill="${m.color}"/>
    <path d="${m.mouth}" stroke="${m.color}" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}

/* ── INIT ── */
function init() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  setText('welcome-date', dateStr);
  setText('log-date', dateStr);
  setText('welcome-greeting', `Hi, ${userName}`);
  setText('log-title', `How are you feeling today, ${userName}?`);
  setText('nav-name', userName);
  setText('nav-avatar', userName.charAt(0).toUpperCase());

  buildMoodButtons('welcome-moods', 'mood-btn');
  buildMoodButtons('log-moods', 'log-mood-btn');
  buildWeekGrid();
  loadStats();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── MOOD BUTTONS ── */
function buildMoodButtons(containerId, btnClass) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  MOODS.forEach(m => {
    const btn = document.createElement('button');
    btn.className    = btnClass;
    btn.dataset.mood = m.key;
    btn.innerHTML    = moodSVG(m) + `<span class="mood-label ${m.key}">${m.label}</span>`;
    btn.addEventListener('click', () => selectMood(m.key));
    container.appendChild(btn);
  });
}

function selectMood(key) {
  selectedMood = key;
  ['welcome-moods', 'log-moods'].forEach(id => {
    document.querySelectorAll(`#${id} button`).forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.mood === key);
    });
  });
}

/* ── WEEK GRID ── */
function buildWeekGrid() {
  const grid      = document.getElementById('week-grid');
  const entries   = getEntries();
  const now       = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const DAYS      = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  grid.innerHTML = '';

  DAYS.forEach(d => {
    const lbl = document.createElement('div');
    lbl.className   = 'week-day-label';
    lbl.textContent = d;
    grid.appendChild(lbl);
  });

  DAYS.forEach((_, i) => {
    const date  = new Date(now);
    date.setDate(now.getDate() - dayOfWeek + i);
    const key   = date.toISOString().split('T')[0];
    const entry = entries[key];

    const circle = document.createElement('div');
    circle.className = 'week-circle' + (entry ? ' logged' : '');

    if (entry) {
      const m = MOODS.find(x => x.key === entry.mood);
      if (m) {
        circle.innerHTML         = moodSVG(m, 20);
        circle.style.borderColor = m.color;
        circle.style.background  = m.color + '18';
      }
    }
    grid.appendChild(circle);
  });
}

/* ── STATS ── */
function loadStats() {
  const entries     = getEntries();
  const now         = new Date();
  const monthPrefix = now.toISOString().slice(0, 7);
  const monthly     = Object.entries(entries).filter(([k]) => k.startsWith(monthPrefix));

  setText('stat-entries', monthly.length);

  // streak
  let streak = 0;
  const check = new Date(now);
  while (entries[check.toISOString().split('T')[0]]) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  setText('stat-streak', streak);

  // positive %
  const pos = monthly.filter(([, v]) => v.mood === 'good' || v.mood === 'great').length;
  setText('stat-positive', monthly.length ? Math.round(pos / monthly.length * 100) + '%' : '0%');

  // most frequent
  const iconEl = document.getElementById('stat-frequent-icon');
  if (monthly.length && iconEl) {
    const freq = {};
    monthly.forEach(([, v]) => { freq[v.mood] = (freq[v.mood] || 0) + 1; });
    const topKey  = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    const topMood = MOODS.find(m => m.key === topKey);
    if (topMood) iconEl.innerHTML = moodSVG(topMood, 28);
  }
}

/* ── STORAGE ── */
function getEntries() {
  try { return JSON.parse(localStorage.getItem('mt_entries') || '{}'); }
  catch { return {}; }
}

function saveEntry(entry) {
  const entries = getEntries();
  entries[new Date().toISOString().split('T')[0]] = entry;
  localStorage.setItem('mt_entries', JSON.stringify(entries));
}

/* ── NAVIGATION ── */
function navClick(e, page) {
  e.preventDefault();
  showPage(page, e.currentTarget);
}

function showPage(pageName, link) {
  // update nav highlight
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (link) link.classList.add('active');

  // hide all pages first
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const isWelcome = pageName === 'welcome';

  if (isWelcome) {
    document.getElementById('page-welcome').classList.add('active');
  } else {
    document.getElementById('page-log').classList.add('active');
  }

  const d0 = document.getElementById('dot-0');
  const d1 = document.getElementById('dot-1');
  if (d0) d0.classList.toggle('active', isWelcome);
  if (d1) d1.classList.toggle('active', !isWelcome);
}

function goToLog() {
  const link = document.querySelector('.nav-links a[data-page="log"]');
  showPage('log', link);
}

/* ── TAGS ── */
function toggleTag(el) { el.classList.toggle('selected'); }

/* ── SAVE ── */
function saveMood() {
  if (!selectedMood) { showToast('⚠️ Please pick a mood first!', true); return; }

  const note = document.getElementById('note-input').value.trim();
  const tags = [...document.querySelectorAll('.tag.selected')].map(t => t.textContent);

  saveEntry({ mood: selectedMood, note, tags, time: new Date().toISOString() });

  // reset
  document.getElementById('note-input').value = '';
  document.querySelectorAll('.tag').forEach(t => t.classList.remove('selected'));
  selectedMood = null;
  document.querySelectorAll('#log-moods button, #welcome-moods button')
    .forEach(b => b.classList.remove('selected'));

  buildWeekGrid();
  loadStats();
  showToast('Mood saved! 🎉');
}

/* ── TOAST ── */
function showToast(msg, warn = false) {
  const t = document.getElementById('toast');
  t.textContent    = msg;
  t.style.background = warn ? '#e07b30' : 'var(--green-brand)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── START ── */
document.addEventListener('DOMContentLoaded', init);