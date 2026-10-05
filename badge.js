// Temu Yerel Ürün Filtresi - Etiket Eşleştirme (content script ve testler paylaşır)

// Sabit yerel ürün belirteçleri
const LOCAL_KEYWORDS = [
  "yerel",
  "local",
  "yerel depo",
  "yerel satıcı",
  "local warehouse",
  "tr depo"
];

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

if (typeof module !== "undefined") module.exports = { isLocalBadgeText };
