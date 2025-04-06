'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';
import { Suspense } from 'react';
// Resim yükleme yardımcı kodlarını kaldırdık
// import { uploadImage, insertImageToText } from '../../../utils/imageUpload';

// Temel zengin metin düzenleyici için basit butonlar ekliyoruz
function CreateNoteFormContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('group');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);
  const [isGroupNote, setIsGroupNote] = useState(!!groupId);
  // Resim yükleme ile ilgili state'leri ve ref'leri kaldırdık
  // const [uploading, setUploading] = useState(false);
  const tagInputRef = useRef(null);
  const textareaRef = useRef(null);
  // const fileInputRef = useRef(null);
  const [groups, setGroups] = useState([]);

  // Grup bilgilerini yükle
  useEffect(() => {
    if (!user || !groupId) return;
    
    async function fetchGroupInfo() {
      try {
        // Grup bilgilerini çek
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();
          
        if (groupError) {
          console.error("Grup bilgileri çekilemedi:", groupError);
          setError("Grup bulunamadı");
          return;
        }
        
        setGroupInfo(groupData);
        setIsGroupNote(true);
        
      } catch (error) {
        console.error('Grup bilgileri yüklenirken hata:', error.message);
        setError(error.message);
      }
    }
    
    fetchGroupInfo();
  }, [groupId, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/notes/new');
      return;
    }

    const fetchGroups = async () => {
      try {
        const { data: groupsData, error: groupsError } = await supabase
          .from('group_members')
          .select(`
            groups (
              id,
              name,
              color
            )
          `)
          .eq('user_id', user.id);

        if (groupsError) {
          console.error('Gruplar alınırken hata:', groupsError);
          return;
        }

        const validGroups = groupsData
          .map(item => item.groups)
          .filter(group => group !== null);

        setGroups(validGroups);
      } catch (error) {
        console.error('Gruplar alınırken beklenmeyen hata:', error);
      }
    };

    if (user) {
      fetchGroups();
    }
  }, [user, authLoading, router]);

  // Zengin metin işlemleri için yardımcı fonksiyonlar
  const insertFormat = (format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let replacement = '';
    
    switch (format) {
      case 'bold':
        replacement = `**${selectedText}**`;
        break;
      case 'italic':
        replacement = `_${selectedText}_`;
        break;
      case 'heading1':
        replacement = `\n# ${selectedText}`;
        break;
      case 'heading2':
        replacement = `\n## ${selectedText}`;
        break;
      case 'heading3':
        replacement = `\n### ${selectedText}`;
        break;
      case 'list-ul':
        replacement = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        break;
      case 'list-ol':
        replacement = selectedText.split('\n').map((line, i) => `${i+1}. ${line}`).join('\n');
        break;
      case 'link':
        const url = prompt('URL adresini giriniz:', 'http://');
        if (url) replacement = `[${selectedText || 'Link'}](${url})`;
        else return;
        break;
      default:
        return;
    }
    
    // Yeni içeriği oluştur ve seçimi güncelle
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    
    // Textarea'ya odaklan ve imleç konumunu ayarla
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    
    if (!tagInput.trim()) return;
    
    // # karakterlerini kaldır ve boşlukları tire ile değiştir
    const formattedTag = tagInput.trim().replace(/^#+/, '').replace(/\s+/g, '-');
    
    if (formattedTag && !tags.includes(formattedTag)) {
      setTags([...tags, formattedTag]);
      setTagInput('');
      tagInputRef.current?.focus();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveNote = async () => {
    if (!title.trim()) {
      setError('Başlık gereklidir.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // İlk olarak kullanıcının profil kaydının olup olmadığını kontrol et
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // Eğer profil yoksa oluştur
      if (profileError && profileError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0],
            full_name: user.email?.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      } else if (profileError) {
        throw profileError;
      }
      
      // Eğer grup notu ise, önce kullanıcının grup üyesi olup olmadığını kontrol et
      if (isGroupNote && groupId) {
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single();
          
        if (memberError) {
          if (memberError.code === 'PGRST116') {
            throw new Error('Bu gruba üye değilsiniz. Not oluşturmak için önce gruba katılmalısınız.');
          }
          throw memberError;
        }
        
        // Grup notunu kaydet
        const { data: groupNoteData, error: groupNoteError } = await supabase
          .from('group_notes')
          .insert({
            group_id: groupId,
            title: title.trim(),
            content: content,
            creator_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (groupNoteError) throw groupNoteError;
        
        // Grup aktivitesini kaydet
        await supabase.from('group_activity').insert({
          group_id: groupId,
          user_id: user.id,
          action: 'create_note',
          entity_type: 'note',
          entity_id: groupNoteData.id,
          details: { note_title: title.trim() },
          created_at: new Date().toISOString()
        });
        
        // Grup sayfasına yönlendir
        router.push(`/groups/${groupId}/notes`);
      } else {
        // Eğer kişisel not ise, notes tablosuna kaydet
        const newNote = {
          user_id: user.id,
          title: title.trim(),
          content,
          tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Notun veritabanına kaydedilmesi
        const { data, error } = await supabase
          .from('notes')
          .insert([newNote])
          .select('id')
          .single();
          
        if (error) throw error;
        
        // Standart not sayfasına yönlendir
        router.push(`/notes/${data.id}`);
      }
      
    } catch (error) {
      console.error('Not kaydedilirken hata oluştu:', error);
      setError(`Not kaydedilemedi: ${error.message}`);
      setSaving(false);
    }
  };

  // Resim yükleme fonksiyonlarını kaldırdık
  // const handleImageUpload = async () => { ... }
  // const onFileChange = async (e) => { ... }

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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isGroupNote && groupInfo ? `Yeni Grup Notu - ${groupInfo.name}` : 'Yeni Not'}
        </h1>
        <div className="flex gap-2">
          <Link 
            href={isGroupNote && groupId ? `/groups/${groupId}/notes` : "/notes"} 
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>İptal</span>
          </Link>
          <button 
            onClick={handleSaveNote}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
        </div>
      </div>
      
      {isGroupNote && groupInfo && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Bu not "{groupInfo.name}" grubunda paylaşılacak.
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        {/* Başlık */}
        <div>
          <label htmlFor="title" className="block mb-2 font-medium">
            Başlık
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            placeholder="Not başlığını girin..."
          />
        </div>
        
        {/* İçerik - Zengin metin araç çubuğu ile */}
        <div>
          <label className="block mb-2 font-medium">
            İçerik
          </label>
          <div className="border border-gray-300 dark:border-slate-600 rounded-md overflow-hidden">
            {/* Araç çubuğu */}
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-600">
              <button 
                type="button" 
                onClick={() => insertFormat('heading1')} 
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                title="Başlık 1"
              >
                H1
              </button>
              <button 
                type="button" 
                onClick={() => insertFormat('heading2')} 
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                title="Başlık 2"
              >
                H2
              </button>
              <button 
                type="button" 
                onClick={() => insertFormat('heading3')} 
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                title="Başlık 3"
              >
                H3
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>
              <button 
                type="button" 
                onClick={() => insertFormat('bold')} 
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                title="Kalın"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z"/>
                </svg>
              </button>
              <button 
                type="button" 
                onClick={() => insertFormat('italic')} 
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                title="İtalik"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z"/>
                </svg>
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>
              <button 
                type="button" 
                onClick={() => insertFormat('list-ul')} 
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                title="Liste"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                </svg>
              </button>
              <button 
                type="button" 
                onClick={() => insertFormat('list-ol')} 
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                title="Numaralı Liste"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
                  <path d="M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338v.041zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635V5z"/>
                </svg>
              </button>
              <button 
                type="button" 
                onClick={() => insertFormat('link')} 
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                title="Link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
                  <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
                </svg>
              </button>
              {/* Resim ekleme butonunu kaldırdık */}
              <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                Markdown formatı desteklenir
              </div>
            </div>
            {/* Metin alanı */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Not içeriğini yazın... (* için kalın, _ için italik, # için başlık kullanabilirsiniz)"
            ></textarea>
          </div>
          {/* Önizleme alanı */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Önizleme</h3>
            <div 
              className="border border-gray-200 dark:border-slate-700 rounded-md p-4 prose dark:prose-invert max-w-none"
              style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                overflowX: 'hidden',
                overflowWrap: 'break-word', 
                wordWrap: 'break-word',
                wordBreak: 'break-word'
              }}
            >
              {renderMarkdown(content)}
            </div>
          </div>
        </div>
        
        {/* Etiketler */}
        <div>
          <label className="block mb-2 font-medium">
            Etiketler
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full"
              >
                #{tag}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddTag} className="flex">
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Yeni etiket ekleyin... (Enter ile ekleyin)"
            />
            <button 
              type="submit" 
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-r-md border-t border-r border-b border-gray-300 dark:border-gray-700"
            >
              Ekle
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CreateNoteForm() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <CreateNoteFormContent />
    </Suspense>
  );
}

export default function CreateNote() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <CreateNoteForm />
    </Suspense>
  );
}

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
    // Boş satır, liste veya başlık değilse paragraf olarak işaretle
    if (line.trim() && !line.match(/^<[hl]|<li/)) {
      return `<p>${line}</p>`;
    }
    return line;
  }).join('');
  
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
