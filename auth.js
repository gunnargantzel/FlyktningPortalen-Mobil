// Microsoft Authentication Library (MSAL) integration for Entra ID
// Version: 1.0.0-debug
// Git Commit: bbb93d1

class AuthManager {
    constructor() {
        this.msalInstance = null;
        this.currentUser = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('AuthManager: Starting initialization...');
            
            // Check if MSAL is available
            if (typeof msal === 'undefined') {
                console.error('MSAL library not loaded');
                throw new Error('MSAL library not loaded');
            }
            console.log('MSAL library is available');
            
            // Initialize MSAL instance
            console.log('Creating MSAL instance...');
            this.msalInstance = new msal.PublicClientApplication({
                auth: CONFIG.auth,
                cache: {
                    cacheLocation: 'localStorage',
                    storeAuthStateInCookie: false
                },
                system: {
                    loggerOptions: {
                        loggerCallback: (level, message, containsPii) => {
                            if (containsPii) return;
                            console.log(`[MSAL ${level}]: ${message}`);
                        },
                        piiLoggingEnabled: false,
                        logLevel: msal.LogLevel.Info
                    }
                }
            });
            console.log('MSAL instance created');

            // Handle redirect promise
            console.log('Handling redirect promise...');
            await this.msalInstance.handleRedirectPromise();
            console.log('Redirect promise handled');
            
            // Check if user is already logged in
            console.log('Checking for existing accounts...');
            const accounts = this.msalInstance.getAllAccounts();
            console.log('Found accounts:', accounts.length);
            if (accounts.length > 0) {
                this.currentUser = accounts[0];
                console.log('User already logged in:', this.currentUser.username);
            }

            this.isInitialized = true;
            console.log('AuthManager initialization completed');
            return true;
        } catch (error) {
            console.error('Failed to initialize MSAL:', error);
            this.showError(CONFIG.messages.errors.authError);
            return false;
        }
    }

    async login() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const loginRequest = {
                scopes: CONFIG.auth.scopes,
                prompt: 'select_account'
            };

            const response = await this.msalInstance.loginPopup(loginRequest);
            this.currentUser = response.account;
            
            console.log('Login successful:', this.currentUser.username);
            this.showSuccess(CONFIG.messages.success.loginSuccess);
            
            return this.currentUser;
        } catch (error) {
            console.error('Login failed:', error);
            
            if (error.errorCode === 'user_cancelled') {
                console.log('User cancelled login');
                return null;
            }
            
            this.showError(CONFIG.messages.errors.authError);
            throw error;
        }
    }

    async logout() {
        if (!this.isInitialized || !this.currentUser) {
            return;
        }

        try {
            const logoutRequest = {
                account: this.currentUser,
                postLogoutRedirectUri: CONFIG.auth.postLogoutRedirectUri
            };

            await this.msalInstance.logoutPopup(logoutRequest);
            this.currentUser = null;
            
            console.log('Logout successful');
            this.showSuccess(CONFIG.messages.success.logoutSuccess);
            
            return true;
        } catch (error) {
            console.error('Logout failed:', error);
            this.showError('Feil ved utlogging');
            throw error;
        }
    }

    async getAccessToken() {
        if (!this.isInitialized || !this.currentUser) {
            throw new Error('User not authenticated');
        }

        try {
            const tokenRequest = {
                scopes: CONFIG.auth.scopes,
                account: this.currentUser
            };

            const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
            return response.accessToken;
        } catch (error) {
            console.error('Failed to acquire token silently:', error);
            
            // Try interactive token acquisition
            try {
                const tokenRequest = {
                    scopes: CONFIG.auth.scopes,
                    account: this.currentUser,
                    prompt: 'select_account'
                };

                const response = await this.msalInstance.acquireTokenPopup(tokenRequest);
                return response.accessToken;
            } catch (interactiveError) {
                console.error('Interactive token acquisition failed:', interactiveError);
                throw interactiveError;
            }
        }
    }

    async getUserInfo() {
        if (!this.currentUser) {
            return null;
        }

        try {
            const token = await this.getAccessToken();
            
            // Check if we're in development mode
            if (token === 'mock-access-token') {
                console.log('Using mock user info for development');
                return {
                    id: 'dev-user-123',
                    displayName: 'Development User',
                    email: 'dev@example.com',
                    givenName: 'Development',
                    surname: 'User'
                };
            }
            
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const userInfo = await response.json();
            return {
                id: userInfo.id,
                displayName: userInfo.displayName,
                email: userInfo.mail || userInfo.userPrincipalName,
                givenName: userInfo.givenName,
                surname: userInfo.surname
            };
        } catch (error) {
            console.error('Failed to get user info:', error);
            throw error;
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Helper methods for notifications
    showSuccess(message) {
        if (window.showNotification) {
            window.showNotification(message, 'success');
        }
    }

    showError(message) {
        if (window.showNotification) {
            window.showNotification(message, 'error');
        }
    }
}

// Create global instance
const authManager = new AuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} else {
    window.authManager = authManager;
}
