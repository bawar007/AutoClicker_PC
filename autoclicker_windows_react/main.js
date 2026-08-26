const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  safeStorage,
  clipboard,
} = require("electron");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const sharedSourcePath = app.isPackaged
  ? process.resourcesPath
  : path.join(__dirname, "../../src");
const LicenseManager = require(
  path.join(sharedSourcePath, "license", "licenseManager.js"),
);
const LicenseServer = require(
  path.join(sharedSourcePath, "license", "licenseServer.js"),
);

const isDev = process.env.NODE_ENV === "development";

app.setName("WebTestAutomationReact");
app.setPath(
  "userData",
  path.join(app.getPath("appData"), "WebTestAutomationReact"),
);

let mainWindow;
let licenseWindow;
let licenseManager;
let licenseServer;
let cachedAutoClickerScript;

const credentialsFile = () =>
  path.join(app.getPath("userData"), "credentials.json");

function normalizeCredentialHost(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  try {
    return new URL(
      input.includes("://") ? input : `https://${input}`,
    ).hostname.toLowerCase();
  } catch {
    return input
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .split(":")[0]
      .toLowerCase();
  }
}

function readCredentials() {
  try {
    const content = fs.readFileSync(credentialsFile(), "utf8");
    const data = JSON.parse(content);
    if (!Array.isArray(data)) return [];

    let changed = false;
    const entries = data.map((entry) => {
      if (entry.id) return entry;
      changed = true;
      return { ...entry, id: crypto.randomUUID() };
    });
    if (changed) writeCredentials(entries);
    return entries;
  } catch {
    return [];
  }
}

function writeCredentials(entries) {
  fs.mkdirSync(path.dirname(credentialsFile()), { recursive: true });
  fs.writeFileSync(credentialsFile(), JSON.stringify(entries, null, 2), "utf8");
}

function publicCredential(entry) {
  return {
    id: entry.id,
    host: entry.host,
    username: entry.username,
    updatedAt: entry.updatedAt,
  };
}

function createLicenseWindow() {
  if (licenseWindow && !licenseWindow.isDestroyed()) {
    licenseWindow.focus();
    return licenseWindow;
  }

  licenseWindow = new BrowserWindow({
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

  if (isDev) {
    licenseWindow.loadURL("http://localhost:5173?view=activation");
  } else {
    licenseWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      query: { view: "activation" },
    });
  }
  licenseWindow.setMenu(null);

  licenseWindow.on("closed", () => {
    licenseWindow = null;
  });

  return licenseWindow;
}

function createMainWindow() {
  if (!licenseManager.isValid()) {
    createLicenseWindow();
    return null;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webviewTag: true,
      partition: "persist:main",
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  licenseManager = new LicenseManager();
  licenseServer = new LicenseServer(5000);

  try {
    await licenseServer.start();
    console.log("✅ Serwer licencji uruchomiony (React)");
  } catch (error) {
    console.error("❌ Błąd uruchomienia serwera licencji:", error);
  }

  if (licenseManager.isValid()) {
    createMainWindow();
  } else {
    createLicenseWindow();
  }
});

ipcMain.on("license-activated", (event, licenseKey) => {
  const result = licenseManager.activate(licenseKey);

  if (result.success) {
    event.reply("license-success");
    setTimeout(() => {
      BrowserWindow.getAllWindows().forEach((window) => {
        if (window.webContents === event.sender) window.close();
      });

      if (!mainWindow || mainWindow.isDestroyed()) {
        createMainWindow();
      } else {
        mainWindow.webContents.send("license-updated");
        mainWindow.focus();
      }
    }, 1000);
  } else {
    event.reply("license-error", result.error);
  }
});

ipcMain.handle("get-license-info", async () => licenseManager.getLicenseInfo());

ipcMain.on("open-license-activation", () => {
  createLicenseWindow();
});

ipcMain.handle("revoke-license", async () => {
  const result = licenseManager.revoke();

  if (result.success) {
    mainWindow?.webContents?.send("license-updated");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
    createLicenseWindow();
  }

  return result;
});

ipcMain.on("open-license-manager", () => {
  mainWindow?.webContents?.send("show-license-manager-modal");
});

ipcMain.handle("toggle-istrusted-override", async () => ({ success: true }));

ipcMain.handle("simulate-real-click", async (event, { x, y }) => {
  try {
    const webContents = mainWindow.webContents;
    await webContents.debugger.attach("1.3");
    await webContents.debugger.sendCommand("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    await webContents.debugger.sendCommand("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    await webContents.debugger.detach();
    return { success: true, message: "Prawdziwe kliknięcie wykonane" };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-machine-id", async () => ({
  machineId: licenseManager.machineId,
}));

ipcMain.handle("open-devtools", async () => {
  mainWindow?.webContents?.openDevTools();
});

ipcMain.handle("list-credentials", async () =>
  readCredentials().map(publicCredential),
);

ipcMain.handle("get-credential", async (event, data = {}) => {
  const normalizedHost = normalizeCredentialHost(data.host || data);
  const username =
    typeof data === "object" ? String(data.username || "").trim() : "";
  const entry = readCredentials().find(
    (item) =>
      item.host === normalizedHost &&
      (!data.id || item.id === data.id) &&
      (!username || item.username === username),
  );
  if (!entry || !safeStorage.isEncryptionAvailable()) return null;

  try {
    return {
      host: entry.host,
      username: entry.username,
      password: safeStorage.decryptString(
        Buffer.from(entry.password, "base64"),
      ),
    };
  } catch {
    return null;
  }
});

ipcMain.handle("copy-credential", async (event, data = {}) => {
  const normalizedHost = normalizeCredentialHost(data.host);
  const username = String(data.username || "").trim();
  const field = data.field === "password" ? "password" : "username";
  const entry = readCredentials().find(
    (item) =>
      item.host === normalizedHost &&
      item.username === username &&
      (!data.id || item.id === data.id),
  );

  if (!entry) return { success: false, error: "Nie znaleziono konta" };

  try {
    const value =
      field === "password"
        ? safeStorage.decryptString(Buffer.from(entry.password, "base64"))
        : entry.username;
    clipboard.writeText(value);
    return { success: true };
  } catch {
    return { success: false, error: "Nie udało się skopiować danych" };
  }
});

ipcMain.handle("save-credential", async (event, data = {}) => {
  const host = normalizeCredentialHost(data.host);
  const username = String(data.username || "").trim();
  const password = String(data.password || "");
  const overwrite = data.overwrite === true;

  if (!host || !username || !password) {
    return { success: false, error: "Domena, login i hasło są wymagane" };
  }
  if (!safeStorage.isEncryptionAvailable()) {
    return {
      success: false,
      error: "Szyfrowanie systemowe Windows jest niedostępne",
    };
  }

  const entries = readCredentials();
  const existingEntry = entries.find(
    (item) => item.host === host && item.username === username,
  );

  if (existingEntry && !overwrite) {
    return {
      success: false,
      requiresConfirmation: true,
      existingId: existingEntry.id,
      message:
        "Ten login ma już zapisane hasło. Czy chcesz je zmienić używając podanego hasła?",
    };
  }

  if (existingEntry) {
    existingEntry.password = safeStorage
      .encryptString(password)
      .toString("base64");
    existingEntry.updatedAt = new Date().toISOString();
    writeCredentials(entries);
    return { success: true, updated: true };
  }

  entries.push({
    id: crypto.randomUUID(),
    host,
    username,
    password: safeStorage.encryptString(password).toString("base64"),
    updatedAt: new Date().toISOString(),
  });
  writeCredentials(entries);
  return { success: true };
});

ipcMain.handle("delete-credential", async (event, data = {}) => {
  const normalizedHost = normalizeCredentialHost(data.host);
  const username = String(data.username || "").trim();
  const id = String(data.id || "").trim();
  const entries = readCredentials();
  const filtered = entries.filter((item) =>
    id
      ? item.id !== id
      : !(item.host === normalizedHost && item.username === username),
  );
  if (filtered.length !== entries.length) writeCredentials(filtered);
  return { success: true };
});

ipcMain.handle("get-autoclicker-script", async () => {
  if (!cachedAutoClickerScript) {
    cachedAutoClickerScript = fs.readFileSync(
      path.join(sharedSourcePath, "auto-clicker.js"),
      "utf-8",
    );
  }
  return cachedAutoClickerScript;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  licenseServer?.stop();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (licenseManager?.isValid()) {
      createMainWindow();
    } else {
      createLicenseWindow();
    }
  }
});
