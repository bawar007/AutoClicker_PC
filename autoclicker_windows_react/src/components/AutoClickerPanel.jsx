import { useEffect, useState } from "react";

function formatDate(value) {
  if (!value) return "—";
  return value;
}

function formatSlotCount(count) {
  if (count === 1) return "1 slot";
  if (count >= 2 && count <= 4) return `${count} sloty`;
  return `${count} slotów`;
}

function getSlotTimestamp(slot) {
  const match = String(slot?.date || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  const timeMatch = String(slot?.time || "").match(/^(\d{2}):(\d{2})/);
  if (!match || !timeMatch) return null;

  return new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  ).getTime();
}

function formatCountdown(milliseconds) {
  if (milliseconds <= 0) return "teraz";
  const totalMinutes = Math.ceil(milliseconds / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} d ${hours} godz.`;
  if (hours > 0) return `${hours} godz. ${minutes} min`;
  return `${minutes} min`;
}

export default function AutoClickerPanel({ autoClicker, activeBrowserId }) {
  const isEnabled = autoClicker.enabled[activeBrowserId];
  const isWaiting = autoClicker.waitingForPanel[activeBrowserId];
  const status = autoClicker.status[activeBrowserId];
  const isApiPollingEnabled =
    !!autoClicker.apiPollingEnabled?.[activeBrowserId];
  const currentApiPollingMs =
    autoClicker.apiPollingIntervalMs?.[activeBrowserId] ?? 950;
  const slots = autoClicker.slots[activeBrowserId] ?? [];
  const firstSlot = slots[0];
  const [now, setNow] = useState(Date.now);
  const isRunning = status === "running";
  const firstSlotTimestamp = getSlotTimestamp(firstSlot);

  useEffect(() => {
    if (!firstSlotTimestamp) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [firstSlotTimestamp]);
  const [pollingInput, setPollingInput] = useState(String(currentApiPollingMs));

  useEffect(() => {
    setPollingInput(String(currentApiPollingMs));
  }, [activeBrowserId, currentApiPollingMs]);

  const pollingNumber = Number(pollingInput);
  const isPollingInputValid =
    Number.isFinite(pollingNumber) &&
    pollingNumber >= 300 &&
    pollingNumber <= 10000;

  const buttonText = !isEnabled
    ? "Włącz Auto Clicker"
    : isWaiting
      ? "Przerwij"
      : isRunning
        ? "Zatrzymaj"
        : slots.length > 0
          ? "Rozpocznij klikanie"
          : "Wybierz slot";

  const statusText = isRunning
    ? "AUTO-CLICK W TRAKCIE..."
    : isWaiting
      ? "OCZEKIWANIE NA PANEL..."
      : isEnabled
        ? "AUTO-CLICKER GOTOWY"
        : "AUTO-CLICKER WYŁĄCZONY";

  return (
    <div className="control-section auto-clicker-card">
      <h3>🤖 Auto Clicker</h3>
      <div
        className={`auto-clicker-panel${isRunning ? " auto-clicker-panel--running" : ""}`}
      >
        <div className="toggle-group" style={{ marginBottom: 8 }}>
          <span className="toggle-label">Tryb API polling slotów</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={isApiPollingEnabled}
              onChange={(event) =>
                autoClicker.toggleApiPolling(
                  activeBrowserId,
                  event.target.checked,
                )
              }
            />
            <span className="slider"></span>
          </label>
        </div>
        <div className="auto-clicker-panel__polling-config">
          <label
            className="auto-clicker-panel__polling-label"
            htmlFor="api-polling-interval"
          >
            Interwał API polling (ms)
          </label>
          <div className="auto-clicker-panel__polling-row">
            <input
              id="api-polling-interval"
              className="auto-clicker-panel__polling-input"
              type="number"
              min={300}
              max={10000}
              step={50}
              value={pollingInput}
              onChange={(event) => setPollingInput(event.target.value)}
            />
            <button
              className="btn btn-secondary btn-small"
              type="button"
              disabled={!isPollingInputValid}
              onClick={() =>
                autoClicker.setApiPollingInterval(
                  activeBrowserId,
                  pollingNumber,
                )
              }
            >
              Zapisz
            </button>
          </div>
          <p className="auto-clicker-panel__polling-hint">
            Zakres: 300-10000 ms.
          </p>
        </div>
        <div className="auto-clicker-panel__slots-heading">
          <div className="auto-clicker-panel__title">
            Wybrane sloty do klikania
          </div>
          <span className="auto-clicker-panel__count">
            {formatSlotCount(slots.length)}
          </span>
        </div>
        <div className="auto-clicker-panel__next-slot">
          <span>Najbliższy</span>
          <strong>
            {firstSlot
              ? `${formatDate(firstSlot.date)} • ${firstSlot.time}`
              : "Brak"}
          </strong>
        </div>
        {firstSlotTimestamp && (
          <div className="auto-clicker-panel__countdown">
            Do slotu: {formatCountdown(firstSlotTimestamp - now)}
          </div>
        )}
        <div className="auto-clicker-panel__slots">
          {slots.length === 0 ? (
            <span className="auto-clicker-panel__empty">
              Brak wybranych slotów
            </span>
          ) : (
            slots.map((slot) => (
              <span
                className="auto-clicker-panel__slot"
                key={slot.id ?? `${slot.date}-${slot.time}`}
              >
                {slot.time}
              </span>
            ))
          )}
        </div>

        <button
          className={`auto-clicker-panel__button${isRunning ? " auto-clicker-panel__button--stop" : ""}`}
          onClick={() => autoClicker.toggleAutoClicker(activeBrowserId)}
        >
          {buttonText}
        </button>

        <div
          className={`auto-clicker-panel__status auto-clicker-panel__status--${status}`}
        >
          <span className="auto-clicker-panel__status-icon">▣</span>
          <span>{statusText}</span>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#888", marginTop: 10 }}>
        Panel steruje aktywną przeglądarką. API polling działa osobno dla
        każdego okna.
      </p>
    </div>
  );
}
