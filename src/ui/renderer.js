// ==================== RENDERER.JS ====================
// Logika interfejsu głównego okna aplikacji

const paneA = document.getElementById("pane-a");
const paneB = document.getElementById("pane-b");
const webviewContainer = document.getElementById("webview-container");
const browserButtonA = document.getElementById("browser-a-btn");
const browserButtonB = document.getElementById("browser-b-btn");
const openBrowserBButton = document.getElementById("open-browser-b-btn");
const closeBrowserBButton = document.getElementById("close-browser-b-btn");
const webviewA = document.getElementById("webview-a");
const webviewB = document.getElementById("webview-b");
const urlInputA = document.getElementById("url-input-a");
const urlInputB = document.getElementById("url-input-b");
const goBtnA = document.getElementById("go-btn-a");
const goBtnB = document.getElementById("go-btn-b");
const refreshBtnA = document.getElementById("refresh-btn-a");
const refreshBtnB = document.getElementById("refresh-btn-b");
const toggleIsTrusted = document.getElementById("toggle-istrusted");
const devtoolsBtn = document.getElementById("devtools-btn");
const logsContainer = document.getElementById("logs");
const toggleAutoClickerBtn = document.getElementById("toggle-auto-clicker-btn");
const statusLightA = document.getElementById("status-light-a");
const statusLightB = document.getElementById("status-light-b");

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
};

const browserButtons = {
  a: browserButtonA,
  b: browserButtonB,
};

let activeBrowserId = "a";
let isBrowserBOpen = false;

// ==================== INICJALIZACJA ====================

// Załaduj informacje o licencji
window.electronAPI.getLicenseInfo().then((info) => {
  if (info.valid) {
    document.getElementById("license-key").textContent = info.key;
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
  if (!isBrowserBOpen && activeBrowserId === "b") {
    activeBrowserId = "a";
  }

  Object.values(browsers).forEach((browser) => {
    const isActive = browser.id === activeBrowserId;
    browser.pane.classList.toggle("active-pane", isActive);
    browserButtons[browser.id].classList.toggle("active", isActive);
  });

  toggleIsTrusted.checked = getActiveBrowser().isTrustedEnabled;
  updateAutoClickerButton();

  browserButtons.b.disabled = !isBrowserBOpen;
  paneB.classList.toggle("is-hidden", !isBrowserBOpen);
  webviewContainer.classList.toggle("single-mode", !isBrowserBOpen);
  openBrowserBButton.disabled = isBrowserBOpen;
  closeBrowserBButton.disabled = !isBrowserBOpen;
}

function setActiveBrowser(browserId) {
  if (!browsers[browserId]) return;
  if (browserId === "b" && !isBrowserBOpen) return;
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
  });
});

browserButtons.a.addEventListener("click", () => setActiveBrowser("a"));
browserButtons.b.addEventListener("click", () => setActiveBrowser("b"));
paneA.addEventListener("mousedown", () => setActiveBrowser("a"));
paneB.addEventListener("mousedown", () => setActiveBrowser("b"));

openBrowserBButton.addEventListener("click", () => {
  if (isBrowserBOpen) return;
  isBrowserBOpen = true;
  updateActiveUI();

  const defaultUrl = urlInputB.value.trim();
  if (defaultUrl && webviewB.src === "about:blank") {
    navigate(browsers.b, defaultUrl);
  }

  addLog("✓ Otworzono przegladarke B", "success", "b");
});

closeBrowserBButton.addEventListener("click", () => {
  if (!isBrowserBOpen) return;
  isBrowserBOpen = false;
  browsers.b.isTrustedEnabled = false;
  browsers.b.autoClickerEnabled = false;
  webviewB.src = "about:blank";
  updateActiveUI();
  addLog("✖ Zamknieto przegladarke B", "info", "b");
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
  const statusLight = browser.id === "a" ? statusLightA : statusLightB;
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

function initAutoClicker(browser) {
  try {
    browser.webview.executeJavaScript(`
      if (window.AutoClicker) {
        const result = window.AutoClicker.init();
        // Zwróć wynik inicjalizacji
        result;
      }
    `);
  } catch (error) {
    addLog(`✗ Błąd inicjalizacji: ${error.message}`, "error", browser.id);
  }
}

function waitForPanelReady(browser) {
  // Monitoruj czy panel się pojawił
  let checkCount = 0;
  const maxChecks = 300; // 5 minut (300 x 1000ms)

  const checkPanel = setInterval(() => {
    checkCount++;

    browser.webview
      .executeJavaScript(
        "window.AutoClicker ? window.AutoClicker.waitingForPanel : null",
      )
      .then((waiting) => {
        if (waiting === false) {
          // Panel się pojawił i zainicjalizował!
          clearInterval(checkPanel);
          addLog(
            "✅ Panel rezerwacji znaleziony i AutoClicker zainicjalizowany",
            "success",
            browser.id,
          );
          // UI już powinien być OK bo AutoClicker.init zwrócił true
          updateStatusLight(browser);
        } else if (checkCount >= maxChecks) {
          // Timeout - panel się nie pojawił
          clearInterval(checkPanel);
          browser.autoClickerEnabled = false;
          updateAutoClickerButton();
          addLog(
            "⏱️ Timeout: Panel rezerwacji nie pojawił się w ciągu 5 minut",
            "warning",
            browser.id,
          );
        }
      })
      .catch(() => {
        // Błąd - zignoruj i próbuj dalej
      });
  }, 1000);
}

toggleAutoClickerBtn.addEventListener("click", async () => {
  const browser = getActiveBrowser();

  if (browser.autoClickerEnabled) {
    try {
      await browser.webview.executeJavaScript(`
        if (window.AutoClicker) {
          window.AutoClicker.stop();
          if (window.AutoClicker.clearAllSlots) window.AutoClicker.clearAllSlots();
        }
      `);
      browser.autoClickerEnabled = false;
      browser.waitingForPanel = false;
      updateAutoClickerButton();
      updateStatusLight(browser);
      addLog(
        "⏹️ Auto Clicker wyłączony i wyczyszczono kolejkę",
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
    initAutoClicker(browser);

    // Czekaj aby sprawdzić wynik inicjalizacji
    setTimeout(async () => {
      const initResult = await browser.webview.executeJavaScript(`
        window.AutoClicker ? window.AutoClicker.waitingForPanel : null
      `);

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
    }, 100);
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
addLog("📍 Przegladarka B: zamknieta", "info", "b");
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
