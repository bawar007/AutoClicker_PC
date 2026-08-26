import { useState } from "react";

export default function CredentialsPanel({
  credentials,
  onSave,
  onDelete,
  onCopy,
}) {
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pendingOverwrite, setPendingOverwrite] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await onSave({ host, username, password });
    if (result?.requiresConfirmation) {
      setPendingOverwrite({ host, username, password });
      setMessage("");
      return;
    }
    if (!result?.success) {
      setMessage(result?.error || "Nie udało się zapisać danych");
      return;
    }

    setPassword("");
    setMessage("Dane zapisane");
  };

  const confirmOverwrite = async () => {
    if (!pendingOverwrite) return;
    const result = await onSave({ ...pendingOverwrite, overwrite: true });
    if (!result?.success) {
      setMessage(result?.error || "Nie udało się zmienić hasła");
      return;
    }

    setPendingOverwrite(null);
    setPassword("");
    setMessage("Hasło zostało zmienione");
  };

  const cancelOverwrite = () => {
    setPendingOverwrite(null);
    setPassword("");
    setMessage("Hasło nie zostało zmienione");
  };

  return (
    <div className="control-section credentials-panel">
      <h3>🔐 Dane logowania</h3>
      <form onSubmit={handleSubmit}>
        <input
          className="credentials-input"
          type="text"
          placeholder="Domena, np. ebrama.baltichub.com"
          value={host}
          onChange={(event) => setHost(event.target.value)}
          autoComplete="off"
        />
        <input
          className="credentials-input"
          type="text"
          placeholder="Login"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="off"
        />
        <input
          className="credentials-input"
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
        <button className="btn btn-secondary credentials-save" type="submit">
          Zapisz dane logowania
        </button>
      </form>

      {pendingOverwrite && (
        <div className="credentials-confirmation" role="alert">
          <strong>
            Login „{pendingOverwrite.username}” ma już zapisane hasło.
          </strong>
          <span>Czy chcesz je zmienić używając podanego hasła?</span>
          <div className="credentials-confirmation-actions">
            <button
              className="credentials-confirm credentials-confirm--yes"
              type="button"
              onClick={confirmOverwrite}
            >
              Tak
            </button>
            <button
              className="credentials-confirm credentials-confirm--no"
              type="button"
              onClick={cancelOverwrite}
            >
              Nie
            </button>
          </div>
        </div>
      )}

      {message && <p className="credentials-message">{message}</p>}

      <div className="credentials-list">
        {credentials.length === 0 ? (
          <span className="credentials-empty">Brak zapisanych kont</span>
        ) : (
          credentials.map((entry) => (
            <div
              className="credentials-entry"
              key={entry.id ?? `${entry.host}:${entry.username}`}
            >
              <div>
                <strong>{entry.host}</strong>
                <span>{entry.username}</span>
              </div>
              <div className="credentials-actions">
                <button
                  className="credentials-copy"
                  type="button"
                  title={`Kopiuj login ${entry.username}`}
                  onClick={() => onCopy(entry, "username")}
                >
                  Kopiuj login
                </button>
                <button
                  className="credentials-copy"
                  type="button"
                  title={`Kopiuj hasło ${entry.username}`}
                  onClick={() => onCopy(entry, "password")}
                >
                  Kopiuj hasło
                </button>
                <button
                  className="credentials-delete"
                  type="button"
                  title={`Usuń konto ${entry.host}`}
                  onClick={() => onDelete(entry)}
                >
                  Usuń
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="credentials-hint">
        Hasła są szyfrowane przez system Windows. Magazyn jest wspólny dla okien
        A-D.
      </p>
    </div>
  );
}
