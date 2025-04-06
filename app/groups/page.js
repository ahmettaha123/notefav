'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import supabase from '../../lib/supabase';

function GroupsInner() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGroups(groups);
    } catch (error) {
      setError('Gruplar yüklenirken bir hata oluştu: ' + error.message);
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
        <h1 className="text-3xl font-bold">Gruplarım</h1>
        <Link
          href="/groups/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Yeni Grup
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Henüz bir grubunuz yok.</p>
          <Link
            href="/groups/new"
            className="text-blue-500 hover:underline"
          >
            İlk grubunuzu oluşturun
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{group.name}</h2>
              <p className="text-gray-600">{group.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupsContent() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <GroupsInner />
    </Suspense>
  );
}

export default function Groups() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <GroupsContent />
    </Suspense>
  );
}
