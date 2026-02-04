# 🧪 Test Onboarding Flow

## Scenario 1: Nieuwe gebruiker - Account aanmaken

### Stap 1: Start als nieuwe gebruiker
Stuur een willekeurig bericht naar: **+1 415 523 8886**
Bijvoorbeeld: `hoi`

**Verwacht antwoord:**
```
👋 Welkom bij Mantelzorgmaatje!

Heb je al een account?

1️⃣ Ja, ik heb al een account
2️⃣ Nee, ik wil een account aanmaken

💬 Typ 1 of 2
```

### Stap 2: Kies "Nieuw account"
Stuur: `2`

**Verwacht antwoord:**
```
✅ Welkom! Laten we je account aanmaken.

👤 Wat is je naam?
```

### Stap 3: Geef je naam
Stuur bijvoorbeeld: `Jan Tester`

**Verwacht antwoord:**
```
📧 Wat is je email adres?
```

### Stap 4: Geef je email
Stuur bijvoorbeeld: `jan.tester@test.nl`

**Verwacht antwoord:**
```
🔒 Kies een wachtwoord (minimaal 6 tekens):
```

### Stap 5: Kies wachtwoord
Stuur bijvoorbeeld: `test1234`

**Verwacht antwoord:**
```
🎉 Account aangemaakt!

Welkom Jan Tester!

📋 *MENU* - Typ een nummer:

1️⃣ Mantelzorg Balanstest 📊
2️⃣ Mijn taken voor vandaag
3️⃣ Hulp in de buurt 🗺️
4️⃣ Mijn dashboard
5️⃣ Persoonlijk contact 💬

💬 Typ het nummer!
```

---

## Scenario 2: Bestaande gebruiker - Inloggen

### Stap 1: Start opnieuw (met nieuw telefoonnummer)
Stuur een willekeurig bericht vanaf een ander nummer

**Verwacht antwoord:**
```
👋 Welkom bij Mantelzorgmaatje!

Heb je al een account?

1️⃣ Ja, ik heb al een account
2️⃣ Nee, ik wil een account aanmaken

💬 Typ 1 of 2
```

### Stap 2: Kies "Ik heb al een account"
Stuur: `1`

**Verwacht antwoord:**
```
✅ Prima! Laten we inloggen.

📧 Wat is je email adres?
```

### Stap 3: Geef bestaand email
Stuur: `test@mantelzorg.nl`

**Verwacht antwoord:**
```
🔒 Wat is je wachtwoord?
```

### Stap 4: Geef wachtwoord
Stuur: `test1234`

**Verwacht antwoord:**
```
✅ Welkom terug Test Gebruiker!

📋 *MENU* - Typ een nummer:

1️⃣ Mantelzorg Balanstest 📊
2️⃣ Mijn taken voor vandaag
3️⃣ Hulp in de buurt 🗺️
4️⃣ Mijn dashboard
5️⃣ Persoonlijk contact 💬

💬 Typ het nummer!
```

---

## Scenario 3: Foutieve invoer

### Test: Ongeldig email formaat
Bij stap 4 van account aanmaken, stuur: `jan.test`

**Verwacht antwoord:**
```
❌ Dat is geen geldig email adres.

📧 Probeer opnieuw:
```

### Test: Wachtwoord te kort
Bij stap 5 van account aanmaken, stuur: `test`

**Verwacht antwoord:**
```
❌ Wachtwoord moet minimaal 6 tekens zijn.

🔒 Probeer opnieuw:
```

### Test: Onjuist wachtwoord bij login
Bij login stap 4, stuur onjuist wachtwoord

**Verwacht antwoord:**
```
❌ Onjuist wachtwoord.

Probeer opnieuw met een willekeurig bericht.
```

---

## ✅ Checklist

- [ ] Nieuwe gebruiker kan account aanmaken via WhatsApp
- [ ] Account wordt automatisch gekoppeld aan telefoonnummer
- [ ] Na registratie wordt direct het menu getoond
- [ ] Bestaande gebruiker kan inloggen via WhatsApp
- [ ] Telefoonnummer wordt gekoppeld aan bestaand account
- [ ] Na login wordt direct het menu getoond
- [ ] Email validatie werkt correct
- [ ] Wachtwoord minimale lengte check werkt
- [ ] Foutmelding bij onjuist wachtwoord
- [ ] Gebruiker kan menu gebruiken na succesvolle onboarding
