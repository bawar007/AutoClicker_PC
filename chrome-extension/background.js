chrome.runtime.onInstalled.addListener(async (tab) => {
  chrome.storage.local.get("storedId", (result) => {
    if (!result.storedId) {
      const storedId = crypto.randomUUID(); // Generowanie ID tylko jeśli nie istnieje

      chrome.storage.local.set({ storedId }, () => {});
    }
  });
});
