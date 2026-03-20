// Database Helper Functions for Firebase Realtime Database
// Helper functions to work with Firebase Realtime Database
// Automatically uses demo data when in demo mode

// Enable Firebase offline persistence
try {
    if (typeof database !== 'undefined' && database && database.ref) {
        database.ref('.info/connected').on('value', (snap) => {
            if (snap.val() === true) {
                console.log('Firebase: Connected');
            } else {
                console.log('Firebase: Offline - using cached data');
            }
        });
    }
} catch (e) { /* silently handle if Firebase not initialized */ }

// Get all items from a path
async function dbGetAll(path) {
    // Use demo database if in demo mode
    if (typeof isDemoMode === 'function' && isDemoMode()) {
        const demoHelpers = getDemoDbHelpers();
        return demoHelpers.dbGetAll(path);
    }
    
    try {
        const snapshot = await database.ref(path).once('value');
        const data = snapshot.val();
        
        if (!data) return [];
        
        // Convert object to array with ids
        return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
    } catch (error) {
        console.error(`Error getting all from ${path}:`, error);
        throw error;
    }
}

// Get single item by id
async function dbGet(path, id) {
    // Use demo database if in demo mode
    if (typeof isDemoMode === 'function' && isDemoMode()) {
        const demoHelpers = getDemoDbHelpers();
        return demoHelpers.dbGet(path, id);
    }
    
    try {
        const snapshot = await database.ref(`${path}/${id}`).once('value');
        const data = snapshot.val();
        
        if (!data) return null;
        
        return { id, ...data };
    } catch (error) {
        console.error(`Error getting ${path}/${id}:`, error);
        throw error;
    }
}

// Add new item
async function dbAdd(path, data) {
    // Use demo database if in demo mode
    if (typeof isDemoMode === 'function' && isDemoMode()) {
        const demoHelpers = getDemoDbHelpers();
        return demoHelpers.dbAdd(path, data);
    }
    
    try {
        const timestamp = Date.now();
        const itemData = {
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        
        const newRef = await database.ref(path).push(itemData);
        return newRef.key;
    } catch (error) {
        console.error(`Error adding to ${path}:`, error);
        throw error;
    }
}

// Update existing item
async function dbUpdate(path, id, data) {
    // Use demo database if in demo mode
    if (typeof isDemoMode === 'function' && isDemoMode()) {
        const demoHelpers = getDemoDbHelpers();
        return demoHelpers.dbUpdate(path, id, data);
    }
    
    try {
        const updateData = {
            ...data,
            updatedAt: Date.now()
        };
        
        await database.ref(`${path}/${id}`).update(updateData);
        return true;
    } catch (error) {
        console.error(`Error updating ${path}/${id}:`, error);
        throw error;
    }
}

// Delete item
async function dbDelete(path, id) {
    // Use demo database if in demo mode
    if (typeof isDemoMode === 'function' && isDemoMode()) {
        const demoHelpers = getDemoDbHelpers();
        return demoHelpers.dbDelete(path, id);
    }
    
    try {
        await database.ref(`${path}/${id}`).remove();
        return true;
    } catch (error) {
        console.error(`Error deleting ${path}/${id}:`, error);
        throw error;
    }
}

// Query items with filter
async function dbQuery(path, orderByChild, equalTo) {
    // Use demo database if in demo mode
    if (typeof isDemoMode === 'function' && isDemoMode()) {
        const demoHelpers = getDemoDbHelpers();
        return demoHelpers.dbQuery(path, { orderBy: orderByChild, where: equalTo ? [orderByChild, '==', equalTo] : null });
    }
    
    try {
        let query = database.ref(path);
        
        if (orderByChild) {
            query = query.orderByChild(orderByChild);
        }
        
        if (equalTo !== undefined) {
            query = query.equalTo(equalTo);
        }
        
        const snapshot = await query.once('value');
        const data = snapshot.val();
        
        if (!data) return [];
        
        return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
    } catch (error) {
        console.error(`Error querying ${path}:`, error);
        throw error;
    }
}

// Export functions
window.dbGetAll = dbGetAll;
window.dbGet = dbGet;
window.dbAdd = dbAdd;
window.dbUpdate = dbUpdate;
window.dbDelete = dbDelete;
window.dbQuery = dbQuery;
