const { app, BrowserWindow, ipcMain, dialog, session } = require("electron");
const fs = require("fs");
const path = require("path");
const LicenseManager = require("./license/licenseManager");

let mainWindow;
let licenseManager;
let cachedAutoClickerAssets;

// Ładowanie wtyczki Chrome
async function loadChromeExtension() {
  const extensionPath = path.join(__dirname, "../chrome-extension");
  const partitions = [
    session.defaultSession,
    session.fromPartition("persist:main"),
    session.fromPartition("persist:browser-a"),
    session.fromPartition("persist:browser-b"),
  ];

  for (const targetSession of partitions) {
    try {
      await targetSession.loadExtension(extensionPath, {
        allowFileAccess: true,
      });
      console.log("Wtyczka Chrome zaladowana:", targetSession.getPartition());
    } catch (error) {
      console.error("Blad ladowania wtyczki:", error);
    }
  }
}

function createLicenseWindow() {
  const licenseWindow = new BrowserWindow({
    width: 500,
    height: 450,
    resizable: false,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  licenseWindow.loadFile("src/ui/license.html");
  licenseWindow.setMenu(null);

  return licenseWindow;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webviewTag: true,
      // Włączenie Chrome Extensions
      partition: "persist:main",
    },
  });

  mainWindow.loadFile("src/ui/index.html");

  // DevTools w trybie dev
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Załaduj wtyczkę Chrome
  // await loadChromeExtension();

  licenseManager = new LicenseManager();

  // Sprawdź licencję
  if (licenseManager.isValid()) {
    createMainWindow();
  } else {
    const licenseWindow = createLicenseWindow();

    // Obsługa aktywacji licencji
    ipcMain.once("license-activated", (event, licenseKey) => {
      const result = licenseManager.activate(licenseKey);

      if (result.success) {
        licenseWindow.close();
        createMainWindow();
      } else {
        event.reply("license-error", result.error);
      }
    });
  }
});

// ==================== IPC HANDLERS ====================

// Informacje o licencji
ipcMain.handle("get-license-info", async () => {
  return licenseManager.getLicenseInfo();
});

// Override isTrusted - wstrzykiwanie skryptu
ipcMain.handle("toggle-istrusted-override", async (event, enabled) => {
  try {
    const webview = mainWindow.webContents;

    if (enabled) {
      // Wstrzyknij skrypt który nadpisuje isTrusted
      await webview.executeJavaScript(`
        (function() {
          // Override dla wszystkich typów eventów
          const eventTypes = ['MouseEvent', 'KeyboardEvent', 'PointerEvent', 'TouchEvent'];
          
          eventTypes.forEach(eventType => {
            if (window[eventType]) {
              Object.defineProperty(window[eventType].prototype, 'isTrusted', {
                get: function() { return true; },
                configurable: true
              });
            }
          });
          
          // Override dla dispatchEvent
          const originalDispatch = EventTarget.prototype.dispatchEvent;
          EventTarget.prototype.dispatchEvent = function(event) {
            Object.defineProperty(event, 'isTrusted', {
              get: () => true,
              configurable: true
            });
            return originalDispatch.call(this, event);
          };
          
          console.log('✓ isTrusted override aktywny - wszystkie eventy będą trusted');
        })();
      `);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Symulacja kliknięcia na poziomie przeglądarki (prawdziwe zdarzenie)
ipcMain.handle("simulate-real-click", async (event, { x, y }) => {
  try {
    const webContents = mainWindow.webContents;

    // Użycie Input.dispatchMouseEvent przez CDP
    await webContents.debugger.attach("1.3");

    await webContents.debugger.sendCommand("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: x,
      y: y,
      button: "left",
      clickCount: 1,
    });

    await webContents.debugger.sendCommand("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: x,
      y: y,
      button: "left",
      clickCount: 1,
    });

    await webContents.debugger.detach();

    return {
      success: true,
      message: "Prawdziwe kliknięcie wykonane (isTrusted=true)",
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export scenariusza
ipcMain.handle("export-scenario", async (event, scenario) => {
  const { filePath } = await dialog.showSaveDialog({
    title: "Zapisz scenariusz",
    defaultPath: "scenario.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });

  if (filePath) {
    const fs = require("fs");
    fs.writeFileSync(filePath, JSON.stringify(scenario, null, 2));
    return { success: true, filePath };
  }
  return { success: false };
});

// Import scenariusza
ipcMain.handle("import-scenario", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: "Wczytaj scenariusz",
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["openFile"],
  });

  if (filePaths && filePaths.length > 0) {
    const fs = require("fs");
    const content = fs.readFileSync(filePaths[0], "utf-8");
    return { success: true, data: JSON.parse(content) };
  }
  return { success: false };
});

// Pobranie ID maszyny
ipcMain.handle("get-machine-id", async () => {
  return { machineId: licenseManager.machineId };
});

// Otwarcie DevTools dla webview
ipcMain.handle("open-devtools", async () => {
  if (mainWindow) {
    mainWindow.webContents.openDevTools();
  }
});

// Wbudowany AutoClicker - assety z folderu chrome-extension
ipcMain.removeHandler("get-autoclicker-assets");
ipcMain.handle("get-autoclicker-assets", async () => {
  if (!cachedAutoClickerAssets) {
    const extensionRoot = path.join(__dirname, "../chrome-extension");
    cachedAutoClickerAssets = {
      script: fs.readFileSync(path.join(extensionRoot, "content.js"), "utf-8"),
      style: fs.readFileSync(path.join(extensionRoot, "style.css"), "utf-8"),
    };
  }

  return cachedAutoClickerAssets;
});
console.log("✓ IPC: get-autoclicker-assets gotowe");

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (licenseManager.isValid()) {
      createMainWindow();
    }
  }
});
