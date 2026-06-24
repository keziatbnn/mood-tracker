const MOODS = [
  { key: 'awful',   label: 'Awful',   color: '#d94040', score: 1, mouth: 'M14 33 Q22 26 30 33' },
  { key: 'sad',     label: 'Sad',     color: '#e07b30', score: 2, mouth: 'M15 31 Q22 27 29 31' },
  { key: 'neutral', label: 'Neutral', color: '#d4b800', score: 3, mouth: 'M15 30 L29 30'        },
  { key: 'good',    label: 'Good',    color: '#4caf6e', score: 4, mouth: 'M15 28 Q22 34 29 28'  },
  { key: 'great',   label: 'Great',   color: '#1F915A', score: 5, mouth: 'M13 27 Q22 36 31 27'  },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

let currentView = 'month';
let trendChart  = null;
let mixChart    = null;
let currentUser = null;
let cachedEntries = {};

function moodSVG(m, size = 44) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="20" stroke="${m.color}" stroke-width="2.2"/>
    <circle cx="16" cy="15" r="2" fill="${m.color}"/>
    <circle cx="28" cy="15" r="2" fill="${m.color}"/>
    <path d="${m.mouth}" stroke="${m.color}" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}

async function init() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;

  await loadEntriesFromCloud();

  document.querySelectorAll('.trend-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      document.querySelectorAll('.trend-btn').forEach(b => {
        b.classList.remove('bg-primary', 'text-white');
        b.classList.add('text-gray-500');
      });
      btn.classList.add('bg-primary', 'text-white');
      btn.classList.remove('text-gray-500');
      updateTrendChart();
    });
  });

  initTrendChart();
  initMixChart();
}

async function loadEntriesFromCloud() {
  const { data, error } = await supabaseClient
    .from('mood_entries')
    .select('*')
    .eq('user_id', currentUser.id);

  if (!error) {
    cachedEntries = {};
    data.forEach(entry => { cachedEntries[entry.date] = entry; });
    renderSummary();
  }
}

// ── Summary cards ──────────────────────────────────────────────────────────
function renderSummary() {
  const entries = cachedEntries;
  const all = Object.entries(entries);

  document.getElementById('stat-total').textContent = all.length;

  const freq = {};
  all.forEach(([, v]) => { freq[v.mood] = (freq[v.mood] || 0) + 1; });
  const topKey  = all.length ? Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0] : null;
  const topMood = topKey ? MOODS.find(m => m.key === topKey) : null;
  document.getElementById('stat-frequent').innerHTML = topMood
    ? moodSVG(topMood, 40)
    : '<span class="text-3xl text-gray-300 font-bold">—</span>';

  let streak = 0;
  const check = new Date();
  while (entries[check.toISOString().split('T')[0]]) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  document.getElementById('stat-streak').textContent = streak;

  const pos = all.filter(([, v]) => v.mood === 'good' || v.mood === 'great').length;
  document.getElementById('stat-positive').textContent =
    all.length ? Math.round(pos / all.length * 100) + '%' : '0%';
}

// ── Trend chart data builders ───────────────────────────────────────────────
function getTrendData() {
  const entries = cachedEntries;
  const now = new Date();

  if (currentView === 'week') {
    const labels = [], data = [], colors = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key   = d.toISOString().split('T')[0];
      const entry = entries[key];
      const mood  = entry ? MOODS.find(m => m.key === entry.mood) : null;
      labels.push(DAY_NAMES[d.getDay()]);
      data.push(mood ? mood.score : null);
      colors.push(mood ? mood.color : 'rgba(0,0,0,0)');
    }
    return { labels, data, colors };
  }

  if (currentView === 'month') {
    const y = now.getFullYear(), mo = now.getMonth();
    const days = new Date(y, mo + 1, 0).getDate();
    const labels = [], data = [], colors = [];
    for (let d = 1; d <= days; d++) {
      const key   = `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const entry = entries[key];
      const mood  = entry ? MOODS.find(m => m.key === entry.mood) : null;
      labels.push(d);
      data.push(mood ? mood.score : null);
      colors.push(mood ? mood.color : 'rgba(0,0,0,0)');
    }
    return { labels, data, colors };
  }

  // year — average score per month
  const y = now.getFullYear();
  const data = [], colors = [];
  for (let mo = 0; mo < 12; mo++) {
    const prefix  = `${y}-${String(mo + 1).padStart(2, '0')}`;
    const monthly = Object.entries(entries).filter(([k]) => k.startsWith(prefix));
    if (monthly.length) {
      const avg = monthly.reduce((s, [, v]) => {
        const m = MOODS.find(x => x.key === v.mood);
        return s + (m ? m.score : 3);
      }, 0) / monthly.length;
      const closest = MOODS.reduce((best, m) =>
        Math.abs(m.score - avg) < Math.abs(best.score - avg) ? m : best);
      data.push(Math.round(avg * 10) / 10);
      colors.push(closest.color);
    } else {
      data.push(null);
      colors.push('rgba(0,0,0,0)');
    }
  }
  return { labels: MONTH_NAMES, data, colors };
}

// ── Trend chart ─────────────────────────────────────────────────────────────
function initTrendChart() {
  const { labels, data, colors } = getTrendData();
  const ctx = document.getElementById('trend-chart').getContext('2d');

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#1F915A',
        borderWidth: 2.5,
        fill: true,
        backgroundColor: 'rgba(180,180,180,0.15)',
        tension: 0.3,
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        pointRadius: data.map(v => v !== null ? 5 : 0),
        pointHoverRadius: 7,
        spanGaps: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0, max: 5.5,
          ticks: { stepSize: 1, color: '#bbb', font: { family: 'Poppins', size: 11 }, callback: val => (val >= 1 && val <= 5) ? val : '' },
          grid: { color: ctx => ctx.tick.value === 0 ? 'transparent' : 'rgba(0,0,0,0.06)' },
          border: { display: false },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#bbb', font: { family: 'Poppins', size: 11 } },
          border: { display: false },
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const mood = MOODS.find(m => m.score === Math.round(ctx.raw));
              return mood ? ' ' + mood.label : '';
            }
          },
          backgroundColor: '#fff',
          titleColor: '#444',
          bodyColor: '#555',
          borderColor: '#e5e5e5',
          borderWidth: 1,
          padding: 10,
        }
      }
    }
  });
}

function updateTrendChart() {
  const { labels, data, colors } = getTrendData();
  trendChart.data.labels = labels;
  trendChart.data.datasets[0].data = data;
  trendChart.data.datasets[0].pointBackgroundColor = colors;
  trendChart.data.datasets[0].pointBorderColor = colors;
  trendChart.data.datasets[0].pointRadius = data.map(v => v !== null ? 5 : 0);
  trendChart.update();
}

// ── Donut chart ─────────────────────────────────────────────────────────────
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx } = chart;
    const { top, bottom, left, right } = chart.chartArea;
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 26px Poppins, sans-serif';
    ctx.fillStyle = '#3d3d3d';
    ctx.fillText(total || '—', cx, cy - 9);
    ctx.font = '500 11px Poppins, sans-serif';
    ctx.fillStyle = '#999';
    ctx.fillText('entries', cx, cy + 11);
    ctx.restore();
  }
};

function initMixChart() {
  const entries = cachedEntries;
  const counts  = MOODS.map(m => Object.values(entries).filter(e => e.mood === m.key).length);
  const total   = counts.reduce((a, b) => a + b, 0);

  const hasData = total > 0;
  const ctx = document.getElementById('mix-chart').getContext('2d');

  mixChart = new Chart(ctx, {
    type: 'doughnut',
    plugins: [centerTextPlugin],
    data: {
      labels: MOODS.map(m => m.label),
      datasets: [{
        data: hasData ? counts : [1],
        backgroundColor: hasData ? MOODS.map(m => m.color) : ['#e5e5e5'],
        borderWidth: 0,
        hoverOffset: hasData ? 6 : 0,
      }]
    },
    options: {
      cutout: '68%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: hasData,
          callbacks: {
            label: ctx => {
              const val = ctx.raw;
              const pct = total ? Math.round(val / total * 100) : 0;
              return ` ${val} · ${pct}%`;
            }
          },
          backgroundColor: '#fff',
          titleColor: '#444',
          bodyColor: '#555',
          borderColor: '#e5e5e5',
          borderWidth: 1,
          padding: 10,
        }
      }
    }
  });

  renderMixLegend(counts, total);
}

function renderMixLegend(counts, total) {
  function item(key) {
    const idx   = MOODS.findIndex(m => m.key === key);
    const m     = MOODS[idx];
    const count = counts[idx];
    const pct   = total ? Math.round(count / total * 100) : 0;
    return `<div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${m.color}"></span>
      <span class="text-sm text-gray-600 w-14">${m.label}</span>
      <span class="text-sm text-gray-400">${count} · ${pct}%</span>
    </div>`;
  }

  document.getElementById('legend-left').innerHTML =
    ['great','good','neutral'].map(item).join('');
  document.getElementById('legend-right').innerHTML =
    ['sad','awful'].map(item).join('');
}

document.addEventListener('DOMContentLoaded', init);