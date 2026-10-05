// Temu Yerel Ürün Filtresi - Content Script


(() => {
  let config = {
    enabled: true,
    mode: "hide" // 'hide' (tamamen gizle) veya 'dim' (yarı saydam yap)
  };

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

  const BADGE_SELECTOR = "span, div, em, b, strong";

  // Kök ve altındaki yerel etiket elemanlarını döndür
  function findLocalBadges(root) {
    const els = Array.from(root.querySelectorAll(BADGE_SELECTOR));
    if (root.matches(BADGE_SELECTOR)) els.push(root);
    return els.filter((el) => el.children.length === 0 && isLocalBadgeText(el.textContent));
  }

  // Filtreleme fonksiyonu: yalnızca verilen köklerin altını tarar
  function runFilter(roots = [document.body]) {
    if (!config.enabled) return;

    roots.forEach((root) => {
      findLocalBadges(root).forEach((el) => {
        const card = findProductCard(el);
        if (card) applyCardStyle(card);
      });
    });

    // Yeniden kullanılan kartlar artık yerel değilse temizle
    document.querySelectorAll("[data-temu-filtered]").forEach((card) => {
      if (findLocalBadges(card).length === 0) clearCardStyle(card);
    });
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
  const pending = new Set();

  function queueNode(node) {
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (el) pending.add(el);
  }

  const observer = new MutationObserver((records) => {
    if (!config.enabled) return;

    records.forEach((r) => {
      if (r.type === "childList") r.addedNodes.forEach(queueNode);
      else queueNode(r.target);
    });

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      window.requestAnimationFrame(() => {
        const roots = [...pending].filter((el) => el.isConnected);
        pending.clear();
        runFilter(roots);
      });
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
    document.addEventListener("DOMContentLoaded", () => runFilter());
  } else {
    runFilter();
  }
})();
