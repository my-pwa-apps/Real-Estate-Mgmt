// Microsoft Entra ID Single Sign-On Authentication
// This replaces Firebase email/password authentication with Azure AD SSO

// MSAL Configuration for Entra ID SSO
const msalAuthConfig = {
    auth: {
        clientId: "YOUR_CLIENT_ID", // Same as in microsoft-auth.js or separate app registration
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
        redirectUri: window.location.origin + "/dashboard.html"
    },
    cache: {
        cacheLocation: "localStorage", // Changed to localStorage for persistent SSO
        storeAuthStateInCookie: false
    }
};

// Required scopes for webapp authentication
const loginScopes = {
    scopes: ["User.Read", "email", "profile", "openid"]
};

// MSAL instance for authentication
let msalAuthInstance = null;

// User roles (stored in Azure AD custom attributes or groups)
const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    VIEWER: 'viewer'
};

// Initialize MSAL for Entra ID authentication
function initializeEntraAuth() {
    try {
        msalAuthInstance = new msal.PublicClientApplication(msalAuthConfig);
        return msalAuthInstance;
    } catch (error) {
        console.error('Error initializing Entra ID auth:', error);
        throw error;
    }
}

// Check if user is authenticated with Entra ID
async function checkEntraAuth() {
    try {
        if (!msalAuthInstance) {
            initializeEntraAuth();
        }

        const accounts = msalAuthInstance.getAllAccounts();
        
        if (accounts.length === 0) {
            // No user signed in, redirect to login
            if (!window.location.pathname.includes('index.html') && 
                !window.location.pathname.endsWith('/') &&
                !isDemoMode()) {
                window.location.href = 'index.html';
            }
            return null;
        }

        // User is signed in, get fresh token
        const account = accounts[0];
        
        try {
            const response = await msalAuthInstance.acquireTokenSilent({
                ...loginScopes,
                account: account
            });
            
            // Store user info
            window.currentUser = {
                id: account.localAccountId,
                email: account.username,
                name: account.name,
                role: getUserRole(account),
                account: account,
                accessToken: response.accessToken,
                idToken: response.idToken
            };
            
            return window.currentUser;
            
        } catch (silentError) {
            console.error('Silent token acquisition failed:', silentError);
            
            if (silentError instanceof msal.InteractionRequiredAuthError) {
                // Require user interaction
                return await signInWithEntraId();
            }
            throw silentError;
        }
        
    } catch (error) {
        console.error('Error checking Entra auth:', error);
        
        // Don't redirect if in demo mode
        if (!isDemoMode()) {
            window.location.href = 'index.html';
        }
        return null;
    }
}

// Sign in with Entra ID (popup or redirect)
async function signInWithEntraId(useRedirect = false) {
    try {
        if (!msalAuthInstance) {
            initializeEntraAuth();
        }

        let response;
        
        if (useRedirect) {
            // Redirect flow (better for mobile)
            await msalAuthInstance.loginRedirect(loginScopes);
            // After redirect, handleRedirectPromise will be called
            return null;
        } else {
            // Popup flow (better for desktop)
            response = await msalAuthInstance.loginPopup(loginScopes);
        }

        if (response) {
            const account = response.account;
            
            window.currentUser = {
                id: account.localAccountId,
                email: account.username,
                name: account.name,
                role: getUserRole(account),
                account: account,
                accessToken: response.accessToken,
                idToken: response.idToken
            };
            
            return window.currentUser;
        }
        
    } catch (error) {
        console.error('Entra ID sign-in error:', error);
        throw error;
    }
}

// Handle redirect promise after login redirect
async function handleEntraRedirect() {
    try {
        if (!msalAuthInstance) {
            initializeEntraAuth();
        }

        const response = await msalAuthInstance.handleRedirectPromise();
        
        if (response) {
            const account = response.account;
            
            window.currentUser = {
                id: account.localAccountId,
                email: account.username,
                name: account.name,
                role: getUserRole(account),
                account: account,
                accessToken: response.accessToken,
                idToken: response.idToken
            };
            
            // Redirect to dashboard after successful login
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname.endsWith('/')) {
                window.location.href = 'dashboard.html';
            }
            
            return window.currentUser;
        }
        
        return null;
        
    } catch (error) {
        console.error('Error handling redirect:', error);
        return null;
    }
}

// Get user role from Azure AD groups or custom attributes
function getUserRole(account) {
    // Check if user has admin role in Azure AD groups
    // This requires "GroupMember.Read.All" permission in Azure AD
    
    // Option 1: Check ID token claims for groups
    if (account.idTokenClaims && account.idTokenClaims.groups) {
        const groups = account.idTokenClaims.groups;
        
        // Define your Azure AD group IDs
        const ADMIN_GROUP_ID = 'YOUR_ADMIN_GROUP_ID'; // Replace with actual group ID
        const MANAGER_GROUP_ID = 'YOUR_MANAGER_GROUP_ID';
        
        if (groups.includes(ADMIN_GROUP_ID)) {
            return USER_ROLES.ADMIN;
        }
        if (groups.includes(MANAGER_GROUP_ID)) {
            return USER_ROLES.MANAGER;
        }
    }
    
    // Option 2: Check custom extension attributes
    if (account.idTokenClaims && account.idTokenClaims.extension_Role) {
        return account.idTokenClaims.extension_Role;
    }
    
    // Option 3: Hardcoded admin emails (for simple setup)
    const adminEmails = [
        'admin@stadsgezicht.onmicrosoft.com',
        'beheer@stadsgezicht.nl'
    ];
    
    if (adminEmails.includes(account.username.toLowerCase())) {
        return USER_ROLES.ADMIN;
    }
    
    // Default role
    return USER_ROLES.MANAGER;
}

// Check if current user has specific role
function hasRole(requiredRole) {
    if (isDemoMode()) {
        return true; // Demo mode has all permissions
    }
    
    if (!window.currentUser) {
        return false;
    }
    
    const roleHierarchy = {
        [USER_ROLES.ADMIN]: 3,
        [USER_ROLES.MANAGER]: 2,
        [USER_ROLES.VIEWER]: 1
    };
    
    const userRoleLevel = roleHierarchy[window.currentUser.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
}

// Check if user is admin
function isAdmin() {
    return hasRole(USER_ROLES.ADMIN);
}

// Sign out from Entra ID
async function signOutEntraId() {
    try {
        if (!msalAuthInstance) {
            return;
        }

        const accounts = msalAuthInstance.getAllAccounts();
        
        if (accounts.length > 0) {
            // Clear current user
            window.currentUser = null;
            
            // Sign out from MSAL
            await msalAuthInstance.logoutPopup({
                account: accounts[0],
                postLogoutRedirectUri: window.location.origin + "/index.html"
            });
        }
        
    } catch (error) {
        console.error('Error signing out:', error);
        // Clear local data anyway
        window.currentUser = null;
        window.location.href = 'index.html';
    }
}

// Get Entra ID access token for Graph API calls
async function getEntraAccessToken(scopes = ["User.Read"]) {
    try {
        if (!msalAuthInstance) {
            initializeEntraAuth();
        }

        const accounts = msalAuthInstance.getAllAccounts();
        
        if (accounts.length === 0) {
            throw new Error('No account signed in');
        }

        const response = await msalAuthInstance.acquireTokenSilent({
            scopes: scopes,
            account: accounts[0]
        });

        return response.accessToken;
        
    } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
            const response = await msalAuthInstance.acquireTokenPopup({
                scopes: scopes
            });
            return response.accessToken;
        }
        throw error;
    }
}

// Get Firebase custom token from backend (for Firebase integration)
async function getFirebaseToken() {
    try {
        const idToken = window.currentUser?.idToken;
        
        if (!idToken) {
            throw new Error('No Entra ID token available');
        }
        
        // Call your backend endpoint to exchange Entra ID token for Firebase token
        // This requires a backend function (Azure Function, Cloud Function, etc.)
        const response = await fetch('YOUR_BACKEND_URL/auth/firebase-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get Firebase token');
        }
        
        const data = await response.json();
        return data.firebaseToken;
        
    } catch (error) {
        console.error('Error getting Firebase token:', error);
        // For now, we'll use Entra ID token directly
        // Firebase rules will need to be updated to validate Entra ID tokens
        return window.currentUser?.idToken;
    }
}

// Demo mode detection
function isDemoMode() {
    return localStorage.getItem('demoMode') === 'true';
}

// Enable demo mode
function enableDemoMode() {
    localStorage.setItem('demoMode', 'true');
    window.currentUser = {
        id: 'demo-user',
        email: 'demo@stadsgezicht.nl',
        name: 'Demo Gebruiker',
        role: USER_ROLES.ADMIN, // Demo has full access
        isDemo: true
    };
}

// Disable demo mode
function disableDemoMode() {
    localStorage.removeItem('demoMode');
    window.currentUser = null;
}

// Export functions
window.initializeEntraAuth = initializeEntraAuth;
window.checkEntraAuth = checkEntraAuth;
window.signInWithEntraId = signInWithEntraId;
window.handleEntraRedirect = handleEntraRedirect;
window.signOutEntraId = signOutEntraId;
window.getEntraAccessToken = getEntraAccessToken;
window.getFirebaseToken = getFirebaseToken;
window.hasRole = hasRole;
window.isAdmin = isAdmin;
window.getUserRole = getUserRole;
window.USER_ROLES = USER_ROLES;
window.isDemoMode = isDemoMode;
window.enableDemoMode = enableDemoMode;
window.disableDemoMode = disableDemoMode;
