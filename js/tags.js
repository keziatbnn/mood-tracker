const BUILTIN_TAGS = [
  { name: 'College',  bg: '#d4f0e2', text: '#1a7a42' },
  { name: 'Work',     bg: '#ffe5cc', text: '#b85e00' },
  { name: 'Personal', bg: '#DBEAFE', text: '#1D4ED8' },
];

const COLOR_PRESETS = [
  { label: 'Green',  bg: '#d4f0e2', text: '#1a7a42' },
  { label: 'Blue',   bg: '#DBEAFE', text: '#1D4ED8' },
  { label: 'Purple', bg: '#EDE9FE', text: '#5B21B6' },
  { label: 'Pink',   bg: '#FCE7F3', text: '#9D174D' },
  { label: 'Orange', bg: '#ffe5cc', text: '#b85e00' },
  { label: 'Yellow', bg: '#FEF9C3', text: '#854D0E' },
  { label: 'Red',    bg: '#FEE2E2', text: '#991B1B' },
  { label: 'Gray',   bg: '#F3F4F6', text: '#374151' },
];

/* state */
let _customTags   = [];   // [{ id, tag_name, bg_color, text_color }]
let _tagsLoaded   = false;
let _tagsUserId   = null;

/* fetch custom tags for a user from Supabase, with caching */
async function loadCustomTags(userId) {
  if (_tagsLoaded && _tagsUserId === userId) return _customTags;

  const { data, error } = await supabaseClient
    .from('user_tags')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) { console.error('loadCustomTags:', error); return []; }

  _customTags  = data || [];
  _tagsLoaded  = true;
  _tagsUserId  = userId;
  return _customTags;
}

/* create a new custom tag */
async function createCustomTag(userId, name, bg, text) {
  // Validasi duplikat builtin
  if (BUILTIN_TAGS.some(t => t.name.toLowerCase() === name.toLowerCase())) {
    return { error: `"${name}" is a built-in tag.` };
  }
  // Validasi duplikat custom
  if (_customTags.some(t => t.tag_name.toLowerCase() === name.toLowerCase())) {
    return { error: `Tag "${name}" already exists.` };
  }

  const { data, error } = await supabaseClient
    .from('user_tags')
    .insert({ user_id: userId, tag_name: name, bg_color: bg, text_color: text })
    .select()
    .single();

  if (error) return { error: error.message };

  _customTags.push(data);
  return { tag: data };
}

/* Delete a custom tag */
async function deleteCustomTag(userId, tagId) {
  const { error } = await supabaseClient
    .from('user_tags')
    .delete()
    .match({ id: tagId, user_id: userId });

  if (error) return { error: error.message };

  _customTags = _customTags.filter(t => t.id !== tagId);
  return { ok: true };
}

function getTagStyle(tagName) {
  const builtin = BUILTIN_TAGS.find(t => t.name === tagName);
  if (builtin) return { bg: builtin.bg, text: builtin.text };

  const custom = _customTags.find(t => t.tag_name === tagName);
  if (custom) return { bg: custom.bg_color, text: custom.text_color };

  return { bg: '#F3F4F6', text: '#374151' }; // fallback gray
}

/* render tag pill for entries */
function renderTagPill(tagName) {
  const s = getTagStyle(tagName);
  return `<span class="px-3 py-1 rounded-full text-[10px] font-semibold"
    style="background:${s.bg};color:${s.text}">${tagName}</span>`;
}

function renderTagSection(container, selectedTags, userId, onTagsChange) {
  container.innerHTML = '';

  /* ── Built-in tags ── */
  BUILTIN_TAGS.forEach(t => {
    const span = document.createElement('span');
    span.dataset.tag      = t.name;
    span.dataset.selected = selectedTags.includes(t.name) ? 'true' : 'false';
    span.className        = 'tag-chip cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all hover:scale-105 select-none';
    span.style.background = t.bg;
    span.style.color      = t.text;
    span.style.borderColor = selectedTags.includes(t.name) ? t.text : 'transparent';
    span.textContent       = t.name;
    span.addEventListener('click', () => toggleTagChip(span));
    container.appendChild(span);
  });

  /* ── Custom tags ── */
  _customTags.forEach(t => {
    const wrap = document.createElement('span');
    wrap.className = 'inline-flex items-center gap-0.5';

    const span = document.createElement('span');
    span.dataset.tag      = t.tag_name;
    span.dataset.selected = selectedTags.includes(t.tag_name) ? 'true' : 'false';
    span.className        = 'tag-chip cursor-pointer px-3 py-1.5 rounded-l-full text-xs font-semibold border-2 border-r-0 transition-all hover:scale-105 select-none';
    span.style.background = t.bg_color;
    span.style.color      = t.text_color;
    span.style.borderColor = selectedTags.includes(t.tag_name) ? t.text_color : 'transparent';
    span.textContent      = t.tag_name;
    span.addEventListener('click', () => toggleTagChip(span));

    const del = document.createElement('button');
    del.className        = 'flex items-center justify-center w-5 h-[30px] rounded-r-full border-2 border-l-0 text-[10px] font-bold transition-all hover:opacity-70';
    del.style.background = t.bg_color;
    del.style.color      = t.text_color;
    del.style.borderColor = selectedTags.includes(t.tag_name) ? t.text_color : 'transparent';
    del.innerHTML        = '×';
    del.title            = `Delete "${t.tag_name}"`;
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete tag "${t.tag_name}"? It will be removed from this list (existing entries won't be affected).`)) return;
      const res = await deleteCustomTag(userId, t.id);
      if (res.error) { alert(res.error); return; }
      onTagsChange();
    });

    wrap.appendChild(span);
    wrap.appendChild(del);
    container.appendChild(wrap);
  });

  /* ── Add Tag UI ── */
  const addWrap = document.createElement('div');
  addWrap.className = 'w-full mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2';
  addWrap.innerHTML = `
    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Create Custom Tag</p>
    <div class="flex gap-2 flex-wrap items-start">
      <div class="flex flex-col gap-1.5 flex-1 min-w-[120px]">
        <input
          id="new-tag-input"
          type="text"
          maxlength="20"
          placeholder="Tag name (max 20)"
          class="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-primary font-[Poppins] w-full"
        />
        <div class="flex gap-1 flex-wrap" id="color-preset-row">
          ${COLOR_PRESETS.map((c, i) => `
            <button
              type="button"
              data-preset="${i}"
              title="${c.label}"
              class="color-preset-btn w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-all"
              style="background:${c.bg};outline:2px solid transparent;"
            ></button>`).join('')}
        </div>
        <div id="tag-preview-wrap" class="hidden">
          <span id="tag-preview" class="px-3 py-1 rounded-full text-xs font-semibold">Preview</span>
        </div>
      </div>
      <button
        id="add-tag-btn"
        type="button"
        class="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all self-start mt-0.5 shrink-0"
      >+ Add Tag</button>
    </div>
    <p id="tag-error-msg" class="hidden text-[11px] text-red-500 font-medium"></p>`;
  container.appendChild(addWrap);

  /* Wire up color presets */
  let selectedPreset = 0;
  const presetBtns   = addWrap.querySelectorAll('.color-preset-btn');

  function applyPreset(idx) {
    selectedPreset = idx;
    presetBtns.forEach((b, i) => {
      b.style.outline = i === idx ? `2px solid ${COLOR_PRESETS[i].text}` : '2px solid transparent';
    });
    updatePreview();
  }

  function updatePreview() {
    const name = addWrap.querySelector('#new-tag-input').value.trim();
    const preview  = addWrap.querySelector('#tag-preview');
    const previewWrap = addWrap.querySelector('#tag-preview-wrap');
    const c = COLOR_PRESETS[selectedPreset];
    if (name) {
      preview.textContent    = name;
      preview.style.background = c.bg;
      preview.style.color    = c.text;
      previewWrap.classList.remove('hidden');
    } else {
      previewWrap.classList.add('hidden');
    }
  }

  presetBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => applyPreset(i));
  });
  applyPreset(0);

  addWrap.querySelector('#new-tag-input').addEventListener('input', updatePreview);

  /* Add Tag button */
  addWrap.querySelector('#add-tag-btn').addEventListener('click', async () => {
    const input   = addWrap.querySelector('#new-tag-input');
    const errEl   = addWrap.querySelector('#tag-error-msg');
    const name    = input.value.trim();
    const c       = COLOR_PRESETS[selectedPreset];

    errEl.classList.add('hidden');

    if (!name) { showTagError(errEl, 'Please enter a tag name.'); return; }
    if (name.length > 20) { showTagError(errEl, 'Maximum 20 characters.'); return; }

    const res = await createCustomTag(userId, name, c.bg, c.text);
    if (res.error) { showTagError(errEl, res.error); return; }

    input.value = '';
    addWrap.querySelector('#tag-preview-wrap').classList.add('hidden');
    onTagsChange();
  });
}

function showTagError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function toggleTagChip(span) {
  const active = span.dataset.selected === 'true';
  span.dataset.selected = String(!active);
  const sib = span.nextElementSibling; // del button in custom tag
  const c = getTagStyle(span.dataset.tag);
  const border = !active ? c.text : 'transparent';
  span.style.borderColor = border;
  if (sib && sib.tagName === 'BUTTON') sib.style.borderColor = border;
}

function getSelectedTags(container) {
  return [...container.querySelectorAll('.tag-chip[data-selected="true"]')]
    .map(el => el.dataset.tag);
}
