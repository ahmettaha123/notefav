# Grup Sistemi Rehberi

## Yapılan Düzeltmeler

Grup sisteminde karşılaşılan sorunlar için aşağıdaki düzeltmeler yapılmıştır:

### 1. Veritabanı Politikaları (RLS)

- **Sonsuz Tekrar Hatası (Infinite Recursion)**: RLS politikalarındaki döngüsel referanslar düzeltildi.
- **Rol Kısıtlaması**: Group_members tablosundaki rol değeri 'leader', 'admin' veya 'member' olarak sınırlandırıldı.
- **Varsayılan Değer**: Rol için varsayılan değer 'viewer' yerine 'member' olarak değiştirildi.
- **Politika Ayrımı**: Grup lideri eklemek için ayrı, diğer üyeleri eklemek için ayrı politikalar oluşturuldu.

### 2. Arayüz İyileştirmeleri

- **Üyeleri Atlama Seçeneği**: Grup oluşturma sırasında "Şimdilik üye eklemeyi atla" seçeneği eklendi.
- **Hata Yönetimi**: Kullanıcı bulunamadığında veya eklenemediğinde daha açıklayıcı hatalar gösteriliyor.
- **E-posta Doğrulama**: E-posta formatı doğrulaması eklendi.
- **Oturum Kontrolü**: Grup oluşturma sayfasına erişim için giriş yapma kontrolü eklendi.

### 3. Kod İyileştirmeleri

- **Column Hataları**: `profiles` tablosunda `email` kolonu bulunmadığı için kullanıcı aramaları username üzerinden yapılıyor.
- **creator_id**: `created_by` yerine `creator_id` kullanımı ile veritabanı uyumluluğu sağlandı.
- **Hata İşleme**: Üye eklenemese bile grup oluşturmanın tamamlanması sağlandı.
- **Kullanıcı Deneyimi**: Grubun önce üyesiz oluşturulup daha sonra üye eklenebilmesi sağlandı.

### 4. Rol Sistemi Güncellemesi

- **Yeni Admin Rolü**: Grup üyeleri arasında 'leader', 'admin' ve 'member' olarak üç farklı rol tanımlandı.
- **Rol Yetkileri**:
  - **Lider**: Tüm grup işlemlerini yapabilir (not/hedef ekleme, silme, üye davet etme, düzenleme).
  - **Admin**: Not ve hedef ekleyebilir, düzenleyebilir ve silebilir, ancak grup ayarlarını değiştiremez veya üye davet edemez.
  - **Üye**: Sadece grup içeriğini görüntüleyebilir, not veya hedef ekleyemez.

## Nasıl Kullanılır?

### Yeni Grup Oluşturma

1. Gruplar sayfasına gidin ve "Yeni Grup Oluştur" düğmesine tıklayın.
2. Grup adı, açıklama ve renk seçin.
3. Hemen üye eklemek istemiyorsanız "Şimdilik üye eklemeyi atla" seçeneğini işaretleyin.
4. "Grup Oluştur" düğmesine tıklayın.

### Üye Ekleme ve Rol Atama

1. Grup detay sayfasında "Üyeler" sekmesine gidin.
2. "Üye Ekle" düğmesine tıklayın.
3. Kullanıcı adını girin ve "Ekle" düğmesine tıklayın.
4. Üye eklendikten sonra, üyenin yanındaki rol düğmesine tıklayarak rolünü değiştirebilirsiniz (Lider olarak).
5. Admin rolü için, üyeyi önce eklemeniz ve ardından rolünü "admin" olarak güncellemeniz gerekir.

### Veritabanı Düzeltmeleri

`fix_group_members.sql` dosyasındaki komutları Supabase SQL editörüne yapıştırıp çalıştırın. Bu, gerekli tüm RLS politikalarını ve veritabanı değişikliklerini uygulayacaktır.

## Sorun Giderme

- **"column profiles.email does not exist" hatası**: Bu hata, e-posta ile kullanıcı araması yapıldığında oluşur. Kullanıcı adı ile arama yapın veya üye eklemeden grubu oluşturun.
- **"infinite recursion detected in policy for relation group_members"**: Bu hata, RLS politikalarında bir döngü olduğunda oluşur. SQL düzeltme dosyasını çalıştırın.
- **Grup oluşturuldu ama üyeler eklenemedi**: Grup oluşturduktan sonra detay sayfasına giderek üye ekleyebilirsiniz.

## İletişim

Herhangi bir sorun veya öneri için lütfen iletişime geçin. 