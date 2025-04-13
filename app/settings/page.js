'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';
import Link from 'next/link';

function SettingsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Form alanları
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('tr');
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/settings');
      return;
    }
    
    // Kullanıcı profil bilgilerini yükle
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setProfile(data);
        setFullName(data?.full_name || '');
        setUsername(data?.username || '');
        setBio(data?.bio || '');
        
        // LocalStorage'dan tema tercihini al
        const savedTheme = localStorage.getItem('theme');
        setDarkMode(savedTheme === 'dark');
        
      } catch (error) {
        console.error('Profil bilgileri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [user, authLoading, router]);
  
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const updates = {
        id: user.id,
        full_name: fullName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' });
        
      if (error) throw error;
      
      setProfile({ ...profile, ...updates });
      showNotification('Profil bilgileriniz başarıyla güncellendi.', 'success');
      
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      showNotification('Profil güncellenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSavePreferences = () => {
    // Tema tercihini kaydet
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
    
    // Kullanıcı tercihlerini kaydet - gerçek bir uygulamada veritabanına kaydedilir
    showNotification('Tercihleriniz başarıyla güncellendi.', 'success');
  };
  
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
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
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Ayarlar</h1>
      
      {notification && (
        <div className={`mb-4 p-3 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sol Menü */}
        <div className="w-full md:w-1/4">
          <div className="card p-0 overflow-hidden">
            <button 
              onClick={() => setActiveTab('account')} 
              className={`w-full text-left px-4 py-3 border-l-4 ${
                activeTab === 'account' 
                  ? 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 font-medium'
                  : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              Hesap Bilgileri
            </button>
            
            <button 
              onClick={() => setActiveTab('preferences')} 
              className={`w-full text-left px-4 py-3 border-l-4 ${
                activeTab === 'preferences' 
                  ? 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 font-medium'
                  : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              Tercihler
            </button>
            
            <button 
              onClick={() => setActiveTab('notifications')} 
              className={`w-full text-left px-4 py-3 border-l-4 ${
                activeTab === 'notifications' 
                  ? 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 font-medium'
                  : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              Bildirimler
            </button>
            
            <button 
              onClick={() => setActiveTab('privacy')} 
              className={`w-full text-left px-4 py-3 border-l-4 ${
                activeTab === 'privacy' 
                  ? 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 font-medium'
                  : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              Gizlilik
            </button>
            
            <Link 
              href="/profile" 
              className="block w-full text-left px-4 py-3 border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              Profil Sayfası
            </Link>
          </div>
        </div>
        
        {/* Sağ İçerik */}
        <div className="w-full md:w-3/4">
          {/* Hesap Bilgileri */}
          {activeTab === 'account' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Hesap Bilgileri</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="email" className="block mb-1 font-medium">E-posta</label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                  <p className="text-sm text-gray-500 mt-1">E-posta adresinizi değiştirmek için destek ekibimizle iletişime geçin.</p>
                </div>
                
                <div>
                  <label htmlFor="fullName" className="block mb-1 font-medium">Tam Ad</label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Tam adınız"
                  />
                </div>
                
                <div>
                  <label htmlFor="username" className="block mb-1 font-medium">Kullanıcı Adı</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Kullanıcı adınız"
                  />
                </div>
                
                <div>
                  <label htmlFor="bio" className="block mb-1 font-medium">Hakkımda</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Kendinizi kısaca tanıtın"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </div>
          )}
          
          {/* Tercihler */}
          {activeTab === 'preferences' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Tercihler</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Karanlık Mod</h3>
                    <p className="text-sm text-gray-500">Karanlık tema kullanarak gözlerinizi koruyun</p>
                  </div>
                  <label className="switch relative inline-block w-12 h-6">
                    <input 
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span className={`slider absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${darkMode ? 'bg-cyan-500' : 'bg-gray-300'}`}>
                      <span className={`absolute w-4 h-4 bg-white rounded-full transition-all duration-300 ${darkMode ? 'left-6' : 'left-1'}`} style={{ top: '4px' }}></span>
                    </span>
                  </label>
                </div>
                
                <div>
                  <label htmlFor="language" className="block mb-1 font-medium">Dil</label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleSavePreferences}
                  className="btn-primary"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          )}
          
          {/* Bildirimler */}
          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Bildirim Ayarları</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">E-posta Bildirimleri</h3>
                    <p className="text-sm text-gray-500">Önemli bildirimleri e-posta adresinize alın</p>
                  </div>
                  <label className="switch relative inline-block w-12 h-6">
                    <input 
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span className={`slider absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${emailNotifications ? 'bg-cyan-500' : 'bg-gray-300'}`}>
                      <span className={`absolute w-4 h-4 bg-white rounded-full transition-all duration-300 ${emailNotifications ? 'left-6' : 'left-1'}`} style={{ top: '4px' }}></span>
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 rounded-md">
                <p className="text-sm">Not: Bildirim ayarları şu anda test aşamasındadır ve tam olarak etkin değildir.</p>
              </div>
            </div>
          )}
          
          {/* Gizlilik */}
          {activeTab === 'privacy' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Gizlilik Ayarları</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Veri Dışa Aktarma ve Hesap Silme</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    NoteFav üzerinde sakladığınız tüm verilerinizi indirebilir veya hesabınızı silebilirsiniz.
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm">
                      Verilerimi İndir
                    </button>
                    <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded-md text-sm">
                      Hesabımı Sil
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Şifre Değiştirme</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirmenizi öneririz.
                  </p>
                  <button className="px-4 py-2 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 dark:bg-cyan-900/30 dark:hover:bg-cyan-900/50 dark:text-cyan-300 rounded-md text-sm">
                    Şifremi Değiştir
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 rounded-md">
                  <p className="text-sm">Not: Gizlilik ayarları şu anda test aşamasındadır ve tam olarak etkin değildir.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><p>Yükleniyor...</p></div>}>
      <SettingsContent />
    </Suspense>
  );
} 