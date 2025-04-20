'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';
import { FaArrowLeft, FaUserPlus, FaUserTimes, FaCrown, FaExclamationTriangle, FaUser, FaUserCog, FaEnvelope, FaUsers } from 'react-icons/fa';

export default function GroupMembers() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [inviting, setInviting] = useState(false);
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isPromotingMember, setIsPromotingMember] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Grup ve üyeleri getiren fonksiyon
  const fetchGroupAndMembers = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Grup bilgilerini al
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
      
      // Kullanıcının rolünü kontrol et
      const { data: memberRoleData, error: memberRoleError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .single();
        
      if (memberRoleError && memberRoleError.code !== 'PGRST116') {
        console.error("Kullanıcı rolü çekilemedi:", memberRoleError);
        throw new Error("Kullanıcı rolü kontrol edilemedi");
      }
      
      if (!memberRoleData) {
        // Kullanıcı bu grupta üye değil, gruplar sayfasına yönlendir
        router.push('/groups');
        return;
      }
      
      setMyRole(memberRoleData.role);
      
      // Tüm grup üyelerini getir
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('group_id', id)
        .order('role', { ascending: false });
        
      if (membersError) {
        console.error("Grup üyeleri çekilemedi:", membersError);
        throw new Error("Grup üyeleri yüklenemedi");
      }
      
      setMembers(membersData || []);
      
    } catch (error) {
      console.error('Grup üyeleri yüklenirken hata:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde grup ve üye bilgilerini getir
  useEffect(() => {
    fetchGroupAndMembers();
  }, [id, user, router]);

  const handleInviteMember = async (e) => {
    e.preventDefault();
    
    if (!searchInput.trim()) return;
    
    try {
      setInviting(true);
      setError('');
      
      const searchTerm = searchInput.trim();
      
      console.log(`Hızlı üye ekleme: E-posta ile arama yapılıyor:`, searchTerm);
      
      // Email formatını kontrol et
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(searchTerm)) {
        setError('Lütfen geçerli bir e-posta adresi girin.');
        setInviting(false);
        return;
      }
      
      // Kendisini eklemeyi önle
      if (user.email && searchTerm.toLowerCase() === user.email.toLowerCase()) {
        setError('Kendinizi tekrar ekleyemezsiniz, zaten gruptasınız.');
        setInviting(false);
        return;
      }
      
      // Kullanıcının zaten grupta olup olmadığını kontrol et
      const isMemberExists = members.some(m => 
        m.profiles?.email?.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (isMemberExists) {
        setError('Bu kullanıcı zaten grubun üyesi.');
        setInviting(false);
        return;
      }
      
      let foundUserData = null;
      
      // Alternatif olarak profiles tablosunda email arama
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('email', searchTerm)
        .limit(1);
        
      if (profilesError) {
        console.error('Profil tablosunda e-posta aramasında hata:', profilesError);
        setError(`Kullanıcı aranırken bir hata oluştu.`);
        setInviting(false);
        return;
      }
      
      if (profilesData && profilesData.length > 0) {
        foundUserData = profilesData[0];
        console.log('E-posta eşleşmesi bulundu (profiles):', foundUserData);
      } else {
        setError(`"${searchTerm}" e-posta adresine sahip bir kullanıcı bulunamadı.`);
        setInviting(false);
        return;
      }
      
      if (foundUserData) {
        await addMemberToGroup(foundUserData);
      } else {
        setError(`Kullanıcı bulunamadı. Lütfen geçerli bir e-posta adresi girdiğinizden emin olun.`);
      }
      
    } catch (error) {
      console.error('Üye eklenirken hata:', error);
      setError(`Üye eklenemedi: ${error.message}`);
    } finally {
      setInviting(false);
      setSearchInput('');
    }
  };
  
  // Üye ekleme fonksiyonu
  const addMemberToGroup = async (userData) => {
    try {
      // Üye ekle
      const { error: addError } = await supabase.from('group_members').insert({
        group_id: id,
        user_id: userData.id,
        role: 'member'
      });
      
      if (addError) {
        console.error('Üye eklenirken hata:', addError);
        if (addError.code === '23505') { // unique_violation kodu
          setError(`${userData.username} zaten grup üyesidir. Eklenemez.`);
        } else {
          setError(`Üye eklenirken bir hata oluştu: ${addError.message}`);
        }
        return;
      }
      
      console.log('Üye başarıyla eklendi, grup aktivitesi kaydediliyor');
      
      // Grup aktivitesini kaydet
      const { error: activityError } = await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'add_member',
        entity_type: 'member',
        entity_id: userData.id,
        details: { member_username: userData.username }
      });
      
      if (activityError) {
        console.warn('Grup aktivitesi kaydedilemedi (işleme devam ediliyor):', activityError);
      }
      
      // Başarı mesajı göster
      alert(`${userData.username} başarıyla gruba eklendi!`);
      
      // Üyeleri yeniden getir
      await fetchGroupAndMembers();
      
    } catch (error) {
      console.error('addMemberToGroup fonksiyonunda hata:', error);
      throw error;
    }
  };

  const handleRemoveMember = async (memberId, userId) => {
    if (!confirm('Bu üyeyi gruptan çıkarmak istediğinize emin misiniz?')) {
      return;
    }
    
    setIsRemovingMember(true);
    
    try {
      // Üyeyi gruptan çıkar
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);
        
      if (error) {
        throw error;
      }
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'member_removed',
        entity_type: 'user',
        entity_id: userId
      });
      
      // Üyeler listesini güncelle
      setMembers(members.filter(m => m.id !== memberId));
      
    } catch (error) {
      console.error('Üye çıkarılırken hata:', error);
      alert('Üye çıkarılırken bir hata oluştu.');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handlePromoteToLeader = async (memberId, userId) => {
    if (!confirm('Bu üyeyi lider yapmak istediğinize emin misiniz? Bu işlem sonucunda sizin rolünüz üye olarak değişecektir.')) {
      return;
    }
    
    setIsPromotingMember(true);
    
    try {
      // Supabase transaction kullanarak iki işlemi birden yap
      const { error } = await supabase.rpc('promote_to_leader', {
        p_group_id: id,
        p_current_leader_id: user.id,
        p_new_leader_id: userId
      });
      
      if (error) {
        throw error;
      }
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'leader_changed',
        entity_type: 'user',
        entity_id: userId
      });
      
      alert('Liderlik başarıyla devredildi.');
      
      // Üyeleri yeniden getir
      await fetchGroupAndMembers();
      
    } catch (error) {
      console.error('Lider değiştirme işlemi sırasında hata:', error);
      alert('Lider değiştirme işlemi sırasında bir hata oluştu.');
    } finally {
      setIsPromotingMember(false);
    }
  };

  // Rol değiştirme fonksiyonu - sadece lider veya üye
  const handleRoleChange = async (memberId, userId, newRole) => {
    if (!confirm(`Bu kullanıcının rolünü "${newRole}" olarak değiştirmek istediğinize emin misiniz?`)) {
      return;
    }
    
    setUpdating(true);
    try {
      // Supabase RPC kullanarak rol değişikliği yap
      const { error } = await supabase.rpc('change_member_role', {
        p_group_id: id,
        p_user_id: userId,
        p_new_role: newRole
      });
        
      if (error) throw error;
      
      // Başarılı güncellemeden sonra üyeleri yenile
      await fetchGroupAndMembers();
      
      // Grup aktivitesi ekle
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'update_role',
        entity_type: 'member',
        entity_id: userId,
        details: { new_role: newRole },
        created_at: new Date().toISOString()
      });
      
      alert('Üye rolü başarıyla güncellendi.');
      
    } catch (error) {
      console.error('Rol değiştirme hatası:', error);
      setError('Rol değiştirilemedi: ' + error.message);
      alert('Rol değiştirme işlemi sırasında bir hata oluştu.');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded-full w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-8 text-center">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link 
              href="/groups"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Gruplar Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!group) return null;
  
  // Liderleri ve üyeleri ayır
  const leaders = members.filter(m => m.role === 'leader');
  const regularMembers = members.filter(m => m.role === 'member');
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              href={`/groups/${id}`}
              className="mr-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
            >
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-xl text-white font-bold flex items-center gap-2">
                <FaUsers className="text-blue-100" />
                <span>{group.name} Üyeleri</span>
              </h1>
              <p className="text-blue-100 text-sm">Toplam {members.length} üye</p>
            </div>
          </div>
          
          {myRole === 'leader' && (
            <div className="hidden sm:block">
              <button
                onClick={() => document.getElementById('invite-form').scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-all"
              >
                <FaUserPlus /> <span>Üye Ekle</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6">
          {/* Liderler Bölümü */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <FaCrown className="text-yellow-500" /> 
              <span>Grup Liderleri</span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {leaders.map(member => (
                <div key={member.id} className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 rounded-lg p-4 border border-yellow-100 dark:border-yellow-900/20 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="mr-3 relative">
                      {member.profiles?.avatar_url ? (
                        <img 
                          src={member.profiles.avatar_url} 
                          alt={member.profiles.username || 'Kullanıcı'} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-yellow-300 dark:border-yellow-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-amber-300 dark:from-yellow-600 dark:to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                          {(member.profiles?.username || 'K')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 bg-yellow-400 dark:bg-yellow-600 rounded-full p-0.5 shadow-md">
                        <FaCrown className="text-white text-xs" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {member.profiles?.full_name || member.profiles?.username || 'Kullanıcı'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{member.profiles?.username || 'kullanici'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    {member.user_id === user.id ? (
                      <div className="text-center py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                        Bu sizsiniz - Grup Lideri
                      </div>
                    ) : myRole === 'leader' && (
                      <button
                        onClick={() => handleRoleChange(member.id, member.user_id, 'member')}
                        className="w-full py-1.5 text-sm text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                        disabled={updating}
                      >
                        <FaUserCog className="text-gray-500" />
                        <span>Üye Yap</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Üyeler Bölümü */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <FaUser className="text-blue-500" /> 
              <span>Grup Üyeleri</span>
            </h2>
            
            {regularMembers.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <FaUsers className="mx-auto text-4xl text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Bu grupta henüz üye bulunmamaktadır.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {regularMembers.map(member => (
                  <div key={member.id} className="bg-white dark:bg-gray-800/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center mb-3">
                      <div className="mr-3 relative">
                        {member.profiles?.avatar_url ? (
                          <img 
                            src={member.profiles.avatar_url} 
                            alt={member.profiles.username || 'Kullanıcı'} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 dark:border-blue-900"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 dark:from-blue-600 dark:to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                            {(member.profiles?.username || 'K')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 bg-blue-400 dark:bg-blue-600 rounded-full p-0.5 shadow-md">
                          <FaUser className="text-white text-xs" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {member.profiles?.full_name || member.profiles?.username || 'Kullanıcı'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{member.profiles?.username || 'kullanici'}
                        </p>
                      </div>
                    </div>
                    
                    {member.user_id === user.id ? (
                      <div className="text-center py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                        Bu sizsiniz
                      </div>
                    ) : myRole === 'leader' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleRoleChange(member.id, member.user_id, 'leader')}
                          className="flex-1 py-1.5 text-sm text-center border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors flex items-center justify-center gap-1"
                          disabled={updating}
                        >
                          <FaCrown className="text-yellow-500" />
                          <span>Lider Yap</span>
                        </button>
                        
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user_id)}
                          className="px-3 py-1.5 text-sm text-center bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors flex items-center justify-center gap-1"
                          disabled={isRemovingMember}
                        >
                          <FaUserTimes />
                          <span>Çıkar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Hızlı Üye Ekleme Formu */}
          {myRole === 'leader' && (
            <div id="invite-form" className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/30">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <FaUserPlus className="text-blue-500" /> 
                <span>Yeni Üye Ekle</span>
              </h2>
              
              <form onSubmit={handleInviteMember} className="flex flex-col">
                <div className="flex flex-col sm:flex-row mb-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="E-posta adresi..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full pl-10 px-4 py-3 rounded-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white mb-2 sm:mb-0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg sm:rounded-l-none hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md"
                    disabled={inviting || !searchInput.trim()}
                  >
                    <FaUserPlus className="inline" /> 
                    <span>{inviting ? 'Ekleniyor...' : 'Üye Ekle'}</span>
                  </button>
                </div>
                
                {error && (
                  <div className="mt-2 p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                    {error}
                  </div>
                )}
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  Kullanıcının tam e-posta adresini girin. Sadece sistemde kayıtlı kullanıcılar eklenebilir.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
