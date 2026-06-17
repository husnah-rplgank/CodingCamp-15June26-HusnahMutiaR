// =============================================
// TO-DO LIFE DASHBOARD — app.js
// =============================================

// --- STATE ---
const state = {
  tasks: [],
  links: [],
  userName: '',
  theme: 'light',
  timer: {
    duration: 25 * 60, // detik
    remaining: 25 * 60,
    running: false,
    interval: null,
    customMinutes: 25
  }
};

// --- DOM SELECTORS ---
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// =============================================
// STORAGE
// =============================================
function saveToStorage() {
  localStorage.setItem('dashboard_tasks',    JSON.stringify(state.tasks));
  localStorage.setItem('dashboard_links',    JSON.stringify(state.links));
  localStorage.setItem('dashboard_name',     state.userName);
  localStorage.setItem('dashboard_theme',    state.theme);
  localStorage.setItem('dashboard_timer_min', state.timer.customMinutes);
}

function loadFromStorage() {
  try {
    const tasks = localStorage.getItem('dashboard_tasks');
    const links = localStorage.getItem('dashboard_links');
    const name  = localStorage.getItem('dashboard_name');
    const theme = localStorage.getItem('dashboard_theme');
    const timerMin = localStorage.getItem('dashboard_timer_min');

    if (tasks) state.tasks = JSON.parse(tasks);
    if (links) state.links = JSON.parse(links);
    if (name)  state.userName = name;
    if (theme) state.theme = theme;
    if (timerMin) {
      const m = parseInt(timerMin);
      if (m > 0 && m <= 120) {
        state.timer.customMinutes = m;
        state.timer.duration  = m * 60;
        state.timer.remaining = m * 60;
      }
    }
  } catch (e) {
    console.warn('Gagal memuat data dari Local Storage:', e);
  }
}

// =============================================
// THEME (Light / Dark Mode)
// =============================================
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = $('theme-btn');
  btn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
  btn.title = state.theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap';
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme();
  saveToStorage();
}

// =============================================
// GREETING & WAKTU
// =============================================
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5)  return 'Selamat Dini Hari';
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function formatTime(date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatDate(date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function updateClock() {
  const now = new Date();
  $('time-display').textContent = formatTime(now);
  $('date-display').textContent = formatDate(now);

  const nameStr = state.userName ? `, ${state.userName}` : '';
  $('greeting-text').innerHTML = `${getGreeting()}<span class="name-highlight">${nameStr}</span> 👋`;
}

function saveName() {
  const val = $('name-input').value.trim();
  if (val.length > 30) { showToast('Nama terlalu panjang (maks 30 karakter)', 'warning'); return; }
  state.userName = val;
  saveToStorage();
  updateClock();
  showToast(val ? `Halo, ${val}! 👋` : 'Nama dihapus', 'success');
}

// =============================================
// FOCUS TIMER
// =============================================
function getCircumference() { return 2 * Math.PI * 80; } // r=80
const CIRC = getCircumference(); // ~502.65

function updateTimerUI() {
  const { remaining, duration } = state.timer;
  const min = Math.floor(remaining / 60).toString().padStart(2, '0');
  const sec = (remaining % 60).toString().padStart(2, '0');
  $('timer-time').textContent = `${min}:${sec}`;

  const progress = remaining / duration;
  const offset   = CIRC * (1 - progress);
  $('timer-ring-progress').style.strokeDashoffset = offset;
  $('timer-ring-progress').style.strokeDasharray  = CIRC;

  // Label status
  if (state.timer.running) {
    $('timer-label').textContent = 'SEDANG FOKUS';
    $('timer-ring-progress').style.stroke = 'var(--accent)';
  } else if (state.timer.remaining === 0) {
    $('timer-label').textContent = 'SELESAI! 🎉';
    $('timer-ring-progress').style.stroke = 'var(--done)';
  } else {
    $('timer-label').textContent = 'SIAP FOKUS';
    $('timer-ring-progress').style.stroke = 'var(--accent)';
  }
}

function startTimer() {
  if (state.timer.running) return;
  if (state.timer.remaining === 0) return;
  state.timer.running = true;
  $('start-btn').disabled = true;
  $('stop-btn').disabled  = false;

  state.timer.interval = setInterval(() => {
    state.timer.remaining--;
    updateTimerUI();
    if (state.timer.remaining <= 0) {
      clearInterval(state.timer.interval);
      state.timer.running = false;
      $('start-btn').disabled = false;
      $('stop-btn').disabled  = true;
      updateTimerUI();
      showToast('⏰ Sesi fokus selesai! Istirahat dulu ya.', 'success');
      // Notif browser
      if (Notification.permission === 'granted') {
        new Notification('Fokus Selesai! 🎉', { body: 'Waktunya istirahat sejenak.' });
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timer.interval);
  state.timer.running = false;
  $('start-btn').disabled = false;
  $('stop-btn').disabled  = true;
  updateTimerUI();
}

function resetTimer() {
  stopTimer();
  state.timer.remaining = state.timer.duration;
  updateTimerUI();
}

function applyCustomDuration() {
  const val = parseInt($('duration-input').value);
  if (!val || val < 1 || val > 120) {
    showToast('Durasi harus antara 1–120 menit', 'warning');
    $('duration-input').value = state.timer.customMinutes;
    return;
  }
  stopTimer();
  state.timer.customMinutes = val;
  state.timer.duration      = val * 60;
  state.timer.remaining     = val * 60;
  updateTimerUI();
  saveToStorage();
  showToast(`Durasi diubah menjadi ${val} menit`, 'success');
}

// =============================================
// TO-DO LIST
// =============================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function isDuplicate(text) {
  return state.tasks.some(t => t.text.trim().toLowerCase() === text.trim().toLowerCase());
}

function addTask() {
  const input = $('task-input');
  const text  = input.value.trim();
  if (!text) return;

  // Cek duplikat
  if (isDuplicate(text)) {
    showToast('⚠️ Tugas ini sudah ada!', 'warning');
    input.focus();
    return;
  }

  const task = {
    id:   generateId(),
    text: text,
    done: false,
    createdAt: Date.now()
  };

  state.tasks.unshift(task);
  input.value = '';
  saveToStorage();
  renderTasks();
  showToast('Tugas ditambahkan ✓', 'success');
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    task.doneAt = task.done ? Date.now() : null;
    saveToStorage();
    renderTasks();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveToStorage();
  renderTasks();
  showToast('Tugas dihapus', 'error');
}

function startEditTask(id) {
  const item = document.querySelector(`.task-item[data-id="${id}"]`);
  if (!item) return;
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const textEl = item.querySelector('.task-text');
  const actEl  = item.querySelector('.task-actions');

  const editInput = document.createElement('input');
  editInput.type  = 'text';
  editInput.value = task.text;
  editInput.className = 'task-edit-input';
  textEl.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  // Ganti tombol edit jadi save
  actEl.innerHTML = `
    <button class="task-btn save" title="Simpan" onclick="saveEditTask('${id}', this)">💾</button>
    <button class="task-btn delete" title="Hapus" onclick="deleteTask('${id}')">🗑️</button>
  `;

  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveEditTask(id, actEl.querySelector('.save'));
    if (e.key === 'Escape') renderTasks();
  });
}

function saveEditTask(id, btn) {
  const item  = document.querySelector(`.task-item[data-id="${id}"]`);
  const input = item ? item.querySelector('.task-edit-input') : null;
  if (!input) return;

  const newText = input.value.trim();
  if (!newText) { showToast('Teks tugas tidak boleh kosong', 'warning'); return; }

  // Cek duplikat (kecuali task itu sendiri)
  const dupExists = state.tasks.some(t => t.id !== id && t.text.trim().toLowerCase() === newText.toLowerCase());
  if (dupExists) { showToast('⚠️ Tugas serupa sudah ada!', 'warning'); return; }

  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.text = newText;
    saveToStorage();
    renderTasks();
    showToast('Tugas diperbarui ✓', 'success');
  }
}

function clearDoneTasks() {
  const count = state.tasks.filter(t => t.done).length;
  if (!count) return;
  state.tasks = state.tasks.filter(t => !t.done);
  saveToStorage();
  renderTasks();
  showToast(`${count} tugas selesai dihapus`, 'success');
}

function getSortedTasks() {
  const mode  = $('sort-select').value;
  const tasks = [...state.tasks];
  if (mode === 'az')    return tasks.sort((a, b) => a.text.localeCompare(b.text, 'id'));
  if (mode === 'za')    return tasks.sort((a, b) => b.text.localeCompare(a.text, 'id'));
  if (mode === 'done')  return tasks.sort((a, b) => Number(a.done) - Number(b.done));
  if (mode === 'undone')return tasks.sort((a, b) => Number(b.done) - Number(a.done));
  return tasks; // default: urutan tambah (newest first)
}

function renderTasks() {
  const list    = $('task-list');
  const sorted  = getSortedTasks();
  const doneCount   = state.tasks.filter(t => t.done).length;
  const totalCount  = state.tasks.length;

  $('task-counter').textContent = `${doneCount}/${totalCount} selesai`;

  if (!sorted.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        Belum ada tugas. Tambahkan tugas di atas!
      </div>`;
    return;
  }

  list.innerHTML = sorted.map(task => `
    <li class="task-item ${task.done ? 'done' : ''}" data-id="${task.id}">
      <div class="task-check ${task.done ? 'checked' : ''}"
           onclick="toggleTask('${task.id}')"
           title="${task.done ? 'Tandai belum selesai' : 'Tandai selesai'}">
      </div>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <div class="task-actions">
        <button class="task-btn edit"   title="Edit"  onclick="startEditTask('${task.id}')">✏️</button>
        <button class="task-btn delete" title="Hapus" onclick="deleteTask('${task.id}')">🗑️</button>
      </div>
    </li>
  `).join('');
}

// =============================================
// QUICK LINKS
// =============================================
function addLink() {
  const nameVal = $('link-name').value.trim();
  const urlVal  = $('link-url').value.trim();

  if (!nameVal) { showToast('Masukkan nama link', 'warning'); return; }
  if (!urlVal)  { showToast('Masukkan URL', 'warning'); return; }

  let url = urlVal;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Validasi URL sederhana
  try { new URL(url); } catch { showToast('URL tidak valid', 'error'); return; }

  const link = { id: generateId(), name: nameVal, url };
  state.links.push(link);
  $('link-name').value = '';
  $('link-url').value  = '';
  saveToStorage();
  renderLinks();
  showToast(`Link "${nameVal}" ditambahkan ✓`, 'success');
}

function deleteLink(id) {
  state.links = state.links.filter(l => l.id !== id);
  saveToStorage();
  renderLinks();
}

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
  } catch { return ''; }
}

function renderLinks() {
  const grid = $('links-grid');
  if (!state.links.length) {
    grid.innerHTML = `<span style="color:var(--text-muted);font-size:13px;">Belum ada link. Tambahkan di bawah!</span>`;
    return;
  }

  grid.innerHTML = state.links.map(link => `
    <a class="link-chip" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
      <img class="link-favicon"
           src="${getFavicon(link.url)}"
           alt=""
           onerror="this.style.display='none'"
           loading="lazy">
      ${escapeHtml(link.name)}
      <button class="link-delete-btn"
              title="Hapus link"
              onclick="event.preventDefault(); deleteLink('${link.id}')">✕</button>
    </a>
  `).join('');
}

// =============================================
// TOAST NOTIFICATION
// =============================================
function showToast(msg, type = 'default') {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =============================================
// UTILITY
// =============================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================
// INIT
// =============================================
function init() {
  loadFromStorage();
  applyTheme();
  updateClock();
  setInterval(updateClock, 1000);

  // Timer init
  $('duration-input').value = state.timer.customMinutes;
  updateTimerUI();

  // Render data
  renderTasks();
  renderLinks();

  // Nama di input
  $('name-input').value = state.userName;

  // Event listeners
  $('theme-btn').addEventListener('click', toggleTheme);
  $('name-save-btn').addEventListener('click', saveName);
  $('name-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });

  $('start-btn').addEventListener('click', startTimer);
  $('stop-btn').addEventListener('click', stopTimer);
  $('reset-btn').addEventListener('click', resetTimer);
  $('apply-duration-btn').addEventListener('click', applyCustomDuration);
  $('duration-input').addEventListener('keydown', e => { if (e.key === 'Enter') applyCustomDuration(); });

  $('task-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  $('add-task-btn').addEventListener('click', addTask);
  $('sort-select').addEventListener('change', renderTasks);
  $('clear-done-btn').addEventListener('click', clearDoneTasks);

  $('add-link-btn').addEventListener('click', addLink);
  $('link-url').addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });
  $('link-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('link-url').focus(); });

  // Minta izin notifikasi browser
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Inisialisasi SVG ring
  $('timer-ring-progress').style.strokeDasharray  = CIRC;
  $('timer-ring-progress').style.strokeDashoffset = 0;
}

document.addEventListener('DOMContentLoaded', init);
