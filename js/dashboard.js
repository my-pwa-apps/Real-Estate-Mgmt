// Dashboard functionality

let panden = [];
let huurders = [];
let contracten = [];
let meldingen = [];

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoading('Dashboard laden...');
        
        // Load all data from Realtime Database
        const [pandenData, huurdersData, contractenData, meldingenData] = await Promise.all([
            dbGetAll('panden'),
            dbGetAll('huurders'),
            dbGetAll('contracten'),
            dbGetAll('onderhoud')
        ]);

        panden = pandenData;
        huurders = huurdersData;
        contracten = contractenData;
        meldingen = meldingenData;

        updateStatistics();
        loadRecentMeldingen();
        loadVerlopendeContracten();
        
        hideLoading();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        hideLoading();
        showToast('Fout bij laden dashboard gegevens', 'error');
    }
}

// Update statistics cards
function updateStatistics() {
    // Total panden
    const totalPanden = panden.length;
    const bedrijfspanden = panden.filter(p => p.type === 'bedrijfspand').length;
    const woningen = panden.filter(p => p.type === 'woning').length;
    
    document.getElementById('totalPanden').textContent = totalPanden;
    document.getElementById('pandenBreakdown').textContent = `${bedrijfspanden} bedrijfspanden, ${woningen} woningen`;

    // Total huurders
    const activeContracts = contracten.filter(c => {
        const eindDatum = new Date(c.einddatum);
        return eindDatum > new Date();
    }).length;
    
    document.getElementById('totalHuurders').textContent = activeContracts;
    
    const bezetting = panden.length > 0 ? Math.round((activeContracts / panden.length) * 100) : 0;
    document.getElementById('bezettingsgraad').textContent = `${bezetting}% bezetting`;

    // Open meldingen
    const openMeldingen = meldingen.filter(m => m.status !== 'afgerond').length;
    const urgentMeldingen = meldingen.filter(m => m.prioriteit === 'urgent' && m.status !== 'afgerond').length;
    
    document.getElementById('openMeldingen').textContent = openMeldingen;
    document.getElementById('urgentMeldingen').textContent = `${urgentMeldingen} urgent`;

    // Maandelijkse inkomsten
    const maandInkomsten = contracten
        .filter(c => {
            const eindDatum = new Date(c.einddatum);
            return eindDatum > new Date();
        })
        .reduce((sum, c) => sum + (parseFloat(c.huurprijs) || 0), 0);
    
    document.getElementById('maandInkomsten').textContent = `€${maandInkomsten.toLocaleString('nl-NL')}`;
    document.getElementById('jaarInkomsten').textContent = `€${(maandInkomsten * 12).toLocaleString('nl-NL')} per jaar`;
}

// Load recent meldingen
function loadRecentMeldingen() {
    const container = document.getElementById('recenteMeldingen');
    
    const recentMeldingen = meldingen
        .filter(m => m.status !== 'afgerond')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);

    if (recentMeldingen.length === 0) {
        container.innerHTML = '<p class="empty-state">Geen recente meldingen</p>';
        return;
    }

    container.innerHTML = recentMeldingen.map(m => {
        const pand = panden.find(p => p.id === m.pandId);
        const priorityClass = m.prioriteit || 'normaal';
        
        return `
            <div class="list-item" style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong style="color: var(--text-primary);">${m.titel}</strong>
                        <p style="color: var(--text-secondary); font-size: 13px; margin: 4px 0;">
                            ${pand ? pand.adres : 'Onbekend pand'}
                        </p>
                    </div>
                    <span class="priority-badge ${priorityClass}">${m.prioriteit || 'normaal'}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Load verlopende contracten (binnen 3 maanden)
function loadVerlopendeContracten() {
    const container = document.getElementById('verlpendeContracten');
    
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const verlopend = contracten
        .filter(c => {
            const eindDatum = new Date(c.einddatum);
            const now = new Date();
            return eindDatum > now && eindDatum <= threeMonthsFromNow;
        })
        .sort((a, b) => new Date(a.einddatum) - new Date(b.einddatum));

    if (verlopend.length === 0) {
        container.innerHTML = '<p class="empty-state">Geen verlopende contracten in de komende 3 maanden</p>';
        return;
    }

    container.innerHTML = verlopend.map(c => {
        const huurder = huurders.find(h => h.id === c.huurderId);
        const pand = panden.find(p => p.id === c.pandId);
        const eindDatum = new Date(c.einddatum).toLocaleDateString('nl-NL');
        
        return `
            <div class="list-item" style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <div>
                    <strong style="color: var(--text-primary);">
                        ${huurder ? `${huurder.voornaam} ${huurder.achternaam}` : 'Onbekende huurder'}
                    </strong>
                    <p style="color: var(--text-secondary); font-size: 13px; margin: 4px 0;">
                        ${pand ? pand.adres : 'Onbekend pand'}
                    </p>
                    <small style="color: var(--text-muted);">Verloopt op ${eindDatum}</small>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check Entra ID authentication (or demo mode)
        const user = await checkEntraAuth();
        
        if (!user && !isDemoMode()) {
            window.location.href = 'index.html';
            return;
        }
        
        await loadDashboardData();
        
        // Set user name if available
        if (user) {
            document.getElementById('userName').textContent = user.name || user.email.split('@')[0];
        } else if (isDemoMode()) {
            document.getElementById('userName').textContent = 'Demo Gebruiker';
        }

        // Setup Microsoft 365 sign-in button
        const microsoftBtn = document.getElementById('microsoftSignInBtn');
        if (microsoftBtn) {
            // Don't show M365 button in demo mode
            if (isDemoMode()) {
                microsoftBtn.style.display = 'none';
            } else if (typeof initializeMSAL !== 'undefined') {
                initializeMSAL();
                
                // Show button if not signed in
                if (!isMicrosoftSignedIn()) {
                    microsoftBtn.style.display = 'block';
                    microsoftBtn.textContent = '🔐 Microsoft 365 Inloggen';
                } else {
                    microsoftBtn.style.display = 'block';
                    microsoftBtn.textContent = '✅ Microsoft 365';
                    microsoftBtn.disabled = true;
                }

                microsoftBtn.addEventListener('click', async () => {
                    try {
                        await signInToMicrosoft();
                        microsoftBtn.textContent = '✅ Microsoft 365';
                        microsoftBtn.disabled = true;
                        showToast('Succesvol ingelogd bij Microsoft 365! U kunt nu emails versturen en documenten opslaan.', 'success', 5000);
                    } catch (error) {
                        console.error('Microsoft sign-in error:', error);
                        showToast('Fout bij inloggen: ' + error.message, 'error');
                    }
                });
            }
        }
        // Demo indicator is handled globally by app-init.js
    } catch (error) {
        console.error('Dashboard initialization error:', error);
    }
});
