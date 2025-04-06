'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import supabase from '../../../../../lib/supabase';

function CreateNoteForm({ params }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: note, error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            content,
            group_id: params.id,
            user_id: session.user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      router.push(`/groups/${params.id}/notes/${note.id}`);
    } catch (error) {
      setError('Not oluşturulurken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/groups/${params.id}`}
            className="text-blue-500 hover:underline"
          >
            ← Gruba Dön
          </Link>
          <h1 className="text-3xl font-bold mt-4">Yeni Not</h1>
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
              rows={15}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Markdown formatında yazabilirsiniz.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/groups/${params.id}`}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateNotePage({ params }) {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <CreateNoteForm params={params} />
    </Suspense>
  );
} 