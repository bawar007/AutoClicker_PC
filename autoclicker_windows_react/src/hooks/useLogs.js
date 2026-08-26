import { useCallback, useState } from "react";

const MAX_ENTRIES = 50;

/**
 * Odpowiednik addLog() z oryginalnego renderer.js.
 */
export function useLogs() {
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((message, type = "info", browserId = null) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      type,
      browserId,
      timestamp: new Date().toLocaleTimeString("pl-PL"),
    };
    setLogs((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
    console.log(
      `[${type.toUpperCase()}] ${browserId ? `(${browserId.toUpperCase()}) ` : ""}${message}`,
    );
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, addLog, clearLogs };
}
