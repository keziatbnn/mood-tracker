// ── MOOD DATA ──
const MOODS = [
  { key: 'awful',   label: 'Awful',   color: '#d94040', emoji: '😞' },
  { key: 'sad',     label: 'Sad',     color: '#e07b30', emoji: '😟' },
  { key: 'neutral', label: 'Neutral', color: '#d4b800', emoji: '😐' },
  { key: 'good',    label: 'Good',    color: '#4caf6e', emoji: '😊' },
  { key: 'great',   label: 'Great',   color: '#2a9d5c', emoji: '😄' },
];

let selectedMood = null;
const userName = 'Name';

// ── SVG FACE GENERATOR ──
function makeFace(strokeColor, mouthD) {
  return `<svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="20" stroke="${strokeColor}" stroke-width="2.2"/>
    <circle cx="16" cy="17" r="2" fill="${strokeColor}"/>
    <circle cx="28" cy="17" r="2" fill="${strokeColor}"/>
    <path d="${mouthD}" stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}

function moodSVG(m) {
  const faces = {
    awful:   makeFace('#d94040', 'M14 30 Q22 23 30 30'),
    sad:     makeFace('#e07b30', 'M15 28 Q22 24 29 28'),
    neutral: makeFace('#d4b800', 'M15 27 L29 27'),
    good:    makeFace('#4caf6e', 'M15 25 Q22 31 29 25'),
    great:   makeFace('#2a9d5c', 'M13 24 Q22 33 31 24'),
  };
  return faces[m.key] || faces.neutral;
}

// ── INIT ──
function init() {
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('en-US', opts);

  document.getElementById('welcome-date').textContent = dateStr;
  document.getElementById('log-date').textContent = dateStr;
  document.getElementById('welcome-greeting').textContent = `Hi, ${userName}`;
  document.getElementById('log-title').textContent = `How are you feeling today, ${userName}?`;

  buildMoodButtons('welcome-moods', false);
  buildMoodButtons('log-moods', true);
  buildWeekGrid();
  loadStats();
}

function buildMoodButtons(containerId, small) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  MOODS.forEach(m => {
    const btn = document.createElement('button');
    btn.className = small ? 'log-mood-btn' : 'mood-btn';
    btn.dataset.mood = m.key;
    btn.innerHTML = moodSVG(m) + `<span class="mood-label ${m.key}">${m.label}</span>`;
    btn.onclick = () => selectMood(m.key);
    container.appendChild(btn);
  });
}

function selectMood(key) {
  selectedMood = key;
  ['welcome-moods', 'log-moods'].forEach(id => {
    document.querySelectorAll(`#${id} button`).forEach(b => {
      b.classList.toggle('selected', b.dataset.mood === key);
    });
  });
}

// ── WEEK GRID ──
function buildWeekGrid() {
  const grid = document.getElementById('week-grid');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const entries = getEntries();
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;

  grid.innerHTML = '';

  days.forEach(d => {
    const label = document.createElement('div');
    label.className = 'week-day-label';
    label.textContent = d;
    grid.appendChild(label);
  });

  days.forEach((d, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - dayOfWeek + i);
    const key = date.toISOString().split('T')[0];
    const entry = entries[key];
    const circle = document.createElement('div');
    circle.className = 'week-circle' + (entry ? ' logged' : '');
    if (entry) {
      const m = MOODS.find(x => x.key === entry.mood);
      circle.innerHTML = m ? moodSVG(m) : '';
      circle.style.background = m ? m.color + '22' : '';
      circle.style.borderColor = m ? m.color : '';
    }
    grid.appendChild(circle);
  });
}

// ── STATS ──
function loadStats() {
  const entries = getEntries();
  const now = new Date();
  const monthStr = now.toISOString().slice(0, 7);
  const monthEntries = Object.entries(entries).filter(([k]) => k.startsWith(monthStr));

  document.getElementById('stat-entries').textContent = monthEntries.length;

  // streak
  let streak = 0;
  const check = new Date(now);
  while (true) {
    const k = check.toISOString().split('T')[0];
    if (entries[k]) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }
  document.getElementById('stat-streak').textContent = streak;

  // positive %
  const positive = monthEntries.filter(([, v]) => v.mood === 'good' || v.mood === 'great').length;
  const pct = monthEntries.length ? Math.round(positive / monthEntries.length * 100) : 0;
  document.getElementById('stat-positive').textContent = pct + '%';
}

// ── LOCAL STORAGE ──
function getEntries() {
  try { return JSON.parse(localStorage.getItem('mt_entries') || '{}'); }
  catch (e) { return {}; }
}

function saveEntry(entry) {
  const entries = getEntries();
  const key = new Date().toISOString().split('T')[0];
  entries[key] = entry;
  localStorage.setItem('mt_entries', JSON.stringify(entries));
}

// ── NAVIGATION ──
function showPage(name, link) {
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (link) link.classList.add('active');

  if (name === 'welcome') {
    document.getElementById('page-welcome').classList.add('active');
    document.getElementById('page-log').classList.remove('active');
    document.getElementById('dot-0').classList.add('active');
    document.getElementById('dot-1').classList.remove('active');
  } else {
    document.getElementById('page-welcome').classList.remove('active');
    document.getElementById('page-log').classList.add('active');
    document.getElementById('dot-0').classList.remove('active');
    document.getElementById('dot-1').classList.add('active');
  }
}

function goToLog() {
  showPage('log', document.querySelector('.nav-links a:nth-child(2)'));
}

// ── TAGS ──
function toggleTag(el) {
  el.classList.toggle('selected');
}

// ── SAVE MOOD ──
function saveMood() {
  if (!selectedMood) {
    alert('Please select a mood first!');
    return;
  }
  const note = document.getElementById('note-input').value;
  const tags = [...document.querySelectorAll('.tag.selected')].map(t => t.textContent);
  saveEntry({ mood: selectedMood, note, tags, time: new Date().toISOString() });
  buildWeekGrid();
  loadStats();
  showToast('Mood saved! 🎉');
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── START ──
init();
