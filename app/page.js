import Link from 'next/link';
import Image from 'next/image';
import { FiClipboard, FiTarget, FiUsers, FiCheckCircle, FiMoon, FiSmartphone, FiZap, FiLock, FiShield, FiArrowRight } from 'react-icons/fi';

// SEO meta verileri
export const metadata = {
  title: 'NoteFav - Notlarınızı, Hedeflerinizi ve Görevlerinizi Yönetin | Not Alma Uygulaması',
  description: 'NoteFav ile notlarınızı organize edin, hedeflerinizi planlayın ve görevlerinizi takip edin. Ücretsiz not alma, görev takibi ve hedef yönetimi uygulaması.',
  keywords: 'not alma, notlar, görev takibi, hedef planlama, notfav, not tutma uygulaması, ücretsiz not uygulaması, online not defteri, üretkenlik, proje yönetimi, yapılacaklar listesi',
  openGraph: {
    title: 'NoteFav - Notlarınızı, Hedeflerinizi ve Görevlerinizi Yönetin',
    description: 'NoteFav ile notlarınızı organize edin, hedeflerinizi planlayın ve görevlerinizi takip edin. Ücretsiz not alma, görev takibi ve hedef yönetimi uygulaması.',
    type: 'website',
    url: 'https://notefav.com',
  }
}

export default function Home() {
  return (
    <div className="py-4">
      {/* Hero Section */}
      <section className="py-12 md:py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm" data-testid="hero-title">
          Fikirlerini Not Al,<br />Hedeflerini Gerçekleştir!
          </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto">
          NoteFav ile düşüncelerinizi düzenleyin, 
          hedeflerinizi planlayın ve projelerinizi takip edin.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/auth/signup"
            className="btn-primary py-3 px-8 text-lg"
            aria-label="Ücretsiz hesap oluşturun"
          >
            Ücretsiz Başla
            </Link>
          
          <Link 
            href="/features"
            className="btn-secondary py-3 px-8 text-lg"
            aria-label="NoteFav'ın tüm özelliklerini görüntüle"
          >
              Özellikler
            </Link>
        </div>
        
        {/* Animasyonlu not öğeleri - Daha temiz ve basit */}
        <div className="relative mt-16 hidden md:block">
          <div className="absolute left-1/4 -translate-x-1/2 top-0 animate-float-mini w-52 h-32 bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 rotate-[-3deg] opacity-90">
            <div className="w-full h-4 bg-orange-200 dark:bg-orange-800 rounded mb-2"></div>
            <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          
          <div className="absolute right-1/4 translate-x-1/2 top-10 animate-float-mini w-52 h-32 bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 rotate-[5deg] opacity-90">
            <div className="w-full h-4 bg-amber-200 dark:bg-amber-800 rounded mb-2"></div>
            <div className="w-2/3 h-3 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </section>
      
      {/* Sayı İstatistikleri */}
      <section className="py-12 my-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard number="10K+" label="Aktif Kullanıcı" />
          <StatCard number="250K+" label="Oluşturulan Not" />
          <StatCard number="50K+" label="Tamamlanan Hedef" />
          <StatCard number="99.9%" label="Erişilebilirlik" />
                </div>
      </section>
      
      {/* Özellikler Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800/20 rounded-lg my-16 shadow-sm" id="features" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
            Neler <span className="text-orange-500">Yapabilirsiniz?</span>
          </h2>
          
          <p className="text-center text-lg text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
            Güçlü özellikler ve kullanımı kolay bir arayüz ile NoteFav, çalışma şeklinizi tamamen değiştirecek.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard 
              icon={<FiClipboard className="h-8 w-8" />}
              title="Notlarınızı Organize Edin"
              description="Tüm fikirlerinizi, düşüncelerinizi ve bilgilerinizi kategorilere ayırarak düzenli bir şekilde saklayın."
              accentColor="orange"
            />
            
            <FeatureCard 
              icon={<FiTarget className="h-8 w-8" />}
              title="Hedeflerinizi Belirleyin"
              description="Kısa ve uzun vadeli hedeflerinizi planlayın, ilerlemenizi takip edin ve başarıya ulaşın."
              accentColor="amber"
            />
            
            <FeatureCard 
              icon={<FiUsers className="h-8 w-8" />}
              title="Gruplarla Çalışın"
              description="Projelerinizi ve notlarınızı arkadaşlarınızla veya ekibinizle paylaşarak birlikte çalışın."
              accentColor="cyan"
            />
            
            <FeatureCard 
              icon={<FiCheckCircle className="h-8 w-8" />}
              title="Görevlerinizi Tamamlayın"
              description="Yapılacaklar listesi oluşturun, görevlerinizi önceliklendirin ve zamanında tamamlayın."
              accentColor="emerald"
            />
            
            <FeatureCard 
              icon={<FiMoon className="h-8 w-8" />}
              title="Karanlık Modu Kullanın"
              description="Gözlerinizi yormadan çalışmak için karanlık modu aktifleştirin, rahatça not alın."
              accentColor="violet"
            />
            
            <FeatureCard 
              icon={<FiSmartphone className="h-8 w-8" />}
              title="Mobil Uyumlu Arayüz"
              description="Tüm cihazlarda sorunsuz çalışan responsive tasarım ile her yerden erişim sağlayın."
              accentColor="fuchsia"
            />
          </div>
        </div>
      </section>
      
      {/* Nasıl Çalışır Bölümü */}
      <section className="py-16 my-16" id="how-it-works" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
          NoteFav <span className="text-orange-500">Nasıl Çalışır?</span>
        </h2>
        
        <p className="text-center text-lg text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
          Sadece üç adımda başlayın ve üretkenliğinizi artırın
        </p>
        
        <div className="relative">
          {/* Bağlantı çizgisi */}
          <div className="absolute top-24 left-1/2 h-[calc(100%-6rem)] w-1 bg-orange-200 dark:bg-orange-900 -translate-x-1/2 hidden md:block"></div>
          
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">
            <StepCard 
              number="1"
              title="Hesap Oluşturun"
              description="Ücretsiz hesabınızı oluşturun ve hemen kullanmaya başlayın."
              imageSrc="/images/step1.png"
              isLeft={true}
            />
            
            <div className="md:h-24"></div>
            
            <div className="md:h-24"></div>
            
            <StepCard 
              number="2"
              title="Notlarınızı Ekleyin"
              description="Fikirlerinizi, görevlerinizi ve hedeflerinizi düzenli bir şekilde kaydedin."
              imageSrc="/images/step2.png"
              isLeft={false}
            />
            
            <StepCard 
              number="3"
              title="Organize Olun"
              description="Kategori ve etiketlerle içeriklerinizi düzenleyin, istediğiniz zaman erişin."
              imageSrc="/images/step3.png"
              isLeft={true}
            />
          </div>
        </div>
      </section>
      
      {/* Neden Biz Bölümü */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800/20 rounded-lg my-16 shadow-sm" id="why-us" aria-labelledby="why-us-heading">
        <div className="container mx-auto px-4">
          <h2 id="why-us-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
            Neden <span className="text-orange-500">NoteFav?</span>
          </h2>
          
          <p className="text-center text-lg text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
            NoteFav'ı diğer not alma uygulamalarından ayıran özellikler
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <WhyUsCard 
              icon={<FiZap className="h-6 w-6" />}
              title="Hızlı ve Güvenilir"
              description="Anında kaydedilen notlar ve %99.9 çalışma süresi garantisi."
            />
            
            <WhyUsCard 
              icon={<FiLock className="h-6 w-6" />}
              title="Güvenli"
              description="Verileriniz uçtan uca şifreleme ile korunur, sadece siz erişebilirsiniz."
            />
            
            <WhyUsCard 
              icon={<FiShield className="h-6 w-6" />}
              title="Ücretsiz"
              description="Temel özellikler tamamen ücretsiz, hiçbir gizli ücret veya sınırlama yok."
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section id="signup" aria-labelledby="signup-heading" className="py-16 my-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 md:p-12 shadow-md">
              <div className="text-center mb-8">
                <h2 id="signup-heading" className="text-3xl md:text-4xl font-bold mb-4 text-orange-500">
                  Daha İyi Organize Olun!
                </h2>
                
                <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                  NoteFav ile düşüncelerinizi, görevlerinizi ve projelerinizi 
                  düzenleyin. Hemen ücretsiz hesabınızı oluşturun.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link 
                  href="/auth/signup"
                  className="w-full sm:w-auto btn-primary py-4 px-8 text-lg"
                  aria-label="Ücretsiz hesap oluşturun"
                >
                  <span>Ücretsiz Hesap Oluştur</span>
                </Link>
                
                <span className="text-slate-500 dark:text-slate-400">veya</span>
                
                <Link 
                  href="/auth/login"
                  className="w-full sm:w-auto btn-secondary py-4 px-8 text-lg"
                  aria-label="Hesabınıza giriş yapın"
                >
                  Giriş Yap
                </Link>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Hesap oluşturarak <Link href="/terms" className="text-orange-500 hover:underline">Kullanım Şartları</Link> ve 
                  <Link href="/privacy" className="text-orange-500 hover:underline"> Gizlilik Politikası</Link>'nı kabul etmiş olursunuz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* SEO için zengin içerik */}
      <div className="sr-only" aria-hidden="true">
        <h2>NoteFav - En İyi Not Alma Uygulaması</h2>
        <h3>Ücretsiz Not Defteri ve Görev Takip Uygulaması</h3>
        <h3>Online Not Alma ve Hatırlatıcı Programı</h3>
        <h3>Kişisel Notlar, Hedefler ve Yapılacaklar Listesi</h3>
        <p>
          NoteFav, notlarınızı düzenlemek, hedeflerinizi planlamak ve görevlerinizi takip etmek için 
          geliştirilmiş kullanıcı dostu bir web uygulamasıdır. 
          Tamamen ücretsiz olan NoteFav, kişisel ve profesyonel yaşamınızda daha düzenli ve üretken olmanızı sağlar.
        </p>
        <p>
          NoteFav'ın özellikleri arasında zengin metin düzenleyici, hedef planlama araçları, yapılacaklar listesi, etiketlerle düzenleme ve grup paylaşımı yer alır.
        </p>
        <p>
          Kullanıcılar, fikirleri hızla not almak, önemli görevleri takip etmek, projelerini planlamak ve başkalarıyla işbirliği yapmak için NoteFav'ı tercih etmektedir.
        </p>
        <p>
          Verileriniz NoteFav'da güvendedir. Tüm notlarınız şifrelenir ve sadece sizin izin verdiğiniz kişiler tarafından görüntülenebilir.
        </p>
        <dl>
          <dt>NoteFav Nedir?</dt>
          <dd>NoteFav, fikirleri organize etmek, görevleri takip etmek ve hedefleri planlamak için geliştirilmiş çevrimiçi bir not alma uygulamasıdır.</dd>
          
          <dt>NoteFav Nasıl Kullanılır?</dt>
          <dd>Ücretsiz hesap oluşturun, notlar ekleyin, görevler oluşturun, hedefler belirleyin ve gerekirse bunları başkalarıyla paylaşın.</dd>
          
          <dt>NoteFav Ücretli mi?</dt>
          <dd>NoteFav'ın temel özellikleri tamamen ücretsizdir. İleri seviye özellikler için premium planlar gelecekte sunulabilir.</dd>
        </dl>
      </div>
      
      {/* Yapısal veri işaretlemesi */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "NoteFav",
          "applicationCategory": "ProductivityApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250"
          },
          "description": "NoteFav ile notlarınızı organize edin, hedeflerinizi planlayın ve görevlerinizi takip edin."
        }
      `}} />
    </div>
  );
}

// Özellik Kartı Bileşeni
function FeatureCard({ icon, title, description, accentColor = "orange" }) {
  const colorClasses = {
    orange: "border-orange-200 dark:border-orange-800/30 hover:border-orange-300 dark:hover:border-orange-700",
    amber: "border-amber-200 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-700",
    cyan: "border-cyan-200 dark:border-cyan-800/30 hover:border-cyan-300 dark:hover:border-cyan-700",
    emerald: "border-emerald-200 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700",
    violet: "border-violet-200 dark:border-violet-800/30 hover:border-violet-300 dark:hover:border-violet-700",
    fuchsia: "border-fuchsia-200 dark:border-fuchsia-800/30 hover:border-fuchsia-300 dark:hover:border-fuchsia-700"
  };
  
  const iconColorClasses = {
    orange: "text-orange-500",
    amber: "text-amber-500",
    cyan: "text-cyan-600",
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    fuchsia: "text-fuchsia-600"
  };

  return (
    <div className={`p-6 rounded-lg border bg-white dark:bg-slate-800 shadow-sm ${colorClasses[accentColor]}`}>
      <div className={`${iconColorClasses[accentColor]} mb-4 p-3 bg-white dark:bg-slate-700 rounded-lg inline-block`}>
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold mb-3">
        {title}
      </h3>
      
      <p className="text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </div>
  );
}

// İstatistik Kartı Bileşeni
function StatCard({ number, label }) {
  return (
    <div className="text-center p-4">
      <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">{number}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

// Adım Kartı Bileşeni
function StepCard({ number, title, description, imageSrc, isLeft }) {
  return (
    <div className={`relative ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm relative z-10">
        <div className={`absolute z-20 top-0 ${isLeft ? 'md:-right-6' : 'md:-left-6'} -translate-y-1/2 w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-bold`}>
          {number}
        </div>
        
        <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden">
          <Image 
            src={imageSrc || "/images/placeholder.png"} 
            alt={title} 
            fill 
            className="object-cover"
          />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}

// Neden Biz Kartı Bileşeni
function WhyUsCard({ icon, title, description }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-4">
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
