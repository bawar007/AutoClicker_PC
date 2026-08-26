import { useCallback, useEffect, useMemo, useReducer } from "react";

export const BROWSER_IDS = ["a", "b", "c", "d"];

const DEFAULT_URLS = {
  a: "https://ebrama.baltichub.com",
  b: "https://www.google.com",
  c: "https://www.google.com",
  d: "https://www.google.com",
};

const STORAGE_KEY = "autoclicker-windows-browsers";

function createInitialState(persistenceEnabled = true) {
  const defaultState = {
    activeBrowserId: "a",
    focusedBrowserId: null,
    maxBrowsers: 4,
    browserOrder: [...BROWSER_IDS],
    open: { a: true, b: false, c: false, d: false },
    urlInputValues: { ...DEFAULT_URLS },
  };

  if (!persistenceEnabled) return defaultState;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return defaultState;

    const open = Object.fromEntries(
      BROWSER_IDS.map((id) => [id, id === "a" || saved.open?.[id] === true]),
    );
    const urlInputValues = Object.fromEntries(
      BROWSER_IDS.map((id) => [
        id,
        typeof saved.urlInputValues?.[id] === "string"
          ? saved.urlInputValues[id]
          : DEFAULT_URLS[id],
      ]),
    );
    const activeBrowserId = isOpen({ open }, saved.activeBrowserId)
      ? saved.activeBrowserId
      : "a";

    const browserOrder = Array.isArray(saved.browserOrder)
      ? [
          ...saved.browserOrder.filter((id) => BROWSER_IDS.includes(id)),
          ...BROWSER_IDS.filter((id) => !saved.browserOrder.includes(id)),
        ]
      : [...BROWSER_IDS];

    return {
      ...defaultState,
      activeBrowserId,
      open,
      urlInputValues,
      browserOrder,
    };
  } catch {
    return defaultState;
  }
}

function isOpen(state, id) {
  return id === "a" ? true : !!state.open[id];
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_MAX_BROWSERS":
      return { ...state, maxBrowsers: action.maxBrowsers };

    case "SET_ACTIVE": {
      if (!isOpen(state, action.id)) return state;
      return { ...state, activeBrowserId: action.id };
    }

    case "ENTER_FOCUS": {
      if (!isOpen(state, action.id)) return state;
      return {
        ...state,
        focusedBrowserId: action.id,
        activeBrowserId: action.id,
      };
    }

    case "EXIT_FOCUS":
      return { ...state, focusedBrowserId: null };

    case "OPEN_SLOT": {
      const { id } = action;
      if (id === "a" || isOpen(state, id)) return state;
      return {
        ...state,
        open: { ...state.open, [id]: true },
        focusedBrowserId: id,
        activeBrowserId: id,
      };
    }

    case "CLOSE_SLOT": {
      const { id } = action;
      if (id === "a" || !isOpen(state, id)) return state;
      const nextActive =
        state.activeBrowserId === id ? "a" : state.activeBrowserId;
      const nextFocused =
        state.focusedBrowserId === id ? null : state.focusedBrowserId;
      return {
        ...state,
        open: { ...state.open, [id]: false },
        activeBrowserId: nextActive,
        focusedBrowserId: nextFocused,
      };
    }

    case "SET_URL_INPUT":
      return {
        ...state,
        urlInputValues: { ...state.urlInputValues, [action.id]: action.value },
      };

    case "MOVE_BROWSER": {
      const index = state.browserOrder.indexOf(action.id);
      const nextIndex = index + action.direction;
      if (
        index < 0 ||
        nextIndex < 0 ||
        nextIndex >= state.browserOrder.length
      ) {
        return state;
      }
      const browserOrder = [...state.browserOrder];
      [browserOrder[index], browserOrder[nextIndex]] = [
        browserOrder[nextIndex],
        browserOrder[index],
      ];
      return { ...state, browserOrder };
    }

    case "REORDER_BROWSER": {
      const { id, targetId } = action;
      if (id === targetId) return state;
      const browserOrder = state.browserOrder.filter(
        (browserId) => browserId !== id,
      );
      const targetIndex = browserOrder.indexOf(targetId);
      if (targetIndex < 0) return state;
      browserOrder.splice(targetIndex, 0, id);
      return { ...state, browserOrder };
    }

    case "LOAD_LAYOUT": {
      const open = Object.fromEntries(
        BROWSER_IDS.map((id) => [
          id,
          id === "a" || action.profile.open?.[id] === true,
        ]),
      );
      const urlInputValues = Object.fromEntries(
        BROWSER_IDS.map((id) => [
          id,
          typeof action.profile.urlInputValues?.[id] === "string"
            ? action.profile.urlInputValues[id]
            : state.urlInputValues[id],
        ]),
      );
      const activeBrowserId = isOpen({ open }, action.profile.activeBrowserId)
        ? action.profile.activeBrowserId
        : "a";

      const browserOrder = Array.isArray(action.profile.browserOrder)
        ? [
            ...action.profile.browserOrder.filter((id) =>
              BROWSER_IDS.includes(id),
            ),
            ...BROWSER_IDS.filter(
              (id) => !action.profile.browserOrder.includes(id),
            ),
          ]
        : state.browserOrder;

      return {
        ...state,
        open,
        urlInputValues,
        activeBrowserId,
        browserOrder,
        focusedBrowserId: null,
      };
    }

    default:
      return state;
  }
}

/**
 * Odpowiednik stanu z oryginalnego renderer.js (browsers, activeBrowserId, focusedBrowserId,
 * isBrowserOpen, enterFocusMode/exitFocusMode, openBrowserSlot) przeniesiony na useReducer.
 */
export function useBrowsersState({ persistenceEnabled = true } = {}) {
  const [state, dispatch] = useReducer(
    reducer,
    persistenceEnabled,
    createInitialState,
  );

  useEffect(() => {
    if (!persistenceEnabled) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeBrowserId: state.activeBrowserId,
        open: state.open,
        urlInputValues: state.urlInputValues,
        browserOrder: state.browserOrder,
      }),
    );
  }, [
    persistenceEnabled,
    state.activeBrowserId,
    state.open,
    state.urlInputValues,
  ]);

  const setMaxBrowsers = useCallback(
    (maxBrowsers) => dispatch({ type: "SET_MAX_BROWSERS", maxBrowsers }),
    [],
  );
  const setActiveBrowser = useCallback(
    (id) => dispatch({ type: "SET_ACTIVE", id }),
    [],
  );
  const enterFocusMode = useCallback(
    (id) => dispatch({ type: "ENTER_FOCUS", id }),
    [],
  );
  const exitFocusMode = useCallback(() => dispatch({ type: "EXIT_FOCUS" }), []);
  const openBrowserSlot = useCallback(
    (id) => dispatch({ type: "OPEN_SLOT", id }),
    [],
  );
  const closeBrowserSlot = useCallback(
    (id) => dispatch({ type: "CLOSE_SLOT", id }),
    [],
  );
  const setUrlInputValue = useCallback(
    (id, value) => dispatch({ type: "SET_URL_INPUT", id, value }),
    [],
  );
  const loadLayout = useCallback(
    (profile) => dispatch({ type: "LOAD_LAYOUT", profile }),
    [],
  );
  const moveBrowser = useCallback(
    (id, direction) => dispatch({ type: "MOVE_BROWSER", id, direction }),
    [],
  );
  const reorderBrowser = useCallback(
    (id, targetId) => dispatch({ type: "REORDER_BROWSER", id, targetId }),
    [],
  );

  const isBrowserOpen = useCallback((id) => isOpen(state, id), [state]);

  return useMemo(
    () => ({
      state,
      isBrowserOpen,
      setMaxBrowsers,
      setActiveBrowser,
      enterFocusMode,
      exitFocusMode,
      openBrowserSlot,
      closeBrowserSlot,
      setUrlInputValue,
      loadLayout,
      moveBrowser,
      reorderBrowser,
    }),
    [
      state,
      isBrowserOpen,
      setMaxBrowsers,
      setActiveBrowser,
      enterFocusMode,
      exitFocusMode,
      openBrowserSlot,
      closeBrowserSlot,
      setUrlInputValue,
      loadLayout,
      moveBrowser,
      reorderBrowser,
    ],
  );
}
