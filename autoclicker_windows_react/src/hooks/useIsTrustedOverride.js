import { useCallback, useState } from "react";

const BROWSER_IDS = ["a", "b", "c", "d"];

const createFlags = (value) =>
  BROWSER_IDS.reduce((acc, id) => ({ ...acc, [id]: value }), {});

function getIsTrustedScript() {
  return `
    (function() {
      const forceIsTrusted = (event) => {
        if (!event) return;
        const descriptor = Object.getOwnPropertyDescriptor(event, 'isTrusted');
        if (descriptor && descriptor.configurable === false) return;
        try {
          Object.defineProperty(event, 'isTrusted', {
            get: () => true,
            configurable: true
          });
        } catch (err) {}
      };

      const eventTypes = ['MouseEvent', 'KeyboardEvent', 'PointerEvent', 'TouchEvent', 'Event'];

      eventTypes.forEach(eventType => {
        if (window[eventType]) {
          const OriginalEvent = window[eventType];
          window[eventType] = function(...args) {
            const event = new OriginalEvent(...args);
            forceIsTrusted(event);
            return event;
          };
          Object.setPrototypeOf(window[eventType], OriginalEvent);
          window[eventType].prototype = OriginalEvent.prototype;
        }
      });

      const originalDispatch = EventTarget.prototype.dispatchEvent;
      EventTarget.prototype.dispatchEvent = function(event) {
        forceIsTrusted(event);
        return originalDispatch.call(this, event);
      };

      console.log('%c✓ isTrusted Override Aktywny', 'color: green; font-weight: bold; font-size: 14px;');
      console.log('%cWszystkie zdarzenia będą zgłaszać isTrusted = true', 'color: orange;');
    })();
  `;
}

export function useIsTrustedOverride({ webviewRefs, addLog }) {
  const [enabled, setEnabled] = useState(() => createFlags(false));

  const getWebview = useCallback(
    (id) => webviewRefs[id]?.current ?? null,
    [webviewRefs],
  );

  const enable = useCallback(
    async (id) => {
      const webview = getWebview(id);
      if (!webview) return;
      await webview.executeJavaScript(getIsTrustedScript());
      setEnabled((prev) => ({ ...prev, [id]: true }));
      addLog("✓ isTrusted override włączony", "success", id);
    },
    [addLog, getWebview],
  );

  const disable = useCallback(
    (id) => {
      const webview = getWebview(id);
      setEnabled((prev) => ({ ...prev, [id]: false }));
      webview?.reload?.();
      addLog(
        "isTrusted override wyłączony - przeładowuję stronę, aby przywrócić domyślne eventy",
        "info",
        id,
      );
    },
    [addLog, getWebview],
  );

  const toggle = useCallback(
    async (id, checked) => {
      if (checked) {
        addLog("⚠️ Włączanie override isTrusted...", "info", id);
        await enable(id);
      } else {
        disable(id);
      }
    },
    [addLog, disable, enable],
  );

  const reapplyIfEnabled = useCallback(
    async (id) => {
      if (!enabled[id]) return;
      try {
        await enable(id);
      } catch (error) {
        addLog(`✗ Błąd isTrusted: ${error.message}`, "error", id);
      }
    },
    [addLog, enable, enabled],
  );

  return {
    enabled,
    toggle,
    reapplyIfEnabled,
  };
}
