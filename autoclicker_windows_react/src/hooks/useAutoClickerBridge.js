import { useCallback, useEffect, useRef, useState } from "react";

const BROWSER_IDS = ["a", "b", "c", "d"];
const BROWSER_LABELS = { a: "Okno A", b: "Okno B", c: "Okno C", d: "Okno D" };
const API_POLLING_STORAGE_KEY = "autoclicker-windows-api-polling";

const createBrowserFlags = (value) =>
  BROWSER_IDS.reduce((acc, id) => ({ ...acc, [id]: value }), {});

function getSavedPollingIntervals(persistenceEnabled = true) {
  if (!persistenceEnabled) return createBrowserFlags(950);

  try {
    const saved = JSON.parse(
      localStorage.getItem(API_POLLING_STORAGE_KEY) || "null",
    );
    return BROWSER_IDS.reduce(
      (acc, id) => ({
        ...acc,
        [id]: Number.isFinite(Number(saved?.[id]))
          ? Math.max(300, Math.min(10000, Number(saved[id])))
          : 950,
      }),
      {},
    );
  } catch {
    return createBrowserFlags(950);
  }
}

/**
 * Minimalny odpowiednik sekcji AUTO CLICKER z oryginalnego renderer.js:
 * wstrzyknięcie skryptu, init(), oczekiwanie na panel i stop().
 */
export function useAutoClickerBridge({
  webviewRefs,
  addLog,
  notify,
  persistenceEnabled = true,
}) {
  const scriptRef = useRef(null);
  const panelIntervalsRef = useRef({});
  const slotsCountsRef = useRef(
    BROWSER_IDS.reduce((acc, id) => ({ ...acc, [id]: -1 }), {}),
  );
  const captureSeqRef = useRef(
    BROWSER_IDS.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
  );
  const enabledRef = useRef(createBrowserFlags(false));
  const [enabled, setEnabled] = useState(() => createBrowserFlags(false));
  const [waitingForPanel, setWaitingForPanel] = useState(() =>
    createBrowserFlags(false),
  );
  const [status, setStatus] = useState(() => createBrowserFlags("off"));
  const [slotsCount, setSlotsCount] = useState(() => createBrowserFlags(0));
  const [slots, setSlots] = useState(() => createBrowserFlags([]));
  const [apiPollingEnabled, setApiPollingEnabledState] = useState(() =>
    createBrowserFlags(false),
  );
  const [apiPollingIntervalMs, setApiPollingIntervalMsState] = useState(() =>
    getSavedPollingIntervals(persistenceEnabled),
  );
  const startRequestedRef = useRef(createBrowserFlags(false));

  useEffect(() => {
    if (!persistenceEnabled) {
      localStorage.removeItem(API_POLLING_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      API_POLLING_STORAGE_KEY,
      JSON.stringify(apiPollingIntervalMs),
    );
  }, [apiPollingIntervalMs, persistenceEnabled]);

  const setBrowserEnabled = useCallback((id, value) => {
    enabledRef.current = { ...enabledRef.current, [id]: value };
    setEnabled((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setBrowserWaiting = useCallback((id, value) => {
    setWaitingForPanel((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setBrowserStatus = useCallback((id, value) => {
    setStatus((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setBrowserSlotsCount = useCallback((id, value) => {
    setSlotsCount((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setBrowserSlots = useCallback((id, value) => {
    setSlots((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setBrowserApiPollingEnabled = useCallback((id, value) => {
    setApiPollingEnabledState((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setBrowserApiPollingIntervalMs = useCallback((id, value) => {
    setApiPollingIntervalMsState((prev) => ({ ...prev, [id]: value }));
  }, []);

  const clearPanelWait = useCallback((id) => {
    if (panelIntervalsRef.current[id]) {
      clearInterval(panelIntervalsRef.current[id]);
      delete panelIntervalsRef.current[id];
    }
  }, []);

  const getWebview = useCallback(
    (id) => webviewRefs[id]?.current ?? null,
    [webviewRefs],
  );

  const injectAutoClicker = useCallback(
    async (id) => {
      const webview = getWebview(id);
      if (!webview) return false;

      await webview.executeJavaScript(`
        if (typeof window.__AutoClickerTeardown === 'function') {
          try { window.__AutoClickerTeardown(); } catch (e) {}
        }
        if (window.AutoClicker && window.AutoClicker.stop) {
          try { window.AutoClicker.stop(); } catch (e) {}
        }
        delete window.AutoClicker;
        delete window.AutoClickerState;
      `);

      if (!scriptRef.current) {
        scriptRef.current = await window.electronAPI.getAutoClickerScript();
      }

      await webview.executeJavaScript(scriptRef.current);
      await webview.executeJavaScript(`
        (function() {
          const styleId = 'auto-clicker-react-hide-original-panel';
          if (document.getElementById(styleId)) return;
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = '.my-menu-for-slots, .my-menu-for-slots__wraper { display: none !important; visibility: hidden !important; pointer-events: none !important; }';
          document.head.appendChild(style);
        })();
      `);
      addLog("✓ Auto Clicker wstrzyknięty", "success", id);
      return true;
    },
    [addLog, getWebview],
  );

  const initAutoClicker = useCallback(
    async (id) => {
      const webview = getWebview(id);
      if (!webview) return null;

      return webview.executeJavaScript(`
        if (window.AutoClicker) {
          window.AutoClicker.init();
          window.AutoClicker.waitingForPanel;
        } else {
          null;
        }
      `);
    },
    [getWebview],
  );

  const readAutoClickerState = useCallback(
    async (id) => {
      const webview = getWebview(id);
      if (!webview) return null;

      const stateJson = await webview.executeJavaScript(`
        JSON.stringify(window.AutoClickerState || { slotsCount: 0, slots: [], isRunning: false, lastCapturedSlot: null, captureSeq: 0 })
      `);

      return JSON.parse(stateJson);
    },
    [getWebview],
  );

  const inspectAutoClicker = useCallback(
    async (id) => {
      const webview = getWebview(id);
      if (!webview) return { isLoaded: false, isRunning: false, slotsCount: 0 };

      try {
        return await webview.executeJavaScript(`
          (function() {
            if (!window.AutoClicker) return { isLoaded: false, isRunning: false, slotsCount: 0 };
            const state = window.AutoClickerState || { slotsCount: 0 };
            return {
              isLoaded: true,
              isRunning: Boolean(window.AutoClicker.isRunning && window.AutoClicker.isRunning()),
              slotsCount: state.slotsCount || 0,
              waitingForPanel: Boolean(window.AutoClicker.waitingForPanel)
            };
          })()
        `);
      } catch {
        return { isLoaded: false, isRunning: false, slotsCount: 0 };
      }
    },
    [getWebview],
  );

  const refreshBrowserStatus = useCallback(
    async (id) => {
      const webview = getWebview(id);
      if (!webview || !enabledRef.current[id]) {
        setBrowserStatus(id, "off");
        return;
      }

      try {
        const result = await webview.executeJavaScript(`
          (function() {
            if (!window.AutoClicker) return { isRunning: false, isLoaded: false };
            return {
              isRunning: window.AutoClicker.isRunning(),
              isLoaded: true
            };
          })()
        `);

        if (result.isRunning) {
          setBrowserStatus(id, "running");
        } else if (result.isLoaded) {
          setBrowserStatus(id, "loading");
        } else {
          setBrowserStatus(id, "off");
        }
      } catch {
        setBrowserStatus(id, "off");
      }
    },
    [getWebview, setBrowserStatus],
  );

  const startWindowAutoClicker = useCallback(
    async (id) => {
      const webview = getWebview(id);
      if (!webview) return false;

      const result = await webview.executeJavaScript(`
        (async function() {
          if (!window.AutoClicker) return { started: false, reason: 'not-loaded' };
          const slots = window.AutoClicker.getSlots ? window.AutoClicker.getSlots() : [];
          if (!slots || slots.length === 0) return { started: false, reason: 'no-slots' };
          await window.AutoClicker.start();
          return {
            started: Boolean(window.AutoClicker.isRunning && window.AutoClicker.isRunning()),
            slotsCount: slots.length
          };
        })()
      `);

      if (result?.started) {
        setBrowserStatus(id, "running");
        addLog("✅ Auto Clicker rozpoczął klikanie", "success", id);
        notify({
          title: BROWSER_LABELS[id],
          message: "Auto-click w trakcie...",
          type: "success",
          browserId: id,
        });
        return true;
      }

      if (result?.reason === "no-slots") {
        addLog("✗ Musisz wybrać przynajmniej jeden slot", "warning", id);
        notify({
          title: BROWSER_LABELS[id],
          message: "Najpierw wybierz slot do klikania",
          type: "warning",
          browserId: id,
        });
      }

      return false;
    },
    [addLog, getWebview, notify, setBrowserStatus],
  );

  const applyApiPollingSetting = useCallback(
    async (id) => {
      const webview = getWebview(id);
      if (!webview) return;

      const requestedInterval = Number(apiPollingIntervalMs[id]);
      const safeInterval = Number.isFinite(requestedInterval)
        ? Math.max(300, Math.min(10000, Math.round(requestedInterval)))
        : 950;
      if (safeInterval !== apiPollingIntervalMs[id]) {
        setBrowserApiPollingIntervalMs(id, safeInterval);
      }

      try {
        const result = await webview.executeJavaScript(`
          (function() {
            if (!window.AutoClicker || !window.AutoClicker.setApiPollingEnabled || !window.AutoClicker.setApiPollingInterval) {
              return { enabled: false, hasCapturedApiRequest: false, unsupported: true };
            }
            window.AutoClicker.setApiPollingInterval(${safeInterval});
            return window.AutoClicker.setApiPollingEnabled(${apiPollingEnabled[id] ? "true" : "false"});
          })()
        `);

        if (result?.unsupported) {
          addLog(
            "⚠️ Ten AutoClicker nie wspiera jeszcze API polling",
            "warning",
            id,
          );
          return;
        }

        if (apiPollingEnabled[id]) {
          if (result?.hasCapturedApiRequest) {
            addLog(
              "✓ API polling aktywny (sygnatura requestu wykryta)",
              "info",
              id,
            );
          } else {
            addLog(
              "⏳ API polling aktywny, czekam na wykrycie requestu slotów",
              "info",
              id,
            );
          }
        } else {
          addLog("✓ API polling wyłączony (tryb refresh UI)", "info", id);
        }
      } catch (error) {
        addLog(
          `✗ Nie udało się ustawić API polling: ${error.message}`,
          "error",
          id,
        );
      }
    },
    [
      addLog,
      apiPollingEnabled,
      apiPollingIntervalMs,
      getWebview,
      setBrowserApiPollingIntervalMs,
    ],
  );

  const setApiPollingInterval = useCallback(
    async (id, value) => {
      const parsed = Number(value);
      const safeInterval = Number.isFinite(parsed)
        ? Math.max(300, Math.min(10000, Math.round(parsed)))
        : 950;

      setBrowserApiPollingIntervalMs(id, safeInterval);

      const webview = getWebview(id);
      if (!webview) {
        addLog(
          `✓ Zapisano interwał API polling: ${safeInterval} ms (zostanie zastosowany po włączeniu Auto Clickera)`,
          "info",
          id,
        );
        return { success: true, pending: true, intervalMs: safeInterval };
      }

      try {
        const result = await webview.executeJavaScript(`
          (function() {
            if (!window.AutoClicker || !window.AutoClicker.setApiPollingInterval) {
              return { available: false };
            }
            return window.AutoClicker.setApiPollingInterval(${safeInterval});
          })()
        `);

        if (result?.available === false) {
          addLog(
            `✓ Zapisano interwał API polling: ${safeInterval} ms (zostanie zastosowany po włączeniu Auto Clickera)`,
            "info",
            id,
          );
          return { success: true, pending: true, intervalMs: safeInterval };
        }

        addLog(
          `✓ Ustawiono interwał API polling: ${safeInterval} ms`,
          "info",
          id,
        );
        return { success: true, intervalMs: safeInterval };
      } catch (error) {
        addLog(
          `✗ Błąd ustawiania interwału API polling: ${error.message}`,
          "error",
          id,
        );
        return { success: false, error: error.message };
      }
    },
    [addLog, getWebview, setBrowserApiPollingIntervalMs],
  );

  const toggleApiPolling = useCallback(
    async (id, value) => {
      setBrowserApiPollingEnabled(id, value);

      const requestedInterval = Number(apiPollingIntervalMs[id]);
      const safeInterval = Number.isFinite(requestedInterval)
        ? Math.max(300, Math.min(10000, Math.round(requestedInterval)))
        : 950;
      if (safeInterval !== apiPollingIntervalMs[id]) {
        setBrowserApiPollingIntervalMs(id, safeInterval);
      }

      const webview = getWebview(id);
      if (!webview) return;

      try {
        const result = await webview.executeJavaScript(`
          (function() {
            if (!window.AutoClicker || !window.AutoClicker.setApiPollingEnabled || !window.AutoClicker.setApiPollingInterval) {
              return { enabled: false, hasCapturedApiRequest: false, unsupported: true };
            }
            window.AutoClicker.setApiPollingInterval(${safeInterval});
            return window.AutoClicker.setApiPollingEnabled(${value ? "true" : "false"});
          })()
        `);

        if (result?.unsupported) {
          addLog(
            "⚠️ Ten AutoClicker nie wspiera jeszcze API polling",
            "warning",
            id,
          );
          return;
        }

        if (value) {
          addLog("✓ Włączono API polling dla okna", "success", id);
          if (!result?.hasCapturedApiRequest) {
            addLog("⏳ Czekam na przechwycenie requestu slotów", "info", id);
          }
        } else {
          addLog("✓ Wyłączono API polling dla okna", "info", id);
        }
      } catch (error) {
        addLog(
          `✗ Błąd przełączania API polling: ${error.message}`,
          "error",
          id,
        );
      }
    },
    [
      addLog,
      apiPollingIntervalMs,
      getWebview,
      setBrowserApiPollingEnabled,
      setBrowserApiPollingIntervalMs,
    ],
  );

  const monitorBrowserSlots = useCallback(
    async (id) => {
      if (!enabledRef.current[id]) return;

      try {
        const state = await readAutoClickerState(id);
        if (!state) return;

        setBrowserSlotsCount(id, state.slotsCount || 0);
        setBrowserSlots(id, Array.isArray(state.slots) ? state.slots : []);

        if ((state.captureSeq || 0) > captureSeqRef.current[id]) {
          captureSeqRef.current = {
            ...captureSeqRef.current,
            [id]: state.captureSeq || 0,
          };

          const capturedSlot = state.lastCapturedSlot;
          addLog(
            capturedSlot?.time
              ? `✓ Okienko złapane na godz. ${capturedSlot.time}`
              : "✓ Okienko złapane",
            "success",
            id,
          );
          notify({
            title: BROWSER_LABELS[id],
            message: capturedSlot?.time
              ? `Okienko złapane na godz. ${capturedSlot.time}`
              : "Okienko złapane",
            type: "success",
            browserId: id,
          });
        }

        if (state.slotsCount !== slotsCountsRef.current[id]) {
          const previousCount = slotsCountsRef.current[id];
          slotsCountsRef.current = {
            ...slotsCountsRef.current,
            [id]: state.slotsCount,
          };

          if (state.slotsCount > 0) {
            addLog(
              state.slotsCount === 1
                ? "✓ Wybrany 1 slot do klikania"
                : `✓ Wybranych ${state.slotsCount} slotów do klikania`,
              "info",
              id,
            );
          } else if (state.slotsCount === 0 && previousCount > 0) {
            addLog("✓ Wyczyszczono sloty", "info", id);
            notify({
              title: BROWSER_LABELS[id],
              message: "Wyczyszczono wybrane sloty",
              type: "info",
              browserId: id,
            });
          }
        }
      } catch {}
    },
    [
      addLog,
      notify,
      readAutoClickerState,
      setBrowserSlots,
      setBrowserSlotsCount,
    ],
  );

  const waitForPanelReady = useCallback(
    (id) => {
      const webview = getWebview(id);
      if (!webview) return;

      clearPanelWait(id);

      let checkCount = 0;
      const maxChecks = 600;
      panelIntervalsRef.current[id] = setInterval(() => {
        checkCount++;
        webview
          .executeJavaScript(
            "window.AutoClicker ? window.AutoClicker.waitingForPanel : 'undefined'",
          )
          .then((waiting) => {
            if (!enabledRef.current[id]) {
              clearPanelWait(id);
              return;
            }

            if (waiting === false) {
              clearPanelWait(id);
              setBrowserWaiting(id, false);
              setBrowserStatus(id, "loading");
              addLog(
                "✅ Panel rezerwacji znaleziony! AutoClicker gotowy do pracy",
                "success",
                id,
              );
              notify({
                title: BROWSER_LABELS[id],
                message:
                  "Panel rezerwacji znaleziony. AutoClicker gotowy do pracy",
                type: "success",
                browserId: id,
              });
            } else if (checkCount >= maxChecks) {
              clearPanelWait(id);
              setBrowserEnabled(id, false);
              setBrowserWaiting(id, false);
              setBrowserStatus(id, "off");
              addLog(
                "⏱️ Timeout: Panel rezerwacji nie pojawił się. Wyłączyłem AutoClicker",
                "warning",
                id,
              );
              notify({
                title: BROWSER_LABELS[id],
                message:
                  "Timeout: panel rezerwacji nie pojawił się. AutoClicker wyłączony",
                type: "warning",
                browserId: id,
              });
            }
          })
          .catch(() => {});
      }, 500);
    },
    [
      addLog,
      clearPanelWait,
      getWebview,
      setBrowserEnabled,
      setBrowserStatus,
      setBrowserWaiting,
      notify,
    ],
  );

  const stopAutoClicker = useCallback(
    async (id) => {
      const webview = getWebview(id);
      const wasWaiting = waitingForPanel[id];

      clearPanelWait(id);
      if (webview) {
        await webview.executeJavaScript(`
          if (window.AutoClicker) {
            window.AutoClicker.stop();
          }
        `);
      }

      setBrowserEnabled(id, false);
      setBrowserWaiting(id, false);
      setBrowserStatus(id, "off");
      startRequestedRef.current = { ...startRequestedRef.current, [id]: false };
      captureSeqRef.current = { ...captureSeqRef.current, [id]: 0 };
      addLog(
        wasWaiting
          ? "⏹️ Przerwane przez użytkownika (oczekiwanie na panel anulowane)"
          : "⏹️ Auto Clicker wyłączony",
        "info",
        id,
      );
      notify({
        title: BROWSER_LABELS[id],
        message: wasWaiting
          ? "Przerwano oczekiwanie na panel rezerwacji"
          : "Wyłączono Auto Clicker",
        type: "info",
        browserId: id,
      });
    },
    [
      addLog,
      clearPanelWait,
      getWebview,
      setBrowserEnabled,
      setBrowserStatus,
      setBrowserWaiting,
      startWindowAutoClicker,
      notify,
      waitingForPanel,
    ],
  );

  const startAutoClicker = useCallback(
    async (id) => {
      try {
        startRequestedRef.current = {
          ...startRequestedRef.current,
          [id]: false,
        };
        const injected = await injectAutoClicker(id);
        if (!injected) return;
        await applyApiPollingSetting(id);

        const initResult = await initAutoClicker(id);
        setBrowserEnabled(id, true);
        setBrowserStatus(id, "loading");
        notify({
          title: BROWSER_LABELS[id],
          message: "Włączono Auto Clicker",
          type: "success",
          browserId: id,
        });

        if (initResult === true) {
          setBrowserWaiting(id, true);
          addLog(
            "⏳ Czekam na panel rezerwacji... Wejdź w panel rezerwacji w serwisie",
            "warning",
            id,
          );
          notify({
            title: BROWSER_LABELS[id],
            message: "Czekam na panel rezerwacji",
            type: "warning",
            browserId: id,
          });
          waitForPanelReady(id);
        } else if (initResult === false) {
          setBrowserWaiting(id, false);
          addLog("✅ Auto Clicker włączony i gotowy", "success", id);
          notify({
            title: BROWSER_LABELS[id],
            message: "Auto Clicker gotowy do pracy",
            type: "success",
            browserId: id,
          });
        } else {
          setBrowserEnabled(id, false);
          setBrowserWaiting(id, false);
          setBrowserStatus(id, "off");
          addLog("✗ Błąd inicjalizacji AutoClickera", "error", id);
          notify({
            title: BROWSER_LABELS[id],
            message: "Błąd inicjalizacji AutoClickera",
            type: "error",
            browserId: id,
          });
        }
      } catch (error) {
        setBrowserEnabled(id, false);
        setBrowserWaiting(id, false);
        setBrowserStatus(id, "off");
        addLog(`✗ Błąd AutoClickera: ${error.message}`, "error", id);
        notify({
          title: BROWSER_LABELS[id],
          message: `Błąd AutoClickera: ${error.message}`,
          type: "error",
          browserId: id,
        });
      }
    },
    [
      addLog,
      applyApiPollingSetting,
      initAutoClicker,
      injectAutoClicker,
      setBrowserEnabled,
      setBrowserWaiting,
      waitForPanelReady,
      setBrowserStatus,
      startWindowAutoClicker,
      notify,
    ],
  );

  const reinitializeAfterNavigation = useCallback(
    (id) => {
      if (!enabledRef.current[id]) return;

      setTimeout(async () => {
        if (!enabledRef.current[id]) return;

        try {
          const inspection = await inspectAutoClicker(id);
          if (inspection.isLoaded) {
            await applyApiPollingSetting(id);
            if (inspection.isRunning) {
              setBrowserStatus(id, "running");
            } else if (
              inspection.waitingForPanel ||
              inspection.slotsCount > 0
            ) {
              setBrowserStatus(id, "loading");
            }
            monitorBrowserSlots(id);
            return;
          }

          addLog(
            "AutoClicker nie istnieje po nawigacji, wstrzykuję ponownie...",
            "info",
            id,
          );
          const injected = await injectAutoClicker(id);
          if (!injected) return;
          await applyApiPollingSetting(id);

          const initResult = await initAutoClicker(id);
          if (initResult === true) {
            setBrowserWaiting(id, true);
            setBrowserStatus(id, "loading");
            addLog(
              "⏳ AutoClicker czeka na panel rezerwacji (po nawigacji)",
              "warning",
              id,
            );
            waitForPanelReady(id);
          } else if (initResult === false) {
            setBrowserWaiting(id, false);
            setBrowserStatus(id, "loading");
            addLog(
              "✅ AutoClicker reinicjalizowany (panel znaleziony)",
              "success",
              id,
            );
          }
        } catch (error) {
          addLog(
            `✗ Błąd reinicjalizacji AutoClickera: ${error.message}`,
            "error",
            id,
          );
        }
      }, 500);
    },
    [
      addLog,
      applyApiPollingSetting,
      inspectAutoClicker,
      initAutoClicker,
      injectAutoClicker,
      monitorBrowserSlots,
      setBrowserStatus,
      setBrowserWaiting,
      waitForPanelReady,
    ],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      BROWSER_IDS.forEach((id) => {
        if (enabledRef.current[id]) {
          refreshBrowserStatus(id);
          monitorBrowserSlots(id);
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [monitorBrowserSlots, refreshBrowserStatus]);

  const toggleAutoClicker = useCallback(
    (id) => {
      if (enabled[id] && (status[id] === "running" || waitingForPanel[id])) {
        return stopAutoClicker(id);
      }

      if (enabled[id]) {
        return startWindowAutoClicker(id);
      }

      return startAutoClicker(id);
    },
    [
      enabled,
      startAutoClicker,
      startWindowAutoClicker,
      status,
      stopAutoClicker,
      waitingForPanel,
    ],
  );

  return {
    enabled,
    waitingForPanel,
    status,
    slotsCount,
    slots,
    apiPollingEnabled,
    apiPollingIntervalMs,
    toggleAutoClicker,
    toggleApiPolling,
    setApiPollingInterval,
    reinitializeAfterNavigation,
  };
}
