// ==================== RENDERER.JS ====================
// Logika interfejsu głównego okna aplikacji

import { renderWebviewPanes } from "./components/webview-pane.js";

const webviewContainer = document.getElementById("webview-container");

// Panele a/b/c/d nie są już powielane w index.html - budujemy je tutaj z jednego szablonu
renderWebviewPanes(webviewContainer, [
  {
    id: "a",
    label: "A",
    isPrimary: true,
    urlInputValue: "https://ebrama.baltichub.com",
    webviewSrc: "https://ebrama.baltichub.com",
  },
  {
    id: "b",
    label: "B",
    urlInputValue: "https://www.google.com",
    webviewSrc: "https://ebrama.baltichub.com/",
  },
  {
    id: "c",
    label: "C",
    urlInputValue: "https://www.google.com",
    webviewSrc: "https://ebrama.baltichub.com/",
  },
  {
    id: "d",
    label: "D",
    urlInputValue: "https://www.google.com",
    webviewSrc: "https://ebrama.baltichub.com/",
  },
]);

const paneA = document.getElementById("pane-a");
const paneB = document.getElementById("pane-b");
const paneC = document.getElementById("pane-c");
const paneD = document.getElementById("pane-d");
const browserButtonA = document.getElementById("browser-a-btn");
const browserButtonB = document.getElementById("browser-b-btn");
const browserButtonC = document.getElementById("browser-c-btn");
const browserButtonD = document.getElementById("browser-d-btn");
const addTabBBtn = document.getElementById("add-tab-b-btn");
const addTabCBtn = document.getElementById("add-tab-c-btn");
const addTabDBtn = document.getElementById("add-tab-d-btn");
const closeBrowserBButton = document.getElementById("close-browser-b-btn");
const closeBrowserCButton = document.getElementById("close-browser-c-btn");
const closeBrowserDButton = document.getElementById("close-browser-d-btn");
const minimizeBtnA = document.getElementById("minimize-btn-a");
const minimizeBtnB = document.getElementById("minimize-btn-b");
const minimizeBtnC = document.getElementById("minimize-btn-c");
const minimizeBtnD = document.getElementById("minimize-btn-d");
const webviewA = document.getElementById("webview-a");
const webviewB = document.getElementById("webview-b");
const webviewC = document.getElementById("webview-c");
const webviewD = document.getElementById("webview-d");
const urlInputA = document.getElementById("url-input-a");
const urlInputB = document.getElementById("url-input-b");
const urlInputC = document.getElementById("url-input-c");
const urlInputD = document.getElementById("url-input-d");
const goBtnA = document.getElementById("go-btn-a");
const goBtnB = document.getElementById("go-btn-b");
const goBtnC = document.getElementById("go-btn-c");
const goBtnD = document.getElementById("go-btn-d");
const refreshBtnA = document.getElementById("refresh-btn-a");
const refreshBtnB = document.getElementById("refresh-btn-b");
const refreshBtnC = document.getElementById("refresh-btn-c");
const refreshBtnD = document.getElementById("refresh-btn-d");
const toggleIsTrusted = document.getElementById("toggle-istrusted");
const devtoolsBtn = document.getElementById("devtools-btn");
const logsContainer = document.getElementById("logs");
const toggleAutoClickerBtn = document.getElementById("toggle-auto-clicker-btn");
const statusLightA = document.getElementById("status-light-a");
const statusLightB = document.getElementById("status-light-b");
const statusLightC = document.getElementById("status-light-c");
const statusLightD = document.getElementById("status-light-d");

// License Manager Button - zaladować dynamicznie
let licenseManagerBtn = null;

// ==================== SYNCHRONIZACJA Z WEBVIEW ====================
// Monitorowanie stanu slotów i synchronizacji z panelem kontrolnym
let lastMonitoredSlotsCount = -1;
let slotsMonitorInterval = null;

function monitorSlotsState() {
  const browser = getActiveBrowser();
  if (!browser || !browser.webview) return;

  browser.webview
    .executeJavaScript(
      "JSON.stringify(window.AutoClickerState || { slotsCount: 0, slots: [], isRunning: false })",
    )
    .then((stateJson) => {
      try {
        const state = JSON.parse(stateJson);

        // Jeśli liczba slotów się zmieniła, wyświetl powiadomienie
        if (state.slotsCount !== lastMonitoredSlotsCount) {
          lastMonitoredSlotsCount = state.slotsCount;

          if (state.slotsCount > 0) {
            if (state.slotsCount === 1) {
              addLog(
                `✓ Wybrany 1 slot do klikania (${browser.id.toUpperCase()})`,
                "info",
                browser.id,
              );
            } else {
              addLog(
                `✓ Wybranych ${state.slotsCount} slotów do klikania (${browser.id.toUpperCase()})`,
                "info",
                browser.id,
              );
            }
          } else if (state.slotsCount === 0 && lastMonitoredSlotsCount > 0) {
            addLog(
              `✓ Wyczyszczono sloty (${browser.id.toUpperCase()})`,
              "info",
              browser.id,
            );
          }
        }

        // Aktualizuj status light jeśli się coś zmienia
        if (state.isRunning) {
          updateStatusLight(browser);
        }
      } catch (error) {
        // Błąd parsowania - webview może nie mieć jeszcze window.AutoClickerState
      }
    })
    .catch((error) => {
      // Błąd executeJavaScript - ignoruj
    });
}

function startSlotsMonitoring() {
  // Sprawdzaj stan slotów co 300ms
  if (slotsMonitorInterval) clearInterval(slotsMonitorInterval);
  slotsMonitorInterval = setInterval(monitorSlotsState, 300);
  monitorSlotsState(); // Sprawdzaj od razu
}

function stopSlotsMonitoring() {
  if (slotsMonitorInterval) {
    clearInterval(slotsMonitorInterval);
    slotsMonitorInterval = null;
  }
  lastMonitoredSlotsCount = -1;
}

// Startnij monitoring gdy AutoClicker jest włączony
setInterval(() => {
  const browser = getActiveBrowser();
  if (browser && browser.autoClickerEnabled) {
    startSlotsMonitoring();
  } else {
    stopSlotsMonitoring();
  }
}, 500);

// Stan aplikacji
const createScenario = () => ({
  actions: [],
  metadata: {
    created: new Date().toISOString(),
    url: "",
  },
});

const browsers = {
  a: {
    id: "a",
    label: "A",
    pane: paneA,
    webview: webviewA,
    urlInput: urlInputA,
    goBtn: goBtnA,
    refreshBtn: refreshBtnA,
    isTrustedEnabled: false,
    autoClickerEnabled: false,
    waitingForPanel: false,
    scenario: createScenario(),
  },
  b: {
    id: "b",
    label: "B",
    pane: paneB,
    webview: webviewB,
    urlInput: urlInputB,
    goBtn: goBtnB,
    refreshBtn: refreshBtnB,
    isTrustedEnabled: false,
    autoClickerEnabled: false,
    waitingForPanel: false,
    scenario: createScenario(),
  },
  c: {
    id: "c",
    label: "C",
    pane: paneC,
    webview: webviewC,
    urlInput: urlInputC,
    goBtn: goBtnC,
    refreshBtn: refreshBtnC,
    isTrustedEnabled: false,
    autoClickerEnabled: false,
    waitingForPanel: false,
    scenario: createScenario(),
  },
  d: {
    id: "d",
    label: "D",
    pane: paneD,
    webview: webviewD,
    urlInput: urlInputD,
    goBtn: goBtnD,
    refreshBtn: refreshBtnD,
    isTrustedEnabled: false,
    autoClickerEnabled: false,
    waitingForPanel: false,
    scenario: createScenario(),
  },
};

const browserButtons = {
  a: browserButtonA,
  b: browserButtonB,
  c: browserButtonC,
  d: browserButtonD,
};

let activeBrowserId = "a";
let isBrowserBOpen = false;
let isBrowserCOpen = false;
let isBrowserDOpen = false;
let maxBrowsers = 2; // Domyślnie BASIC (2 przeglądarki)
let focusedBrowserId = null; // Karta wyświetlana w trybie podglądu na cały obszar

function isBrowserOpen(id) {
  if (id === "a") return true;
  if (id === "b") return isBrowserBOpen;
  if (id === "c") return isBrowserCOpen;
  if (id === "d") return isBrowserDOpen;
  return false;
}

// ==================== INICJALIZACJA ====================

// Załaduj informacje o licencji i skonfiguruj przeglądarki
window.electronAPI.getLicenseInfo().then((info) => {
  if (info.isActive) {
    document.getElementById("license-key").textContent = info.licenseKey || "—";

    // Ustaw max przeglądarek na podstawie typu licencji
    maxBrowsers = info.maxBrowsers || 2;
    console.log(
      `[License] Typ licencji: ${info.licenseType}, Max przeglądarek: ${maxBrowsers}`,
    );

    // Pokaż przyciski C i D dla licencji GOLD (4 przeglądarki)
    if (maxBrowsers >= 4) {
      browserButtonC.style.display = "inline-block";
      browserButtonD.style.display = "inline-block";
      addLog("✅ Licencja GOLD - dostępne 4 przeglądarki", "success");
    } else {
      addLog("ℹ️ Licencja BASIC - dostępne 2 przeglądarki", "info");
    }
  } else {
    document.getElementById("license-key").textContent =
      "Brak aktywnej licencji";
  }
});

// ==================== LOGOWANIE ====================

function addLog(message, type = "info", browserId = null) {
  const logEntry = document.createElement("div");
  logEntry.className = `log-entry log-${type}`;

  const timestamp = new Date().toLocaleTimeString("pl-PL");
  const prefix = browserId ? `(${browserId.toUpperCase()}) ` : "";
  logEntry.textContent = `[${timestamp}] ${prefix}${message}`;

  logsContainer.insertBefore(logEntry, logsContainer.firstChild);

  // Ogranicz do 50 wpisów
  while (logsContainer.children.length > 50) {
    logsContainer.removeChild(logsContainer.lastChild);
  }

  console.log(`[${type.toUpperCase()}] ${prefix}${message}`);
}

// ==================== WEBVIEW NAVIGATION ====================

function getActiveBrowser() {
  return browsers[activeBrowserId];
}

function updateActiveUI() {
  // Resetuj aktywną przeglądarkę jeśli jest zamknięta
  if (!isBrowserBOpen && activeBrowserId === "b") {
    activeBrowserId = "a";
  }
  if (!isBrowserCOpen && activeBrowserId === "c") {
    activeBrowserId = "a";
  }
  if (!isBrowserDOpen && activeBrowserId === "d") {
    activeBrowserId = "a";
  }
  if (focusedBrowserId && !isBrowserOpen(focusedBrowserId)) {
    focusedBrowserId = null;
  }

  Object.values(browsers).forEach((browser) => {
    const isActive = browser.id === activeBrowserId;
    browser.pane.classList.toggle("active-pane", isActive);
    browserButtons[browser.id].classList.toggle("active", isActive);
  });

  toggleIsTrusted.checked = getActiveBrowser().isTrustedEnabled;
  updateAutoClickerButton();

  // Zarządzanie widocznością przeglądarek
  browserButtons.b.disabled = !isBrowserBOpen;
  browserButtons.c.disabled = !isBrowserCOpen;
  browserButtons.d.disabled = !isBrowserDOpen;

  // Puste sloty (bez otwartej karty) pokazują przycisk "+"
  paneB.classList.toggle("pane-empty", !isBrowserBOpen);
  paneC.classList.toggle("pane-empty", !isBrowserCOpen);
  paneD.classList.toggle("pane-empty", !isBrowserDOpen);

  addTabCBtn.disabled = maxBrowsers < 3;
  addTabDBtn.disabled = maxBrowsers < 4;
  addTabCBtn.title =
    maxBrowsers < 3 ? "Wymaga licencji GOLD" : "Otwórz nową kartę";
  addTabDBtn.title =
    maxBrowsers < 4 ? "Wymaga licencji GOLD" : "Otwórz nową kartę";

  closeBrowserBButton.disabled = !isBrowserBOpen;
  closeBrowserCButton.disabled = !isBrowserCOpen;
  closeBrowserDButton.disabled = !isBrowserDOpen;

  // Tryb podglądu: aktywna karta na cały obszar, reszta jako mini kafelki
  // Sloty mini są przypisane na stałe do id (pane-a/b/c/d), więc nie przeskakują przy zmianie fokusu
  webviewContainer.classList.toggle("focus-mode", !!focusedBrowserId);

  Object.values(browsers).forEach((browser) => {
    browser.pane.classList.remove("role-main", "is-mini");
  });

  if (focusedBrowserId) {
    browsers[focusedBrowserId].pane.classList.add("role-main");
    ["a", "b", "c", "d"]
      .filter((id) => id !== focusedBrowserId)
      .forEach((id) => {
        browsers[id].pane.classList.add("is-mini");
      });
  }
}

function enterFocusMode(id) {
  if (!isBrowserOpen(id)) return;
  focusedBrowserId = id;
  setActiveBrowser(id);
}

function exitFocusMode() {
  focusedBrowserId = null;
  updateActiveUI();
}

function setActiveBrowser(browserId) {
  if (!browsers[browserId]) return;
  if (browserId === "b" && !isBrowserBOpen) return;
  if (browserId === "c" && !isBrowserCOpen) return;
  if (browserId === "d" && !isBrowserDOpen) return;
  activeBrowserId = browserId;
  updateActiveUI();
  addLog(
    `Aktywna przeglądarka: ${browsers[browserId].label}`,
    "info",
    browserId,
  );
}

const normalizeUrl = (url) => (url.startsWith("http") ? url : `https://${url}`);

function navigate(browser, url) {
  const trimmed = url.trim();
  if (!trimmed) return;
  const finalUrl = normalizeUrl(trimmed);
  browser.webview.src = finalUrl;
  browser.scenario.metadata.url = finalUrl;
  addLog(`Nawigacja do: ${finalUrl}`, "info", browser.id);
}

Object.values(browsers).forEach((browser) => {
  browser.goBtn.addEventListener("click", () => {
    navigate(browser, browser.urlInput.value);
  });

  browser.urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      browser.goBtn.click();
    }
  });

  browser.refreshBtn.addEventListener("click", () => {
    browser.webview.reload();
    addLog("Odświeżanie strony", "info", browser.id);
  });

  browser.webview.addEventListener("did-navigate", (e) => {
    browser.urlInput.value = e.url;
    browser.scenario.metadata.url = e.url;
    addLog(`Załadowano: ${e.url}`, "success", browser.id);

    // Reset monitoring slotów na nowej stronie
    lastMonitoredSlotsCount = -1;

    // WAŻNE: Jeśli AutoClicker jest włączony, reinicjalizuj go na nowej stronie
    if (browser.autoClickerEnabled) {
      console.log("[Navigation] AutoClicker jest włączony, reinicjalizuję...");
      setTimeout(async () => {
        // Reinicjalizuj AutoClicker na nowej stronie
        const isInjected = await injectAutoClicker(browser);
        if (isInjected) {
          console.log("[Navigation] AutoClicker reinicjalizowany");
          const initResult = await initAutoClicker(browser);

          if (initResult === true) {
            // Czekamy na panel rezerwacji
            browser.waitingForPanel = true;
            updateAutoClickerButton();
            addLog(
              "⏳ AutoClicker czeka na panel rezerwacji (po nawigacji)",
              "warning",
              browser.id,
            );
            waitForPanelReady(browser);
          } else if (initResult === false) {
            // Panel istniał i inicjalizacja się powiodła
            browser.waitingForPanel = false;
            updateAutoClickerButton();
            updateStatusLight(browser);
            addLog(
              "✅ AutoClicker reinicjalizowany (panel znaleziony)",
              "success",
              browser.id,
            );
          }
        }
      }, 500); // Czekaj 500ms żeby strona się załadowała
    }
  });
});

browserButtons.a.addEventListener("click", () => setActiveBrowser("a"));
browserButtons.b.addEventListener("click", () => setActiveBrowser("b"));
browserButtons.c.addEventListener("click", () => setActiveBrowser("c"));
browserButtons.d.addEventListener("click", () => setActiveBrowser("d"));

// Kliknięcie kafelka z otwartą kartą otwiera podgląd na cały obszar
function handlePaneClick(id) {
  if (!isBrowserOpen(id)) return;
  enterFocusMode(id);
}
paneA.addEventListener("mousedown", () => handlePaneClick("a"));
paneB.addEventListener("mousedown", () => handlePaneClick("b"));
paneC.addEventListener("mousedown", () => handlePaneClick("c"));
paneD.addEventListener("mousedown", () => handlePaneClick("d"));

// Przyciski minimalizacji - powrót do widoku 4 kafelków
[minimizeBtnA, minimizeBtnB, minimizeBtnC, minimizeBtnD].forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    exitFocusMode();
  });
});

// Przycisk "+" na pustym kafelku otwiera daną przeglądarkę i pokazuje ją w podglądzie
function openBrowserSlot(id) {
  if (id === "b") {
    if (isBrowserBOpen) return;
    isBrowserBOpen = true;
  } else if (id === "c") {
    if (isBrowserCOpen || maxBrowsers < 3) return;
    isBrowserCOpen = true;
  } else if (id === "d") {
    if (isBrowserDOpen || maxBrowsers < 4) return;
    isBrowserDOpen = true;
  } else {
    return;
  }

  updateActiveUI();

  const browser = browsers[id];
  const defaultUrl = browser.urlInput.value.trim();
  if (defaultUrl && browser.webview.src === "about:blank") {
    navigate(browser, defaultUrl);
  }

  addLog(`✓ Otworzono przegladarke ${id.toUpperCase()}`, "success", id);
  enterFocusMode(id);
}

addTabBBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  openBrowserSlot("b");
});
addTabCBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  openBrowserSlot("c");
});
addTabDBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  openBrowserSlot("d");
});

closeBrowserBButton.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!isBrowserBOpen) return;
  isBrowserBOpen = false;
  browsers.b.isTrustedEnabled = false;
  browsers.b.autoClickerEnabled = false;
  webviewB.src = "about:blank";
  updateActiveUI();
  addLog("✖ Zamknieto przegladarke B", "info", "b");
});

closeBrowserCButton.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!isBrowserCOpen) return;
  isBrowserCOpen = false;
  browsers.c.isTrustedEnabled = false;
  browsers.c.autoClickerEnabled = false;
  webviewC.src = "about:blank";
  updateActiveUI();
  addLog("✖ Zamknieto przegladarke C", "info", "c");
});

closeBrowserDButton.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!isBrowserDOpen) return;
  isBrowserDOpen = false;
  browsers.d.isTrustedEnabled = false;
  browsers.d.autoClickerEnabled = false;
  webviewD.src = "about:blank";
  updateActiveUI();
  addLog("✖ Zamknieto przegladarke D", "info", "d");
});

updateActiveUI();

// ==================== isTRUSTED OVERRIDE ====================

function getIsTrustedScript() {
  return `
    (function() {
      const forceIsTrusted = (event) => {
        if (!event) return;
        const descriptor = Object.getOwnPropertyDescriptor(event, 'isTrusted');
        if (descriptor && descriptor.configurable === false) return;
        try {
          Object.defineProperty(event, 'isTrusted', {
            get: () => true,
            configurable: true
          });
        } catch (err) {
          // Ignore non-configurable instances (Chromium enforces this on some events).
        }
      };

      // Override dla wszystkich typów eventów
      const eventTypes = ['MouseEvent', 'KeyboardEvent', 'PointerEvent', 'TouchEvent', 'Event'];

      eventTypes.forEach(eventType => {
        if (window[eventType]) {
          const OriginalEvent = window[eventType];
          window[eventType] = function(...args) {
            const event = new OriginalEvent(...args);
            forceIsTrusted(event);
            return event;
          };
          Object.setPrototypeOf(window[eventType], OriginalEvent);
          window[eventType].prototype = OriginalEvent.prototype;
        }
      });

      // Override dla dispatchEvent
      const originalDispatch = EventTarget.prototype.dispatchEvent;
      EventTarget.prototype.dispatchEvent = function(event) {
        forceIsTrusted(event);
        return originalDispatch.call(this, event);
      };

      console.log('%c✓ isTrusted Override Aktywny', 'color: green; font-weight: bold; font-size: 14px;');
      console.log('%cWszystkie zdarzenia będą zgłaszać isTrusted = true', 'color: orange;');
    })();
  `;
}

async function enableIsTrustedOverride(browser) {
  const script = getIsTrustedScript();
  await browser.webview.executeJavaScript(script);
}

toggleIsTrusted.addEventListener("change", async (e) => {
  const browser = getActiveBrowser();
  browser.isTrustedEnabled = e.target.checked;

  if (browser.isTrustedEnabled) {
    addLog("⚠️ Włączanie override isTrusted...", "info", browser.id);

    try {
      await enableIsTrustedOverride(browser);
      addLog("✓ isTrusted override włączony", "success", browser.id);
    } catch (error) {
      addLog(`✗ Błąd: ${error.message}`, "error", browser.id);
    }
  } else {
    addLog(
      "isTrusted override wyłączony - przeładuj stronę aby przywrócić",
      "info",
      browser.id,
    );
    browser.webview.reload();
  }
});

// Przykładowe skrypty - predefiniowane
const exampleScripts = {
  "Click pierwszego elementu": `document.querySelector('button')?.click();`,
  "Wypełnij formularz": `document.querySelector('input[type="text"]').value = 'Test';`,
  "Pobierz wszystkie linki": `Array.from(document.querySelectorAll('a')).map(a => a.href);`,
  "Sprawdź isTrusted": `
    const btn = document.querySelector('button');
    btn.addEventListener('click', (e) => console.log('isTrusted:', e.isTrusted));
    btn.click();
  `,
};

// Odtwarzanie scenariusza
async function playScenario(browser, scenario) {
  addLog(
    `▶️ Odtwarzanie scenariusza (${scenario.actions.length} akcji)...`,
    "info",
    browser.id,
  );

  for (let i = 0; i < scenario.actions.length; i++) {
    const action = scenario.actions[i];

    addLog(
      `[${i + 1}/${scenario.actions.length}] ${action.type}`,
      "info",
      browser.id,
    );

    if (action.type === "script") {
      await browser.webview.executeJavaScript(action.code);
    } else if (action.type === "real-click") {
      await window.electronAPI.simulateRealClick(
        action.position.x,
        action.position.y,
      );
    }

    // Czekaj 500ms między akcjami
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  addLog("✓ Scenariusz zakończony", "success", browser.id);
}

// ==================== DEVTOOLS ====================

devtoolsBtn.addEventListener("click", () => {
  const browser = getActiveBrowser();
  browser.webview.openDevTools();
  addLog("🔧 DevTools otwarte dla WebView", "info", browser.id);
});

// ==================== ZARZĄDZANIE LICENCJĄ ====================

// Inicjalizuj przycisk zarządzania licencją
function initLicenseManagerBtn() {
  licenseManagerBtn = document.getElementById("license-manager-btn");

  if (licenseManagerBtn) {
    console.log("✓ License Manager Button znaleziony i inicjalizowany");
    licenseManagerBtn.addEventListener("click", () => {
      console.log("Kliknięto License Manager Button");
      const modal = document.getElementById("license-manager-modal");
      const iframe = document.getElementById("license-manager-iframe");

      if (modal) {
        modal.classList.add("active");
        console.log("Modal pokazany");

        // Debug - sprawdź iframe
        if (iframe) {
          console.log("[DEBUG] iframe.src:", iframe.src);
          console.log("[DEBUG] iframe.contentWindow:", iframe.contentWindow);
        }

        // Poczekaj chwilę i wyślij wiadomość do iframe aby odświeżyło dane
        setTimeout(() => {
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: "refresh-license" }, "*");
            console.log("Wysłano refresh-license do iframe");
          }
        }, 100);
      }
    });
  } else {
    console.warn("❌ License Manager Button nie znaleziony w DOM");
  }
}

// Załaduj przycisk gdy plik się zaczy
initLicenseManagerBtn();

// Załaduj ponownie po krótkim opóźnieniu (dla pewności)
setTimeout(initLicenseManagerBtn, 100);

// ==================== OBSŁUGA KOMUNIKACJI Z MODALEM IFRAME ====================

// Słuchaj wiadomości z iframe license-manager (bardziej fleksybilnie)
window.addEventListener("message", async (event) => {
  // Sprawdź czy ma typ (to jest wiadomość z naszego iframe)
  if (!event.data || !event.data.type) {
    return;
  }

  console.log("[License Manager Modal] Otrzymano wiadomość:", event.data.type);

  // Obsługuj różne wiadomości z iframe
  if (event.data.type === "get-license-info") {
    try {
      console.log("[License Manager Modal] Wysyłam informacje o licencji");
      const licenseInfo = await window.electronAPI.getLicenseInfo();

      // Wyślij odpowiedź z powrotem do iframe
      const iframeElement = document.getElementById("license-manager-iframe");
      if (iframeElement && iframeElement.contentWindow) {
        iframeElement.contentWindow.postMessage(
          {
            type: "license-info-response",
            data: licenseInfo,
          },
          "*",
        );
        console.log("[License Manager Modal] Odpowiedź wysłana");
      } else {
        console.error(
          "[License Manager Modal] iframe element nie jest dostępny",
        );
      }
    } catch (error) {
      console.error("[License Manager Modal] Błąd pobierania licencji:", error);
    }
  }

  if (event.data.type === "open-license-activation") {
    console.log("[License Manager Modal] Otwieranie okna aktywacji licencji");
    try {
      if (window.electronAPI && window.electronAPI.openLicenseActivation) {
        window.electronAPI.openLicenseActivation();
      } else {
        console.error(
          "[License Manager Modal] window.electronAPI.openLicenseActivation nie jest dostępny",
        );
      }
    } catch (error) {
      console.error(
        "[License Manager Modal] Błąd otwierania okna aktywacji:",
        error,
      );
    }
  }

  if (event.data.type === "revoke-license") {
    console.log("[License Manager Modal] Usuwanie licencji");
    try {
      const result = await window.electronAPI.revokeLicense();

      const iframeElement = document.getElementById("license-manager-iframe");
      if (iframeElement && iframeElement.contentWindow) {
        iframeElement.contentWindow.postMessage(
          {
            type: "revoke-license-response",
            data: result,
          },
          "*",
        );
      }
    } catch (error) {
      console.error("[License Manager Modal] Błąd usuwania licencji:", error);
    }
  }
});

// Nasłuchuj na zmiany licencji
window.electronAPI.onLicenseUpdated(() => {
  console.log("[License] Otrzymano powiadomienie o zmianie licencji");

  // Odśwież dane w license-manager iframe jeśli jest otwarty
  const modal = document.getElementById("license-manager-modal");
  const iframe = document.getElementById("license-manager-iframe");

  if (
    modal &&
    modal.classList.contains("active") &&
    iframe &&
    iframe.contentWindow
  ) {
    console.log("[License] Odświeżam dane w license-manager iframe");
    iframe.contentWindow.postMessage({ type: "refresh-license" }, "*");
  }
});

// ==================== WEBVIEW - OBSŁUGA ZDARZEŃ ====================

Object.values(browsers).forEach((browser) => {
  browser.webview.addEventListener("dom-ready", async () => {
    addLog("✓ DOM załadowany", "success", browser.id);

    // Jeśli isTrusted override jest włączony, wstrzyknij ponownie
    if (browser.isTrustedEnabled) {
      try {
        await enableIsTrustedOverride(browser);
      } catch (error) {
        addLog(`✗ Błąd: ${error.message}`, "error", browser.id);
      }
    }
  });

  browser.webview.addEventListener("did-fail-load", (e) => {
    if (e.errorCode !== -3) {
      // -3 to anulowanie (normalne)
      addLog(`✗ Błąd ładowania: ${e.errorDescription}`, "error", browser.id);
    }
  });

  // Monitoruj console.log z webview
  browser.webview.addEventListener("console-message", (e) => {
    addLog(`[WebView Console] ${e.message}`, "info", browser.id);
  });
});

// ==================== RECORDING MODE ====================
// Opcjonalnie: nagrywanie akcji użytkownika

let isRecording = false;

function startRecording() {
  isRecording = true;
  const browser = getActiveBrowser();
  browser.scenario.actions = [];
  addLog("🔴 Nagrywanie rozpoczęte", "success", browser.id);
}

function stopRecording() {
  isRecording = false;
  const browser = getActiveBrowser();
  addLog(
    `⏹️ Nagrywanie zatrzymane (${browser.scenario.actions.length} akcji)`,
    "success",
    browser.id,
  );
}

// ==================== AUTO CLICKER ====================

let autoClickerScript = null;

function updateAutoClickerButton() {
  if (!toggleAutoClickerBtn) return;
  const browser = getActiveBrowser();

  if (browser.autoClickerEnabled) {
    if (browser.waitingForPanel) {
      toggleAutoClickerBtn.innerText = "⏳ Czekam na panel rezerwacji";
      toggleAutoClickerBtn.classList.add("waiting");
      toggleAutoClickerBtn.classList.remove("active");
      // Disabled żeby nie można było klikać podczas czekania
      toggleAutoClickerBtn.disabled = false;
    } else {
      toggleAutoClickerBtn.innerText = "⏹️ Wyłącz Auto Clicker";
      toggleAutoClickerBtn.classList.add("active");
      toggleAutoClickerBtn.classList.remove("waiting");
      toggleAutoClickerBtn.disabled = false;
    }
  } else {
    toggleAutoClickerBtn.innerText = "▶️ Włącz Auto Clicker";
    toggleAutoClickerBtn.classList.remove("active");
    toggleAutoClickerBtn.classList.remove("waiting");
    toggleAutoClickerBtn.disabled = false;
  }
}

async function updateStatusLight(browser) {
  // Wybierz odpowiedni status light
  let statusLight;
  switch (browser.id) {
    case "a":
      statusLight = statusLightA;
      break;
    case "b":
      statusLight = statusLightB;
      break;
    case "c":
      statusLight = statusLightC;
      break;
    case "d":
      statusLight = statusLightD;
      break;
  }

  if (!statusLight) return;

  if (!browser.autoClickerEnabled) {
    statusLight.className = "status-light";
    statusLight.title = "AutoClicker: wyłączony";
    return;
  }

  try {
    const result = await browser.webview.executeJavaScript(`
      (function() {
        if (!window.AutoClicker) return { isRunning: false, isLoaded: false };
        return {
          isRunning: window.AutoClicker.isRunning(),
          isLoaded: true
        };
      })()
    `);

    if (result.isRunning) {
      statusLight.className = "status-light status-light--green";
      statusLight.title = "AutoClicker: klika";
    } else if (result.isLoaded) {
      statusLight.className = "status-light status-light--yellow";
      statusLight.title = "AutoClicker: ładowanie/czekanie";
    } else {
      statusLight.className = "status-light";
      statusLight.title = "AutoClicker: wyłączony";
    }
  } catch {
    statusLight.className = "status-light";
    statusLight.title = "AutoClicker: wyłączony";
  }
}

function startStatusLightMonitor() {
  setInterval(() => {
    Object.values(browsers).forEach((browser) => {
      if (browser.autoClickerEnabled) {
        updateStatusLight(browser);
      }
    });
  }, 500);
}

async function injectAutoClicker(browser) {
  try {
    // Czyszczenie stanu AutoClickera ze starej strony
    await browser.webview.executeJavaScript(`
      if (window.AutoClicker && window.AutoClicker.stop) {
        try {
          window.AutoClicker.stop();
        } catch (e) {}
      }
      delete window.AutoClicker;
      delete window.AutoClickerState;
    `);

    if (!autoClickerScript) {
      const response = await fetch("../auto-clicker.js");
      autoClickerScript = await response.text();
    }

    await browser.webview.executeJavaScript(autoClickerScript);
    addLog("✓ Auto Clicker wstrzyknięty", "success", browser.id);
    return true;
  } catch (error) {
    addLog(`✗ Błąd wstrzykiwania: ${error.message}`, "error", browser.id);
    return false;
  }
}

async function initAutoClicker(browser) {
  try {
    const result = await browser.webview.executeJavaScript(`
      if (window.AutoClicker) {
        window.AutoClicker.init();
        // Zwróć czy czekamy na panel
        window.AutoClicker.waitingForPanel;
      } else {
        false;
      }
    `);
    return result;
  } catch (error) {
    addLog(`✗ Błąd inicjalizacji: ${error.message}`, "error", browser.id);
    return null;
  }
}

function waitForPanelReady(browser) {
  // Monitoruj czy panel się pojawił
  let checkCount = 0;
  const maxChecks = 600; // 3 minuty (600 x 500ms)
  const checkInterval = 500; // sprawdzaj co 500ms zamiast 1000ms

  const checkPanel = setInterval(() => {
    checkCount++;

    browser.webview
      .executeJavaScript(
        "window.AutoClicker ? window.AutoClicker.waitingForPanel : 'undefined'",
      )
      .then((waiting) => {
        // Użytkownik zatrzymał AutoClicker w międzyczasie - nie zgłaszaj fałszywego sukcesu
        if (
          !browser.autoClickerEnabled ||
          browser.panelCheckInterval !== checkPanel
        ) {
          clearInterval(checkPanel);
          return;
        }

        if (waiting === false) {
          // Panel się pojawił i zainicjalizował!
          clearInterval(checkPanel);
          browser.panelCheckInterval = null;
          addLog(
            "✅ Panel rezerwacji znaleziony! AutoClicker gotowy do pracy",
            "success",
            browser.id,
          );
          browser.waitingForPanel = false;
          updateAutoClickerButton();
          updateStatusLight(browser);
        } else if (checkCount >= maxChecks) {
          // Timeout - panel się nie pojawił
          clearInterval(checkPanel);
          browser.panelCheckInterval = null;
          browser.autoClickerEnabled = false;
          browser.waitingForPanel = false;
          updateAutoClickerButton();
          addLog(
            "⏱️ Timeout: Panel rezerwacji nie pojawił się. Wyłączyłem AutoClicker",
            "warning",
            browser.id,
          );
        }
        // Else: czekamy dalej (waiting === true)
      })
      .catch(() => {
        // Ignoruj błędy executeJavaScript
      });
  }, checkInterval);

  browser.panelCheckInterval = checkPanel;
}

toggleAutoClickerBtn.addEventListener("click", async () => {
  const browser = getActiveBrowser();

  if (browser.autoClickerEnabled) {
    const wasWaitingForPanel = browser.waitingForPanel;
    try {
      await browser.webview.executeJavaScript(`
        if (window.AutoClicker) {
          window.AutoClicker.stop();
          if (window.AutoClicker.clearAllSlots) window.AutoClicker.clearAllSlots();
        }
      `);
      if (browser.panelCheckInterval) {
        clearInterval(browser.panelCheckInterval);
        browser.panelCheckInterval = null;
      }
      browser.autoClickerEnabled = false;
      browser.waitingForPanel = false;
      updateAutoClickerButton();
      updateStatusLight(browser);
      addLog(
        wasWaitingForPanel
          ? "⏹️ Przerwane przez użytkownika (oczekiwanie na panel anulowane)"
          : "⏹️ Auto Clicker wyłączony i wyczyszczono kolejkę",
        "info",
        browser.id,
      );
    } catch (error) {
      addLog(`✗ Błąd wyłączania: ${error.message}`, "error", browser.id);
    }
    return;
  }

  const isInjected = await injectAutoClicker(browser);
  if (isInjected) {
    const initResult = await initAutoClicker(browser);

    if (initResult === true) {
      // Czekamy na panel rezerwacji
      browser.autoClickerEnabled = true;
      browser.waitingForPanel = true;
      updateAutoClickerButton();
      addLog(
        "⏳ Czekam na panel rezerwacji... Wejdź w panel rezerwacji w serwisie",
        "warning",
        browser.id,
      );
      // Monitoruj pojawienie się panelu
      waitForPanelReady(browser);
    } else if (initResult === false) {
      // Panel istniał i inicjalizacja się powiodła
      browser.autoClickerEnabled = true;
      browser.waitingForPanel = false;
      updateAutoClickerButton();
      updateStatusLight(browser);
      addLog("✅ Auto Clicker włączony i gotowy", "success", browser.id);
    } else {
      // Błąd inicjalizacji
      browser.autoClickerEnabled = false;
      browser.waitingForPanel = false;
      updateAutoClickerButton();
      addLog("✗ Błąd inicjalizacji AutoClickera", "error", browser.id);
    }
  } else {
    browser.autoClickerEnabled = false;
    browser.waitingForPanel = false;
    updateAutoClickerButton();
    updateStatusLight(browser);
  }
});

// ==================== INICJALIZACJA LOG ====================

addLog("🚀 Aplikacja uruchomiona", "success");
addLog(`📍 URL A: ${browsers.a.webview.src}`, "info", "a");
addLog("📍 Przeglądarka B: zamknięta", "info", "b");
if (maxBrowsers >= 4) {
  addLog("📍 Przeglądarka C: zamknięta", "info", "c");
  addLog("📍 Przeglądarka D: zamknięta", "info", "d");
}
addLog(
  "💡 Wskazówka: Użyj toggle isTrusted aby nadpisać właściwość event.isTrusted",
  "info",
);
addLog(
  "🤖 Wskazówka: Kliknij 'Auto Clicker' aby włączyć automatyczne klikanie",
  "info",
);

// Uruchom monitor statusów
startStatusLightMonitor();
