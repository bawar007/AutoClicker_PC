import { forwardRef } from "react";

const ICONS = {
  go: (
    <svg viewBox="0 0 64 64" width="30" height="30" fill="currentColor">
      <path d="M 40 10 C 38.896 10 38 10.896 38 12 C 38 13.104 38.896 14 40 14 L 47.171875 14 L 30.585938 30.585938 C 29.804938 31.366938 29.804938 32.633063 30.585938 33.414062 C 30.976938 33.805063 31.488 34 32 34 C 32.512 34 33.023063 33.805062 33.414062 33.414062 L 50 16.828125 L 50 24 C 50 25.104 50.896 26 52 26 C 53.104 26 54 25.104 54 24 L 54 12 C 54 10.896 53.104 10 52 10 L 40 10 z M 18 12 C 14.691 12 12 14.691 12 18 L 12 46 C 12 49.309 14.691 52 18 52 L 46 52 C 49.309 52 52 49.309 52 46 L 52 34 C 52 32.896 51.104 32 50 32 C 48.896 32 48 32.896 48 34 L 48 46 C 48 47.103 47.103 48 46 48 L 18 48 C 16.897 48 16 47.103 16 46 L 16 18 C 16 16.897 16.897 16 18 16 L 30 16 C 31.104 16 32 15.104 32 14 C 32 12.896 31.104 12 30 12 L 18 12 z" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 30 30" width="25px" height="25px" fill="currentColor">
      <path d="M 15 3 C 12.031398 3 9.3028202 4.0834384 7.2070312 5.875 A 1.0001 1.0001 0 1 0 8.5058594 7.3945312 C 10.25407 5.9000929 12.516602 5 15 5 C 20.19656 5 24.450989 8.9379267 24.951172 14 L 22 14 L 26 20 L 30 14 L 26.949219 14 C 26.437925 7.8516588 21.277839 3 15 3 z M 4 10 L 0 16 L 3.0507812 16 C 3.562075 22.148341 8.7221607 27 15 27 C 17.968602 27 20.69718 25.916562 22.792969 24.125 A 1.0001 1.0001 0 1 0 21.494141 22.605469 C 19.74593 24.099907 17.483398 25 15 25 C 9.80344 25 5.5490109 21.062074 5.0488281 16 L 8 16 L 4 10 z" />
    </svg>
  ),
  close: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: 30, height: 30 }}
    >
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  ),
  minimize: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: 26, height: 26 }}
    >
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  ),
  maximize: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: 28, height: 28 }}
    >
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  ),
  previous: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m14.7 6.3-1.4-1.4L7.2 11l6.1 6.1 1.4-1.4L10 11z" />
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m9.3 6.3 1.4-1.4 6.1 6.1-6.1 6.1-1.4-1.4 4.7-4.7z" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
  ),
};

/**
 * Odpowiednik createWebviewPane() z components/webview-pane.js, jako komponent React.
 * webviewRef wskazuje na natywny element <webview>, żeby rodzic mógł wołać reload()/executeJavaScript() itd.
 */
const WebviewPane = forwardRef(function WebviewPane(
  {
    id,
    label,
    isPrimary = false,
    isOpen,
    isActive,
    isFocused,
    isMini,
    isEnabled = false,
    isWaiting = false,
    status = "off",
    loadError = "",
    pageStatus = "loading",
    slotsCount = 0,
    urlInputValue,
    webviewSrc,
    partition,
    onUrlInputChange,
    onGo,
    onRefresh,
    onOpenSlot,
    onClose,
    onMinimize,
    onFocusPrevious,
    onFocusNext,
    onCopyUrl,
    onPaneMouseDown,
  },
  webviewRef,
) {
  const paneClassName = [
    "webview-pane",
    `pane-${id}`,
    !isOpen && "pane-empty",
    isActive && "active-pane",
    isFocused && "role-main",
    isMini && "is-mini",
  ]
    .filter(Boolean)
    .join(" ");
  const statusClassName = [
    "status-light",
    isWaiting && "status-light--waiting",
    !isWaiting && isEnabled && status !== "running" && "status-light--ready",
    status === "running" && "status-light--green",
  ]
    .filter(Boolean)
    .join(" ");
  const statusTitle =
    status === "running"
      ? `AutoClicker: klika (${slotsCount} slotów)`
      : isWaiting
        ? `AutoClicker: oczekiwanie na panel (${slotsCount} slotów)`
        : isEnabled
          ? `AutoClicker: gotowy (${slotsCount} slotów)`
          : "AutoClicker: wyłączony";
  const statusLabel =
    status === "running"
      ? "Działa"
      : isWaiting
        ? "Oczekiwanie"
        : isEnabled
          ? "Gotowy"
          : "Wyłączony";
  const pageStatusLabel =
    pageStatus === "online"
      ? "Online"
      : pageStatus === "error"
        ? "Błąd"
        : "Ładowanie";

  return (
    <div
      id={`pane-${id}`}
      className={paneClassName}
      onMouseDown={onPaneMouseDown}
    >
      {!isOpen && (
        <div className="empty-slot">
          <button
            className="empty-slot-btn"
            onClick={onOpenSlot}
            title="Otwórz nową kartę"
            aria-label={`Dodaj przeglądarkę ${label}`}
          >
            +
          </button>
          <strong className="empty-slot-label">Przeglądarka {label}</strong>
          <span className="empty-slot-hint">Dodaj kartę</span>
        </div>
      )}

      <div className="url-bar">
        <span className="pane-browser-label" title={`Przeglądarka ${label}`}>
          {label}
        </span>
        <input
          type="text"
          className="url-input"
          placeholder="Wpisz adres URL (np. https://ebrama.baltichub.com)"
          value={urlInputValue}
          onChange={(e) => onUrlInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onGo()}
        />
        <div className="url-actions">
          {isFocused && (
            <>
              <button
                className="url-btn focus-nav-btn"
                type="button"
                title="Poprzednia otwarta karta"
                aria-label="Poprzednia otwarta karta"
                onClick={onFocusPrevious}
              >
                {ICONS.previous}
              </button>
              <button
                className="url-btn focus-nav-btn"
                type="button"
                title="Następna otwarta karta"
                aria-label="Następna otwarta karta"
                onClick={onFocusNext}
              >
                {ICONS.next}
              </button>
            </>
          )}
          <button
            className="url-btn open-www"
            title="Otwórz URL"
            onClick={onGo}
          >
            {ICONS.go}
          </button>
          <button
            className="url-btn refresh-btn"
            title="Odśwież stronę"
            onClick={onRefresh}
          >
            {ICONS.refresh}
          </button>
          <button
            className="url-btn copy-url-btn"
            type="button"
            title="Kopiuj adres URL"
            aria-label="Kopiuj adres URL"
            onClick={onCopyUrl}
          >
            {ICONS.copy}
          </button>
          {!isPrimary && (
            <button
              className="url-btn open-cart"
              title="Zamknij kartę"
              onClick={onClose}
            >
              {ICONS.close}
            </button>
          )}
          <button
            className="url-btn open-cart minimize-btn"
            title="Zwiń podgląd (widok 4 kafelków)"
            onClick={onMinimize}
          >
            {ICONS.minimize}
          </button>
        </div>
        <div className="pane-status" title={statusTitle}>
          <div className={statusClassName} id={`status-light-${id}`} />
          <span>{statusLabel}</span>
        </div>
        <div className={`page-status page-status--${pageStatus}`}>
          <span className="page-status__dot" />
          <span>{pageStatusLabel}</span>
        </div>
      </div>

      <webview
        ref={webviewRef}
        src={webviewSrc}
        partition={partition}
      ></webview>
      {loadError && (
        <div className="webview-error" role="alert">
          <strong>Nie udało się załadować strony</strong>
          <span>{loadError}</span>
          <button type="button" onClick={onRefresh}>
            Spróbuj ponownie
          </button>
        </div>
      )}
      {isOpen && (
        <button
          className="pane-maximize-button"
          type="button"
          title={`Powiększ kartę ${label}`}
          aria-label={`Powiększ kartę ${label}`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onPaneMouseDown?.()}
        >
          {ICONS.maximize}
        </button>
      )}
      {isOpen && (
        <button
          className="pane-focus-overlay"
          type="button"
          title="Powiększ kartę"
          aria-label={`Powiększ kartę ${label}`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onPaneMouseDown?.()}
        >
          {ICONS.maximize}
          <span>Powiększ</span>
        </button>
      )}
    </div>
  );
});

export default WebviewPane;
