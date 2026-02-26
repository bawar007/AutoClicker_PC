const { contextBridge, ipcRenderer } = require("electron");

// Bezpieczny most między renderer a main process
contextBridge.exposeInMainWorld("electronAPI", {
  // ===== LICENCJA =====
  activateLicense: (key) => ipcRenderer.send("license-activated", key),
  onLicenseError: (callback) =>
    ipcRenderer.on("license-error", (event, error) => callback(error)),
  getLicenseInfo: () => ipcRenderer.invoke("get-license-info"),
  getMachineId: () => ipcRenderer.invoke("get-machine-id"),

  // ===== MANIPULACJA ISTRUSTED =====
  toggleIsTrustedOverride: (enabled) =>
    ipcRenderer.invoke("toggle-istrusted-override", enabled),

  // ===== SYMULACJA PRAWDZIWYCH ZDARZEŃ =====
  simulateRealClick: (x, y) =>
    ipcRenderer.invoke("simulate-real-click", { x, y }),

  // ===== SCENARIUSZE =====
  exportScenario: (scenario) => ipcRenderer.invoke("export-scenario", scenario),
  importScenario: () => ipcRenderer.invoke("import-scenario"),

  // ===== DEVTOOLS =====
  openDevTools: () => ipcRenderer.invoke("open-devtools"),
});
