'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

function HomePageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (user) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">NoteFaw'a Hoş Geldiniz</h1>
        <p className="text-xl mb-8">
          Fikirlerinizi not alın, hedeflerinizi gerçekleştirin.
        </p>
        
        <div className="flex justify-center gap-4">
          <Link href="/auth/login" className="btn-primary">
            Giriş Yap
          </Link>
          <Link href="/auth/signup" className="btn-secondary">
            Üye Ol
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomePageContent() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <HomePageInner />
    </Suspense>
  );
}

function HomePage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <HomePageContent />
    </Suspense>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <HomePage />
    </Suspense>
  );
}
