'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../lib/supabase';
import { Suspense } from 'react';

function NotesInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/notes');
      return;
    }

    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select(`
            id,
            title,
            content,
            created_at,
            updated_at,
            group_id,
            groups (
              id,
              name,
              color
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (notesError) {
          console.error('Notlar alınırken hata:', notesError);
          setError('Notlar alınamadı: ' + notesError.message);
          return;
        }

        setNotes(notesData || []);
      } catch (error) {
        console.error('Notlar alınırken beklenmeyen hata:', error);
        setError('Notlar alınamadı: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchNotes();
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="flex justify-center py-16"><p>Yükleniyor...</p></div>;
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Giriş yapmalısınız</h1>
        <p className="mb-6">Bu sayfayı görüntülemek için giriş yapmanız gerekmektedir.</p>
        <Link href="/auth/login" className="btn-primary">
          Giriş Yap
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-16"><p>Notlar yükleniyor...</p></div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notlarım</h1>
        <Link
          href="/notes/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Yeni Not
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Henüz hiç notunuz yok.</p>
          <Link
            href="/notes/new"
            className="text-blue-500 hover:underline"
          >
            İlk notunuzu oluşturun
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{note.title}</h2>
                {note.groups && (
                  <span
                    className="px-2 py-1 text-sm rounded"
                    style={{
                      backgroundColor: note.groups.color + '20',
                      color: note.groups.color
                    }}
                  >
                    {note.groups.name}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4 line-clamp-3">{note.content}</p>
              <div className="text-sm text-gray-500">
                {new Date(note.created_at).toLocaleDateString('tr-TR')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesContent() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <NotesInner />
    </Suspense>
  );
}

export default function Notes() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <NotesContent />
    </Suspense>
  );
}
