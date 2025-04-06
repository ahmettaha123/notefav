'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import supabase from '../../../lib/supabase';

export default function GoalPage({ params }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    const fetchGoal = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        // Kullanıcının kendi hedefi mi kontrol et
        if (data.user_id !== user.id) {
          router.push('/goals');
          return;
        }
        
        setGoal(data);
        
        // Subtasks alanı JSON formatında gelirse parse edelim
        try {
          if (data.subtasks) {
            if (typeof data.subtasks === 'string') {
              setSubtasks(JSON.parse(data.subtasks));
            } else {
              setSubtasks(data.subtasks || []);
            }
          } else {
            setSubtasks([]);
          }
        } catch (jsonError) {
          console.error('Subtasks JSON parse error:', jsonError);
          setSubtasks([]);
        }
      } catch (error) {
        console.error('Hedef çekilirken hata:', error);
        setError('Hedef bulunamadı veya erişim izniniz yok.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGoal();
  }, [id, user, router]);

  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const handleToggleSubtask = async (taskId) => {
    try {
      setUpdatingProgress(true);
      
      // Yerel olarak güncelle
      const updatedSubtasks = subtasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      
      setSubtasks(updatedSubtasks);
      
      // Yeni ilerleme hesapla
      const newProgress = calculateProgress(updatedSubtasks);
      
      // Veritabanında güncelle - JSON olarak kaydedelim
      const { error } = await supabase
        .from('goals')
        .update({ 
          subtasks: JSON.stringify(updatedSubtasks),
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Yerel durum güncelleme
      setGoal({
        ...goal,
        subtasks: updatedSubtasks,
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : 'in_progress',
        updated_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Alt görev güncellenirken hata:', error);
      // Hata durumunda orijinal subtasks'a geri dön
      setSubtasks(goal.subtasks || []);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      router.push('/goals');
    } catch (error) {
      console.error('Hedef silinirken hata:', error);
      setError(`Hedef silinemedi: ${error.message}`);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusColor = (progress) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-cyan-500';
    return 'bg-yellow-500';
  };
  
  const getStatusText = (progress) => {
    if (progress === 100) return 'Tamamlandı';
    if (progress >= 50) return 'İyi gidiyor';
    return 'Devam ediyor';
  };
  
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
        <Link href="/goals" className="btn-primary">
          Geri Dön
        </Link>
      </div>
    );
  }

  if (!goal) return null;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link href="/goals" className="text-cyan-500 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tüm Hedefler
        </Link>
        
        <div className="flex gap-2">
          <Link 
            href={`/goals/edit/${id}`}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Düzenle
          </Link>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sil
          </button>
        </div>
      </div>
      
      <div className="card mb-6">
        <h1 className="text-3xl font-bold mb-2">{goal.title}</h1>
        
        <div className="bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md inline-flex items-center mb-4">
          <span className={`w-3 h-3 rounded-full ${getStatusColor(goal.progress || 0)} mr-2`}></span>
          <span className="font-medium">{getStatusText(goal.progress || 0)}</span>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>İlerleme</span>
            <span>%{goal.progress || 0}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`${getStatusColor(goal.progress || 0)} h-full transition-all`} 
              style={{ width: `${goal.progress || 0}%` }}
            ></div>
          </div>
        </div>
        
        {goal.description && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Açıklama</h2>
            <p className="text-gray-700 dark:text-gray-300">{goal.description}</p>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Alt Görevler</h2>
          {subtasks.length > 0 ? (
            <div className="space-y-3">
              {subtasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  <input 
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleSubtask(task.id)}
                    disabled={updatingProgress}
                    className="h-5 w-5 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className={`ml-2 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Bu hedef için alt görev eklenmemiş.</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Hedef Tarihi: {new Date(goal.target_date).toLocaleDateString('tr-TR')}</p>
          <p>Oluşturma: {new Date(goal.created_at).toLocaleDateString('tr-TR')}</p>
          <p>Son Güncelleme: {new Date(goal.updated_at).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>
      
      {/* Motivasyon Kartı */}
      <div className="card bg-gradient-to-br from-cyan-50 to-green-50 dark:from-cyan-900/20 dark:to-green-900/20">
        <h2 className="text-xl font-semibold mb-4">Motivasyon</h2>
        <p className="mb-4">
          {goal.progress === 100 ? (
            "Tebrikler! Bu hedefi başarıyla tamamladınız. Başarınızı kutlamak için kendinize bir ödül vermeyi unutmayın."
          ) : goal.progress >= 50 ? (
            "Yarıyı geçtiniz! Harika ilerliyorsunuz. Bu hızla devam ederseniz, hedefinize zamanında ulaşacaksınız."
          ) : (
            "Her büyük başarı, küçük adımlarla başlar. Her tamamladığınız görev sizi hedefinize bir adım daha yaklaştırıyor."
          )}
        </p>
        <div className="flex justify-end">
          <div className="inline-flex items-center text-cyan-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="font-medium">Hedeflerinizi gerçekleştirmeye devam edin!</span>
          </div>
        </div>
      </div>
      
      {/* Silme Onay Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Hedefi Sil</h2>
            <p className="mb-6">Bu hedefi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                disabled={isDeleting}
              >
                İptal
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
