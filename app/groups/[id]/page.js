'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';
import { FaPlus, FaUserPlus, FaUsers, FaChartLine, FaListAlt, FaCrown, FaUserShield, FaUser, FaCalendar, FaClock, FaEdit, FaTrash, FaArrowLeft, FaShare } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Bileşenler
import GroupHeader from './components/GroupHeader';
import GroupTabs from './components/GroupTabs';
import GroupOverview from './components/GroupOverview';
import MembersList from './components/MembersList';
import InviteModal from './components/InviteModal';

export default function GroupPage({ params }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [myRole, setMyRole] = useState(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Tab kontrolü - URL'e göre belirle
  const getActiveTabFromPath = useCallback(() => {
    if (pathname.includes('/notes')) return 'notes';
    if (pathname.includes('/goals')) return 'goals';
    if (pathname.includes('/members')) return 'members';
    return 'overview';
  }, [pathname]);
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  
  // Path değiştikçe aktif sekmeyi güncelle
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [pathname, getActiveTabFromPath]);

  useEffect(() => {
    async function fetchGroupData() {
      setLoading(true);
      setError(null);
      
      if (!user) return;
      
      try {
        // İlk olarak profil kontrolü
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
        
        // Profil yoksa oluşturalım
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
            
          if (insertError) {
            console.error('Profil oluşturulurken hata:', insertError);
            throw new Error('Profil oluşturulamadı: ' + insertError.message);
          }
        } else if (profileError) {
          console.error('Profil kontrolünde hata:', profileError);
          throw new Error('Profil kontrol edilemedi: ' + profileError.message);
        }
        
        // Grup bilgilerini çek
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*, profiles!groups_created_by_fkey(username, full_name, avatar_url)')
          .eq('id', id)
          .single();
        
        if (groupError) {
          console.error("Grup bilgileri çekilemedi:", groupError);
          throw new Error("Grup bilgileri yüklenemedi: " + groupError.message);
        }
        
        if (!groupData) {
          throw new Error("Grup bulunamadı. Grup silinmiş veya erişim izniniz yok olabilir.");
        }
        
        setGroup(groupData);
        
        // Kullanıcının grup üyesi olup olmadığını kontrol et
        const { data: memberData, error: memberCheckError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
        
        if (memberCheckError && memberCheckError.code !== 'PGRST116') {
          console.error("Üyelik kontrolü yapılamadı:", memberCheckError);
          throw new Error("Üyelik bilgileri yüklenemedi: " + memberCheckError.message);
        }
        
        if (!memberData) {
          setIsMember(false);
          setLoading(false);
          return;
        }
        
        setIsMember(true);
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
        
        // Grup notlarını çek
        try {
          const { data: notesData, error: notesError } = await supabase
            .from('group_notes')
            .select(`
              id,
              title,
              content,
              creator_id,
              created_at,
              updated_at,
              profiles (
                username,
                full_name
              )
            `)
            .eq('group_id', id)
            .order('created_at', { ascending: false });
          
          if (notesError) {
            console.error("Grup notları çekilemedi:", notesError);
            setNotes([]);
          } else {
            setNotes(notesData || []);
          }
        } catch (notesError) {
          console.error("Grup notları işlenirken hata:", notesError);
          setNotes([]);
        }
        
        // Grup hedeflerini çek
        try {
          const { data: goalsData, error: goalsError } = await supabase
            .from('group_goals')
            .select(`
              id,
              title,
              description,
              status,
              progress,
              subtasks,
              due_date,
              created_at,
              updated_at,
              creator_id,
              profiles (
                username,
                full_name
              )
            `)
            .eq('group_id', id)
            .order('created_at', { ascending: false });
          
          if (goalsError) {
            console.error("Grup hedefleri çekilemedi:", goalsError);
            setGoals([]);
          } else {
            // subtasks alanını düzgün parse et
            const parsedGoals = goalsData?.map(goal => {
              if (goal.subtasks && typeof goal.subtasks === 'string') {
                try {
                  goal.subtasks = JSON.parse(goal.subtasks);
                } catch (e) {
                  console.error("Subtasks parse hatası:", e);
                  goal.subtasks = [];
                }
              } else if (!goal.subtasks) {
                goal.subtasks = [];
              }
              return goal;
            }) || [];
            
            setGoals(parsedGoals);
          }
        } catch (goalsError) {
          console.error("Grup hedefleri işlenirken hata:", goalsError);
          setGoals([]);
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
  }, [id, user]);

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

  // Grup silme işlemi
  const handleDeleteGroup = async () => {
    if (!confirm("Bu grubu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast.success("Grup başarıyla silindi");
      router.push('/groups');
      
    } catch (error) {
      console.error("Grup silinirken hata:", error);
      toast.error("Grup silinemedi: " + error.message);
      setIsDeleting(false);
    }
  };
  
  // Gruba katılma isteği
  const handleJoinGroup = async () => {
    if (!user) {
      toast.error("Gruba katılmak için giriş yapmalısınız");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: id,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString()
        });
        
      if (error) {
        throw error;
      }
      
      toast.success("Gruba başarıyla katıldınız");
      setIsMember(true);
      setMyRole('member');
      
      // Üye listesini güncelle
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', user.id)
        .single();
        
      const newMember = {
        user_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString(),
        profiles: profileData
      };
      
      setMembers([...members, newMember]);
      
    } catch (error) {
      console.error("Gruba katılma hatası:", error);
      toast.error("Gruba katılınamadı: " + error.message);
    }
  };
  
  // Gruptan ayrılma
  const handleLeaveGroup = async () => {
    if (!confirm("Bu gruptan ayrılmak istediğinize emin misiniz?")) {
      return;
    }
    
    try {
      // Grup kurucusu gruptan ayrılamaz
      if (group.created_by === user.id) {
        toast.error("Grup kurucusu olarak gruptan ayrılamazsınız. Önce başka bir üyeyi lider yapın.");
        return;
      }
      
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast.success("Gruptan başarıyla ayrıldınız");
      router.push('/groups');
      
    } catch (error) {
      console.error("Gruptan ayrılma hatası:", error);
      toast.error("Gruptan ayrılınamadı: " + error.message);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-200 dark:border-orange-800 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Grup Yükleniyor</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="flex flex-col items-center text-center bg-white dark:bg-slate-900 rounded-xl p-12 shadow-sm dark:shadow-none dark:border dark:border-slate-800">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 mx-auto rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Bir Hata Oluştu</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">{error}</p>
          <Link
            href="/groups"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <FaArrowLeft className="mr-2" /> Gruplar Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }

  if (!isMember && group) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto flex items-center justify-center mb-6">
              <FaUsers className="h-10 w-10 text-orange-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {group.description || "Bu grup için henüz bir açıklama eklenmemiş."}
            </p>
            
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Grup Kurucusu:</span>
                <span className="font-medium">{group.profiles?.full_name || group.profiles?.username || "Bilinmiyor"}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Oluşturulma Tarihi:</span>
                <span className="font-medium">{new Date(group.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-600 dark:text-gray-400">Üye Sayısı:</span>
                <span className="font-medium">{members.length} Üye</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
              <button
                onClick={handleJoinGroup}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center w-full sm:w-auto"
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                    Katılınıyor...
                  </>
                ) : (
                  <>
                    <FaUserPlus className="mr-2" /> Gruba Katıl
                  </>
                )}
              </button>
              
              <Link
                href="/groups"
                className="px-6 py-3 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-full sm:w-auto"
              >
                <FaArrowLeft className="mr-2" /> Geri Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Grup Başlığı */}
      <GroupHeader 
        group={group} 
        membersCount={members.length} 
        myRole={myRole}
        onInvite={() => setShowInviteModal(true)} 
      />
      
      {/* Sekmeler */}
      <GroupTabs 
        groupId={id} 
        activeTab="overview"
      />
      
      {/* İçerik */}
      <div>
        {activeTab === 'overview' && (
          <GroupOverview 
            groupId={id}
            notes={notes}
            goals={goals}
            membersCount={members.length}
            myRole={myRole}
            onAddNote={() => setShowAddNoteModal(true)}
            onAddGoal={() => setShowAddGoalModal(true)}
          />
        )}
        
        {activeTab === 'members' && (
          <MembersList 
            members={members}
            myRole={myRole}
            groupId={id}
            onRoleChange={handleRoleChange}
            onRemoveMember={handleRemoveMember}
          />
        )}
      </div>
      
      {/* Alt Eylemler */}
      <div className="mt-12 pt-6 border-t dark:border-slate-700">
        <div className="flex flex-wrap gap-4 justify-between">
          <div>
            {myRole === 'leader' && (
              <button
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="btn-danger"
              >
                {isDeleting ? 'Siliniyor...' : 'Grubu Sil'}
              </button>
            )}
          </div>
          
          {group?.created_by !== user?.id && (
            <button
              onClick={handleLeaveGroup}
              className="btn-secondary text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Gruptan Ayrıl
            </button>
          )}
        </div>
      </div>
      
      {/* Modaller */}
      {showInviteModal && (
        <InviteModal 
          groupId={id}
          onClose={() => setShowInviteModal(false)}
          onMembersUpdate={(updatedMembers) => setMembers(updatedMembers)}
        />
      )}
    </div>
  );
}