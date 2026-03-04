# API Licencji - Dokumentacja

Serwer licencji uruchamia się automatycznie z aplikacją Electron na porcie **5000**.

## Endpointy API

### 1. GET /license

Zwraca informacje o aktualnej licencji.

**Odpowiedź sukcesu (200):**

```json
{
  "licenseType": "BASIC", // lub "GOLD"
  "maxBrowsers": 2, // 2 dla BASIC, 4 dla GOLD
  "isActive": true,
  "expiresAt": "2027-03-04T12:00:00.000Z",
  "activatedAt": "2026-03-04T12:00:00.000Z",
  "currentBrowsers": 1, // Liczba aktualnie aktywnych przeglądarek
  "availableSlots": 1 // Dostępne sloty (maxBrowsers - currentBrowsers)
}
```

**Odpowiedź błędu (403):**

```json
{
  "error": "Brak aktywnej licencji",
  "isActive": false
}
```

### 2. POST /browser/register

Rejestruje nową przeglądarkę w systemie.

**Request body:**

```json
{
  "browserId": "unique-browser-id-12345"
}
```

**Odpowiedź sukcesu (200):**

```json
{
  "success": true,
  "currentBrowsers": 2,
  "availableSlots": 0
}
```

**Błąd - przekroczono limit (403):**

```json
{
  "error": "Przekroczono limit przeglądarek",
  "maxBrowsers": 2,
  "currentBrowsers": 2
}
```

### 3. POST /browser/unregister

Wyrejestrowuje przeglądarkę z systemu.

**Request body:**

```json
{
  "browserId": "unique-browser-id-12345"
}
```

**Odpowiedź sukcesu (200):**

```json
{
  "success": true,
  "currentBrowsers": 1
}
```

### 4. GET /health

Sprawdza czy serwer działa.

**Odpowiedź (200):**

```json
{
  "status": "OK",
  "timestamp": "2026-03-04T12:00:00.000Z"
}
```

## Typy licencji

### BASIC

- **Prefix klucza:** `B***-****-****-****`
- **Maksymalna liczba przeglądarek:** 2
- **Przykładowy klucz:** `BXYZ-1234-ABCD-5678`

### GOLD

- **Prefix klucza:** `G***-****-****-****`
- **Maksymalna liczba przeglądarek:** 4
- **Przykładowy klucz:** `GXYZ-1234-ABCD-5678`

## Przykłady użycia

### JavaScript/Fetch

```javascript
// Sprawdzenie licencji
async function checkLicense() {
  try {
    const response = await fetch("http://localhost:5000/license");
    const data = await response.json();

    if (data.isActive) {
      console.log(`Licencja: ${data.licenseType}`);
      console.log(
        `Dostępne przeglądarki: ${data.availableSlots}/${data.maxBrowsers}`,
      );
    } else {
      console.log("Brak aktywnej licencji");
    }
  } catch (error) {
    console.error("Błąd połączenia z API:", error);
  }
}

// Rejestracja przeglądarki
async function registerBrowser(browserId) {
  try {
    const response = await fetch("http://localhost:5000/browser/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ browserId }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Przeglądarka zarejestrowana");
    } else {
      console.error("Błąd:", data.error);
    }
  } catch (error) {
    console.error("Błąd połączenia:", error);
  }
}

// Wyrejestrowanie przeglądarki
async function unregisterBrowser(browserId) {
  await fetch("http://localhost:5000/browser/unregister", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ browserId }),
  });
}
```

### cURL

```bash
# Sprawdzenie licencji
curl http://localhost:5000/license

# Rejestracja przeglądarki
curl -X POST http://localhost:5000/browser/register \
  -H "Content-Type: application/json" \
  -d '{"browserId": "browser-1"}'

# Wyrejestrowanie przeglądarki
curl -X POST http://localhost:5000/browser/unregister \
  -H "Content-Type: application/json" \
  -d '{"browserId": "browser-1"}'

# Health check
curl http://localhost:5000/health
```

## Integracja z rozszerzeniem Chrome

Przykład użycia w rozszerzeniu Chrome:

```javascript
// content.js lub background.js
async function initializeBrowser() {
  const browserId = await getBrowserId();

  // Sprawdź licencję
  const licenseInfo = await fetch("http://localhost:5000/license").then((r) =>
    r.json(),
  );

  if (!licenseInfo.isActive) {
    console.error("Brak aktywnej licencji");
    return;
  }

  // Zarejestruj przeglądarkę
  const registerResult = await fetch("http://localhost:5000/browser/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ browserId }),
  }).then((r) => r.json());

  if (!registerResult.success) {
    console.error(
      "Nie można zarejestrować przeglądarki:",
      registerResult.error,
    );
    return;
  }

  console.log("Przeglądarka zarejestrowana pomyślnie");

  // Wyrejestruj przy zamykaniu
  window.addEventListener("beforeunload", () => {
    fetch("http://localhost:5000/browser/unregister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ browserId }),
    });
  });
}

function getBrowserId() {
  // Użyj unikatowego ID dla każdej instancji przeglądarki
  let browserId = localStorage.getItem("browserId");
  if (!browserId) {
    browserId =
      "browser-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("browserId", browserId);
  }
  return browserId;
}

initializeBrowser();
```

## Uruchomienie

Serwer uruchamia się automatycznie wraz z aplikacją Electron. Aby zainstalować wymagane zależności:

```bash
npm install express cors
```

Serwer domyślnie działa na porcie **5000** i jest dostępny na `http://localhost:5000`.
