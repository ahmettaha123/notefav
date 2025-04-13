'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { FaNoteSticky, FaUserGroup, FaListCheck, FaChartLine, FaMobileScreen, FaMagnifyingGlass, FaComments } from 'react-icons/fa6';

function FeaturesContent() {
  // Özellik listesi
  const features = [
    {
      id: 'notes',
      title: 'Not Alma',
      description: 'Hızlı ve kolay bir şekilde notlar alın, düzenleyin ve organize edin. Markdown desteği ile zengin içerik oluşturun.',
      icon: <FaNoteSticky className="text-4xl text-cyan-500" />,
      link: '/notes'
    },
    {
      id: 'groups',
      title: 'Gruplar',
      description: 'Başkalarıyla işbirliği yapın, notları paylaşın ve grup çalışmaları oluşturun. Ekip çalışmasını kolaylaştırın.',
      icon: <FaUserGroup className="text-4xl text-cyan-500" />,
      link: '/groups'
    },
    {
      id: 'goals',
      title: 'Hedefler',
      description: 'Kişisel veya grup hedefleri belirleyin, ilerlemenizi takip edin ve başarılarınızı kutlayın.',
      icon: <FaListCheck className="text-4xl text-cyan-500" />,
      link: '/goals'
    },
    {
      id: 'tracking',
      title: 'İlerleme Takibi',
      description: 'Hedeflerinize yönelik ilerlemenizi görsel olarak takip edin, istatistikleri görüntüleyin.',
      icon: <FaChartLine className="text-4xl text-cyan-500" />,
      link: '/goals'
    },
    {
      id: 'mobile',
      title: 'Mobil Erişim',
      description: 'Responsive tasarım sayesinde her cihazdan notlarınıza ve hedeflerinize erişin.',
      icon: <FaMobileScreen className="text-4xl text-cyan-500" />,
      link: '/'
    },
    {
      id: 'search',
      title: 'Detaylı Arama',
      description: 'Notlarınız ve hedefleriniz arasında hızlıca arama yapın, istediğiniz bilgiye anında ulaşın.',
      icon: <FaMagnifyingGlass className="text-4xl text-cyan-500" />,
      link: '/notes'
    },
    {
      id: 'feedback',
      title: 'Geribildirim',
      description: 'Grup üyeleri arasında geribildirim paylaşımı yapın, notlar üzerinde iyileştirmeler sağlayın.',
      icon: <FaComments className="text-4xl text-cyan-500" />,
      link: '/groups'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">NoteFav Özellikleri</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Fikirlerinizi not alın, hedeflerinizi takip edin ve başkalarıyla işbirliği yapın - NoteFav'ın kullanımı kolay özellikleriyle tüm bunları ve çok daha fazlasını yapabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {features.map((feature) => (
          <div key={feature.id} className="card hover:shadow-lg transition-all border-t-4 border-t-cyan-500">
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{feature.description}</p>
            <Link href={feature.link} className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium">
              Daha fazla bilgi &rarr;
            </Link>
          </div>
        ))}
      </div>

      <div className="card mb-16">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Neden NoteFav?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            NoteFav, fikirlerinizi organize etmek ve hedeflerinize ulaşmak için ihtiyacınız olan tüm araçları tek bir platformda sunar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50">
            <h3 className="text-xl font-semibold mb-2">Kullanımı Kolay</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Sezgisel arayüzü ve kullanıcı dostu tasarımı ile NoteFav'ı kullanmaya hemen başlayabilirsiniz.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50">
            <h3 className="text-xl font-semibold mb-2">Kişiselleştirilebilir</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Kendi çalışma düzeninizi oluşturun, gruplarınızı ve hedeflerinizi istediğiniz gibi organize edin.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50">
            <h3 className="text-xl font-semibold mb-2">Güvenli</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Verileriniz güvende. En yüksek güvenlik standartlarıyla korunur ve sadece sizin izin verdiğiniz kişilerle paylaşılır.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50">
            <h3 className="text-xl font-semibold mb-2">Ücretsiz</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Temel özellikler tamamen ücretsiz. İhtiyaç duyduğunuzda ileri seviye özelliklere geçiş yapabilirsiniz.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-6">Hemen Başlayın</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup" className="btn-primary px-8 py-3 text-lg">
            Ücretsiz Kaydol
          </Link>
          <Link href="/auth/login" className="btn-secondary px-8 py-3 text-lg">
            Giriş Yap
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Sıkça Sorulan Sorular</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-2">NoteFav tamamen ücretsiz mi?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Evet, NoteFav'ın temel özellikleri tamamen ücretsizdir. İlerleyen dönemlerde ileri seviye özellikler için premium planlar sunulabilir, ancak temel özellikler her zaman ücretsiz kalacaktır.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Notlarımı ve hedeflerimi başkalarıyla paylaşabilir miyim?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Evet, gruplar oluşturarak notlarınızı ve hedeflerinizi başkalarıyla paylaşabilirsiniz. Grup lideri olarak kimlerin grup içeriğine erişebileceğini kontrol edebilirsiniz.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Verilerim güvende mi?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Evet, verilerinizin güvenliği bizim için çok önemli. Modern şifreleme ve güvenlik protokolleri kullanarak verilerinizi koruyoruz. Ayrıca, verilerinizi sadece sizin izin verdiğiniz kişilerle paylaşıyoruz.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-2">NoteFav'ı mobil cihazımdan kullanabilir miyim?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Evet, NoteFav tamamen responsive bir tasarıma sahiptir ve her türlü cihazdan (bilgisayar, tablet, akıllı telefon) sorunsuz bir şekilde kullanılabilir. Ayrıca ilerleyen dönemlerde mobil uygulamalar da sunmayı planlıyoruz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><p>Yükleniyor...</p></div>}>
      <FeaturesContent />
    </Suspense>
  );
} 