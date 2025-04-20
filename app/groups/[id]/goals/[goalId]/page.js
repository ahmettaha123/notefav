'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../../../lib/supabase';
import { FaArrowLeft, FaEdit, FaTrash, FaCheck, FaHourglassHalf, FaClock, FaUser } from 'react-icons/fa';

export default function GoalDetail() {
  const { id, goalId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [goal, setGoal] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  
  // Durum renklerini ve ikonlarını belirle
  const statusConfig = {
    planned: {
      icon: FaClock,
      color: 'gray',
      text: 'Planlandı'
    },
    in_progress: {
      icon: FaHourglassHalf,
      color: 'orange',
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
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchData() {
      setLoading(true);
      setError('');
      
      try {
        // Önce grup verisini çek
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
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .single();
        
        if (memberError && memberError.code !== 'PGRST116') {
          console.error("Üyelik kontrolü yapılamadı:", memberError);
          throw new Error("Üyelik bilgileri yüklenemedi");
        }
        
        if (!memberData) {
          // Kullanıcı bu grupta üye değil, gruplar sayfasına yönlendir
          router.push('/groups');
          return;
        }
        
        setUserRole(memberData.role);
        
        // Hedef bilgilerini çek
        const { data: goalData, error: goalError } = await supabase
          .from('group_goals')
          .select(`
            *,
            creator:profiles!group_goals_creator_id_fkey(id, username, full_name, avatar_url)
          `)
          .eq('id', goalId)
          .single();
          
        if (goalError) {
          console.error("Hedef bilgileri çekilemedi:", goalError);
          throw new Error("Hedef bulunamadı");
        }
        
        // Subtasks alanını parse et
        if (goalData.subtasks && typeof goalData.subtasks === 'string') {
          try {
            goalData.subtasks = JSON.parse(goalData.subtasks);
          } catch (e) {
            console.error("Subtasks parse edilirken hata:", e);
            goalData.subtasks = [];
          }
        }
        
        if (!goalData.subtasks) {
          goalData.subtasks = [];
        }
        
        setGoal(goalData);
        
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id, goalId, user, router]);
  
  // Hedef silme işlemi
  const handleDeleteGoal = async () => {
    if (!confirm('Bu hedefi silmek istediğinize emin misiniz?')) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('group_goals')
        .delete()
        .eq('id', goalId);
        
      if (error) throw error;
      
      // Başarı mesajı göster
      alert('Hedef başarıyla silindi.');
      
      // Hedefler sayfasına yönlendir
      router.push(`/groups/${id}/goals`);
      
    } catch (error) {
      console.error('Hedef silinirken hata:', error);
      alert(`Hedef silinemedi: ${error.message}`);
      setLoading(false);
    }
  };
  
  // İlerleme güncelleme işlemi
  const handleUpdateProgress = async (newProgress) => {
    try {
      setLoading(true);
      
      // Yeni durumu belirle
      let newStatus = goal.status;
      if (newProgress === 0) {
        newStatus = 'planned';
      } else if (newProgress === 100) {
        newStatus = 'completed';
      } else {
        newStatus = 'in_progress';
      }
      
      const { error } = await supabase
        .from('group_goals')
        .update({
          progress: newProgress,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);
        
      if (error) throw error;
      
      // Hedefi güncelle
      setGoal({
        ...goal,
        progress: newProgress,
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      setLoading(false);
      
    } catch (error) {
      console.error('İlerleme güncellenirken hata:', error);
      alert(`İlerleme güncellenemedi: ${error.message}`);
      setLoading(false);
    }
  };
  
  // Alt görev tamamlama durumunu değiştir
  const handleToggleSubtask = async (index) => {
    try {
      setLoading(true);
      
      // Alt görevleri kopyala ve seçilen görevin durumunu değiştir
      const updatedSubtasks = [...goal.subtasks];
      updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
      
      // Tamamlanmış alt görev sayısını hesapla
      const completedCount = updatedSubtasks.filter(task => task.completed).length;
      const newProgress = Math.round((completedCount / updatedSubtasks.length) * 100);
      
      // Yeni durumu belirle
      let newStatus = goal.status;
      if (newProgress === 0) {
        newStatus = 'planned';
      } else if (newProgress === 100) {
        newStatus = 'completed';
      } else {
        newStatus = 'in_progress';
      }
      
      // Veritabanını güncelle
      const { error } = await supabase
        .from('group_goals')
        .update({
          subtasks: updatedSubtasks,
          progress: newProgress,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);
        
      if (error) throw error;
      
      // Hedefi güncelle
      setGoal({
        ...goal,
        subtasks: updatedSubtasks,
        progress: newProgress,
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Alt görev güncellenirken hata:', error);
      alert(`Alt görev güncellenemedi: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
  
  // Durum gösterimini hazırla
  function getStatusDisplay() {
    if (!goal) return null;
    
    const config = statusConfig[goal.status] || statusConfig.planned;
    const StatusIcon = config.icon;
    
    return (
      <div className={`flex items-center gap-2 text-${config.color}-600`}>
        <StatusIcon size={20} />
        <span className="font-medium">{config.text}</span>
      </div>
    );
  }
  
  if (authLoading || loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link href={`/groups/${id}/goals`} className="btn-primary">
            Hedefler Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }
  
  if (!goal || !group) return null;
  
  // Kullanıcının hedefi düzenleme yetkisi var mı?
  const canEditGoal = user.id === goal.creator_id || userRole === 'admin' || userRole === 'creator' || userRole === 'leader';
  
  // Öncelik renkleri
  const priorityClasses = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    low: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
  };
  
  // Öncelik metinleri
  const priorityTexts = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    urgent: 'Acil'
  };
  
  // Öncelik rengi al
  function getPriorityColor(priority) {
    return priorityClasses[priority] || priorityClasses.medium;
  }
  
  // Öncelik metni al
  function getPriorityText(priority) {
    return priorityTexts[priority] || priorityTexts.medium;
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Link 
          href={`/groups/${id}/goals`}
          className="flex items-center gap-2 text-orange-500 hover:text-orange-700"
        >
          <FaArrowLeft className="text-sm" /> Hedeflere Dön
        </Link>
      </div>
      <div className="card">
        {/* Üst Kısım - Geri butonu ve İşlemler */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href={`/groups/${id}/goals`}
            className="flex items-center gap-2 text-orange-500 hover:text-orange-700"
          >
            <FaArrowLeft className="inline" /> <span>Hedefler Sayfasına Dön</span>
          </Link>
          
          {canEditGoal && (
            <div className="flex gap-3">
              <Link
                href={`/groups/${id}/goals/${goalId}/edit`}
                className="btn-secondary flex items-center gap-2"
              >
                <FaEdit className="inline" /> <span>Düzenle</span>
              </Link>
              
              <button
                onClick={handleDeleteGoal}
                className="btn-danger flex items-center gap-2"
                disabled={loading}
              >
                <FaTrash className="inline" /> <span>Sil</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Hedef Başlığı ve Durum */}
        <div className="border-b pb-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">{goal.title}</h1>
            {getStatusDisplay()}
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Oluşturan:</span> {goal.creator?.full_name || goal.creator?.username || 'Bilinmeyen Kullanıcı'}
            </div>
            
            {goal.due_date && (
              <div>
                <span className="font-medium">Hedef Tarihi:</span> {formatDate(goal.due_date)}
              </div>
            )}
            
            <div>
              <span className="font-medium">Oluşturulma:</span> {formatDate(goal.created_at)}
            </div>
            
            {goal.created_at !== goal.updated_at && (
              <div>
                <span className="font-medium">Son Güncelleme:</span> {formatDate(goal.updated_at)}
              </div>
            )}
            
            {goal.priority && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Öncelik:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(goal.priority)}`}>
                  {getPriorityText(goal.priority)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Hedef İçeriği */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Hedef Açıklaması</h2>
          
          {goal.description ? (
            <div className="prose dark:prose-invert max-w-none">
              <p>{goal.description}</p>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Bu hedef için açıklama eklenmemiş.</p>
          )}
        </div>
        
        {/* Etiketler varsa göster */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Etiketler</h2>
            <div className="flex flex-wrap gap-2">
              {goal.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* İlerleme Bölümü */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">İlerleme Durumu</h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{goal.progress}% Tamamlandı</span>
              
              {goal.due_date && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(goal.due_date) < new Date() && goal.status !== 'completed' ? 
                    'Hedef tarihi geçti' : 
                    `Kalan: ${Math.ceil((new Date(goal.due_date) - new Date()) / (1000 * 60 * 60 * 24))} gün`
                  }
                </span>
              )}
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
              <div 
                className={`${
                  goal.status === 'completed' ? 'bg-green-600' : 'bg-orange-600'
                } h-3 rounded-full transition-all duration-500`}
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* İlerleme Güncelleme Butonları */}
          {canEditGoal && goal.status !== 'completed' && (
            <div>
              <h3 className="text-lg font-medium mb-2">İlerlemeyi Güncelle</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleUpdateProgress(0)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  0%
                </button>
                <button 
                  onClick={() => handleUpdateProgress(25)}
                  className="px-4 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-800/50 text-orange-800 dark:text-orange-200 rounded-md transition-colors"
                >
                  25%
                </button>
                <button 
                  onClick={() => handleUpdateProgress(50)}
                  className="px-4 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-800/50 text-orange-800 dark:text-orange-200 rounded-md transition-colors"
                >
                  50%
                </button>
                <button 
                  onClick={() => handleUpdateProgress(75)}
                  className="px-4 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-800/50 text-orange-800 dark:text-orange-200 rounded-md transition-colors"
                >
                  75%
                </button>
                <button 
                  onClick={() => handleUpdateProgress(100)}
                  className="px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-800 dark:text-green-200 rounded-md transition-colors"
                >
                  100% (Tamamlandı)
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Alt Görevler */}
        {goal.subtasks && goal.subtasks.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Alt Görevler</h2>
              <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 text-xs font-medium rounded-full px-2.5 py-1">
                {goal.subtasks.filter(task => task.completed).length}/{goal.subtasks.length} tamamlandı
              </span>
            </div>
            
            <div className="space-y-2 border rounded-md p-3">
              {goal.subtasks.map((task, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 border-b last:border-b-0"
                >
                  <div 
                    className={`flex-shrink-0 mt-1 w-5 h-5 rounded flex items-center justify-center ${
                      task.completed 
                        ? 'bg-green-500 text-white' 
                        : 'border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {task.completed && <FaCheck size={12} />}
                  </div>
                  
                  <div className="flex-grow">
                    <div className={`${task.completed ? 'line-through text-gray-500' : 'font-medium'}`}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {task.description}
                      </div>
                    )}
                  </div>
                  
                  {canEditGoal && (
                    <button 
                      onClick={() => handleToggleSubtask(index)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        task.completed 
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200' 
                          : 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-200'
                      }`}
                    >
                      {task.completed ? 'Geri Al' : 'Tamamla'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 