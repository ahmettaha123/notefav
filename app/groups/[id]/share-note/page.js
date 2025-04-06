'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';

export default function ShareNote({ params }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Grup bilgisini çek
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('name')
          .eq('id', id)
          .single();
        
        if (groupError) throw groupError;
        setGroupName(groupData.name);
        
        // Kullanıcının bu gruba üye olup olmadığını kontrol et
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (memberError) {
          // Kullanıcı bu grubun üyesi değil
          router.push('/groups');
          return;
        }
        
        // Kullanıcının notlarını çek
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (notesError) throw notesError;
        
        // Zaten paylaşılmış notları kontrol et
        const { data: sharedNotes, error: sharedError } = await supabase
          .from('group_notes')
          .select('note_id')
          .eq('group_id', id);
          
        if (sharedError) throw sharedError;
        
        // Zaten paylaşılmış notları filtrele
        const sharedNoteIds = sharedNotes?.map(n => n.note_id) || [];
        const availableNotes = notesData?.filter(note => !sharedNoteIds.includes(note.id)) || [];
        
        setNotes(availableNotes);
        
      } catch (error) {
        console.error('Veriler çekilirken hata:', error);
        setError('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, router]);

  const filteredNotes = notes.filter(note => {
    const searchLower = searchTerm.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchLower) ||
      (note.content && note.content.toLowerCase().includes(searchLower)) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  const handleShareNote = async () => {
    if (!selectedNoteId) {
      setError('Lütfen paylaşmak için bir not seçin.');
      return;
    }
    
    try {
      setSharing(true);
      setError('');
      
      // Seçili notu al
      const selectedNote = notes.find(note => note.id === selectedNoteId);
      
      // Notu grupla paylaş
      const { error } = await supabase
        .from('group_notes')
        .insert({
          group_id: id,
          note_id: selectedNoteId,
          shared_by: user.id
        });
        
      if (error) throw error;
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'share_note',
        entity_type: 'note',
        entity_id: selectedNoteId,
        details: { note_title: selectedNote?.title }
      });
      
      router.push(`/groups/${id}`);
      
    } catch (error) {
      console.error('Not paylaşılırken hata oluştu:', error);
      setError(`Not paylaşılamadı: ${error.message}`);
      setSharing(false);
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href={`/groups/${id}`} className="text-cyan-500 hover:underline flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Gruba Dön
          </Link>
          <h1 className="text-3xl font-bold">{groupName} - Not Paylaş</h1>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <div className="card mb-6">
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Not Ara
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            placeholder="Başlık, içerik veya etiketlerde ara..."
          />
        </div>
        
        <h2 className="text-xl font-semibold mb-4">Paylaşılacak Notu Seçin</h2>
        
        {filteredNotes.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {filteredNotes.map((note) => (
              <label 
                key={note.id} 
                className={`flex items-start p-4 border rounded-md cursor-pointer ${
                  selectedNoteId === note.id 
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="selectedNote"
                  value={note.id}
                  checked={selectedNoteId === note.id}
                  onChange={() => setSelectedNoteId(note.id)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{note.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                    {note.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(note.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {notes.length === 0 
                ? 'Henüz paylaşılabilecek notunuz yok. Önce bir not oluşturun.' 
                : 'Arama kriterlerinize uygun not bulunamadı.'}
            </p>
            {notes.length === 0 && (
              <Link href="/notes/new" className="btn-primary">
                Yeni Not Oluştur
              </Link>
            )}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleShareNote}
            disabled={!selectedNoteId || sharing}
            className={`px-4 py-2 rounded-md ${
              !selectedNoteId 
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400' 
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
            }`}
          >
            {sharing ? 'Paylaşılıyor...' : 'Notu Paylaş'}
          </button>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Bilgi</h2>
        <div className="text-gray-600 dark:text-gray-400 space-y-2">
          <p>Notlarınızı grupla paylaştığınızda, tüm grup üyeleri bunları görüntüleyebilir.</p>
          <p>Notunuzu düzenlerseniz, grup içinde paylaşılan versiyon da güncellenir.</p>
          <p>Notunuzu silerseniz, grupla olan paylaşım da kaldırılır.</p>
        </div>
      </div>
    </div>
  );
}
