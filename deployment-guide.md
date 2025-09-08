# Deployment Guide - Flyktning Fravær Registrering PWA

## Forutsetninger

- Web server (Apache, Nginx, eller Node.js)
- Entra ID Administrator tilgang
- Tilgang til Dataverse miljøet: https://smittevaksine2022utvikling.crm4.dynamics.com/
- HTTPS sertifikat for produksjon

## Steg 1: Oppsett av Entra ID App Registration

1. Gå til Azure Portal (portal.azure.com)
2. Naviger til "Azure Active Directory" > "App registrations"
3. Klikk "New registration"
4. Fyll ut:
   - **Name**: Flyktning Fravær Registrering PWA
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Single-page application (SPA) - `https://your-domain.com`
5. Klikk "Register"
6. Noter ned **Application (client) ID** og **Directory (tenant) ID**

### Konfigurer API Permissions

1. Gå til "API permissions" i app registreringen
2. Klikk "Add a permission"
3. Velg "Microsoft Graph" > "Delegated permissions"
4. Legg til:
   - `User.Read`
   - `User.ReadBasic.All`
5. Klikk "Add permissions"
6. Klikk "Grant admin consent"

### Konfigurer Authentication

1. Gå til "Authentication"
2. Under "Single-page application":
   - Legg til redirect URI: `https://your-domain.com`
   - Legg til logout URL: `https://your-domain.com`
3. Under "Implicit grant and hybrid flows":
   - ✅ Access tokens
   - ✅ ID tokens
4. Klikk "Save"

## Steg 2: Oppsett av Dataverse

### Opprett Custom Entities

1. Gå til Power Apps (make.powerapps.com)
2. Velg miljøet: https://smittevaksine2022utvikling.crm4.dynamics.com/
3. Gå til "Data" > "Tables"
4. Opprett følgende tabeller basert på `dataverse-schema.json`:

#### new_bruker Table
```
- new_brukerid (Primary Key)
- new_entra_id (Single line of text, Required)
- new_navn (Single line of text, Required)
- new_telefon (Single line of text)
- new_epost (Single line of text)
- new_opprettet (Date and time, Default: Now())
```

#### new_deltakelse Table
```
- new_deltakelseid (Primary Key)
- new_bruker (Lookup to new_bruker, Required)
- new_dato (Date and time, Required)
- new_status (Choice: Registrert, Bekreftet)
- new_opprettet_av (Lookup to new_bruker)
```

#### new_fravær Table
```
- new_fraværid (Primary Key)
- new_bruker (Lookup to new_bruker, Required)
- new_dato (Date and time, Required)
- new_type (Choice: Syk, Permisjon, Annet)
- new_beskrivelse (Multiple lines of text)
- new_status (Choice: Registrert, Godkjent, Avvist, Default: Registrert)
- new_opprettet_av (Lookup to new_bruker)
```

### Konfigurer Sikkerhet

1. Gå til "Settings" > "Security"
2. Opprett sikkerhetsroller:
   - **Flyktning**: Kan lese/skrive egne records
   - **Administrator**: Full tilgang til alle records
3. Tilordne brukere til roller

## Steg 3: Konfigurer PWA

### Oppdater config.js

1. Åpne `config.js`
2. Erstatt `YOUR_CLIENT_ID` med din Entra ID Application (client) ID
3. Verifiser at Dataverse URL og Environment ID er korrekt

### Opprett Icons

1. Opprett `icons/` mappe
2. Generer PWA ikoner i følgende størrelser:
   - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
3. Plasser ikonene i `icons/` mappen

### Test Lokalt

1. Installer Node.js og npm
2. Kjør: `npm install`
3. Kjør: `npm run dev`
4. Åpne http://localhost:8080 i nettleseren
5. Test alle funksjoner

## Steg 4: Deploy til Produksjon

### Web Server Setup

#### Apache
```apache
# .htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# PWA headers
<Files "manifest.json">
    Header set Content-Type "application/manifest+json"
</Files>

<Files "sw.js">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Service-Worker-Allowed "/"
</Files>
```

#### Nginx
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    root /var/www/fravær-app;
    index index.html;
    
    # PWA support
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /manifest.json {
        add_header Content-Type application/manifest+json;
    }
    
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Service-Worker-Allowed "/";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://smittevaksine2022utvikling.crm4.dynamics.com; script-src 'self' 'unsafe-inline' https://alcdn.msauth.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://smittevaksine2022utvikling.crm4.dynamics.com;" always;
}
```

### HTTPS Sertifikat

1. Få SSL sertifikat (Let's Encrypt, eller kjøpt sertifikat)
2. Konfigurer web serveren til å bruke HTTPS
3. Sett opp automatisk redirect fra HTTP til HTTPS

## Steg 5: Testing

### Funksjonell Testing

1. **Autentisering**:
   - Test innlogging med Entra ID
   - Test utlogging
   - Test token refresh

2. **Deltakelse Registrering**:
   - Registrer deltakelse
   - Verifiser at data lagres i Dataverse
   - Test offline funksjonalitet

3. **Fravær Registrering**:
   - Registrer fravær med forskjellige typer
   - Test validering
   - Test offline lagring

4. **Fravær Oversikt**:
   - Vis fravær liste
   - Test sortering og filtrering
   - Test offline visning

### PWA Testing

1. **Installation**:
   - Test PWA installasjon på mobil
   - Test PWA installasjon på desktop
   - Verifiser at app vises i app drawer

2. **Offline Funksjonalitet**:
   - Test offline registrering
   - Test offline visning
   - Test synkronisering når online

3. **Performance**:
   - Test loading tid
   - Test cache funksjonalitet
   - Test service worker

### Sikkerhet Testing

1. **Autentisering**:
   - Test med ugyldig token
   - Test token utløp
   - Test tilgang uten autentisering

2. **Dataverse**:
   - Test med ugyldig tilgang
   - Test data validering
   - Test SQL injection beskyttelse

## Steg 6: Overvåking og Vedlikehold

### Logging

1. Sett opp logging for:
   - Autentisering hendelser
   - Dataverse API kall
   - Feil og unntak
   - Bruker aktivitet

2. Bruk verktøy som:
   - Application Insights
   - Azure Monitor
   - Custom logging løsning

### Performance Overvåking

1. Overvåk:
   - Side loading tid
   - API response tid
   - Cache hit rate
   - Offline queue størrelse

### Sikkerhet

1. Regelmessig:
   - Sjekk for sikkerhetshull
   - Oppdater avhengigheter
   - Gjennomgå tilgangsrettigheter
   - Test backup og gjenoppretting

## Feilsøking

### Vanlige Problemer

1. **CORS Feil**:
   - Kontroller Dataverse CORS innstillinger
   - Verifiser at domene er tillatt

2. **Autentisering Feil**:
   - Kontroller Entra ID konfigurasjon
   - Verifiser redirect URIs
   - Sjekk API permissions

3. **Service Worker Feil**:
   - Kontroller at sw.js er tilgjengelig
   - Verifiser cache strategier
   - Sjekk browser console for feil

4. **Offline Feil**:
   - Kontroller localStorage tilgang
   - Verifiser offline queue funksjonalitet
   - Test synkronisering

### Debug Verktøy

1. **Browser Developer Tools**:
   - Console for JavaScript feil
   - Network tab for API kall
   - Application tab for PWA info

2. **PWA Testing**:
   - Chrome DevTools > Lighthouse
   - PWA Builder (pwabuilder.com)
   - Web App Manifest Validator

## Support og Vedlikehold

### Dokumentasjon
- Vedlikehold oppdatert dokumentasjon
- Dokumenter alle endringer
- Lag brukerguider

### Backup
- Regelmessig backup av kode
- Backup av Dataverse data
- Test gjenopprettingsprosedyrer

### Oppdateringer
- Planlegg regelmessige oppdateringer
- Test oppdateringer i staging miljø
- Kommuniser endringer til brukere
