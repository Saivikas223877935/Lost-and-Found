/* global M, API_BASE, authHeaders, isLoggedIn */
let socket = null;

// Try to init socket when library is available
function initSocket() {
  try {
    if (socket || typeof io === 'undefined') return;
    socket = io(); // eslint-disable-line no-undef
    socket.on('item:new', (payload) => {
      const liveCountEl = document.getElementById('liveCount');
      const latestNewEl = document.getElementById('latestNew');
      if (liveCountEl && latestNewEl) {
        const current = parseInt(liveCountEl.innerText || '0', 10) || 0;
        liveCountEl.innerText = current + 1;
        latestNewEl.innerText = `${payload.type}: ${payload.title}`;
      }
      loadAll();
    });
    socket.on('item:claimed', () => loadAll());
    console.log('[socket.io] connected');
  } catch (e) {
    console.warn('[socket.io] init failed:', e.message);
  }
}

const state = { selectedItemId: null };

function setLoading(btnEl, isLoading) {
  if (!btnEl) return;
  if (isLoading) {
    btnEl.disabled = true;
    btnEl.dataset.original = btnEl.innerHTML;
    btnEl.innerHTML = '<i class="material-icons left">hourglass_empty</i>Working...';
  } else {
    btnEl.disabled = false;
    if (btnEl.dataset.original) btnEl.innerHTML = btnEl.dataset.original;
  }
}

/** Normalize any stored image path to a fully qualified URL */
function fullImageUrl(u) {
  if (!u) return 'images/item-placeholder.png';
  if (/^https?:\/\//i.test(u)) return u;      // already absolute
  if (u.startsWith('/')) return API_BASE + u; // e.g. "/uploads/..."
  return API_BASE + '/' + u;                  // e.g. "uploads/..."
}

function cardTemplate(item, mine = false) {
  const badge = item.type === 'lost' ? 'red' : 'green';
  const claimed = item.claimed ? '<span class="new badge grey" data-badge-caption="claimed"></span>' : '';
  const img = fullImageUrl(item.imageUrl);
  const actions = [];

  if (!item.claimed) {
    actions.push(`<a class="btn-small blue claim-btn" data-id="${item._id}"><i class="material-icons left">check_circle</i>Claim</a>`);
  }
  if (mine) {
    actions.push(`<a class="btn-small orange image-btn" data-id="${item._id}" data-image="${img}"><i class="material-icons left">image</i>Update Image</a>`);
    actions.push(`<a class="btn-small red remove-btn" data-id="${item._id}"><i class="material-icons left">delete</i>Remove</a>`);
  }

  return `
    <div class="col s12 m6 l4">
      <div class="card medium">
        <div class="card-image waves-effect waves-block waves-light">
          <img class="activator" src="${img}" alt="item">
        </div>
        <div class="card-content">
          <span class="card-title activator grey-text text-darken-4">
            ${item.title}
            <i class="material-icons right">more_vert</i>
            <span class="new badge ${badge}" data-badge-caption="${item.type}"></span>
            ${claimed}
          </span>
          <p>${new Date(item.date).toLocaleDateString()} • ${item.location}</p>
          <div class="item-actions">
            ${actions.join(' ')}
          </div>
        </div>
        <div class="card-reveal">
          <span class="card-title grey-text text-darken-4">Details<i class="material-icons right">close</i></span>
          <p>${item.description || 'No description provided.'}</p>
          <p>Contact: ${item.contactEmail}</p>
        </div>
      </div>
    </div>`;
}

function renderCards(whereId, items, mine = false) {
  const el = document.getElementById(whereId);
  el.innerHTML = items.map(i => cardTemplate(i, mine)).join('');

  el.querySelectorAll('.claim-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      try {
        const res = await fetch(`${API_BASE}/api/items/${id}/claim`, {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' }
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok) loadAll();
        else {
          M.toast({ html: j.message || `Claim failed (${res.status})` });
          console.error('[claim] status', res.status, j);
        }
      } catch (err) {
        console.error('[claim] network error', err);
        M.toast({ html: 'Network error while claiming' });
      }
    });
  });

  el.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Remove this item?')) return;
      try {
        const res = await fetch(`${API_BASE}/api/items/${id}`, { method: 'DELETE', headers: authHeaders() });
        const j = await res.json().catch(() => ({}));
        if (res.ok) { M.toast({ html: 'Removed' }); loadAll(); }
        else {
          M.toast({ html: j.message || `Remove failed (${res.status})` });
          console.error('[remove] status', res.status, j);
        }
      } catch (err) {
        console.error('[remove] network error', err);
        M.toast({ html: 'Network error while removing' });
      }
    });
  });

  el.querySelectorAll('.image-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedItemId = btn.getAttribute('data-id');
      const current = btn.getAttribute('data-image') || '';
      document.getElementById('modalImageUrl').value = current;
      document.getElementById('modalImageFile').value = '';
      M.updateTextFields();
      const modal = M.Modal.getInstance(document.getElementById('imageModal'));
      modal.open();
    });
  });
}

async function fetchItems({ type = '', mine = false } = {}) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (mine) params.set('mine', '1');
  const res = await fetch(`${API_BASE}/api/items?${params.toString()}`);
  const json = await res.json().catch(() => ({ data: [] }));
  return json.data || [];
}

async function loadAll() {
  const filterType = document.getElementById('filterType').value;
  const [all, lost, found, mine] = await Promise.all([
    fetchItems({ type: filterType || '' }),
    fetchItems({ type: 'lost' }),
    fetchItems({ type: 'found' }),
    fetchItems({ mine: true })
  ]);
  renderCards('cards-all', all);
  renderCards('cards-lost', lost);
  renderCards('cards-found', found);
  renderCards('cards-mine', mine, true);
}

function openSuccessCardModal(item) {
  const modalEl = document.getElementById('successModal');
  const instance = M.Modal.getInstance(modalEl);

  const imgEl = document.getElementById('successImage');
  const titleEl = document.getElementById('successTitle');
  const metaEl = document.getElementById('successMeta');
  const descEl = document.getElementById('successDesc');
  const typeBadge = document.getElementById('successType');

  imgEl.src = fullImageUrl(item.imageUrl);
  titleEl.textContent = item.title;
  typeBadge.setAttribute('data-badge-caption', item.type || '');
  typeBadge.className = `new badge ${item.type === 'lost' ? 'red' : 'green'}`;
  metaEl.textContent = `${new Date(item.date).toLocaleDateString()} • ${item.location}`;
  descEl.textContent = item.description || 'No description provided.';

  instance.open();
}

function validateReportForm() {
  const title = document.getElementById('title').value.trim();
  const type = document.getElementById('type').value;
  const date = document.getElementById('date').value;
  const location = document.getElementById('location').value.trim();
  const contactEmail = document.getElementById('contactEmail').value.trim();

  if (!title) { M.toast({ html: 'Please enter a title' }); document.getElementById('title').focus(); return false; }
  if (!type) { M.toast({ html: 'Please choose a type (Lost/Found)' }); document.getElementById('type').focus(); return false; }
  if (!date) { M.toast({ html: 'Please select a date' }); document.getElementById('date').focus(); return false; }
  if (!location) { M.toast({ html: 'Please enter a location' }); document.getElementById('location').focus(); return false; }
  if (!contactEmail) { M.toast({ html: 'Please enter a contact email' }); document.getElementById('contactEmail').focus(); return false; }
  return true;
}

async function submitForm(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('formSubmit');

  if (!isLoggedIn()) { M.toast({ html: 'Please login first' }); return; }
  if (!validateReportForm()) return;

  try {
    setLoading(submitBtn, true);

    const form = document.getElementById('reportForm');
    const fd = new FormData(form);

    const res = await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: { ...authHeaders() }, // DO NOT set Content-Type with FormData
      body: fd
    });

    let j = {};
    try { j = await res.json(); } catch (_) {}

    if (!res.ok) {
      console.error('[create] status', res.status, j);
      const msg = j && j.message ? j.message : `Create failed (${res.status})`;
      M.toast({ html: msg });
      if (res.status === 401) M.toast({ html: 'Tip: login again — token may be missing/expired.' });
      return;
    }

    // Success
    form.reset();
    document.getElementById('type').value = ''; // reset native select
    M.updateTextFields();

    await loadAll();
    if (j && j.data) openSuccessCardModal(j.data);
    M.toast({ html: 'Item added successfully!' });
  } catch (err) {
    console.error('[create] network error', err);
    M.toast({ html: 'Network error while creating item' });
  } finally {
    setLoading(submitBtn, false);
  }
}

async function saveImage() {
  if (!state.selectedItemId) return;
  const saveBtn = document.getElementById('saveImageBtn');

  try {
    setLoading(saveBtn, true);

    const url = document.getElementById('modalImageUrl').value.trim();
    const fileInput = document.getElementById('modalImageFile');
    const file = fileInput.files && fileInput.files[0];

    if (file) {
      const fd = new FormData();
      fd.append('imageFile', file);
      const res = await fetch(`${API_BASE}/api/items/${state.selectedItemId}`, {
        method: 'PUT',
        headers: { ...authHeaders() },
        body: fd
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        M.toast({ html: 'Image updated' });
        state.selectedItemId = null;
        loadAll();
      } else {
        console.error('[image:update:file] status', res.status, j);
        M.toast({ html: j.message || 'Update failed' });
      }
      return;
    }

    if (url) {
      const res = await fetch(`${API_BASE}/api/items/${state.selectedItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ imageUrl: url })
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        M.toast({ html: 'Image updated' });
        state.selectedItemId = null;
        loadAll();
      } else {
        console.error('[image:update:url] status', res.status, j);
        M.toast({ html: j.message || 'Update failed' });
      }
    } else {
      M.toast({ html: 'Provide a URL or choose a file' });
    }
  } catch (err) {
    console.error('[image:update] network error', err);
    M.toast({ html: 'Network error while updating image' });
  } finally {
    setLoading(saveBtn, false);
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  M.AutoInit();

  // Initialize filter select (Materialize-enhanced). Report form uses native select.
  const filterSelect = document.getElementById('filterType');
  if (filterSelect) M.FormSelect.init(filterSelect);

  const tabs = document.querySelectorAll('.tabs');
  M.Tabs.init(tabs);

  // Wire form & buttons
  document.getElementById('reportForm').addEventListener('submit', submitForm);
  document.getElementById('filterType').addEventListener('change', loadAll);
  document.getElementById('refreshBtn').addEventListener('click', loadAll);

  // Modals
  M.Modal.init(document.getElementById('imageModal'));
  M.Modal.init(document.getElementById('successModal'));
  document.getElementById('saveImageBtn').addEventListener('click', saveImage);

  // Try sockets (and try again in case CDN fallback loads later)
  initSocket();
  setTimeout(initSocket, 500);

  // Optional: health ping so you know if the API is reachable
  try {
    const ok = await fetch(`${API_BASE}/api/health`).then(r => r.ok).catch(() => false);
    if (!ok) {
      M.toast({ html: `Cannot reach API at ${API_BASE}. Is the server running?` });
    }
  } catch (_) {}

  // Initial load
  loadAll();
});
