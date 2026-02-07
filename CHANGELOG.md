# Changelog

Alle belangrijke wijzigingen aan MantelBuddy worden hier gedocumenteerd.

Het formaat is gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/1.0.0/),
en dit project volgt [Semantic Versioning](https://semver.org/lang/nl/).

## [1.4.0] - 2025-02-07

### Gewijzigd
- **Dashboard score weergave**: Smiley vervangen door numerieke score (bijv. "12/24") in grote gekleurde cirkel
- **Score uitleg**: Toegevoegd bij score ("Score 0-8: Je houdt het goed vol..." etc.)
- **Urgentie sectie**: Bij hoge of gemiddelde belasting verschijnt nu een melding met tips en hulplinks
- **Zorgtaken kleuren**: Taken in hulpvragen pagina tonen nu correct hun moeilijkheidsniveau met kleuren

### Opgelost
- Fix: Zorgtaken telden niet correct omdat WhatsApp test "JA/SOMS/NEE" gebruikt ipv "MOEILIJK/GEMIDDELD/MAKKELIJK"
- Fix: Dashboard toonde 0/0/0 voor taken verdeling
- Fix: Hulpvragen pagina categorieën toonden geen kleur-indicators

### Technisch
- Uniforme moeilijkheid check functies die beide formats ondersteunen (web + WhatsApp)
- Dashboard API, dashboard pagina en hulpvragen pagina bijgewerkt

## [1.3.0] - 2025-02-07

### Toegevoegd
- **Telefoonnummer wijzigen in profiel**: Gebruikers kunnen nu hun 06-nummer aanpassen of ontkoppelen
- **Single-session login**: Bij inloggen op een nieuw apparaat worden andere browser-sessies automatisch uitgelogd
- **Session validatie**: Periodieke check (elke 30 sec + bij tab focus) of sessie nog geldig is
- **Melding bij uitloggen**: Duidelijke melding op login pagina wanneer je door andere sessie bent uitgelogd

### Gewijzigd
- Homepage: Inlogknop verwijderd uit header
- `/mantelzorger` pagina: Redirect nu direct naar `/login`
- Login pagina: Verbeterde tekst en prominente "Account aanmaken" knop
- WhatsApp buttons: Nu altijd als tekst met nummers (Twilio Sandbox ondersteunt geen interactieve buttons)

### Technisch
- Nieuw `sessionVersion` veld in User tabel (Prisma)
- Nieuwe API endpoint `/api/auth/validate-session`
- Nieuwe component `SessionValidator` met `useSessionValidator` hook

## [1.2.0] - 2025-02-07

### Toegevoegd
- WhatsApp sectie in profiel met QR code
- WhatsApp sectie in dashboard met QR code
- Telefoonnummer weergave in profiel

### Opgelost
- Fix: "undefined" bij WhatsApp nummer in profiel wanneer niet gekoppeld
- Fix: Magic link login werkt nu correct (client-side auth ipv server-side)

## [1.1.0] - 2025-02-07

### Toegevoegd
- SVG smileys voor emoticon weergave
- Korte magic links (`/m/[token]`) voor WhatsApp
- WhatsApp buttons met genummerde opties

### Gewijzigd
- Design system verbeteringen

## [1.0.0] - 2025-02-06

### Eerste release
- Balanstest (12 vragen belastbaarheidstest)
- Dashboard met overzicht
- Profiel beheer
- WhatsApp integratie via Twilio
- Magic link authenticatie
- Locatie zoeken via PDOK API
- Check-in functionaliteit
