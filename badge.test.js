// Çalıştır: node badge.test.js
const assert = require("node:assert");
const { isLocalBadgeText } = require("./badge.js");

for (const t of ["Yerel", "local", "[Yerel]", "Yerel depo", "Local Warehouse", "TR Depo", "tr depo hızlı"]) {
  assert.ok(isLocalBadgeText(t), `eşleşmeli: ${t}`);
}

for (const t of ["", "Local favorites", "en yerel", "Yerelleştirme", "x".repeat(26)]) {
  assert.ok(!isLocalBadgeText(t), `eşleşmemeli: ${t}`);
}

console.log("badge tests passed");
