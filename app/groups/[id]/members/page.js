'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';
import { FaArrowLeft, FaUserPlus, FaUserTimes, FaCrown, FaExclamationTriangle } from 'react-icons/fa';

export default function GroupMembers() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [inviting, setInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [memberToPromote, setMemberToPromote] = useState(null);
  const searchInputRef = useRef(null);
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isPromotingMember, setIsPromotingMember] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchGroupAndMembers() {
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
              avatar_url
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
    }
    
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
      
      // E-posta araması
      // E-posta adresine göre kullanıcı ara - DÜZELTME: email alanı doğrudan erişilemiyor
      const { data: emailData, error: emailError } = await supabase
        .from('auth')
        .select('id, email')
        .eq('email', searchTerm)
        .limit(1);
        
      if (emailError) {
        console.error('E-posta aramasında hata:', emailError);
        
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
      } else if (emailData && emailData.length > 0) {
        // Auth tablosundan kullanıcı bulundu, profil bilgisini al
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', emailData[0].id)
          .single();
          
        if (userError) {
          console.error('Kullanıcı profili alınamadı:', userError);
          setError(`Kullanıcı profili alınamadı.`);
          setInviting(false);
          return;
        }
        
        foundUserData = userData;
        console.log('E-posta eşleşmesi bulundu (auth):', foundUserData);
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
      
      // Sayfayı yenile
      router.refresh();
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
      
      // Sayfa içeriğini yenile
      router.refresh();
      
    } catch (error) {
      console.error('Lider değiştirme işlemi sırasında hata:', error);
      alert('Lider değiştirme işlemi sırasında bir hata oluştu.');
    } finally {
      setIsPromotingMember(false);
    }
  };

  // Rol değiştirme fonksiyonu
  const handleRoleChange = async (memberId, userId, newRole) => {
    if (!confirm(`Bu kullanıcının rolünü "${newRole}" olarak değiştirmek istediğinize emin misiniz?`)) {
      return;
    }
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Başarılı güncellemeden sonra üyeleri yenile
      fetchGroupAndMembers();
      
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
      
    } catch (error) {
      console.error('Rol değiştirme hatası:', error);
      setError('Rol değiştirilemedi');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="card text-center p-12">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
            
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="card text-center py-12">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link 
            href="/groups"
            className="btn-primary"
          >
            Gruplar Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }
  
  if (!group) return null;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="card">
        <div className="flex items-center mb-6">
          <Link 
            href={`/groups/${id}`}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-4"
          >
            <FaArrowLeft className="inline" /> <span>Gruba Geri Dön</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-1">{group.name} Üyeleri</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Bu gruptaki tüm üyeler</p>
        
        {myRole === 'leader' && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h2 className="text-md font-semibold mb-3">Hızlı Üye Ekle</h2>
            
            <form onSubmit={handleInviteMember} className="flex flex-col">
              <div className="flex flex-col sm:flex-row mb-2">
                <input
                  type="email"
                  placeholder="E-posta adresi..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md sm:rounded-r-none sm:rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-2 sm:mb-0"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md sm:rounded-l-none sm:rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  disabled={inviting || !searchInput.trim()}
                >
                  <FaUserPlus className="inline" /> <span>{inviting ? 'Ekleniyor...' : 'Ekle'}</span>
                </button>
              </div>
              
              {error && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Kullanıcının tam e-posta adresini girin. Sadece sistemde kayıtlı kullanıcılar eklenebilir.
              </p>
            </form>
          </div>
        )}
        
        <div className="space-y-4">
          {members.length === 0 ? (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              Bu grupta henüz üye bulunmamaktadır.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map(member => (
                <li key={member.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      {member.profiles?.avatar_url ? (
                        <img 
                          src={member.profiles.avatar_url} 
                          alt={member.profiles.username || 'Kullanıcı'} 
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-500 dark:text-gray-400">
                            {(member.profiles?.username || 'K')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">
                        {member.profiles?.full_name || member.profiles?.username || 'Kullanıcı'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{member.profiles?.username || 'kullanici'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.role === 'leader' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' 
                        : member.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                    }`}>
                      {member.role === 'leader' ? 'Lider' : member.role === 'admin' ? 'Admin' : 'Üye'}
                    </span>
                    
                    {/* Grup lideri, diğer üyelerin rollerini değiştirebilir */}
                    {myRole === 'leader' && member.user_id !== user.id && (
                      <div className="dropdown">
                        <button className="btn-outline btn-sm">
                          Rol Değiştir
                        </button>
                        <div className="dropdown-content">
                          {member.role !== 'leader' && (
                            <button
                              onClick={() => handleRoleChange(member.id, member.user_id, 'leader')}
                              className="dropdown-item"
                            >
                              Lider Yap
                            </button>
                          )}
                          {member.role !== 'admin' && (
                            <button
                              onClick={() => handleRoleChange(member.id, member.user_id, 'admin')}
                              className="dropdown-item"
                            >
                              Admin Yap
                            </button>
                          )}
                          {member.role !== 'member' && (
                            <button
                              onClick={() => handleRoleChange(member.id, member.user_id, 'member')}
                              className="dropdown-item"
                            >
                              Üye Yap
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Grup lideri, diğer üyeleri gruptan çıkarabilir */}
                    {myRole === 'leader' && member.user_id !== user.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.user_id)}
                        className="btn-error btn-sm"
                        disabled={updating}
                      >
                        Çıkar
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
