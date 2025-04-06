'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../lib/supabase';
import { Suspense } from 'react';

function GoalsInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        router.push('/auth/login');
      }
      return;
    }

    const fetchGoals = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (goalsError) {
          console.error('Hedefler getirilirken hata:', goalsError);
          setError('Hedefler getirilemedi: ' + goalsError.message);
          return;
        }

        setGoals(goalsData);
      } catch (error) {
        console.error('Beklenmeyen hata:', error);
        setError('Hedefler getirilemedi: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="flex justify-center py-16"><p>Yükleniyor...</p></div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hedeflerim</h1>
        <Link
          href="/goals/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Yeni Hedef
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">{error}</div>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Henüz hiç hedef eklenmemiş.</p>
          <Link
            href="/goals/new"
            className="text-blue-600 hover:text-blue-500 mt-2 inline-block"
          >
            İlk hedefini ekle
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{goal.title}</h3>
              <p className="text-gray-600 mb-4">{goal.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  {new Date(goal.created_at).toLocaleDateString('tr-TR')}
                </span>
                <Link
                  href={`/goals/${goal.id}`}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Detaylar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalsContent() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <GoalsInner />
    </Suspense>
  );
}

function Goals() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <GoalsContent />
    </Suspense>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <Goals />
    </Suspense>
  );
}
