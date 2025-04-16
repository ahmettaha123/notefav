import { GoogleGenerativeAI } from '@google/generative-ai';

// API anahtarı yoksa boş bir API anahtarı kullanıyoruz
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;

try {
  // Sadece API anahtarı varsa başlatıyoruz
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
} catch (error) {
  console.error('Gemini API başlatma hatası:', error);
}

export async function improveText(text) {
  try {
    // API anahtarı veya genAI yoksa yerel düzeltme kullanıyoruz
    if (!genAI || !apiKey) {
      return improveTextLocally(text);
    }
    
    // Gemini API çağrısı
    try {
      let model;
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      } catch (modelError) {
        try {
          model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
        } catch (fallbackError) {
          model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        }
      }
      
      const prompt = `Lütfen aşağıdaki metni düzenle ve geliştir. Metnin anlamını değiştirmeden, daha düzenli ve profesyonel bir hale getir. Noktalama işaretlerini düzelt, maddeleme yap ve büyük/küçük harfleri düzenle:

${text}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (apiError) {
      console.error('API isteği sırasında hata:', apiError);
      return improveTextLocally(text);
    }
  } catch (error) {
    console.error('Gemini API hatası:', error);
    return improveTextLocally(text);
  }
}

// Yerel metin düzeltme fonksiyonu
function improveTextLocally(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Satır satır işleme
  const lines = text.split('\n');
  const improvedLines = lines.map(line => {
    // Boş satırları koru
    if (line.trim() === '') return line;
    
    // Markdown başlıklarını koru ve düzelt
    if (line.trim().startsWith('#')) {
      // Başlıklarda # işaretinden sonra boşluk ekle
      return line.replace(/^(#+)([^\s])/g, '$1 $2');
    }
    
    // Madde işaretlerini koru
    if (line.trim().match(/^[\*\-\+]/) || line.trim().match(/^\d+\./)) {
      // Madde işaretinden sonra boşluk ekle
      const processed = line.replace(/^([\*\-\+]|\d+\.)([^\s])/g, '$1 $2');
      
      // Madde içindeki metni geliştir
      return processTextLine(processed);
    }
    
    // Normal metin satırı
    return processTextLine(line);
  });
  
  // Satırları birleştir
  return improvedLines.join('\n');
}

// Tek bir metin satırını işle (paragraf veya madde)
function processTextLine(line) {
  // Cümle başındaki ilk harfi büyüt
  let processed = line.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  
  // Noktalama işaretlerinden sonra boşluk ekle
  processed = processed.replace(/([.!?,;:])([^\s\d])/g, '$1 $2');
  
  // Noktalama işaretlerinden önceki boşlukları kaldır
  processed = processed.replace(/\s+([.,;:!?])/g, '$1');
  
  // Çift boşlukları tek boşluğa çevir
  processed = processed.replace(/\s{2,}/g, ' ');
  
  // Türkçe karakterlerle ilgili düzeltmeler
  const turkishReplacements = {
    'i̇': 'i', // Noktalı i sorunu
    'İ': 'İ',
    'ı': 'ı',
    'ş': 'ş',
    'ğ': 'ğ',
    'ç': 'ç',
    'ö': 'ö',
    'ü': 'ü'
  };
  
  Object.entries(turkishReplacements).forEach(([search, replace]) => {
    processed = processed.replace(new RegExp(search, 'g'), replace);
  });
  
  return processed;
} 