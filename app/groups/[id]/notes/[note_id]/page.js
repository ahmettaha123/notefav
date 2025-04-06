'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../../lib/supabase';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { Suspense } from 'react';
import ReactMarkdown from 'react-markdown';

function NoteContent({ params }) {
  const { id, note_id } = params;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    async function fetchNote() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data: noteData, error: noteError } = await supabase
          .from('group_notes')
          .select(`
            *,
            profiles (
              username,
              full_name
            ),
            groups (
              id,
              name
            )
          `)
          .eq('id', note_id)
          .eq('group_id', id)
          .single();

        if (noteError) throw noteError;

        if (!noteData) {
          setError('Not bulunamadı');
          return;
        }

        setNote(noteData);
        setIsOwner(noteData.creator_id === user.id);
        
        // Grup bilgilerini çek
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();
          
        if (groupError) {
          console.error("Grup bilgileri çekilemedi:", groupError);
          throw new Error("Grup bulunamadı");
        }
        
        setGroup(groupData);
        
      } catch (error) {
        console.error('Not detayları yüklenirken hata:', error.message);
        setError('Not yüklenirken bir hata oluştu: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNote();
  }, [id, note_id, user, router]);
  
  const handleDeleteNote = async () => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('group_notes')
        .delete()
        .eq('id', note_id);
        
      if (error) throw error;
      
      alert('Not silindi');
      router.push(`/groups/${id}/notes`);
      
    } catch (error) {
      console.error('Not silinirken hata:', error);
      alert(`Not silinemedi: ${error.message}`);
    }
  };
  
  if (authLoading || loading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link 
            href={`/groups/${id}/notes`}
            className="btn-primary"
          >
            Notlar Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }
  
  if (!note || !group) return null;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Üst Bilgi */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/groups/${id}`}
              className="text-blue-500 hover:underline"
            >
              ← {group.name}
            </Link>
            <div className="flex gap-2">
              <Link
                href={`/groups/${id}/notes/${note_id}/edit`}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Düzenle
              </Link>
              <button
                onClick={handleDeleteNote}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sil
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">{note.title}</h1>
          <div className="text-gray-500">
            {new Date(note.created_at).toLocaleDateString('tr-TR')}
          </div>
        </div>

        {/* Not İçeriği */}
        <div className="prose max-w-none">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
      </div>

      <style jsx global>{`
        .prose {
          max-width: 100%;
        }
        .prose p {
          max-width: 100%;
          word-break: break-word;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          max-width: 100%;
          word-break: break-word;
        }
        .prose ul,
        .prose ol {
          max-width: 100%;
          word-break: break-word;
        }
        .prose table {
          max-width: 100%;
          word-break: break-word;
        }
        .prose blockquote {
          max-width: 100%;
          word-break: break-word;
        }
        .prose pre {
          max-width: 100%;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}

export default function NotePage({ params }) {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <NoteContent params={params} />
    </Suspense>
  );
} 