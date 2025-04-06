'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';
// import dynamic from 'next/dynamic';

// Temporarily comment out ReactQuill until dependency issues are resolved
// const ReactQuill = dynamic(() => import('react-quill'), { 
//   ssr: false,
//   loading: () => <p>Yükleniyor...</p>
// });
// import 'react-quill/dist/quill.bubble.css';

export default function NotePage({ params }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        // Kullanıcının kendi notu mu kontrol et
        if (data.user_id !== user.id) {
          router.push('/notes');
          return;
        }
        
        setNote(data);
      } catch (error) {
        console.error('Not çekilirken hata:', error);
        setError('Not bulunamadı veya erişim izniniz yok.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNote();
  }, [id, user, router]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      router.push('/notes');
    } catch (error) {
      console.error('Not silinirken hata:', error);
      setError(`Not silinemedi: ${error.message}`);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  if (authLoading || loading) {
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
  
  if (error) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Hata</h1>
        <p className="mb-6">{error}</p>
        <Link href="/notes" className="btn-primary">
          Geri Dön
        </Link>
      </div>
    );
  }

  if (!note) return null;

  // Markdown formatını HTML'e dönüştür (resim desteğini kaldırdık)
  function renderMarkdown(text) {
    if (!text) return null;
    
    let html = text;
    
    // Başlıklar
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Kalın ve italik
    html = html.replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/gm, '<em>$1</em>');
    
    // Listeler
    html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
    
    // Resim işleme kodunu kaldırdık
    
    // Linkler
    html = html.replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Paragraf etiketleri
    html = html.split('\n').map(line => {
      if (line.trim() && !line.match(/^<[hl]|<li/)) {
        return `<p>${line}</p>`;
      }
      return line;
    }).join('');
    
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link href="/notes" className="text-cyan-500 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tüm Notlar
        </Link>
        
        <div className="flex gap-2">
          <Link 
            href={`/notes/edit/${id}`}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Düzenle
          </Link>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sil
          </button>
        </div>
      </div>
      
      <div className="card">
        <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {note.tags?.map(tag => (
            <span 
              key={tag} 
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="mb-6 prose dark:prose-invert max-w-none">
          {renderMarkdown(note.content)}
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Oluşturma: {new Date(note.created_at).toLocaleString('tr-TR')}</p>
          <p>Güncelleme: {new Date(note.updated_at).toLocaleString('tr-TR')}</p>
        </div>
      </div>
      
      {/* Silme Onay Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Notu Sil</h2>
            <p className="mb-6">Bu notu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                disabled={isDeleting}
              >
                İptal
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
