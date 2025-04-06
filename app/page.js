import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              NoteFav
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-slate-800 dark:text-slate-200">
            Fikirlerini Not Al, Hedeflerini Gerçekleştir!
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Klasik not alma uygulamalarından farklı olarak SMART hedef şablonları ve 
            sosyal motivasyon özellikleriyle hedeflerine ulaş.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/auth/signup" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 px-6 rounded-md shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              Hemen Başla
            </Link>
            <Link href="/features" className="border border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 text-slate-800 dark:text-slate-200 py-3 px-6 rounded-md transition-all transform hover:-translate-y-1">
              Özellikler
            </Link>
          </div>
        </div>
        <div className="md:w-1/2">
          <div className="relative h-[300px] md:h-[400px] w-full rounded-lg overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-amber-500 opacity-80 z-0"></div>
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg w-3/4 h-3/4 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-orange-500 h-3 w-3 rounded-full"></div>
                  <div className="bg-amber-500 h-3 w-3 rounded-full"></div>
                  <div className="bg-slate-300 dark:bg-slate-600 h-3 w-3 rounded-full"></div>
                  <div className="flex-grow bg-slate-200 dark:bg-slate-700 h-6 rounded ml-2"></div>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="bg-slate-200 dark:bg-slate-700 h-5 w-full rounded"></div>
                  <div className="bg-slate-200 dark:bg-slate-700 h-5 w-5/6 rounded"></div>
                  <div className="bg-slate-200 dark:bg-slate-700 h-5 w-4/6 rounded"></div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="bg-orange-200 dark:bg-orange-900/30 h-6 w-20 rounded"></div>
                    <div className="bg-amber-200 dark:bg-amber-900/30 h-6 w-16 rounded"></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-8 w-24 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl px-6">
        <h2 className="text-3xl font-bold text-center mb-4 text-slate-800 dark:text-slate-200">Özellikler</h2>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
          NoteFav, modern not alma ve hedef yönetimi için tasarlandı. İşte sizi bekleyen özellikler:
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="h-14 w-14 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">Zengin Metin Editörü</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Başlıklar, listeler, renkli vurgular ve dosya ekleme özellikleriyle fikirlerinizi özgürce ifade edin.
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="h-14 w-14 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">SMART Hedef Şablonları</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Hedeflerinizi Specific, Measurable, Achievable, Relevant ve Time-bound kriterleriyle oluşturun.
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="h-14 w-14 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">Sosyal Özellikler</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Başkalarıyla işbirliği yapın, ilham alın ve motivasyonunuzu artırmak için topluluk desteği alın.
            </p>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-4 text-slate-800 dark:text-slate-200">Kullanıcılarımız Ne Diyor?</h2>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
          NoteFav kullanıcılarımızın deneyimleri:
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mr-4">
                <span className="text-orange-600 font-semibold">AY</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Ayşe Yılmaz</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tıp Öğrencisi</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              "SMART hedef şablonları sayesinde ders çalışma planımı daha verimli hale getirdim. Artık sadece not almıyor, hedeflerime ulaşıyorum."
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mr-4">
                <span className="text-amber-600 font-semibold">MK</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Mehmet Kaya</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Yazılım Geliştirici</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              "Projelerimi NoteFav ile yönetmeye başladıktan sonra verimliliğim arttı. Grup çalışması özellikleri ekip arkadaşlarımla iletişimi kolaylaştırdı."
            </p>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-10 text-white text-center shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Hemen Ücretsiz Hesap Oluşturun</h2>
        <p className="mb-8 max-w-2xl mx-auto text-lg">
          Hedeflerinize giden yolda ilk adımı atın. NoteFav ile fikirlerinizi düzenleyin ve 
          hedeflerinize adım adım ilerleyin.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/auth/signup" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold py-3 px-8 rounded-md transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1">
            Ücretsiz Başla
          </Link>
          <Link href="/auth/login" className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-md transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1">
            Giriş Yap
          </Link>
        </div>
      </section>
    </div>
  );
}
