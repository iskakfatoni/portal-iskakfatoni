const vscode = require('vscode');
const https = require('https');
const http = require('http');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const provider = new TamandataChatViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(TamandataChatViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  // Command: Buka Chat
  context.subscriptions.push(
    vscode.commands.registerCommand('tamandata.openChat', () => {
      vscode.commands.executeCommand('workbench.view.extension.tamandata-sidebar-container');
    })
  );

  // Command: Atur API Key
  context.subscriptions.push(
    vscode.commands.registerCommand('tamandata.setApiKey', async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: 'Masukkan API Key Tamandata AI Anda (dari https://ai.tamandata.com)',
        password: true,
        placeHolder: 'tk-...'
      });

      if (apiKey !== undefined) {
        await context.secrets.store('tamandata_api_key', apiKey.trim());
        vscode.window.showInformationMessage('API Key Tamandata AI berhasil disimpan!');
      }
    })
  );

  // Command: Kirim Kode Terpilih
  context.subscriptions.push(
    vscode.commands.registerCommand('tamandata.sendSelection', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('Buka berkas dan pilih kode yang ingin ditanyakan.');
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode.window.showInformationMessage('Silakan pilih/blok kode terlebih dahulu.');
        return;
      }

      vscode.commands.executeCommand('workbench.view.extension.tamandata-sidebar-container');
      const filename = editor.document.fileName.split(/[\\/]/).pop();
      const prompt = `Tolong analisa atau jelaskan kode berikut dari berkas \`${filename}\`:\n\n\`\`\`\n${selection}\n\`\`\``;
      provider.sendPromptToInput(prompt);
    })
  );

  // Command: Hapus History
  context.subscriptions.push(
    vscode.commands.registerCommand('tamandata.clearHistory', () => {
      provider.clearChatHistory();
    })
  );
}

class TamandataChatViewProvider {
  static viewType = 'tamandata.chatView';

  constructor(context) {
    this._context = context;
    this._view = null;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'media')]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case 'askTamandata': {
          await this._handleAskTamandata(data.prompt, data.model);
          break;
        }
        case 'openApiKeySettings': {
          vscode.commands.executeCommand('tamandata.setApiKey');
          break;
        }
        case 'quickAction': {
          this._handleQuickAction(data.action);
          break;
        }
        case 'insertCode': {
          this._insertCodeIntoEditor(data.code);
          break;
        }
      }
    });
  }

  sendPromptToInput(text) {
    if (this._view) {
      this._view.webview.postMessage({ type: 'setPrompt', text: text });
    }
  }

  clearChatHistory() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'clear' });
    }
  }

  _handleQuickAction(action) {
    const editor = vscode.window.activeTextEditor;
    const selection = editor ? editor.document.getText(editor.selection) : '';

    let prompt = '';
    if (action === 'explain') {
      prompt = selection
        ? `Jelaskan alur kerja dari kode berikut secara singkat dan jelas:\n\n\`\`\`\n${selection}\n\`\`\``
        : 'Jelaskan arsitektur proyek ini dan bagaimana strukturnya diatur.';
    } else if (action === 'refactor') {
      prompt = selection
        ? `Tolong optimasi atau refactor kode berikut agar lebih bersih, efisien, dan modern:\n\n\`\`\`\n${selection}\n\`\`\``
        : 'Berikan saran refactoring atau peningkatan performa untuk kode ini.';
    } else if (action === 'findBugs') {
      prompt = selection
        ? `Periksa potensi bug, security flaw, atau unhandled error pada kode berikut:\n\n\`\`\`\n${selection}\n\`\`\``
        : 'Apakah ada potensi masalah atau bug pada logika saat ini?';
    } else if (action === 'generateTest') {
      prompt = selection
        ? `Buatkan unit test lengkap untuk kode berikut:\n\n\`\`\`\n${selection}\n\`\`\``
        : 'Buatkan contoh unit test untuk fitur ini.';
    }

    if (prompt) {
      this.sendPromptToInput(prompt);
    }
  }

  _insertCodeIntoEditor(code) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Buka file kode terlebih dahulu untuk menyisipkan.');
      return;
    }
    editor.edit((editBuilder) => {
      if (!editor.selection.isEmpty) {
        editBuilder.replace(editor.selection, code);
      } else {
        editBuilder.insert(editor.selection.active, code);
      }
    });
  }

  async _handleAskTamandata(prompt, chosenModel) {
    const config = vscode.workspace.getConfiguration('tamandata');
    const baseUrl = config.get('baseUrl') || 'https://ai.tamandata.com/v1';
    const defaultModel = config.get('defaultModel') || 'cx/gpt-6-astra';
    const model = chosenModel || defaultModel;

    // Ambil API Key dari SecretStorage atau Configuration
    let apiKey = await this._context.secrets.get('tamandata_api_key');
    if (!apiKey) {
      apiKey = config.get('apiKey') || process.env.TAMANDATA_API_KEY || '';
    }

    if (!apiKey) {
      this._view.webview.postMessage({
        type: 'error',
        content: 'API Key Tamandata belum diatur. Klik tombol kunci (🔑) di atas atau jalankan perintah "Tamandata: Atur API Key". Dapatkan token di https://ai.tamandata.com'
      });
      return;
    }

    try {
      const responseText = await this._callTamandataApi(baseUrl, apiKey, model, prompt);
      this._view.webview.postMessage({
        type: 'response',
        content: responseText
      });
    } catch (err) {
      this._view.webview.postMessage({
        type: 'error',
        content: err.message || 'Gagal terhubung ke Tamandata AI.'
      });
    }
  }

  _callTamandataApi(baseUrl, apiKey, model, prompt) {
    return new Promise((resolve, reject) => {
      const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const url = new URL(endpoint);

      const requestPayload = JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Anda adalah Tamandata AI Assistant yang cerdas, efisien, ramah, dan berpengalaman dalam pengembangan perangkat lunak modern. Berikan jawaban yang tepat, ringkas, dan format kode yang rapi.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(requestPayload)
        },
        timeout: 45000
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(rawData);
              const answer = json.choices?.[0]?.message?.content || 'Tidak ada balasan yang diterima.';
              resolve(answer);
            } catch (e) {
              resolve(rawData);
            }
          } else {
            try {
              const errJson = JSON.parse(rawData);
              const msg = errJson.error?.message || errJson.message || `HTTP ${res.statusCode}`;
              reject(new Error(msg));
            } catch {
              reject(new Error(`Permintaan ke Tamandata gagal (HTTP ${res.statusCode})`));
            }
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Koneksi ke Tamandata AI timeout (45 detik).'));
      });

      req.on('error', (err) => {
        reject(new Error(`Koneksi error: ${err.message}`));
      });

      req.write(requestPayload);
      req.end();
    });
  }

  _getHtmlForWebview(webview) {
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'chat.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'chat.js'));

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tamandata AI Chat</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <header class="chat-header">
    <div class="brand-row">
      <div class="brand-title">
        <span>Tamandata AI</span>
        <span class="brand-badge">ONLINE</span>
      </div>
      <div class="header-actions">
        <button id="setApiKeyBtn" class="icon-btn" title="Atur API Key Tamandata">🔑</button>
        <button id="clearChatBtn" class="icon-btn" title="Hapus Riwayat Chat">🗑️</button>
      </div>
    </div>
    <div class="controls-row">
      <select id="modelSelect" class="model-select" title="Pilih Model AI">
        <option value="cx/gpt-6-astra" selected>cx/gpt-6-astra (Utama)</option>
        <option value="tamandata">tamandata (Base)</option>
        <option value="z/deepseek-v4-flash">z/deepseek-v4-flash</option>
        <option value="gemini/gemini-3.7-flash">gemini/gemini-3.7-flash</option>
      </select>
    </div>
    <div class="quick-actions">
      <button class="quick-btn" data-action="explain">💡 Jelaskan</button>
      <button class="quick-btn" data-action="findBugs">🐞 Cari Bug</button>
      <button class="quick-btn" data-action="refactor">⚡ Refactor</button>
      <button class="quick-btn" data-action="generateTest">🧪 Unit Test</button>
    </div>
  </header>

  <main id="messagesContainer" class="messages-container">
    <!-- Bubble obrolan dimuat di sini secara dinamis -->
  </main>

  <footer class="chat-input-area">
    <div class="input-box-wrapper">
      <textarea id="chatInput" class="chat-textarea" placeholder="Tanya Tamandata AI... (Enter untuk kirim)" rows="1"></textarea>
      <button id="sendBtn" class="send-btn" title="Kirim Pesan">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
    <div class="input-hint">
      <span>Shift+Enter untuk baris baru</span>
      <span>Model: cx/gpt-6-astra</span>
    </div>
  </footer>

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
