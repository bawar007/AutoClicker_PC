import { useEffect, useState, useRef } from "react";
import LicenseActivationPage from "./components/LicenseActivationPage.jsx";
import LicenseManagerModal from "./components/LicenseManagerModal.jsx";
import Notifications from "./components/Notifications.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import Sidebar from "./components/Sidebar.jsx";
import WebviewGrid from "./components/WebviewGrid.jsx";
import { useAutoClickerBridge } from "./hooks/useAutoClickerBridge.js";
import { useBrowsersState } from "./hooks/useBrowsersState.js";
import { useCredentialsManager } from "./hooks/useCredentialsManager.js";
import { useIsTrustedOverride } from "./hooks/useIsTrustedOverride.js";
import { useLogs } from "./hooks/useLogs.js";
import { useNotifications } from "./hooks/useNotifications.js";

const PERSISTENCE_STORAGE_KEY = "autoclicker-windows-persistence-enabled";
const PROFILES_STORAGE_KEY = "autoclicker-windows-profiles";
const THEME_STORAGE_KEY = "autoclicker-windows-theme";

function getPersistencePreference() {
  return localStorage.getItem(PERSISTENCE_STORAGE_KEY) !== "disabled";
}

function getLogsVisibilityPreference() {
  return localStorage.getItem("autoclicker-windows-show-logs") !== "hidden";
}

function getSavedProfiles() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(PROFILES_STORAGE_KEY) || "[]",
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getThemePreference() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return ["system", "dark", "light"].includes(savedTheme)
    ? savedTheme
    : "system";
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");

  const [persistenceEnabled, setPersistenceEnabled] = useState(
    getPersistencePreference,
  );
  const browsers = useBrowsersState({ persistenceEnabled });
  const { logs, addLog, clearLogs } = useLogs();
  const { notifications, notify, dismissNotification } = useNotifications();
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [isLicenseModalOpen, setLicenseModalOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(getLogsVisibilityPreference);
  const [webviewErrors, setWebviewErrors] = useState({});
  const [pageStatuses, setPageStatuses] = useState({
    a: "loading",
    b: "loading",
    c: "loading",
    d: "loading",
  });
  const [profiles, setProfiles] = useState(getSavedProfiles);
  const [themePreference, setThemePreference] = useState(getThemePreference);

  const webviewRefs = {
    a: useRef(null),
    b: useRef(null),
    c: useRef(null),
    d: useRef(null),
  };
  const slotsClearedAtStartupRef = useRef({
    a: false,
    b: false,
    c: false,
    d: false,
  });
  const autoClicker = useAutoClickerBridge({
    webviewRefs,
    addLog,
    notify,
    persistenceEnabled,
  });
  const credentials = useCredentialsManager({ webviewRefs, addLog, notify });
  const trustedOverride = useIsTrustedOverride({ webviewRefs, addLog });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => {
      document.documentElement.dataset.theme =
        themePreference === "system"
          ? mediaQuery.matches
            ? "light"
            : "dark"
          : themePreference;
    };

    applyTheme();
    if (themePreference === "system") {
      mediaQuery.addEventListener("change", applyTheme);
    }
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [themePreference]);

  if (view === "activation") {
    return <LicenseActivationPage />;
  }

  useEffect(() => {
    const loadLicenseInfo = (info) => {
      setLicenseInfo(info);
      if (info.isActive) {
        browsers.setMaxBrowsers(4);
        addLog("✅ Widok React - dostępne 4 kafelki przeglądarek", "success");
      }
    };

    window.electronAPI?.getLicenseInfo().then(loadLicenseInfo);
    window.electronAPI?.onLicenseUpdated?.(() => {
      window.electronAPI.getLicenseInfo().then(loadLicenseInfo);
    });
    addLog("🚀 Aplikacja uruchomiona (szkielet React)", "success");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDevTools = () => {
    const activeWebview = webviewRefs[browsers.state.activeBrowserId]?.current;
    activeWebview?.openDevTools?.();
    addLog(
      "🔧 DevTools otwarte dla WebView",
      "info",
      browsers.state.activeBrowserId,
    );
  };

  const refreshLicenseInfo = () => {
    return window.electronAPI.getLicenseInfo().then(setLicenseInfo);
  };

  const handleOpenActivation = () => {
    window.electronAPI.openLicenseActivation();
  };

  const handlePersistenceChange = (enabled) => {
    setPersistenceEnabled(enabled);
    localStorage.setItem(
      PERSISTENCE_STORAGE_KEY,
      enabled ? "enabled" : "disabled",
    );
  };

  const handleLogsVisibilityChange = (visible) => {
    setShowLogs(visible);
    localStorage.setItem(
      "autoclicker-windows-show-logs",
      visible ? "visible" : "hidden",
    );
  };

  const handleThemeChange = (theme) => {
    setThemePreference(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  const saveProfile = (name) => {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      notify({
        title: "Profil pracy",
        message: "Podaj nazwę profilu",
        type: "warning",
      });
      return;
    }

    const profile = {
      name: normalizedName,
      activeBrowserId: browsers.state.activeBrowserId,
      open: browsers.state.open,
      browserOrder: browsers.state.browserOrder,
      urlInputValues: browsers.state.urlInputValues,
    };
    setProfiles((previous) => {
      const next = [
        ...previous.filter((item) => item.name !== normalizedName),
        profile,
      ];
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    notify({
      title: "Profil pracy",
      message: `Zapisano profil „${normalizedName}”`,
      type: "success",
    });
  };

  const loadProfile = (profile) => {
    browsers.loadLayout(profile);
    notify({
      title: "Profil pracy",
      message: `Wczytano profil „${profile.name}”`,
      type: "success",
    });
  };

  const deleteProfile = (name) => {
    setProfiles((previous) => {
      const next = previous.filter((item) => item.name !== name);
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    notify({
      title: "Profil pracy",
      message: `Usunięto profil „${name}”`,
      type: "info",
    });
  };

  const exportProfiles = () => {
    const content = JSON.stringify(profiles, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([content], { type: "application/json" }),
    );
    link.download = "autoclicker-profile.json";
    link.click();
    URL.revokeObjectURL(link.href);
    notify({
      title: "Profile pracy",
      message: "Profile wyeksportowane do pliku JSON",
      type: "success",
    });
  };

  const importProfiles = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error("invalid");
        const validProfiles = imported.filter(
          (profile) =>
            profile &&
            typeof profile.name === "string" &&
            profile.open &&
            profile.urlInputValues,
        );
        if (validProfiles.length === 0) throw new Error("empty");
        setProfiles((previous) => {
          const merged = [...previous];
          validProfiles.forEach((profile) => {
            const index = merged.findIndex(
              (item) => item.name === profile.name,
            );
            if (index >= 0) merged[index] = profile;
            else merged.push(profile);
          });
          localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
        notify({
          title: "Profile pracy",
          message: `Zaimportowano ${validProfiles.length} profili`,
          type: "success",
        });
      } catch {
        notify({
          title: "Profile pracy",
          message: "Nieprawidłowy plik profili",
          type: "error",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleRevokeLicense = async () => {
    const result = await window.electronAPI.revokeLicense();
    if (result?.success) {
      addLog("✓ Licencja usunięta", "success");
      await refreshLicenseInfo();
    } else {
      addLog(
        `✗ Błąd usuwania licencji: ${result?.error ?? "nieznany"}`,
        "error",
      );
    }
  };

  useEffect(() => {
    const cleanups = Object.entries(webviewRefs).map(([id, ref]) => {
      const webview = ref.current;
      if (!webview) return null;

      const handleDomReady = () => {
        addLog("✓ DOM załadowany", "success", id);
        setPageStatuses((previous) => ({ ...previous, [id]: "online" }));
        setWebviewErrors((previous) => ({ ...previous, [id]: "" }));
        if (slotsClearedAtStartupRef.current[id]) return;
        slotsClearedAtStartupRef.current[id] = true;
        webview
          .executeJavaScript(
            `
            localStorage.removeItem("myData");
            if (window.AutoClicker?.clearAllSlots) {
              window.AutoClicker.clearAllSlots();
            }
          `,
          )
          .catch(() => {});
      };
      const handleDidStartLoading = () => {
        setPageStatuses((previous) => ({ ...previous, [id]: "loading" }));
      };
      const handleDidNavigate = (event) => {
        browsers.setUrlInputValue(id, event.url);
        addLog(`Załadowano: ${event.url}`, "success", id);
        trustedOverride.reapplyIfEnabled(id);
        autoClicker.reinitializeAfterNavigation(id);
      };
      const handleConsoleMessage = (event) =>
        addLog(`[WebView Console] ${event.message}`, "info", id);
      const handleDidFailLoad = (event) => {
        if (event.errorCode !== -3) {
          setPageStatuses((previous) => ({ ...previous, [id]: "error" }));
          setWebviewErrors((previous) => ({
            ...previous,
            [id]: event.errorDescription || "Nie udało się załadować strony",
          }));
          addLog(`✗ Błąd ładowania: ${event.errorDescription}`, "error", id);
        }
      };

      webview.addEventListener("dom-ready", handleDomReady);
      webview.addEventListener("did-start-loading", handleDidStartLoading);
      webview.addEventListener("did-navigate", handleDidNavigate);
      webview.addEventListener("console-message", handleConsoleMessage);
      webview.addEventListener("did-fail-load", handleDidFailLoad);

      return () => {
        webview.removeEventListener("dom-ready", handleDomReady);
        webview.removeEventListener("did-start-loading", handleDidStartLoading);
        webview.removeEventListener("did-navigate", handleDidNavigate);
        webview.removeEventListener("console-message", handleConsoleMessage);
        webview.removeEventListener("did-fail-load", handleDidFailLoad);
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyboardShortcut = (event) => {
      if (event.key === "Escape") {
        if (browsers.state.focusedBrowserId) {
          event.preventDefault();
          browsers.exitFocusMode();
        }
        return;
      }

      if (!event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
        return;
      }

      const target = event.target;
      const isTextField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable;
      if (isTextField) return;

      const browserIndex = Number(event.key) - 1;
      const browserId = ["a", "b", "c", "d"][browserIndex];
      if (!browserId || !browsers.isBrowserOpen(browserId)) return;

      event.preventDefault();
      browsers.setActiveBrowser(browserId);
      if (browsers.state.focusedBrowserId) {
        browsers.enterFocusMode(browserId);
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, [browsers]);

  return (
    <>
      <div className="header">
        <h1>AutoClicker Windows</h1>
        <div className="license-info">
          <div className="status-indicator"></div>
          <span>
            Licencja:{" "}
            {licenseInfo?.licenseKey ?? licenseInfo?.key ?? "Ładowanie..."}
          </span>
          <span className="license-badge">AKTYWNA</span>
          <button
            className="settings-header-button"
            type="button"
            title="Otwórz ustawienia aplikacji"
            onClick={() => setSettingsOpen(true)}
          >
            ⚙️ Ustawienia
          </button>
        </div>
      </div>

      <div className="main-container">
        <Sidebar
          browsers={browsers}
          licenseInfo={licenseInfo}
          autoClicker={autoClicker}
          logs={logs}
          onClearLogs={clearLogs}
          showLogs={showLogs}
          onOpenSettings={() => setSettingsOpen(true)}
          persistenceEnabled={persistenceEnabled}
        />
        <WebviewGrid
          browsers={browsers}
          autoClicker={autoClicker}
          webviewRefs={webviewRefs}
          notify={notify}
          webviewErrors={webviewErrors}
          pageStatuses={pageStatuses}
          onClearWebviewError={(id) =>
            setWebviewErrors((previous) => ({ ...previous, [id]: "" }))
          }
        />
      </div>

      <LicenseManagerModal
        isOpen={isLicenseModalOpen}
        licenseInfo={licenseInfo}
        onClose={() => setLicenseModalOpen(false)}
        onRefresh={refreshLicenseInfo}
        onOpenActivation={handleOpenActivation}
        onRevoke={handleRevokeLicense}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        activeBrowserId={browsers.state.activeBrowserId}
        trustedOverride={trustedOverride}
        credentials={credentials.credentials}
        onSaveCredential={credentials.saveCredential}
        onDeleteCredential={credentials.deleteCredential}
        onCopyCredential={credentials.copyCredential}
        onOpenLicenseManager={() => {
          setSettingsOpen(false);
          setLicenseModalOpen(true);
        }}
        onOpenDevTools={handleOpenDevTools}
        onClose={() => setSettingsOpen(false)}
        persistenceEnabled={persistenceEnabled}
        onPersistenceChange={handlePersistenceChange}
        showLogs={showLogs}
        onLogsVisibilityChange={handleLogsVisibilityChange}
        profiles={profiles}
        onSaveProfile={saveProfile}
        onLoadProfile={loadProfile}
        onDeleteProfile={deleteProfile}
        onExportProfiles={exportProfiles}
        onImportProfiles={importProfiles}
        themePreference={themePreference}
        onThemeChange={handleThemeChange}
        licenseInfo={licenseInfo}
        onRefreshLicense={refreshLicenseInfo}
        onOpenLicenseActivation={() => {
          setSettingsOpen(false);
          handleOpenActivation();
        }}
        onRevokeLicense={handleRevokeLicense}
      />
      <Notifications
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </>
  );
}
