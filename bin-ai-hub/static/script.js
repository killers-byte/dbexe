let currentMode = 'default';
let currentCustomPrompt = null;

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('-translate-x-full');
  sidebar.classList.toggle('translate-x-0');
  overlay.classList.toggle('hidden');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.add('-translate-x-full');
  sidebar.classList.remove('translate-x-0');
  overlay.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.mode-btn[onclick*="default"]').classList.add('active');
  document.getElementById('user-input').focus();
  loadCustomPromptList();
  document.querySelectorAll('#sidebar .mode-btn, #sidebar .tool-btn, #sidebar button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth < 1024) closeSidebar();
    });
  });
});

async function loadCustomPromptList() {
  try {
    const res = await fetch('/custom_prompts');
    const names = await res.json();
    const container = document.getElementById('custom-prompt-list');
    container.innerHTML = '';
    names.forEach(name => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between group hover:bg-white/5 rounded-lg px-3 py-2 transition-colors';
      const btn = document.createElement('button');
      btn.className = 'flex-1 text-left text-sm text-gray-300 hover:text-yellow-300 transition-colors truncate';
      btn.textContent = name;
      btn.onclick = () => activateJailbreak(name);
      const delBtn = document.createElement('button');
      delBtn.className = 'text-gray-600 hover:text-red-400 transition-colors ml-2 opacity-0 group-hover:opacity-100';
      delBtn.innerHTML = '<i class="fas fa-trash-alt text-xs"></i>';
      delBtn.title = 'Hapus prompt ini';
      delBtn.onclick = (e) => { e.stopPropagation(); deletePrompt(name); };
      div.appendChild(btn);
      div.appendChild(delBtn);
      container.appendChild(div);
    });
  } catch (e) {
    console.error('Gagal memuat custom prompts:', e);
  }
}

function activateJailbreak(name) {
  currentCustomPrompt = name;
  document.getElementById('jailbreak-indicator').classList.remove('hidden');
  document.getElementById('jailbreak-name-display').textContent = name;
  addMessage('system', `Jailbreak "${name}" diaktifkan.`);
}

function deactivateJailbreak() {
  currentCustomPrompt = null;
  document.getElementById('jailbreak-indicator').classList.add('hidden');
  addMessage('system', 'Jailbreak dinonaktifkan.');
}

async function deletePrompt(name) {
  if (!confirm(`Hapus prompt "${name}"?`)) return;
  await fetch('/custom_prompts/delete', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ name })
  });
  if (currentCustomPrompt === name) deactivateJailbreak();
  loadCustomPromptList();
}

function showAddPromptModal() {
  document.getElementById('prompt-modal').classList.remove('hidden');
  document.getElementById('prompt-name').value = '';
  document.getElementById('prompt-content').value = '';
}

function closePromptModal() {
  document.getElementById('prompt-modal').classList.add('hidden');
}

async function saveNewPrompt() {
  const name = document.getElementById('prompt-name').value.trim();
  const prompt = document.getElementById('prompt-content').value.trim();
  if (!name || !prompt) return alert('Nama dan prompt harus diisi.');
  await fetch('/custom_prompts/save', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ name, prompt })
  });
  closePromptModal();
  loadCustomPromptList();
}

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-indicator').textContent = 'Mode: ' + mode.toUpperCase();
  document.querySelectorAll('#mode-buttons .mode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`#mode-buttons .mode-btn[onclick="setMode('${mode}')"]`);
  if (btn) btn.classList.add('active');
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;
  addMessage('user', message);
  input.value = '';
  document.getElementById('welcome-message').classList.add('hidden');
  if (message.startsWith('/')) {
    handleCommand(message);
    return;
  }
  const tempId = addMessage('ai', '<i class="fas fa-circle-notch fa-spin mr-2"></i> Berpikir...');
  try {
    const body = { message, mode: currentMode };
    if (currentCustomPrompt) body.custom_prompt_name = currentCustomPrompt;
    const res = await fetch('/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    const data = await res.json();
    removeMessage(tempId);
    addMessage('ai', formatResponse(data.reply));
  } catch (err) {
    removeMessage(tempId);
    addMessage('ai', `Error: ${err.message}`);
  }
}

function handleCommand(cmd) {
  const parts = cmd.slice(1).split(' ');
  const command = parts[0];
  const arg = parts.slice(1).join(' ');
  switch(command) {
    case 'track': activateTool('track'); if(arg) document.getElementById('track-target').value = arg; break;
    case 'scan': activateTool('deepexploit_ui'); if(arg) document.getElementById('exploit-target').value = arg; break;
    case 'recon': activateTool('autorecon_ui'); if(arg) document.getElementById('recon-target').value = arg; break;
    case 'agent': activateTool('agent_ui'); if(arg) document.getElementById('agent-mission').value = arg; break;
    default: addMessage('system', 'Perintah tidak dikenal.');
  }
}

function activateTool(tool) {
  const panel = document.getElementById('tool-panel');
  panel.classList.remove('hidden');
  let html = '';
  switch(tool) {
    case 'track': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-cyan-400"><i class="fas fa-crosshairs"></i> OSINT Tracking</h3><input type="text" id="track-target" placeholder="email, nomor telepon, atau username" class="w-full"><button onclick="runTrack()">Lacak Target</button><div id="track-result" class="tool-output-box hidden"></div></div>`; break;
    case 'burp_ui': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-orange-400"><i class="fas fa-globe"></i> Burp Proxy Mini</h3><input type="text" id="burp-url" placeholder="https://target.com" class="w-full"><button onclick="runBurp()">Analisis HTTP</button><div id="burp-result" class="tool-output-box hidden"></div></div>`; break;
    case 'deepexploit_ui': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-pink-400"><i class="fas fa-bomb"></i> DeepExploit</h3><input type="text" id="exploit-target" placeholder="IP target" class="w-full"><button onclick="runDeepExploit()">Jalankan</button><div id="exploit-result" class="tool-output-box hidden"></div></div>`; break;
    case 'autorecon_ui': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-yellow-400"><i class="fas fa-satellite"></i> AutoRecon</h3><input type="text" id="recon-target" placeholder="domain.com" class="w-full"><button onclick="runAutoRecon()">Mulai Recon</button><div id="recon-result" class="tool-output-box hidden"></div></div>`; break;
    case 'agent_ui': html = `<div class="tool-panel-inner"><h3 class="text-lg font-bold text-purple-400"><i class="fas fa-robot"></i> Agen AI Otonom</h3><input type="text" id="agent-mission" placeholder="Deskripsikan misi..." class="w-full"><button onclick="runAgent()">Jalankan Misi</button><div id="agent-result" class="tool-output-box hidden"></div></div>`; break;
  }
  panel.innerHTML = html;
}

async function runTrack() {
  const target = document.getElementById('track-target').value.trim();
  if (!target) return;
  const res = await fetch('/tool/track', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ target }) });
  const data = await res.json();
  document.getElementById('track-result').classList.remove('hidden');
  document.getElementById('track-result').textContent = JSON.stringify(data.track_result, null, 2);
}
async function runBurp() {
  const url = document.getElementById('burp-url').value.trim();
  if (!url) return;
  const res = await fetch('/tool/burp', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ url }) });
  const data = await res.json();
  document.getElementById('burp-result').classList.remove('hidden');
  document.getElementById('burp-result').textContent = 'Response:\n' + JSON.stringify(data.response_info, null, 2) + '\n\nAI Analysis:\n' + data.ai_analysis;
}
async function runDeepExploit() {
  const target = document.getElementById('exploit-target').value.trim();
  if (!target) return;
  const res = await fetch('/tool/deepexploit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ target }) });
  const data = await res.json();
  document.getElementById('exploit-result').classList.remove('hidden');
  document.getElementById('exploit-result').textContent = 'Scan Result:\n' + JSON.stringify(data.scan_result, null, 2) + '\n\nAI Recommendation:\n' + data.ai_exploit_recommendation;
}
async function runAutoRecon() {
  const target = document.getElementById('recon-target').value.trim();
  if (!target) return;
  const res = await fetch('/tool/autorecon', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ target }) });
  const data = await res.json();
  document.getElementById('recon-result').classList.remove('hidden');
  document.getElementById('recon-result').textContent = JSON.stringify(data.recon_results, null, 2);
}
async function runAgent() {
  const mission = document.getElementById('agent-mission').value.trim();
  if (!mission) return;
  const res = await fetch('/tool/agent', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ mission }) });
  const data = await res.json();
  document.getElementById('agent-result').classList.remove('hidden');
  document.getElementById('agent-result').textContent = 'Agent Log:\n' + JSON.stringify(data.agent_log, null, 2) + '\n\nSummary:\n' + data.summary;
}

function addMessage(role, text, id = null) {
  const chatBox = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`;
  const bubble = document.createElement('div');
  bubble.className = `max-w-[85%] md:max-w-2xl px-4 py-3 ${role==='user' ? 'message-user' : role==='system' ? 'message-system' : 'message-ai'}`;
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
  document.getElementById('chat-box').innerHTML = '';
  document.getElementById('welcome-message').classList.remove('hidden');
}

function formatResponse(text) {
  return text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="text-xs overflow-x-auto my-2 p-3 bg-black/40 rounded-lg border border-white/10">$2</pre>').replace(/\n/g, '<br>');
}
