// Auto Rent Increase - Handles annual rent increase processing
// Based on the configured percentage in admin settings

/**
 * Check and apply annual rent increases for all active contracts
 * Should be triggered once per year (typically January)
 */
async function processRentIncrease() {
    try {
        const settings = storage.get('appSettings', {});
        const increasePercent = parseFloat(settings.financial?.rentIncreasePercent || 2.5);
        
        if (increasePercent <= 0) {
            showToast('Geen huurverhogingspercentage ingesteld', 'info');
            return { processed: 0 };
        }

        const [contracten, panden, huurders] = await Promise.all([
            dbGetAll('contracten'),
            dbGetAll('panden'),
            dbGetAll('huurders')
        ]);

        const now = new Date();
        const currentYear = now.getFullYear();

        // Find active contracts eligible for increase (not already increased this year)
        const eligible = contracten.filter(c => {
            const end = new Date(c.einddatum);
            return end > now && !c.lastIncreaseYear?.toString().includes(currentYear.toString());
        });

        if (eligible.length === 0) {
            showToast('Geen contracten gevonden voor huurverhoging', 'info');
            return { processed: 0 };
        }

        const confirmed = await showConfirm(
            `${eligible.length} contracten gevonden voor huurverhoging van ${increasePercent}%. Wilt u doorgaan?`,
            'Jaarlijkse Huurverhoging'
        );
        
        if (!confirmed) return { processed: 0 };

        showLoading('Huurverhoging verwerken...');
        let processed = 0;

        for (const contract of eligible) {
            const oldPrice = parseFloat(contract.huurprijs);
            const newPrice = Math.round((oldPrice * (1 + increasePercent / 100)) * 100) / 100;
            
            await dbUpdate('contracten', contract.id, {
                huurprijs: newPrice,
                lastIncreaseYear: currentYear,
                lastIncreasePercent: increasePercent,
                lastIncreaseOldPrice: oldPrice
            });

            // Also update the pand huurprijs
            if (contract.pandId) {
                await dbUpdate('panden', contract.pandId, { huurprijs: newPrice });
            }

            // Log the increase
            if (typeof logAuditEvent === 'function') {
                const huurder = huurders.find(h => h.id === contract.huurderId);
                const pand = panden.find(p => p.id === contract.pandId);
                logAuditEvent('update', 'contracten', contract.id, {
                    description: `Huurverhoging ${increasePercent}%: €${oldPrice} → €${newPrice} (${huurder ? huurder.voornaam + ' ' + huurder.achternaam : ''}, ${pand ? pand.adres : ''})`
                });
            }

            processed++;
        }

        hideLoading();
        showToast(`${processed} contracten bijgewerkt met ${increasePercent}% huurverhoging`, 'success');
        
        return { processed, increasePercent };
    } catch (error) {
        hideLoading();
        console.error('Error processing rent increase:', error);
        showToast('Fout bij verwerken huurverhoging: ' + error.message, 'error');
        return { processed: 0 };
    }
}

/**
 * Preview rent increases without applying
 */
async function previewRentIncrease() {
    const settings = storage.get('appSettings', {});
    const increasePercent = parseFloat(settings.financial?.rentIncreasePercent || 2.5);
    
    const [contracten, panden, huurders] = await Promise.all([
        dbGetAll('contracten'),
        dbGetAll('panden'),
        dbGetAll('huurders')
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();

    const eligible = contracten.filter(c => {
        const end = new Date(c.einddatum);
        return end > now && !c.lastIncreaseYear?.toString().includes(currentYear.toString());
    });

    return eligible.map(c => {
        const huurder = huurders.find(h => h.id === c.huurderId);
        const pand = panden.find(p => p.id === c.pandId);
        const oldPrice = parseFloat(c.huurprijs);
        const newPrice = Math.round((oldPrice * (1 + increasePercent / 100)) * 100) / 100;

        return {
            contractId: c.id,
            huurder: huurder ? `${huurder.voornaam} ${huurder.achternaam}` : 'Onbekend',
            pand: pand ? pand.adres : 'Onbekend',
            oldPrice,
            newPrice,
            increase: newPrice - oldPrice
        };
    });
}

// Export
window.processRentIncrease = processRentIncrease;
window.previewRentIncrease = previewRentIncrease;
