'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex-1">
            <div className="mb-6">
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="mb-2" />
              <h3 className="font-bold text-lg mb-4">NoteFav</h3>
              <p className="text-gray-600 dark:text-gray-400">Notlarınızı, yapılacaklar listenizi ve hedeflerinizi tek bir platformda yönetin.</p>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-500">
              &copy; {currentYear} NoteFav. Tüm hakları saklıdır.
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
