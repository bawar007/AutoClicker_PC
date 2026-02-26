let pluginIsOn = true;
let targetDay;
let nextDay;
let preferredHours;
let preferredHoursTest = [];
let selectors = [];
let index = 0;
let intervalRunning = null;
let isWraperAnimation = false;
let isClickedFromAuto = false;
let clicksNumber = 0;
let timerInterval;
let slotsTimer;
let slotsObserver;
let acceptTimer;
let acceptObserver;
let toastObserver;
let isToast;
let toastObservertimer;
let isClickSuccess = false;
let isClickStop = false;
let startSlotValue = null;
let subType;
let isStartingRefresh = false;
let lastRefreshClickAt = 0;
let refreshBackoffMs = 0;
let isClicked = false;

const debugMode = false; // Ustaw na true, aby włączyć logowanie debugowe

const REFRESH_MIN_INTERVAL_MS = 850;
const REFRESH_RATE_LIMIT_CHECK_MS = 500;
const REFRESH_BACKOFF_STEP_MS = 700;
const REFRESH_BACKOFF_MAX_MS = 5000;
const REFRESH_BACKOFF_DECAY_MS = 200;

function hasValidExtensionContext() {
  try {
    return Boolean(chrome?.runtime?.id && chrome?.storage?.local);
  } catch (error) {
    return false;
  }
}

function safeStorageRemove(key, callback = null) {
  if (!hasValidExtensionContext()) {
    if (typeof callback === "function") callback();
    return false;
  }

  try {
    chrome.storage.local.remove(key, () => {
      if (typeof callback === "function") callback();
    });

    return true;
  } catch (error) {
    if (typeof callback === "function") callback();
    return false;
  }
}

function safeStorageGet(keys, callback) {
  const safeCallback = typeof callback === "function" ? callback : () => {};

  if (!hasValidExtensionContext()) {
    safeCallback({});
    return false;
  }

  try {
    chrome.storage.local.get(keys, (result) => {
      safeCallback(result || {});
    });

    return true;
  } catch (error) {
    safeCallback({});
    return false;
  }
}

function safeStorageSet(data, callback = null) {
  if (!hasValidExtensionContext()) {
    if (typeof callback === "function") callback();
    return false;
  }

  try {
    chrome.storage.local.set(data, () => {
      if (typeof callback === "function") callback();
    });

    return true;
  } catch (error) {
    if (typeof callback === "function") callback();
    return false;
  }
}

const premiumTypes = ["GOLD", "BUSINESS GOLD"];
const basicType = "BASIC";

const myImages = {
  succes: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="green">
    <rect fill="none" height="24" width="24"/>
    <path d="M22,5.18L10.59,16.6l-4.24-4.24l1.41-1.41l2.83,2.83l10-10L22,5.18z M19.79,10.22C19.92,10.79,20,11.39,20,12 c0,4.42-3.58,8-8,8s-8-3.58-8-8c0-4.42,3.58-8,8-8c1.58,0,3.04,0.46,4.28,1.25l1.44-1.44C16.1,2.67,14.13,2,12,2C6.48,2,2,6.48,2,12 c0,5.52,4.48,10,10,10s10-4.48,10-10c0-1.19-0.22-2.33-0.6-3.39L19.79,10.22z"/>
</svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="red"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/></svg>`,
  waiting: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="yellow"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M12,20c-4.42,0-8-3.58-8-8 c0-4.42,3.58-8,8-8s8,3.58,8,8C20,16.42,16.42,20,12,20z"/><circle cx="7" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="17" cy="12" r="1.5"/></g></g></svg>`,
  stop: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><path d="M0 0h24v24H0z" fill="none"/><path d="M18 24h-6.55c-1.08 0-2.14-.45-2.89-1.23l-7.3-7.61 2.07-1.83c.62-.55 1.53-.66 2.26-.27L8 14.34V4.79c0-1.38 1.12-2.5 2.5-2.5.17 0 .34.02.51.05.09-1.3 1.17-2.33 2.49-2.33.86 0 1.61.43 2.06 1.09.29-.12.61-.18.94-.18 1.38 0 2.5 1.12 2.5 2.5v.28c.16-.03.33-.05.5-.05 1.38 0 2.5 1.12 2.5 2.5V20c0 2.21-1.79 4-4 4zM4.14 15.28l5.86 6.1c.38.39.9.62 1.44.62H18c1.1 0 2-.9 2-2V6.15c0-.28-.22-.5-.5-.5s-.5.22-.5.5V12h-2V3.42c0-.28-.22-.5-.5-.5s-.5.22-.5.5V12h-2V2.51c0-.28-.22-.5-.5-.5s-.5.22-.5.5V12h-2V4.79c0-.28-.22-.5-.5-.5s-.5.23-.5.5v12.87l-5.35-2.83-.51.45z"/></svg>`,
  reload: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><g><path d="M6,13c0-1.65,0.67-3.15,1.76-4.24L6.34,7.34C4.9,8.79,4,10.79,4,13c0,4.08,3.05,7.44,7,7.93v-2.02 C8.17,18.43,6,15.97,6,13z M20,13c0-4.42-3.58-8-8-8c-0.06,0-0.12,0.01-0.18,0.01l1.09-1.09L11.5,2.5L8,6l3.5,3.5l1.41-1.41 l-1.08-1.08C11.89,7.01,11.95,7,12,7c3.31,0,6,2.69,6,6c0,2.97-2.17,5.43-5,5.91v2.02C16.95,20.44,20,17.08,20,13z"/></g></g></svg>`,
  progress: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="green"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 9c-.04-4.39-3.6-7.93-8-7.93S4.04 4.61 4 9v6c0 4.42 3.58 8 8 8s8-3.58 8-8V9zm-2 0h-5V3.16c2.81.47 4.96 2.9 5 5.84zm-7-5.84V9H6c.04-2.94 2.19-5.37 5-5.84zM18 15c0 3.31-2.69 6-6 6s-6-2.69-6-6v-4h12v4z"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><rect fill="none" height="24" width="24"/><path d="M19,19H5V5h14V19z M3,3v18h18V3H3z M17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41L8.41,7L12,10.59L15.59,7 L17,8.41L13.41,12L17,15.59z"/></svg>`,
  robot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 0c17.7 0 32 14.3 32 32l0 64 120 0c39.8 0 72 32.2 72 72l0 272c0 39.8-32.2 72-72 72l-304 0c-39.8 0-72-32.2-72-72l0-272c0-39.8 32.2-72 72-72l120 0 0-64c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zM264 256a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm152 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80zM48 224l16 0 0 192-16 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-16 0 0-192 16 0z"/></svg>`,
  robotStylingGold: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="
    width: 40px;
    height: 40px;
    background: white;
    padding: 5px;
    border-radius: 50%;
" fill="gold"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 0c17.7 0 32 14.3 32 32l0 64 120 0c39.8 0 72 32.2 72 72l0 272c0 39.8-32.2 72-72 72l-304 0c-39.8 0-72-32.2-72-72l0-272c0-39.8 32.2-72 72-72l120 0 0-64c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zM264 256a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm152 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80zM48 224l16 0 0 192-16 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-16 0 0-192 16 0z"></path></svg>`,
  robotStylingSilver: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="
width: 40px;
height: 40px;
background: white;
padding: 5px;
border-radius: 50%;
" fill="silver"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 0c17.7 0 32 14.3 32 32l0 64 120 0c39.8 0 72 32.2 72 72l0 272c0 39.8-32.2 72-72 72l-304 0c-39.8 0-72-32.2-72-72l0-272c0-39.8 32.2-72 72-72l120 0 0-64c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zM264 256a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm152 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80zM48 224l16 0 0 192-16 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-16 0 0-192 16 0z"></path></svg>`,
  robotStylingBrown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="
width: 40px;
height: 40px;
background: white;
padding: 5px;
border-radius: 50%;
" fill="brown"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 0c17.7 0 32 14.3 32 32l0 64 120 0c39.8 0 72 32.2 72 72l0 272c0 39.8-32.2 72-72 72l-304 0c-39.8 0-72-32.2-72-72l0-272c0-39.8 32.2-72 72-72l120 0 0-64c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zM264 256a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm152 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80zM48 224l16 0 0 192-16 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-16 0 0-192 16 0z"></path></svg>`,
};

safeStorageRemove("myData", () => {
  preferredHours = [];
  preferredHoursTest = [];
});

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key === "deleteItemFromPopUp") {
      const btnEl = document.querySelector(
        `[dt-from="${newValue.dateTime.date} ${newValue.dateTime.time}:00"]`,
      );
      if (btnEl) {
        btnEl.style.backgroundColor = null;
      }

      const element = document.querySelector(
        `[data-slotid="${newValue.dateTime.id}"]`,
      );
      if (element) {
        element.checked = false;
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
      preferredHoursTest = preferredHoursTest.filter(
        (item) => item.id !== newValue.dateTime.id,
      );
    }
    if (key === "pluginIsOn") {
      window.location.reload();
    }
    updateMySlots();
  }
});

async function getTargetDay() {
  if (!targetDay) {
    const newTargetDay = preferredHoursTest[0].date;
    targetDay = newTargetDay;
  }
}

//Pobieranie godziny i sortowanie ich z zaznaczonych slotów
function getPreferredHours() {
  if (!preferredHours) {
    if (preferredHoursTest.length === 0) {
      //("⚠️ Błąd: Musisz podać przynajmniej jedną godzinę!");
      return;
    }
    preferredHours = preferredHoursTest
      .map((item) => item.time)
      .sort((a, b) => {
        // Zamieniamy godziny na format czasowy, porównujemy je
        return a.localeCompare(b);
      });
  }
}

//Rozdzielniae dateTime na objekt "01.01.2025 15:00:00"
function formatDateTime(datetime) {
  // Dzielimy datę i czas po spacji
  let [date, time] = datetime.split(" ");

  // Zwracamy obiekt z datą i czasem
  return {
    date: date,
    time: time.split(":").slice(0, 2).join(":"), // Zwracamy tylko godziny i minuty
  };
}

//Sprawdzanie czy zaznaczone sloty są w tym samym dniu
function checkSameDate(dataArray) {
  // Sprawdzamy, czy wszystkie daty są takie same
  return dataArray.every((item) => item.date === dataArray[0].date);
}

//Sprawdzanie i czekanie na załadowanie slotów
async function waitForSlotsDetails() {
  return new Promise((resolve) => {
    const slotsContainer = document.querySelector("#av-slots");
    if (!slotsContainer) {
      // console.warn("❌ Nie znaleziono kontenera slotów.");
      resolve();
      return;
    }

    slotsObserver = new MutationObserver((mutations, obs) => {
      const slotButtons = document.querySelectorAll("button.slot-btn");
      if (slotButtons.length > 0) {
        obs.disconnect(); // Zatrzymujemy nasłuchiwanie
        clearTimeout(slotsTimer); // Usuwamy timeout
        slotsObserver = false;
        slotsTimer = false;
        resolve();
      }
    });

    slotsObserver.observe(slotsContainer, { childList: true, subtree: true });

    // Timeout jako awaryjne zabezpieczenie
    slotsTimer = setTimeout(() => {
      slotsObserver.disconnect();
      // console.warn("⏳ Timeout: sloty nie pojawiły się na czas.");
      slotsObserver = false;
      slotsTimer = false;
      resolve();
    }, 8000);
  });
}

async function waitForToast() {
  return new Promise((resolve) => {
    const bodyEl = document.querySelector("body");
    let timeOut = 10000;
    if (!bodyEl) {
      // console.warn("❌ Nie znaleziono body");

      resolve(true);
      return;
    }
    if (isClickStop) {
      resolve(true);
      return;
    }

    toastObserver = new MutationObserver((mutations, obs) => {
      const slotButtons = document.querySelector("#toast-container");
      if (slotButtons) {
        if (debugMode) console.log("Wykryto toast");
        if (isRefreshRateLimitToastVisible()) {
          timeOut = 5000;
          if (debugMode) console.log("Wykryto zbyt duzo ");
        }
        obs.disconnect(); // Zatrzymujemy nasłuchiwanie
        clearTimeout(toastObservertimer); // Usuwamy timeout
        acceptObserver = false;

        resolve(true);
      }
    });

    toastObserver.observe(bodyEl, { childList: true, subtree: true });

    // Timeout jako awaryjne zabezpieczenie
    toastObservertimer = setTimeout(() => {
      toastObserver.disconnect();
      toastObserver = false;
      resolve(false);
    }, timeOut);
  });
}

async function waitForSuccessInfo() {
  return new Promise((resolve) => {
    const bodyEl = document.querySelector("body");
    if (!bodyEl) {
      // console.warn("❌ Nie znaleziono body");
      resolve(false);
      return;
    }
    if (isClickStop) return;
    isClickSuccess = true;
    acceptObserver = new MutationObserver((mutations, obs) => {
      const slotButtons = document.querySelector(".swal2-container");
      if (slotButtons) {
        obs.disconnect(); // Zatrzymujemy nasłuchiwanie
        clearTimeout(acceptTimer); // Usuwamy timeout
        acceptObserver = false;
        isClickSuccess = false;

        resolve(true);
      }
    });

    acceptObserver.observe(bodyEl, { childList: true, subtree: true });

    // Timeout jako awaryjne zabezpieczenie
    acceptTimer = setTimeout(() => {
      acceptObserver.disconnect();
      acceptObserver = false;
      isClickSuccess = false;
      resolve(false);
    }, 20000);
  });
}
//Klikanie w dostępny slot z symulacją użytkownika

async function clickElementWithUserEvent(element) {
  if (!element) return;

  element.focus();
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

async function waitForElement(selector, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element; // Zwróci element, jeśli go znajdzie
    }
    await new Promise((resolve) => setTimeout(resolve, 100)); // Czekaj krótki czas przed kolejną próbą
  }
  return null; // Zwróci null, jeśli element nie pojawi się w ciągu określonego czasu
}

async function waitForSlotWaiterHidden(timeout = 15000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (!intervalRunning || isClickStop) {
      return false;
    }

    const slotWaiter = document.querySelector(".vbs-slot-waiter");
    if (!slotWaiter) {
      return true;
    }

    if (slotWaiter.classList.contains("vbs-d-none")) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getToastText() {
  const toastContainer = document.querySelector("#toast-container");
  if (!toastContainer) return "";

  const toastMessages = toastContainer.querySelectorAll(".toast-message");
  const latestToastMessage = toastMessages[toastMessages.length - 1];

  return (
    latestToastMessage?.textContent?.trim() ||
    toastContainer.textContent?.trim() ||
    ""
  );
}

function normalizeToastText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isRefreshRateLimitToastVisible() {
  const toastText = normalizeToastText(getToastText());
  if (debugMode) console.log("Toast text", toastText);
  if (debugMode) console.log("Toast text 2", getToastText());

  if (!toastText) return false;

  return (
    toastText.includes("zbyt czest") ||
    toastText.includes("zbyt czeste") ||
    toastText.includes("odswiez") ||
    toastText.includes("odswiezanie") ||
    toastText.includes("refresh too often") ||
    toastText.includes("too frequent") ||
    toastText.includes("too many")
  );
}

async function waitForRefreshRateLimitToast(
  timeout = REFRESH_RATE_LIMIT_CHECK_MS,
) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (isRefreshRateLimitToastVisible()) {
      return true;
    }

    await sleep(80);
  }

  return false;
}

async function waitForRefreshWindow(minIntervalMs = REFRESH_MIN_INTERVAL_MS) {
  const now = Date.now();
  const elapsed = now - lastRefreshClickAt;
  const requiredWait = minIntervalMs + refreshBackoffMs;

  if (elapsed < requiredWait) {
    await sleep(requiredWait - elapsed);
  }
}

function isSlotTypeButtonActive(buttonEl) {
  if (!buttonEl) return false;

  return (
    buttonEl.classList.contains("btn-success") &&
    !buttonEl.classList.contains("btn-outline") &&
    !buttonEl.classList.contains("btn-success-outlined")
  );
}

function getActiveRefreshButton() {
  const standardSlotTypeBtn = document.getElementById("1-slt-btn");
  const emptySlotTypeBtn = document.getElementById("4-slt-btn");

  let activeSlotTypeBtn = null;
  if (isSlotTypeButtonActive(standardSlotTypeBtn)) {
    activeSlotTypeBtn = standardSlotTypeBtn;
  } else if (isSlotTypeButtonActive(emptySlotTypeBtn)) {
    activeSlotTypeBtn = emptySlotTypeBtn;
  }

  if (activeSlotTypeBtn) {
    const candidateContainers = [
      activeSlotTypeBtn.closest(".btn-group"),
      activeSlotTypeBtn.closest(".row"),
      activeSlotTypeBtn.parentElement,
      activeSlotTypeBtn.parentElement?.parentElement,
    ].filter(Boolean);

    for (const container of candidateContainers) {
      const refreshInContainer = container.querySelector(
        "button.vbs-refresh-slt-btn",
      );
      if (refreshInContainer) {
        return refreshInContainer;
      }
    }
  }

  const refreshButtons = document.querySelectorAll(
    "button.vbs-refresh-slt-btn",
  );
  if (!refreshButtons.length) return null;

  if (activeSlotTypeBtn?.id === "1-slt-btn") {
    return refreshButtons[0] || null;
  }

  if (activeSlotTypeBtn?.id === "4-slt-btn") {
    return refreshButtons[1] || refreshButtons[0] || null;
  }

  return refreshButtons[0] || null;
}

//Sprawdzanie czy slot jest dostępny
async function checkAndClickSlotButton(currentDate) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  isClicked = true;
  for (let hour of preferredHours) {
    const slotButton = await waitForElement(
      `button.slot-btn[dt-from="${targetDay} ${hour}:00"]`,
    );

    if (
      slotButton &&
      !slotButton.hasAttribute("disabled") &&
      window.getComputedStyle(slotButton).pointerEvents !== "none"
    ) {
      const stopBtn = document.querySelector("#stop");
      const infoSpan = document.querySelector(".my-info-span");
      stopBtn.innerText = "Klikam...";
      infoSpan.innerText = "Slot dostępny, podejmowanie próby kliknięcia";
      infoSpan.style.color = "green";
      isClickedFromAuto = true;
      await clickElementWithUserEvent(slotButton);

      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) await clickElementWithUserEvent(submitBtn);

      const confirmBtn = document.querySelector("button.swal2-confirm");
      if (confirmBtn) await clickElementWithUserEvent(confirmBtn);
      clicksNumber++;

      document.querySelector(".stats-clicks").innerText =
        `Ilość prób kliknięcia: ${clicksNumber}`;
      infoSpan.innerText = "Sprawdzam, czy jest dostęp";
      infoSpan.style.color = "yellow";
      document.querySelector(".my-info-image").innerHTML = myImages.waiting;

      isToast = await waitForToast();
      //isToast = waitForElement(".toast-message", 3000); przetestować

      let isAccepted = false;

      if (!isToast) {
        isAccepted = await waitForSuccessInfo();
      }

      isClickedFromAuto = false;
      if (isToast || !isAccepted) {
        if (document.querySelectorAll("button.slot-btn")[0])
          document
            .querySelectorAll("button.slot-btn")[0]
            .scrollIntoView({ behavior: "smooth", block: "center" });

        if (intervalRunning) {
          infoSpan.innerText = "Brak slotów, wznawiam auto-click";

          infoSpan.style.color = "white";
          document.querySelector(".my-info-image").innerHTML = myImages.reload;
        } else {
          infoSpan.innerText = "";
          infoSpan.color = "white";
          document.querySelector(".my-info-image").innerHTML = "";
        }

        setTimeout(() => {
          return false;
        }, 5000);
      } else if (isAccepted) {
        infoSpan.innerText = "Próba zakończona sukcesem !!";
        infoSpan.style.color = "green";
        document.querySelector(".my-info-image").innerHTML = myImages.succes;

        return true;
      }
    }
  }
  setTimeout(() => {
    return false;
  }, 10000);
}

//Pętla do automatycznego odświeżania slotów co 10 sekund
async function clickAlternating() {
  let foundAndClicked = false;
  const infoSpan = document.querySelector(".my-info-span");
  const infoImage = document.querySelector(".my-info-image");
  const stopBtn = document.querySelector("#stop");
  infoImage.innerHTML = myImages.progress;
  infoSpan.innerText = "Auto-click w trakcie..";
  infoSpan.style.color = "green";

  while (intervalRunning) {
    if (isClickStop) {
      stopAutoClick();
      return;
    }
    const refreshButton = getActiveRefreshButton();
    if (!refreshButton) {
      stopAutoClick();
      resetPlugin();
      return;
    }

    const testW = await waitForSlotWaiterHidden();
    if (debugMode) console.log("klikam odswiez");
    await waitForRefreshWindow();
    await sleep(400);
    if (testW) {
      await clickElementWithUserEvent(refreshButton);
      lastRefreshClickAt = Date.now();
    }

    await waitForSlotsDetails();

    const isRefreshLimited = await waitForRefreshRateLimitToast();
    if (isRefreshLimited) {
      refreshBackoffMs = Math.min(
        refreshBackoffMs + REFRESH_BACKOFF_STEP_MS,
        REFRESH_BACKOFF_MAX_MS,
      );

      infoSpan.innerText =
        "Wykryto zbyt częste odświeżanie, spowalniam auto-refresh";
      infoSpan.style.color = "yellow";
      infoImage.innerHTML = myImages.waiting;
      continue;
    } else {
      refreshBackoffMs = Math.max(
        refreshBackoffMs - REFRESH_BACKOFF_DECAY_MS,
        0,
      );
    }

    if (preferredHoursTest.length > 0) {
      const slotinputs = document.querySelectorAll("input.myInput");
      slotinputs.forEach((slot) => {
        preferredHoursTest.forEach((item) => {
          if (
            slot.getAttribute("data-slot") === `${item.date} ${item.time}:00`
          ) {
            slot.checked = true;
          }
        });
      });
    }

    foundAndClicked = await checkAndClickSlotButton(targetDay);
    if (!foundAndClicked) {
      infoImage.innerHTML = myImages.progress;
      infoSpan.style.color = "green";
    } else if (isClicked) {
      const waiterHidden2 = await waitForSlotWaiterHidden();
      if (waiterHidden2) {
        await clickElementWithUserEvent(refreshButton);
        lastRefreshClickAt = Date.now();
      }

      isClicked = false;
    }

    if (foundAndClicked) {
      stopAutoClick();
      resetPlugin();
      return;
    }

    if (stopBtn && isStartingRefresh) {
      stopBtn.innerText = "Rozpoczynam..";
    }

    const waiterHidden = await waitForSlotWaiterHidden();

    if (waiterHidden && stopBtn) {
      stopBtn.innerText = "Working...";
      isStartingRefresh = false;
    }
  }
}

// Funkcja zarządzająca stanem checkboxów i podświetlaniem przycisków slotów
function handleSlotSelection(divEl) {
  if (preferredHoursTest.length > 0) {
    divEl.forEach((divItem) => {
      const slotInput = divItem.querySelector("input.myInput");

      if (slotInput) {
        preferredHoursTest.forEach((item) => {
          if (
            slotInput.getAttribute("data-slot") ===
            `${item.date} ${item.time}:00`
          ) {
            slotInput.checked = true;
            const btnEl = divItem.querySelector("button.slot-btn");
            btnEl.style.backgroundColor = "lightblue";
          }
        });
      }
    });
  }
}

// Funkcja obsługująca zmiany checkboxów i aktualizująca chrome.storage
function handleCheckboxChange(input, btnElInDiv, index, spanEl, spanWraperDiv) {
  input.addEventListener("change", (event) => {
    if (event.target.checked) {
      if (!isClickedFromAuto) {
        safeStorageGet("myData", (result) => {
          // Dodawanie do preferredHoursTest
          const filterTest = preferredHoursTest.filter(
            (item) => item.id === `myinput-${index}`,
          );
          if (filterTest.length === 0) {
            const itemTime = formatDateTime(
              event.target.getAttribute("data-slot"),
            );
            preferredHoursTest.push({ ...itemTime, id: `myinput-${index}` });
          }

          btnElInDiv.style.backgroundColor = "lightblue";
          const slotWrapers = document.querySelectorAll(".span-wraper");
          slotWrapers.forEach((slotWraper) =>
            slotWraper.classList.remove("span-animation"),
          );
          setTimeout(() => {
            isWraperAnimation = true;
            spanEl.innerText = "Dodano do kolejki ✅";
            spanWraperDiv.classList.add("span-animation");
            setTimeout(() => {
              spanEl.innerText = "";
              spanWraperDiv.classList.remove("span-animation");
              isWraperAnimation = false;
            }, 1500);
          }, 250);

          safeStorageSet({ myData: preferredHoursTest });
        });
      }
    } else {
      if (!isClickedFromAuto)
        safeStorageGet("myData", (result) => {
          preferredHoursTest = preferredHoursTest.filter(
            (item) => item.id !== `myinput-${index}`,
          );
          btnElInDiv.style.backgroundColor = null;
          const slotWrapers = document.querySelectorAll(".span-wraper");
          slotWrapers.forEach((slotWraper) =>
            slotWraper.classList.remove("span-animation"),
          );
          setTimeout(() => {
            isWraperAnimation = true;
            spanWraperDiv.classList.add("span-animation");
            spanEl.innerText = "Usunięto z kolejki ❌";
            setTimeout(() => {
              spanEl.innerText = "";
              spanWraperDiv.classList.remove("span-animation");
              isWraperAnimation = false;
            }, 1500);
          }, 250);

          safeStorageSet({ myData: preferredHoursTest });
        });
    }
  });
}

// Funkcja dodająca checkboxy do slotów
function addCheckboxToSlot(el, index) {
  //let goAddCheck = true;

  if (el.style.position !== "relative") {
    const btnElInDiv = el.querySelector("button.slot-btn");

    if (btnElInDiv) {
      el.style.position = "relative";
      el.style.marginBottom = "5px";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = "myInput";
      input.style.pointerEvents = "none";
      input.setAttribute("data-slot", btnElInDiv.getAttribute("dt-from"));
      input.setAttribute("data-slotId", `myinput-${index}`);
      el.appendChild(input);

      btnElInDiv.addEventListener("click", () => {
        if (!isClickSuccess || !intervalRunning) {
          input.checked = !input.checked;
          btnElInDiv.style.backgroundColor = input.checked ? "lightblue" : null;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      const divWraper = document.createElement("div");
      divWraper.className = "span-wraper";
      const spanEl = document.createElement("span");
      spanEl.className = "span-info";
      divWraper.appendChild(spanEl);
      let btnIsDisabled = btnElInDiv.disabled;
      el.appendChild(divWraper);
      btnElInDiv.addEventListener("mouseover", () => {
        if (isClickSuccess || intervalRunning) {
          btnElInDiv.style.cursor = "not-allowed";
          if (
            !isWraperAnimation &&
            !divWraper.classList.contains("span-animation")
          ) {
            divWraper.classList.add("span-animation");
            spanEl.innerText = "Zaczekaj, na zatrzymanie";
            divWraper.style.bottom = "-50px";
          }
        } else {
          btnElInDiv.style.cursor = "pointer";
          divWraper.style.bottom = "-30px";
          if (btnIsDisabled) btnElInDiv.disabled = false;
          if (
            !isWraperAnimation &&
            !divWraper.classList.contains("span-animation")
          ) {
            if (!input.checked) {
              divWraper.classList.add("span-animation");
              spanEl.innerText = "Dodaj do kolejki";
            } else {
              divWraper.classList.add("span-animation");
              spanEl.innerText = "Usuń z kolejki";
            }
          }
        }
      });
      btnElInDiv.addEventListener("mouseout", () => {
        btnElInDiv.disabled = btnIsDisabled;
        btnElInDiv.style.cursor = "pointer";

        if (
          !isWraperAnimation &&
          divWraper.classList.contains("span-animation")
        ) {
          divWraper.classList.remove("span-animation");
          spanEl.innerText = "";
        }
      });
      handleCheckboxChange(input, btnElInDiv, index, spanEl, divWraper);
    }
  }
}

// Funkcja przetwarzająca zmiany w DOM
function processMutations(mutationsList) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList" || mutation.type === "characterData") {
      const divEl = document.querySelectorAll("#av-slots > div");

      handleSlotSelection(divEl);
      divEl.forEach((el, index) => addCheckboxToSlot(el, index));
    }
  }
}

// Główna funkcja obserwująca zmiany w DOM
function observeContent(element) {
  const contentObserver = new MutationObserver(processMutations);

  contentObserver.observe(element, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

const observer = new MutationObserver((mutationsList, observer) => {
  if (!pluginIsOn) return observer.disconnect();
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      const avSlots = document.getElementById("av-slots");
      if (avSlots) {
        observer.disconnect(); // Przestajemy obserwować dodanie elementu
        observeContent(avSlots); // Rozpoczynamy obserwację jego zawartości
      }
    }
  }
});

function createMenuElement() {
  if (subType) {
    const createEl = (tag, className = "", id = "", type = "") => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (id) el.id = id;
      if (type) el.type = type;
      return el;
    };

    const body = document.body;

    // Tworzenie głównych elementów
    const menuBtn = createEl("div", "my-menu-for-slots");
    const wraperEl = createEl(
      "div",
      "my-menu-for-slots__wraper my-menu-for-slots__wraper--visible",
    );
    const toggleBtn = createEl("button", "my-menu-for-slots__btn");
    const checkedInput = createEl(
      "input",
      "my-menu-for-slots__input",
      "",
      "checkbox",
    );
    checkedInput.checked;

    const closeBtn = createEl("button", "my-menu-for-slots__closeBtn");
    closeBtn.innerHTML = myImages.close;

    // Tworzenie elementów info
    const infoWraper = createEl("div", "my-info-wraper-div");
    const statElClicks = createEl("span", "stats-clicks");
    const spanTimer = createEl("span", "", "countdown");
    const countTimer = createEl("span", "", "countInDay");

    // Elementy info w pasku nawigacji
    const infoSpanDiv = createEl("div", "my-info-span-wraper");
    const infoSpanDivImage = createEl("div", "my-info-image");
    const infoSpan = createEl("span", "my-info-span");

    // Kontener slotów
    const mySlots = createEl("div", "my-slots");

    // Wypełnianie elementów

    toggleBtn.innerHTML = myImages.robot;

    const mySlotsHeader = createEl("div", "my-slots-header");
    const mySlotsTitle = createEl("h3", "my-slots-header-title");
    mySlotsTitle.innerText = "Auto-Clicker";

    mySlotsHeader.appendChild(mySlotsTitle);

    if (subType === basicType) {
      mySlotsHeader.innerHTML = myImages.robotStylingSilver;
      statElClicks.innerText =
        clicksNumber !== 0 ? `Ilość prób kliknięcia: ${clicksNumber}` : "";
    } else {
      mySlotsHeader.innerHTML = myImages.robotStylingGold;
    }

    // Event dla przycisku otwierania

    toggleBtn.addEventListener("click", () => {
      checkedInput.checked = !checkedInput.checked;
      if (checkedInput.checked) {
        menuBtn.style.display = "none";
        if (
          !wraperEl.classList.contains("my-menu-for-slots__wraper--visible")
        ) {
          wraperEl.classList.add("my-menu-for-slots__wraper--visible");
        }
        updateMySlots();
      }
    });

    // Event dla przycisku zamykania

    closeBtn.addEventListener("click", () => {
      checkedInput.checked = false;
      menuBtn.style.display = "block";
      if (wraperEl.classList.contains("my-menu-for-slots__wraper--visible"))
        wraperEl.classList.remove("my-menu-for-slots__wraper--visible");
    });

    infoSpanDiv.append(infoSpanDivImage, infoSpan);
    infoWraper.append(statElClicks, spanTimer, countTimer);
    wraperEl.appendChild(mySlotsHeader);
    wraperEl.append(infoWraper, mySlots, closeBtn);
    createControlButtons(wraperEl);
    wraperEl.appendChild(infoSpanDiv);
    menuBtn.append(checkedInput, toggleBtn);

    body.append(menuBtn, wraperEl);
  }
}

function createControlButtons(wraperEl) {
  const createButton = (id, className, text, onClick) => {
    const btn = document.createElement("button");
    btn.id = id;
    btn.className = className;
    btn.innerText = text;
    btn.addEventListener("click", onClick);
    return btn;
  };

  const btnContainer = document.createElement("div");
  btnContainer.className = "btnContainer";

  btnContainer.append(
    createButton("start", "btnStyle button-66", "START", () => {
      startAutoClick(subType);
    }),
    createButton("stop", "btnStyle", "STOP", stopAutoClick),
  );

  wraperEl.appendChild(btnContainer);
}

function updateMySlots() {
  if (!subType) return;

  let dataEL = document.getElementById("data");
  let h3EL = document.querySelector(".my-slots-title");
  let timeContainer = document.querySelector("#time-container");
  const mySlotsEL = document.querySelector(".my-slots");

  if (preferredHoursTest && preferredHoursTest.length > 0) {
    const firstDateTime = preferredHoursTest[0]; // Pobieramy pierwszą datę z tablicy

    if (timeContainer) {
      timeContainer.remove();
      timeContainer = document.createElement("div");
      timeContainer.id = "time-container";
    } else {
      timeContainer = document.createElement("div");
      timeContainer.id = "time-container";
    }
    if (dataEL) {
      dataEL.remove();
      dataEL = document.createElement("div");
      dataEL.id = "data";
      dataEL.innerText = firstDateTime.date;
    } else {
      dataEL = document.createElement("div");
      dataEL.id = "data";
      dataEL.innerText = firstDateTime.date;
    }
    // Dodajemy godziny jako osobne divy

    const sortedPrefferedHours =
      preferredHoursTest.length > 1
        ? preferredHoursTest.sort((a, b) => {
            // Porównujemy czas, traktując go jako godziny i minuty
            const [hoursA, minutesA] = a.time.split(":").map(Number);
            const [hoursB, minutesB] = b.time.split(":").map(Number);

            // Porównujemy godziny, a następnie minuty
            if (hoursA !== hoursB) {
              return hoursA - hoursB;
            }
            return minutesA - minutesB;
          })
        : preferredHoursTest;

    sortedPrefferedHours.forEach((dateTime, index) => {
      let timeDiv = document.querySelector(`#time-slot-${index}`);
      if (timeDiv) timeDiv.remove();

      timeDiv = document.createElement("div");
      timeDiv.classList.add("time-slot");
      timeDiv.id = `time-slot-${index}`;
      timeDiv.innerText = dateTime.time;

      // Pobieramy tylko godzinę
      timeDiv.addEventListener("click", () => {
        if (!intervalRunning) {
          let itemsStorage = preferredHoursTest;
          const newItems = itemsStorage.filter(
            (item) => item.id !== dateTime.id,
          );
          timeDiv.remove();
          safeStorageSet({ deleteItemFromPopUp: { dateTime } });
          preferredHoursTest = newItems;
          safeStorageSet({ myData: newItems });
          updateMySlots();
        }
      });

      let showDetails = document.querySelector(
        `#time-slot-${index} > .showDetails`,
      );

      if (showDetails) showDetails.remove();
      showDetails = document.createElement("div");
      showDetails.className = "showDetails";
      const showDetailsText = document.createElement("p");
      timeDiv.addEventListener("mouseover", () => {
        if (intervalRunning) {
          showDetailsText.innerText = "Musisz zatrzymać klikanie";
        } else {
          showDetailsText.innerText = "Kliknij, aby usunąć";
        }
      });
      showDetails.appendChild(showDetailsText);
      timeDiv.appendChild(showDetails);

      timeContainer.appendChild(timeDiv);
    });
    if (!h3EL) {
      h3EL = document.createElement("h3");
      h3EL.className = "my-slots-title";
      h3EL.innerText = "Wybrane sloty do klikania";
      mySlotsEL.appendChild(h3EL);
    }

    // Dodajemy timeContainer do dokumentu
    mySlotsEL.appendChild(dataEL);
    mySlotsEL.appendChild(timeContainer);
  } else {
    if (dataEL) dataEL.innerText = "";
    if (h3EL) h3EL.remove();
    if (timeContainer) timeContainer.remove();
    safeStorageSet({ myData: [] });
  }
}

function startCountdown() {
  const countdownElement = document.getElementById("countdown");
  const countInDay = document.querySelector("#countInDay");

  const minutes = 10;
  const numInDay = 4;

  let endTime = localStorage.getItem("countdownEndTime");
  let remainingTime = localStorage.getItem("remainingTime");
  let inDay = localStorage.getItem("remainingTimeInDay");

  // Sprawdzenie, czy minęła północ
  const lastReset = localStorage.getItem("lastReset");
  const today = new Date().toDateString();
  if (lastReset !== today) {
    localStorage.clear();
    localStorage.setItem("lastReset", today);
    endTime = null;
    remainingTime = null;
    inDay = 0;
  }

  if (inDay) {
    document.querySelector("#countInDay").innerText =
      `Wykorzystana ilość startów: ${inDay}/4`;
    if (Number(inDay) === numInDay) {
      const infoSpan = document.querySelector(".my-info-span");
      infoSpan.innerText = "Wykorzystano dostępną ilość kliknięć w ciągu dnia";
      infoSpan.style.color = "red";
      document.querySelector(".my-info-image").innerHTML = myImages.error;
      return false;
    } else if (Number(inDay) === 0) {
      countInDay.innerText = `Wykorzystana ilość startów: ${inDay}/4`;
    }
  }

  if (remainingTime) {
    endTime = Date.now() + parseInt(remainingTime, 10);
  } else if (!endTime) {
    endTime = Date.now() + minutes * 60 * 1000; // 30 minut od teraz
  } else {
    endTime = parseInt(endTime, 10);
  }

  localStorage.setItem("countdownEndTime", endTime);

  function updateCountdown() {
    const now = Date.now();
    const timeLeft = endTime - now;

    if (timeLeft <= 0) {
      countdownElement.innerText = "Pozostały czas aut.klikania: 00:00";
      countInDay.innerText = "";
      localStorage.removeItem("countdownEndTime");
      localStorage.removeItem("remainingTime");
      const inDay = localStorage.getItem("remainingTimeInDay");
      if (inDay) {
        const newInDay = Number(inDay) + 1;
        localStorage.setItem("remainingTimeInDay", newInDay);
      } else {
        localStorage.setItem("remainingTimeInDay", 1);
      }
      clearInterval(timerInterval);
      stopAutoClick();
      alert("Skończył się czas włącz ponownie automatyczne klikanie");
      return;
    }

    localStorage.setItem("remainingTime", timeLeft);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    countdownElement.innerText = `Pozostały czas aut. klikania: ${String(
      minutes,
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  updateCountdown();
  timerInterval = setInterval(updateCountdown, 1000);
  return true;
}

function stopCountdown() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

function startingPlugin() {
  const observerModal = new MutationObserver(
    async (mutationsList, observer) => {
      if (!pluginIsOn) return observer.disconnect();
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const modalContent = document.querySelector("#av-slots");
          if (modalContent) {
            observer.disconnect();
            createMenuElement();
            const cancelBtn = document.querySelector("#closeTvAppModalBtn");
            const submitBtn = document.querySelector("#submitBtn");
            submitBtn.addEventListener("click", resetPlugin);
            cancelBtn.addEventListener("click", () => {
              stopAutoClick();
              resetPlugin();
            });
          }
        }
      }
    },
  );

  observerModal.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

//Funkcja wstrzymująca klikanie
function stopAutoClick() {
  const stopBtn = document.querySelector("#stop");
  const startBtn = document.querySelector("#start");
  const infoSpan = document.querySelector(".my-info-span");
  const infoImage = document.querySelector(".my-info-image");
  if (intervalRunning === true) {
    isClickStop = true;
    if (!isToast || !isClickSuccess) {
      intervalRunning = false;
      if (slotsTimer) clearInterval(slotsTimer);
      if (slotsObserver) slotsObserver.disconnect();
      if (toastObserver) toastObserver.disconnect();
      if (toastObservertimer) clearInterval(toastObservertimer);
      stopCountdown();

      startBtn.style.display = "block";
      stopBtn.style.display = "none";
      stopBtn.innerText = "STOP";

      infoSpan.innerText = "Auto-clicker zatrzymany";
      infoSpan.style.color = "white";
      infoImage.innerHTML = myImages.stop;

      index = 0;
      isStartingRefresh = false;
      isClickStop = false;
      isClickSuccess = false;
      isToast = false;
      toastObserver = false;
      toastObservertimer = false;
      return true;
    } else {
      stopBtn.innerText = "Zatrzymywanie...";
      stopBtn.style.fontSize = "12px";
      stopBtn.disabled = true;
      stopBtn.style.cursor = "not-allowed";
    }
  } else return false;
}

//Funkcja Rozpoczynająca klikanie

async function startAutoClick() {
  const infoImage = document.querySelector(".my-info-image");
  const infoSpan = document.querySelector(".my-info-span");
  const stopBtn = document.querySelector("#stop");
  const startBtn = document.querySelector("#start");

  let storedId = await new Promise((resolve) => {
    safeStorageGet("storedId", (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Błąd przy pobieraniu z storage:",
          chrome.runtime.lastError,
        );
        resolve(null);
        return;
      }
      resolve(result?.storedId || null);
    });
  });

  if (storedId) {
    let test = "GOLD";
    if (!test) {
      alert("Brak subskrybcji");
      document.querySelector(".my-menu-for-slots").remove();
      document.querySelector(".my-menu-for-slots__wraper").remove();
      resetPlugin();
      safeStorageSet({ pluginIsOn: false });
      safeStorageRemove("myData");
      window.open("https://autoclicker.pl/", "_blank");
      return;
    }
  }

  if (preferredHoursTest.length === 0) {
    infoSpan.innerText = "Musisz wybrać jakiś slot";
    infoSpan.style.color = "red";
    infoImage.innerHTML = myImages.error;

    document
      .querySelectorAll("button.slot-btn")[0]
      .scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (checkSameDate(preferredHoursTest) === false) {
    infoSpan.innerText = "Musisz wybrać sloty z tego samego dnia";
    infoSpan.style.color = "red";
    infoImage.innerHTML = myImages.error;
    return;
  }
  if (!intervalRunning) {
    if (!subType || !premiumTypes.includes(subType)) {
      const isStart = startCountdown();
      if (!isStart) return;
    }

    clicksNumber = 0;
    targetDay = null;
    nextDay = null;
    preferredHours = null;
    selectors = [];
    isClickStop = false;
    isClickSuccess = false;
    isToast = false;
    lastRefreshClickAt = 0;
    refreshBackoffMs = 0;
    getTargetDay();
    getPreferredHours();

    stopBtn.disabled = false;
    stopBtn.style.cursor = "pointer";
    if (slotsTimer) clearInterval(slotsTimer);
    if (slotsObserver) slotsObserver.disconnect();

    if (toastObserver) toastObserver.disconnect();
    if (toastObservertimer) clearInterval(toastObservertimer);

    intervalRunning = true;
    isStartingRefresh = true;
    clickAlternating();

    const submitBtn = document.querySelector("#submitBtn");
    submitBtn.removeEventListener("click", resetPlugin);
    stopBtn.style.display = "block";
    stopBtn.style.fontSize = "20px";
    stopBtn.innerText = "Rozpoczynam..";
    stopBtn.style.backgroundColor = "yellowgreen";
    stopBtn.addEventListener("mouseover", () => {
      stopBtn.innerText = "STOP";
      stopBtn.style.backgroundColor = "red";
    });
    stopBtn.addEventListener("mouseout", () => {
      stopBtn.innerText = isStartingRefresh ? "Rozpoczynam.." : "Working...";
      stopBtn.style.backgroundColor = "yellowgreen";
    });

    startBtn.style.display = "none";
  }
}

function resetPlugin() {
  targetDay = null;
  nextDay = null;
  preferredHours = null;
  preferredHoursTest = [];
  selectors = [];
  intervalRunning = null;
  isWraperAnimation = false;
  isClickedFromAuto = false;
  clicksNumber = 0;
  timerInterval = null;
  slotsTimer = null;
  if (slotsObserver) slotsObserver.disconnect();
  slotsObserver = null;
  acceptTimer = null;
  if (acceptObserver) acceptObserver.disconnect();
  acceptObserver = null;
  if (toastObserver) toastObserver.disconnect();
  toastObserver = null;
  isToast = false;
  toastObservertimer = null;
  isClickSuccess = false;
  isClickStop = false;
  isStartingRefresh = false;
  startSlotValue = null;
  lastRefreshClickAt = 0;
  refreshBackoffMs = 0;
  // Reset chrome.storage
  safeStorageRemove("myData");

  // Usunięcie dynamicznych elementów z DOM
  const menu = document.querySelector(".my-menu-for-slots");
  const menuWrapper = document.querySelector(".my-menu-for-slots__wraper");

  if (menu) menu.remove();
  if (menuWrapper) menuWrapper.remove();

  const countdown = document.getElementById("countdown");
  if (countdown) countdown.innerText = "";

  const slotsEl = document.querySelector(".my-slots");
  if (slotsEl) slotsEl.innerHTML = "";

  const infoSpan = document.querySelector(".my-info-span");
  const infoImage = document.querySelector(".my-info-image");
  if (infoSpan) infoSpan.innerText = "";
  if (infoImage) infoImage.innerHTML = "";

  // Reset stylów przycisków
  const stopBtn = document.querySelector("#stop");
  const startBtn = document.querySelector("#start");
  if (stopBtn) {
    stopBtn.style.display = "none";
    stopBtn.innerText = "STOP";
    stopBtn.disabled = false;
  }
  if (startBtn) {
    startBtn.style.display = "block";
  }

  // Odświeżenie strony
  setTimeout(() => window.location.reload(), 3000);
}

// Nasłuchujemy na zmiany w głównym dokumencie
//Uruchamiamy wszystko

safeStorageGet("pluginIsOn", async (result) => {
  if (result.pluginIsOn === true) {
    // pluginIsOn = true;

    safeStorageSet({ premium: "GOLD" });
    startingPlugin();
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    //pluginIsOn = false;
  }
});
