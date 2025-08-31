// frontend-only chat page logic
// Uses window.API_CONFIG if backend is available, but gracefully works offline

(function () {
  const API_URL = window.API_CONFIG?.API_URL;

  // Elements
  const threadList = document.getElementById('threadList');
  const messagesEl = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const typingEl = document.getElementById('typing');
  const newChatBtn = document.getElementById('newChatBtn');
  const searchInput = document.getElementById('searchInput');
  const startSessionBtn = document.getElementById('startSessionBtn');

  // Simple local persistence
  const STORAGE_KEY_THREADS = 'astro_chat_threads_v1';
  const STORAGE_KEY_ACTIVE = 'astro_chat_active_v1';

  let threads = loadThreads();
  let activeThreadId = localStorage.getItem(STORAGE_KEY_ACTIVE) || null;

  // Seed a default thread
  if (!threads.length) {
    const seeded = createThread('Astro Support');
    threads.push(seeded);
    activeThreadId = seeded.id;
    saveAll();
  }

  renderThreads();
  switchThread(activeThreadId);

  // Events
  sendBtn.addEventListener('click', onSend);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  });

  newChatBtn.addEventListener('click', () => {
    const t = createThread('New Chat');
    threads.unshift(t);
    activeThreadId = t.id;
    saveAll();
    renderThreads();
    switchThread(activeThreadId);
    messageInput.focus();
  });

  searchInput.addEventListener('input', renderThreads);

  startSessionBtn.addEventListener('click', () => {
    toast('Session started (frontend-only demo).');
  });

  // Functions
  function onSend() {
    const text = messageInput.value.trim();
    if (!text) return;

    const thread = getActiveThread();
    const msg = makeMessage('user', text);
    thread.messages.push(msg);

    messageInput.value = '';
    saveAll();
    renderMessages(thread);

    // Simulated typing + reply
    typing(true);
    setTimeout(async () => {
      let replyText = generateAutoReply(text);

      // Optional: try hitting a health endpoint if API exists
      if (API_URL) {
        try {
          // Example: GET /sessions/health (adjust in backend later)
          const res = await fetch(API_URL + '/sessions/health').catch(() => null);
          if (res && res.ok) {
            replyText = replyText + '\n\n(Backend reachable)';
          }
        } catch (_) {}
      }

      const botMsg = makeMessage('agent', replyText);
      thread.messages.push(botMsg);
      saveAll();
      typing(false);
      renderMessages(thread);
    }, 600);
  }

  function typing(state) {
    typingEl.hidden = !state;
  }

  function renderThreads() {
    const q = (searchInput.value || '').toLowerCase();
    threadList.innerHTML = '';

    threads
      .filter((t) => !q || t.title.toLowerCase().includes(q))
      .forEach((t) => {
        const li = document.createElement('li');
        li.className = 'thread' + (t.id === activeThreadId ? ' active' : '');
        li.innerHTML = `
          <div class="avatar">
            <img src="./img/astrologer.png" alt="avatar">
          </div>
          <div class="meta">
            <div class="title">${escapeHTML(t.title)}</div>
            <div class="preview">${escapeHTML(t.messages.at(-1)?.text || 'No messages yet')}</div>
          </div>
          <div class="time">${formatTime(t.updatedAt)}</div>
        `;
        li.addEventListener('click', () => {
          activeThreadId = t.id;
          localStorage.setItem(STORAGE_KEY_ACTIVE, activeThreadId);
          renderThreads();
          switchThread(t.id);
        });
        threadList.appendChild(li);
      });
  }

  function switchThread(id) {
    const t = threads.find((x) => x.id === id) || threads[0];
    if (!t) return;
    renderMessages(t);
  }

  function renderMessages(thread) {
    // update recents ordering and timestamp
    thread.updatedAt = Date.now();
    threads = [thread, ...threads.filter((x) => x.id !== thread.id)];

    messagesEl.innerHTML = '';
    thread.messages.forEach((m) => messagesEl.appendChild(renderMessage(m)));

    // scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;

    renderThreads();
  }

  function renderMessage(m) {
    const wrap = document.createElement('div');
    wrap.className = 'message ' + (m.role === 'user' ? 'out' : 'in');

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = formatMessageHTML(m.text);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = formatTime(m.ts);

    wrap.appendChild(bubble);
    wrap.appendChild(meta);
    return wrap;
  }

  // Helpers
  function loadThreads() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_THREADS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveAll() {
    localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(threads));
    if (activeThreadId) localStorage.setItem(STORAGE_KEY_ACTIVE, activeThreadId);
  }

  function createThread(title) {
    return {
      id: 't_' + Math.random().toString(36).slice(2, 9),
      title: title || 'Chat',
      updatedAt: Date.now(),
      messages: [
        makeMessage('agent', 'Hello! This is a demo chat (frontend-only). Ask anything about your session, wallet, or bookings.')
      ]
    };
  }

  function makeMessage(role, text) {
    return {
      id: 'm_' + Math.random().toString(36).slice(2, 9),
      role, // 'user' | 'agent'
      text,
      ts: Date.now()
    };
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHTML(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatMessageHTML(text) {
    const safe = escapeHTML(text)
      .replace(/\n/g, '<br/>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1<\/a>');
    return safe;
  }

  function generateAutoReply(userText) {
    // Tiny heuristic for demo
    const t = userText.toLowerCase();
    if (t.includes('price') || t.includes('rate')) {
      return 'Current rates: ₹10/min for chat, ₹15/min for calls. New users get 5 mins free.';
    }
    if (t.includes('wallet') || t.includes('recharge')) {
      return 'You can recharge your wallet from Wallet page. Payments are secured via Razorpay.';
    }
    if (t.includes('book') || t.includes('appointment')) {
      return 'To book an appointment, go to Appointments and select your astrologer and time slot.';
    }
    return 'Thanks for your message! An astrologer will reply shortly.';
  }

  // Small toast helper
  function toast(msg) {
    let el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 200);
    }, 2500);
  }
})();
