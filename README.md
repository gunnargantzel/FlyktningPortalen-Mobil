# Flyktning Fravær Registrering PWA

En Progressive Web App (PWA) for flyktninger til å registrere deltakelse og fravær.

## Funksjoner

- **Registrer deltakelse**: Brukere kan registrere sin tilstedeværelse
- **Registrer fravær**: Brukere kan rapportere fravær med årsak
- **Se fravær oversikt**: Brukere kan se historikk over sitt fravær
- **Offline støtte**: Fungerer selv uten internettforbindelse
- **Installerbar**: Kan installeres som en app på mobil/desktop

## Autentisering

- Entra ID autentisering mot tenant: `fb7e0b12-d8fc-4f14-bd1a-ad9c8667a7e6`

## Dataverse Integrasjon

- **Instance URL**: https://smittevaksine2022utvikling.crm4.dynamics.com/
- **Environment ID**: 43a8a53e-4c71-e32a-b1f1-4b37a215c056

## Teknisk Stack

- HTML5, CSS3, JavaScript (ES6+)
- Microsoft Authentication Library (MSAL)
- Dataverse Web API
- Service Worker (PWA)
- Responsive Design

## Installasjon

1. Deploy filene til en web server
2. Konfigurer Entra ID app registrering
3. Sette opp Dataverse API tilkobling
4. Teste PWA funksjonalitet

## Bruk

Appen er designet for flyktninger og støtter norsk språk. Brukere logger seg inn med Entra ID og kan enkelt registrere deltakelse/fravær gjennom en intuitiv mobilgrensesnitt. Appen kan installeres på enheten for rask tilgang.
