// Copilot AI Assistant - Dual-mode: Built-in AI + Microsoft Copilot integration
// Built-in: Local data intelligence + Azure OpenAI
// Microsoft Copilot: EDP (Enterprise Data Protected) for Entra ID users, consumer for others
// Page context is gathered and passed to Copilot so it can "see" what the user sees

let copilotChatHistory = [];
let copilotMode = "builtin"; // 'builtin' or 'microsoft'

/**
 * Gather rich page context - what the user currently sees in the app
 * This is used both for built-in AI and as context when opening Microsoft Copilot
 */
function gatherPageContext() {
  const page =
    window.location.pathname.split("/").pop().replace(".html", "") ||
    "dashboard";
  const pageTitle = document.querySelector("h1")?.textContent || document.title;

  // Get visible data from the current page
  const context = {
    page,
    title: pageTitle,
    url: window.location.href,
    timestamp: new Date().toLocaleString("nl-NL"),
    visibleContent: "",
  };

  // Capture stat cards (dashboard, financieel)
  const statCards = document.querySelectorAll(".stat-card");
  if (statCards.length > 0) {
    context.stats = [];
    statCards.forEach((card) => {
      const label = card.querySelector("p")?.textContent || "";
      const value = card.querySelector("h3")?.textContent || "";
      const detail = card.querySelector("small")?.textContent || "";
      context.stats.push(`${label}: ${value} ${detail}`.trim());
    });
  }

  // Capture visible table data
  const table = document.querySelector(".data-table");
  if (table) {
    const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
      th.textContent.trim(),
    );
    const rows = Array.from(table.querySelectorAll("tbody tr")).slice(0, 10);
    const tableData = rows.map((row) => {
      return Array.from(row.querySelectorAll("td")).map((td) =>
        td.textContent.trim(),
      );
    });
    context.table = {
      headers,
      rows: tableData,
      totalRows: table.querySelectorAll("tbody tr").length,
    };
  }

  // Capture visible cards (huurders, onderhoud)
  const cards = document.querySelectorAll(".item-card");
  if (cards.length > 0) {
    context.cards = [];
    cards.forEach((card, i) => {
      if (i >= 10) return; // Limit to 10
      const title = card.querySelector("h3")?.textContent || "";
      const body =
        card
          .querySelector(".item-card-body")
          ?.textContent?.trim()
          .substring(0, 200) || "";
      context.cards.push(`${title}: ${body}`);
    });
    context.totalCards = cards.length;
  }

  // Capture active filters
  const filters = document.querySelectorAll(
    ".filters-bar select, .filters-bar input",
  );
  if (filters.length > 0) {
    context.filters = {};
    filters.forEach((f) => {
      if (f.value) context.filters[f.id || f.name || "filter"] = f.value;
    });
  }

  // Capture detail panel if open
  const detailPanel = document.querySelector(".detail-panel.show");
  if (detailPanel) {
    context.detailPanel = detailPanel.textContent.trim().substring(0, 500);
  }

  // Capture chart data if present
  const chart = document.getElementById("financialChart");
  if (chart) {
    context.hasChart = true;
    context.chartYear =
      document.getElementById("currentYear")?.textContent || "";
  }

  // Build readable summary
  let summary = `De gebruiker bekijkt: "${pageTitle}" (${page}.html)\n`;
  summary += `Tijdstip: ${context.timestamp}\n`;

  if (context.stats) {
    summary += `\nStatistieken op het scherm:\n${context.stats.join("\n")}\n`;
  }
  if (context.table) {
    summary += `\nTabel (${context.table.totalRows} rijen):\n`;
    summary += `Kolommen: ${context.table.headers.join(" | ")}\n`;
    context.table.rows.slice(0, 5).forEach((row) => {
      summary += `  ${row.join(" | ")}\n`;
    });
    if (context.table.totalRows > 5)
      summary += `  ... en ${context.table.totalRows - 5} meer\n`;
  }
  if (context.cards) {
    summary += `\nKaarten (${context.totalCards} totaal):\n`;
    context.cards.slice(0, 5).forEach((c) => {
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
 * - Entra ID user <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> EDP (Enterprise Data Protected) Copilot
 * - No Entra ID <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> Consumer Copilot
 */
function getCopilotEndpoint() {
  const isEntraUser =
    !isDemoMode() && window.currentUser && !window.currentUser.isDemo;

  if (isEntraUser) {
    // Enterprise Data Protected Copilot (M365 Copilot Chat / Bing Chat Enterprise)
    return {
      type: "enterprise",
      label: "Microsoft Copilot (Zakelijk)",
      description: "Enterprise Data Protected - uw gegevens blijven beschermd",
      baseUrl: "https://m365.cloud.microsoft/chat",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg>',
    };
  }

  // Consumer Copilot
  return {
    type: "consumer",
    label: "Microsoft Copilot",
    description: "Consumer Copilot - gratis AI assistent",
    baseUrl: "https://copilot.microsoft.com",
    icon: '<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"lucide-icon\" aria-hidden=\"true\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\"/><path d=\"M2 12h20\"/></svg>',
  };
}

/**
 * Open Microsoft Copilot with page context
 * Uses deep linking to pass the current app context as a prompt
 */
function openMicrosoftCopilot(customPrompt) {
  const endpoint = getCopilotEndpoint();
  const context = gatherPageContext();

  let prompt = customPrompt || "";

  if (!prompt) {
    prompt =
      `Ik gebruik een vastgoedbeheer applicatie (Stadsgezicht Vastgoedbeheer). ` +
      `Ik kijk momenteel naar de "${context.title}" pagina. ` +
      `Kun je me helpen begrijpen wat ik zie en advies geven?`;
  }

  // Append visible page context
  prompt += `\n\n--- Huidige pagina context ---\n${context.visibleContent}`;

  // Build the Copilot URL with the prompt
  const encodedPrompt = encodeURIComponent(prompt);
  let url;

  if (endpoint.type === "enterprise") {
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
    "MicrosoftCopilot",
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );

  if (!copilotWindow) {
    showToast("Pop-up geblokkeerd. Sta pop-ups toe voor deze site.", "error");
    // Fallback: open in new tab
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return copilotWindow;
}

/**
 * Initialize the Copilot AI assistant panel
 */
function initCopilotAssistant() {
  // Create the floating FAB button
  const fab = document.createElement("button");
  fab.id = "copilotFab";
  fab.className = "copilot-fab";
  fab.innerHTML =
    '<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"lucide-icon\" aria-hidden=\"true\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"><path d=\"M12 8V4H8\"/><rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\"/><path d=\"M2 14h2\"/><path d=\"M20 14h2\"/><path d=\"M15 13v2\"/><path d=\"M9 13v2\"/></svg>';
  fab.title = "Copilot AI Assistent (Ctrl+Shift+C)";
  fab.onclick = toggleCopilotPanel;
  document.body.appendChild(fab);

  const endpoint = getCopilotEndpoint();

  // Create the chat panel
  const panel = document.createElement("div");
  panel.id = "copilotPanel";
  panel.className = "copilot-panel";
  panel.innerHTML = `
        <div class="copilot-header">
            <div class="copilot-header-title">
                <span><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg></span>
                <h3>Copilot Assistent</h3>
            </div>
            <div class="copilot-header-actions">
                <button class="copilot-btn-icon" onclick="clearCopilotChat()" title="Nieuw gesprek"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg></button>
                <button class="copilot-btn-icon" onclick="toggleCopilotPanel()" title="Sluiten"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
            </div>
        </div>
        
        <!-- Mode Switcher -->
        <div class="copilot-mode-switcher">
            <button class="copilot-mode-btn active" data-mode="builtin" onclick="switchCopilotMode('builtin')">
                <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> In-App AI
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
                            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg> <strong>Data analyse</strong> - Vragen over panden, huurders, contracten</li>
                            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> <strong>Foto analyse</strong> - Upload foto's van onderhoudsproblemen</li>
                            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> <strong>Document analyse</strong> - Begrijp contracten en documenten</li>
                            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> <strong>Communicatie</strong> - Help met emails naar huurders</li>
                        </ul>
                        <p>Stel uw vraag of upload een bestand!</p>
                    </div>
                </div>
            </div>
            <div class="copilot-input-area">
                <div id="copilotFilePreview" class="copilot-file-preview" style="display:none;"></div>
                <div class="copilot-input-row">
                    <label class="copilot-upload-btn" title="Foto of document uploaden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        <input type="file" id="copilotFileInput" accept="image/*,.pdf,.doc,.docx,.txt" style="display:none;" onchange="handleCopilotFile(this)">
                    </label>
                    <textarea id="copilotInput" class="copilot-input" placeholder="Stel een vraag over uw vastgoeddata..." rows="1"></textarea>
                    <button id="copilotSendBtn" class="copilot-send-btn" onclick="sendCopilotMessage()"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg></button>
                </div>
                <div class="copilot-quick-actions">
                    <button onclick="copilotQuickAction('overzicht')"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg> Overzicht</button>
                    <button onclick="copilotQuickAction('onderhoud')"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> Meldingen</button>
                    <button onclick="copilotQuickAction('contracts')"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> Contracten</button>
                    <button onclick="copilotQuickAction('financieel')"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg> Financieel</button>
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
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg> Copilot ontvangt automatisch de context van wat u nu ziet in de app, 
                        zodat het gerichte antwoorden kan geven.
                    </p>
                </div>
                
                <div class="copilot-ms-actions">
                    <h4>Open Microsoft Copilot met context</h4>
                    
                    <button class="copilot-ms-action-btn" onclick="openMicrosoftCopilot()">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Open Copilot - Stel vragen over deze pagina
                    </button>
                    
                    <button class="copilot-ms-action-btn" onclick="openMicrosoftCopilot('Analyseer de volgende vastgoeddata en geef advies over mogelijke verbeterpunten:')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg> Vraag om data-analyse
                    </button>
                    
                    <button class="copilot-ms-action-btn" onclick="openMicrosoftCopilot('Schrijf een professionele email in het Nederlands op basis van de volgende context:')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Help met email schrijven
                    </button>
                    
                    <button class="copilot-ms-action-btn" onclick="openMicrosoftCopilot('Geef advies over vastgoedbeheer best practices op basis van wat je ziet:')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg> Vastgoedbeheer advies
                    </button>
                </div>

                <div class="copilot-ms-custom">
                    <h4>Of stel een eigen vraag</h4>
                    <div class="copilot-input-row">
                        <textarea id="copilotMsInput" class="copilot-input" placeholder="Typ uw vraag voor Microsoft Copilot..." rows="2"></textarea>
                        <button class="copilot-send-btn" onclick="sendToCopilotMs()"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg></button>
                    </div>
                </div>
                
                <div class="copilot-ms-footer">
                    <p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg> <strong>Tip:</strong> ${
                      endpoint.type === "enterprise"
                        ? "U bent ingelogd met Entra ID — Copilot gebruikt Enterprise Data Protection. Uw gegevens worden niet gebruikt voor AI-training."
                        : "Log in met Microsoft 365 voor Enterprise Data Protected Copilot met zakelijke beveiliging."
                    }</p>
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(panel);

  // Auto-resize textarea
  const input = document.getElementById("copilotInput");
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });

  // Send on Enter (Shift+Enter for new line)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCopilotMessage();
    }
  });

  // Microsoft Copilot custom input Enter handler
  const msInput = document.getElementById("copilotMsInput");
  if (msInput) {
    msInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendToCopilotMs();
      }
    });
  }

  // Keyboard shortcut: Ctrl+Shift+C
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
      toggleCopilotPanel();
    }
  });

  // Register service worker for PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  // Add page context meta tags for Edge Copilot sidebar
  addPageContextMeta();
}

function toggleCopilotPanel() {
  const panel = document.getElementById("copilotPanel");
  const fab = document.getElementById("copilotFab");
  panel.classList.toggle("show");
  fab.classList.toggle("active");
  if (panel.classList.contains("show")) {
    if (copilotMode === "builtin") {
      document.getElementById("copilotInput")?.focus();
    } else {
      document.getElementById("copilotMsInput")?.focus();
    }
  }
}

/**
 * Switch between built-in AI and Microsoft Copilot modes
 */
function switchCopilotMode(mode) {
  copilotMode = mode;

  // Update mode buttons
  document.querySelectorAll(".copilot-mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  // Update content panels
  document
    .getElementById("copilotBuiltinMode")
    .classList.toggle("active", mode === "builtin");
  document
    .getElementById("copilotMicrosoftMode")
    .classList.toggle("active", mode === "microsoft");
}

/**
 * Send custom prompt to Microsoft Copilot
 */
function sendToCopilotMs() {
  const input = document.getElementById("copilotMsInput");
  const message = input.value.trim();
  if (!message) return;

  openMicrosoftCopilot(message);
  input.value = "";
}

/**
 * Add semantic meta tags to the page so Edge's built-in Copilot sidebar
 * can understand the page content even without our custom integration
 */
function addPageContextMeta() {
  const page =
    window.location.pathname.split("/").pop().replace(".html", "") ||
    "dashboard";
  const pageDescriptions = {
    dashboard:
      "Vastgoedbeheer dashboard met overzicht van panden, huurders, onderhoud en financiën",
    panden:
      "Beheer van vastgoed panden - woningen en bedrijfspanden met huurprijzen en status",
    huurders: "Beheer van huurders - contactgegevens en huurinformatie",
    contracten:
      "Beheer van huurcontracten - start/einddatum, huurprijs, status",
    onderhoud: "Onderhoudsmeldingen en reparatieverzoeken voor vastgoed",
    werkbonnen: "Werkbonnen voor onderhoudswerkzaamheden",
    financieel: "Financieel overzicht - inkomsten, uitgaven, maandoverzicht",
    admin: "Administratie - gebruikersbeheer, instellingen, configuratie",
  };

  // Set meaningful page description for Copilot
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement("meta");
    descMeta.name = "description";
    document.head.appendChild(descMeta);
  }
  descMeta.content =
    pageDescriptions[page] || "Stadsgezicht Vastgoedbeheer Platform";

  // Add structured data annotation for the page
  let ldJsonScript = document.getElementById("pageContextLD");
  if (!ldJsonScript) {
    ldJsonScript = document.createElement("script");
    ldJsonScript.id = "pageContextLD";
    ldJsonScript.type = "application/ld+json";
    document.head.appendChild(ldJsonScript);
  }
  ldJsonScript.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Stadsgezicht Vastgoedbeheer",
    applicationCategory: "BusinessApplication",
    description: pageDescriptions[page] || "",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      category: "Property Management",
    },
  });
}

let copilotAttachedFile = null;

function handleCopilotFile(input) {
  const file = input.files[0];
  if (!file) return;

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showToast("Bestand is te groot (max 10MB)", "error");
    return;
  }

  const preview = document.getElementById("copilotFilePreview");
  const s = sanitizeHTML;

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      copilotAttachedFile = {
        name: file.name,
        type: file.type,
        dataUrl: e.target.result,
      };
      preview.innerHTML = `
                <div class="copilot-preview-item">
                    <img src="${e.target.result}" alt="${s(file.name)}" style="max-height:80px;border-radius:4px;">
                    <span>${s(file.name)}</span>
                    <button onclick="removeCopilotFile()"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                </div>
            `;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    copilotAttachedFile = { name: file.name, type: file.type, size: file.size };
    const reader = new FileReader();
    reader.onload = (e) => {
      copilotAttachedFile.text = e.target.result;
      preview.innerHTML = `
                <div class="copilot-preview-item">
                    <span><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> ${s(file.name)} (${(file.size / 1024).toFixed(1)} KB)</span>
                    <button onclick="removeCopilotFile()"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                </div>
            `;
      preview.style.display = "block";
    };
    reader.readAsText(file);
  }

  // Reset the input so the same file can be selected again
  input.value = "";
}

function removeCopilotFile() {
  copilotAttachedFile = null;
  document.getElementById("copilotFilePreview").style.display = "none";
  document.getElementById("copilotFilePreview").innerHTML = "";
}

async function sendCopilotMessage() {
  const input = document.getElementById("copilotInput");
  const message = input.value.trim();

  if (!message && !copilotAttachedFile) return;

  const messagesContainer = document.getElementById("copilotMessages");
  const s = sanitizeHTML;

  // Show user message
  let userContent = s(message);
  if (copilotAttachedFile) {
    if (copilotAttachedFile.dataUrl) {
      userContent += `<br><img src="${copilotAttachedFile.dataUrl}" style="max-width:200px;max-height:150px;border-radius:8px;margin-top:8px;">`;
    } else {
      userContent += `<br><span style="color:#666;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> ${s(copilotAttachedFile.name)}</span>`;
    }
  }

  messagesContainer.innerHTML += `
        <div class="copilot-message user">
            <div class="copilot-message-content">${userContent}</div>
        </div>
    `;

  input.value = "";
  input.style.height = "auto";

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
    const response = await generateCopilotResponse(
      message,
      copilotAttachedFile,
    );

    // Remove typing indicator
    const typingEl = document.getElementById("copilotTyping");
    if (typingEl) typingEl.remove();

    // Show assistant response
    messagesContainer.innerHTML += `
            <div class="copilot-message assistant">
                <div class="copilot-message-content">${response}</div>
            </div>
        `;

    copilotChatHistory.push({ role: "user", content: message });
    copilotChatHistory.push({ role: "assistant", content: response });
  } catch (error) {
    const typingEl = document.getElementById("copilotTyping");
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
  if (
    typeof getGraphAccessToken === "function" &&
    typeof isMicrosoftSignedIn === "function" &&
    isMicrosoftSignedIn()
  ) {
    try {
      return await callAzureOpenAI(message, file);
    } catch (e) {
      console.warn("Azure OpenAI unavailable, using local intelligence:", e);
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
  const config = storage.get("azureOpenAIConfig", null);
  if (!config || !config.endpoint || !config.apiKey) {
    throw new Error("Azure OpenAI not configured");
  }

  const appContext = await gatherAppContext();

  const messages = [
    {
      role: "system",
      content: `Je bent een AI-assistent voor Stadsgezicht Vastgoedbeheer, een vastgoedbeheerapplicatie. 
Je helpt de beheerder met vragen over panden, huurders, contracten, onderhoud en financiën.
Antwoord altijd in het Nederlands. Wees beknopt maar grondig.

Huidige app data context:
${appContext}`,
    },
    ...copilotChatHistory.slice(-10),
    { role: "user", content: message },
  ];

  if (file && file.dataUrl) {
    messages[messages.length - 1] = {
      role: "user",
      content: [
        {
          type: "text",
          text: message || "Beschrijf wat je ziet op deze foto.",
        },
        { type: "image_url", image_url: { url: file.dataUrl } },
      ],
    };
  }

  const response = await fetch(`${config.endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify({
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
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
      return `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> <strong>Foto ontvangen:</strong> ${s(file.name)}</p>
                <p>Voor automatische foto-analyse is een Azure OpenAI configuratie nodig. 
                U kunt dit instellen via <strong>Admin <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> Instellingen <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> AI Configuratie</strong>.</p>
                <p>Handmatig kunt u:</p>
                <ul>
                    <li>De foto toevoegen aan een <a href="onderhoud.html" style="color:var(--primary-color);">onderhoudsmelding</a></li>
                    <li>De foto uploaden naar SharePoint bij het pand</li>
                </ul>`;
    }
    if (file.text) {
      const wordCount = file.text.split(/\s+/).length;
      return `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> <strong>Document ontvangen:</strong> ${s(file.name)} (${wordCount} woorden)</p>
                <p>Samenvatting van het document:</p>
                <p style="font-style:italic;color:#666;">"${s(file.text.substring(0, 300))}${file.text.length > 300 ? "..." : ""}"</p>
                <p>Voor diepgaande document-analyse is Azure OpenAI vereist.</p>`;
    }
  }

  // Data-driven responses
  try {
    const [
      pandenData,
      huurdersData,
      contractenData,
      onderhoudData,
      transactiesData,
    ] = await Promise.all([
      dbGetAll("panden"),
      dbGetAll("huurders"),
      dbGetAll("contracten"),
      dbGetAll("onderhoud"),
      dbGetAll("transacties"),
    ]);

    // Overview / summary
    if (
      query.includes("overzicht") ||
      query.includes("samenvatting") ||
      query.includes("status") ||
      query.includes("hoe gaat")
    ) {
      return generateOverviewResponse(
        pandenData,
        huurdersData,
        contractenData,
        onderhoudData,
        transactiesData,
      );
    }

    // Open maintenance
    if (
      query.includes("onderhoud") ||
      query.includes("melding") ||
      query.includes("reparatie") ||
      query.includes("open melding")
    ) {
      return generateMaintenanceResponse(onderhoudData, pandenData);
    }

    // Contracts
    if (
      query.includes("contract") ||
      query.includes("verlop") ||
      query.includes("huurovereenkomst")
    ) {
      return generateContractResponse(contractenData, huurdersData, pandenData);
    }

    // Financial
    if (
      query.includes("financ") ||
      query.includes("inkom") ||
      query.includes("uitgav") ||
      query.includes("omzet") ||
      query.includes("winst") ||
      query.includes("huur")
    ) {
      return generateFinancialResponse(transactiesData, contractenData);
    }

    // Panden
    if (
      query.includes("pand") ||
      query.includes("woning") ||
      query.includes("bedrijf") ||
      query.includes("beschikb") ||
      query.includes("leegstand")
    ) {
      return generatePropertyResponse(pandenData);
    }

    // Huurders
    if (
      query.includes("huurder") ||
      query.includes("bewoner") ||
      query.includes("klant")
    ) {
      return generateTenantResponse(huurdersData, contractenData, pandenData);
    }

    // Email help
    if (
      query.includes("email") ||
      query.includes("brief") ||
      query.includes("schrijf") ||
      query.includes("mail")
    ) {
      return generateEmailHelpResponse(message);
    }

    // How does the app work
    if (
      query.includes("hoe werkt") ||
      query.includes("uitleg") ||
      query.includes("help") ||
      query.includes("handleiding")
    ) {
      return generateHelpResponse();
    }

    // Default response
    return `<p>Ik begrijp uw vraag. Hier zijn enkele opties:</p>
            <ul>
                <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg> Vraag naar een <strong>overzicht</strong> van uw vastgoedportefeuille</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> Vraag naar <strong>openstaande onderhoudsmeldingen</strong></li>
                <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> Vraag naar <strong>verlopende contracten</strong></li>
                <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg> Vraag naar <strong>financieel overzicht</strong></li>
                <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> <strong>Upload een foto</strong> voor analyse</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Vraag hulp bij het <strong>schrijven van een email</strong></li>
            </ul>
            <p>Of gebruik de snelknoppen hieronder!</p>`;
  } catch (error) {
    console.error("Copilot data error:", error);
    return "<p>Er kon geen data worden geladen. Controleer uw verbinding en probeer het opnieuw.</p>";
  }
}

function generateOverviewResponse(
  panden,
  huurders,
  contracten,
  onderhoud,
  transacties,
) {
  const now = new Date();
  const activeContracts = contracten.filter((c) => new Date(c.einddatum) > now);
  const openMaintenance = onderhoud.filter((m) => m.status !== "afgerond");
  const urgentCount = openMaintenance.filter(
    (m) => m.prioriteit === "urgent",
  ).length;
  const beschikbaar = panden.filter((p) => p.status === "beschikbaar").length;
  const maandHuur = activeContracts.reduce(
    (sum, c) => sum + (parseFloat(c.huurprijs) || 0),
    0,
  );
  const bezetting =
    panden.length > 0
      ? Math.round((activeContracts.length / panden.length) * 100)
      : 0;

  const yearTransacties = transacties.filter(
    (t) => t.datum && t.datum.startsWith(now.getFullYear().toString()),
  );
  const inkomsten = yearTransacties
    .filter((t) => t.type === "inkomst")
    .reduce((s, t) => s + parseFloat(t.bedrag || 0), 0);
  const uitgaven = yearTransacties
    .filter((t) => t.type === "uitgave")
    .reduce((s, t) => s + parseFloat(t.bedrag || 0), 0);

  return `<p><strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg> Portefeuille Overzicht</strong></p>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg> Totaal panden</td><td style="padding:4px;font-weight:bold;">${panden.length}</td></tr>
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 7 5h10c3 0 5 2 5 4.5Z"/><polyline points="15 9 18 9 18 11"/><path d="M6.5 9H7"/><path d="M7 15h1"/></svg> Beschikbaar</td><td style="padding:4px;color:var(--success-color);">${beschikbaar}</td></tr>
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg> Actieve huurders</td><td style="padding:4px;font-weight:bold;">${activeContracts.length}</td></tr>
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> Bezettingsgraad</td><td style="padding:4px;">${bezetting}%</td></tr>
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg> Maandelijkse huur</td><td style="padding:4px;font-weight:bold;">€${maandHuur.toLocaleString("nl-NL")}</td></tr>
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> Open meldingen</td><td style="padding:4px;${urgentCount > 0 ? "color:var(--danger-color);font-weight:bold;" : ""}">${openMaintenance.length}${urgentCount > 0 ? ` (${urgentCount} urgent!)` : ""}</td></tr>
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> YTD inkomsten</td><td style="padding:4px;">€${inkomsten.toLocaleString("nl-NL")}</td></tr>
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg> YTD uitgaven</td><td style="padding:4px;">€${uitgaven.toLocaleString("nl-NL")}</td></tr>
            <tr style="border-top:1px solid #ddd;"><td style="padding:4px 8px;font-weight:bold;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Netto resultaat</td><td style="padding:4px;font-weight:bold;color:${inkomsten - uitgaven >= 0 ? "var(--success-color)" : "var(--danger-color)"};">€${(inkomsten - uitgaven).toLocaleString("nl-NL")}</td></tr>
        </table>`;
}

function generateMaintenanceResponse(onderhoud, panden) {
  const open = onderhoud.filter((m) => m.status !== "afgerond");
  if (open.length === 0) {
    return '<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg> <strong>Geen openstaande onderhoudsmeldingen!</strong> Alles is onder controle.</p>';
  }
  const s = sanitizeHTML;
  const byPriority = { urgent: [], hoog: [], normaal: [], laag: [] };
  open.forEach((m) => {
    const key = m.prioriteit || "normaal";
    if (byPriority[key]) byPriority[key].push(m);
  });

  let html = `<p><strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> ${open.length} openstaande meldingen:</strong></p>`;

  ["urgent", "hoog", "normaal", "laag"].forEach((prio) => {
    if (byPriority[prio].length > 0) {
      const icon = {
        urgent: '<span style="color:var(--danger-color)">&#9679;</span>',
        hoog: '<span style="color:var(--warning-color)">&#9679;</span>',
        normaal: '<span style="color:var(--info-color)">&#9679;</span>',
        laag: '<span style="color:var(--success-color)">&#9679;</span>',
      }[prio];
      html += `<p>${icon} <strong>${prio.charAt(0).toUpperCase() + prio.slice(1)} (${byPriority[prio].length}):</strong></p><ul>`;
      byPriority[prio].slice(0, 3).forEach((m) => {
        const pand = panden.find((p) => p.id === m.pandId);
        html += `<li>${s(m.titel)} - ${pand ? s(pand.adres) : "Onbekend"}</li>`;
      });
      if (byPriority[prio].length > 3)
        html += `<li>... en ${byPriority[prio].length - 3} meer</li>`;
      html += "</ul>";
    }
  });

  return html;
}

function generateContractResponse(contracten, huurders, panden) {
  const now = new Date();
  const threeMonths = new Date();
  threeMonths.setMonth(threeMonths.getMonth() + 3);
  const s = sanitizeHTML;

  const expiring = contracten.filter((c) => {
    const end = new Date(c.einddatum);
    return end > now && end <= threeMonths;
  });
  const expired = contracten.filter((c) => new Date(c.einddatum) < now);
  const active = contracten.filter((c) => new Date(c.einddatum) > now);

  let html = `<p><strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> Contracten Status:</strong></p>
        <p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg> Actief: ${active.length} | <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg> Verloopt binnenkort: ${expiring.length} | <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg> Verlopen: ${expired.length}</p>`;

  if (expiring.length > 0) {
    html +=
      '<p><strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg> Verlopende contracten (komende 3 maanden):</strong></p><ul>';
    expiring.forEach((c) => {
      const huurder = huurders.find((h) => h.id === c.huurderId);
      const pand = panden.find((p) => p.id === c.pandId);
      html += `<li><strong>${huurder ? s(`${huurder.voornaam} ${huurder.achternaam}`) : "Onbekend"}</strong> 
                - ${pand ? s(pand.adres) : "Onbekend"} 
                (verloopt ${new Date(c.einddatum).toLocaleDateString("nl-NL")})</li>`;
    });
    html += "</ul>";
  }

  return html;
}

function generateFinancialResponse(transacties, contracten) {
  const now = new Date();
  const year = now.getFullYear();
  const yearTx = transacties.filter(
    (t) => t.datum && t.datum.startsWith(year.toString()),
  );
  const income = yearTx
    .filter((t) => t.type === "inkomst")
    .reduce((s, t) => s + parseFloat(t.bedrag || 0), 0);
  const expense = yearTx
    .filter((t) => t.type === "uitgave")
    .reduce((s, t) => s + parseFloat(t.bedrag || 0), 0);
  const activeContracts = contracten.filter((c) => new Date(c.einddatum) > now);
  const monthlyRent = activeContracts.reduce(
    (s, c) => s + parseFloat(c.huurprijs || 0),
    0,
  );

  return `<p><strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg> Financieel Overzicht ${year}</strong></p>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> Inkomsten YTD</td><td style="padding:4px;color:var(--success-color);font-weight:bold;">€${income.toLocaleString("nl-NL")}</td></tr>
            <tr><td style="padding:4px 8px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg> Uitgaven YTD</td><td style="padding:4px;color:var(--danger-color);">€${expense.toLocaleString("nl-NL")}</td></tr>
            <tr style="border-top:1px solid #ddd;"><td style="padding:4px 8px;font-weight:bold;">Netto</td><td style="padding:4px;font-weight:bold;">€${(income - expense).toLocaleString("nl-NL")}</td></tr>
        </table>
        <p style="margin-top:12px;"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg> <strong>Verwachte maandelijkse huur:</strong> €${monthlyRent.toLocaleString("nl-NL")}</p>
        <p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg> <strong>Verwacht jaarinkomen:</strong> €${(monthlyRent * 12).toLocaleString("nl-NL")}</p>
        <p style="margin-top:8px;"><a href="financieel.html" style="color:var(--primary-color);"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> Bekijk volledig financieel overzicht</a></p>`;
}

function generatePropertyResponse(panden) {
  const s = sanitizeHTML;
  const byStatus = {};
  panden.forEach((p) => {
    byStatus[p.status] = byStatus[p.status] || [];
    byStatus[p.status].push(p);
  });

  let html = `<p><strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg> Panden Overzicht (${panden.length} totaal):</strong></p>`;

  if (byStatus.beschikbaar && byStatus.beschikbaar.length > 0) {
    html += `<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 7 5h10c3 0 5 2 5 4.5Z"/><polyline points="15 9 18 9 18 11"/><path d="M6.5 9H7"/><path d="M7 15h1"/></svg> <strong>Beschikbaar (${byStatus.beschikbaar.length}):</strong></p><ul>`;
    byStatus.beschikbaar.forEach((p) => {
      html += `<li>${s(p.adres)}, ${s(p.plaats)} - €${parseFloat(p.huurprijs).toLocaleString("nl-NL")}/mnd</li>`;
    });
    html += "</ul>";
  }

  Object.entries(byStatus).forEach(([status, items]) => {
    if (status !== "beschikbaar") {
      html += `<p>${status === "verhuurd" ? '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg>'} <strong>${status.charAt(0).toUpperCase() + status.slice(1)} (${items.length})</strong></p>`;
    }
  });

  return html;
}

function generateTenantResponse(huurders, contracten, panden) {
  const s = sanitizeHTML;
  const now = new Date();
  const activeContracts = contracten.filter((c) => new Date(c.einddatum) > now);

  let html = `<p><strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg> Huurders Overzicht (${huurders.length} geregistreerd, ${activeContracts.length} actief):</strong></p><ul>`;

  huurders.forEach((h) => {
    const contract = activeContracts.find((c) => c.huurderId === h.id);
    const pand = contract ? panden.find((p) => p.id === contract.pandId) : null;
    html += `<li><strong>${s(h.voornaam)} ${s(h.achternaam)}</strong> - ${pand ? s(pand.adres) : "<em>Geen actief contract</em>"}</li>`;
  });
  html += "</ul>";

  return html;
}

function generateEmailHelpResponse(message) {
  return `<p><strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Email Hulp</strong></p>
        <p>Ik kan u helpen met het voorbereiden van emails. Hier zijn veelgebruikte templates:</p>
        <ul>
            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> <strong>Huurcontract versturen</strong> - Ga naar <a href="contracten.html" style="color:var(--primary-color);">Contracten</a> en klik op <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></li>
            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> <strong>Onderhoudsbevestiging</strong> - Ga naar <a href="onderhoud.html" style="color:var(--primary-color);">Onderhoud</a></li>
            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg> <strong>Huurverhoging</strong> - Beschikbaar via de email templates</li>
        </ul>
        <p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg> <strong>Tip:</strong> Zorg dat u bent ingelogd op Microsoft 365 om emails te kunnen versturen (klik op de "Microsoft 365" knop in de sidebar).</p>`;
}

function generateHelpResponse() {
  const endpoint = getCopilotEndpoint();
  return `<p><strong><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg> Hoe werkt deze applicatie?</strong></p>
        <p>Dit is een vastgoedbeheer platform waarmee u het volgende kunt beheren:</p>
        <ul>
            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg> <strong><a href="panden.html" style="color:var(--primary-color);">Panden</a></strong> - Vastgoedportefeuille beheren</li>
            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg> <strong><a href="huurders.html" style="color:var(--primary-color);">Huurders</a></strong> - Huurder gegevens en contactinformatie</li>
            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> <strong><a href="contracten.html" style="color:var(--primary-color);">Contracten</a></strong> - Huurovereenkomsten aanmaken en beheren</li>
            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg> <strong><a href="onderhoud.html" style="color:var(--primary-color);">Onderhoud</a></strong> - Reparatieverzoeken en werkbonnen</li>
            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg> <strong><a href="financieel.html" style="color:var(--primary-color);">Financieel</a></strong> - Inkomsten, uitgaven en rapportages</li>
        </ul>
        <p><strong>AI Assistenten:</strong></p>
        <ul>
            <li><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> <strong>In-App AI</strong> - Directe data-analyse (deze chat)</li>
            <li>${endpoint.icon} <strong>Microsoft Copilot</strong> - Schakel hiernaar via de tab bovenaan voor geavanceerde AI met ${endpoint.type === "enterprise" ? "Enterprise Data Protection" : "consumer mogelijkheden"}</li>
        </ul>
        <p><strong>Sneltoetsen:</strong></p>
        <ul>
            <li><kbd>Ctrl+K</kbd> - Globaal zoeken</li>
            <li><kbd>Ctrl+Shift+C</kbd> - Copilot openen/sluiten</li>
        </ul>
        <p><strong>Exporteren:</strong> Elke pagina heeft een <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg> CSV Export knop in de header.</p>`;
}

function formatCopilotResponse(text) {
  // Convert markdown-like formatting to HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>")
    .replace(/^- /gm, "- ");
}

async function gatherAppContext() {
  try {
    const [panden, huurders, contracten, onderhoud] = await Promise.all([
      dbGetAll("panden"),
      dbGetAll("huurders"),
      dbGetAll("contracten"),
      dbGetAll("onderhoud"),
    ]);
    const now = new Date();
    return `Panden: ${panden.length} (${panden.filter((p) => p.status === "beschikbaar").length} beschikbaar)
Huurders: ${huurders.length}
Actieve contracten: ${contracten.filter((c) => new Date(c.einddatum) > now).length}
Open onderhoud: ${onderhoud.filter((m) => m.status !== "afgerond").length}`;
  } catch (error) {
    console.warn("Failed to gather app context:", error);
    return "Data niet beschikbaar";
  }
}

function clearCopilotChat() {
  copilotChatHistory = [];
  document.getElementById("copilotMessages").innerHTML = `
        <div class="copilot-message assistant">
            <div class="copilot-message-content">
                <p>Gesprek gewist. Hoe kan ik u helpen?</p>
            </div>
        </div>
    `;
}

async function copilotQuickAction(action) {
  const input = document.getElementById("copilotInput");
  const actions = {
    overzicht: "Geef me een overzicht van de vastgoedportefeuille",
    onderhoud: "Welke onderhoudsmeldingen staan er open?",
    contracts: "Welke contracten verlopen binnenkort?",
    financieel: "Hoe staat het financieel dit jaar?",
  };
  input.value = actions[action] || "";
  sendCopilotMessage();
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
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
