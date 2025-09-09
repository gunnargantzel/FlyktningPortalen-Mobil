// Configuration for the Fravær Registrering PWA

const CONFIG = {
    // Entra ID Configuration
    auth: {
        clientId: 'c25b351f-417b-46cf-b736-2970d45273fc', // Entra ID app client ID
        authority: 'https://login.microsoftonline.com/fb7e0b12-d8fc-4f14-bd1a-ad9c8667a7e6',
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        scopes: [
            'User.Read',
            'User.ReadBasic.All'
        ]
    },

    // Dataverse Configuration
    dataverse: {
        instanceUrl: 'https://smittevaksine2022utvikling.crm4.dynamics.com/',
        environmentId: '43a8a53e-4c71-e32a-b1f1-4b37a215c056',
        apiVersion: '9.2',
        entities: {
            user: 'socio_bruker',
            attendance: 'socio_deltakelse'
        }
    },

    // App Configuration
    app: {
        name: 'Fravær Registrering',
        version: '1.0.0',
        language: 'no',
        timezone: 'Europe/Oslo',
        dateFormat: 'dd.mm.yyyy',
        timeFormat: 'HH:mm'
    },

    // UI Configuration
    ui: {
        theme: 'light', // 'light' or 'dark'
        primaryColor: '#0078d4',
        successColor: '#107c10',
        errorColor: '#d13438',
        warningColor: '#ff8c00',
        animationDuration: 300,
        notificationDuration: 5000
    },

    // Offline Configuration
    offline: {
        enabled: true,
        cacheName: 'fravær-app-cache-v1',
        maxCacheSize: 50 * 1024 * 1024, // 50MB
        cacheStrategies: {
            images: 'cacheFirst',
            api: 'networkFirst',
            static: 'cacheFirst'
        }
    },

    // Feature Flags
    features: {
        offlineMode: true,
        pushNotifications: false,
        biometricAuth: false,
        darkMode: true,
        accessibility: true
    },

    // API Endpoints
    endpoints: {
        dataverse: {
            base: 'https://smittevaksine2022utvikling.crm4.dynamics.com/api/data/v9.2/',
            user: 'socio_bruker',
            attendance: 'socio_deltakelse'
        }
    },

    // Validation Rules
    validation: {
        attendanceDescription: {
            maxLength: 1000,
            required: false
        },
        attendanceTypes: ['Tilstede', 'Fravær', 'Deltakelse', 'Permisjon', 'Syk'],
        attendanceStatuses: ['Registrert', 'Godkjent', 'Avslått']
    },

    // Form Schemas
    schemas: {
        attendance: {
            fields: [
                {
                    name: 'socio_id',
                    type: 'text',
                    label: 'ID',
                    required: true,
                    placeholder: 'Automatisk generert'
                },
                {
                    name: 'socio_bruker',
                    type: 'lookup',
                    label: 'Bruker',
                    required: true,
                    entity: 'socio_bruker'
                },
                {
                    name: 'socio_deltakelse_fra',
                    type: 'date',
                    label: 'Fra dato',
                    required: true
                },
                {
                    name: 'socio_deltakelse_til',
                    type: 'date',
                    label: 'Til dato',
                    required: true
                },
                {
                    name: 'socio_type',
                    type: 'optionset',
                    label: 'Type',
                    required: true,
                    options: [
                        { value: 1, label: 'Tilstede' },
                        { value: 2, label: 'Fravær' },
                        { value: 3, label: 'Deltakelse' },
                        { value: 4, label: 'Permisjon' },
                        { value: 5, label: 'Syk' }
                    ]
                },
                {
                    name: 'socio_status',
                    type: 'optionset',
                    label: 'Status',
                    required: true,
                    options: [
                        { value: 1, label: 'Registrert' },
                        { value: 2, label: 'Godkjent' },
                        { value: 3, label: 'Avslått' }
                    ]
                },
                {
                    name: 'socio_beskrivelse',
                    type: 'textarea',
                    label: 'Beskrivelse',
                    required: false,
                    placeholder: 'Beskriv deltagelsen...',
                    maxLength: 1000
                },
                {
                    name: 'socio_varighet',
                    type: 'number',
                    label: 'Varighet (timer)',
                    required: false,
                    min: 0,
                    max: 24,
                    step: 0.5
                }
            ]
        }
    },

    // Error Messages (Norwegian)
    messages: {
        errors: {
            networkError: 'Nettverksfeil. Sjekk internettforbindelsen din.',
            authError: 'Autentiseringsfeil. Prøv å logge inn på nytt.',
            dataverseError: 'Feil ved tilkobling til databasen.',
            validationError: 'Vennligst fyll ut alle påkrevde felt.',
            unknownError: 'En ukjent feil oppstod. Prøv igjen senere.'
        },
        success: {
            attendanceRegistered: 'Deltagelse registrert!',
            attendanceUpdated: 'Deltagelse oppdatert!',
            attendanceDeleted: 'Deltagelse slettet!',
            loginSuccess: 'Innlogging vellykket!',
            logoutSuccess: 'Utlogging vellykket!'
        },
        info: {
            offlineMode: 'Du er i offline-modus. Endringer vil synkroniseres når du får tilbake internettforbindelse.',
            loading: 'Laster...',
            noData: 'Ingen data funnet.'
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
