(function() {
  // VS Code API
  const vscode = acquireVsCodeApi();

  const messagesContainer = document.getElementById('messagesContainer');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const modelSelect = document.getElementById('modelSelect');
  const setApiKeyBtn = document.getElementById('setApiKeyBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const quickBtns = document.querySelectorAll('.quick-btn');

  let isGenerating = false;

  // Restore previous state if available
  const prevState = vscode.getState() || { messages: [] };
  if (prevState.messages && prevState.messages.length > 0) {
    prevState.messages.forEach(msg => appendMessageUI(msg.role, msg.content, msg.time, false));
  } else {
    // Welcome initial message
    appendMessageUI('assistant', 'Halo! Saya asisten AI yang terhubung langsung ke **Tamandata AI**.\n\nPilih model atau ketik pertanyaan seputar koding, analisis, dan perbaikan bug di bawah.', getCurrentTime(), false);
  }

  // Adjust textarea height dynamically
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  // Handle Enter to send, Shift+Enter for newline
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Quick Action Buttons
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      vscode.postMessage({ command: 'quickAction', action: action });
    });
  });

  setApiKeyBtn.addEventListener('click', () => {
    vscode.postMessage({ command: 'openApiKeySettings' });
  });

  clearChatBtn.addEventListener('click', () => {
    messagesContainer.innerHTML = '';
    vscode.setState({ messages: [] });
    appendMessageUI('assistant', 'Riwayat chat telah dibersihkan.', getCurrentTime(), false);
  });

  // Send Message logic
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || isGenerating) return;

    chatInput.value = '';
    chatInput.style.height = '40px';

    const now = getCurrentTime();
    appendMessageUI('user', text, now, true);

    isGenerating = true;
    sendBtn.disabled = true;
    showTypingIndicator();

    vscode.postMessage({
      command: 'askTamandata',
      prompt: text,
      model: modelSelect.value
    });
  }

  // Handle incoming messages from Extension host
  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'response':
        hideTypingIndicator();
        isGenerating = false;
        sendBtn.disabled = false;
        appendMessageUI('assistant', message.content, getCurrentTime(), true);
        break;

      case 'error':
        hideTypingIndicator();
        isGenerating = false;
        sendBtn.disabled = false;
        appendMessageUI('assistant', `⚠️ **Error:** ${message.content}`, getCurrentTime(), true);
        break;

      case 'setPrompt':
        chatInput.value = message.text;
        chatInput.focus();
        chatInput.dispatchEvent(new Event('input'));
        break;
        
      case 'clear':
        messagesContainer.innerHTML = '';
        vscode.setState({ messages: [] });
        break;
    }
  });

  function getCurrentTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function appendMessageUI(role, content, time, saveState = true) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = renderMarkdown(content);

    const timeMeta = document.createElement('div');
    timeMeta.className = 'meta-time';
    timeMeta.textContent = time;

    wrapper.appendChild(bubble);
    wrapper.appendChild(timeMeta);
    messagesContainer.appendChild(wrapper);

    // Attach copy-code handlers
    bubble.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pre = btn.closest('pre');
        const code = pre.querySelector('code').innerText;
        navigator.clipboard.writeText(code);
        btn.textContent = 'Tersalin!';
        setTimeout(() => { btn.textContent = 'Salin'; }, 2000);
      });
    });

    // Attach insert-into-editor handlers
    bubble.querySelectorAll('.insert-code-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pre = btn.closest('pre');
        const code = pre.querySelector('code').innerText;
        vscode.postMessage({ command: 'insertCode', code: code });
      });
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    if (saveState) {
      const state = vscode.getState() || { messages: [] };
      state.messages.push({ role, content, time });
      vscode.setState(state);
    }
  }

  function showTypingIndicator() {
    hideTypingIndicator();
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }

  // Lightweight safe markdown parser for UI
  function renderMarkdown(md) {
    if (!md) return '';
    let escaped = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Fenced Code blocks
    escaped = escaped.replace(/```([a-zA-Z0-9_\-]+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const langLabel = lang || 'code';
      return `<pre><div class="code-header"><span>${langLabel}</span><div><button class="copy-code-btn">Salin</button> <button class="copy-code-btn insert-code-btn" style="color:#a78bfa;">Sisipkan</button></div></div><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold & italic
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Simple paragraphs
    return escaped.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('');
  }

})();
