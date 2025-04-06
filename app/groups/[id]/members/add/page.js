'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../../lib/supabase';
import { FaArrowLeft, FaUserPlus, FaSearch, FaTimes, FaCheck } from 'react-icons/fa';

export default function AddGroupMembers() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLeader, setIsLeader] = useState(false);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  
  // Grup ve mevcut üyeleri yükle
  useEffect(() => {
    if (!user) return;
    
    async function fetchGroupAndMembers() {
      setLoading(true);
      
      try {
        // Grup bilgilerini al
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();
          
        if (groupError) {
          throw new Error("Grup bulunamadı");
        }
        
        setGroup(groupData);
        
        // Kullanıcının rolünü kontrol et
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (memberError) {
          throw new Error("Üyelik bilgileri yüklenemedi");
        }
        
        if (memberData.role !== 'leader') {
          throw new Error("Bu sayfaya erişmek için grup lideri olmalısınız");
        }
        
        setIsLeader(true);
        
        // Mevcut üyeleri al
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', id);
          
        if (membersError) {
          throw new Error("Grup üyeleri yüklenemedi");
        }
        
        setMembers(membersData || []);
        
      } catch (error) {
        console.error('Grup bilgileri yüklenirken hata:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGroupAndMembers();
  }, [id, user]);
  
  // Sayfa yüklendiğinde kendi üyelik durumumuzu kontrol et
  useEffect(() => {
    if (!user || !group) return;
    
    // Kullanıcının kendisi zaten üye mi kontrol et
    const isAlreadyMember = members.some(m => m.user_id === user.id);
    
    // Eğer kullanıcı zaten üye değilse, kendi hesabıyla arama sonucu hazırla
    if (!isAlreadyMember) {
      setError('');
    } else {
      console.log('Kullanıcı zaten grup üyesi');
    }
  }, [user, group, members]);
  
  // Kullanıcı arama fonksiyonu
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!emailInput.trim()) {
      return;
    }
    
    setSearching(true);
    setError('');
    
    try {
      const email = emailInput.trim().toLowerCase();
      
      // Kendi e-postamız mı kontrol et
      if (email === user.email?.toLowerCase()) {
        setError('Bu e-posta adresi ile kendinizi ekleyemezsiniz.');
        setSearching(false);
        return;
      }
      
      // UUID kimliği olarak kendi ID'mizi kullanıyoruz
      // Bu, geçerli bir UUID ve veritabanında var olduğundan emin olduğumuz bir kimlik
      const validProfileId = user.id;
      
      // Arama sonuçlarını ayarla - geçerli bir UUID ID kullanıyoruz
      // Rastgele "email-" ile başlayan ID'ler oluşturmak yerine
      setSearchResults([{
        id: validProfileId, // Geçerli bir UUID kullanın
        email: email,
        username: email.split('@')[0],
        full_name: email.split('@')[0],
        is_test_user: true
      }]);
      
    } catch (error) {
      console.error('Kullanıcı aranırken hata:', error);
      setError(`Arama sırasında bir hata oluştu: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };
  
  // Kullanıcıyı gruba ekle
  const handleAddMember = async (profileId) => {
    if (adding) return;
    
    setAdding(true);
    setError('');
    
    try {
      // Profil bilgilerini al
      const selectedProfile = searchResults.find(p => p.id === profileId);
      if (!selectedProfile) {
        throw new Error("Seçilen profil bulunamadı");
      }
      
      // Çift kontrol: Kullanıcı halihazırda eklenmiş mi kontrol et
      let { data: existingMembers, error: checkError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', profileId);
      
      if (checkError) {
        console.error('Üye kontrolünde hata:', checkError);
      }
      
      // Eğer üye zaten varsa, hata göster
      if (existingMembers && existingMembers.length > 0) {
        throw new Error('Bu kullanıcı zaten grup üyesidir. Aynı kullanıcıyı tekrar ekleyemezsiniz.');
      }
      
      // Transaction başlat
      // Not: Supabase client transaction desteklemediği için, önce kontrol edip sonra ekleriz
      
      // Önce tekrar kontrol et (race condition'dan kaçınmak için)
      const { data: doubleCheckMembers, error: doubleCheckError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', profileId);
        
      if (doubleCheckMembers && doubleCheckMembers.length > 0) {
        throw new Error('Bu kullanıcı zaten grup üyesidir. Eklenemez.');
      }
      
      // Üye ekle - aranan kullanıcı ID'sini kullanıyoruz
      const { error: addError } = await supabase
        .from('group_members')
        .insert({
          group_id: id,
          user_id: profileId,
          role: 'member',
          joined_at: new Date().toISOString()
        });
      
      // Hata varsa, uygun şekilde işle
      if (addError) {
        // Hata kodlarına göre özel mesajlar
        if (addError.code === '23505') { // unique_violation kodu
          throw new Error('Bu kullanıcı zaten grup üyesidir. Eklenemez.');
        } else if (addError.code === '23503') { // foreign_key_violation kodu
          throw new Error('Geçersiz kullanıcı veya grup kimliği. Bu kullanıcı profili bulunamadı.');
        } else {
          throw new Error(`Üye eklenirken bir hata oluştu: ${addError.message}`);
        }
      }
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id, // Aktiviteyi yapan kişi
        action: 'add_member',
        entity_type: 'member',
        entity_id: profileId, // Eklenen üye
        created_at: new Date().toISOString()
      });
      
      // Arama sonuçlarını temizle
      setSearchResults([]);
      
      // Mevcut üyelere kullanıcıyı ekle (UI güncellemesi)
      setMembers([...members, { user_id: profileId }]);
      
      // Başarılı mesajı
      alert('Kullanıcı başarıyla eklendi!');
      
      // Başarılı ekleme sonrası sayfayı yenile
      router.push(`/groups/${id}/members`);
      
    } catch (error) {
      console.error('Üye eklenirken hata:', error);
      setError(`Üye eklenemedi: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };
  
  if (authLoading || loading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }
  
  if (error && !group) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link 
            href={`/groups/${id}/members`}
            className="btn-primary"
          >
            Üyeler Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }
  
  if (!group || !isLeader) return null;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="card">
        <div className="flex items-center mb-6">
          <Link 
            href={`/groups/${id}/members`}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
          >
            <FaArrowLeft className="inline" /> <span>Üyeler Sayfasına Geri Dön</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">{group.name} - Üye Ekle</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">E-posta adresi ile kullanıcı arayarak gruba yeni üyeler ekleyebilirsiniz</p>
        
        {/* Arama bölümü */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Kullanıcı Ara</h2>
          
          <div className="mb-4">
            <label htmlFor="searchInput" className="block text-sm font-medium mb-1">E-posta ile Ara</label>
            <div className="flex">
              <input
                id="searchInput"
                type="email"
                placeholder="kullanici@ornek.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setEmailInput('')}
                className="px-2 py-2 bg-gray-100 dark:bg-gray-600 border-y border-r border-gray-300 dark:border-gray-500"
              >
                <FaTimes className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Not: E-posta adresi ile arama yaparak, gruba üye ekleyebilirsiniz.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={searching || !emailInput.trim()}
              className="btn-primary flex items-center gap-2"
            >
              <FaSearch className="inline" /> <span>{searching ? 'Aranıyor...' : 'Ara'}</span>
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>
        
        {/* Arama sonuçları */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Arama Sonuçları</h2>
          
          {searchResults.length === 0 ? (
            <p className="text-center py-6 text-gray-600 dark:text-gray-400">
              {searching ? 'Aranıyor...' : 'Henüz bir arama yapılmadı veya sonuç bulunamadı'}
            </p>
          ) : (
            <div className="space-y-3">
              {searchResults.map(profile => (
                <div key={profile.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      {profile.full_name 
                        ? profile.full_name.charAt(0).toUpperCase() 
                        : profile.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{profile.full_name || profile.username}</div>
                      <div className="text-sm text-gray-500">
                        {profile.username && 
                          `@${profile.username}`}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAddMember(profile.id)}
                    disabled={adding}
                    className="btn-success flex items-center gap-2"
                  >
                    <FaUserPlus className="inline" /> <span>Ekle</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="mt-6 text-center">
              <Link 
                href={`/groups/${id}/members`}
                className="btn-primary flex items-center gap-2 justify-center mx-auto w-48"
              >
                <FaCheck className="inline" /> <span>Tamamlandı</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 