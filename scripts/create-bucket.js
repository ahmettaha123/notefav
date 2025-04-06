// Bu dosyayı bir kez çalıştırarak Supabase storage bucket'ınızı oluşturabilirsiniz
// Komut: node scripts/create-bucket.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES modules için __dirname oluştur
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local dosyasını yükle
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase bilgileri eksik. .env.local dosyasını kontrol edin.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  try {
    // Mevcut buckets'ları kontrol et
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    console.log('Mevcut buckets:', buckets.map(b => b.name));
    
    // 'avatars' bucket'ı var mı kontrol et
    if (buckets.find(b => b.name === 'avatars')) {
      console.log("'avatars' bucket'ı zaten var!");
      
      // Bucket izinlerini güncelle
      console.log("Bucket RLS (Row Level Security) politikalarını güncellemeniz gerekebilir");
      console.log("Supabase Dashboard > Storage > Buckets > avatars > Policies");
      console.log("yolunu izleyerek aşağıdaki politikaları ekleyin:");
      console.log(" - Herkes için görüntüleme: SELECT için policy definition: true");
      console.log(" - Kayıtlı kullanıcılar için dosya yükleme: INSERT için policy definition: auth.role() = 'authenticated'");
      return;
    }
    
    // Bucket oluştur
    const { data, error } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
    });
    
    if (error) throw error;
    
    console.log("'avatars' bucket'ı başarıyla oluşturuldu!");
    console.log("Şimdi Supabase Dashboard > Storage > Buckets > avatars > Policies");
    console.log("yolunu izleyerek şu politikaları ekleyin:");
    console.log(" - Herkes için görüntüleme: SELECT için policy definition: true");
    console.log(" - Kayıtlı kullanıcılar için dosya yükleme: INSERT için policy definition: auth.role() = 'authenticated'");
    
  } catch (error) {
    console.error('Hata:', error);
  }
}

createBucket();
