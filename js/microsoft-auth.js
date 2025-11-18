// Microsoft Graph API Configuration & Authentication
// MSAL.js (Microsoft Authentication Library)

const msalConfig = {
    auth: {
        clientId: "YOUR_AZURE_APP_CLIENT_ID", // Vervang met uw Azure AD App Client ID
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Vervang met uw Tenant ID
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    }
};

// Microsoft Graph API scopes
const loginRequest = {
    scopes: [
        "User.Read",
        "Files.ReadWrite.All",
        "Sites.ReadWrite.All",
        "Mail.Send",
        "Mail.ReadWrite"
    ]
};

// SharePoint configuration
const sharePointConfig = {
    siteUrl: "https://stadsgezicht.sharepoint.com/sites/Vastgoedbeheer",
    driveId: "", // Wordt automatisch opgehaald
    documentLibrary: "Gedeelde documenten"
};

// Initialize MSAL
let msalInstance = null;
let graphAccessToken = null;

function initializeMSAL() {
    msalInstance = new msal.PublicClientApplication(msalConfig);
    return msalInstance;
}

// Sign in to Microsoft 365
async function signInToMicrosoft() {
    try {
        const loginResponse = await msalInstance.loginPopup(loginRequest);
        console.log("Microsoft login successful:", loginResponse);
        
        // Get access token
        await getGraphAccessToken();
        
        return loginResponse.account;
    } catch (error) {
        console.error("Microsoft login error:", error);
        throw error;
    }
}

// Get access token for Microsoft Graph API
async function getGraphAccessToken() {
    try {
        const account = msalInstance.getAllAccounts()[0];
        
        if (!account) {
            throw new Error("No account found. Please sign in first.");
        }

        const tokenRequest = {
            scopes: loginRequest.scopes,
            account: account
        };

        const response = await msalInstance.acquireTokenSilent(tokenRequest);
        graphAccessToken = response.accessToken;
        
        return graphAccessToken;
    } catch (error) {
        // If silent token acquisition fails, try interactive
        if (error instanceof msal.InteractionRequiredAuthError) {
            const response = await msalInstance.acquireTokenPopup(tokenRequest);
            graphAccessToken = response.accessToken;
            return graphAccessToken;
        }
        throw error;
    }
}

// Check if user is signed in to Microsoft
function isMicrosoftSignedIn() {
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0;
}

// Get current Microsoft account
function getCurrentMicrosoftAccount() {
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
}

// Sign out from Microsoft
async function signOutFromMicrosoft() {
    const account = getCurrentMicrosoftAccount();
    if (account) {
        await msalInstance.logoutPopup({
            account: account
        });
    }
}

// Make Microsoft Graph API call
async function callMicrosoftGraph(endpoint, method = 'GET', body = null) {
    try {
        const token = await getGraphAccessToken();
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const options = {
            method: method,
            headers: headers
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error.message || 'Graph API call failed');
        }

        // Handle different response types
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.blob();
    } catch (error) {
        console.error('Microsoft Graph API error:', error);
        throw error;
    }
}

// Initialize on load
if (typeof msal !== 'undefined') {
    initializeMSAL();
}

// Export functions
window.msalInstance = msalInstance;
window.signInToMicrosoft = signInToMicrosoft;
window.signOutFromMicrosoft = signOutFromMicrosoft;
window.isMicrosoftSignedIn = isMicrosoftSignedIn;
window.getCurrentMicrosoftAccount = getCurrentMicrosoftAccount;
window.getGraphAccessToken = getGraphAccessToken;
window.callMicrosoftGraph = callMicrosoftGraph;
window.sharePointConfig = sharePointConfig;
