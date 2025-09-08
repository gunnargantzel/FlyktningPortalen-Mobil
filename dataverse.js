// Dataverse Web API integration for CRUD operations

class DataverseManager {
    constructor() {
        this.baseUrl = CONFIG.dataverse.instanceUrl;
        this.apiVersion = CONFIG.dataverse.apiVersion;
        this.accessToken = null;
    }

    async setAccessToken(token) {
        this.accessToken = token;
    }

    async makeRequest(endpoint, options = {}) {
        // Check if we're in development mode (mock token)
        if (this.accessToken === 'mock-access-token') {
            console.log('Using mock Dataverse response for development');
            return this.getMockResponse(endpoint, options);
        }
        
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        const url = `${this.baseUrl}api/data/v${this.apiVersion}/${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0'
            }
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Dataverse API error:', response.status, errorText);
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            // Handle empty responses (204 No Content)
            if (response.status === 204) {
                return null;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('Dataverse request failed:', error);
            throw error;
        }
    }

    // User Management
    async getUserByEntraId(entraId) {
        const filter = `$filter=new_entra_id eq '${entraId}'`;
        const select = '$select=new_brukerid,new_entra_id,new_navn,new_telefon,new_epost';
        
        const response = await this.makeRequest(`${CONFIG.dataverse.entities.user}?${filter}&${select}`);
        
        if (response && response.value && response.value.length > 0) {
            return response.value[0];
        }
        return null;
    }

    async createUser(userData) {
        const payload = {
            new_entra_id: userData.entraId,
            new_navn: userData.displayName,
            new_telefon: userData.phone || null,
            new_epost: userData.email || null
        };

        const response = await this.makeRequest(CONFIG.dataverse.entities.user, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        return response;
    }

    async updateUser(userId, userData) {
        const payload = {
            new_navn: userData.displayName,
            new_telefon: userData.phone || null,
            new_epost: userData.email || null
        };

        const response = await this.makeRequest(`${CONFIG.dataverse.entities.user}(${userId})`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        return response;
    }

    // Participation Management
    async createParticipation(userId, participationData) {
        const payload = {
            new_bruker: `/new_bruker(${userId})`,
            new_dato: participationData.date || new Date().toISOString(),
            new_status: participationData.status || 'Registrert',
            new_opprettet_av: `/new_bruker(${userId})`
        };

        const response = await this.makeRequest(CONFIG.dataverse.entities.participation, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        return response;
    }

    async getParticipations(userId, limit = 20) {
        const filter = `$filter=new_bruker/new_brukerid eq ${userId}`;
        const select = '$select=new_deltakelseid,new_dato,new_status';
        const orderBy = '$orderby=new_dato desc';
        const top = `$top=${limit}`;
        
        const response = await this.makeRequest(`${CONFIG.dataverse.entities.participation}?${filter}&${select}&${orderBy}&${top}`);
        
        return response ? response.value : [];
    }

    // Absence Management
    async createAbsence(userId, absenceData) {
        const payload = {
            new_bruker: `/new_bruker(${userId})`,
            new_dato: absenceData.date || new Date().toISOString(),
            new_type: absenceData.type,
            new_beskrivelse: absenceData.description || null,
            new_status: absenceData.status || 'Registrert',
            new_opprettet_av: `/new_bruker(${userId})`
        };

        const response = await this.makeRequest(CONFIG.dataverse.entities.absence, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        return response;
    }

    async getAbsences(userId, limit = 20) {
        const filter = `$filter=new_bruker/new_brukerid eq ${userId}`;
        const select = '$select=new_fraværid,new_dato,new_type,new_beskrivelse,new_status';
        const orderBy = '$orderby=new_dato desc';
        const top = `$top=${limit}`;
        
        const response = await this.makeRequest(`${CONFIG.dataverse.entities.absence}?${filter}&${select}&${orderBy}&${top}`);
        
        return response ? response.value : [];
    }

    async updateAbsence(absenceId, absenceData) {
        const payload = {
            new_type: absenceData.type,
            new_beskrivelse: absenceData.description || null,
            new_status: absenceData.status
        };

        const response = await this.makeRequest(`${CONFIG.dataverse.entities.absence}(${absenceId})`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        return response;
    }

    async deleteAbsence(absenceId) {
        const response = await this.makeRequest(`${CONFIG.dataverse.entities.absence}(${absenceId})`, {
            method: 'DELETE'
        });

        return response;
    }

    // Combined Data Methods
    async getUserActivity(userId, limit = 50) {
        try {
            // Get both participations and absences
            const [participations, absences] = await Promise.all([
                this.getParticipations(userId, limit),
                this.getAbsences(userId, limit)
            ]);

            // Combine and sort by date
            const activities = [
                ...participations.map(p => ({ ...p, type: 'participation' })),
                ...absences.map(a => ({ ...a, type: 'absence' }))
            ].sort((a, b) => new Date(b.new_dato) - new Date(a.new_dato));

            return activities.slice(0, limit);
        } catch (error) {
            console.error('Failed to get user activity:', error);
            throw error;
        }
    }

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('no-NO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('no-NO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Mock responses for development
    getMockResponse(endpoint, options) {
        console.log(`Mock response for ${endpoint}`, options);
        
        // Simulate delay
        return new Promise((resolve) => {
            setTimeout(() => {
                if (endpoint.includes('new_bruker') && options.method === 'GET') {
                    // Mock user lookup
                    resolve({
                        value: [{
                            new_brukerid: 'mock-user-123',
                            new_entra_id: 'dev-user-123',
                            new_navn: 'Development User',
                            new_telefon: '+47 123 45 678',
                            new_epost: 'dev@example.com'
                        }]
                    });
                } else if (endpoint.includes('new_deltakelse') && options.method === 'POST') {
                    // Mock participation creation
                    resolve({
                        new_deltakelseid: 'mock-participation-123',
                        new_dato: new Date().toISOString(),
                        new_status: 'Registrert'
                    });
                } else if (endpoint.includes('new_fravær') && options.method === 'POST') {
                    // Mock absence creation
                    resolve({
                        new_fraværid: 'mock-absence-123',
                        new_dato: new Date().toISOString(),
                        new_type: 'Syk',
                        new_status: 'Registrert'
                    });
                } else if (endpoint.includes('new_fravær') && options.method === 'GET') {
                    // Mock absence list
                    resolve({
                        value: [
                            {
                                new_fraværid: 'mock-absence-1',
                                new_dato: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                                new_type: 'Syk',
                                new_beskrivelse: 'Hodepine',
                                new_status: 'Registrert'
                            },
                            {
                                new_fraværid: 'mock-absence-2',
                                new_dato: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                                new_type: 'Permisjon',
                                new_beskrivelse: 'Legen',
                                new_status: 'Godkjent'
                            }
                        ]
                    });
                } else {
                    resolve({ value: [] });
                }
            }, 500); // Simulate network delay
        });
    }

    // Error Handling
    handleError(error) {
        console.error('Dataverse error:', error);
        
        if (error.message.includes('401')) {
            throw new Error('Autentisering feilet. Vennligst logg inn på nytt.');
        } else if (error.message.includes('403')) {
            throw new Error('Du har ikke tilgang til denne funksjonen.');
        } else if (error.message.includes('404')) {
            throw new Error('Data ikke funnet.');
        } else if (error.message.includes('500')) {
            throw new Error('Serverfeil. Prøv igjen senere.');
        } else {
            throw new Error(CONFIG.messages.errors.dataverseError);
        }
    }
}

// Create global instance
const dataverseManager = new DataverseManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataverseManager;
} else {
    window.dataverseManager = dataverseManager;
}
