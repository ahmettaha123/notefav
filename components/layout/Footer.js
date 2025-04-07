'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">NoteFaw</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Fikirlerinizi not alın, hedeflerinizi takip edin, gruplar oluşturun ve başkalarıyla işbirliği yapın.
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              &copy; {currentYear} NoteFaw. Tüm hakları saklıdır.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Özellikler</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/notes" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Not Alma
                </Link>
              </li>
              <li>
                <Link href="/goals" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Hedefler
                </Link>
              </li>
              <li>
                <Link href="/groups" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Gruplar
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Tüm Özellikler
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Kaynaklar</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Yardım Merkezi
                </Link>
              </li>
              <li>
                <Link href="/help#getting-started" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Başlangıç Rehberi
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Ayarlar
                </Link>
              </li>
              <li>
                <Link href="/help#contact" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Yasal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                  Çerez Politikası
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
