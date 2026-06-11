const MOODS = [
  { key: 'awful',   label: 'Awful',   color: '#d94040', mouth: 'M14 33 Q22 26 30 33' },
  { key: 'sad',     label: 'Sad',     color: '#e07b30', mouth: 'M15 31 Q22 27 29 31' },
  { key: 'neutral', label: 'Neutral', color: '#d4b800', mouth: 'M15 30 L29 30'        },
  { key: 'good',    label: 'Good',    color: '#4caf6e', mouth: 'M15 28 Q22 34 29 28'  },
  { key: 'great',   label: 'Great',   color: '#1F915A', mouth: 'M13 27 Q22 36 31 27'  },
];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const TAG_STYLES = {
  College:  'bg-[#d4f0e2] text-[#1a7a42]',
  Work:     'bg-[#ffe5cc] text-[#b85e00]',
  Personal: 'bg-[#DBEAFE] text-[#1D4ED8]',
};

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

let viewYear, viewMonth, selectedKey;

function init() {
  const now = new Date();
  viewYear  = now.getFullYear();
  viewMonth = now.getMonth();
  selectedKey = now.toISOString().split('T')[0];

  document.getElementById('prev-month').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  renderCalendar();
  showDetail(selectedKey);
}

function renderCalendar() {
  document.getElementById('month-label').textContent =
    `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const entries    = getEntries();
  const grid       = document.getElementById('cal-grid');
  const today      = new Date().toISOString().split('T')[0];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon = 0

  grid.innerHTML = '';

  // Leading empty cells
  for (let i = 0; i < startOffset; i++) {
    grid.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const entry   = entries[dateKey];
    const mood    = entry ? MOODS.find(m => m.key === entry.mood) : null;
    const isSelected = dateKey === selectedKey;
    const isToday    = dateKey === today;

    const cell = document.createElement('div');
    cell.className = 'rounded-xl p-2 min-h-[76px] relative cursor-pointer transition-all hover:shadow-md select-none';
    cell.style.background = mood ? mood.color + '28' : '#fff';
    if (isSelected) {
      cell.style.outline       = `2px solid ${mood ? mood.color : '#1F915A'}`;
      cell.style.outlineOffset = '-2px';
    }

    cell.innerHTML = `
      <span class="text-sm font-semibold ${isToday && !isSelected ? 'text-primary underline underline-offset-2' : 'text-gray-700'}">${d}</span>
      ${mood ? `<div class="absolute bottom-2 left-1/2 -translate-x-1/2">${moodSVG(mood, 30)}</div>` : ''}
    `;

    cell.addEventListener('click', () => {
      selectedKey = dateKey;
      renderCalendar();
      showDetail(dateKey);
    });

    grid.appendChild(cell);
  }
}

function showDetail(dateKey) {
  const entries = getEntries();
  const entry   = entries[dateKey];

  // Parse date safely (avoid timezone shift)
  const [y, mo, d] = dateKey.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  document.getElementById('detail-date').textContent =
    date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  if (!entry) {
    document.getElementById('detail-mood').innerHTML =
      '<p class="text-sm text-gray-400 italic">No entry for this day.</p>';
    document.getElementById('detail-note').classList.add('hidden');
    document.getElementById('detail-tags').innerHTML = '';
    return;
  }

  const mood = MOODS.find(m => m.key === entry.mood);
  document.getElementById('detail-mood').innerHTML = mood
    ? `<div class="flex items-center gap-3">
        ${moodSVG(mood, 36)}
        <span class="font-semibold text-base" style="color:${mood.color}">${mood.label}</span>
       </div>`
    : '';

  const noteEl = document.getElementById('detail-note');
  if (entry.note) {
    noteEl.textContent = entry.note;
    noteEl.classList.remove('hidden');
  } else {
    noteEl.classList.add('hidden');
  }

  const tagsEl = document.getElementById('detail-tags');
  tagsEl.innerHTML = (entry.tags || [])
    .map(t => `<span class="px-4 py-1.5 rounded-full text-xs font-semibold ${TAG_STYLES[t] || 'bg-gray-100 text-gray-600'}">${t}</span>`)
    .join('');
}

document.addEventListener('DOMContentLoaded', init);
