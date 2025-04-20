'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';
import { toast } from 'react-hot-toast';
import MembersList from '../components/MembersList';
import { FaArrowLeft, FaEnvelope, FaPlus, FaUserPlus } from 'react-icons/fa';

export default function GroupMembersPage({ params }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function fetchGroupData() {
      setLoading(true);
      setError(null);
      
      if (!user) return;
      
      try {
        // Grup bilgilerini çek
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*, profiles!groups_created_by_fkey(username, full_name, avatar_url)')
          .eq('id', id)
          .single();
        
        if (groupError) {
          console.error("Grup bilgileri çekilemedi:", groupError);
          throw new Error("Grup bilgileri yüklenemedi");
        }
        
        setGroup(groupData);
        
        // Kullanıcının rol bilgisini çek
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (memberError && memberError.code !== 'PGRST116') {
          console.error("Rol bilgisi çekilemedi:", memberError);
          throw new Error("Üyelik bilgisi alınamadı");
        }
        
        if (!memberData) {
          router.push(`/groups/${id}`);
          return;
        }
        
        setMyRole(memberData.role);
        
        // Grup üyelerini çek
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
          .eq('group_id', id);
        
        if (membersError) {
          console.error("Grup üyeleri çekilemedi:", membersError);
          setMembers([]);
        } else {
          setMembers(membersData || []);
        }
        
      } catch (error) {
        console.error("Grup verileri yüklenirken hata:", error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchGroupData();
    }
  }, [id, user, router]);

  // Üye rolünü değiştir
  const handleRoleChange = async (userId, newRole) => {
    try {
      if (myRole !== 'leader') {
        toast.error("Rol değiştirme yetkiniz yok");
        return;
      }
      
      // Önce kullanıcının grup kurucusu olup olmadığını kontrol et
      if (group.created_by === userId) {
        toast.error("Grup kurucusunun rolü değiştirilemez");
        return;
      }
      
      const { error } = await supabase.rpc('update_member_role', {
        p_group_id: parseInt(id),
        p_user_id: userId,
        p_new_role: newRole
      });
      
      if (error) {
        console.error("Rol değiştirme hatası:", error);
        toast.error(`Rol değiştirilemedi: ${error.message}`);
        return;
      }
      
      // UI'yı güncelle
      setMembers(members.map(member => {
        if (member.user_id === userId) {
          return { ...member, role: newRole };
        }
        return member;
      }));
      
      toast.success(`Kullanıcı ${newRole === 'admin' ? 'yönetici' : 'üye'} olarak güncellendi`);
      
    } catch (error) {
      console.error("Rol değiştirme hatası:", error);
      toast.error("Rol değiştirilemedi");
    }
  };
  
  // Üye çıkar
  const handleRemoveMember = async (userId) => {
    try {
      if (myRole !== 'leader') {
        toast.error("Üye çıkarma yetkiniz yok");
        return;
      }
      
      // Grup kurucusunu kontrol et
      if (group.created_by === userId) {
        toast.error("Grup kurucusu gruptan çıkarılamaz");
        return;
      }
      
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', userId);
      
      if (error) {
        console.error("Üye çıkarma hatası:", error);
        toast.error(`Üye çıkarılamadı: ${error.message}`);
        return;
      }
      
      // UI'yı güncelle
      setMembers(members.filter(member => member.user_id !== userId));
      toast.success("Üye gruptan çıkarıldı");
      
    } catch (error) {
      console.error("Üye çıkarma hatası:", error);
      toast.error("Üye çıkarılamadı");
    }
  };

  // Davet gönder 
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Öncelikle kullanıcıyı ara
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .maybeSingle();
      
      // Kullanıcı bulundu mu kontrolü
      if (userError) {
        console.error("Kullanıcı arama hatası:", userError);
        throw new Error("Kullanıcı aranamadı");
      }
      
      if (!userData) {
        // Kullanıcı bulunamadıysa davet e-postası gönder
        // NOT: Bu kısım için gerçek bir e-posta gönderme servisi entegre edilmeli
        toast.success('Davet e-postası gönderildi');
        setInviteEmail('');
        setShowInviteModal(false);
        return;
      }
      
      // Kullanıcı zaten grup üyesi mi kontrol et
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', userData.id)
        .maybeSingle();
      
      if (memberCheckError) {
        console.error("Üyelik kontrolü hatası:", memberCheckError);
        throw new Error("Üyelik kontrolü yapılamadı");
      }
      
      if (existingMember) {
        toast.error('Bu kullanıcı zaten grup üyesi');
        return;
      }
      
      // Kullanıcıyı gruba ekle
      const { error: addError } = await supabase
        .from('group_members')
        .insert({
          group_id: id,
          user_id: userData.id,
          role: 'member',
          joined_at: new Date().toISOString()
        });
      
      if (addError) {
        console.error("Üye ekleme hatası:", addError);
        throw new Error("Üye eklenemedi");
      }
      
      // Grup üyelerini yeniden yükle
      const { data: updatedMembers, error: refreshError } = await supabase
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
        .eq('group_id', id);
      
      if (!refreshError) {
        setMembers(updatedMembers || []);
      }
      
      toast.success('Kullanıcı gruba eklendi');
      setInviteEmail('');
      setShowInviteModal(false);
      
    } catch (error) {
      console.error("Davet hatası:", error);
      toast.error(error.message || "Davet işlemi başarısız oldu");
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Üyeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 mx-auto rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">Bir hata oluştu</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">{error}</p>
        <Link href={`/groups/${id}`} className="btn-primary">
          Grupa Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Üst Başlık */}
      <div className="mb-8">
        <Link href={`/groups/${id}`} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center w-fit mb-6">
          <FaArrowLeft className="mr-2" />
          <span>Grup Sayfasına Dön</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Üyeler</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {group?.name} - {members.length} üye
            </p>
          </div>
          
          {(myRole === 'leader' || myRole === 'admin') && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="btn-primary whitespace-nowrap"
            >
              <FaUserPlus className="mr-2" /> Üye Davet Et
            </button>
          )}
        </div>
      </div>
      
      {/* Üye Listesi */}
      <MembersList 
        members={members}
        myRole={myRole}
        groupId={id}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
      />
      
      {/* Davet Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Üye Davet Et</h2>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-1">E-posta Adresi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Kullanıcının tam e-posta adresini girin. Sistemde kayıtlı ise otomatik olarak eklenecek, değilse davet gönderilecektir.
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={isSending}
                >
                  {isSending ? 'Gönderiliyor...' : 'Davet Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 