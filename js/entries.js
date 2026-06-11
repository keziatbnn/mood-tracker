const MOODS = [
  { key: 'awful',   label: 'Awful',   color: '#d94040', mouth: 'M14 33 Q22 26 30 33' },
  { key: 'sad',     label: 'Sad',     color: '#e07b30', mouth: 'M15 31 Q22 27 29 31' },
  { key: 'neutral', label: 'Neutral', color: '#d4b800', mouth: 'M15 30 L29 30'        },
  { key: 'good',    label: 'Good',    color: '#4caf6e', mouth: 'M15 28 Q22 34 29 28'  },
  { key: 'great',   label: 'Great',   color: '#1F915A', mouth: 'M13 27 Q22 36 31 27'  },
];

const TAG_STYLES = {
  College: 'bg-[#d4f0e2] text-[#1a7a42]',
  Work:    'bg-[#ffe5cc] text-[#b85e00]',
  Personal:'bg-[#DBEAFE] text-[#1D4ED8]',
};

let currentFilter = 'all';
let currentSort   = 'newest';
let editingKey    = null;
let modalMood     = null;

function moodSVG(m, size = 44) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="20" stroke="${m.color}" stroke-width="2.2"/>
    <circle cx="16" cy="15" r="2" fill="${m.color}"/>
    <circle cx="28" cy="15" r="2" fill="${m.color}"/>
    <path d="${m.mouth}" stroke="${m.color}" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}

function getEntries() {
  try { return JSON.parse(localStorage.getItem('mt_entries') || '{}'); }
  catch { return {}; }
}
function setEntries(obj) {
  localStorage.setItem('mt_entries', JSON.stringify(obj));
}

function buildFilterChips() {
  const container = document.getElementById('mood-filters');
  MOODS.forEach(m => {
    const btn = document.createElement('button');
    btn.dataset.filter = m.key;
    btn.onclick = () => setFilter(m.key);
    btn.className = 'filter-chip px-4 py-1.5 rounded-full text-xs font-semibold border-2 transition-all flex items-center gap-1.5 border-gray-200 text-gray-500 bg-white hover:border-primary hover:text-primary';
    btn.innerHTML = `<span style="width:16px;height:16px;display:inline-block">${moodSVG(m, 16)}</span><span>${m.label}</span>`;
    container.appendChild(btn);
  });
}

function setFilter(key) {
  currentFilter = key;
  document.querySelectorAll('.filter-chip').forEach(c => {
    const active = c.dataset.filter === key;
    c.className = c.className
      .replace(/border-primary|border-gray-200|text-primary|text-gray-500|bg-pink-bg|bg-white/g, '')
      .trim();
    c.classList.add(
      ...(active
        ? ['border-primary', 'text-primary', 'bg-pink-bg']
        : ['border-gray-200', 'text-gray-500', 'bg-white'])
    );
  });
  renderEntries();
}

function setSort(dir) {
  currentSort = dir;
  ['newest', 'oldest'].forEach(d => {
    const btn = document.getElementById(`btn-${d}`);
    if (d === dir) {
      btn.classList.remove('border-gray-200', 'text-gray-400', 'bg-white');
      btn.classList.add('border-primary', 'text-primary', 'bg-pink-bg');
    } else {
      btn.classList.remove('border-primary', 'text-primary', 'bg-pink-bg');
      btn.classList.add('border-gray-200', 'text-gray-400', 'bg-white');
    }
  });
  renderEntries();
}

function renderEntries() {
  const entries = getEntries();
  const search  = document.getElementById('search-input').value.toLowerCase();

  let pairs = Object.entries(entries)
    .filter(([, v]) => currentFilter === 'all' || v.mood === currentFilter)
    .filter(([, v]) => !search || (v.note || '').toLowerCase().includes(search));

  pairs.sort(([a], [b]) => currentSort === 'newest'
    ? b.localeCompare(a) : a.localeCompare(b));

  document.getElementById('entries-count').textContent =
    `${Object.keys(entries).length} entries total`;

  const container = document.getElementById('entries-container');
  container.innerHTML = '';

  if (!pairs.length) {
    container.innerHTML = `<p class="text-sm text-gray-400 text-center mt-12">No entries found.</p>`;
    return;
  }

  const groups = {};
  pairs.forEach(([key, val]) => {
    const month = key.slice(0, 7);
    if (!groups[month]) groups[month] = [];
    groups[month].push([key, val]);
  });

  Object.entries(groups).forEach(([month, list]) => {
    const label = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const monthDiv = document.createElement('div');
    monthDiv.innerHTML = `<p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-4">${label}</p>`;
    container.appendChild(monthDiv);

    list.forEach(([key, val]) => {
      const m = MOODS.find(x => x.key === val.mood);
      if (!m) return;

      const d       = new Date(key);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
      const tags    = (val.tags || []).map(t => {
        const cls = TAG_STYLES[t] || 'bg-gray-100 text-gray-500';
        return `<span class="px-3 py-1 rounded-full text-[10px] font-semibold ${cls}">${t}</span>`;
      }).join('');

      const card = document.createElement('div');
      card.className = 'flex items-center gap-4 bg-pink-bg border border-gray-700 rounded-2xl px-5 py-4 mb-3 hover:shadow-sm transition-all';
      card.innerHTML = `
        <div class="flex flex-col items-center gap-1 shrink-0 w-14 py-1.5 aspect-square bg-white border border-gray-700 rounded-xl">
          <span style="width:30px;height:30px;display:block">${moodSVG(m, 30)}</span>
          <span class="text-[10px] font-semibold" style="color:${m.color}">${m.label}</span>
        </div>
        <div class="flex-1 min-w-0">
          <span class="text-[11px] text-gray-400 font-medium">${dateStr}</span>
          ${val.note ? `<p class="text-sm text-gray-700 mt-1 leading-snug">${val.note}</p>` : ''}
          ${tags ? `<div class="flex gap-1.5 flex-wrap mt-1">${tags}</div>` : ''}
        </div>
        <div class="flex flex-col gap-1.5 shrink-0">
          <button onclick="openEditModal('${key}')"
            class="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-700 text-gray-400 hover:border-primary hover:text-primary transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="#1F915A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button onclick="deleteEntry('${key}')"
            class="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-700 text-gray-400 hover:border-red-400 hover:text-red-400 transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M6 6.5v4M8 6.5v4M3 4l.7 7.5h6.6L11 4" stroke="#1F915A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>`;
      container.appendChild(card);
    });
  });
}

function deleteEntry(key) {
  const entries = getEntries();
  delete entries[key];
  setEntries(entries);
  renderEntries();
  showToast('Entry deleted');
}

function buildModalMoodRow() {
  const row = document.getElementById('modal-mood-row');
  row.innerHTML = '';
  MOODS.forEach(m => {
    const btn = document.createElement('button');
    btn.dataset.mood = m.key;
    btn.className = 'flex flex-col items-center gap-1.5 cursor-pointer bg-transparent border-2 border-transparent px-2 py-2 rounded-2xl transition-all hover:bg-black/5';
    btn.innerHTML = `<span style="width:32px;height:32px;display:block">${moodSVG(m, 32)}</span>
      <span class="text-[10px] font-semibold" style="color:${m.color}">${m.label}</span>`;
    btn.addEventListener('click', () => selectModalMood(m.key));
    row.appendChild(btn);
  });
}

function selectModalMood(key) {
  modalMood = key;
  const m = MOODS.find(x => x.key === key);
  document.querySelectorAll('#modal-mood-row button').forEach(btn => {
    const active = btn.dataset.mood === key;
    btn.style.background  = active ? m.color + '18' : '';
    btn.style.borderColor = active ? m.color + '80' : 'transparent';
  });
}

function setToday() {
  document.getElementById('modal-date').value = new Date().toISOString().split('T')[0];
}

function toggleTag(el) {
  const active = el.dataset.selected === 'true';
  el.dataset.selected = String(!active);
  el.style.borderColor = !active ? '#1F915A' : 'transparent';
}

function resetModal() {
  modalMood  = null;
  editingKey = null;
  document.getElementById('modal-title').textContent = 'Add Entry';
  setToday();
  document.getElementById('modal-note').value = '';
  document.querySelectorAll('#modal-mood-row button').forEach(btn => {
    btn.style.background  = '';
    btn.style.borderColor = 'transparent';
  });
  document.querySelectorAll('.modal-tag').forEach(t => {
    t.dataset.selected = 'false';
    t.style.borderColor = 'transparent';
  });
}

function openModal() {
  resetModal();
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function openEditModal(key) {
  resetModal();
  editingKey = key;
  const entries = getEntries();
  const val = entries[key];
  if (!val) return;

  document.getElementById('modal-title').textContent = 'Edit Entry';
  document.getElementById('modal-date').value        = key;
  document.getElementById('modal-note').value        = val.note || '';
  if (val.mood) selectModalMood(val.mood);
  if (val.tags) {
    document.querySelectorAll('.modal-tag').forEach(t => {
      if (val.tags.includes(t.dataset.tag)) {
        t.dataset.selected  = 'true';
        t.style.borderColor = '#1F915A';
      }
    });
  }
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function saveEntry() {
  if (!modalMood) { showToast('Please pick a mood first!', true); return; }

  const date = document.getElementById('modal-date').value;
  const note = document.getElementById('modal-note').value.trim();
  const tags = [...document.querySelectorAll('.modal-tag[data-selected="true"]')].map(t => t.dataset.tag);

  const entries = getEntries();
  if (editingKey && editingKey !== date) delete entries[editingKey];
  entries[date] = { mood: modalMood, note, tags, time: new Date().toISOString() };
  setEntries(entries);

  closeModal();
  renderEntries();
  showToast(editingKey ? 'Entry updated!' : 'Entry saved!');
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

document.addEventListener('DOMContentLoaded', () => {
  buildFilterChips();
  buildModalMoodRow();
  renderEntries();

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
});