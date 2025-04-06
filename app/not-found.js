'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function NotFoundInner() {
  const searchParams = useSearchParams();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">
          Sayfa Bulunamadı
        </h2>
        <p className="text-gray-500">
          Aradığınız sayfa bulunamadı veya taşınmış olabilir.
        </p>
        <div>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotFoundContent() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <NotFoundInner />
    </Suspense>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <NotFoundContent />
    </Suspense>
  );
} 