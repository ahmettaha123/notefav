'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../lib/supabase';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaCheck, FaTasks, FaLock, FaLockOpen, FaHourglassHalf, FaClock, FaChevronRight } from 'react-icons/fa';

// Durum renklerini ve ikonlarını belirle
const statusConfig = {
  planned: {
    icon: FaClock,
    color: 'gray',
    text: 'Planlandı'
  },
  in_progress: {
    icon: FaHourglassHalf,
    color: 'blue',
    text: 'Devam Ediyor'
  },
  completed: {
    icon: FaCheck,
    color: 'green',
    text: 'Tamamlandı'
  },
  canceled: {
    icon: FaTrash,
    color: 'red',
    text: 'İptal Edildi'
  }
};

// Öncelik renkleri
const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  low: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
};

// Öncelik metinleri
const priorityTexts = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
};

// Tarih formatlama fonksiyonu
function formatDate(date) {
  if (!date) return '';
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Öncelik rengi al
function getPriorityColor(priority) {
  return priorityColors[priority] || priorityColors.medium;
}

// Öncelik metni al
function getPriorityText(priority) {
  return priorityTexts[priority] || priorityTexts.medium;
}

export default function GroupGoals() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  
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
        
        setUserRole(memberData.role);
        
        // Grup hedeflerini çek
        const { data: goalsData, error: goalsError } = await supabase
          .from('group_goals')
          .select(`
            *,
            profiles:creator_id(id, full_name, username, avatar_url)
          `)
          .eq('group_id', id)
          .order('created_at', { ascending: false });
          
        if (goalsError) {
          console.error("Hedefler çekilemedi:", goalsError);
          throw new Error("Hedefler yüklenemedi");
        }
        
        setGoals(goalsData || []);
        
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGroupAndGoals();
  }, [id, user, router]);
  
  // Hedef durumuna göre renk ve ikon belirle
  function getStatusDisplay(status) {
    const config = statusConfig[status] || statusConfig.not_started;
    const StatusIcon = config.icon;
    
    return (
      <div className={`flex items-center gap-1 text-${config.color}-500`}>
        <StatusIcon className="inline" />
        <span>{config.text}</span>
      </div>
    );
  }
  
  // Yeni hedef oluşturma sayfasına yönlendir
  const handleCreateGoal = () => {
    router.push(`/groups/${id}/goals/new`);
  };
  
  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Bu hedefi silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('group_goals')
        .delete()
        .eq('id', goalId);
        
      if (error) throw error;
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'delete_goal',
        entity_type: 'goal',
        entity_id: goalId,
        details: { action: 'delete_goal' },
        created_at: new Date().toISOString()
      });
      
      setGoals(goals.filter(goal => goal.id !== goalId));
      alert('Hedef başarıyla silindi.');
      
    } catch (error) {
      console.error('Hedef silinirken hata:', error);
      alert(`Hedef silinemedi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateProgress = async (goal, newProgress) => {
    try {
      setLoading(true);
      
      // Yeni durumu belirle
      let newStatus = goal.status;
      if (newProgress === 0) {
        newStatus = 'planned';
      } else if (newProgress === 100) {
        newStatus = 'completed';
      } else if (newProgress > 0) {
        newStatus = 'in_progress';
      }
      
      const { error } = await supabase
        .from('group_goals')
        .update({ 
          progress: newProgress,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', goal.id);
        
      if (error) throw error;
      
      // Grup aktivitesini kaydet
      await supabase.from('group_activity').insert({
        group_id: id,
        user_id: user.id,
        action: 'update_goal',
        entity_type: 'goal',
        entity_id: goal.id,
        details: { 
          goal_title: goal.title,
          previous_progress: goal.progress,
          new_progress: newProgress
        },
        created_at: new Date().toISOString()
      });
      
      // UI'ı güncelle
      setGoals(goals.map(g => 
        g.id === goal.id ? { 
          ...g, 
          progress: newProgress,
          status: newStatus
        } : g
      ));
      
    } catch (error) {
      console.error('İlerleme güncellenirken hata:', error);
      alert(`İlerleme güncellenemedi: ${error.message}`);
    } finally {
      setLoading(false);
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
            className="flex items-center gap-2 text-orange-500 hover:text-orange-700"
          >
            <FaArrowLeft className="text-sm" /> <span>Gruba Dön</span>
          </Link>
          
          <button 
            onClick={handleCreateGoal}
            className="btn-primary flex items-center justify-center gap-2 px-4 py-2"
          >
            <FaPlus className="inline" /> <span>Yeni Hedef</span>
          </button>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">{group.name} Hedefleri</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Bu gruptaki ortak hedefler</p>
        
        {/* Grup Navigasyonu */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
          <Link 
            href={`/groups/${id}`}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 whitespace-nowrap"
          >
            Ana Sayfa
          </Link>
          <Link 
            href={`/groups/${id}/posts`}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 whitespace-nowrap"
          >
            Gönderiler
          </Link>
          <Link 
            href={`/groups/${id}/goals`}
            className="px-4 py-2 rounded-lg bg-cyan-100 dark:bg-cyan-900 hover:bg-cyan-200 dark:hover:bg-cyan-800 font-medium whitespace-nowrap"
          >
            Hedefler
          </Link>
          <Link 
            href={`/groups/${id}/members`}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 whitespace-nowrap"
          >
            Üyeler
          </Link>
          <Link 
            href={`/groups/${id}/settings`}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 whitespace-nowrap"
          >
            Ayarlar
          </Link>
        </div>
        
        {/* Hedefler Listesi */}
        {goals.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium mb-2">Henüz hedef bulunmuyor</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Bu gruba henüz hedef eklenmemiş.
            </p>
            
            {(userRole === 'admin' || userRole === 'creator') && (
              <Link 
                href={`/groups/${id}/goals/new`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FaPlus /> İlk Hedefi Oluştur
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <Link
                key={goal.id}
                href={`/groups/${id}/goals/${goal.id}`}
                className="block"
              >
                <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{goal.title}</h3>
                      
                      {goal.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {goal.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {getStatusDisplay(goal.status)}
                        
                        {goal.due_date && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Hedef Tarihi:</span> {formatDate(goal.due_date)}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Oluşturan:</span> {goal.profiles?.full_name || 'Bilinmeyen Kullanıcı'}
                        </div>
                        
                        {goal.priority && (
                          <div className="flex items-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(goal.priority)}`}>
                              {getPriorityText(goal.priority)}
                            </span>
                          </div>
                        )}
                        
                        {goal.tags && goal.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {goal.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                #{tag}
                              </span>
                            ))}
                            {goal.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{goal.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* İlerleme Göstergesi */}
                      <div className="hidden md:flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-cyan-500 h-2 rounded-full" 
                            style={{ width: `${goal.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{goal.progress || 0}%</span>
                      </div>
                      
                      <FaChevronRight className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 