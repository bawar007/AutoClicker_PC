import WebviewPane from "./WebviewPane.jsx";
import { BROWSER_IDS } from "../hooks/useBrowsersState.js";

const LABELS = { a: "A", b: "B", c: "C", d: "D" };
const INITIAL_WEBVIEW_SRC = {
  a: "https://ebrama.baltichub.com",
  b: "https://ebrama.baltichub.com/",
  c: "https://ebrama.baltichub.com/",
  d: "https://ebrama.baltichub.com/",
};

const normalizeUrl = (url) => (url.startsWith("http") ? url : `https://${url}`);

/**
 * Siatka 4 kafelków + tryb podglądu (focus-mode), odpowiednik updateActiveUI()/enterFocusMode()
 * z oryginalnego renderer.js, tutaj sterowany przez useBrowsersState.
 *
 * Uwaga: `src` na <webview> ustawiamy tylko raz przy montowaniu (INITIAL_WEBVIEW_SRC) - nawigacja
 * (przycisk "Idź", reload) działa imperatywnie przez ref, żeby React nie przeładowywał webview przy każdym renderze.
 */
export default function WebviewGrid({
  browsers,
  autoClicker,
  webviewRefs,
  notify,
  webviewErrors = {},
  onClearWebviewError,
  pageStatuses = {},
}) {
  const {
    state,
    isBrowserOpen,
    enterFocusMode,
    exitFocusMode,
    openBrowserSlot,
    closeBrowserSlot,
    setUrlInputValue,
  } = browsers;

  const handleGo = (id) => {
    const value = state.urlInputValues[id]?.trim();
    if (!value) return;
    const finalUrl = normalizeUrl(value);
    if (webviewRefs[id].current) webviewRefs[id].current.src = finalUrl;
  };

  const handleRefresh = (id) => {
    onClearWebviewError?.(id);
    webviewRefs[id].current?.reload?.();
  };

  const handleCopyUrl = async (id) => {
    const url = state.urlInputValues[id]?.trim();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      notify?.({
        title: `Przeglądarka ${id.toUpperCase()}`,
        message: "Adres URL skopiowany do schowka",
        type: "success",
        browserId: id,
      });
    } catch {
      notify?.({
        title: `Przeglądarka ${id.toUpperCase()}`,
        message: "Nie udało się skopiować adresu URL",
        type: "error",
        browserId: id,
      });
    }
  };

  const handleOpenSlot = (id) => {
    openBrowserSlot(id);
    handleGo(id);
  };

  const moveFocus = (direction) => {
    const openBrowserIds = state.browserOrder.filter((id) => isBrowserOpen(id));
    const currentIndex = openBrowserIds.indexOf(state.focusedBrowserId);
    if (currentIndex < 0 || openBrowserIds.length < 2) return;

    const nextIndex =
      (currentIndex + direction + openBrowserIds.length) %
      openBrowserIds.length;
    enterFocusMode(openBrowserIds[nextIndex]);
  };

  const containerClassName = `webview-container${state.focusedBrowserId ? " focus-mode" : ""}`;

  return (
    <div className={containerClassName} id="webview-container">
      {state.browserOrder.map((id) => {
        const open = isBrowserOpen(id);
        const isPrimary = id === "a";
        const focused = state.focusedBrowserId === id;
        const isMini = !!state.focusedBrowserId && !focused;

        return (
          <WebviewPane
            key={id}
            id={id}
            label={LABELS[id]}
            isPrimary={isPrimary}
            isOpen={open}
            isActive={state.activeBrowserId === id}
            isFocused={focused}
            isMini={isMini}
            isEnabled={autoClicker.enabled[id]}
            isWaiting={autoClicker.waitingForPanel[id]}
            status={autoClicker.status[id]}
            loadError={webviewErrors[id]}
            pageStatus={pageStatuses[id]}
            slotsCount={autoClicker.slotsCount[id]}
            urlInputValue={state.urlInputValues[id]}
            webviewSrc={open ? INITIAL_WEBVIEW_SRC[id] : "about:blank"}
            partition={`persist:browser-${id}`}
            ref={webviewRefs[id]}
            onUrlInputChange={(value) => setUrlInputValue(id, value)}
            onGo={() => handleGo(id)}
            onRefresh={() => handleRefresh(id)}
            onOpenSlot={() => handleOpenSlot(id)}
            onClose={() => closeBrowserSlot(id)}
            onMinimize={(e) => {
              e.stopPropagation();
              exitFocusMode();
            }}
            onFocusPrevious={() => moveFocus(-1)}
            onFocusNext={() => moveFocus(1)}
            onCopyUrl={() => handleCopyUrl(id)}
            onPaneMouseDown={() => open && enterFocusMode(id)}
          />
        );
      })}
    </div>
  );
}
