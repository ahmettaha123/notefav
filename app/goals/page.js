'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import supabase from '../../lib/supabase';

function GoalsContent() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGoals(goals);
    } catch (error) {
      setError('Hedefler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hedeflerim</h1>
        <Link
          href="/goals/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Yeni Hedef
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Henüz bir hedefiniz yok.</p>
          <Link
            href="/goals/new"
            className="text-blue-500 hover:underline"
          >
            İlk hedefinizi oluşturun
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-xl font-semibold mb-2">{goal.title}</h2>
              <p className="text-gray-600 mb-4">{goal.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Bitiş: {new Date(goal.due_date).toLocaleDateString('tr-TR')}</span>
                <span className={`px-2 py-1 rounded ${
                  goal.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : goal.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {goal.status === 'completed' 
                    ? 'Tamamlandı'
                    : goal.status === 'in_progress'
                    ? 'Devam Ediyor'
                    : 'Başlanmadı'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Goals() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <GoalsContent />
    </Suspense>
  );
}
