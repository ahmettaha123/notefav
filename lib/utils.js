/**
 * Tarih formatlamak için yardımcı fonksiyon
 * @param {string|Date} date - Formatlanacak tarih
 * @returns {string} Formatlanmış tarih
 */
export function formatDate(date) {
  if (!date) return '';
  
  // Tarih string ise Date nesnesine çevir
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Geçerli bir tarih değilse boş string döndür
  if (isNaN(dateObj.getTime())) return '';
  
  // Türkçe tarih formatı
  return dateObj.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Metni kısaltmak için yardımcı fonksiyon
 * @param {string} text - Kısaltılacak metin
 * @param {number} maxLength - Maksimum uzunluk
 * @returns {string} Kısaltılmış metin
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Durum renklerini ve ikonlarını belirlemek için yardımcı nesne
 */
export const statusConfig = {
  not_started: {
    icon: null, // React component olarak kullanılacağı için null
    color: 'gray',
    text: 'Başlanmadı'
  },
  in_progress: {
    icon: null,
    color: 'blue',
    text: 'Devam Ediyor'
  },
  completed: {
    icon: null,
    color: 'green',
    text: 'Tamamlandı'
  }
};

/**
 * Kelimeyi büyük harfle başlatır
 * @param {string} str - Büyük harfle başlatılacak kelime
 * @returns {string} Büyük harfle başlatılmış kelime
 */
export function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * URL parametrelerini almak için yardımcı fonksiyon
 * @param {string} paramName - Parametre adı
 * @returns {string|null} Parametre değeri
 */
export function getUrlParam(paramName) {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(paramName);
} 