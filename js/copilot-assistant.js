// Copilot AI Assistant - Dual-mode: Built-in AI + Microsoft Copilot integration
// Built-in: Local data intelligence + Azure OpenAI
// Microsoft Copilot: EDP (Enterprise Data Protected) for Entra ID users, consumer for others
// Page context is gathered and passed to Copilot so it can "see" what the user sees

let copilotChatHistory = [];
let copilotMode = 'builtin'; // 'builtin' or 'microsoft'

/**
 * Gather rich page context - what the user currently sees in the app
 * This is used both for built-in AI and as context when opening Microsoft Copilot
 */
function gatherPageContext() {
    const page = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
    const pageTitle = document.querySelector('h1')?.textContent || document.title;
    
    // Get visible data from the current page
    const context = {
        page,
        title: pageTitle,
        url: window.location.href,
        timestamp: new Date().toLocaleString('nl-NL'),
        visibleContent: ''
    };

    // Capture stat cards (dashboard, financieel)
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length > 0) {
        context.stats = [];
        statCards.forEach(card => {
            const label = card.querySelector('p')?.textContent || '';
            const value = card.querySelector('h3')?.textContent || '';
            const detail = card.querySelector('small')?.textContent || '';
            context.stats.push(`${label}: ${value} ${detail}`.trim());
        });
    }

    // Capture visible table data
    const table = document.querySelector('.data-table');
    if (table) {
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll('tbody tr')).slice(0, 10);
        const tableData = rows.map(row => {
            return Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
        });
        context.table = { headers, rows: tableData, totalRows: table.querySelectorAll('tbody tr').length };
    }

    // Capture visible cards (huurders, onderhoud)
    const cards = document.querySelectorAll('.item-card');
    if (cards.length > 0) {
        context.cards = [];
        cards.forEach((card, i) => {
            if (i >= 10) return; // Limit to 10
            const title = card.querySelector('h3')?.textContent || '';
            const body = card.querySelector('.item-card-body')?.textContent?.trim().substring(0, 200) || '';
            context.cards.push(`${title}: ${body}`);
        });
        context.totalCards = cards.length;
    }

    // Capture active filters
    const filters = document.querySelectorAll('.filters-bar select, .filters-bar input');
    if (filters.length > 0) {
        context.filters = {};
        filters.forEach(f => {
            if (f.value) context.filters[f.id || f.name || 'filter'] = f.value;
        });
    }

    // Capture detail panel if open
    const detailPanel = document.querySelector('.detail-panel.show');
    if (detailPanel) {
        context.detailPanel = detailPanel.textContent.trim().substring(0, 500);
    }

    // Capture chart data if present
    const chart = document.getElementById('financialChart');
    if (chart) {
        context.hasChart = true;
        context.chartYear = document.getElementById('currentYear')?.textContent || '';
    }

    // Build readable summary
    let summary = `De gebruiker bekijkt: "${pageTitle}" (${page}.html)\n`;
    summary += `Tijdstip: ${context.timestamp}\n`;
    
    if (context.stats) {
        summary += `\nStatistieken op het scherm:\n${context.stats.join('\n')}\n`;
    }
    if (context.table) {
        summary += `\nTabel (${context.table.totalRows} rijen):\n`;
        summary += `Kolommen: ${context.table.headers.join(' | ')}\n`;
        context.table.rows.slice(0, 5).forEach(row => {
            summary += `  ${row.join(' | ')}\n`;
        });
        if (context.table.totalRows > 5) summary += `  ... en ${context.table.totalRows - 5} meer\n`;
    }
    if (context.cards) {
        summary += `\nKaarten (${context.totalCards} totaal):\n`;
        context.cards.slice(0, 5).forEach(c => {
            summary += `  - ${c}\n`;
        });
    }
    if (context.filters && Object.keys(context.filters).length > 0) {
        summary += `\nActieve filters: ${JSON.stringify(context.filters)}\n`;
    }
    if (context.detailPanel) {
        summary += `\nDetail paneel open:\n${context.detailPanel}\n`;
    }

    context.visibleContent = summary;
    return context;
}

/**
 * Determine which Copilot endpoint to use based on auth status
 * - Entra ID user → EDP (Enterprise Data Protected) Copilot
 * - No Entra ID → Consumer Copilot
 */
function getCopilotEndpoint() {
    const isEntraUser = !isDemoMode() && window.currentUser && !window.currentUser.isDemo;
    
    if (isEntraUser) {
        // Enterprise Data Protected Copilot (M365 Copilot Chat / Bing Chat Enterprise)
        return {
            type: 'enterprise',
            label: 'Microsoft Copilot (Zakelijk)',
            description: 'Enterprise Data Protected - uw gegevens blijven beschermd',
            baseUrl: 'https://m365.cloud.microsoft/chat',
            icon: '🏢'
        };
    }
    
    // Consumer Copilot
    return {
        type: 'consumer',
        label: 'Microsoft Copilot',
        description: 'Consumer Copilot - gratis AI assistent',
        baseUrl: 'https://copilot.microsoft.com',
        icon: '🌐'
    };
}

/**
 * Open Microsoft Copilot with page context
 * Uses deep linking to pass the current app context as a prompt
 */
function openMicrosoftCopilot(customPrompt) {
    const endpoint = getCopilotEndpoint();
    const context = gatherPageContext();
    
    let prompt = customPrompt || '';
    
    if (!prompt) {
        prompt = `Ik gebruik een vastgoedbeheer applicatie (Stadsgezicht Vastgoedbeheer). ` +
                 `Ik kijk momenteel naar de "${context.title}" pagina. ` +
                 `Kun je me helpen begrijpen wat ik zie en advies geven?`;
    }

    // Append visible page context
    prompt += `\n\n--- Huidige pagina context ---\n${context.visibleContent}`;

    // Build the Copilot URL with the prompt
    const encodedPrompt = encodeURIComponent(prompt);
    let url;
    
    if (endpoint.type === 'enterprise') {
        url = `${endpoint.baseUrl}?prompt=${encodedPrompt}`;
    } else {
        url = `${endpoint.baseUrl}/?q=${encodedPrompt}`;
    }

    // Open in a side panel popup (simulating Edge sidebar behavior)
    const width = 480;
    const height = window.innerHeight;
    const left = window.screenX + window.innerWidth - width;
    const top = window.screenY;
    
    const copilotWindow = window.open(
        url,
        'MicrosoftCopilot',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    if (!copilotWindow) {
        showToast('Pop-up geblokkeerd. Sta pop-ups toe voor deze site.', 'error');
        // Fallback: open in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
    }
    
    return copilotWindow;
}

/**
 * Initialize the Copilot AI assistant panel
 */
function initCopilotAssistant() {
    // Create the floating FAB button
    const fab = document.createElement('button');
    fab.id = 'copilotFab';
    fab.className = 'copilot-fab';
    fab.innerHTML = '🤖';
    fab.title = 'Copilot AI Assistent (Ctrl+Shift+C)';
    fab.onclick = toggleCopilotPanel;
    document.body.appendChild(fab);

    const endpoint = getCopilotEndpoint();

    // Create the chat panel
    const panel = document.createElement('div');
    panel.id = 'copilotPanel';
    panel.className = 'copilot-panel';
    panel.innerHTML = `
        <div class="copilot-header">
            <div class="copilot-header-title">
                <span>🤖</span>
                <h3>Copilot Assistent</h3>
            </div>
            <div class="copilot-header-actions">
                <button class="copilot-btn-icon" onclick="clearCopilotChat()" title="Nieuw gesprek">🔄</button>
                <button class="copilot-btn-icon" onclick="toggleCopilotPanel()" title="Sluiten">✕</button>
            </div>
        </div>
        
        <!-- Mode Switcher -->
        <div class="copilot-mode-switcher">
            <button class="copilot-mode-btn active" data-mode="builtin" onclick="switchCopilotMode('builtin')">
                🏠 In-App AI
            </button>
            <button class="copilot-mode-btn" data-mode="microsoft" onclick="switchCopilotMode('microsoft')">
                ${endpoint.icon} Microsoft Copilot
            </button>
        </div>

        <!-- Built-in AI Chat -->
        <div id="copilotBuiltinMode" class="copilot-mode-content active">
            <div id="copilotMessages" class="copilot-messages">
                <div class="copilot-message assistant">
                    <div class="copilot-message-content">
                        <p>Hallo! Ik ben uw in-app AI assistent. Ik kan uw vastgoeddata analyseren:</p>
                        <ul>
                            <li>📊 <strong>Data analyse</strong> - Vragen over panden, huurders, contracten</li>
                            <li>📸 <strong>Foto analyse</strong> - Upload foto's van onderhoudsproblemen</li>
                            <li>📄 <strong>Document analyse</strong> - Begrijp contracten en documenten</li>
                            <li>✉️ <strong>Communicatie</strong> - Help met emails naar huurders</li>
                        </ul>
                        <p>Stel uw vraag of upload een bestand!</p>
                    </div>
                </div>
            </div>
            <div class="copilot-input-area">
                <div id="copilotFilePreview" class="copilot-file-preview" style="display:none;"></div>
                <div class="copilot-input-row">
                    <label class="copilot-upload-btn" title="Foto of document uploaden">
                        📎
                        <input type="file" id="copilotFileInput" accept="image/*,.pdf,.doc,.docx,.txt" style="display:none;" onchange="handleCopilotFile(this)">
                    </label>
                    <textarea id="copilotInput" class="copilot-input" placeholder="Stel een vraag over uw vastgoeddata..." rows="1"></textarea>
                    <button id="copilotSendBtn" class="copilot-send-btn" onclick="sendCopilotMessage()">➤</button>
                </div>
                <div class="copilot-quick-actions">
                    <button onclick="copilotQuickAction('overzicht')">📊 Overzicht</button>
                    <button onclick="copilotQuickAction('onderhoud')">🔧 Meldingen</button>
                    <button onclick="copilotQuickAction('contracts')">📄 Contracten</button>
                    <button onclick="copilotQuickAction('financieel')">💰 Financieel</button>
                </div>
            </div>
        </div>

        <!-- Microsoft Copilot Mode -->
        <div id="copilotMicrosoftMode" class="copilot-mode-content">
            <div class="copilot-microsoft-panel">
                <div class="copilot-ms-info">
                    <div class="copilot-ms-badge ${endpoint.type}">
                        <span style="font-size:32px;">${endpoint.icon}</span>
                        <h3>${sanitizeHTML(endpoint.label)}</h3>
                        <p>${sanitizeHTML(endpoint.description)}</p>
                    </div>
                    <p class="copilot-ms-context-note">
                        📋 Copilot ontvangt automatisch de context van wat u nu ziet in de app, 
                        zodat het gerichte antwoorden kan geven.
                    </p>
                </div>
                
                <div class="copilot-ms-actions">
                    <h4>Open Microsoft Copilot met context</h4>
                    
                    <button class="copilot-ms-action-btn" onclick="openMicrosoftCopilot()">
                        💬 Open Copilot - Stel vragen over deze pagina
                    </button>
                    
                    <button class="copilot-ms-action-btn" onclick="openMicrosoftCopilot('Analyseer de volgende vastgoeddata en geef advies over mogelijke verbeterpunten:')">
                        📊 Vraag om data-analyse
                    </button>
                    
                    <button class="copilot-ms-action-btn" onclick="openMicrosoftCopilot('Schrijf een professionele email in het Nederlands op basis van de volgende context:')">
                        ✉️ Help met email schrijven
                    </button>
                    
                    <button class="copilot-ms-action-btn" onclick="openMicrosoftCopilot('Geef advies over vastgoedbeheer best practices op basis van wat je ziet:')">
                        💡 Vastgoedbeheer advies
                    </button>
                </div>

                <div class="copilot-ms-custom">
                    <h4>Of stel een eigen vraag</h4>
                    <div class="copilot-input-row">
                        <textarea id="copilotMsInput" class="copilot-input" placeholder="Typ uw vraag voor Microsoft Copilot..." rows="2"></textarea>
                        <button class="copilot-send-btn" onclick="sendToCopilotMs()">➤</button>
                    </div>
                </div>
                
                <div class="copilot-ms-footer">
                    <p>💡 <strong>Tip:</strong> ${endpoint.type === 'enterprise' 
                        ? 'U bent ingelogd met Entra ID — Copilot gebruikt Enterprise Data Protection. Uw gegevens worden niet gebruikt voor AI-training.' 
                        : 'Log in met Microsoft 365 voor Enterprise Data Protected Copilot met zakelijke beveiliging.'}</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // Auto-resize textarea
    const input = document.getElementById('copilotInput');
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
    
    // Send on Enter (Shift+Enter for new line)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendCopilotMessage();
        }
    });

    // Microsoft Copilot custom input Enter handler
    const msInput = document.getElementById('copilotMsInput');
    if (msInput) {
        msInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendToCopilotMs();
            }
        });
    }

    // Keyboard shortcut: Ctrl+Shift+C
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            toggleCopilotPanel();
        }
    });

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Add page context meta tags for Edge Copilot sidebar
    addPageContextMeta();
}

function toggleCopilotPanel() {
    const panel = document.getElementById('copilotPanel');
    const fab = document.getElementById('copilotFab');
    panel.classList.toggle('show');
    fab.classList.toggle('active');
    if (panel.classList.contains('show')) {
        if (copilotMode === 'builtin') {
            document.getElementById('copilotInput')?.focus();
        } else {
            document.getElementById('copilotMsInput')?.focus();
        }
    }
}

/**
 * Switch between built-in AI and Microsoft Copilot modes
 */
function switchCopilotMode(mode) {
    copilotMode = mode;
    
    // Update mode buttons
    document.querySelectorAll('.copilot-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Update content panels
    document.getElementById('copilotBuiltinMode').classList.toggle('active', mode === 'builtin');
    document.getElementById('copilotMicrosoftMode').classList.toggle('active', mode === 'microsoft');
}

/**
 * Send custom prompt to Microsoft Copilot
 */
function sendToCopilotMs() {
    const input = document.getElementById('copilotMsInput');
    const message = input.value.trim();
    if (!message) return;
    
    openMicrosoftCopilot(message);
    input.value = '';
}

/**
 * Add semantic meta tags to the page so Edge's built-in Copilot sidebar
 * can understand the page content even without our custom integration
 */
function addPageContextMeta() {
    const page = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
    const pageDescriptions = {
        dashboard: 'Vastgoedbeheer dashboard met overzicht van panden, huurders, onderhoud en financiën',
        panden: 'Beheer van vastgoed panden - woningen en bedrijfspanden met huurprijzen en status',
        huurders: 'Beheer van huurders - contactgegevens en huurinformatie',
        contracten: 'Beheer van huurcontracten - start/einddatum, huurprijs, status',
        onderhoud: 'Onderhoudsmeldingen en reparatieverzoeken voor vastgoed',
        werkbonnen: 'Werkbonnen voor onderhoudswerkzaamheden',
        financieel: 'Financieel overzicht - inkomsten, uitgaven, maandoverzicht',
        admin: 'Administratie - gebruikersbeheer, instellingen, configuratie'
    };

    // Set meaningful page description for Copilot
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.name = 'description';
        document.head.appendChild(descMeta);
    }
    descMeta.content = pageDescriptions[page] || 'Stadsgezicht Vastgoedbeheer Platform';

    // Add structured data annotation for the page
    let ldJsonScript = document.getElementById('pageContextLD');
    if (!ldJsonScript) {
        ldJsonScript = document.createElement('script');
        ldJsonScript.id = 'pageContextLD';
        ldJsonScript.type = 'application/ld+json';
        document.head.appendChild(ldJsonScript);
    }
    ldJsonScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Stadsgezicht Vastgoedbeheer',
        'applicationCategory': 'BusinessApplication',
        'description': pageDescriptions[page] || '',
        'operatingSystem': 'Web',
        'offers': {
            '@type': 'Offer',
            'category': 'Property Management'
        }
    });
}

let copilotAttachedFile = null;

function handleCopilotFile(input) {
    const file = input.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('Bestand is te groot (max 10MB)', 'error');
        return;
    }

    const preview = document.getElementById('copilotFilePreview');
    const s = sanitizeHTML;
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            copilotAttachedFile = { name: file.name, type: file.type, dataUrl: e.target.result };
            preview.innerHTML = `
                <div class="copilot-preview-item">
                    <img src="${e.target.result}" alt="${s(file.name)}" style="max-height:80px;border-radius:4px;">
                    <span>${s(file.name)}</span>
                    <button onclick="removeCopilotFile()">✕</button>
                </div>
            `;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        copilotAttachedFile = { name: file.name, type: file.type, size: file.size };
        const reader = new FileReader();
        reader.onload = (e) => {
            copilotAttachedFile.text = e.target.result;
            preview.innerHTML = `
                <div class="copilot-preview-item">
                    <span>📄 ${s(file.name)} (${(file.size / 1024).toFixed(1)} KB)</span>
                    <button onclick="removeCopilotFile()">✕</button>
                </div>
            `;
            preview.style.display = 'block';
        };
        reader.readAsText(file);
    }

    // Reset the input so the same file can be selected again
    input.value = '';
}

function removeCopilotFile() {
    copilotAttachedFile = null;
    document.getElementById('copilotFilePreview').style.display = 'none';
    document.getElementById('copilotFilePreview').innerHTML = '';
}

async function sendCopilotMessage() {
    const input = document.getElementById('copilotInput');
    const message = input.value.trim();
    
    if (!message && !copilotAttachedFile) return;

    const messagesContainer = document.getElementById('copilotMessages');
    const s = sanitizeHTML;

    // Show user message
    let userContent = s(message);
    if (copilotAttachedFile) {
        if (copilotAttachedFile.dataUrl) {
            userContent += `<br><img src="${copilotAttachedFile.dataUrl}" style="max-width:200px;max-height:150px;border-radius:8px;margin-top:8px;">`;
        } else {
            userContent += `<br><span style="color:#666;">📄 ${s(copilotAttachedFile.name)}</span>`;
        }
    }
    
    messagesContainer.innerHTML += `
        <div class="copilot-message user">
            <div class="copilot-message-content">${userContent}</div>
        </div>
    `;

    input.value = '';
    input.style.height = 'auto';
    
    // Show typing indicator
    messagesContainer.innerHTML += `
        <div class="copilot-message assistant copilot-typing" id="copilotTyping">
            <div class="copilot-message-content">
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
        </div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        // Generate response using app data context
        const response = await generateCopilotResponse(message, copilotAttachedFile);
        
        // Remove typing indicator
        const typingEl = document.getElementById('copilotTyping');
        if (typingEl) typingEl.remove();
        
        // Show assistant response
        messagesContainer.innerHTML += `
            <div class="copilot-message assistant">
                <div class="copilot-message-content">${response}</div>
            </div>
        `;
        
        copilotChatHistory.push({ role: 'user', content: message });
        copilotChatHistory.push({ role: 'assistant', content: response });

    } catch (error) {
        const typingEl = document.getElementById('copilotTyping');
        if (typingEl) typingEl.remove();
        
        messagesContainer.innerHTML += `
            <div class="copilot-message assistant">
                <div class="copilot-message-content" style="color: var(--danger-color);">
                    Er is een fout opgetreden. Probeer het opnieuw.
                </div>
            </div>
        `;
    }
    
    // Clean up file
    removeCopilotFile();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Generate a response using app data context
 * First tries Microsoft Graph / Azure OpenAI, falls back to local intelligence
 */
async function generateCopilotResponse(message, file) {
    // Try Azure OpenAI if available
    if (typeof getGraphAccessToken === 'function' && typeof isMicrosoftSignedIn === 'function' && isMicrosoftSignedIn()) {
        try {
            return await callAzureOpenAI(message, file);
        } catch (e) {
            console.warn('Azure OpenAI unavailable, using local intelligence:', e);
        }
    }

    // Local intelligence fallback - analyze app data
    return await generateLocalResponse(message, file);
}

/**
 * Call Azure OpenAI via the configured endpoint 
 */
async function callAzureOpenAI(message, file) {
    // Get Azure OpenAI config from settings
    const config = storage.get('azureOpenAIConfig', null);
    if (!config || !config.endpoint || !config.apiKey) {
        throw new Error('Azure OpenAI not configured');
    }

    const appContext = await gatherAppContext();
    
    const messages = [
        {
            role: 'system',
            content: `Je bent een AI-assistent voor Stadsgezicht Vastgoedbeheer, een vastgoedbeheerapplicatie. 
Je helpt de beheerder met vragen over panden, huurders, contracten, onderhoud en financiën.
Antwoord altijd in het Nederlands. Wees beknopt maar grondig.

Huidige app data context:
${appContext}`
        },
        ...copilotChatHistory.slice(-10),
        { role: 'user', content: message }
    ];

    if (file && file.dataUrl) {
        messages[messages.length - 1] = {
            role: 'user',
            content: [
                { type: 'text', text: message || 'Beschrijf wat je ziet op deze foto.' },
                { type: 'image_url', image_url: { url: file.dataUrl } }
            ]
        };
    }

    const response = await fetch(`${config.endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.apiKey
        },
        body: JSON.stringify({
            messages,
            max_tokens: 1000,
            temperature: 0.7
        })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    return formatCopilotResponse(data.choices[0].message.content);
}

/**
 * Local intelligent response based on app data analysis
 */
async function generateLocalResponse(message, file) {
    const query = message.toLowerCase();
    const s = sanitizeHTML;

    // Handle file uploads with local analysis
    if (file) {
        if (file.dataUrl) {
            return `<p>📸 <strong>Foto ontvangen:</strong> ${s(file.name)}</p>
                <p>Voor automatische foto-analyse is een Azure OpenAI configuratie nodig. 
                U kunt dit instellen via <strong>Admin → Instellingen → AI Configuratie</strong>.</p>
                <p>Handmatig kunt u:</p>
                <ul>
                    <li>De foto toevoegen aan een <a href="onderhoud.html" style="color:var(--primary-color);">onderhoudsmelding</a></li>
                    <li>De foto uploaden naar SharePoint bij het pand</li>
                </ul>`;
        }
        if (file.text) {
            const wordCount = file.text.split(/\s+/).length;
            return `<p>📄 <strong>Document ontvangen:</strong> ${s(file.name)} (${wordCount} woorden)</p>
                <p>Samenvatting van het document:</p>
                <p style="font-style:italic;color:#666;">"${s(file.text.substring(0, 300))}${file.text.length > 300 ? '...' : ''}"</p>
                <p>Voor diepgaande document-analyse is Azure OpenAI vereist.</p>`;
        }
    }

    // Data-driven responses
    try {
        const [pandenData, huurdersData, contractenData, onderhoudData, transactiesData] = await Promise.all([
            dbGetAll('panden'),
            dbGetAll('huurders'),
            dbGetAll('contracten'),
            dbGetAll('onderhoud'),
            dbGetAll('transacties')
        ]);

        // Overview / summary
        if (query.includes('overzicht') || query.includes('samenvatting') || query.includes('status') || query.includes('hoe gaat')) {
            return generateOverviewResponse(pandenData, huurdersData, contractenData, onderhoudData, transactiesData);
        }

        // Open maintenance
        if (query.includes('onderhoud') || query.includes('melding') || query.includes('reparatie') || query.includes('open melding')) {
            return generateMaintenanceResponse(onderhoudData, pandenData);
        }

        // Contracts
        if (query.includes('contract') || query.includes('verlop') || query.includes('huurovereenkomst')) {
            return generateContractResponse(contractenData, huurdersData, pandenData);
        }

        // Financial
        if (query.includes('financ') || query.includes('inkom') || query.includes('uitgav') || query.includes('omzet') || query.includes('winst') || query.includes('huur')) {
            return generateFinancialResponse(transactiesData, contractenData);
        }

        // Panden
        if (query.includes('pand') || query.includes('woning') || query.includes('bedrijf') || query.includes('beschikb') || query.includes('leegstand')) {
            return generatePropertyResponse(pandenData);
        }

        // Huurders
        if (query.includes('huurder') || query.includes('bewoner') || query.includes('klant')) {
            return generateTenantResponse(huurdersData, contractenData, pandenData);
        }

        // Email help
        if (query.includes('email') || query.includes('brief') || query.includes('schrijf') || query.includes('mail')) {
            return generateEmailHelpResponse(message);
        }

        // How does the app work
        if (query.includes('hoe werkt') || query.includes('uitleg') || query.includes('help') || query.includes('handleiding')) {
            return generateHelpResponse();
        }

        // Default response
        return `<p>Ik begrijp uw vraag. Hier zijn enkele opties:</p>
            <ul>
                <li>📊 Vraag naar een <strong>overzicht</strong> van uw vastgoedportefeuille</li>
                <li>🔧 Vraag naar <strong>openstaande onderhoudsmeldingen</strong></li>
                <li>📄 Vraag naar <strong>verlopende contracten</strong></li>
                <li>💰 Vraag naar <strong>financieel overzicht</strong></li>
                <li>📸 <strong>Upload een foto</strong> voor analyse</li>
                <li>✉️ Vraag hulp bij het <strong>schrijven van een email</strong></li>
            </ul>
            <p>Of gebruik de snelknoppen hieronder!</p>`;

    } catch (error) {
        console.error('Copilot data error:', error);
        return '<p>Er kon geen data worden geladen. Controleer uw verbinding en probeer het opnieuw.</p>';
    }
}

function generateOverviewResponse(panden, huurders, contracten, onderhoud, transacties) {
    const now = new Date();
    const activeContracts = contracten.filter(c => new Date(c.einddatum) > now);
    const openMaintenance = onderhoud.filter(m => m.status !== 'afgerond');
    const urgentCount = openMaintenance.filter(m => m.prioriteit === 'urgent').length;
    const beschikbaar = panden.filter(p => p.status === 'beschikbaar').length;
    const maandHuur = activeContracts.reduce((sum, c) => sum + (parseFloat(c.huurprijs) || 0), 0);
    const bezetting = panden.length > 0 ? Math.round((activeContracts.length / panden.length) * 100) : 0;

    const yearTransacties = transacties.filter(t => t.datum && t.datum.startsWith(now.getFullYear().toString()));
    const inkomsten = yearTransacties.filter(t => t.type === 'inkomst').reduce((s, t) => s + parseFloat(t.bedrag || 0), 0);
    const uitgaven = yearTransacties.filter(t => t.type === 'uitgave').reduce((s, t) => s + parseFloat(t.bedrag || 0), 0);

    return `<p><strong>📊 Portefeuille Overzicht</strong></p>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="padding:4px 8px;">🏢 Totaal panden</td><td style="padding:4px;font-weight:bold;">${panden.length}</td></tr>
            <tr><td style="padding:4px 8px;">📭 Beschikbaar</td><td style="padding:4px;color:var(--success-color);">${beschikbaar}</td></tr>
            <tr><td style="padding:4px 8px;">👥 Actieve huurders</td><td style="padding:4px;font-weight:bold;">${activeContracts.length}</td></tr>
            <tr><td style="padding:4px 8px;">📈 Bezettingsgraad</td><td style="padding:4px;">${bezetting}%</td></tr>
            <tr><td style="padding:4px 8px;">💰 Maandelijkse huur</td><td style="padding:4px;font-weight:bold;">€${maandHuur.toLocaleString('nl-NL')}</td></tr>
            <tr><td style="padding:4px 8px;">🔧 Open meldingen</td><td style="padding:4px;${urgentCount > 0 ? 'color:var(--danger-color);font-weight:bold;' : ''}">${openMaintenance.length}${urgentCount > 0 ? ` (${urgentCount} urgent!)` : ''}</td></tr>
            <tr><td style="padding:4px 8px;">📈 YTD inkomsten</td><td style="padding:4px;">€${inkomsten.toLocaleString('nl-NL')}</td></tr>
            <tr><td style="padding:4px 8px;">📉 YTD uitgaven</td><td style="padding:4px;">€${uitgaven.toLocaleString('nl-NL')}</td></tr>
            <tr style="border-top:1px solid #ddd;"><td style="padding:4px 8px;font-weight:bold;">💵 Netto resultaat</td><td style="padding:4px;font-weight:bold;color:${(inkomsten - uitgaven) >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">€${(inkomsten - uitgaven).toLocaleString('nl-NL')}</td></tr>
        </table>`;
}

function generateMaintenanceResponse(onderhoud, panden) {
    const open = onderhoud.filter(m => m.status !== 'afgerond');
    if (open.length === 0) {
        return '<p>✅ <strong>Geen openstaande onderhoudsmeldingen!</strong> Alles is onder controle.</p>';
    }
    const s = sanitizeHTML;
    const byPriority = { urgent: [], hoog: [], normaal: [], laag: [] };
    open.forEach(m => {
        const key = m.prioriteit || 'normaal';
        if (byPriority[key]) byPriority[key].push(m);
    });

    let html = `<p><strong>🔧 ${open.length} openstaande meldingen:</strong></p>`;
    
    ['urgent', 'hoog', 'normaal', 'laag'].forEach(prio => {
        if (byPriority[prio].length > 0) {
            const icon = { urgent: '🔴', hoog: '🟠', normaal: '🟡', laag: '🟢' }[prio];
            html += `<p>${icon} <strong>${prio.charAt(0).toUpperCase() + prio.slice(1)} (${byPriority[prio].length}):</strong></p><ul>`;
            byPriority[prio].slice(0, 3).forEach(m => {
                const pand = panden.find(p => p.id === m.pandId);
                html += `<li>${s(m.titel)} - ${pand ? s(pand.adres) : 'Onbekend'}</li>`;
            });
            if (byPriority[prio].length > 3) html += `<li>... en ${byPriority[prio].length - 3} meer</li>`;
            html += '</ul>';
        }
    });
    
    return html;
}

function generateContractResponse(contracten, huurders, panden) {
    const now = new Date();
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    const s = sanitizeHTML;
    
    const expiring = contracten.filter(c => {
        const end = new Date(c.einddatum);
        return end > now && end <= threeMonths;
    });
    const expired = contracten.filter(c => new Date(c.einddatum) < now);
    const active = contracten.filter(c => new Date(c.einddatum) > now);

    let html = `<p><strong>📄 Contracten Status:</strong></p>
        <p>✅ Actief: ${active.length} | ⚠️ Verloopt binnenkort: ${expiring.length} | ❌ Verlopen: ${expired.length}</p>`;

    if (expiring.length > 0) {
        html += '<p><strong>⚠️ Verlopende contracten (komende 3 maanden):</strong></p><ul>';
        expiring.forEach(c => {
            const huurder = huurders.find(h => h.id === c.huurderId);
            const pand = panden.find(p => p.id === c.pandId);
            html += `<li><strong>${huurder ? s(`${huurder.voornaam} ${huurder.achternaam}`) : 'Onbekend'}</strong> 
                - ${pand ? s(pand.adres) : 'Onbekend'} 
                (verloopt ${new Date(c.einddatum).toLocaleDateString('nl-NL')})</li>`;
        });
        html += '</ul>';
    }
    
    return html;
}

function generateFinancialResponse(transacties, contracten) {
    const now = new Date();
    const year = now.getFullYear();
    const yearTx = transacties.filter(t => t.datum && t.datum.startsWith(year.toString()));
    const income = yearTx.filter(t => t.type === 'inkomst').reduce((s, t) => s + parseFloat(t.bedrag || 0), 0);
    const expense = yearTx.filter(t => t.type === 'uitgave').reduce((s, t) => s + parseFloat(t.bedrag || 0), 0);
    const activeContracts = contracten.filter(c => new Date(c.einddatum) > now);
    const monthlyRent = activeContracts.reduce((s, c) => s + parseFloat(c.huurprijs || 0), 0);

    return `<p><strong>💰 Financieel Overzicht ${year}</strong></p>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="padding:4px 8px;">📈 Inkomsten YTD</td><td style="padding:4px;color:var(--success-color);font-weight:bold;">€${income.toLocaleString('nl-NL')}</td></tr>
            <tr><td style="padding:4px 8px;">📉 Uitgaven YTD</td><td style="padding:4px;color:var(--danger-color);">€${expense.toLocaleString('nl-NL')}</td></tr>
            <tr style="border-top:1px solid #ddd;"><td style="padding:4px 8px;font-weight:bold;">Netto</td><td style="padding:4px;font-weight:bold;">€${(income - expense).toLocaleString('nl-NL')}</td></tr>
        </table>
        <p style="margin-top:12px;">📅 <strong>Verwachte maandelijkse huur:</strong> €${monthlyRent.toLocaleString('nl-NL')}</p>
        <p>📊 <strong>Verwacht jaarinkomen:</strong> €${(monthlyRent * 12).toLocaleString('nl-NL')}</p>
        <p style="margin-top:8px;"><a href="financieel.html" style="color:var(--primary-color);">→ Bekijk volledig financieel overzicht</a></p>`;
}

function generatePropertyResponse(panden) {
    const s = sanitizeHTML;
    const byStatus = {};
    panden.forEach(p => {
        byStatus[p.status] = byStatus[p.status] || [];
        byStatus[p.status].push(p);
    });

    let html = `<p><strong>🏢 Panden Overzicht (${panden.length} totaal):</strong></p>`;
    
    if (byStatus.beschikbaar && byStatus.beschikbaar.length > 0) {
        html += `<p>📭 <strong>Beschikbaar (${byStatus.beschikbaar.length}):</strong></p><ul>`;
        byStatus.beschikbaar.forEach(p => {
            html += `<li>${s(p.adres)}, ${s(p.plaats)} - €${parseFloat(p.huurprijs).toLocaleString('nl-NL')}/mnd</li>`;
        });
        html += '</ul>';
    }
    
    Object.entries(byStatus).forEach(([status, items]) => {
        if (status !== 'beschikbaar') {
            html += `<p>${status === 'verhuurd' ? '✅' : '🔧'} <strong>${status.charAt(0).toUpperCase() + status.slice(1)} (${items.length})</strong></p>`;
        }
    });
    
    return html;
}

function generateTenantResponse(huurders, contracten, panden) {
    const s = sanitizeHTML;
    const now = new Date();
    const activeContracts = contracten.filter(c => new Date(c.einddatum) > now);
    
    let html = `<p><strong>👥 Huurders Overzicht (${huurders.length} geregistreerd, ${activeContracts.length} actief):</strong></p><ul>`;
    
    huurders.forEach(h => {
        const contract = activeContracts.find(c => c.huurderId === h.id);
        const pand = contract ? panden.find(p => p.id === contract.pandId) : null;
        html += `<li><strong>${s(h.voornaam)} ${s(h.achternaam)}</strong> - ${pand ? s(pand.adres) : '<em>Geen actief contract</em>'}</li>`;
    });
    html += '</ul>';
    
    return html;
}

function generateEmailHelpResponse(message) {
    return `<p><strong>✉️ Email Hulp</strong></p>
        <p>Ik kan u helpen met het voorbereiden van emails. Hier zijn veelgebruikte templates:</p>
        <ul>
            <li>📄 <strong>Huurcontract versturen</strong> - Ga naar <a href="contracten.html" style="color:var(--primary-color);">Contracten</a> en klik op 📧</li>
            <li>🔧 <strong>Onderhoudsbevestiging</strong> - Ga naar <a href="onderhoud.html" style="color:var(--primary-color);">Onderhoud</a></li>
            <li>💰 <strong>Huurverhoging</strong> - Beschikbaar via de email templates</li>
        </ul>
        <p>💡 <strong>Tip:</strong> Zorg dat u bent ingelogd op Microsoft 365 om emails te kunnen versturen (klik op de "Microsoft 365" knop in de sidebar).</p>`;
}

function generateHelpResponse() {
    const endpoint = getCopilotEndpoint();
    return `<p><strong>📚 Hoe werkt deze applicatie?</strong></p>
        <p>Dit is een vastgoedbeheer platform waarmee u het volgende kunt beheren:</p>
        <ul>
            <li>🏢 <strong><a href="panden.html" style="color:var(--primary-color);">Panden</a></strong> - Vastgoedportefeuille beheren</li>
            <li>👥 <strong><a href="huurders.html" style="color:var(--primary-color);">Huurders</a></strong> - Huurder gegevens en contactinformatie</li>
            <li>📄 <strong><a href="contracten.html" style="color:var(--primary-color);">Contracten</a></strong> - Huurovereenkomsten aanmaken en beheren</li>
            <li>🔧 <strong><a href="onderhoud.html" style="color:var(--primary-color);">Onderhoud</a></strong> - Reparatieverzoeken en werkbonnen</li>
            <li>💰 <strong><a href="financieel.html" style="color:var(--primary-color);">Financieel</a></strong> - Inkomsten, uitgaven en rapportages</li>
        </ul>
        <p><strong>AI Assistenten:</strong></p>
        <ul>
            <li>🏠 <strong>In-App AI</strong> - Directe data-analyse (deze chat)</li>
            <li>${endpoint.icon} <strong>Microsoft Copilot</strong> - Schakel hiernaar via de tab bovenaan voor geavanceerde AI met ${endpoint.type === 'enterprise' ? 'Enterprise Data Protection' : 'consumer mogelijkheden'}</li>
        </ul>
        <p><strong>Sneltoetsen:</strong></p>
        <ul>
            <li><kbd>Ctrl+K</kbd> - Globaal zoeken</li>
            <li><kbd>Ctrl+Shift+C</kbd> - Copilot openen/sluiten</li>
        </ul>
        <p><strong>Exporteren:</strong> Elke pagina heeft een 📥 CSV Export knop in de header.</p>`;
}

function formatCopilotResponse(text) {
    // Convert markdown-like formatting to HTML
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/^- /gm, '• ');
}

async function gatherAppContext() {
    try {
        const [panden, huurders, contracten, onderhoud] = await Promise.all([
            dbGetAll('panden'),
            dbGetAll('huurders'),
            dbGetAll('contracten'),
            dbGetAll('onderhoud')
        ]);
        const now = new Date();
        return `Panden: ${panden.length} (${panden.filter(p=>p.status==='beschikbaar').length} beschikbaar)
Huurders: ${huurders.length}
Actieve contracten: ${contracten.filter(c=>new Date(c.einddatum)>now).length}
Open onderhoud: ${onderhoud.filter(m=>m.status!=='afgerond').length}`;
    } catch { return 'Data niet beschikbaar'; }
}

function clearCopilotChat() {
    copilotChatHistory = [];
    document.getElementById('copilotMessages').innerHTML = `
        <div class="copilot-message assistant">
            <div class="copilot-message-content">
                <p>Gesprek gewist. Hoe kan ik u helpen?</p>
            </div>
        </div>
    `;
}

async function copilotQuickAction(action) {
    const input = document.getElementById('copilotInput');
    const actions = {
        overzicht: 'Geef me een overzicht van de vastgoedportefeuille',
        onderhoud: 'Welke onderhoudsmeldingen staan er open?',
        contracts: 'Welke contracten verlopen binnenkort?',
        financieel: 'Hoe staat het financieel dit jaar?'
    };
    input.value = actions[action] || '';
    sendCopilotMessage();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initCopilotAssistant();
});

// Export
window.toggleCopilotPanel = toggleCopilotPanel;
window.clearCopilotChat = clearCopilotChat;
window.copilotQuickAction = copilotQuickAction;
window.sendCopilotMessage = sendCopilotMessage;
window.handleCopilotFile = handleCopilotFile;
window.removeCopilotFile = removeCopilotFile;
window.switchCopilotMode = switchCopilotMode;
window.openMicrosoftCopilot = openMicrosoftCopilot;
window.sendToCopilotMs = sendToCopilotMs;
window.gatherPageContext = gatherPageContext;
