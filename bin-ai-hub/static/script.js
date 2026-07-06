let currentMode = 'default';
let currentCustomPrompt = null;

// ========== SIDEBAR TOGGLE ==========
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('-translate-x-full');
  sidebar.classList.toggle('translate-x-0');
  overlay.classList.toggle('hidden');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.add('-translate-x-full');
  document.getElementById('sidebar-overlay').classList.add('hidden');
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  // Set default active mode button
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  const defaultBtn = document.querySelector('.mode-btn[onclick*="default"]');
  if (defaultBtn) defaultBtn.classList.add('active');
  document.getElementById('user-input').focus();

  // Load custom prompts (non-blocking)
  loadCustomPromptList();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      document.getElementById('user-input').focus();
    }
    if (e.key === 'Escape') {
      closeSidebar();
      document.getElementById('tool-panel').classList.add('hidden');
    }
  });
});

// ========== CUSTOM PROMPT MANAGEMENT (FIXED) ==========
async function loadCustomPromptList() {
  try {
    const res = await fetch('/custom_prompts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const names = await res.json();
    const container = document.getElementById('custom-prompt-list');
    container.innerHTML = '';
    if (names.length === 0) {
      container.innerHTML = '<p class="text-xs text-gray-500 italic px-3">Belum ada prompt.</p>';
      return;
    }
    names.forEach(name => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between group hover:bg-cyan-500/10 rounded-lg px-3 py-2 transition-colors';
      const btn = document.createElement('button');
      btn.className = 'flex-1 text-left text-sm text-gray-300 hover:text-yellow-300 transition-colors truncate';
      btn.textContent = name;
      btn.onclick = () => activateJailbreak(name);
      const delBtn = document.createElement('button');
      delBtn.className = 'text-gray-600 hover:text-red-400 transition-colors ml-2 opacity-0 group-hover:opacity-100';
      delBtn.innerHTML = '<i class="fas fa-trash-alt text-xs"></i>';
      delBtn.title = 'Hapus prompt';
      delBtn.onclick = (e) => { e.stopPropagation(); deletePrompt(name); };
      div.appendChild(btn);
      div.appendChild(delBtn);
      container.appendChild(div);
    });
  } catch (err) {
    console.warn('Gagal memuat prompt, mungkin server belum siap:', err);
    document.getElementById('custom-prompt-list').innerHTML = '<p class="text-xs text-red-400 italic px-3">Gagal memuat prompt. <button onclick="loadCustomPromptList()" class="underline">Coba lagi</button></p>';
  }
}

function activateJailbreak(name) {
  currentCustomPrompt = name;
  document.getElementById('jailbreak-indicator').classList.remove('hidden');
  document.getElementById('jailbreak-name-display').textContent = name;
  addMessage('system', `Jailbreak "${name}" diaktifkan.`);
  showToast(`Jailbreak "${name}" aktif`, 'success');
}

function deactivateJailbreak() {
  currentCustomPrompt = null;
  document.getElementById('jailbreak-indicator').classList.add('hidden');
  addMessage('system', 'Jailbreak dinonaktifkan.');
  showToast('Jailbreak nonaktif', 'info');
}

async function deletePrompt(name) {
  if (!confirm(`Hapus prompt "${name}"?`)) return;
  await fetch('/custom_prompts/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
  if (currentCustomPrompt === name) deactivateJailbreak();
  loadCustomPromptList();
  showToast('Prompt dihapus', 'info');
}

function showAddPromptModal() {
  document.getElementById('prompt-modal').classList.remove('hidden');
  document.getElementById('prompt-name').value = '';
  document.getElementById('prompt-content').value = '';
}
function closePromptModal() { document.getElementById('prompt-modal').classList.add('hidden'); }
async function saveNewPrompt() {
  const name = document.getElementById('prompt-name').value.trim();
  const prompt = document.getElementById('prompt-content').value.trim();
  if (!name || !prompt) return showToast('Nama dan prompt harus diisi', 'error');
  await fetch('/custom_prompts/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, prompt }) });
  closePromptModal();
  loadCustomPromptList();
  showToast('Prompt disimpan', 'success');
}

// ========== MODE AI ==========
function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-indicator').textContent = 'Mode: ' + mode.toUpperCase();
  document.querySelectorAll('#mode-buttons .mode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`#mode-buttons .mode-btn[onclick="setMode('${mode}')"]`);
  if (btn) btn.classList.add('active');
  showToast(`Mode ${mode} aktif`, 'info');
}

// ========== CHAT (FIXED) ==========
async function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;
  addMessage('user', message);
  input.value = '';
  hideWelcome();

  if (message.startsWith('/')) {
    handleCommand(message);
    return;
  }

  const tempId = addMessage('ai', '<i class="fas fa-circle-notch fa-spin mr-2"></i> Memproses...');
  try {
    const body = { message, mode: currentMode };
    if (currentCustomPrompt) body.custom_prompt_name = currentCustomPrompt;
    const res = await fetch('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    removeMessage(tempId);
    if (!res.ok) {
      addMessage('ai', `Error: ${data.reply || 'Gagal memproses.'}`);
      showToast('Gagal memproses', 'error');
    } else {
      addMessage('ai', formatResponse(data.reply));
    }
  } catch (err) {
    removeMessage(tempId);
    addMessage('ai', `Koneksi gagal: ${err.message}`);
    showToast('Koneksi gagal', 'error');
  }
}

function handleCommand(cmd) {
  const parts = cmd.slice(1).split(' ');
  const command = parts[0];
  const arg = parts.slice(1).join(' ');
  switch (command) {
    case 'track': activateTool('track'); if (arg) document.getElementById('track-target').value = arg; break;
    case 'scan': activateTool('deepexploit_ui'); if (arg) document.getElementById('exploit-target').value = arg; break;
    case 'recon': activateTool('autorecon_ui'); if (arg) document.getElementById('recon-target').value = arg; break;
    case 'agent': activateTool('agent_ui'); if (arg) document.getElementById('agent-mission').value = arg; break;
    case 'clear': clearChat(); break;
    case 'menu': case 'help':
      addMessage('system', 'Perintah tersedia: /track [target], /scan [ip], /recon [domain], /agent [misi], /clear, /menu');
      break;
    default: addMessage('system', 'Perintah tidak dikenal. Ketik /menu');
  }
}

// ========== TOOLS PANEL ==========
function activateTool(tool) {
  const panel = document.getElementById('tool-panel');
  panel.classList.remove('hidden');
  let html = '';
  switch (tool) {
    case 'track': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-cyan-400"><i class="fas fa-crosshairs"></i> OSINT Tracking</h3><input type="text" id="track-target" placeholder="email, nomor telepon, atau username" class="w-full"><button onclick="runTrack()">Lacak Target</button><div id="track-result" class="tool-output-box hidden"></div></div>`; break;
    case 'burp_ui': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-orange-400"><i class="fas fa-globe"></i> Burp Proxy Mini</h3><input type="text" id="burp-url" placeholder="https://target.com" class="w-full"><button onclick="runBurp()">Analisis HTTP</button><div id="burp-result" class="tool-output-box hidden"></div></div>`; break;
    case 'deepexploit_ui': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-pink-400"><i class="fas fa-bomb"></i> DeepExploit</h3><input type="text" id="exploit-target" placeholder="IP target" class="w-full"><button onclick="runDeepExploit()">Jalankan</button><div id="exploit-result" class="tool-output-box hidden"></div></div>`; break;
    case 'autorecon_ui': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-yellow-400"><i class="fas fa-satellite"></i> AutoRecon</h3><input type="text" id="recon-target" placeholder="domain.com" class="w-full"><button onclick="runAutoRecon()">Mulai Recon</button><div id="recon-result" class="tool-output-box hidden"></div></div>`; break;
    case 'agent_ui': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-purple-400"><i class="fas fa-robot"></i> Agen AI Otonom</h3><input type="text" id="agent-mission" placeholder="Deskripsikan misi..." class="w-full"><button onclick="runAgent()">Jalankan Misi</button><div id="agent-result" class="tool-output-box hidden"></div></div>`; break;
  }
  panel.innerHTML = html;
  showToast(`Tool ${tool} dibuka`, 'info');
}

// Tool functions (no changes)
async function runTrack() {
  const target = document.getElementById('track-target').value.trim();
  if (!target) return;
  const res = await fetch('/tool/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target }) });
  const data = await res.json();
  document.getElementById('track-result').classList.remove('hidden');
  document.getElementById('track-result').textContent = JSON.stringify(data.track_result, null, 2);
}
async function runBurp() {
  const url = document.getElementById('burp-url').value.trim();
  if (!url) return;
  const res = await fetch('/tool/burp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
  const data = await res.json();
  document.getElementById('burp-result').classList.remove('hidden');
  document.getElementById('burp-result').textContent = 'Response:\n' + JSON.stringify(data.response_info, null, 2) + '\n\nAI Analysis:\n' + data.ai_analysis;
}
async function runDeepExploit() {
  const target = document.getElementById('exploit-target').value.trim();
  if (!target) return;
  const res = await fetch('/tool/deepexploit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target }) });
  const data = await res.json();
  document.getElementById('exploit-result').classList.remove('hidden');
  document.getElementById('exploit-result').textContent = 'Scan Result:\n' + JSON.stringify(data.scan_result, null, 2) + '\n\nAI Recommendation:\n' + data.ai_exploit_recommendation;
}
async function runAutoRecon() {
  const target = document.getElementById('recon-target').value.trim();
  if (!target) return;
  const res = await fetch('/tool/autorecon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target }) });
  const data = await res.json();
  document.getElementById('recon-result').classList.remove('hidden');
  document.getElementById('recon-result').textContent = JSON.stringify(data.recon_results, null, 2);
}
async function runAgent() {
  const mission = document.getElementById('agent-mission').value.trim();
  if (!mission) return;
  const res = await fetch('/tool/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mission }) });
  const data = await res.json();
  document.getElementById('agent-result').classList.remove('hidden');
  document.getElementById('agent-result').textContent = 'Agent Log:\n' + JSON.stringify(data.agent_log, null, 2) + '\n\nSummary:\n' + data.summary;
}

// ========== UI HELPERS ==========
function addMessage(role, text, id = null) {
  const chatBox = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`;
  const bubble = document.createElement('div');
  bubble.className = `max-w-[85%] md:max-w-2xl px-4 py-3 ${role === 'user' ? 'message-user' : role === 'system' ? 'message-system' : 'message-ai'}`;
  if (id) bubble.id = id;
  bubble.innerHTML = text;
  div.appendChild(bubble);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return id || bubble;
}

function removeMessage(id) {
  const el = document.getElementById(id);
  if (el) el.parentElement.remove();
}

function clearChat() {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = '';
  const welcome = document.createElement('div');
  welcome.className = 'flex flex-col items-center justify-center h-full text-gray-500';
  welcome.id = 'welcome-message';
  welcome.innerHTML = `
    <i class="fas fa-shield-haltered text-6xl mb-4 text-cyan-500/30"></i>
    <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Badan Intelijen Negara</h2>
    <p class="mt-2 text-sm text-center">Pilih mode AI, aktifkan jailbreak, atau jalankan tools.</p>
    <p class="text-xs text-gray-600 mt-4">Ketik <code class="bg-gray-800 px-1 rounded">/menu</code> untuk bantuan perintah.</p>
  `;
  chatBox.appendChild(welcome);
  showToast('Chat dibersihkan', 'info');
}

function hideWelcome() {
  const welcome = document.getElementById('welcome-message');
  if (welcome) welcome.classList.add('hidden');
}

function formatResponse(text) {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="text-xs overflow-x-auto my-2 p-3 bg-black/40 rounded-lg border border-cyan-500/20">$2</pre>')
    .replace(/\n/g, '<br>');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `fixed bottom-5 right-5 px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 z-50 ${
    type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-cyan-600'
  } text-white show`;
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
