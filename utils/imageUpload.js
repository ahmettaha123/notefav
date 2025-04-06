import supabase from '../lib/supabase';

/**
 * Resim dosyasını Supabase'e yükler
 * @param {File} file - Yüklenecek dosya
 * @param {string} userId - Kullanıcı kimliği
 * @returns {Promise<{path: string, error: any}>} - Yüklenen dosyanın yolu veya hata
 */
export async function uploadImage(file, userId) {
  try {
    if (!file) {
      throw new Error('Dosya seçilmedi');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // Dosyayı Supabase Storage'a yükle
    const { data, error } = await supabase.storage
      .from('note-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      
    if (error) throw error;
    
    // Dosya URL'ini al
    const { data: publicUrlData } = supabase.storage
      .from('note-images')
      .getPublicUrl(data.path);
    
    return { path: publicUrlData.publicUrl, error: null };
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    return { path: null, error };
  }
}

/**
 * Resmi Markdown formatında metne ekler
 * @param {string} text - Mevcut metin
 * @param {string} imagePath - Resim yolu
 * @param {number} cursorPosition - İmleç konumu
 * @returns {string} - Güncellenmiş metin
 */
export function insertImageToText(text, imagePath, cursorPosition) {
  const imageMarkdown = `![Resim](${imagePath})`;
  
  return text.substring(0, cursorPosition) + imageMarkdown + text.substring(cursorPosition);
}
