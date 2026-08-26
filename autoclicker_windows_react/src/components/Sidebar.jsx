import { BROWSER_IDS } from "../hooks/useBrowsersState.js";
import { useEffect, useState } from "react";
import AutoClickerPanel from "./AutoClickerPanel.jsx";
import LogsPanel from "./LogsPanel.jsx";

const LABELS = { a: "A", b: "B", c: "C", d: "D" };

const STATUS_LABELS = {
  off: "Wyłączony",
  loading: "Ładowanie",
  running: "Działa",
  ready: "Gotowy",
  waiting: "Oczekiwanie",
};

export default function Sidebar({
  browsers,
  licenseInfo,
  autoClicker,
  logs,
  onOpenSettings,
  persistenceEnabled,
  showLogs = true,
  onClearLogs,
}) {
  const { state, isBrowserOpen, setActiveBrowser } = browsers;
  const [isCollapsed, setIsCollapsed] = useState(
    () =>
      persistenceEnabled &&
      localStorage.getItem("autoclicker-windows-sidebar") === "collapsed",
  );
  const [draggedBrowserId, setDraggedBrowserId] = useState(null);
  const [dragOverBrowserId, setDragOverBrowserId] = useState(null);

  useEffect(() => {
    if (!persistenceEnabled) {
      localStorage.removeItem("autoclicker-windows-sidebar");
      return;
    }

    localStorage.setItem(
      "autoclicker-windows-sidebar",
      isCollapsed ? "collapsed" : "expanded",
    );
  }, [isCollapsed, persistenceEnabled]);

  const expandPanel = () => setIsCollapsed(false);
  const runActiveBrowsers = () => {
    BROWSER_IDS.filter(
      (id) => isBrowserOpen(id) && !autoClicker.enabled[id],
    ).forEach((id) => autoClicker.toggleAutoClicker(id));
  };
  const stopRunningBrowsers = () => {
    BROWSER_IDS.filter(
      (id) => isBrowserOpen(id) && autoClicker.enabled[id],
    ).forEach((id) => autoClicker.toggleAutoClicker(id));
  };

  return (
    <aside className={`sidebar${isCollapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar-rail">
        <button
          className="sidebar-rail__button"
          type="button"
          title="Rozwiń panel kontrolny"
          onClick={expandPanel}
        >
          ⚙️
        </button>
        <button
          className="sidebar-rail__button"
          type="button"
          title="Aktywna przeglądarka"
          onClick={expandPanel}
        >
          🧭
        </button>
        <button
          className="sidebar-rail__button"
          type="button"
          title="Auto Clicker"
          onClick={expandPanel}
        >
          🤖
        </button>
        <button
          className="sidebar-rail__button"
          type="button"
          title="Ustawienia aplikacji"
          onClick={onOpenSettings}
        >
          🔐
        </button>
      </div>

      <div className="sidebar-content">
        <button
          className="sidebar-collapse-button"
          type="button"
          title="Zwiń panel kontrolny"
          onClick={() => setIsCollapsed(true)}
        >
          «
        </button>
        <h2>⚙️ Panel Kontrolny</h2>

        <div className="control-section browser-overview">
          <div className="browser-overview__heading">
            <h3>📋 Stan wszystkich kart</h3>
            <div className="browser-overview__bulk-actions">
              <button
                className="browser-overview__bulk-btn browser-overview__bulk-btn--start"
                type="button"
                title="Uruchom Auto Clicker na aktywnych kartach"
                onClick={runActiveBrowsers}
              >
                Uruchom aktywne
              </button>
              <button
                className="browser-overview__bulk-btn browser-overview__bulk-btn--stop"
                type="button"
                title="Zatrzymaj aktywne Auto Clickery"
                onClick={stopRunningBrowsers}
              >
                Zatrzymaj aktywne
              </button>
            </div>
          </div>
          <div className="browser-overview__list">
            {state.browserOrder.map((id) => {
              const open = isBrowserOpen(id);
              const status = !open
                ? "unavailable"
                : autoClicker.waitingForPanel[id]
                  ? "waiting"
                  : autoClicker.status[id] === "running"
                    ? "running"
                    : autoClicker.enabled[id]
                      ? "ready"
                      : "off";
              const statusLabel = open
                ? (STATUS_LABELS[status] ?? "Nieznany")
                : "Niedostępna";
              const slotsCount = open ? (autoClicker.slotsCount[id] ?? 0) : 0;

              return (
                <div
                  className={`browser-overview__item${dragOverBrowserId === id ? " is-drag-over" : ""}`}
                  key={id}
                  draggable={open}
                  onDragStart={(event) => {
                    setDraggedBrowserId(id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", id);
                  }}
                  onDragOver={(event) => {
                    if (draggedBrowserId && draggedBrowserId !== id) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDragOverBrowserId(id);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId =
                      draggedBrowserId ||
                      event.dataTransfer.getData("text/plain");
                    if (sourceId) browsers.reorderBrowser(sourceId, id);
                    setDraggedBrowserId(null);
                    setDragOverBrowserId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedBrowserId(null);
                    setDragOverBrowserId(null);
                  }}
                >
                  <button
                    className={`browser-overview__row browser-overview__row--${id}${state.activeBrowserId === id ? " is-active" : ""}`}
                    type="button"
                    disabled={!open}
                    onClick={() => setActiveBrowser(id)}
                  >
                    <span
                      className={`browser-overview__dot status-${status}`}
                    />
                    <span className="browser-overview__name">
                      Przeglądarka {LABELS[id]}
                    </span>
                    <span className="browser-overview__status">
                      {statusLabel}
                    </span>
                    <span className="browser-overview__slots">
                      {open ? `${slotsCount} slotów` : "-"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <AutoClickerPanel
          autoClicker={autoClicker}
          activeBrowserId={state.activeBrowserId}
        />

        {showLogs && (
          <div className="control-section">
            <h3>📊 Logi</h3>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
              Licencja:{" "}
              {licenseInfo?.licenseKey ?? licenseInfo?.key ?? "ładowanie..."} (
              {licenseInfo?.licenseType ?? "-"})
            </p>
            <LogsPanel logs={logs} onClear={onClearLogs} />
          </div>
        )}
      </div>
    </aside>
  );
}
