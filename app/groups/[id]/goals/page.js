'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaCheck, FaTasks, FaLock, FaLockOpen } from 'react-icons/fa';

export default function GroupGoals() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myRole, setMyRole] = useState(null);
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchGroupAndGoals() {
      setLoading(true);
      setError('');
      
      try {
        // Grup bilgilerini çek
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
        
        // Kullanıcının grup üyesi olup olmadığını kontrol et
        const { data: memberData, error: memberCheckError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
        
        if (memberCheckError && memberCheckError.code !== 'PGRST116') {
          console.error("Üyelik kontrolü yapılamadı:", memberCheckError);
          throw new Error("Üyelik bilgileri yüklenemedi");
        }
        
        if (!memberData) {
          // Kullanıcı bu grupta üye değil, gruplar sayfasına yönlendir
          router.push('/groups');
          return;
        }
        
        setMyRole(memberData.role);
        
        // Grup hedeflerini çek
        const { data: goalsData, error: goalsError } = await supabase
          .from('group_goals')
          .select(`
            id,
            title,
            description,
            status,
            progress,
            is_public,
            target_date,
            created_at,
            updated_at,
            created_by,
            profiles (
              username,
              full_name
            )
          `)
          .eq('group_id', id)
          .order('created_at', { ascending: false });
          
        if (goalsError) {
          console.error("Grup hedefleri çekilemedi:", goalsError);
          throw new Error("Hedefler yüklenemedi");
        }
        
        setGoals(goalsData || []);
        
      } catch (error) {
        console.error('Grup hedefleri yüklenirken hata:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGroupAndGoals();
  }, [id, user, router]);
  
  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Bu hedefi silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('group_goals')
        .delete()
        .eq('id', goalId);
        
      if (error) throw error;
      
      setGoals(goals.filter(goal => goal.id !== goalId));
      alert('Hedef silindi.');
      
    } catch (error) {
      console.error('Hedef silinirken hata:', error);
      alert(`Hedef silinemedi: ${error.message}`);
    }
  };
  
  const handleTogglePublic = async (goal) => {
    try {
      const { error } = await supabase
        .from('group_goals')
        .update({ is_public: !goal.is_public })
        .eq('id', goal.id);
        
      if (error) throw error;
      
      setGoals(goals.map(g => 
        g.id === goal.id ? { ...g, is_public: !g.is_public } : g
      ));
      
    } catch (error) {
      console.error('Görünürlük değiştirilirken hata:', error);
      alert(`Görünürlük değiştirilemedi: ${error.message}`);
    }
  };
  
  const handleUpdateProgress = async (goal, newProgress) => {
    try {
      const { error } = await supabase
        .from('group_goals')
        .update({ progress: newProgress })
        .eq('id', goal.id);
        
      if (error) throw error;
      
      setGoals(goals.map(g => 
        g.id === goal.id ? { ...g, progress: newProgress } : g
      ));
      
      // İlerleme %100 ise durumu 'completed' olarak güncelle
      if (newProgress === 100) {
        await supabase
          .from('group_goals')
          .update({ status: 'completed' })
          .eq('id', goal.id);
          
        setGoals(goals.map(g => 
          g.id === goal.id ? { ...g, status: 'completed' } : g
        ));
      }
      
    } catch (error) {
      console.error('İlerleme güncellenirken hata:', error);
      alert(`İlerleme güncellenemedi: ${error.message}`);
    }
  };
  
  if (authLoading || loading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link 
            href={`/groups/${id}`}
            className="btn-primary"
          >
            Grup Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }
  
  if (!group) return null;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={`/groups/${id}`}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
          >
            <FaArrowLeft /> <span>Gruba Geri Dön</span>
          </Link>
          
          <Link 
            href={`/groups/${id}/goals/new`}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> <span>Yeni Hedef Oluştur</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">{group.name} Hedefleri</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Bu gruptaki ortak hedefler</p>
        
        {/* Hedefler Listesi */}
        <div className="space-y-6">
          {goals.length === 0 ? (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              Bu grupta henüz hedef oluşturulmamıştır.
            </p>
          ) : (
            goals.map(goal => (
              <div key={goal.id} className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold">{goal.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="mr-3">Oluşturan: {goal.profiles?.full_name || goal.profiles?.username || 'Bilinmiyor'}</span>
                      <span>Hedef Tarihi: {new Date(goal.target_date).toLocaleDateString('tr-TR')}</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Yalnızca hedefi oluşturan veya grup lideri hedefi silebilir ve düzenleyebilir */}
                    {(goal.created_by === user.id || myRole === 'leader') && (
                      <>
                        <button
                          onClick={() => handleTogglePublic(goal)}
                          className={`text-sm px-2 py-1 rounded-md ${goal.is_public ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                          title={goal.is_public ? 'Herkese Açık' : 'Sadece Grup Üyeleri'}
                        >
                          {goal.is_public ? <FaLockOpen /> : <FaLock />}
                        </button>
                        
                        <Link 
                          href={`/groups/${id}/goals/${goal.id}/edit`}
                          className="text-blue-500 hover:text-blue-700"
                          title="Düzenle"
                        >
                          <FaEdit />
                        </Link>
                        
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Sil"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {goal.description}
                </p>
                
                {/* İlerleme Çubuğu */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        goal.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {goal.status === 'completed' ? 'Tamamlandı' : 
                         goal.status === 'in_progress' ? 'Devam Ediyor' : 
                         'Başlanmadı'}
                      </span>
                    </div>
                    <span>{goal.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* İlerleme Güncelleme Butonları */}
                {(goal.created_by === user.id || myRole === 'leader') && (
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => handleUpdateProgress(goal, 0)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-md"
                    >
                      0%
                    </button>
                    <button 
                      onClick={() => handleUpdateProgress(goal, 25)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                    >
                      25%
                    </button>
                    <button 
                      onClick={() => handleUpdateProgress(goal, 50)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                    >
                      50%
                    </button>
                    <button 
                      onClick={() => handleUpdateProgress(goal, 75)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                    >
                      75%
                    </button>
                    <button 
                      onClick={() => handleUpdateProgress(goal, 100)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md"
                    >
                      100%
                    </button>
                  </div>
                )}
                
                {/* Alt Görevler */}
                <Link 
                  href={`/groups/${id}/goals/${goal.id}/tasks`}
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 mt-4"
                >
                  <FaTasks /> <span>Alt Görevleri Yönet</span>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 