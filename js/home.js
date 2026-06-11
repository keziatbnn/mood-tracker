const MOODS = [
  { key: 'awful',   label: 'Awful',   color: '#d94040', mouth: 'M14 33 Q22 26 30 33' },
  { key: 'sad',     label: 'Sad',     color: '#e07b30', mouth: 'M15 31 Q22 27 29 31' },
  { key: 'neutral', label: 'Neutral', color: '#d4b800', mouth: 'M15 30 L29 30'        },
  { key: 'good',    label: 'Good',    color: '#4caf6e', mouth: 'M15 28 Q22 34 29 28'  },
  { key: 'great',   label: 'Great',   color: '#1F915A', mouth: 'M13 27 Q22 36 31 27'  },
];

let selectedMood = null;
const userName = 'Name';

function moodSVG(m, size = 44) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="20" stroke="${m.color}" stroke-width="2.2"/>
    <circle cx="16" cy="15" r="2" fill="${m.color}"/>
    <circle cx="28" cy="15" r="2" fill="${m.color}"/>
    <path d="${m.mouth}" stroke="${m.color}" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}

function init() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  setText('log-date', dateStr);
  setText('log-title', `How are you feeling today, ${userName}?`);

  buildMoodButtons();
  buildWeekGrid();
  loadStats();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function buildMoodButtons() {
  const container = document.getElementById('log-moods');
  container.innerHTML = '';
  MOODS.forEach(m => {
    const btn = document.createElement('button');
    btn.dataset.mood = m.key;
    btn.className = `flex flex-col items-center gap-2 cursor-pointer bg-transparent border-2 border-transparent
      px-3 py-2.5 rounded-2xl transition-all hover:bg-black/5 hover:-translate-y-1`;
    btn.innerHTML = `
      <span style="width:40px;height:40px;display:block">${moodSVG(m, 40)}</span>
      <span class="text-xs font-semibold" style="color:${m.color}">${m.label}</span>`;
    btn.addEventListener('click', () => selectMood(m.key));
    container.appendChild(btn);
  });
}

function selectMood(key) {
  selectedMood = key;
  const mood = MOODS.find(m => m.key === key);
  document.querySelectorAll('#log-moods button').forEach(btn => {
    const isSelected = btn.dataset.mood === key;
    btn.style.background = isSelected ? mood.color + '18' : '';
    btn.style.borderColor = isSelected ? mood.color + '80' : 'transparent';
  });
}

function buildWeekGrid() {
  const grid = document.getElementById('week-grid');
  if (!grid) return;
  const entries = getEntries();
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  grid.innerHTML = '';

  DAYS.forEach(d => {
    const lbl = document.createElement('div');
    lbl.className = 'text-[10px] text-gray-400 font-semibold pb-1';
    lbl.textContent = d;
    grid.appendChild(lbl);
  });

  DAYS.forEach((_, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - dayOfWeek + i);
    const key = date.toISOString().split('T')[0];
    const entry = entries[key];
    const m = entry ? MOODS.find(x => x.key === entry.mood) : null;

    const circle = document.createElement('div');
    circle.className = 'w-8 h-8 rounded-full border-2 mx-auto flex items-center justify-center';
    circle.style.borderColor = m ? m.color : '#ddd';
    circle.style.background = m ? m.color + '18' : 'transparent';
    if (m) circle.innerHTML = `<span style="width:18px;height:18px;display:block">${moodSVG(m, 18)}</span>`;
    grid.appendChild(circle);
  });
}

function loadStats() {
  const entries = getEntries();
  const now = new Date();
  const monthPrefix = now.toISOString().slice(0, 7);
  const monthly = Object.entries(entries).filter(([k]) => k.startsWith(monthPrefix));

  setText('stat-entries', monthly.length);

  let streak = 0;
  const check = new Date(now);
  while (entries[check.toISOString().split('T')[0]]) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  setText('stat-streak', streak);

  const pos = monthly.filter(([, v]) => v.mood === 'good' || v.mood === 'great').length;
  setText('stat-positive', monthly.length ? Math.round(pos / monthly.length * 100) + '%' : '0%');

  const iconEl = document.getElementById('stat-frequent-icon');
  if (monthly.length && iconEl) {
    const freq = {};
    monthly.forEach(([, v]) => { freq[v.mood] = (freq[v.mood] || 0) + 1; });
    const topKey = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    const topMood = MOODS.find(m => m.key === topKey);
    if (topMood) iconEl.innerHTML = moodSVG(topMood, 28);
  }
}

function getEntries() {
  try { return JSON.parse(localStorage.getItem('mt_entries') || '{}'); }
  catch { return {}; }
}

function saveEntry(entry) {
  const entries = getEntries();
  entries[new Date().toISOString().split('T')[0]] = entry;
  localStorage.setItem('mt_entries', JSON.stringify(entries));
}

function toggleTag(el) {
  const isSelected = el.dataset.selected === 'true';
  el.dataset.selected = !isSelected;
  el.style.borderColor = !isSelected ? '#1F915A' : 'transparent';
}

function saveMood() {
  if (!selectedMood) { showToast('⚠️ Please pick a mood first!', true); return; }

  const note = document.getElementById('note-input').value.trim();
  const tags = [...document.querySelectorAll('.tag[data-selected="true"]')].map(t => t.textContent.trim());

  saveEntry({ mood: selectedMood, note, tags, time: new Date().toISOString() });

  document.getElementById('note-input').value = '';
  document.querySelectorAll('.tag').forEach(t => {
    t.dataset.selected = 'false';
    t.style.borderColor = 'transparent';
  });
  selectedMood = null;
  document.querySelectorAll('#log-moods button').forEach(btn => {
    btn.style.background = '';
    btn.style.borderColor = 'transparent';
  });

  buildWeekGrid();
  loadStats();
  showToast('Mood saved! 🎉');
}

function showToast(msg, warn = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = warn ? '#e07b30' : '#1F915A';
  t.classList.remove('translate-y-16', 'opacity-0');
  t.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    t.classList.add('translate-y-16', 'opacity-0');
    t.classList.remove('translate-y-0', 'opacity-100');
  }, 2800);
}

document.addEventListener('DOMContentLoaded', init);