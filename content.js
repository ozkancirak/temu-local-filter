// Temu Yerel Ürün Filtresi - Content Script


(() => {
  // Sabit yerel ürün belirteçleri
  const LOCAL_KEYWORDS = [
    "yerel",
    "local",
    "yerel depo",
    "yerel satıcı",
    "local warehouse",
    "tr depo"
  ];

  let config = {
    enabled: true,
    mode: "hide" // 'hide' (tamamen gizle) veya 'dim' (yarı saydam yap)
  };

  let hiddenCount = 0;
  let debounceTimer = null;

  // Ayarları hafızaya yükle
  chrome.storage.sync.get(
    {
      enabled: true,
      mode: "hide"
    },
    (items) => {
      config.enabled = items.enabled;
      config.mode = items.mode;

      if (config.enabled) {
        runFilter();
      }
    }
  );

  // Ayar değişikliklerini dinle
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;

    let needsReapply = false;

    if (changes.enabled !== undefined) {
      config.enabled = changes.enabled.newValue;
      needsReapply = true;
    }
    if (changes.mode !== undefined) {
      config.mode = changes.mode.newValue;
      needsReapply = true;
    }

    if (needsReapply) {
      clearAllModifications();
      if (config.enabled) {
        runFilter();
      }
    }
  });

  // Metnin yerel ürün belirteci olup olmadığını kontrol et
  function isLocalBadgeText(text) {
    if (!text || text.length > 25) return false;
    const cleanText = text.trim().toLowerCase();
    return LOCAL_KEYWORDS.some((kw) => {
      return (
        cleanText === kw ||
        cleanText === `[${kw}]` ||
        cleanText.startsWith(`${kw} `) ||
        cleanText.endsWith(` ${kw}`)
      );
    });
  }

  // Ürün kartının en dış grid/liste kapsayıcısını bulma
  function findProductCard(badgeElement) {
    let cardCandidate = badgeElement.closest(
      '[data-goods-id], [goods-id], div[role="group"], .goods-item, article'
    );

    if (cardCandidate) {
      let current = cardCandidate;
      while (
        current.parentElement &&
        current.parentElement !== document.body &&
        current.parentElement !== document.documentElement
      ) {
        const parent = current.parentElement;
        const parentDisplay = window.getComputedStyle(parent).display;

        if (parentDisplay === "grid" || (parentDisplay === "flex" && parent.children.length > 2)) {
          return current;
        }

        const classNames = parent.className || "";
        if (typeof classNames === "string" && /grid|list|waterfall|feed|goods_box/i.test(classNames)) {
          return current;
        }

        current = parent;
      }
      return cardCandidate;
    }

    let current = badgeElement.parentElement;
    while (current && current !== document.body && current !== document.documentElement) {
      if (
        current.querySelector &&
        (current.querySelector('a[href*="goods_id"]') ||
          current.querySelector('a[href*="/goods.html"]') ||
          current.querySelector('a[href*="goods-"]'))
      ) {
        const parent = current.parentElement;
        if (parent) {
          const parentDisplay = window.getComputedStyle(parent).display;
          if (parentDisplay === "grid" || (parentDisplay === "flex" && parent.children.length > 2)) {
            return current;
          }
        }
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  // Filtreleme fonksiyonu
  function runFilter() {
    if (!config.enabled) return;

    const potentialBadges = document.querySelectorAll("span, div, em, b, strong");
    const localCards = new Set();

    potentialBadges.forEach((el) => {
      if (el.children.length === 0 && el.textContent) {
        if (isLocalBadgeText(el.textContent)) {
          const card = findProductCard(el);
          if (card) localCards.add(card);
        }
      }
    });

    document.querySelectorAll("[data-temu-filtered]").forEach((card) => {
      if (!localCards.has(card)) clearCardStyle(card);
    });
    localCards.forEach(applyCardStyle);
    updateStats();
  }

  // Karta gizleme veya saydamlaştırma stilini uygula
  function applyCardStyle(card) {
    const shouldDim = config.mode === "dim";
    card.classList.toggle("temu-local-hidden", !shouldDim);
    card.classList.toggle("temu-local-dimmed", shouldDim);
    card.setAttribute("data-temu-filtered", "true");
  }

  function clearCardStyle(card) {
    card.classList.remove("temu-local-hidden", "temu-local-dimmed");
    card.removeAttribute("data-temu-filtered");
  }

  // Sayacı güncelle ve background worker'a ilet
  function updateStats() {
    const totalCurrent = document.querySelectorAll("[data-temu-filtered]").length;
    hiddenCount = totalCurrent;

    try {
      chrome.runtime.sendMessage({
        action: "UPDATE_COUNT",
        count: totalCurrent
      });
    } catch (e) {}
  }

  // Eklenti kapatıldığında veya mod değiştiğinde stilleri temizle
  function clearAllModifications() {
    document.querySelectorAll("[data-temu-filtered]").forEach((card) => {
      clearCardStyle(card);
    });
    hiddenCount = 0;
    try {
      chrome.runtime.sendMessage({ action: "UPDATE_COUNT", count: 0 });
    } catch (e) {}
  }

  // Popup sorguladığında anlık tam sayıyı dön
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_COUNT") {
      const totalCurrent = document.querySelectorAll("[data-temu-filtered]").length;
      sendResponse({ count: totalCurrent });
    }
  });

  // DOM değişikliklerini izle (debounce)
  const observer = new MutationObserver(() => {
    if (!config.enabled) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      window.requestAnimationFrame(runFilter);
    }, 120);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["data-goods-id", "goods-id"]
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runFilter);
  } else {
    runFilter();
  }
})();
