'use client';

import { Suspense } from 'react';
import Link from 'next/link';

function NotFoundContent() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="mb-8">
        <span className="block text-9xl font-bold text-gray-300 dark:text-gray-700">404</span>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Sayfa Bulunamadı</h1>
      
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        Aradığınız sayfa bulunamadı veya taşınmış olabilir. Anasayfaya dönüp tekrar deneyebilirsiniz.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="btn-primary">
          Anasayfaya Dön
        </Link>
        
        <Link href="/notes" className="btn-secondary">
          Notlarım
        </Link>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><p>Yükleniyor...</p></div>}>
      <NotFoundContent />
    </Suspense>
  );
} 