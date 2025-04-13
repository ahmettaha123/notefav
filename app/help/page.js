'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { FaCircleQuestion, FaBookOpen, FaVideo, FaPeopleGroup, FaHeadset } from 'react-icons/fa6';

function HelpContent() {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  
  // Yardım kategorileri
  const categories = [
    { id: 'getting-started', name: 'Başlangıç', icon: <FaCircleQuestion /> },
    { id: 'notes', name: 'Notlar', icon: <FaBookOpen /> },
    { id: 'groups', name: 'Gruplar', icon: <FaPeopleGroup /> },
    { id: 'goals', name: 'Hedefler', icon: <FaVideo /> },
    { id: 'contact', name: 'İletişim', icon: <FaHeadset /> }
  ];
  
  // Kategoriler için içerikler
  const helpContent = {
    'getting-started': {
      title: 'Başlangıç Rehberi',
      description: 'NoteFav uygulamasına hoş geldiniz! Aşağıdaki adımları izleyerek hızlıca başlayın.',
      items: [
        {
          title: 'Hesap Oluşturma',
          content: 'NoteFav uygulamasını kullanmaya başlamak için öncelikle bir hesap oluşturmalısınız. Kayıt ol sayfasından e-posta adresiniz ve şifrenizle hızlıca kayıt olabilirsiniz.'
        },
        {
          title: 'Profilinizi Düzenleme',
          content: 'Hesabınızı oluşturduktan sonra, profil sayfanızdan kişisel bilgilerinizi düzenleyebilir ve profil resminizi ekleyebilirsiniz.'
        },
        {
          title: 'İlk Notunuzu Oluşturma',
          content: 'Notlar sayfasından "Yeni Not" düğmesine tıklayarak ilk notunuzu oluşturabilirsiniz. Notlarınızı düzenlemek için zengin metin editörünü kullanabilirsiniz.'
        },
        {
          title: 'Grup Oluşturma',
          content: 'Başkalarıyla işbirliği yapmak için Gruplar sayfasından yeni bir grup oluşturabilir ve arkadaşlarınızı davet edebilirsiniz.'
        },
        {
          title: 'Hedef Belirleme',
          content: 'Hedefler sayfasından yeni hedefler belirleyebilir ve ilerlemenizi takip edebilirsiniz.'
        }
      ]
    },
    'notes': {
      title: 'Notlar Hakkında',
      description: 'Notlar, fikirlerinizi ve bilgilerinizi kaydetmek için kullanabileceğiniz temel özelliktir.',
      items: [
        {
          title: 'Not Oluşturma',
          content: 'Notlar sayfasından "Yeni Not" düğmesine tıklayarak yeni bir not oluşturabilirsiniz. Notunuza bir başlık ve içerik ekleyin, ardından kaydedin.'
        },
        {
          title: 'Notları Düzenleme',
          content: 'Mevcut bir notu düzenlemek için notun sayfasındaki "Düzenle" düğmesine tıklayın. İçeriği değiştirdikten sonra "Kaydet" düğmesine tıklayarak değişikliklerinizi kaydedebilirsiniz.'
        },
        {
          title: 'Notları Silme',
          content: 'Bir notu silmek için notun sayfasındaki "Sil" düğmesine tıklayın. Silme işlemi geri alınamaz, bu yüzden dikkatli olun.'
        },
        {
          title: 'Not Formatları',
          content: 'NoteFav, notlarınızı zenginleştirmek için Markdown formatını destekler. Başlıklar için #, kalın metin için ** ve italik metin için * kullanabilirsiniz.'
        },
        {
          title: 'Notları Gruplarla Paylaşma',
          content: 'Bir notu bir grupla paylaşmak için, notun detay sayfasında "Grupla Paylaş" düğmesine tıklayın ve paylaşmak istediğiniz grubu seçin.'
        }
      ]
    },
    'groups': {
      title: 'Gruplar Hakkında',
      description: 'Gruplar, başkalarıyla işbirliği yapmanızı ve içerik paylaşmanızı sağlar.',
      items: [
        {
          title: 'Grup Oluşturma',
          content: 'Gruplar sayfasından "Yeni Grup" düğmesine tıklayarak yeni bir grup oluşturabilirsiniz. Gruba bir isim, açıklama ve renk seçin.'
        },
        {
          title: 'Üye Ekleme',
          content: 'Grubunuza üye eklemek için, grup detay sayfasındaki "Üyeler" sekmesine gidin ve "Üye Ekle" düğmesine tıklayın. Eklemek istediğiniz üyenin e-posta adresini girin.'
        },
        {
          title: 'Grup Notları',
          content: 'Grup içinde not paylaşmak için, grup detay sayfasındaki "Notlar" sekmesine gidin ve "Not Ekle" düğmesine tıklayın. Kişisel notlarınızdan birini seçebilir veya yeni bir not oluşturabilirsiniz.'
        },
        {
          title: 'Grup Hedefleri',
          content: 'Grup için hedefler belirlemek için, grup detay sayfasındaki "Hedefler" sekmesine gidin ve "Hedef Ekle" düğmesine tıklayın. Grubun tüm üyeleri hedeflere katkıda bulunabilir.'
        },
        {
          title: 'Grup Ayarları',
          content: 'Grup ayarlarını değiştirmek için, grup detay sayfasındaki "Düzenle" düğmesine tıklayın. Grup adını, açıklamasını ve rengini değiştirebilirsiniz.'
        }
      ]
    },
    'goals': {
      title: 'Hedefler Hakkında',
      description: 'Hedefler, kişisel veya grup başarılarınızı takip etmenize ve ilerlemenizi görmenize yardımcı olur.',
      items: [
        {
          title: 'Hedef Oluşturma',
          content: 'Hedefler sayfasından "Yeni Hedef" düğmesine tıklayarak yeni bir hedef oluşturabilirsiniz. Hedefinize bir başlık, açıklama ve hedef tarihi ekleyin.'
        },
        {
          title: 'Alt Görevler Ekleme',
          content: 'Hedefiniz için alt görevler ekleyebilirsiniz. Bu, büyük hedefleri daha küçük ve yönetilebilir parçalara bölmenize yardımcı olur.'
        },
        {
          title: 'İlerlemeyi Güncelleme',
          content: 'Hedef detay sayfasından ilerleme durumunuzu güncelleyebilirsiniz. Alt görevleri tamamladıkça, genel ilerleme otomatik olarak güncellenir.'
        },
        {
          title: 'Hedefi Tamamlama',
          content: 'Tüm alt görevleri tamamladığınızda veya hedefinize ulaştığınızda, hedefi tamamlandı olarak işaretleyebilirsiniz.'
        },
        {
          title: 'Hedefleri Gruplarla Paylaşma',
          content: 'Kişisel hedeflerinizi bir grupla paylaşabilir veya doğrudan grup için hedefler oluşturabilirsiniz. Grup hedefleri, tüm grup üyeleri tarafından görülebilir ve güncellenebilir.'
        }
      ]
    },
    'contact': {
      title: 'Yardım ve İletişim',
      description: 'Sorularınız mı var? Bizimle iletişime geçin, size yardımcı olmaktan memnuniyet duyarız.',
      items: [
        {
          title: 'Destek Talebi Oluşturma',
          content: 'Teknik bir sorunla karşılaştıysanız veya yardıma ihtiyacınız varsa, destek@notefav.com adresine e-posta göndererek bir destek talebi oluşturabilirsiniz.'
        },
        {
          title: 'Geri Bildirim Gönderme',
          content: 'Uygulama hakkında görüşlerinizi ve önerilerinizi bildirim@notefav.com adresine gönderebilirsiniz. Geri bildirimleriniz, uygulamayı geliştirmemize yardımcı olur.'
        },
        {
          title: 'Sosyal Medya',
          content: 'Bizi sosyal medyada takip edebilirsiniz: Twitter: @notefav, Instagram: @notefav, Facebook: /notefav'
        },
        {
          title: 'İş Birliği',
          content: 'İş birliği teklifleri için info@notefav.com adresine e-posta gönderebilirsiniz.'
        },
        {
          title: 'SSS',
          content: 'Sıkça sorulan sorular için Özellikler sayfamızdaki SSS bölümünü ziyaret edebilirsiniz.'
        }
      ]
    }
  };
  
  const currentContent = helpContent[activeCategory];

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Yardım ve Destek</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          NoteFav uygulamasını kullanırken ihtiyacınız olan tüm bilgiler ve rehberler burada.
        </p>
      </div>
      
      {/* Kategori Sekmeleri */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              activeCategory === category.id
                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {category.icon}
            {category.name}
          </button>
        ))}
      </div>
      
      {/* İçerik */}
      <div className="card mb-12">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">{currentContent.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{currentContent.description}</p>
        </div>
        
        <div className="space-y-6">
          {currentContent.items.map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Hızlı Bağlantılar */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Hızlı Bağlantılar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/features" className="btn-secondary block text-center">
            Özellikler
          </Link>
          <Link href="/notes" className="btn-secondary block text-center">
            Notlarım
          </Link>
          <Link href="/groups" className="btn-secondary block text-center">
            Gruplarım
          </Link>
          <Link href="/settings" className="btn-secondary block text-center">
            Ayarlar
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Başka sorunuz mu var?</p>
          <a 
            href="mailto:destek@notefav.com" 
            className="inline-block mt-2 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium"
          >
            Bizimle İletişime Geçin
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Help() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><p>Yükleniyor...</p></div>}>
      <HelpContent />
    </Suspense>
  );
} 