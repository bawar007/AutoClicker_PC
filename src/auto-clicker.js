// ==================== AUTO CLICKER CORE LOGIC ====================
// Logika przeniesiona z chrome-extension/content.js
// Bez zależności od Chrome API

(function () {
  "use strict";

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
  let lastSyncSlotsCount = -1; // Śledzenie ostatniej synchronizacji
  let syncTimeout = null; // Debouncing synchronizacji

  const debugMode = true; // Ustaw na false, aby wyłączyć logi debugowania

  // Eksponuj globalny stan dla komunikacji z panelem
  window.AutoClickerState = {
    slotsCount: 0,
    slots: [],
    isRunning: false,
    timestamp: 0,
  };
  const REFRESH_MIN_INTERVAL_MS = 850;
  const REFRESH_RATE_LIMIT_CHECK_MS = 500;
  const REFRESH_BACKOFF_STEP_MS = 700;
  const REFRESH_BACKOFF_MAX_MS = 5000;
  const REFRESH_BACKOFF_DECAY_MS = 200;

  const premiumTypes = ["GOLD", "BUSINESS GOLD"];
  const basicType = "BASIC";

  const myImages = {
    succes: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="green"><rect fill="none" height="24" width="24"/><path d="M22,5.18L10.59,16.6l-4.24-4.24l1.41-1.41l2.83,2.83l10-10L22,5.18z M19.79,10.22C19.92,10.79,20,11.39,20,12 c0,4.42-3.58,8-8,8s-8-3.58-8-8c0-4.42,3.58-8,8-8c1.58,0,3.04,0.46,4.28,1.25l1.44-1.44C16.1,2.67,14.13,2,12,2C6.48,2,2,6.48,2,12 c0,5.52,4.48,10,10,10s10-4.48,10-10c0-1.19-0.22-2.33-0.6-3.39L19.79,10.22z"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="red"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/></svg>`,
    waiting: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="yellow"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M12,20c-4.42,0-8-3.58-8-8 c0-4.42,3.58-8,8-8s8,3.58,8,8C20,16.42,16.42,20,12,20z"/><circle cx="7" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="17" cy="12" r="1.5"/></g></g></svg>`,
    stop: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><path d="M0 0h24v24H0z" fill="none"/><path d="M18 24h-6.55c-1.08 0-2.14-.45-2.89-1.23l-7.3-7.61 2.07-1.83c.62-.55 1.53-.66 2.26-.27L8 14.34V4.79c0-1.38 1.12-2.5 2.5-2.5.17 0 .34.02.51.05.09-1.3 1.17-2.33 2.49-2.33.86 0 1.61.43 2.06 1.09.29-.12.61-.18.94-.18 1.38 0 2.5 1.12 2.5 2.5v.28c.16-.03.33-.05.5-.05 1.38 0 2.5 1.12 2.5 2.5V20c0 2.21-1.79 4-4 4zM4.14 15.28l5.86 6.1c.38.39.9.62 1.44.62H18c1.1 0 2-.9 2-2V6.15c0-.28-.22-.5-.5-.5s-.5.22-.5.5V12h-2V3.42c0-.28-.22-.5-.5-.5s-.5.22-.5.5V12h-2V2.51c0-.28-.22-.5-.5-.5s-.5.22-.5.5V12h-2V4.79c0-.28-.22-.5-.5-.5s-.5.23-.5.5v12.87l-5.35-2.83-.51.45z"/></svg>`,
    reload: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><g><path d="M6,13c0-1.65,0.67-3.15,1.76-4.24L6.34,7.34C4.9,8.79,4,10.79,4,13c0,4.08,3.05,7.44,7,7.93v-2.02 C8.17,18.43,6,15.97,6,13z M20,13c0-4.42-3.58-8-8-8c-0.06,0-0.12,0.01-0.18,0.01l1.09-1.09L11.5,2.5L8,6l3.5,3.5l1.41-1.41 l-1.08-1.08C11.89,7.01,11.95,7,12,7c3.31,0,6,2.69,6,6c0,2.97-2.17,5.43-5,5.91v2.02C16.95,20.44,20,17.08,20,13z"/></g></g></svg>`,
    progress: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="green"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 9c-.04-4.39-3.6-7.93-8-7.93S4.04 4.61 4 9v6c0 4.42 3.58 8 8 8s8-3.58 8-8V9zm-2 0h-5V3.16c2.81.47 4.96 2.9 5 5.84zm-7-5.84V9H6c.04-2.94 2.19-5.37 5-5.84zM18 15c0 3.31-2.69 6-6 6s-6-2.69-6-6v-4h12v4z"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><rect fill="none" height="24" width="24"/><path d="M19,19H5V5h14V19z M3,3v18h18V3H3z M17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41L8.41,7L12,10.59L15.59,7 L17,8.41L13.41,12L17,15.59z"/></svg>`,
    robot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="width:24px;height:24px;"><path d="M320 0c17.7 0 32 14.3 32 32l0 64 120 0c39.8 0 72 32.2 72 72l0 272c0 39.8-32.2 72-72 72l-304 0c-39.8 0-72-32.2-72-72l0-272c0-39.8 32.2-72 72-72l120 0 0-64c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zM264 256a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm152 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80zM48 224l16 0 0 192-16 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-16 0 0-192 16 0z"/></svg>`,
  };

  // Storage implementation - localStorage zamiast chrome.storage
  const storage = {
    get: (key, callback) => {
      try {
        const data = localStorage.getItem(key);
        callback(data ? { [key]: JSON.parse(data) } : {});
      } catch (e) {
        callback({});
      }
    },
    set: (data, callback) => {
      try {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        if (callback) callback();
      } catch (e) {
        if (callback) callback();
      }
    },
    remove: (key, callback) => {
      try {
        localStorage.removeItem(key);
        if (callback) callback();
      } catch (e) {
        if (callback) callback();
      }
    },
  };

  // Safe storage wrappers
  function safeStorageRemove(key, callback = null) {
    storage.remove(key, callback);
  }

  function safeStorageGet(keys, callback) {
    const safeCallback = typeof callback === "function" ? callback : () => {};
    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach((key) => {
        storage.get(key, (data) => {
          Object.assign(result, data);
        });
      });
      safeCallback(result);
    } else {
      storage.get(keys, safeCallback);
    }
  }

  function safeStorageSet(data, callback = null) {
    storage.set(data, callback);
  }

  // Wstrzyknij style dla menu AutoClickera
  function injectStyles() {
    if (document.getElementById("auto-clicker-styles")) return;

    const styleElement = document.createElement("style");
    styleElement.id = "auto-clicker-styles";
    styleElement.textContent = `
      .myInput{display:none;pointer-events:none!important}
      .input-wraper{position:relative;margin:5px 0}
      .span-wraper{display:block!important;position:absolute;background:#0ff;width:140px!important;left:calc(50% - 70px);bottom:-30px;border-radius:5px;padding:5px;z-index:1;opacity:0;transition:.3s;pointer-events:none}
      .span-wraper::before{content:"";width:10px;height:10px;background-color:#0ff;position:absolute;top:-5px;left:calc(50% - 5px);transform:rotate(45deg)}
      .span-info{font-weight:700;font-size:12px}
      .span-animation{animation:.5s ease-in forwards spanAnimation}
      @keyframes spanAnimation{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateX(0)}}
      .my-menu-for-slots{display:none;width:50px!important;height:50px!important;position:fixed;bottom:20px;right:20px;border-radius:50%;background-color:#000;z-index:2100!important}
      .my-menu-for-slots__btn{width:100%;height:100%;background-color:red;border-radius:50%}
      #countdown,.my-slots-title{text-align:center}
      .my-menu-for-slots__input{position:absolute;left:10px;top:-20px;pointer-events:none;z-index:-1!important;visibility:hidden}
      .my-menu-for-slots__wraper{display:flex;flex-direction:column;position:absolute;width:250px;background-color:#181818;color:#fff;padding:10px;z-index:2100!important;bottom:20px;right:30px;transition:.5s ease-in;transform:scale(0);transform-origin:bottom right;border-radius:10px;box-shadow:0 0 14px 0 #000}
      .my-menu-for-slots__wraper--visible{transform:scale(1);transform-origin:top left!important;user-select:none}
      .my-menu-for-slots__closeBtn{width:auto;height:auto;display:flex;justify-content:center;align-items:center;position:absolute;right:7px;top:7px;padding:0;background-color:transparent;border:none}
      #countInDay{text-align:center}
      .time-slot{width:30%;background-color:#ff000038;display:flex;justify-content:center;align-items:center;padding:5px 0;border:1px solid red;border-radius:15px;margin-top:5px;position:relative}
      .time-slot:hover{cursor:pointer}
      .time-slot:hover>.showDetails{display:flex;justify-content:center;align-items:center;opacity:1}
      #time-container{display:flex;flex-direction:row;flex-wrap:wrap;width:100%;padding:5px;justify-content:space-evenly;align-items:center}
      .my-slots{display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
      h3{margin:5px 0}
      .my-info-span-wraper{display:flex;flex-direction:row;align-items:center;justify-content:space-between;margin-top:10px;width:100%;padding:0 5px}
      .my-slots-header{width:calc(100% - 20px);display:flex;flex-direction:row;align-items:center;justify-content:flex-start}
      .my-slots-header-title{margin-left:25px}
      .my-info-span{font-size:10px;width:calc(100% - 24px);text-align:center;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px}
      .my-info-wraper-div{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:10px;width:100%!important}
      .my-info-image{width:24px}
      .showDetails{display:flex;justify-content:center;align-items:center;position:absolute;bottom:-35px;left:calc(50% - 75px);background:#fff;color:#000;width:150px;padding:5px;font-size:12px;border-radius:10px;z-index:3;opacity:0;transition:.5s ease-in;pointer-events:none;text-align:center}
      .showDetails>p{margin:0!important}
      .showDetails::before{content:"";position:absolute;top:-5px;left:calc(50% - 5px);background-color:#fff;width:10px;height:10px;transform:rotate(45deg)}
      .btnContainer{display:flex;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center;width:100%;margin-top:10px}
      #start{background-color:#246424;color:#fff;font-size:20px;text-transform:uppercase;letter-spacing:1.2px}
      .btnStyle{margin:5px;padding:10px;width:80%;border-radius:10px;border:none;box-shadow:0 0 13px 0 #571919}
      .btnStyle:hover{background-color:#065dd8;transform:translateY(-2px);cursor:pointer}
      #stop{background-color:red;display:none;font-size:18px;letter-spacing:1.2px}
      #resume{background-color:#48488d;width:45%;color:#fff;font-size:18px;letter-spacing:1.2px}
      .stats-wraper{display:flex;flex-direction:column;width:100%;padding:10px;justify-content:center;align-items:flex-start;margin-top:10px}
      #data{text-align:center}
    `;
    document.head.appendChild(styleElement);
  }

  // Funkcje pomocnicze
  async function getTargetDay() {
    if (!targetDay && preferredHoursTest.length > 0) {
      targetDay = preferredHoursTest[0].date;
    }
  }

  function getPreferredHours() {
    if (!preferredHours && preferredHoursTest.length > 0) {
      preferredHours = preferredHoursTest
        .map((item) => item.time)
        .sort((a, b) => a.localeCompare(b));
    }
  }

  function formatDateTime(datetime) {
    let [date, time] = datetime.split(" ");
    return {
      date: date,
      time: time.split(":").slice(0, 2).join(":"),
    };
  }

  function checkSameDate(dataArray) {
    return dataArray.every((item) => item.date === dataArray[0].date);
  }

  async function waitForSlotsDetails() {
    return new Promise((resolve) => {
      const slotsContainer = document.querySelector("#av-slots");
      if (!slotsContainer) {
        resolve();
        return;
      }

      slotsObserver = new MutationObserver((mutations, obs) => {
        const slotButtons = document.querySelectorAll("button.slot-btn");
        if (slotButtons.length > 0) {
          obs.disconnect();
          clearTimeout(slotsTimer);
          slotsObserver = false;
          slotsTimer = false;
          resolve();
        }
      });

      slotsObserver.observe(slotsContainer, { childList: true, subtree: true });

      slotsTimer = setTimeout(() => {
        slotsObserver.disconnect();
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
      if (!bodyEl || isClickStop) {
        resolve(true);
        return;
      }

      toastObserver = new MutationObserver((mutations, obs) => {
        const slotButtons = document.querySelector("#toast-container");
        if (slotButtons) {
          obs.disconnect();
          clearTimeout(toastObservertimer);
          acceptObserver = false;
          resolve(true);
        }
      });

      toastObserver.observe(bodyEl, { childList: true, subtree: true });

      toastObservertimer = setTimeout(() => {
        if (toastObserver) toastObserver.disconnect();
        toastObserver = false;
        resolve(false);
      }, timeOut);
    });
  }

  async function waitForSuccessInfo() {
    return new Promise((resolve) => {
      const bodyEl = document.querySelector("body");
      if (!bodyEl || isClickStop) {
        resolve(false);
        return;
      }
      isClickSuccess = true;
      acceptObserver = new MutationObserver((mutations, obs) => {
        const slotButtons = document.querySelector(".swal2-container");
        if (slotButtons) {
          obs.disconnect();
          clearTimeout(acceptTimer);
          acceptObserver = false;
          isClickSuccess = false;
          resolve(true);
        }
      });

      acceptObserver.observe(bodyEl, { childList: true, subtree: true });

      acceptTimer = setTimeout(() => {
        if (acceptObserver) acceptObserver.disconnect();
        acceptObserver = false;
        isClickSuccess = false;
        resolve(false);
      }, 20000);
    });
  }

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
      if (element) return element;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  async function waitForSlotWaiterHidden(timeout = 15000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (!intervalRunning || isClickStop) return false;
      const slotWaiter = document.querySelector(".vbs-slot-waiter");
      if (!slotWaiter || slotWaiter.classList.contains("vbs-d-none"))
        return true;
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
      if (isRefreshRateLimitToastVisible()) return true;
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
        if (refreshInContainer) return refreshInContainer;
      }
    }

    const refreshButtons = document.querySelectorAll(
      "button.vbs-refresh-slt-btn",
    );
    if (!refreshButtons.length) return null;
    return refreshButtons[0] || null;
  }

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
        if (stopBtn) stopBtn.innerText = "Klikam...";
        if (infoSpan) {
          infoSpan.innerText = "Slot dostępny, podejmowanie próby kliknięcia";
          infoSpan.style.color = "green";
        }
        isClickedFromAuto = true;
        await clickElementWithUserEvent(slotButton);

        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) await clickElementWithUserEvent(submitBtn);

        const confirmBtn = document.querySelector("button.swal2-confirm");
        if (confirmBtn) await clickElementWithUserEvent(confirmBtn);
        clicksNumber++;

        const statsClicks = document.querySelector(".stats-clicks");
        if (statsClicks)
          statsClicks.innerText = `Ilość prób kliknięcia: ${clicksNumber}`;

        if (infoSpan) {
          infoSpan.innerText = "Sprawdzam, czy jest dostęp";
          infoSpan.style.color = "yellow";
        }

        const infoImage = document.querySelector(".my-info-image");
        if (infoImage) infoImage.innerHTML = myImages.waiting;

        isToast = await waitForToast();
        let isAccepted = false;
        if (!isToast) {
          isAccepted = await waitForSuccessInfo();
        }

        isClickedFromAuto = false;
        if (isToast || !isAccepted) {
          if (document.querySelectorAll("button.slot-btn")[0]) {
            document
              .querySelectorAll("button.slot-btn")[0]
              .scrollIntoView({ behavior: "smooth", block: "center" });
          }

          if (intervalRunning) {
            if (infoSpan) {
              infoSpan.innerText = "Brak slotów, wznawiam auto-click";
              infoSpan.style.color = "white";
            }
            if (infoImage) infoImage.innerHTML = myImages.reload;
          } else {
            if (infoSpan) infoSpan.innerText = "";
            if (infoImage) infoImage.innerHTML = "";
          }

          setTimeout(() => false, 5000);
        } else if (isAccepted) {
          if (infoSpan) {
            infoSpan.innerText = "Próba zakończona sukcesem !!";
            infoSpan.style.color = "green";
          }
          if (infoImage) infoImage.innerHTML = myImages.succes;
          return true;
        }
      }
    }
    setTimeout(() => false, 10000);
  }

  async function clickAlternating() {
    let foundAndClicked = false;
    const infoSpan = document.querySelector(".my-info-span");
    const infoImage = document.querySelector(".my-info-image");
    const stopBtn = document.querySelector("#stop");

    if (infoImage) infoImage.innerHTML = myImages.progress;
    if (infoSpan) {
      infoSpan.innerText = "Auto-click w trakcie..";
      infoSpan.style.color = "green";
    }

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
        if (infoSpan) {
          infoSpan.innerText =
            "Wykryto zbyt częste odświeżanie, spowalniam auto-refresh";
          infoSpan.style.color = "yellow";
        }
        if (infoImage) infoImage.innerHTML = myImages.waiting;
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
        if (infoImage) infoImage.innerHTML = myImages.progress;
        if (infoSpan) infoSpan.style.color = "green";
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

        if (stopBtn) {
          stopBtn.style.display = "none";
          stopBtn.innerText = "STOP";
        }
        if (startBtn) startBtn.style.display = "block";

        if (infoSpan) {
          infoSpan.innerText = "Auto-clicker zatrzymany";
          infoSpan.style.color = "white";
        }
        if (infoImage) infoImage.innerHTML = myImages.stop;

        index = 0;
        isStartingRefresh = false;
        isClickStop = false;
        isClickSuccess = false;
        isToast = false;
        toastObserver = false;
        toastObservertimer = false;

        // Synchronizuj ze panelem
        syncWithPanel();
        return true;
      } else {
        if (stopBtn) {
          stopBtn.innerText = "Zatrzymywanie...";
          stopBtn.style.fontSize = "12px";
          stopBtn.disabled = true;
          stopBtn.style.cursor = "not-allowed";
        }
      }
    }
    return false;
  }

  async function startAutoClick() {
    const infoImage = document.querySelector(".my-info-image");
    const infoSpan = document.querySelector(".my-info-span");
    const stopBtn = document.querySelector("#stop");
    const startBtn = document.querySelector("#start");

    if (preferredHoursTest.length === 0) {
      if (infoSpan) {
        infoSpan.innerText = "Musisz wybrać jakiś slot";
        infoSpan.style.color = "red";
      }
      if (infoImage) infoImage.innerHTML = myImages.error;
      document
        .querySelectorAll("button.slot-btn")[0]
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (checkSameDate(preferredHoursTest) === false) {
      if (infoSpan) {
        infoSpan.innerText = "Musisz wybrać sloty z tego samego dnia";
        infoSpan.style.color = "red";
      }
      if (infoImage) infoImage.innerHTML = myImages.error;
      return;
    }

    if (!intervalRunning) {
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

      await getTargetDay();
      getPreferredHours();

      if (stopBtn) {
        stopBtn.disabled = false;
        stopBtn.style.cursor = "pointer";
      }
      if (slotsTimer) clearInterval(slotsTimer);
      if (slotsObserver) slotsObserver.disconnect();
      if (toastObserver) toastObserver.disconnect();
      if (toastObservertimer) clearInterval(toastObservertimer);

      intervalRunning = true;
      isStartingRefresh = true;
      clickAlternating();

      // Synchronizuj ze panelem
      syncWithPanel();

      if (stopBtn) {
        stopBtn.style.display = "block";
        stopBtn.style.fontSize = "20px";
        stopBtn.innerText = "Rozpoczynam..";
        stopBtn.style.backgroundColor = "yellowgreen";
        stopBtn.addEventListener("mouseover", () => {
          stopBtn.innerText = "STOP";
          stopBtn.style.backgroundColor = "red";
        });
        stopBtn.addEventListener("mouseout", () => {
          stopBtn.innerText = isStartingRefresh
            ? "Rozpoczynam.."
            : "Working...";
          stopBtn.style.backgroundColor = "yellowgreen";
        });
      }
      if (startBtn) startBtn.style.display = "none";
    }
  }

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
              if (btnEl) btnEl.style.backgroundColor = "lightblue";
            }
          });
        }
      });
    }
  }

  function handleCheckboxChange(
    input,
    btnElInDiv,
    index,
    spanEl,
    spanWraperDiv,
  ) {
    input.addEventListener("change", (event) => {
      if (event.target.checked) {
        if (!isClickedFromAuto) {
          safeStorageGet("myData", (result) => {
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
            updateMySlots();
          });
        }
      } else {
        if (!isClickedFromAuto) {
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
            updateMySlots();
          });
        }
      }
    });
  }

  function addCheckboxToSlot(el, index) {
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
            btnElInDiv.style.backgroundColor = input.checked
              ? "lightblue"
              : null;
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

  function processMutations(mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" || mutation.type === "characterData") {
        const divEl = document.querySelectorAll("#av-slots > div");
        handleSlotSelection(divEl);
        divEl.forEach((el, index) => addCheckboxToSlot(el, index));
      }
    }
  }

  function observeContent(element) {
    const contentObserver = new MutationObserver(processMutations);
    contentObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const divEl = document.querySelectorAll("#av-slots > div");
    handleSlotSelection(divEl);
    divEl.forEach((el, index) => addCheckboxToSlot(el, index));
  }

  function handleModalReady() {
    if (!document.querySelector(".my-menu-for-slots__wraper")) {
      createMenuElement();
      updateMySlots();
    }
    const cancelBtn = document.querySelector("#closeTvAppModalBtn");
    const submitBtn = document.querySelector("#submitBtn");
    if (submitBtn) submitBtn.addEventListener("click", resetPlugin);
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        stopAutoClick();
        resetPlugin();
      });
    }
  }

  function startSlotObservers() {
    const avSlots = document.getElementById("av-slots");
    if (avSlots) {
      handleModalReady();
      observeContent(avSlots);
      return;
    }

    const observer = new MutationObserver((mutationsList, observer) => {
      if (!pluginIsOn) return observer.disconnect();
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const avSlots = document.getElementById("av-slots");
          if (avSlots) {
            observer.disconnect();
            observeContent(avSlots);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

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
      const menuBtn = createEl("div", "my-menu-for-slots");
      const wraperEl = createEl("div", "my-menu-for-slots__wraper");
      const toggleBtn = createEl("button", "my-menu-for-slots__btn");
      const checkedInput = createEl(
        "input",
        "my-menu-for-slots__input",
        "",
        "checkbox",
      );
      const closeBtn = createEl("button", "my-menu-for-slots__closeBtn");
      closeBtn.innerHTML = myImages.close;

      const infoWraper = createEl("div", "my-info-wraper-div");
      const statElClicks = createEl("span", "stats-clicks");
      const spanTimer = createEl("span", "", "countdown");
      const countTimer = createEl("span", "", "countInDay");

      const infoSpanDiv = createEl("div", "my-info-span-wraper");
      const infoSpanDivImage = createEl("div", "my-info-image");
      const infoSpan = createEl("span", "my-info-span");

      const mySlots = createEl("div", "my-slots");

      toggleBtn.innerHTML = myImages.robot;

      const mySlotsHeader = createEl("div", "my-slots-header");
      const mySlotsTitle = createEl("h3", "my-slots-header-title");
      mySlotsTitle.innerText = "Auto-Clicker";

      mySlotsHeader.appendChild(mySlotsTitle);

      if (subType === basicType) {
        mySlotsHeader.innerHTML = myImages.robotStylingSilver || myImages.robot;
        statElClicks.innerText =
          clicksNumber !== 0 ? `Ilość prób kliknięcia: ${clicksNumber}` : "";
      } else {
        mySlotsHeader.innerHTML = myImages.robotStylingGold || myImages.robot;
      }

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

      closeBtn.addEventListener("click", () => {
        checkedInput.checked = false;
        menuBtn.style.display = "block";
        if (wraperEl.classList.contains("my-menu-for-slots__wraper--visible")) {
          wraperEl.classList.remove("my-menu-for-slots__wraper--visible");
        }
      });

      infoSpanDiv.append(infoSpanDivImage, infoSpan);
      infoWraper.append(statElClicks, spanTimer, countTimer);
      wraperEl.appendChild(mySlotsHeader);
      wraperEl.append(infoWraper, mySlots, closeBtn);
      createControlButtons(wraperEl);
      wraperEl.appendChild(infoSpanDiv);
      menuBtn.append(checkedInput, toggleBtn);

      body.append(menuBtn, wraperEl);
      menuBtn.style.display = "block";
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
      const firstDateTime = preferredHoursTest[0];

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

      if (!h3EL) {
        h3EL = document.createElement("h3");
        h3EL.className = "my-slots-title";
        h3EL.innerText = "Wybrane sloty do klikania";
        mySlotsEL.appendChild(h3EL);
      }

      const sortedPrefferedHours =
        preferredHoursTest.length > 1
          ? preferredHoursTest.sort((a, b) => {
              const [hoursA, minutesA] = a.time.split(":").map(Number);
              const [hoursB, minutesB] = b.time.split(":").map(Number);
              if (hoursA !== hoursB) return hoursA - hoursB;
              return minutesA - minutesB;
            })
          : preferredHoursTest;

      sortedPrefferedHours.forEach((dateTime, idx) => {
        let timeDiv = document.querySelector(`#time-slot-${idx}`);
        if (timeDiv) timeDiv.remove();

        timeDiv = document.createElement("div");
        timeDiv.classList.add("time-slot");
        timeDiv.id = `time-slot-${idx}`;
        timeDiv.innerText = dateTime.time;

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
          `#time-slot-${idx} > .showDetails`,
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

      mySlotsEL.appendChild(dataEL);
      mySlotsEL.appendChild(timeContainer);
    } else {
      if (dataEL) dataEL.innerText = "";
      if (h3EL) h3EL.remove();
      if (timeContainer) timeContainer.remove();
      safeStorageSet({ myData: [] });
    }

    // Synchronizuj ze panelem kontrolnym
    syncWithPanel();
  }

  function syncWithPanel() {
    // Aktualizuj globalny stan dla komunikacji z panelem
    const currentCount = preferredHoursTest ? preferredHoursTest.length : 0;

    // Jeśli liczba slotów się zmieniła, zaktualizuj stan
    if (currentCount !== lastSyncSlotsCount || intervalRunning !== null) {
      lastSyncSlotsCount = currentCount;

      // Zaktualizuj globalny stan
      window.AutoClickerState = {
        slotsCount: currentCount,
        slots: preferredHoursTest || [],
        isRunning: intervalRunning !== null,
        timestamp: Date.now(),
      };

      if (debugMode) {
        console.log("[AutoClicker] State synced:", window.AutoClickerState);
      }
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
      if (countInDay)
        countInDay.innerText = `Wykorzystana ilość startów: ${inDay}/4`;
      if (Number(inDay) === numInDay) {
        const infoSpan = document.querySelector(".my-info-span");
        if (infoSpan)
          infoSpan.innerText =
            "Wykorzystano dostępną ilość kliknięć w ciągu dnia";
        if (infoSpan) infoSpan.style.color = "red";
        const infoImage = document.querySelector(".my-info-image");
        if (infoImage) infoImage.innerHTML = myImages.error;
        return false;
      }
    }

    if (remainingTime) {
      endTime = Date.now() + parseInt(remainingTime, 10);
    } else if (!endTime) {
      endTime = Date.now() + minutes * 60 * 1000;
    } else {
      endTime = parseInt(endTime, 10);
    }

    localStorage.setItem("countdownEndTime", endTime);

    function updateCountdown() {
      const now = Date.now();
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        if (countdownElement)
          countdownElement.innerText = "Pozostały czas aut.klikania: 00:00";
        if (countInDay) countInDay.innerText = "";
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
      const mins = Math.floor(timeLeft / 60000);
      const secs = Math.floor((timeLeft % 60000) / 1000);
      if (countdownElement) {
        countdownElement.innerText = `Pozostały czas aut. klikania: ${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      }
    }

    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);
    return true;
  }

  function stopCountdown() {
    if (timerInterval) clearInterval(timerInterval);
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
              handleModalReady();
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

  function clearAllSlots() {
    preferredHoursTest = [];
    lastSyncSlotsCount = -1; // Reset synchronizacji
    const allCheckboxes = document.querySelectorAll("input.myInput");
    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
      const parent = checkbox.closest("div");
      if (parent) {
        const slotBtn = parent.querySelector("button.slot-btn");
        if (slotBtn) {
          slotBtn.style.backgroundColor = null;
        }
      }
    });

    updateMySlots();
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

    clearAllSlots();

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

    const stopBtn = document.querySelector("#stop");
    const startBtn = document.querySelector("#start");
    if (stopBtn) {
      stopBtn.style.display = "none";
      stopBtn.innerText = "STOP";
      stopBtn.disabled = false;
    }
    if (startBtn) startBtn.style.display = "block";

    setTimeout(() => window.location.reload(), 3000);
  }

  // Initialization - detect premium
  safeStorageGet(["pluginIsOn", "myData"], (result) => {
    if (result.pluginIsOn === true || result.myData) {
      injectStyles();
      subType = "GOLD";
      safeStorageSet({ premium: "GOLD" });
      if (result.myData && Array.isArray(result.myData)) {
        preferredHoursTest = result.myData;
      }
      startingPlugin();
      startSlotObservers();
    }
  });

  // Public API
  window.AutoClicker = {
    init: () => {
      const avSlots = document.querySelector("#av-slots");

      if (!avSlots) {
        // Panel rezerwacji nie istnieje - czekaj na jego pojawienie się
        console.log(
          "AutoClicker: Panel rezerwacji nie znaleziony, czekam na jego pojawienie...",
        );

        // Utwórz obserwer który będzie czekać na pojawienie się panelu
        let panelObserver = null;
        let observerTimeout = null;

        const watchForPanel = () => {
          panelObserver = new MutationObserver((mutations) => {
            if (document.querySelector("#av-slots")) {
              console.log(
                "✓ AutoClicker: Panel rezerwacji wykryty! Inicjalizuję...",
              );

              // Wyczyść obserwer
              if (panelObserver) {
                panelObserver.disconnect();
                panelObserver = null;
              }
              if (observerTimeout) {
                clearTimeout(observerTimeout);
              }

              // Reinicjalizuj z panelem
              window.AutoClicker._initializeWithPanel();
            }
          });

          panelObserver.observe(document.body, {
            childList: true,
            subtree: true,
          });

          // Timeout - jeśli panel się nie pojawi w ciągu 5 minut, zrezygnuj
          observerTimeout = setTimeout(
            () => {
              if (panelObserver) {
                panelObserver.disconnect();
                panelObserver = null;
                console.log(
                  "AutoClicker: Timeout - panel rezerwacji nie pojawił się w ciągu 5 minut",
                );
              }
            },
            5 * 60 * 1000,
          );
        };

        // Dodaj sygnał dla UI że czekamy
        window.AutoClicker.waitingForPanel = true;
        window.AutoClicker._watchForPanel = watchForPanel;
        watchForPanel();

        return false; // Zwróć false - jeszcze się nie zainicjalizował
      }

      // Panel istnieje - inicjalizuj od razu
      return window.AutoClicker._initializeWithPanel();
    },

    _initializeWithPanel: () => {
      // Rzeczywista inicjalizacja gdy panel istnieje
      injectStyles();
      pluginIsOn = true;
      subType = "GOLD";
      safeStorageSet({ pluginIsOn: true });
      safeStorageSet({ premium: "GOLD" });

      safeStorageGet("myData", (result) => {
        if (result.myData && Array.isArray(result.myData)) {
          preferredHoursTest = result.myData;
        }
      });

      startingPlugin();
      startSlotObservers();
      window.AutoClicker.waitingForPanel = false;
      console.log("✓ AutoClicker: Zainicjalizowany");
      return true;
    },
    start: startAutoClick,
    stop: stopAutoClick,
    reset: resetPlugin,
    clearAllSlots: clearAllSlots,
    addSlot: (dateString, timeString) => {
      const id = `slot-${Date.now()}`;
      preferredHoursTest.push({
        date: dateString,
        time: timeString,
        id: id,
      });
      safeStorageSet({ myData: preferredHoursTest });
    },
    removeSlot: (id) => {
      preferredHoursTest = preferredHoursTest.filter((item) => item.id !== id);
      safeStorageSet({ myData: preferredHoursTest });
    },
    getSlots: () => preferredHoursTest,
    isRunning: () => intervalRunning,
  };

  console.log("✓ AutoClicker loaded");
})();
