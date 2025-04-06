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
  const [emailInput, setEmailInput] = useState('');
  const [inviting, setInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [memberToPromote, setMemberToPromote] = useState(null);
  const emailInputRef = useRef(null);
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isPromotingMember, setIsPromotingMember] = useState(false);

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
    
    if (!emailInput.trim()) return;
    
    try {
      setInviting(true);
      setError('');
      
      // E-posta formatını kontrol et
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput)) {
        setError('Geçerli bir e-posta adresi girin');
        setInviting(false);
        return;
      }
      
      // Kendisini eklemeyi önle
      if (emailInput.toLowerCase() === user.email.toLowerCase()) {
        setError('Kendinizi tekrar ekleyemezsiniz, zaten gruptasınız.');
        setInviting(false);
        return;
      }
      
      // Kullanıcının zaten grupta olup olmadığını kontrol et
      const isMemberExists = members.some(m => 
        m.profiles?.email?.toLowerCase() === emailInput.toLowerCase()
      );
      
      if (isMemberExists) {
        setError('Bu kullanıcı zaten grubun üyesi.');
        setInviting(false);
        return;
      }
      
      // E-posta ile kullanıcıyı bul
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, username')
        .eq('email', emailInput.trim())
        .single();
        
      if (userError) {
        console.error('Kullanıcı aranırken hata:', userError);
        setError('Kullanıcı bulunamadı. Bu e-postaya sahip bir kullanıcı sisteme kayıtlı olmalıdır.');
        setInviting(false);
        return;
      }
      
      // Üye ekle
      const { error: addError } = await supabase.from('group_members').insert({
        group_id: id,
        user_id: userData.id,
        role: 'member'
      });
      
      if (addError) throw addError;
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'add_member',
        entity_type: 'member',
        entity_id: userData.id,
        details: { member_email: emailInput }
      });
      
      // Sayfayı yenile
      router.refresh();
      
    } catch (error) {
      console.error('Üye eklenirken hata:', error);
      setError(`Üye eklenemedi: ${error.message}`);
    } finally {
      setInviting(false);
      setEmailInput('');
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
            <FaArrowLeft /> <span>Gruba Geri Dön</span>
          </Link>
          {myRole === 'leader' && (
            <Link 
              href={`/groups/${id}/members/add`}
              className="btn-primary ml-auto flex items-center gap-2"
            >
              <FaUserPlus /> <span>Üye Ekle</span>
            </Link>
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-1">{group.name} Üyeleri</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Bu gruptaki tüm üyeler</p>
        
        <div className="space-y-4">
          {members.length === 0 ? (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              Bu grupta henüz üye bulunmamaktadır.
            </p>
          ) : (
            members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                    {member.profiles?.full_name ?
                      member.profiles.full_name.charAt(0).toUpperCase() :
                      (member.profiles?.username ?
                        member.profiles.username.charAt(0).toUpperCase() : '?')}
                  </div>
                  <div>
                    <div className="font-medium">{member.profiles?.full_name || member.profiles?.username || 'Bilinmeyen Kullanıcı'}</div>
                    <div className="text-sm text-gray-500">{member.profiles?.username || `ID: ${member.user_id.substring(0, 8)}...`}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    member.role === 'leader' 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                  }`}>
                    {member.role === 'leader' ? 'Lider' : 'Üye'}
                  </span>
                  
                  {myRole === 'leader' && member.user_id !== user.id && (
                    <>
                      <button
                        onClick={() => handlePromoteToLeader(member.id, member.user_id)}
                        disabled={isPromotingMember}
                        className="text-yellow-500 hover:text-yellow-700 disabled:opacity-50 flex items-center gap-1"
                        title="Lider Yap"
                      >
                        <FaCrown />
                        <span className="sm:inline text-xs">Lider Yap</span>
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.user_id)}
                        disabled={isRemovingMember}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1"
                        title="Gruptan Çıkar"
                      >
                        <FaUserTimes />
                        <span className="sm:inline text-xs">Çıkar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
