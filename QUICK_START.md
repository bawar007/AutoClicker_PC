# 🚀 SZYBKI START - Web Test Automation App

## ⚡ Instalacja w 3 krokach

### 1. Zainstaluj zależności
```powershell
npm install
```

### 2. Uruchom aplikację
```powershell
npm start
```

### 3. Aktywuj licencję testową
Użyj klucza: `TEST-1234-ABCD-5678`

---

## 🎯 Podstawowe funkcje

### ✅ Override `isTrusted`
1. Otwórz aplikację
2. Włącz toggle **"Override isTrusted"**
3. Wszystkie zdarzenia JavaScript będą zgłaszać `isTrusted = true`

**Test:**
```javascript
// W konsoli DevTools (Ctrl+Shift+I w WebView)
const btn = document.querySelector('button');
btn.addEventListener('click', (e) => console.log('isTrusted:', e.isTrusted));
btn.click(); // wyświetli: isTrusted: true
```

### 🖱️ Prawdziwe kliknięcia
Kliknij przycisk **"Symuluj Prawdziwe Kliknięcie"** aby wygenerować zdarzenie na poziomie systemu operacyjnego (Chrome DevTools Protocol).

### 💉 Wstrzykiwanie skryptów
```javascript
// Przykłady skryptów do wklejenia:

// 1. Kliknij wszystkie przyciski
document.querySelectorAll('button').forEach(btn => btn.click());

// 2. Wypełnij formularz
document.querySelector('input[name="email"]').value = 'test@example.com';

// 3. Pobierz wszystkie linki
Array.from(document.querySelectorAll('a')).map(a => a.href);

// 4. Automatyczne klikanie co 1s
setInterval(() => {
  document.querySelector('#target-button')?.click();
}, 1000);
```

---

## 📦 Jak zbudować plik .exe

```powershell
npm run build:win
```

Plik instalacyjny znajdziesz w: `dist/WebTestAutomation Setup.exe`

---

## 🔑 System licencji

### Format klucza
```
XXXX-XXXX-XXXX-XXXX
```

### Klucze testowe
```
TEST-1234-ABCD-5678
DEMO-WXYZ-9876-QRST
PROD-AAAA-BBBB-CCCC
```

### Lokalizacja pliku licencji
```
C:\Users\[User]\AppData\Roaming\web-test-automation-app\license.dat
```

---

## 🧪 Przykłady użycia

### Scenario 1: Testowanie formularzy
```javascript
// 1. Włącz Override isTrusted
// 2. Wstrzyknij skrypt:

const form = document.querySelector('form');
const inputs = form.querySelectorAll('input[type="text"]');

inputs.forEach(input => {
  input.value = 'TestData123';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

document.querySelector('button[type="submit"]').click();
```

### Scenario 2: Automatyczne klikanie slotów (jak w AutoClicker)
```javascript
// Wykorzystanie wtyczki AutoClicker wewnątrz aplikacji

// Skrypt automatycznie kliknie w dostępne sloty
document.querySelectorAll('.slot.available').forEach(slot => {
  slot.click();
});
```

### Scenario 3: Nagrywanie i odtwarzanie akcji
1. Wykonuj akcje ręcznie (kliknięcia, skrypty)
2. Kliknij **"Eksportuj Scenariusz"**
3. Zapisz jako `moj-scenariusz.json`
4. Później: **"Importuj Scenariusz"** i odtwórz

---

## 🛠️ Komendy npm

| Komenda | Opis |
|---------|------|
| `npm start` | Uruchom aplikację (produkcja) |
| `npm run dev` | Uruchom z DevTools |
| `npm run build` | Zbuduj dla wszystkich platform |
| `npm run build:win` | Zbuduj tylko dla Windows |

---

## 🔧 Rozwój

### Dodanie własnej funkcji

1. **Backend (main.js)**
```javascript
// Dodaj handler IPC
ipcMain.handle('my-custom-function', async (event, data) => {
  // Twoja logika
  return { success: true, result: data };
});
```

2. **Bridge (preload.js)**
```javascript
// Expose do renderer
contextBridge.exposeInMainWorld('electronAPI', {
  myCustomFunction: (data) => ipcRenderer.invoke('my-custom-function', data)
});
```

3. **Frontend (renderer.js)**
```javascript
// Użycie w interfejsie
const result = await window.electronAPI.myCustomFunction({ test: 123 });
console.log(result);
```

---

## ❓ FAQ

**Q: Czy mogę używać bez licencji?**  
A: Nie, aplikacja wymaga aktywacji. Użyj klucza testowego: `TEST-1234-ABCD-5678`

**Q: Czy działa na MacOS/Linux?**  
A: Aktualnie tylko Windows. Można dostosować `package.json` dla innych platform.

**Q: Czy wtyczka AutoClicker działa w aplikacji?**  
A: Tak! Wtyczka jest automatycznie ładowana i działa tak samo jak w Chrome.

**Q: Jak wyłączyć override isTrusted?**  
A: Wyłącz toggle i przeładuj stronę (F5).

**Q: Czy mogę automatycznie ładować skrypty przy starcie?**  
A: Tak, edytuj `renderer.js` i dodaj kod w event `webview.addEventListener('dom-ready', ...)`.

---

## 📞 Kontakt

- 📧 Email: support@autoclicker.pl
- 🌐 Web: https://autoclicker.pl
- 📚 Dokumentacja: [README.md](README.md)

---

**Powodzenia w testowaniu! 🎉**
