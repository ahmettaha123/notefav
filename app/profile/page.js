'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';
import Link from 'next/link';

function ProfileContent() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  // İstatistikler için yeni state değişkenleri
  const [notesCount, setNotesCount] = useState(0);
  const [goalsCount, setGoalsCount] = useState(0);
  const [completedGoalsCount, setCompletedGoalsCount] = useState(0);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Profil verisini çek
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        // Kullanıcı profili yoksa boş bir profil oluştur
        const userProfile = profileData || {
          id: user.id,
          username: user.email?.split('@')[0] || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          bio: '',
          created_at: new Date().toISOString()
        };
        
        setProfile(userProfile);
        setDisplayName(userProfile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        setBio(userProfile.bio || '');
        
        // Notları sayısını çek
        const { count: notesCount, error: notesError } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (notesError) throw notesError;
        setNotesCount(notesCount || 0);
        
        // Tüm hedefleri çek
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);
        
        if (goalsError) throw goalsError;
        
        setGoalsCount(goals?.length || 0);
        
        // Tamamlanan hedefleri say
        const completedGoals = goals?.filter(goal => goal.progress === 100) || [];
        setCompletedGoalsCount(completedGoals.length);
        
      } catch (error) {
        console.error('Veri çekilemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Profili güncelle veya oluştur
      const defaultName = user.email?.split('@')[0] || '';
      const updates = {
        id: user.id,
        username: defaultName,
        full_name: displayName.trim() || defaultName,
        bio: bio.trim(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { 
          onConflict: 'id',
          returning: 'minimal'
        });
        
      if (error) throw error;
      
      // Ayrıca user metadata'sını da güncelle
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          full_name: displayName.trim() || defaultName
        }
      });
      
      if (metadataError) throw metadataError;
      
      setMessage({ 
        text: 'Profil başarıyla güncellendi!', 
        type: 'success' 
      });
      setIsEditing(false);
      setProfile({ ...profile, ...updates });
      setDisplayName(updates.full_name);
      
      // Sayfayı yenile (metadata'nın her yerde güncellenmesi için)
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      setMessage({ 
        text: `Hata: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };
  
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Profil Bilgileri
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Profilinizi görüntüleyin ve düzenleyin
        </p>
      </div>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="relative w-12 h-12">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-200 dark:border-orange-800 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol kolon - Profil bilgileri */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800 p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
              <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-2xl text-white font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {isEditing ? (
                    <input
                      type="text"
                      className="bg-slate-100 dark:bg-slate-800 border-0 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="İsminiz"
                    />
                  ) : (
                    displayName || user.email?.split('@')[0]
                  )}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Profili Düzenle
                </button>
              ) : (
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(profile.full_name || user.email?.split('@')[0] || '');
                      setBio(profile.bio || '');
                    }}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                Hakkımda
              </h3>
              {isEditing ? (
                <textarea
                  className="bg-slate-100 dark:bg-slate-800 border-0 rounded-md px-3 py-2 w-full h-32 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Kendiniz hakkında kısa bir açıklama..."
                ></textarea>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">
                  {bio || 'Henüz bir biyografi eklenmemiş.'}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                Hesap Bilgileri
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">E-posta</span>
                  <span className="text-slate-800 dark:text-white font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Üyelik Tarihi</span>
                  <span className="text-slate-800 dark:text-white font-medium">
                    {new Date(profile?.created_at || user.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-slate-500 dark:text-slate-400">Son Giriş</span>
                  <span className="text-slate-800 dark:text-white font-medium">
                    {new Date(user.last_sign_in_at).toLocaleDateString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sağ kolon - İstatistikler */}
          <div>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800 p-6 mb-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                İstatistikler
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Toplam Not</div>
                      <div className="text-xl font-bold text-slate-800 dark:text-white">{notesCount}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Toplam Hedef</div>
                      <div className="text-xl font-bold text-slate-800 dark:text-white">{goalsCount}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Tamamlanan Hedefler</div>
                      <div className="text-xl font-bold text-slate-800 dark:text-white">{completedGoalsCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                Hızlı Erişim
              </h3>
              <div className="flex flex-col gap-2">
                <Link href="/notes/new" className="flex items-center py-3 px-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">Yeni Not Oluştur</span>
                </Link>
                <Link href="/goals/new" className="flex items-center py-3 px-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">Yeni Hedef Oluştur</span>
                </Link>
                <Link href="/settings" className="flex items-center py-3 px-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">Ayarlar</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><p>Yükleniyor...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}
