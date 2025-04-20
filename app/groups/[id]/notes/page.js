'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaSave, FaShareSquare } from 'react-icons/fa';

export default function GroupNotes() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState(null);
  const [notes, setNotes] = useState([]);
  const [personalNotes, setPersonalNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchGroupAndNotes() {
      setLoading(true);
      setError('');
      
      try {
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
        
        // Gruba ait notları çek
        const { data: notesData, error: notesError } = await supabase
          .from('group_notes')
          .select(`
            id,
            title,
            content,
            creator_id,
            created_at,
            updated_at,
            profiles (
              username,
              full_name
            )
          `)
          .eq('group_id', id)
          .order('created_at', { ascending: false });
          
        if (notesError) {
          console.error("Grup notları çekilemedi:", notesError);
        } else {
          setNotes(notesData || []);
        }
        
        // Kullanıcının kişisel notlarını çek (paylaşmak için)
        const { data: personalNotesData, error: personalNotesError } = await supabase
          .from('notes')
          .select('id, title, content, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (personalNotesError) {
          console.error("Kişisel notlar çekilemedi:", personalNotesError);
        } else {
          setPersonalNotes(personalNotesData || []);
        }
        
      } catch (error) {
        console.error('Grup notları yüklenirken hata:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGroupAndNotes();
  }, [id, user]);
  
  const handleShareNote = async () => {
    if (!selectedNote) return;
    
    setIsSharing(true);
    setError('');
    
    try {
      // Seçilen kişisel notu al
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .select('title, content')
        .eq('id', selectedNote)
        .single();
        
      if (noteError) throw noteError;
      
      // Notun daha önce paylaşılıp paylaşılmadığını kontrol et
      const { data: existingShare, error: existingShareError } = await supabase
        .from('group_notes')
        .select('id')
        .eq('group_id', id)
        .eq('title', noteData.title)
        .eq('creator_id', user.id)
        .single();
        
      if (existingShare) {
        setError('Bu not zaten grupta paylaşılmış.');
        setIsSharing(false);
        return;
      }
      
      // Yeni grup notu oluştur
      const { data: groupNoteData, error: shareError } = await supabase
        .from('group_notes')
        .insert({
          group_id: id,
          title: noteData.title,
          content: noteData.content,
          creator_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
        
      if (shareError) throw shareError;
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'share_note',
        entity_type: 'note',
        entity_id: groupNoteData.id,
        details: { note_title: noteData.title },
        created_at: new Date().toISOString()
      });
      
      alert('Not başarıyla paylaşıldı!');
      
      // Güncel notları çek ve state'i güncelle (sayfayı yeniden yüklemeden)
      const { data: updatedNotes, error: updateError } = await supabase
        .from('group_notes')
        .select(`
          id,
          title,
          content,
          creator_id,
          created_at,
          updated_at,
          profiles (
            username,
            full_name
          )
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: false });
        
      if (!updateError && updatedNotes) {
        setNotes(updatedNotes);
      }
      
    } catch (error) {
      console.error('Not paylaşılırken hata:', error);
      setError(`Not paylaşılamadı: ${error.message}`);
    } finally {
      setIsSharing(false);
      setSelectedNote(null);
    }
  };
  
  const handleRemoveNote = async (groupNoteId) => {
    if (!confirm('Bu notu gruptan kaldırmak istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('group_notes')
        .delete()
        .eq('id', groupNoteId);
        
      if (error) throw error;
      
      setNotes(notes.filter(note => note.id !== groupNoteId));
      alert('Not gruptan kaldırıldı.');
      
    } catch (error) {
      console.error('Not kaldırılırken hata:', error);
      alert(`Not kaldırılamadı: ${error.message}`);
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
            href={`/groups/${id}`}
            className="btn-primary"
          >
            Grup Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }
  
  if (!group) return null;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={`/groups/${id}`}
            className="flex items-center gap-2 text-orange-500 hover:text-orange-700"
          >
            <FaArrowLeft className="inline" /> <span>Gruba Geri Dön</span>
          </Link>
          
          <div className="flex gap-4">
            <Link 
              href={`/notes/new?group=${id}`}
              className="btn-primary flex items-center gap-2"
            >
              <FaPlus className="inline" /> <span>Yeni Not Oluştur</span>
            </Link>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2 break-words overflow-hidden" style={{ 
          maxWidth: "100%", 
          overflowWrap: 'break-word', 
          wordWrap: 'break-word',
          wordBreak: 'break-word'
        }}>{group.name} Notları</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Bu gruptaki paylaşılan notlar</p>
        
        {/* Not Paylaşma Bölümü */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 break-words overflow-hidden" style={{ 
            maxWidth: "100%", 
            overflowWrap: 'break-word', 
            wordWrap: 'break-word',
            wordBreak: 'break-word'
          }}>Kişisel Notlarımdan Paylaş</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedNote || ''}
              onChange={(e) => setSelectedNote(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">Not seçin...</option>
              {personalNotes.map(note => (
                <option key={note.id} value={note.id}>{note.title}</option>
              ))}
            </select>
            <button
              onClick={handleShareNote}
              disabled={!selectedNote || isSharing}
              className="btn-success flex items-center gap-2"
            >
              <FaShareSquare className="inline" /> <span>{isSharing ? 'Paylaşılıyor...' : 'Paylaş'}</span>
            </button>
          </div>
        </div>
        
        {/* Notlar Listesi */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              Bu grupta henüz not paylaşılmamıştır.
            </p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <Link href={`/groups/${id}/notes/${note.id}`} className="max-w-[80%]">
                    <h3 className="text-lg font-semibold hover:text-cyan-600 break-words overflow-hidden" style={{ 
                      maxWidth: "100%", 
                      overflowWrap: 'break-word', 
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      display: 'block'
                    }}>{note.title}</h3>
                  </Link>
                  
                  {note.creator_id === user.id && (
                    <button
                      onClick={() => handleRemoveNote(note.id)}
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                      title="Gruptan Kaldır"
                    >
                      <FaTrash className="inline" />
                    </button>
                  )}
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-2 line-clamp-2" 
                   style={{ 
                     overflowWrap: 'break-word', 
                     wordWrap: 'break-word',
                     wordBreak: 'break-word',
                     textOverflow: 'ellipsis',
                     overflow: 'hidden',
                     maxWidth: "100%"
                   }}>
                  {note.content.length > 150 
                    ? note.content.substring(0, 150) + '...' 
                    : note.content}
                </p>
                
                <div className="flex justify-between text-sm text-gray-500 flex-wrap">
                  <span className="break-words overflow-hidden" style={{ 
                    maxWidth: "60%", 
                    overflowWrap: 'break-word', 
                    wordBreak: 'break-word',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}>
                    Paylaşan: {note.profiles?.full_name || note.profiles?.username || 'Bilinmiyor'}
                  </span>
                  <span>
                    {new Date(note.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 