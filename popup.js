// Temu Yerel Ürün Gizleyici - Popup Mantığı

const toggleFilter = document.getElementById("toggleFilter");
const modeGroup = document.getElementById("modeGroup");
const countDisplay = document.getElementById("countDisplay");
const contentArea = document.getElementById("contentArea");

// Başlangıç ayarlarını yükle
chrome.storage.sync.get(
  {
    enabled: true,
    mode: "hide"
  },
  (items) => {
    toggleFilter.checked = items.enabled;
    updateModeUI(items.mode);
    updateEnabledUI(items.enabled);
  }
);

// Aktif sekmedeki gizlenen ürün sayısını öğren (Kesin sayı)
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeTabId = tabs[0]?.id;
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, { action: "GET_COUNT" }, (response) => {
      if (!chrome.runtime.lastError && response && typeof response.count === "number") {
        countDisplay.textContent = response.count.toString();
      } else {
        chrome.runtime.sendMessage({ action: "GET_TAB_COUNT", tabId: activeTabId }, (bgRes) => {
          if (!chrome.runtime.lastError && bgRes && typeof bgRes.count === "number") {
            countDisplay.textContent = bgRes.count.toString();
          } else {
            chrome.action.getBadgeText({ tabId: activeTabId }, (badgeText) => {
              countDisplay.textContent = badgeText || "0";
            });
          }
        });
      }
    });
  }
});

// Aç/Kapa anahtarı değiştiğinde
toggleFilter.addEventListener("change", () => {
  const isEnabled = toggleFilter.checked;
  chrome.storage.sync.set({ enabled: isEnabled });
  updateEnabledUI(isEnabled);
});

// Filtre açık/kapalı durumuna göre arayüzün soluklaşması
function updateEnabledUI(isEnabled) {
  if (isEnabled) {
    contentArea.classList.remove("disabled");
  } else {
    contentArea.classList.add("disabled");
  }
}

// Mod butonları (Tamamen Gizle / Soluklaştır)
modeGroup.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.getAttribute("data-mode");
    updateModeUI(mode);
    chrome.storage.sync.set({ mode: mode });
  });
});

function updateModeUI(mode) {
  modeGroup.querySelectorAll(".mode-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-mode") === mode;
    btn.setAttribute("aria-pressed", String(isActive));
    if (isActive) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

