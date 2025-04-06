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
          full_name: user.email?.split('@')[0] || '',
          bio: '',
          created_at: new Date().toISOString()
        };
        
        setProfile(userProfile);
        setDisplayName(userProfile.full_name || user.email?.split('@')[0] || '');
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
      
      setMessage({ 
        text: 'Profil başarıyla güncellendi!', 
        type: 'success' 
      });
      setIsEditing(false);
      setProfile({ ...profile, ...updates });
      setDisplayName(updates.full_name);
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profil Sayfası</h1>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' 
            : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <p>Profil yükleniyor...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-4xl font-semibold shadow-md">
                {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
              
              <div className="mt-4 text-center">
                <h2 className="text-xl font-semibold">
                  {profile?.full_name || user.email?.split('@')[0]}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">{user.email}</p>
              </div>
              
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-500">
                <p>Kayıt tarihi: {new Date(profile?.created_at || new Date()).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">İsim</label>
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      placeholder="İsminiz"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 font-medium">Hakkımda</label>
                    <textarea 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      rows={4}
                      placeholder="Kendiniz hakkında kısa bir açıklama..."
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(profile?.full_name || '');
                        setBio(profile?.bio || '');
                        setMessage({ text: '', type: '' });
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                      disabled={saving}
                    >
                      İptal
                    </button>
                    
                    <button 
                      type="button"
                      onClick={handleSaveProfile}
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Hakkımda</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {profile?.bio || 'Henüz bir biyografi eklenmemiş.'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">İstatistikler</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-center shadow-sm">
                        <div className="text-2xl font-bold text-blue-500">{notesCount}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Not</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-center shadow-sm">
                        <div className="text-2xl font-bold text-indigo-500">{goalsCount}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Hedef</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-center shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">{completedGoalsCount}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Tamamlanan</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition-colors"
                    >
                      Profili Düzenle
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4">Güvenlik</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/auth/reset-password" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                Şifreyi Değiştir
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><p>Yükleniyor...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}
