import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function improveText(text) {
  try {
    // Birkaç farklı model deneyelim
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    } catch (modelError) {
      console.log('gemini-1.5-pro modeli bulunamadı, gemini-1.0-pro deneniyor');
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
      } catch (fallbackError) {
        console.log('gemini-1.0-pro modeli bulunamadı, gemini-pro deneniyor');
        model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      }
    }
    
    const prompt = `Lütfen aşağıdaki metni düzenle ve geliştir. Metnin anlamını değiştirmeden, daha düzenli ve profesyonel bir hale getir. Noktalama işaretlerini düzelt, maddeleme yap ve büyük/küçük harfleri düzenle:

${text}`;

    // API isteğini try-catch ile koruyalım
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (apiError) {
      console.error('API isteği sırasında hata:', apiError);
      // Basit metin iyileştirme fonksiyonu ekleyelim (API çalışmazsa)
      return fallbackImproveText(text);
    }
  } catch (error) {
    console.error('Gemini API hatası:', error);
    return fallbackImproveText(text);
  }
}

// API çalışmadığında kullanılacak basit fonksiyon
function fallbackImproveText(text) {
  // Basit metin düzeltmeleri
  let improved = text;
  
  // Cümle başlarını büyük harf yap
  improved = improved.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  
  // Noktalama işaretlerinden sonra boşluk ekle
  improved = improved.replace(/([.!?,;:])([^\s])/g, '$1 $2');
  
  // Çift boşlukları tek boşluğa çevir
  improved = improved.replace(/\s+/g, ' ');
  
  return improved;
} 