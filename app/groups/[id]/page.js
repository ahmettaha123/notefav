'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';
import { FaPlus, FaUserPlus } from 'react-icons/fa';

export default function GroupPage({ params }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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
          .select('*, profiles!groups_creator_id_fkey(username, full_name, avatar_url)')
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
            user_id,
            role,
            joined_at,
            profiles (
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
            .order('created_at', { ascending: false })
            .limit(5);
          
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
        
        // Grup aktivitelerini çek
        try {
          const { data: activityData, error: activityError } = await supabase
            .from('group_activity')
            .select(`
              id,
              user_id,
              action,
              entity_type,
              entity_id,
              details,
              created_at,
              profiles (
                username,
                full_name
              )
            `)
            .eq('group_id', id)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (activityError) {
            console.error("Grup aktiviteleri çekilemedi:", activityError);
            setActivity([]);
          } else {
            setActivity(activityData || []);
          }
        } catch (activityError) {
          console.error("Grup aktiviteleri işlenirken hata:", activityError);
          setActivity([]);
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
  }, [id, user, router, supabase]);

  const handleDeleteGroup = async () => {
    try {
      setIsDeleting(true);

      // Grubu sil
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      router.push('/groups');
    } catch (error) {
      console.error('Grup silinirken hata:', error);
      setError(`Grup silinemedi: ${error.message}`);
      setIsDeleting(false);
    }
  };

  // Aktivite açıklamalarını göstermek için yardımcı fonksiyon
  function renderActivityAction(activity) {
    switch (activity.action) {
      case 'join':
        return 'gruba katıldı';
      case 'leave':
        return 'gruptan ayrıldı';
      case 'add_member':
        return `${activity.details?.member_name || 'bir üye'} gruba ekledi`;
      case 'remove_member':
        return `${activity.details?.member_name || 'bir üyeyi'} gruptan çıkardı`;
      case 'share_note':
        return `"${activity.details?.note_title || 'bir not'}" paylaştı`;
      case 'create_goal':
        return `"${activity.details?.goal_title || 'bir hedef'}" oluşturdu`;
      case 'update_goal':
        return `"${activity.details?.goal_title || 'bir hedefi'}" güncelledi`;
      default:
        return 'bir işlem gerçekleştirdi';
    }
  }

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

  if (error) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Hata</h1>
        <p className="mb-6">{error}</p>
        <Link href="/groups" className="btn-primary">
          Geri Dön
        </Link>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link href="/groups" className="text-cyan-500 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tüm Gruplar
        </Link>

        <div className="flex gap-2">
          <Link 
            href={`/groups/edit/${id}`}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Düzenle</span>
          </Link>

          <button
            onClick={() => setIsDeleting(true)}
            className="px-3 py-1 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Sil</span>
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{group.description}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Oluşturma: {new Date(group.created_at).toLocaleDateString('tr-TR')}</p>
          <p>Son Güncelleme: {new Date(group.updated_at).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>

      {/* Gezinme Sekmeleri */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        <Link 
          href={`/groups/${id}`}
          className="px-4 py-2 border-b-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-medium"
        >
          Genel Bakış
        </Link>
        <Link 
          href={`/groups/${id}/members`}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
        >
          Üyeler
        </Link>
        <Link 
          href={`/groups/${id}/notes`}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
        >
          Notlar
        </Link>
        <Link 
          href={`/groups/${id}/goals`}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
        >
          Hedefler
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Üyeler Özeti (1. Kart) */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Grup Üyeleri</h2>
            <Link 
              href={`/groups/${id}/members`}
              className="text-sm text-cyan-500 hover:underline"
            >
              Tümünü Gör
            </Link>
          </div>
          
          <div className="space-y-3">
            {members.slice(0, 3).map(member => (
              <div key={member.user_id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                    {member.profiles.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div>{member.profiles.full_name}</div>
                    <div className="text-xs text-gray-500">@{member.profiles.username}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${member.role === 'leader' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                  {member.role === 'leader' ? 'Lider' : 'Üye'}
                </span>
              </div>
            ))}
            
            {members.length > 3 && (
              <div className="text-center mt-3">
                <Link 
                  href={`/groups/${id}/members`}
                  className="text-sm text-cyan-500 hover:underline"
                >
                  +{members.length - 3} daha görüntüle
                </Link>
              </div>
            )}
            
            {members.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400">Henüz üye bulunmuyor.</p>
            )}
          </div>
        </div>
        
        {/* Aktivite Özeti (2. Kart) */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Son Aktiviteler</h2>
          </div>
          
          <div className="space-y-3">
            {activity.slice(0, 3).map(act => (
              <div key={act.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">
                      {act.profiles?.full_name || act.profiles?.username || act.user_id}
                    </span> {renderActivityAction(act)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(act.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>
            ))}
            
            {activity.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400">Henüz aktivite yok.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Notlar ve Hedefler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Notlar Özeti */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Son Notlar</h2>
            <Link 
              href={`/groups/${id}/notes`}
              className="text-sm text-cyan-500 hover:underline"
            >
              Tümünü Gör
            </Link>
          </div>
          
          <div className="space-y-3">
            {notes.slice(0, 2).map(note => (
              <Link key={note.id} href={`/notes/${note.id}`}>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <h3 className="text-lg font-semibold">{note.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                    {note.content}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(note.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </Link>
            ))}
            
            {notes.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-600 dark:text-gray-400 mb-3">Bu grupta henüz paylaşılan not yok.</p>
                <Link 
                  href={`/groups/${id}/notes`}
                  className="btn-primary text-sm flex items-center justify-center gap-2 px-4 py-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Not Paylaş</span>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Hedefler Özeti */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Açık Hedefler</h2>
            <Link 
              href={`/groups/${id}/goals`}
              className="text-sm text-cyan-500 hover:underline"
            >
              Tümünü Gör
            </Link>
          </div>
          
          <div className="space-y-3">
            {goals.filter(g => g.status !== 'completed').slice(0, 2).map(goal => (
              <div key={goal.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                <h3 className="text-lg font-semibold">{goal.title}</h3>
                <div className="flex justify-between text-sm mb-1 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {goal.status === 'in_progress' ? 'Devam Ediyor' : 'Başlanmadı'}
                  </span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                {goal.due_date && (
                  <div className="text-xs text-gray-500 mt-2">
                    Son Tarih: {new Date(goal.due_date).toLocaleDateString('tr-TR')}
                  </div>
                )}
              </div>
            ))}
            
            {goals.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-600 dark:text-gray-400 mb-3">Bu grupta henüz hedef oluşturulmamış.</p>
                <Link 
                  href={`/groups/${id}/goals`}
                  className="btn-primary text-sm flex items-center justify-center gap-2 px-4 py-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Hedef Oluştur</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Not ve Hedef Ekleme Butonları */}
      {isMember && (
        <div className="flex flex-wrap gap-3 mt-4 mb-8">
          {/* Not ekleme butonu - sadece lider ve admin görebilir */}
          {myRole && (myRole === 'leader' || myRole === 'admin') && (
            <button
              onClick={() => setShowAddNoteModal(true)}
              className="flex items-center gap-2 btn-secondary"
            >
              <FaPlus size={14} /> Not Paylaş
            </button>
          )}
          
          {/* Hedef ekleme butonu - sadece lider ve admin görebilir */}
          {myRole && (myRole === 'leader' || myRole === 'admin') && (
            <button
              onClick={() => setShowAddGoalModal(true)}
              className="flex items-center gap-2 btn-primary"
            >
              <FaPlus size={14} /> Hedef Ekle
            </button>
          )}
          
          {/* Üye davet et butonu - sadece lider görebilir */}
          {myRole === 'leader' && (
            <button
              onClick={() => router.push(`/groups/${id}/members`)}
              className="flex items-center gap-2 btn-outline"
            >
              <FaUserPlus size={14} /> Üye Davet Et
            </button>
          )}
        </div>
      )}

      {/* Grup Silme Onay Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Grubu Sil</h2>
            <p className="mb-6">Bu grubu silmek istediğinizden emin misiniz? Tüm grup verileri, üyelikler ve paylaşılan notlar silinecektir. Bu işlem geri alınamaz.</p>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                disabled={isDeleting}
              >
                İptal
              </button>
              <button 
                onClick={handleDeleteGroup}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Siliniyor...' : 'Grubu Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}