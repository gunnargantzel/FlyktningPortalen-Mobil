// Main application logic for the Fravær Registrering PWA
// Version: 1.0.0-debug
// Git Commit: bbb93d1

class FraværApp {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        
        // Version information
        this.version = '1.0.0-debug';
        this.gitCommit = 'bbb93d1';
        
        // Don't call initializeApp in constructor - it will be called manually
        console.log('🚀 FraværApp constructor completed');
        console.log('📱 App Version:', this.version);
        console.log('🔧 Git Commit:', this.gitCommit);
    }

    async initializeApp() {
        try {
            console.log('=== STARTING APP INITIALIZATION ===');
            
            // Show loading screen
            this.showScreen('loading-screen');
            console.log('✓ Loading screen shown');
            
            // Initialize authentication
            console.log('→ Initializing authentication...');
            const authResult = await authManager.initialize();
            console.log('✓ Authentication initialized, result:', authResult);
            
            // Check if user is already authenticated
            const isAuth = authManager.isAuthenticated();
            console.log('→ Checking authentication status:', isAuth);
            
            if (isAuth) {
                console.log('→ User is authenticated, handling authenticated user...');
                await this.handleAuthenticatedUser();
            } else {
                console.log('→ User not authenticated, showing login screen...');
                this.showScreen('login-screen');
            }
            
            // Set up event listeners
            console.log('→ Setting up event listeners...');
            this.setupEventListeners();
            console.log('✓ Event listeners set up');
            
            // Set up offline handling
            console.log('→ Setting up offline handling...');
            this.setupOfflineHandling();
            console.log('✓ Offline handling set up');
            
            // Set up service worker
            console.log('→ Setting up service worker...');
            this.setupServiceWorker();
            console.log('✓ Service worker set up');
            
            console.log('=== APP INITIALIZATION COMPLETED SUCCESSFULLY ===');
            
        } catch (error) {
            console.error('=== APP INITIALIZATION FAILED ===', error);
            this.showError('Feil ved oppstart av appen: ' + error.message);
            this.showScreen('login-screen');
        }
    }

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Participation registration
        const participationBtn = document.getElementById('register-participation-btn');
        if (participationBtn) {
            participationBtn.addEventListener('click', () => this.registerParticipation());
        }

        // Absence registration
        const absenceBtn = document.getElementById('register-absence-btn');
        if (absenceBtn) {
            absenceBtn.addEventListener('click', () => this.registerAbsence());
        }

        // Online/offline status
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    setupOfflineHandling() {
        // Store offline actions in localStorage
        this.offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    async handleLogin() {
        try {
            this.showLoading('Logger inn...');
            
            const user = await authManager.login();
            if (user) {
                await this.handleAuthenticatedUser();
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showError('Innlogging feilet. Prøv igjen.');
        } finally {
            this.hideLoading();
        }
    }

    async handleLogout() {
        try {
            await authManager.logout();
            this.currentUser = null;
            this.userData = null;
            this.showScreen('login-screen');
        } catch (error) {
            console.error('Logout failed:', error);
            this.showError('Utlogging feilet.');
        }
    }

    async handleAuthenticatedUser() {
        try {
            this.currentUser = authManager.getCurrentUser();
            
            // Get access token for Dataverse
            const token = await authManager.getAccessToken();
            dataverseManager.setAccessToken(token);
            
            // Get user info from Microsoft Graph
            const userInfo = await authManager.getUserInfo();
            
            // Get or create user in Dataverse
            this.userData = await this.getOrCreateUser(userInfo);
            
            // Update UI with user info
            this.updateUserInterface();
            
            // Show main screen
            this.showScreen('main-screen');
            
            // Process offline queue if online
            if (this.isOnline) {
                await this.processOfflineQueue();
            }
            
        } catch (error) {
            console.error('Failed to handle authenticated user:', error);
            this.showError('Feil ved henting av brukerdata');
            this.showScreen('login-screen');
        } finally {
            this.hideLoading();
        }
    }

    async getOrCreateUser(userInfo) {
        try {
            // Try to get existing user
            let user = await dataverseManager.getUserByEntraId(this.currentUser.localAccountId);
            
            if (!user) {
                // Create new user
                const newUser = await dataverseManager.createUser({
                    entraId: this.currentUser.localAccountId,
                    displayName: userInfo.displayName,
                    email: userInfo.email,
                    phone: null
                });
                
                user = await dataverseManager.getUserByEntraId(this.currentUser.localAccountId);
            }
            
            return user;
        } catch (error) {
            console.error('Failed to get or create user:', error);
            throw error;
        }
    }

    updateUserInterface() {
        // Update user name in header
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && this.userData) {
            userNameElement.textContent = this.userData.new_navn || 'Bruker';
        }

        // Update dates in forms
        const today = new Date().toLocaleDateString('no-NO');
        const participationDate = document.getElementById('participation-date');
        const absenceDate = document.getElementById('absence-date');
        
        if (participationDate) participationDate.textContent = today;
        if (absenceDate) absenceDate.textContent = today;
    }

    // Screen Management
    showScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }

    // Participation Registration
    async registerParticipation() {
        if (!this.userData) {
            this.showError('Brukerdata ikke tilgjengelig');
            return;
        }

        try {
            this.showLoading('Registrerer deltakelse...');
            
            const participationData = {
                date: new Date().toISOString(),
                status: 'Registrert'
            };

            if (this.isOnline) {
                await dataverseManager.createParticipation(this.userData.new_brukerid, participationData);
                this.showSuccess(CONFIG.messages.success.participationRegistered);
            } else {
                // Store for offline processing
                this.addToOfflineQueue('participation', participationData);
                this.showSuccess('Deltakelse lagret for synkronisering');
            }
            
        } catch (error) {
            console.error('Failed to register participation:', error);
            this.showError('Feil ved registrering av deltakelse');
        } finally {
            this.hideLoading();
        }
    }

    // Absence Registration
    async registerAbsence() {
        if (!this.userData) {
            this.showError('Brukerdata ikke tilgjengelig');
            return;
        }

        const typeSelect = document.getElementById('absence-type');
        const descriptionTextarea = document.getElementById('absence-description');
        
        if (!typeSelect) {
            this.showError('Type fravær ikke valgt');
            return;
        }

        try {
            this.showLoading('Registrerer fravær...');
            
            const absenceData = {
                date: new Date().toISOString(),
                type: typeSelect.value,
                description: descriptionTextarea.value.trim(),
                status: 'Registrert'
            };

            if (this.isOnline) {
                await dataverseManager.createAbsence(this.userData.new_brukerid, absenceData);
                this.showSuccess(CONFIG.messages.success.absenceRegistered);
                
                // Clear form
                typeSelect.value = 'Syk';
                descriptionTextarea.value = '';
            } else {
                // Store for offline processing
                this.addToOfflineQueue('absence', absenceData);
                this.showSuccess('Fravær lagret for synkronisering');
                
                // Clear form
                typeSelect.value = 'Syk';
                descriptionTextarea.value = '';
            }
            
        } catch (error) {
            console.error('Failed to register absence:', error);
            this.showError('Feil ved registrering av fravær');
        } finally {
            this.hideLoading();
        }
    }

    // Absence Overview
    async showAbsenceOverview() {
        if (!this.userData) {
            this.showError('Brukerdata ikke tilgjengelig');
            return;
        }

        try {
            this.showLoading('Henter fravær oversikt...');
            
            const absences = await dataverseManager.getAbsences(this.userData.new_brukerid);
            this.displayAbsenceList(absences);
            
            this.showScreen('overview-screen');
            
        } catch (error) {
            console.error('Failed to load absence overview:', error);
            this.showError('Feil ved henting av fravær oversikt');
        } finally {
            this.hideLoading();
        }
    }

    displayAbsenceList(absences) {
        const absenceList = document.getElementById('absence-list');
        const noAbsences = document.getElementById('no-absences');
        
        if (!absenceList || !noAbsences) return;

        if (absences.length === 0) {
            absenceList.innerHTML = '';
            noAbsences.classList.remove('hidden');
            return;
        }

        noAbsences.classList.add('hidden');
        
        absenceList.innerHTML = absences.map(absence => `
            <div class="absence-item">
                <div class="absence-item-header">
                    <span class="absence-item-date">${dataverseManager.formatDate(absence.new_dato)}</span>
                    <span class="absence-item-type">${absence.new_type}</span>
                </div>
                ${absence.new_beskrivelse ? `<div class="absence-item-description">${absence.new_beskrivelse}</div>` : ''}
            </div>
        `).join('');
    }

    // Offline Queue Management
    addToOfflineQueue(type, data) {
        const queueItem = {
            id: Date.now(),
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        this.offlineQueue.push(queueItem);
        localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    }

    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        try {
            this.showLoading('Synkroniserer offline endringer...');
            
            for (const item of this.offlineQueue) {
                try {
                    if (item.type === 'participation') {
                        await dataverseManager.createParticipation(this.userData.new_brukerid, item.data);
                    } else if (item.type === 'absence') {
                        await dataverseManager.createAbsence(this.userData.new_brukerid, item.data);
                    }
                } catch (error) {
                    console.error('Failed to sync offline item:', error);
                }
            }
            
            // Clear offline queue
            this.offlineQueue = [];
            localStorage.removeItem('offlineQueue');
            
            this.showSuccess('Offline endringer synkronisert');
            
        } catch (error) {
            console.error('Failed to process offline queue:', error);
            this.showError('Feil ved synkronisering av offline endringer');
        } finally {
            this.hideLoading();
        }
    }

    // Online/Offline Handling
    handleOnline() {
        this.isOnline = true;
        this.showSuccess('Tilkoblet til internett');
        
        // Process offline queue
        if (this.userData) {
            this.processOfflineQueue();
        }
    }

    handleOffline() {
        this.isOnline = false;
        this.showInfo(CONFIG.messages.info.offlineMode);
    }

    // UI Helper Methods
    showLoading(message = 'Laster...') {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const loadingText = loadingScreen.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingScreen.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, CONFIG.ui.notificationDuration);
    }
}

// Global functions for HTML onclick handlers
function showParticipationScreen() {
    app.showScreen('participation-screen');
}

function showAbsenceScreen() {
    app.showScreen('absence-screen');
}

function showAbsenceOverview() {
    app.showAbsenceOverview();
}

function showMainScreen() {
    app.showScreen('main-screen');
}

// Global notification function
window.showNotification = function(message, type = 'info') {
    if (window.app) {
        window.app.showNotification(message, type);
    }
};

// Initialize app when DOM is loaded and MSAL is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM Content Loaded Event Fired ===');
    console.log('CONFIG available:', typeof CONFIG !== 'undefined');
    console.log('authManager available:', typeof authManager !== 'undefined');
    console.log('dataverseManager available:', typeof dataverseManager !== 'undefined');
    
    // Wait for MSAL to be available
    const initApp = () => {
        console.log('Checking for MSAL availability...');
        if (typeof msal !== 'undefined') {
            console.log('MSAL is available, initializing app...');
            try {
                window.app = new FraværApp();
                console.log('App initialized successfully in DOMContentLoaded');
            } catch (error) {
                console.error('Error initializing app in DOMContentLoaded:', error);
            }
        } else {
            console.log('MSAL not available, retrying in 100ms...');
            // Retry after a short delay
            setTimeout(initApp, 100);
        }
    };
    
    initApp();
});

// Handle URL parameters for shortcuts
window.addEventListener('load', () => {
    console.log('=== Window Load Event Fired ===');
    if (!window.app) {
        console.log('App not initialized yet, trying from window load event...');
        if (typeof msal !== 'undefined') {
            try {
                window.app = new FraværApp();
                console.log('App initialized successfully in window load');
            } catch (error) {
                console.error('Error initializing app in window load:', error);
            }
        }
    }
    
    // Handle URL parameters for shortcuts
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action && window.app) {
        switch (action) {
            case 'participation':
                setTimeout(() => showParticipationScreen(), 1000);
                break;
            case 'absence':
                setTimeout(() => showAbsenceScreen(), 1000);
                break;
            case 'overview':
                setTimeout(() => showAbsenceOverview(), 1000);
                break;
        }
    }
});
