// Temu Yerel Ürün Gizleyici - Service Worker (Background Script)

const tabCounts = {};

// Rozet metin formatı (4 haneye kadar tam sayı)
function formatBadgeText(count) {
  if (count <= 0) return "";
  // 1'den 9999'a kadar (örn: 2337) hiçbir kesinti olmadan tam sayıyı göster
  if (count < 10000) return count.toString();
  // 10.000 üstü için 12k formatı
  return Math.floor(count / 1000) + "k";
}

// Sekmeler arası sayaç ve rozet (badge) yönetimi
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "UPDATE_COUNT" && sender.tab?.id) {
    const count = message.count || 0;
    const tabId = sender.tab.id;
    tabCounts[tabId] = count;

    chrome.action.setBadgeText({
      text: formatBadgeText(count),
      tabId: tabId
    });
  } else if (message.action === "GET_TAB_COUNT" && message.tabId) {
    sendResponse({ count: tabCounts[message.tabId] || 0 });
  }
});

// Sekme kapandığında hafızayı temizle
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabCounts[tabId];
});
