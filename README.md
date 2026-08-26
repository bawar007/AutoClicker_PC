# AutoClicker Windows

Aplikacja desktopowa na Windows do automatyzacji pracy w wielu kartach przeglądarki. Zawiera Auto Clicker, zarządzanie slotami, profile pracy, system licencji i wbudowane widoki webview.

> Główna, aktualnie rozwijana wersja znajduje się w katalogu `autoclicker_windows_react/`.

## Najważniejsze funkcje

- do czterech niezależnych kart przeglądarki,
- powiększanie kart i szybkie przełączanie między nimi,
- przeciąganie kart w celu zmiany kolejności,
- status połączenia strony oraz status Auto Clickera,
- uruchamianie i zatrzymywanie Auto Clickera dla wielu kart,
- licznik slotów i odliczanie do najbliższego terminu,
- czyszczenie wybranych slotów przy uruchomieniu aplikacji,
- profile pracy z eksportem i importem do JSON,
- motyw jasny, ciemny oraz ustawienia systemowe Windows,
- filtrowanie, wyszukiwanie i eksport logów,
- obsługa aktualizacji przez GitHub Releases,
- system licencji BASIC/GOLD powiązany z Machine ID.

## 📋 Cechy

### ✅ Pełna kontrola nad `event.isTrusted`

- **Override isTrusted**: Wszystkie zdarzenia mogą zgłaszać `isTrusted = true`
- **Symulacja prawdziwych zdarzeń**: Użycie Chrome DevTools Protocol do generowania rzeczywistych kliknięć systemowych
- **Wstrzykiwanie skryptów**: Wykonywanie własnych skryptów JavaScript przed załadowaniem strony

### 🔐 System licencjonowania

- Klucz licencyjny powiązany z Hardware ID (Machine ID)
- Szyfrowanie lokalne licencji
- Okres ważności (domyślnie 1 rok)
- Brak wymagania połączenia z internetem po aktywacji
- **Dwa typy licencji:**
  - **BASIC** (`B***-****-****-****`) - max 2 przeglądarki
  - **GOLD** (`G***-****-****-****`) - max 4 przeglądarki

### 🌐 API Licencji (localhost:5000)

- REST API do sprawdzania statusu licencji
- Zarządzanie rejestracją przeglądarek
- Endpoint `/license` zwraca informacje o typie licencji i dostępnych slotach
- Endpoint `/browser/register` do rejestracji nowych przeglądarek
- Automatyczne sprawdzanie limitów przeglądarek
- Zobacz [LICENSE_API.md](LICENSE_API.md) dla pełnej dokumentacji

### 🔌 Integracja z wtyczką Chrome

- Automatyczne ładowanie Twojej wtyczki AutoClicker
- Pełna funkcjonalność wtyczki wewnątrz aplikacji
- Synchronizacja z Chrome Extensions API

### 🎯 Funkcje testowe

- **Panel kontrolny** z przełącznikami i narzędziami
- **WebView** z dostępem do DevTools
- **Recording/Playback** scenariuszy testowych
- **Export/Import** scenariuszy do plików JSON
- **Logi w czasie rzeczywistym**

## 🛠️ Instalacja

### Wymagania

- Node.js >= 16.x
- npm lub yarn
- Windows 10/11

### Kroki instalacji

1. **Instalacja zależności**

```powershell
Set-Location ".\autoclicker_windows_react"
npm install
```

2. **Uruchomienie w trybie deweloperskim**

```powershell
npm run dev
```

3. **Budowanie aplikacji (plik .exe)**

```powershell
npm run dist
```

Plik instalacyjny znajdziesz w `autoclicker_windows_react/dist/` po zakończeniu budowania.

### Dostępne skrypty

Uruchamiaj je z katalogu `autoclicker_windows_react/`:

- `npm run dev` - Vite i Electron w trybie deweloperskim,
- `npm run build` - budowanie frontendu React,
- `npm run dist` - budowanie instalatora Windows,
- `npm run start` - uruchomienie zbudowanej aplikacji Electron.

## 🔑 Aktywacja licencji

### Generowanie kluczy licencyjnych

Klucz licencyjny powinien mieć format: `XXXX-XXXX-XXXX-XXXX` (16 znaków alfanumerycznych, wielkie litery).

**Typy licencji:**

- Klucze zaczynające się na **B** → Licencja BASIC (max 2 przeglądarki)
- Klucze zaczynające się na **G** → Licencja GOLD (max 4 przeglądarki)

Przykładowe klucze (do testów):

```
BTEST-1234-ABCD-5678  (BASIC - 2 przeglądarki)
GTEST-WXYZ-9876-QRST  (GOLD - 4 przeglądarki)
```

### Proces aktywacji

1. Uruchom aplikację
2. Pojawi się ekran aktywacji z Twoim **Machine ID**
3. Wprowadź klucz licencyjny
4. Klucz zostanie zaszyfrowany i zapisany lokalnie
5. Aplikacja otworzy się automatycznie

## Aktualizacje aplikacji

Aktualizacje są przygotowane do publikowania przez GitHub Releases w repozytorium `bawar007/AutoClicker_PC`.

### Wydanie nowej wersji

1. Zwiększ numer `version` w `autoclicker_windows_react/package.json`, np. z `0.1.2` na `0.1.3`.
2. Z katalogu `autoclicker_windows_react/` uruchom:

```powershell
npm run dist
```

3. Utwórz na GitHubie Release z tagiem `v0.1.3`.
4. Dodaj do Release artefakty z katalogu `autoclicker_windows_react/dist/`, w tym instalator, plik `latest.yml` i plik `.blockmap`.

Po uruchomieniu zainstalowanej wersji aplikacja sprawdzi dostępność nowej wersji, zapyta o pobranie i zaproponuje ponowne uruchomienie po zakończeniu pobierania.

> `npm run dist` tworzy instalator lokalnie. Publikowanie bezpośrednio na GitHub wymaga skonfigurowanego tokena `GH_TOKEN` albo ręcznego dodania plików do Release.

### Struktura pliku licencji

Licencja jest przechowywana w:

```
C:\Users\[TwojaNazwa]\AppData\Roaming\web-test-automation-app\license.dat
```

Plik jest zaszyfrowany AES-256 z kluczem opartym na Machine ID.

## 🧪 Testowanie API Licencji

Serwer API uruchamia się automatycznie z aplikacją na porcie **5000**.

### Szybki test

```powershell
# Po uruchomieniu aplikacji, w nowym terminalu:
npm run test:api
```

### Ręczne testowanie

```powershell
# Sprawdź status licencji
curl http://localhost:5000/license

# Zarejestruj przeglądarkę
curl -X POST http://localhost:5000/browser/register -H "Content-Type: application/json" -d "{\"browserId\": \"test-browser-1\"}"

# Sprawdź health
curl http://localhost:5000/health
```

Pełna dokumentacja API znajduje się w pliku [LICENSE_API.md](LICENSE_API.md).

## 📖 Jak używać

### 1. Override `isTrusted`

W panelu bocznym włącz przełącznik **"Override isTrusted"**.

To wstrzyknie skrypt, który:

```javascript
// Nadpisuje właściwość isTrusted dla wszystkich eventów
Object.defineProperty(MouseEvent.prototype, "isTrusted", {
  get: function () {
    return true;
  },
});
```

**Rezultat**: Wszystkie zdarzenia wywołane przez `element.click()` lub `dispatchEvent()` będą zgłaszać `isTrusted = true`.

### 2. Wstrzykiwanie własnych skryptów

W sekcji **"Wstrzykiwanie Skryptów"** wpisz kod JavaScript:

```javascript
// Przykład: Kliknij wszystkie przyciski
document.querySelectorAll("button").forEach((btn) => btn.click());
```

Kliknij **"Wykonaj Skrypt"**. Wynik pojawi się w logach.

### 3. Symulacja prawdziwych kliknięć

Kliknij **"Symuluj Prawdziwe Kliknięcie"** aby użyć Chrome DevTools Protocol.

To generuje **PRAWDZIWE** zdarzenie na poziomie przeglądarki (nie JavaScript), więc:

- `event.isTrusted` === `true` (bez overridu)
- Nie da się odróżnić od rzeczywistego kliknięcia użytkownika

### 4. Nagrywanie scenariuszy

1. Wykonuj akcje (kliknięcia, skrypty)
2. Każda akcja jest automatycznie dodawana do scenariusza
3. Kliknij **"Eksportuj Scenariusz"** aby zapisać do pliku JSON
4. Użyj **"Importuj Scenariusz"** aby wczytać i odtworzyć

Przykładowy scenariusz:

```json
{
  "actions": [
    {
      "type": "script",
      "code": "document.querySelector('#login').value = 'user';",
      "timestamp": "2026-02-25T16:30:00Z"
    },
    {
      "type": "real-click",
      "position": { "x": 500, "y": 300 },
      "timestamp": "2026-02-25T16:30:01Z"
    }
  ],
  "metadata": {
    "created": "2026-02-25T16:30:00Z",
    "url": "https://ebrama.baltichub.com"
  }
}
```

## 🧪 Testowanie zabezpieczeń `isTrusted`

### Przykład strony testowej

Stwórz plik `test.html`:

```html
<!DOCTYPE html>
<html>
  <body>
    <button id="testBtn">Kliknij mnie</button>
    <div id="result"></div>

    <script>
      document.getElementById("testBtn").addEventListener("click", (e) => {
        const result = document.getElementById("result");
        result.innerHTML = `
        <h2>Rezultat:</h2>
        <p><strong>isTrusted:</strong> ${e.isTrusted}</p>
        <p><strong>Typ:</strong> ${e.type}</p>
        <p style="color: ${e.isTrusted ? "green" : "red"}">
          ${e.isTrusted ? "✓ Zaufane zdarzenie" : "✗ Niezaufane zdarzenie"}
        </p>
      `;
      });
    </script>
  </body>
</html>
```

### Test 1: Bez override

1. Załaduj `test.html` w aplikacji
2. W konsoli wykonaj: `document.getElementById('testBtn').click();`
3. Wynik: `isTrusted = false` ❌

### Test 2: Z override

1. Włącz **"Override isTrusted"**
2. Przeładuj stronę
3. W konsoli wykonaj: `document.getElementById('testBtn').click();`
4. Wynik: `isTrusted = true` ✅

### Test 3: Prawdziwe kliknięcie (CDP)

1. Użyj **"Symuluj Prawdziwe Kliknięcie"**
2. Wynik: `isTrusted = true` ✅ (bez override!)

## 🔧 Struktura projektu

```
AutoClicker_windows/
├── autoclicker_windows_react/
│   ├── electron/
│   │   ├── main.js             # Główny proces i aktualizacje
│   │   └── preload.js          # Bezpieczny most IPC
│   ├── src/                    # Interfejs React i hooki aplikacji
│   ├── assets/                 # Ikona aplikacji
│   ├── package.json
│   └── dist/                   # Wynik budowania i instalator
├── src/auto-clicker.js         # Skrypt Auto Clickera
├── src/license/                # System licencjonowania
├── chrome-extension/           # Wtyczka AutoClicker
├── package.json
└── README.md
```

## 🎨 Możliwości rozszerzenia

### Dodanie własnych skryptów

Edytuj [renderer.js](src/ui/renderer.js) i dodaj w sekcji `exampleScripts`:

```javascript
const exampleScripts = {
  "Mój skrypt": `
    // Twój kod
    console.log('Hello from custom script');
  `,
};
```

### Integracja z API

Możesz dodać komunikację z zewnętrznym API:

```javascript
// W renderer.js
async function verifyLicenseOnline(key) {
  const response = await fetch("https://api.autoclicker.pl/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: key }),
  });
  return await response.json();
}
```

### Robot.js dla symulacji systemowej

Zainstaluj `robotjs`:

```powershell
npm install robotjs
```

W [main.js](src/main.js):

```javascript
const robot = require("robotjs");

ipcMain.handle("system-click", async (event, { x, y }) => {
  robot.moveMouse(x, y);
  robot.mouseClick();
  return { success: true };
});
```

## 🐛 Rozwiązywanie problemów

### Wtyczka nie ładuje się

- Sprawdź czy folder `chrome-extension` zawiera `manifest.json`
- Uruchom z `npm run dev` i sprawdź console

### Licencja nie aktywuje się

- Sprawdź format klucza: `XXXX-XXXX-XXXX-XXXX`
- Upewnij się że znaki są wielkie (A-Z, 0-9)

### isTrusted override nie działa

- Przeładuj stronę po włączeniu togglea
- Sprawdź logi w DevTools (F12)

### Błąd podczas budowania

```powershell
# Wyczyść cache i przebuduj
Remove-Item -Recurse -Force node_modules
npm install
npm run dist
```

## 📄 Licencja

MIT License - możesz swobodnie modyfikować i dystrybuować.

## 👨‍💻 Wsparcie

W razie pytań lub problemów:

- Sprawdź logi w aplikacji (panel boczny)
- Użyj DevTools (Ctrl+Shift+I)
- Uruchom w trybie dev: `npm run dev`

---

**Wersja:** 0.1.2  
**Data:** 26 sierpnia 2026  
**Platforma:** Windows 10/11
