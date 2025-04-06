'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';

export default function Notes() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        let query = supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (searchTerm) {
          query = query.ilike('title', `%${searchTerm}%`);
        }
        
        if (activeTag) {
          query = query.contains('tags', [activeTag]);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setNotes(data || []);
        
        // Benzersiz etiketleri topla
        if (data) {
          const allTags = data.flatMap(note => note.tags || []);
          const uniqueTags = [...new Set(allTags)];
          setTags(uniqueTags);
        }
        
      } catch (error) {
        console.error('Notları çekerken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [user, searchTerm, activeTag]);
  
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notlarım</h1>
        <Link href="/notes/new" className="btn-primary">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Not
          </span>
        </Link>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Not ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {activeTag && (
            <button
              onClick={() => setActiveTag('')}
              className="flex items-center text-sm px-3 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100 rounded-full"
            >
              {activeTag}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {tags.slice(0, 5).map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
              className={`text-sm px-3 py-1 rounded-full ${
                tag === activeTag
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p>Notlar yükleniyor...</p>
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <div className="card h-full hover:shadow-lg transition-all cursor-pointer">
                <h2 className="text-lg font-semibold mb-2">{note.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {note.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                </p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {note.tags?.map(tag => (
                    <span 
                      key={tag} 
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTag(tag);
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  {new Date(note.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 card">
          <h2 className="text-xl mb-2">Henüz not oluşturmadınız</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            İlk notunuzu oluşturmak için "Yeni Not" düğmesine tıklayın.
          </p>
          <Link href="/notes/new" className="btn-primary">
            İlk Notu Oluştur
          </Link>
        </div>
      )}
    </div>
  );
}
