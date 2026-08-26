import { useCallback, useEffect, useState } from "react";

function normalizeHost(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  try {
    return new URL(
      input.includes("://") ? input : `https://${input}`,
    ).hostname.toLowerCase();
  } catch {
    return input
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .split(":")[0]
      .toLowerCase();
  }
}

export function useCredentialsManager({ webviewRefs, addLog, notify }) {
  const [credentials, setCredentials] = useState([]);

  const refreshCredentials = useCallback(async () => {
    const entries = await window.electronAPI?.listCredentials?.();
    if (Array.isArray(entries)) setCredentials(entries);
  }, []);

  useEffect(() => {
    refreshCredentials().catch((error) => {
      addLog(
        `✗ Nie udało się wczytać magazynu logowania: ${error.message}`,
        "error",
      );
      notify({
        title: "Dane logowania",
        message: "Nie udało się wczytać zapisanych danych",
        type: "error",
      });
    });
  }, [addLog, notify, refreshCredentials]);

  const saveCredential = useCallback(
    async ({ host, username, password, overwrite = false }) => {
      const normalizedHost = normalizeHost(host);
      if (!normalizedHost || !username || !password) {
        notify({
          title: "Dane logowania",
          message: "Domena, login i hasło są wymagane",
          type: "warning",
        });
        return { success: false, error: "Domena, login i hasło są wymagane" };
      }

      let result;
      try {
        result = await window.electronAPI.saveCredential({
          host: normalizedHost,
          username: username.trim(),
          password,
          overwrite,
        });
      } catch (error) {
        notify({
          title: "Dane logowania",
          message: `Błąd zapisu: ${error.message}`,
          type: "error",
        });
        return { success: false, error: error.message };
      }

      if (result?.requiresConfirmation) {
        notify({
          title: "Login już zapisany",
          message: "Potwierdź, czy chcesz zmienić zapisane hasło",
          type: "warning",
        });
      }
      if (result?.success) {
        await refreshCredentials();
        const message = result.updated
          ? `Zmieniono hasło dla ${username.trim()} (${normalizedHost})`
          : `Zapisano konto ${username.trim()} dla ${normalizedHost}`;
        addLog(`✓ ${message}`, "success");
        notify({ title: "Dane logowania", message, type: "success" });
      }
      return result;
    },
    [addLog, notify, refreshCredentials],
  );

  const deleteCredential = useCallback(
    async ({ host, username }) => {
      let result;
      try {
        result = await window.electronAPI.deleteCredential({ host, username });
      } catch (error) {
        notify({
          title: "Dane logowania",
          message: `Błąd usuwania: ${error.message}`,
          type: "error",
        });
        return { success: false, error: error.message };
      }
      if (result?.success) {
        await refreshCredentials();
        const message = `Usunięto konto ${username} dla ${host}`;
        addLog(`✓ ${message}`, "info");
        notify({ title: "Dane logowania", message, type: "info" });
      }
      return result;
    },
    [addLog, notify, refreshCredentials],
  );

  const copyCredential = useCallback(
    async (entry, field) => {
      const result = await window.electronAPI?.copyCredential?.({
        id: entry.id,
        host: entry.host,
        username: entry.username,
        field,
      });
      if (result?.success) {
        const fieldLabel = field === "password" ? "Hasło" : "Login";
        addLog(
          `✓ Skopiowano ${fieldLabel.toLowerCase()} dla ${entry.host}`,
          "info",
        );
        notify({
          title: "Dane logowania",
          message: `${fieldLabel} skopiowano dla ${entry.username}`,
          type: "success",
        });
      } else {
        notify({
          title: "Dane logowania",
          message: result?.error || "Nie udało się skopiować danych",
          type: "error",
        });
      }
      return result;
    },
    [addLog, notify],
  );

  return {
    credentials,
    saveCredential,
    deleteCredential,
    refreshCredentials,
    copyCredential,
  };
}
