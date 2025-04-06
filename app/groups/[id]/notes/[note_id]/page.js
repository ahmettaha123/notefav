'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../../lib/supabase';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';

export default function GroupNoteDetail() {
  const { id, note_id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [group, setGroup] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchNoteAndGroup() {
      setLoading(true);
      setError('');
      
      try {
        // Not bilgisini çek
        const { data: noteData, error: noteError } = await supabase
          .from('group_notes')
          .select(`
            *,
            profiles (
              username,
              full_name
            )
          `)
          .eq('id', note_id)
          .eq('group_id', id)
          .single();
          
        if (noteError) {
          console.error("Not bilgileri çekilemedi:", noteError);
          throw new Error("Not bulunamadı");
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
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNoteAndGroup();
  }, [id, note_id, user]);
  
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
  
  // Markdown formatını HTML'e dönüştür
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    let html = text;
    
    // Başlıklar
    html = html.replace(/^### (.*$)/gm, '<h3 class="break-words">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="break-words">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="break-words">$1</h1>');
    
    // Kalın ve italik
    html = html.replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/gm, '<em>$1</em>');
    
    // Listeler
    html = html.replace(/^\- (.*$)/gm, '<li class="break-words">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gm, '<li class="break-words">$1</li>');
    
    // Linkler
    html = html.replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2" target="_blank" rel="noopener noreferrer" class="break-all">$1</a>');
    
    // Paragraf etiketleri
    html = html.split('\n').map(line => {
      // Boş satır, liste veya başlık değilse paragraf olarak işaretle
      if (line.trim() && !line.match(/^<[hl]|<li/)) {
        return `<p class="break-words">${line}</p>`;
      }
      return line;
    }).join('');
    
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="prose-lg dark:prose-invert max-w-none"
      />
    );
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
    <div className="container mx-auto py-8 px-4">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={`/groups/${id}/notes`}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
          >
            <FaArrowLeft className="inline" /> <span>Notlar Sayfasına Dön</span>
          </Link>
          
          {isOwner && (
            <div className="flex gap-2">
              <Link 
                href={`/groups/${id}/notes/${note_id}/edit`}
                className="text-blue-500 hover:text-blue-700 p-1 flex items-center gap-1"
                title="Düzenle"
              >
                <FaEdit className="inline" /> <span className="text-sm">Düzenle</span>
              </Link>
              <button
                onClick={handleDeleteNote}
                className="text-red-500 hover:text-red-700 p-1 flex items-center gap-1"
                title="Sil"
              >
                <FaTrash className="inline" /> <span className="text-sm">Sil</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-2 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {group.name} grubu notları
          </span>
          <span className="text-sm text-gray-500">
            {new Date(note.created_at).toLocaleDateString('tr-TR')}
          </span>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 break-words overflow-hidden whitespace-normal" style={{ 
          maxWidth: "100%",
          overflowWrap: 'break-word', 
          wordWrap: 'break-word',
          wordBreak: 'break-word'
        }}>
          {note.title}
        </h1>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 break-words" style={{
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          <span>
            Oluşturan: {note.profiles?.full_name || note.profiles?.username || 'Bilinmiyor'}
          </span>
          {note.updated_at && note.updated_at !== note.created_at && (
            <span className="ml-4">
              Son güncelleme: {new Date(note.updated_at).toLocaleDateString('tr-TR')}
            </span>
          )}
        </div>
        
        <div className="prose dark:prose-invert max-w-none mb-8 overflow-hidden" 
             style={{ 
               maxWidth: "100%",
               overflowWrap: 'break-word', 
               wordWrap: 'break-word',
               wordBreak: 'break-word'
             }}>
          <div className="markdown-content">
            {renderMarkdown(note.content)}
          </div>
        </div>
        
        <style jsx global>{`
          .markdown-content p,
          .markdown-content h1,
          .markdown-content h2, 
          .markdown-content h3,
          .markdown-content h4,
          .markdown-content h5,
          .markdown-content h6,
          .markdown-content li,
          .markdown-content table,
          .markdown-content blockquote,
          .markdown-content pre {
            max-width: 100%;
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
          }
        `}</style>
      </div>
    </div>
  );
} 