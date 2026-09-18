<p align="center">
  <img src="assets/logo.svg" alt="Temu Local Filter" width="100" height="100">
</p>

<h1 align="center">Temu Local Filter</h1>

<p align="center">
  Temu üzerindeki yerel depo ve satıcı ürünlerini otomatik olarak filtreleyen Manifest V3 tarayıcı eklentisi.
</p>

## Özellikler

- **Dinamik DOM Filtreleme:** Sayfa kaydırıldıkça yüklenen ürün kartlarını `MutationObserver` ve `WeakSet` önbelleği ile gecikmesiz filtreler.
- **Yerel Etiket Algılama:** `[Yerel]`, `Local`, `TR Depo` ve benzeri yerel depo etiketlerini tespit eder.
- **İki Farklı Çalışma Modu:**
  - *Tamamen Gizle:* Yerel ürün kartını DOM üzerinde gizleyerek ızgara (grid) düzenini korur.
  - *Soluklaştır:* Ürünü yarı saydam ve gri yapar, üzerine gelindiğinde ürün incelenebilir.
- **Sayaç Rozeti:** Sayfada filtrelenen yerel ürün adedini uzantı simgesi ve açılır menüde gösterir.
- **Gizlilik:** Dış ağ istekleri, yönlendirme (affiliate) kodları veya analitik içermez; tamamen istemci tarafında çalışır.

## Kurulum

### Chrome / Edge / Brave

1. Depoyu klonlayın veya zip olarak indirin:
   ```bash
   git clone https://github.com/ozkancirak/temu-local-filter.git
   ```
2. Tarayıcınızda uzantılar sayfasını açın:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Sağ üstteki **Geliştirici modu** anahtarını etkinleştirin.
4. **Paketlenmemiş öğe yükle** butonuna tıklayarak proje klasörünü seçin.

## Teşekkür

Bu proje, temel fikir olarak [@iltekin](https://github.com/iltekin)'in `remove-local-temu` eklentisinden esinlenerek Manifest V3 uyumluluğu ve temiz bir mimariyle sıfırdan yazılmıştır.

## Lisans

[MIT](LICENSE)
