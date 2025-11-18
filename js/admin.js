// Admin Page Logic

let currentSettings = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and admin role
    try {
        const user = await checkEntraAuth();
        
        if (!user && !isDemoMode()) {
            window.location.href = 'index.html';
            return;
        }
        
        // Check if user is admin
        if (!isAdmin()) {
            document.getElementById('adminContent').style.display = 'none';
            document.getElementById('accessDenied').style.display = 'block';
            return;
        }
        
        // Set user info
        if (user) {
            document.getElementById('userName').textContent = user.name || user.email;
            const roleBadge = document.getElementById('userRole');
            roleBadge.textContent = user.role.toUpperCase();
            roleBadge.className = 'role-badge role-' + user.role;
        }
        
        // Show demo indicator if in demo mode
        if (isDemoMode()) {
            document.getElementById('demoIndicator').style.display = 'block';
        }
        
        // Load data
        await loadAdminData();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing admin page:', error);
        alert('Fout bij laden van admin pagina');
    }
});

// Load admin data
async function loadAdminData() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
        currentSettings = JSON.parse(savedSettings);
        populateSettings();
    }
    
    // Load Azure config
    loadAzureConfig();
    
    // Load users list
    loadUsersList();
    
    // Load admin emails
    loadAdminEmails();
    
    // Update demo status
    updateDemoStatus();
}

// Populate settings form
function populateSettings() {
    if (currentSettings.company) {
        document.getElementById('companyName').value = currentSettings.company.name || '';
        document.getElementById('companyAddress').value = currentSettings.company.address || '';
        document.getElementById('companyPhone').value = currentSettings.company.phone || '';
        document.getElementById('companyEmail').value = currentSettings.company.email || '';
        document.getElementById('companyIban').value = currentSettings.company.iban || '';
    }
    
    if (currentSettings.email) {
        document.getElementById('emailFromName').value = currentSettings.email.fromName || '';
        document.getElementById('emailFromAddress').value = currentSettings.email.fromAddress || '';
        document.getElementById('emailAutoArchive').checked = currentSettings.email.autoArchive !== false;
    }
    
    if (currentSettings.financial) {
        document.getElementById('defaultBorgMonths').value = currentSettings.financial.borgMonths || 2;
        document.getElementById('defaultPaymentDay').value = currentSettings.financial.paymentDay || 1;
        document.getElementById('rentIncreasePercent').value = currentSettings.financial.rentIncreasePercent || 2.5;
    }
    
    if (currentSettings.notifications) {
        document.getElementById('notifyContractExpiring').checked = currentSettings.notifications.contractExpiring !== false;
        document.getElementById('notifyMaintenanceUrgent').checked = currentSettings.notifications.maintenanceUrgent !== false;
        document.getElementById('notifyPaymentOverdue').checked = currentSettings.notifications.paymentOverdue !== false;
    }
}

// Load Azure config
function loadAzureConfig() {
    const azureConfig = localStorage.getItem('azureConfig');
    if (azureConfig) {
        const config = JSON.parse(azureConfig);
        document.getElementById('azureClientId').value = config.clientId || '';
        document.getElementById('azureTenantId').value = config.tenantId || '';
        document.getElementById('sharePointSiteName').value = config.sharePointSite || '';
    }
}

// Load users list
function loadUsersList() {
    const usersList = document.getElementById('usersList');
    
    if (isDemoMode()) {
        usersList.innerHTML = `
            <div class="info-box">
                <p>👥 In demo modus worden geen echte gebruikers getoond.</p>
                <p>Na configuratie met Azure AD verschijnen hier de gebruikers die zich hebben aangemeld.</p>
            </div>
        `;
        return;
    }
    
    // In production, this would fetch from Azure AD via Graph API
    usersList.innerHTML = `
        <div class="info-box">
            <p>Gebruikerslijst wordt gesynchroniseerd met Azure AD.</p>
            <p>Configureer Azure AD in de "Azure AD" tab om gebruikers te zien.</p>
        </div>
    `;
}

// Load admin emails
function loadAdminEmails() {
    const savedEmails = localStorage.getItem('adminEmails');
    const defaultEmails = [
        'admin@stadsgezicht.onmicrosoft.com',
        'beheer@stadsgezicht.nl'
    ];
    
    const emails = savedEmails ? JSON.parse(savedEmails) : defaultEmails;
    document.getElementById('adminEmailsList').value = emails.join('\n');
}

// Update demo status
function updateDemoStatus() {
    const statusText = document.getElementById('demoStatusText');
    const controls = document.getElementById('demoControls');
    
    if (isDemoMode()) {
        statusText.innerHTML = '<span class="status-badge actief">🎭 Demo Modus Actief</span>';
        controls.innerHTML = `
            <button id="exitDemoMode" class="btn-secondary">Verlaat Demo Modus</button>
            <p><small>Let op: Bij verlaten moet u opnieuw inloggen met Microsoft 365</small></p>
        `;
        
        document.getElementById('exitDemoMode').addEventListener('click', () => {
            if (confirm('Weet u zeker dat u demo modus wilt verlaten? U moet daarna opnieuw inloggen.')) {
                disableDemoMode();
                window.location.href = 'index.html';
            }
        });
    } else {
        statusText.innerHTML = '<span class="status-badge verlopen">Demo Modus Niet Actief</span>';
        controls.innerHTML = `
            <p>Demo modus is uitgeschakeld. Gebruikers moeten inloggen via de login pagina.</p>
        `;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (isDemoMode()) {
            disableDemoMode();
            window.location.href = 'index.html';
        } else {
            await signOutEntraId();
        }
    });
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName + 'Tab').classList.add('active');
        });
    });
    
    // Save settings
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Save admin emails
    document.getElementById('saveAdminEmails').addEventListener('click', saveAdminEmails);
    
    // Save Azure config
    document.getElementById('saveAzureConfig').addEventListener('click', saveAzureConfig);
    
    // Test Azure config
    document.getElementById('testAzureConfig').addEventListener('click', testAzureConfig);
    
    // Demo data actions
    document.getElementById('resetDemoData').addEventListener('click', resetDemoData);
    document.getElementById('exportDemoData').addEventListener('click', exportDemoData);
    document.getElementById('importDemoData').addEventListener('click', importDemoData);
}

// Save settings
function saveSettings() {
    currentSettings = {
        company: {
            name: document.getElementById('companyName').value,
            address: document.getElementById('companyAddress').value,
            phone: document.getElementById('companyPhone').value,
            email: document.getElementById('companyEmail').value,
            iban: document.getElementById('companyIban').value
        },
        email: {
            fromName: document.getElementById('emailFromName').value,
            fromAddress: document.getElementById('emailFromAddress').value,
            autoArchive: document.getElementById('emailAutoArchive').checked
        },
        financial: {
            borgMonths: parseInt(document.getElementById('defaultBorgMonths').value),
            paymentDay: parseInt(document.getElementById('defaultPaymentDay').value),
            rentIncreasePercent: parseFloat(document.getElementById('rentIncreasePercent').value)
        },
        notifications: {
            contractExpiring: document.getElementById('notifyContractExpiring').checked,
            maintenanceUrgent: document.getElementById('notifyMaintenanceUrgent').checked,
            paymentOverdue: document.getElementById('notifyPaymentOverdue').checked
        }
    };
    
    localStorage.setItem('appSettings', JSON.stringify(currentSettings));
    alert('✅ Instellingen opgeslagen!');
}

// Save admin emails
function saveAdminEmails() {
    const emailsText = document.getElementById('adminEmailsList').value;
    const emails = emailsText.split('\n').map(e => e.trim()).filter(e => e.length > 0);
    
    localStorage.setItem('adminEmails', JSON.stringify(emails));
    alert('✅ Administrator emails opgeslagen!');
}

// Save Azure config
function saveAzureConfig() {
    const config = {
        clientId: document.getElementById('azureClientId').value,
        tenantId: document.getElementById('azureTenantId').value,
        sharePointSite: document.getElementById('sharePointSiteName').value
    };
    
    localStorage.setItem('azureConfig', JSON.stringify(config));
    
    // Update config in entra-auth.js (requires page reload)
    alert('✅ Azure configuratie opgeslagen!\n\nHerlaad de pagina om de nieuwe configuratie te gebruiken.');
}

// Test Azure config
async function testAzureConfig() {
    const statusDiv = document.getElementById('azureStatus');
    statusDiv.innerHTML = '<p>🔄 Verbinding testen...</p>';
    
    try {
        // Try to get a token
        const token = await getEntraAccessToken(['User.Read']);
        
        if (token) {
            statusDiv.innerHTML = `
                <div class="success-box">
                    <h3>✅ Verbinding Succesvol!</h3>
                    <p>Azure AD configuratie werkt correct.</p>
                    <p><small>Token verkregen: ${token.substring(0, 20)}...</small></p>
                </div>
            `;
        }
    } catch (error) {
        statusDiv.innerHTML = `
            <div class="error-box">
                <h3>❌ Verbinding Mislukt</h3>
                <p>${error.message}</p>
                <p><small>Controleer de Client ID en Tenant ID in AZURE-AD-SETUP.md</small></p>
            </div>
        `;
    }
}

// Reset demo data
function resetDemoData() {
    if (!isDemoMode()) {
        alert('Demo modus is niet actief');
        return;
    }
    
    if (confirm('Weet u zeker dat u alle demo data wilt resetten naar de standaard waarden?')) {
        const db = getDemoDatabase();
        db.reset();
        alert('✅ Demo data is gereset!');
        window.location.reload();
    }
}

// Export demo data
function exportDemoData() {
    if (!isDemoMode()) {
        alert('Demo modus is niet actief');
        return;
    }
    
    const db = getDemoDatabase();
    const data = JSON.stringify(db.data, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// Import demo data
function importDemoData() {
    if (!isDemoMode()) {
        alert('Demo modus is niet actief');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const db = getDemoDatabase();
                db.data = data;
                
                alert('✅ Demo data geïmporteerd!');
                window.location.reload();
            } catch (error) {
                alert('❌ Fout bij importeren: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}
