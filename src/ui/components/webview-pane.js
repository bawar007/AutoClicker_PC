// ==================== WEBVIEW-PANE.JS ====================
// Generuje DOM pojedynczego panelu przeglądarki (a/b/c/d) zamiast powielania
// tego samego markupu 4x w index.html.

const ICONS = {
  go: `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 64 64" fill="currentColor"><path d="M 40 10 C 38.896 10 38 10.896 38 12 C 38 13.104 38.896 14 40 14 L 47.171875 14 L 30.585938 30.585938 C 29.804938 31.366938 29.804938 32.633063 30.585938 33.414062 C 30.976938 33.805063 31.488 34 32 34 C 32.512 34 33.023063 33.805062 33.414062 33.414062 L 50 16.828125 L 50 24 C 50 25.104 50.896 26 52 26 C 53.104 26 54 25.104 54 24 L 54 12 C 54 10.896 53.104 10 52 10 L 40 10 z M 18 12 C 14.691 12 12 14.691 12 18 L 12 46 C 12 49.309 14.691 52 18 52 L 46 52 C 49.309 52 52 49.309 52 46 L 52 34 C 52 32.896 51.104 32 50 32 C 48.896 32 48 32.896 48 34 L 48 46 C 48 47.103 47.103 48 46 48 L 18 48 C 16.897 48 16 47.103 16 46 L 16 18 C 16 16.897 16.897 16 18 16 L 30 16 C 31.104 16 32 15.104 32 14 C 32 12.896 31.104 12 30 12 L 18 12 z"></path></svg>`,
  refresh: `<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="25px" height="25px"><path d="M 15 3 C 12.031398 3 9.3028202 4.0834384 7.2070312 5.875 A 1.0001 1.0001 0 1 0 8.5058594 7.3945312 C 10.25407 5.9000929 12.516602 5 15 5 C 20.19656 5 24.450989 8.9379267 24.951172 14 L 22 14 L 26 20 L 30 14 L 26.949219 14 C 26.437925 7.8516588 21.277839 3 15 3 z M 4 10 L 0 16 L 3.0507812 16 C 3.562075 22.148341 8.7221607 27 15 27 C 17.968602 27 20.69718 25.916562 22.792969 24.125 A 1.0001 1.0001 0 1 0 21.494141 22.605469 C 19.74593 24.099907 17.483398 25 15 25 C 9.80344 25 5.5490109 21.062074 5.0488281 16 L 8 16 L 4 10 z"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 30px; height: 30px"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  minimize: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 26px; height: 26px"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`,
};

function el(tag, attrs = {}, html) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    node.setAttribute(key, value === true ? "" : value);
  });
  if (html !== undefined) node.innerHTML = html;
  return node;
}

/**
 * Buduje DOM jednego panelu przeglądarki.
 * @param {Object} config
 * @param {"a"|"b"|"c"|"d"} config.id
 * @param {string} config.label - np. "B" (do etykiety pustego slotu)
 * @param {boolean} [config.isPrimary=false] - true dla panelu A: zawsze otwarty, bez "+" i bez przycisku zamknij
 * @param {string} [config.urlInputValue=""] - domyślna wartość pola adresu
 * @param {string} [config.webviewSrc="about:blank"] - startowy adres webview
 * @param {string} [config.partition] - partycja sesji webview, domyślnie persist:browser-{id}
 * @returns {HTMLDivElement} gotowy element .webview-pane
 */
export function createWebviewPane({
  id,
  label,
  isPrimary = false,
  urlInputValue = "",
  webviewSrc = "about:blank",
  partition = `persist:browser-${id}`,
}) {
  const pane = el("div", {
    class: `webview-pane${isPrimary ? "" : " pane-empty"}`,
    id: `pane-${id}`,
  });

  if (!isPrimary) {
    const emptySlot = el("div", { class: "empty-slot" });
    const addBtn = el(
      "button",
      {
        class: "empty-slot-btn",
        id: `add-tab-${id}-btn`,
        title: "Otwórz nową kartę",
      },
      "+",
    );
    const emptyLabel = el(
      "span",
      { class: "empty-slot-label" },
      `Przeglądarka ${label}`,
    );
    emptySlot.append(addBtn, emptyLabel);
    pane.appendChild(emptySlot);
  }

  const urlBar = el("div", { class: "url-bar" });
  const urlInput = el("input", {
    type: "text",
    class: "url-input",
    id: `url-input-${id}`,
    placeholder: "Wpisz adres URL (np. https://ebrama.baltichub.com)",
    value: urlInputValue,
  });
  const goBtn = el(
    "button",
    { class: "url-btn open-www", id: `go-btn-${id}`, title: "Otwórz URL" },
    ICONS.go,
  );
  const refreshBtn = el(
    "button",
    {
      class: "url-btn refresh-btn",
      id: `refresh-btn-${id}`,
      title: "Odśwież stronę",
    },
    ICONS.refresh,
  );

  urlBar.append(urlInput, goBtn, refreshBtn);

  if (!isPrimary) {
    const closeBtn = el(
      "button",
      {
        class: "url-btn open-cart",
        id: `close-browser-${id}-btn`,
        title: "Zamknij kartę",
      },
      ICONS.close,
    );
    urlBar.appendChild(closeBtn);
  }

  const minimizeBtn = el(
    "button",
    {
      class: "url-btn open-cart minimize-btn",
      id: `minimize-btn-${id}`,
      title: "Zwiń podgląd (widok 4 kafelków)",
    },
    ICONS.minimize,
  );
  const statusLight = el("div", {
    class: "status-light",
    id: `status-light-${id}`,
    title: "AutoClicker: wyłączony",
  });
  urlBar.append(minimizeBtn, statusLight);

  const webview = el("webview", {
    id: `webview-${id}`,
    src: webviewSrc,
    partition,
  });

  pane.append(urlBar, webview);
  return pane;
}

/**
 * Tworzy i wstawia panele a/b/c/d do kontenera w podanej kolejności.
 * @param {HTMLElement} container - element .webview-container
 * @param {Array<Object>} paneConfigs - konfiguracje w kolejności wyświetlania (patrz createWebviewPane)
 */
export function renderWebviewPanes(container, paneConfigs) {
  paneConfigs.forEach((config) => {
    container.appendChild(createWebviewPane(config));
  });
}
