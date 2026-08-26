const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  activateLicense: (key) => ipcRenderer.send("license-activated", key),
  onLicenseError: (callback) =>
    ipcRenderer.on("license-error", (event, error) => callback(error)),
  onLicenseSuccess: (callback) =>
    ipcRenderer.on("license-success", () => callback()),
  onLicenseUpdated: (callback) =>
    ipcRenderer.on("license-updated", () => callback()),
  getLicenseInfo: () => ipcRenderer.invoke("get-license-info"),
  getMachineId: () => ipcRenderer.invoke("get-machine-id"),
  openLicenseActivation: () => ipcRenderer.send("open-license-activation"),
  openLicenseManager: () => ipcRenderer.send("open-license-manager"),
  revokeLicense: () => ipcRenderer.invoke("revoke-license"),
  toggleIsTrustedOverride: (enabled) =>
    ipcRenderer.invoke("toggle-istrusted-override", enabled),
  simulateRealClick: (x, y) =>
    ipcRenderer.invoke("simulate-real-click", { x, y }),
  openDevTools: () => ipcRenderer.invoke("open-devtools"),
  getAutoClickerScript: () => ipcRenderer.invoke("get-autoclicker-script"),
  listCredentials: () => ipcRenderer.invoke("list-credentials"),
  getCredential: (credential) =>
    ipcRenderer.invoke("get-credential", credential),
  copyCredential: (data) => ipcRenderer.invoke("copy-credential", data),
  saveCredential: (credential) =>
    ipcRenderer.invoke("save-credential", credential),
  deleteCredential: (credential) =>
    ipcRenderer.invoke("delete-credential", credential),
});
