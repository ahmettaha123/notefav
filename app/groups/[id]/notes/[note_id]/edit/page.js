'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import supabase from '../../../../../../lib/supabase';

function EditNoteForm({ params }) {
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchNote() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data: note, error: noteError } = await supabase
          .from('notes')
          .select('*')
          .eq('id', params.note_id)
          .single();

        if (noteError) throw noteError;

        if (!note) {
          setError('Not bulunamadı');
          return;
        }

        setNote(note);
        setTitle(note.title);
        setContent(note.content);
      } catch (error) {
        setError('Not yüklenirken bir hata oluştu: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNote();
  }, [params.note_id, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { error: updateError } = await supabase
        .from('notes')
        .update({
          title,
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.note_id);

      if (updateError) throw updateError;

      router.push(`/groups/${params.id}/notes/${params.note_id}`);
    } catch (error) {
      setError('Not güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Bulunamadı</h1>
          <Link href={`/groups/${params.id}`} className="text-blue-500 hover:underline">
            Gruba Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/groups/${params.id}/notes/${params.note_id}`}
            className="text-blue-500 hover:underline"
          >
            ← Nota Dön
          </Link>
          <h1 className="text-3xl font-bold mt-4">Not Düzenle</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded">{error}</div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Başlık
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              İçerik
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/groups/${params.id}/notes/${params.note_id}`}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditNote({ params }) {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <EditNoteForm params={params} />
    </Suspense>
  );
} 